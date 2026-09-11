# Go Silent — React Native edition (by MPS)

Bare React Native (not Expo) + TypeScript rebuild of Go Silent, using the same architecture pattern as PDF Tools by MPS: native Kotlin module for the platform-specific work, everything else in JS/TS.

## Stack

- React Native 0.74.5 (bare) + TypeScript
- 1 native Kotlin module (`SilenceModule` + `SilenceTimerService`) for AudioManager/NotificationManager/foreground-service work — no JS equivalent exists for these
- `react-native-svg` for the countdown ring and icons
- `react-native-linear-gradient` for the amber gradients (RN has no native gradient primitive)
- `react-native-google-mobile-ads` for the single anchored adaptive banner
- Package: `com.mps.gosilent` · min Android 8.0 (API 26) · target Android 14 (API 34)

## What did NOT carry over from PDF Tools

`pdf-lib`, `react-native-image-crop-picker`, and ML Kit OCR are specific to document/image processing — Go Silent doesn't touch files, so none of that is included. Only the parts of the stack that actually apply to a silence timer made it in.

## Structure

```
go-silent-rn/
├── android/                      bare RN native Android project
│   └── app/src/main/java/com/mps/gosilent/
│       ├── MainActivity.kt       RN activity + notification permission helper
│       ├── MainApplication.kt    RN application, registers native module + AdMob init
│       ├── SilenceTimerService.kt  foreground service — ported unchanged from the native app
│       └── nativemodules/
│           ├── SilenceModule.kt    JS ↔ native bridge
│           └── SilencePackage.kt   registers the module
├── src/
│   ├── screens/       SplashScreen, OnboardingScreen, HomeScreen
│   ├── components/    DialPicker, ModeToggle, CountdownRing, PulseDot, ParticleBackground, AdBanner
│   ├── native/         SilenceTimer.ts — thin wrapper around the native module
│   ├── lib/            time.ts, adUnits.ts — pure helpers
│   ├── theme.ts         single source for colors/spacing
│   └── App.tsx
├── index.js
├── package.json
├── docs/privacy.md      privacy policy (GitHub Pages source)
├── PLAY_STORE_LISTING.md
```

## What changed visually vs. the native Kotlin version

Same colors, same layout, same screen flow, same major animations (rotating splash rings, breathing icon, shimmer button, pulse dot, countdown ring, staggered entrances). Two deliberate simplifications to reduce native-dependency risk:

- Particle count reduced from 28 to 14 (still reads as a drifting field, cheaper to animate in RN's `Animated` API without a Skia/Canvas dependency)
- Soft glow blobs are SVG radial gradients instead of a real blur filter (RN has no built-in blur without another native library)

---

## Building from VS Code

You already have Java 17, the Android SDK, and Gradle 8.6 installed from the native build. This adds **Node.js** on top.

### One-time setup

**1. Install Node.js 18 or newer**

Download the LTS installer from https://nodejs.org and run it. Verify:
```powershell
node --version
npm --version
```

**2. Install project dependencies**

In VS Code's terminal, in the project root:
```powershell
npm install
```
This downloads all JS dependencies (~5 minutes first time).

**3. Point the project at your existing Android SDK**

Use **forward slashes** — backslashes in a `.properties` file get silently mis-parsed as escape characters:
```powershell
"sdk.dir=C:/Users/mmpps/AppData/Local/Android/Sdk" | Out-File -FilePath "android\local.properties" -Encoding ASCII
```
(Adjust the path if your SDK lives somewhere else.)

**4. Generate the Gradle wrapper inside android/**

Same trick as before, pointed at the `android` subfolder this time:
```powershell
cd android
gradle wrapper --gradle-version 8.6
cd ..
```

### Set up AdMob (or use test IDs to build first)

The manifest ships with **Google's test AdMob App ID** — safe to build and run immediately, shows a fake "Test Ad" banner. To go live later:

1. Create a free account at https://admob.google.com
2. Add your app, create a Banner ad unit
3. Replace the test App ID in `android/app/src/main/AndroidManifest.xml` (the `com.google.android.gms.ads.APPLICATION_ID` meta-data value)
4. Replace `REAL_BANNER_AD_UNIT_ID` in `src/lib/adUnits.ts`

**Never test with real IDs** — Google can flag your account for invalid traffic.

### Build the APK

Two terminals needed — Metro (the JS bundler) has to be running.

**Terminal 1 — start Metro:**
```powershell
npm start
```
Leave this running.

**Terminal 2 — build & install:**

With your phone connected via USB (same setup as before — Developer Options + USB debugging enabled):
```powershell
npx react-native run-android
```
This builds the native app, connects to Metro for the JS bundle, and installs on your phone in one step.

**Or, build a standalone APK** that doesn't need Metro running (bundles the JS into the APK):
```powershell
cd android
.\gradlew.bat assembleDebug
```
APK at `android\app\build\outputs\apk\debug\app-debug.apk`. Install exactly as before (Google Drive, or `adb install`).

### If native module changes don't show up

Any time you edit a `.kt` file, stop Metro, then:
```powershell
cd android
.\gradlew.bat clean
cd ..
npx react-native run-android
```

---

## Publishing to Play Store

See `PLAY_STORE_LISTING.md` and `docs/privacy.md` — both updated for the ads-enabled version. Key addition vs. the ad-free native build: you must check **"Contains ads"** in the Play Console and fill out the Data Safety form's advertising sections truthfully.

## Troubleshooting

**`Unable to load script from assets 'index.android.bundle'`** — Metro isn't running or the APK was built without bundling. Run `npm start` in a separate terminal, or use `assembleDebug` for a fully standalone build.

**`Unresolved reference: PackageList` in MainApplication.kt** — the native-module linking step didn't run. Check `android/app/build.gradle` ends with `apply from: file("../../node_modules/@react-native-community/cli-platform-android/native_modules.gradle")` followed by `applyNativeModulesAppBuildGradle(project)`, and `android/settings.gradle` has the matching `applyNativeModulesSettingsGradle(settings)` call. RN 0.74 uses this CLI-based autolinking mechanism, not the newer `ReactSettingsExtension` API (that's 0.75+ only).

**`resource drawable/rn_edit_text_material not found`** — already fixed in this build; `styles.xml` no longer references it.

**`IOException: The filename, directory name, or volume label syntax is incorrect` during Gradle sync** — check `android/local.properties` uses **forward slashes** (`C:/Users/...`), not backslashes. Backslashes in `.properties` files are escape characters and get silently corrupted.

**`SilenceModule native module not found` warning in Metro logs** — a native change wasn't picked up. Stop Metro, `cd android && .\gradlew.bat clean`, rebuild.

**Ads don't show even with test IDs** — check `INTERNET` permission is in the manifest (it is by default here) and that your emulator/phone has network access.

**Timer doesn't survive backgrounding** — same as the native app: check Settings → Apps → Go Silent → Battery → "No restrictions" on aggressive OEMs (Xiaomi, Oppo, Vivo).
