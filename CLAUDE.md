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

React Native 0.81.6, React 19.1.4, Kotlin 2.1.20, AGP from the RN Gradle
plugin catalog, Gradle 8.14.3 (local zip in `C:\Gradle`), NDK 27.1,
compileSdk/targetSdk 36, minSdk 26. Upgraded from 0.74.5 in Oct 2026 because
Play requires targetSdk 36 and 16 KB-aligned native libraries (RN >= 0.77).

- Old architecture (`newArchEnabled=false`). `react-native-google-mobile-ads`
  is pinned to 15.8.3: 16.x dropped the old architecture and pulls Mobile Ads
  SDK 25.x, which is compiled with Kotlin 2.3 and breaks the build.
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
