import {NativeEventEmitter, NativeModules} from 'react-native';

export type Mode = 'silent' | 'dnd';

export interface PermissionState {
  notificationGranted: boolean;
  dndGranted: boolean;
  /** Optional: without it sound may come back a few minutes late. */
  exactAlarmGranted?: boolean;
  /** Optional: battery "Unrestricted" stops OEM cleaners killing the timer. */
  batteryUnrestricted?: boolean;
}

export interface TickEvent {
  type: 'tick';
  remaining: number;
  total: number;
  mode: Mode;
}
export interface FinishedEvent {
  type: 'finished';
}
export interface CancelledEvent {
  type: 'cancelled';
}
export type SilenceEvent = TickEvent | FinishedEvent | CancelledEvent;

const {SilenceModule} = NativeModules;

if (!SilenceModule) {
  // This fires if autolinking didn't pick up the native module —
  // usually means a clean rebuild is needed (stop Metro, ./gradlew clean, rebuild).
  console.warn(
    'SilenceModule native module not found. Rebuild the Android app after any native change.',
  );
}

const emitter = new NativeEventEmitter(SilenceModule);

export function startTimer(
  hours: number,
  minutes: number,
  mode: Mode,
): Promise<void> {
  return SilenceModule.startTimer(hours, minutes, mode);
}

/** Starts a session of an exact length - used by the "until a time" clock. */
export function startTimerMs(durationMs: number, mode: Mode): Promise<void> {
  return SilenceModule.startTimerMs(durationMs, mode);
}

// Native constants are captured once per process. Reopening the app from the
// newly enabled themed launcher icon recreates the activity and remounts React
// in the same process, so the constant would still hold the theme from launch.
// The latest choice is kept here too and wins over the constant.
let latestThemeId: string | null = null;

/** Theme saved by setSavedThemeId, readable synchronously on first render. */
export function getSavedThemeId(): string | null {
  return latestThemeId ?? SilenceModule?.themeId ?? null;
}

export function setSavedThemeId(themeId: string): void {
  latestThemeId = themeId;
  SilenceModule?.setTheme(themeId);
}

export function cancelTimer(): Promise<void> {
  return SilenceModule.cancelTimer();
}

export function getPermissionState(): Promise<PermissionState> {
  return SilenceModule.getPermissionState();
}

export function openDndSettings(): void {
  SilenceModule.openDndSettings();
}

export function openExactAlarmSettings(): void {
  SilenceModule.openExactAlarmSettings();
}

/**
 * Opens the app's system page for the battery setting. vivo/OPPO/Xiaomi keep
 * their "allow background" switch out of reach of any API, so opening the page
 * also records the hint as done - it won't keep nagging after the user acted.
 */
export function openBatterySettings(): void {
  SilenceModule.markBatteryHintDone();
  SilenceModule.openBatterySettings();
}

/** Hides the battery hint without opening settings. */
export function dismissBatteryHint(): void {
  SilenceModule.markBatteryHintDone();
}

export function requestNotificationPermission(): Promise<void> {
  return SilenceModule.requestNotificationPermission();
}

/** Subscribe to tick/finished/cancelled events. Returns an unsubscribe function. */
export function subscribe(callback: (event: SilenceEvent) => void): () => void {
  const sub = emitter.addListener('SilenceTimerEvent', callback);
  return () => sub.remove();
}
