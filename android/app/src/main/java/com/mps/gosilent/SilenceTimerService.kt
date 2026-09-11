package com.mps.gosilent

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.media.AudioManager
import android.os.Build
import android.os.CountDownTimer
import android.os.IBinder
import androidx.core.app.NotificationCompat

class SilenceTimerService : Service() {

    companion object {
        const val ACTION_START = "com.mps.gosilent.ACTION_START"
        const val ACTION_CANCEL = "com.mps.gosilent.ACTION_CANCEL"
        const val ACTION_TICK = "com.mps.gosilent.ACTION_TICK"
        const val ACTION_FINISHED = "com.mps.gosilent.ACTION_FINISHED"
        const val ACTION_CANCELLED = "com.mps.gosilent.ACTION_CANCELLED"

        const val EXTRA_DURATION_MS = "duration_ms"
        const val EXTRA_REMAINING = "remaining"
        const val EXTRA_TOTAL = "total"
        const val EXTRA_MODE = "mode"

        const val CHANNEL_ID = "go_silent_timer_channel"
        const val NOTIF_ID = 9001
    }

    private var countDown: CountDownTimer? = null
    private var totalSeconds: Long = 0
    private var totalDurationMs: Long = 0
    private var endTimeMs: Long = 0
    private var mode: String = "silent"
    private var modeApplied = false

    // Saved volumes so "Silent" mode can be undone exactly, without ever
    // touching Android's Do Not Disturb / interruption-filter engine.
    private var savedRingVolume = -1
    private var savedNotificationVolume = -1
    private var savedSystemVolume = -1

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val durationMs = intent.getLongExtra(EXTRA_DURATION_MS, 0L)
                mode = intent.getStringExtra(EXTRA_MODE) ?: "silent"
                if (durationMs <= 0L) {
                    stopSelf()
                    return START_NOT_STICKY
                }
                totalSeconds = durationMs / 1000L
                totalDurationMs = durationMs
                endTimeMs = System.currentTimeMillis() + durationMs
                startForeground(NOTIF_ID, buildNotification(totalSeconds))
                applyMode()
                startCountdown(durationMs)
            }
            ACTION_CANCEL -> {
                countDown?.cancel()
                restoreRingingMode()
                broadcast(ACTION_CANCELLED, 0L)
                stopForegroundCompat()
                stopSelf()
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        countDown?.cancel()
        if (modeApplied) {
            restoreRingingMode()
        }
    }

    private fun startCountdown(durationMs: Long) {
        countDown?.cancel()
        countDown = object : CountDownTimer(durationMs, 1000L) {
            override fun onTick(msUntilFinished: Long) {
                val remaining = (msUntilFinished / 1000L).coerceAtLeast(0L)
                updateNotification(remaining)
                broadcast(ACTION_TICK, remaining)
            }

            override fun onFinish() {
                restoreRingingMode()
                broadcast(ACTION_FINISHED, 0L)
                stopForegroundCompat()
                stopSelf()
            }
        }.start()
    }

    private fun applyMode() {
        val audioManager = getSystemService(AUDIO_SERVICE) as AudioManager
        when (mode) {
            "silent" -> {
                try {
                    savedRingVolume = audioManager.getStreamVolume(AudioManager.STREAM_RING)
                    savedNotificationVolume = audioManager.getStreamVolume(AudioManager.STREAM_NOTIFICATION)
                    savedSystemVolume = audioManager.getStreamVolume(AudioManager.STREAM_SYSTEM)

                    audioManager.setStreamVolume(AudioManager.STREAM_RING, 0, 0)
                    audioManager.setStreamVolume(AudioManager.STREAM_NOTIFICATION, 0, 0)
                    audioManager.setStreamVolume(AudioManager.STREAM_SYSTEM, 0, 0)
                    modeApplied = true
                } catch (_: SecurityException) {
                    // Some OEMs still gate STREAM_NOTIFICATION behind DND access.
                }
            }
            "dnd" -> {
                val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
                if (nm.isNotificationPolicyAccessGranted) {
                    nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY)
                    modeApplied = true
                }
            }
        }
    }

    private fun restoreRingingMode() {
        if (!modeApplied) return
        val audioManager = getSystemService(AUDIO_SERVICE) as AudioManager
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager

        when (mode) {
            "silent" -> {
                try {
                    if (savedRingVolume >= 0) {
                        audioManager.setStreamVolume(AudioManager.STREAM_RING, savedRingVolume, 0)
                    }
                    if (savedNotificationVolume >= 0) {
                        audioManager.setStreamVolume(AudioManager.STREAM_NOTIFICATION, savedNotificationVolume, 0)
                    }
                    if (savedSystemVolume >= 0) {
                        audioManager.setStreamVolume(AudioManager.STREAM_SYSTEM, savedSystemVolume, 0)
                    }
                } catch (_: SecurityException) { }
            }
            "dnd" -> {
                if (nm.isNotificationPolicyAccessGranted) {
                    nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
                }
            }
        }
        modeApplied = false
    }

    private fun broadcast(action: String, remaining: Long) {
        val i = Intent(action).apply {
            setPackage(packageName)
            putExtra(EXTRA_REMAINING, remaining)
            putExtra(EXTRA_TOTAL, totalSeconds)
            putExtra(EXTRA_MODE, mode)
        }
        sendBroadcast(i)
    }

    private fun stopForegroundCompat() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Go Silent Timer",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows the active Go Silent timer."
                setShowBadge(false)
            }
            nm.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(remainingSeconds: Long): Notification {
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val piFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val openPi = PendingIntent.getActivity(this, 0, openIntent, piFlags)

        val cancelIntent = Intent(this, SilenceTimerService::class.java).apply {
            action = ACTION_CANCEL
        }
        val cancelPi = PendingIntent.getService(this, 1, cancelIntent, piFlags)

        val modeLabel = if (mode == "silent") "Silent" else "Do Not Disturb"
        val timeText = formatTime(remainingSeconds)

        val totalSecs = (totalDurationMs / 1000L).coerceAtLeast(1L).toInt()
        val elapsedSecs = (totalSecs - remainingSeconds.toInt()).coerceAtLeast(0)

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notif_bell)
            .setContentTitle("Go Silent · $modeLabel")
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setContentIntent(openPi)
            .addAction(0, "Stop", cancelPi)
            .setProgress(totalSecs, elapsedSecs, false)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .setColor(0xFFFBBF24.toInt())
            .setColorized(true)

        builder.setContentText("$timeText remaining")

        return builder.build()
    }

    private fun updateNotification(remainingSeconds: Long) {
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIF_ID, buildNotification(remainingSeconds))
    }

    private fun formatTime(seconds: Long): String {
        val h = seconds / 3600
        val m = (seconds % 3600) / 60
        val s = seconds % 60
        return if (h > 0) "%02d:%02d:%02d".format(h, m, s)
        else "%02d:%02d".format(m, s)
    }
}