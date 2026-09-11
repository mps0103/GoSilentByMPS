import {NativeEventEmitter, NativeModules} from 'react-native';

export type Mode = 'silent' | 'dnd';

export interface PermissionState {
  notificationGranted: boolean;
  dndGranted: boolean;
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

export function cancelTimer(): Promise<void> {
  return SilenceModule.cancelTimer();
}

export function getPermissionState(): Promise<PermissionState> {
  return SilenceModule.getPermissionState();
}

export function openDndSettings(): void {
  SilenceModule.openDndSettings();
}

export function requestNotificationPermission(): Promise<void> {
  return SilenceModule.requestNotificationPermission();
}

/** Subscribe to tick/finished/cancelled events. Returns an unsubscribe function. */
export function subscribe(callback: (event: SilenceEvent) => void): () => void {
  const sub = emitter.addListener('SilenceTimerEvent', callback);
  return () => sub.remove();
}
