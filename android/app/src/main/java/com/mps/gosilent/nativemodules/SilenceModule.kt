package com.mps.gosilent.nativemodules

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.mps.gosilent.MainActivity
import com.mps.gosilent.SilenceTimerService

/**
 * Bridges JavaScript to the native silence/DND timer.
 * JS calls startTimer/cancelTimer/getPermissionState/openDndSettings/requestNotificationPermission.
 * Native emits "SilenceTimerEvent" for tick/finished/cancelled — see src/native/SilenceTimer.ts.
 */
class SilenceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "SilenceModule"

    private var receiverRegistered = false

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val params = Arguments.createMap()
            when (intent?.action) {
                SilenceTimerService.ACTION_TICK -> {
                    params.putString("type", "tick")
                    params.putDouble(
                        "remaining",
                        intent.getLongExtra(SilenceTimerService.EXTRA_REMAINING, 0L).toDouble()
                    )
                    params.putDouble(
                        "total",
                        intent.getLongExtra(SilenceTimerService.EXTRA_TOTAL, 0L).toDouble()
                    )
                    params.putString(
                        "mode",
                        intent.getStringExtra(SilenceTimerService.EXTRA_MODE) ?: "silent"
                    )
                }
                SilenceTimerService.ACTION_FINISHED -> params.putString("type", "finished")
                SilenceTimerService.ACTION_CANCELLED -> params.putString("type", "cancelled")
                else -> return
            }
            sendEvent(params)
        }
    }

    private fun sendEvent(params: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("SilenceTimerEvent", params)
    }

    // Required no-ops so NativeEventEmitter doesn't warn on the JS side.
    @ReactMethod
    fun addListener(eventName: String) {
        ensureReceiverRegistered()
    }

    @ReactMethod
    fun removeListeners(count: Int) { /* no-op */ }

    private fun ensureReceiverRegistered() {
        if (receiverRegistered) return
        val filter = IntentFilter().apply {
            addAction(SilenceTimerService.ACTION_TICK)
            addAction(SilenceTimerService.ACTION_FINISHED)
            addAction(SilenceTimerService.ACTION_CANCELLED)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            reactContext.registerReceiver(receiver, filter)
        }
        receiverRegistered = true
    }

    @ReactMethod
    fun startTimer(hours: Int, minutes: Int, mode: String, promise: Promise) {
        ensureReceiverRegistered()
        val totalMs = (hours * 3600L + minutes * 60L) * 1000L
        if (totalMs <= 0L) {
            promise.reject("INVALID_DURATION", "Duration must be greater than zero")
            return
        }
        if (mode == "dnd") {
            val nm = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (!nm.isNotificationPolicyAccessGranted) {
                promise.reject("DND_PERMISSION_REQUIRED", "Do Not Disturb access not granted")
                return
            }
        }
        val intent = Intent(reactContext, SilenceTimerService::class.java).apply {
            action = SilenceTimerService.ACTION_START
            putExtra(SilenceTimerService.EXTRA_DURATION_MS, totalMs)
            putExtra(SilenceTimerService.EXTRA_MODE, mode)
        }
        ContextCompat.startForegroundService(reactContext, intent)
        promise.resolve(null)
    }

    @ReactMethod
    fun cancelTimer(promise: Promise) {
        val intent = Intent(reactContext, SilenceTimerService::class.java).apply {
            action = SilenceTimerService.ACTION_CANCEL
        }
        reactContext.startService(intent)
        promise.resolve(null)
    }

    @ReactMethod
    fun getPermissionState(promise: Promise) {
        val notifGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                reactContext, android.Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else true

        val nm = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val result = Arguments.createMap()
        result.putBoolean("notificationGranted", notifGranted)
        result.putBoolean("dndGranted", nm.isNotificationPolicyAccessGranted)
        promise.resolve(result)
    }

    @ReactMethod
    fun openDndSettings() {
        val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun requestNotificationPermission(promise: Promise) {
        val activity = currentActivity
        if (activity is MainActivity) {
            activity.requestNotificationPermissionFromNative()
            promise.resolve(null)
        } else {
            promise.reject("NO_ACTIVITY", "Activity not available")
        }
    }
}
