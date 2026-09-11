# Google Play Store Listing — Go Silent (by MPS)

## Basic info

**App name**: `Go Silent by MPS`

**Short description**: `Auto-silence your phone for a chosen time, then auto-restore the ringer.`

**Full description**:
```
Go Silent puts your phone into Silent or Do Not Disturb mode for a duration you choose, then automatically switches it back to ringing when the timer ends.

No more forgetting to turn the sound back on after a meeting, a movie, a class, a workout, a meditation, a nap, or bedtime.

KEY FEATURES
• Pick any duration from 1 minute up to 23 hours 59 minutes
• Silent mode or Do Not Disturb mode
• Live countdown ring with remaining time
• Cancel anytime — in-app or from the notification
• Keeps running when minimized or screen is locked
• Auto-restores ringing when finished, even if the app was force-closed

This app is ad-supported and shows a small banner ad.

Made with care by MPS.
```

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

1. Create a free public GitHub repo, e.g. `gosilent-privacy`
2. Upload `PRIVACY_POLICY.md` as `README.md`
3. Settings → Pages → deploy from `main` branch, root
4. URL becomes `https://YOUR-USERNAME.github.io/gosilent-privacy/`
5. Paste into Play Console's Privacy Policy field

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

The debug-signed release config in `android/app/build.gradle` works for local testing, but Play Store requires your own signing key for the real submission:

```bash
keytool -genkey -v -keystore gosilent-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias gosilent
```

Then add a proper `signingConfigs { release { ... } }` block referencing that keystore in `android/app/build.gradle`, and build:

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
| `PRIVACY_POLICY.md` | Contact email, effective date |
