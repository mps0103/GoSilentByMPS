package com.mps.gosilent

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.media.AudioManager
import android.os.Build

/**
 * Everything needed to undo a silence session when the service is no longer alive.
 *
 * The service's in-memory state dies with the process, and an OEM power manager
 * killing the app overnight never calls onDestroy() - so the session is mirrored
 * to disk here and backed by an AlarmManager wakeup. Either the service finishes
 * normally, or the alarm fires and restores from these values.
 */
object SilenceRestore {

    const val ACTION_RESTORE = "com.mps.gosilent.ACTION_RESTORE"

    private const val PREFS = "go_silent_session"
    private const val KEY_ACTIVE = "active"
    private const val KEY_MODE = "mode"
    private const val KEY_END_AT = "end_at"
    private const val KEY_TOTAL = "total_ms"
    private const val KEY_RING = "saved_ring"
    private const val KEY_NOTIFICATION = "saved_notification"
    private const val KEY_SYSTEM = "saved_system"

    private const val ALARM_REQUEST_CODE = 7001

    data class Session(
        val mode: String,
        val endAtMs: Long,
        val totalMs: Long,
        val ring: Int,
        val notification: Int,
        val system: Int
    )

    private fun prefs(context: Context): SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun save(
        context: Context,
        mode: String,
        endAtMs: Long,
        totalMs: Long,
        ring: Int,
        notification: Int,
        system: Int
    ) {
        prefs(context).edit()
            .putBoolean(KEY_ACTIVE, true)
            .putString(KEY_MODE, mode)
            .putLong(KEY_END_AT, endAtMs)
            .putLong(KEY_TOTAL, totalMs)
            .putInt(KEY_RING, ring)
            .putInt(KEY_NOTIFICATION, notification)
            .putInt(KEY_SYSTEM, system)
            .commit()
    }

    fun load(context: Context): Session? {
        val p = prefs(context)
        if (!p.getBoolean(KEY_ACTIVE, false)) return null
        return Session(
            mode = p.getString(KEY_MODE, "silent") ?: "silent",
            endAtMs = p.getLong(KEY_END_AT, 0L),
            totalMs = p.getLong(KEY_TOTAL, 0L),
            ring = p.getInt(KEY_RING, -1),
            notification = p.getInt(KEY_NOTIFICATION, -1),
            system = p.getInt(KEY_SYSTEM, -1)
        )
    }

    /** Forgets the session and drops its alarm. */
    fun clear(context: Context) {
        prefs(context).edit().clear().commit()
        cancelAlarm(context)
    }

    /**
     * Undoes the session using the values on disk. Returns true if there was a
     * session to undo. Safe to call repeatedly - the second call is a no-op.
     */
    fun restoreFromDisk(context: Context): Boolean {
        val session = load(context) ?: return false
        applyRestore(context, session)
        clear(context)
        return true
    }

    fun applyRestore(context: Context, session: Session) {
        when (session.mode) {
            "dnd" -> {
                val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                if (nm.isNotificationPolicyAccessGranted) {
                    nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
                }
            }
            else -> {
                val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
                try {
                    if (session.ring >= 0) {
                        am.setStreamVolume(AudioManager.STREAM_RING, session.ring, 0)
                    }
                    if (session.notification >= 0) {
                        am.setStreamVolume(AudioManager.STREAM_NOTIFICATION, session.notification, 0)
                    }
                    if (session.system >= 0) {
                        am.setStreamVolume(AudioManager.STREAM_SYSTEM, session.system, 0)
                    }
                } catch (_: SecurityException) {
                    // Some OEMs gate STREAM_NOTIFICATION behind DND access.
                }
            }
        }
    }

    /**
     * Wakes the device at the deadline even if our process is gone. Falls back to
     * an inexact wakeup when the user has not granted exact-alarm access - a few
     * minutes late beats staying silent forever.
     */
    fun scheduleAlarm(context: Context, endAtMs: Long) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pi = alarmIntent(context)
        try {
            val canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms()
            if (canExact) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endAtMs, pi)
            } else {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endAtMs, pi)
            }
        } catch (_: SecurityException) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endAtMs, pi)
        }
    }

    fun cancelAlarm(context: Context) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        am.cancel(alarmIntent(context))
    }

    private fun alarmIntent(context: Context): PendingIntent {
        val intent = Intent(context.applicationContext, RestoreReceiver::class.java).apply {
            action = ACTION_RESTORE
        }
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        return PendingIntent.getBroadcast(context.applicationContext, ALARM_REQUEST_CODE, intent, flags)
    }
}
