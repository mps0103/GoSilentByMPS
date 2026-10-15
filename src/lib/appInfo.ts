import {NativeModules} from 'react-native';

export const APP_NAME = 'Go Silent';
export const APP_FULL_NAME = 'Go Silent: Silent Mode Timer';
export const DEVELOPER_NAME = 'MPS';

// Version comes from the installed package (versionName/versionCode in
// build.gradle) via SilenceModule's constants, so it can never disagree with
// the APK that is actually running. The fallbacks only apply if the native
// module is missing, which means the app needs a rebuild anyway.
const nativeInfo = (NativeModules.SilenceModule ?? {}) as {
	versionName?: string;
	versionCode?: number;
};

export const APP_VERSION = nativeInfo.versionName || '1.1.0';
export const APP_BUILD = nativeInfo.versionCode ?? 3;

export const PRIVACY_POLICY_URL =
	'https://mps0103.github.io/GoSilentByMPS/privacy.html';

export const SUPPORT_EMAIL = 'info@dealtrix.com';
