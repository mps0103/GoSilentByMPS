package com.mps.gosilent

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContracts
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    /**
     * Returns the name of the main component registered from JavaScript.
     * Must match registerComponent in index.js and "name" in app.json.
     */
    override fun getMainComponentName(): String = "GoSilent"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // A force stop cancels our alarm and kills the service, so nothing can
        // run until the user opens the app again. Catch up the moment they do.
        try {
            RestoreReceiver.resumeOrRestore(this)
        } catch (_: Exception) {
            // Never let recovery block the app from opening.
        }
    }

    override fun onStop() {
        super.onStop()
        // Swap the home-screen icon to match the theme while we are out of sight.
        try {
            LauncherIcon.sync(this)
        } catch (_: Exception) { }
    }

    private val notifPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { /* handled via getPermissionState() poll from JS */ }

    /** Called from SilenceModule.requestNotificationPermission() */
    fun requestNotificationPermissionFromNative() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }
}
