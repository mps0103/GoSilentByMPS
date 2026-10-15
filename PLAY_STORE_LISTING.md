# Google Play Store Listing — Go Silent: Silent Mode Timer

## Basic info

**App name (Play title, 30 max)**: `Go Silent: Silent Mode Timer` (28)

Name under the launcher icon is just `Go Silent` (`app_name` in
`android/app/src/main/res/values/strings.xml`) so it never gets truncated.

**Short description (80 max)**:
`Silent or Do Not Disturb for a set time, then your phone rings again by itself.` (79)

**Full description (4000 max)**:
```
Go Silent is a silent mode timer: put your phone on Silent or Do Not Disturb for as long as you need, and it switches your ringer back on automatically when the time is up. No more missed calls because you forgot to unmute after a meeting.

TWO WAYS TO SET THE TIMER
• For how long – spin the dials and silence your phone for 10 minutes, 1 hour or up to 23 hours 59 minutes
• Until a time – tap the clock and choose when sound comes back, like "silent until 7:30 AM"

PERFECT FOR
Meetings, class, lectures, cinema, prayer, worship, exams, interviews, naps, sleep, meditation, the gym and anywhere your phone should stay quiet for a while.

SILENT MODE OR DO NOT DISTURB
• Silent mode mutes your ringtone and notification sounds
• Do Not Disturb mode uses Android's DND so priority contacts can still reach you
• Your exact ringer volume and mode are restored when the timer ends – auto unmute, every time

RELIABLE, EVEN IN THE BACKGROUND
• Keeps counting when you lock the screen or switch apps
• Survives clearing recent apps and phone restarts
• Exact alarms bring the sound back right on time
• Stop early from the app or straight from the notification

BEAUTIFUL AND SIMPLE
• Live countdown ring that shows exactly when your phone rings again
• Six colour themes – Ember, Ocean, Forest, Rose, Aurora and Daylight – and the app icon changes to match
• Smooth animations, one tap to start

PRIVATE BY DESIGN
No account, no sign-up. Your timers and settings never leave your phone.

Go Silent is free and supported by ads.

Made with care by MPS.
```

**Keyword notes**: the title carries "silent mode timer"; the description
naturally repeats "silent mode", "Do Not Disturb", "DND", "timer", "auto
unmute", "ringer" and the common use cases (meeting, class, sleep, cinema,
prayer). Avoid keyword lists — Play penalises keyword stuffing.

## Content rating

- Contains ads: **YES** — check this box truthfully in Play Console
- Everything else: No
- Result: 3+ / Everyone

## Data safety form

- **Device or other IDs** — Advertising/marketing, Analytics. Shared with Google AdMob: Yes.
- **Approximate location** — Advertising/marketing. Shared: Yes.
- **App interactions** (ad views/clicks) — Analytics, Advertising. Shared: Yes.
- Data encrypted in transit: Yes (AdMob uses HTTPS)
- Users can request data deletion: Yes, via AdMob's controls

## Store listing checkbox

Check **"Contains ads"** in Play Console — this is mandatory and separately enforced from the content rating questionnaire.

## Privacy policy hosting

The policy lives at `docs/privacy.md` in this repo — it is the single source of
truth and is also what the app's About screen links to.

1. Settings → Pages → deploy from `main` branch, `/docs` folder
2. URL becomes `https://YOUR-USERNAME.github.io/YOUR-REPO/privacy`
3. Set that exact URL as `PRIVACY_POLICY_URL` in `src/lib/appInfo.ts`
4. Paste the same URL into Play Console's Privacy Policy field

## app-ads.txt (required once you have a live AdMob account)

A starter file is already included at the project root: **`app-ads.txt`**. Open it — it has your exact line format and full hosting instructions inside. Two things to do:

1. Replace the placeholder `ca-app-pub-XXXXXXXXXXXXXXXX` with your real publisher ID from AdMob → Apps → your app → App settings → App-ads.txt
2. Host it at your website's **domain root** (not a subfolder) — the file explains why a per-repo GitHub Pages URL (`you.github.io/reponame/`) won't work for this specific file, unlike the privacy policy

## In-app privacy policy (About screen)

The app now includes an **About screen** (accessible via the ⓘ icon on the main screen) showing:
- App name and version
- A tappable Privacy Policy link (opens your hosted policy URL)
- A Contact Support link

This satisfies Play's requirement that the privacy policy be reachable from inside the app, not only from the store listing. Before publishing, open `src/lib/appInfo.ts` and replace `PRIVACY_POLICY_URL` and `SUPPORT_EMAIL` with your real values — they're placeholders right now.

## Required assets

- App icon 512×512 PNG
- Feature graphic 1024×500 JPG/PNG
- At least 2 phone screenshots (1080×1920 or similar)
- Contact email

## Signing the release build

Release builds are signed with `android/app/gosilent-release.keystore`
(alias `gosilent`), configured through `android/keystore.properties`. Both are
gitignored — keep a backup of each outside the repo. Without
`keystore.properties` the build silently falls back to the debug key.

```bash
cd android && ./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab` — upload this, not an APK.

## New developer account rule

Since Nov 2023, new Play Console accounts must run Closed Testing with 12+ testers for 14+ days before Production is unlocked. Older accounts can skip straight to Production.

## AdMob-specific policy notes

- No ads on splash or onboarding screens (already excluded in this build)
- Ad must never overlap or obscure Start/Stop controls
- **GDPR/UK consent**: handled automatically — `src/lib/consent.ts` shows Google's consent form to EEA/UK users before any ad loads, and initializes the Mobile Ads SDK only after that resolves
- Full compliance: https://support.google.com/admob/answer/6128543

## Before you submit — placeholders you must replace

| File | What to replace |
|---|---|
| `android/app/src/main/AndroidManifest.xml` | Test AdMob App ID → your real one |
| `src/lib/adUnits.ts` | `REAL_BANNER_AD_UNIT_ID` → your real banner unit ID |
| `src/lib/appInfo.ts` | `PRIVACY_POLICY_URL` and `SUPPORT_EMAIL` → your real hosted URL and email |
| `app-ads.txt` | `ca-app-pub-XXXXXXXXXXXXXXXX` → your real publisher ID, then host at your domain root |
| `docs/privacy.md` | Contact email, effective date — keep in sync with the hosted page |
