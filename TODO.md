# To do — Go Silent: Silent Mode Timer

Current build: 1.1.2 (build 5) on React Native 0.88. Copies of each built
release are kept in `..\release-builds\` (outside the repo).

## Done

- [x] 1.1.1 (build 4): R8 on (Play "DEX optimization / obfuscation 1%",
  deadline Feb 2027); deprecated edge-to-edge bar colours removed; notification
  colour follows the theme.
- [x] 1.1.2 (build 5): React Native 0.81.6 -> 0.88.0 (New Architecture),
  ads 17.2.0, compileSdk 37. Smoother page swipe; swiping across the clock
  face changes page instead of moving the hand.

Confirm in Play Console after uploading: DEX optimization no longer "Low", and
whether the edge-to-edge deprecation warning is gone (if not, the remaining
calls are inside React Native / AdMob).

## Still open

- [ ] **Real interstitial ad unit.** Create an Interstitial unit in AdMob and
  put its id in `INTERSTITIAL_RELEASE_ID` (`src/lib/adUnits.ts`). Until then
  real users see Google's "Test Ad" interstitial. Bump to versionCode 6.
- [ ] Optional: native debug symbols for clearer crash reports.
- [ ] Optional: `react-native-linear-gradient` 2.8.3 runs via the interop
  layer; move to a New-Architecture version (3.x) once it is stable.
