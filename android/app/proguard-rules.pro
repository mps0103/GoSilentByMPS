# Add project specific ProGuard rules here.
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Our bridge module: methods are called from JS by name via reflection
# (@ReactMethod), and getConstants() keys are read from JS.
-keep class com.mps.gosilent.nativemodules.** { *; }

# WorkManager (pulled in by the Mobile Ads SDK) builds its Room database by
# reflection: Class.forName("...WorkDatabase_Impl").newInstance(). Without
# these, R8 strips the generated class/constructor and the app crashes at
# startup ("Failed to create an instance of androidx.work.impl.WorkDatabase").
-keep class * extends androidx.room.RoomDatabase { <init>(); }
-keep class androidx.work.impl.WorkDatabase_Impl { *; }
