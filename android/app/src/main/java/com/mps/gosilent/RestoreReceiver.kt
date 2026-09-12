package com.mps.gosilent

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

/**
 * Restores the ringer when the service cannot. Handles three cases the old
 * in-memory-only design could not survive:
 *
 *  - the deadline alarm fires after the process was killed
 *  - the phone rebooted mid-session
 *  - the app was updated, which kills the process
 */
class RestoreReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        when (intent?.action) {
            SilenceRestore.ACTION_RESTORE -> restoreNow(context)

            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED -> resumeOrRestore(context)
        }
    }

    private fun restoreNow(context: Context) {
        if (!SilenceRestore.restoreFromDisk(context)) return

        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.cancel(SilenceTimerService.NOTIF_ID)
        context.stopService(Intent(context, SilenceTimerService::class.java))

        context.sendBroadcast(
            Intent(SilenceTimerService.ACTION_FINISHED).apply {
                setPackage(context.packageName)
                putExtra(SilenceTimerService.EXTRA_REMAINING, 0L)
            }
        )
    }

    private fun resumeOrRestore(context: Context) {
        val session = SilenceRestore.load(context) ?: return

        if (System.currentTimeMillis() >= session.endAtMs) {
            // The deadline passed while we were down - undo it immediately.
            restoreNow(context)
            return
        }

        // Time left: bring the timer back rather than leaving the phone silent
        // with nothing counting down.
        val resume = Intent(context, SilenceTimerService::class.java).apply {
            action = SilenceTimerService.ACTION_RESUME
        }
        ContextCompat.startForegroundService(context, resume)
    }
}
