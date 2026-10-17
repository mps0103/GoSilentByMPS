package com.mps.gosilent

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.mps.gosilent.nativemodules.SilencePackage

class MainApplication : Application(), ReactApplication {

    override val reactHost: ReactHost by lazy {
        getDefaultReactHost(
            context = applicationContext,
            packageList =
                PackageList(this).packages.apply {
                    // Our own native module isn't in node_modules, so it isn't autolinked.
                    add(SilencePackage())
                },
        )
    }

    override fun onCreate() {
        super.onCreate()
        loadReactNative(this)
        // AdMob initialization happens from JS (src/lib/consent.ts) after the
        // GDPR/UK consent flow resolves - see ensureAdsConsentAndInit().
    }
}
