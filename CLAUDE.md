# Project context - Go Silent by MPS

## Naming - do not "fix" this

- Local folder: `D:\ClaudeAiProjrcts\go-silent-rn\go-silent-rn`
- GitHub repo: `https://github.com/mps0103/GoSilentByMPS` (branch `main`)
- Android package: `com.mps.gosilent`
- Play Store title: "Go Silent: Silent Mode Timer"
- Name under the launcher icon (`app_name`): "Go Silent"
- In-app header keeps the "BY MPS" branding

The local folder name and the GitHub repo name are deliberately different.
This is intentional and settled. Do NOT rename the folder, do NOT suggest
renaming it, and do NOT treat the mismatch as a bug or inconsistency.

The GitHub Pages URL is derived from the REPO name, not the folder name, so
this is the correct privacy policy URL and must not be changed:

  https://mps0103.github.io/GoSilentByMPS/privacy.html

Served by GitHub Pages from this repo's `/docs` folder on branch `main`.
Jekyll renders `docs/privacy.md` as `privacy.html`.

## Working rules

- Make ONE change at a time, then stop and wait for confirmation.
- Never edit a file that was not explicitly named in the request.
- Never edit Gradle files, `settings.gradle`, `build.gradle`, or
  `gradle-wrapper.properties` unless directly asked.
- Do not refactor, reformat, or "tidy" code that was not part of the request.
- Report errors and warnings - do not fix them unless asked.
- Combine multi-step shell commands into a single line using `;` or `&&`.

## Stack - do not upgrade casually

React Native 0.88.0, React 19.3.0, TypeScript 6, Kotlin 2.2.0, AGP from the
RN Gradle plugin catalog, Gradle 9.4.1 (local zip in `C:\Gradle`), NDK 27.1,
compileSdk 37, targetSdk 36, minSdk 26, Node >= 22.11. History: 0.74.5 ->
0.81.6 (Oct 2026, Play needs targetSdk 36 + 16 KB libraries) -> 0.88.0.

- New Architecture only (`newArchEnabled=true`; RN >= 0.82 has no old arch).
  Our `SilenceModule` and `react-native-linear-gradient` 2.8.3 are legacy-style
  and run through RN's interop layer. `react-native-google-mobile-ads` is
  17.2.0 (needs RN >= 0.86).
- `gradle.properties` carries the template's AGP 9 flags
  (`android.builtInKotlin=false`, `android.newDsl=false`).
- R8 is on for release. `proguard-rules.pro` keeps our bridge module and
  WorkManager's Room database (`WorkDatabase_Impl`) - without the latter the
  app crashes at startup.
- RN 0.88 API changes already applied: `StyleSheet.absoluteFill` (no
  `absoluteFillObject`), refs typed `ComponentRef<typeof View>`, `MainApplication`
  passes packages to `getDefaultReactHost` (no `ReactNativeHost`).
- RN 0.75+ autolinking: `autolinkLibrariesFromCommand()` in `settings.gradle`
  and `autolinkLibrariesWithApp()` in `app/build.gradle`. The old
  `native_modules.gradle` no longer exists.
- Edge-to-edge (`edgeToEdgeEnabled=true`); insets come from
  `react-native-safe-area-context` in `src/App.tsx`.
- Predictive back is opted out in the manifest so `BackHandler` keeps working.
- Stop the Gradle daemon (`gradlew --stop`) before `npm install`, or npm hits
  EBUSY on locked files in `node_modules`.

In `settings.gradle`, `pluginManagement { }` must remain the literal first
statement.

## Contact

Support email: info@dealtrix.com
