# Google Play Store Listing — Go Silent: Silent Mode Timer

## Basic info

**App name (Play title, 30 max)**: `Go Silent: Silent Mode Timer` (28)

Name under the launcher icon is just `Go Silent` (`app_name` in
`android/app/src/main/res/values/strings.xml`) so it never gets truncated.

**Short description (80 max)**:
`Do Not Disturb & silent timer - auto unmute, so you never miss calls again` (74)

The title already carries "silent mode timer"; the short description adds the
other high-intent terms ("Do Not Disturb", "auto unmute") plus the benefit.

**Full description (4000 max)**:
```
Go Silent is the simple silent mode timer for Android. Put your phone on Silent or Do Not Disturb for as long as you need, and your ringer turns back on automatically when time is up. No more missed calls because you forgot to unmute after a meeting, a class or the cinema.

⏱ TWO WAYS TO SET YOUR SILENT TIMER
• For how long – spin the dials to silence your phone for 15 minutes, 1 hour, 2 hours or up to 23 hours 59 minutes
• Until a time – tap the clock and pick when sound returns, like "silent until 7:30 AM"

🔕 SILENT MODE OR DO NOT DISTURB
• Silent mode mutes your ringtone and notification sounds
• Do Not Disturb (DND) mode uses Android's DND, so priority contacts and alarms still get through
• Auto unmute: your exact ringer volume and ringer mode are restored when the timer ends

✅ PERFECT FOR
Meetings, class and lectures, exams, interviews, the cinema, prayer and worship, the library, the gym, meditation, naps, bedtime and sleep – anywhere your phone should stay quiet for a while.

🔋 RELIABLE IN THE BACKGROUND
• Keeps counting when the screen is locked or you switch apps
• Keeps working if you clear recent apps or restart your phone
• Exact alarms bring your sound back right on time, even when the phone is asleep
• Stop early from the app or straight from the notification

🎨 BEAUTIFUL AND EASY
• Live countdown ring shows exactly when your phone rings again
• Six colour themes – Ember, Ocean, Forest, Rose, Aurora and Daylight – and the app icon changes to match
• Smooth animations, one tap to start

🔒 PRIVATE BY DESIGN
No account and no sign-up. Your timers and settings stay on your phone.

FAQ
How do I put my phone on silent for 1 hour? Open Go Silent, set 1 hour and tap Begin Silence. Your phone goes silent and the ringer comes back on by itself after an hour.
Can I keep my phone silent until the morning? Yes – choose "Until a time", pick 7:00 AM and sleep in peace.
Does my alarm still ring? Yes. Go Silent never touches your alarm volume, so your alarm clock rings in both modes.

Go Silent – silent mode timer and Do Not Disturb timer with auto unmute. Free, supported by ads.

Made with care by MPS.
```

**Keyword notes**: title = "silent mode timer"; short description = "Do Not
Disturb", "silent timer", "auto unmute". The full description repeats these
naturally (silent ~13, timer 6, Do Not Disturb 5, ringer 4, DND 2, auto
unmute 2) and covers long-tail searches in the FAQ ("silent for 1 hour",
"silent until morning", "does my alarm still ring"). Google indexes all three
fields; never add keyword lists — Play penalises stuffing.

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
