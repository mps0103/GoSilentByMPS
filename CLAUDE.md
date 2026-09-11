# Project context - Go Silent by MPS

## Naming - do not "fix" this

- Local folder: `D:\ClaudeAiProjrcts\go-silent-rn\go-silent-rn`
- GitHub repo: `https://github.com/mps0103/GoSilentByMPS` (branch `main`)
- Android package: `com.mps.gosilent`
- App display name: "Go Silent by MPS"

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

React Native 0.74.5, React 18.2.0, Kotlin 1.9.24, AGP 8.1.1, Gradle 8.6,
compileSdk/targetSdk 34, minSdk 26.

RN 0.74.5 uses the OLDER CLI-based autolinking (`native_modules.gradle` via
`applyNativeModulesSettingsGradle` / `applyNativeModulesAppBuildGradle`).
Do NOT "upgrade" this to the RN 0.75+ API - those methods do not exist here.

In `settings.gradle`, `pluginManagement { }` must remain the literal first
statement.

## Contact

Support email: info@dealtrix.com
