package com.mps.gosilent

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager

/**
 * Keeps the home-screen icon in step with the chosen theme. Each theme has an
 * <activity-alias> in the manifest; exactly one is enabled at a time.
 *
 * Switching aliases can make some launchers briefly drop or redraw the icon,
 * so it is applied when the app goes to the background (MainActivity.onStop),
 * never while the user is looking at it.
 */
object LauncherIcon {

    const val PREFS = "go_silent_settings"
    const val KEY_THEME = "theme_id"

    private val THEMES = listOf("ember", "ocean", "forest", "rose", "aurora", "daylight")
    private const val DEFAULT = "ember"

    fun savedTheme(context: Context): String? =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_THEME, null)

    fun sync(context: Context) {
        val wanted = savedTheme(context)?.takeIf { it in THEMES } ?: DEFAULT
        val pm = context.packageManager
        // Enable the new one first so there is never a moment with no launcher entry.
        setEnabled(pm, context, wanted, true)
        THEMES.filter { it != wanted }.forEach { setEnabled(pm, context, it, false) }
    }

    private fun setEnabled(pm: PackageManager, context: Context, theme: String, enabled: Boolean) {
        val component = ComponentName(context.packageName, "com.mps.gosilent.Launcher_$theme")
        val current = pm.getComponentEnabledSetting(component)
        // STATE_DEFAULT means "as declared in the manifest": only ember is on.
        val isOn = current == PackageManager.COMPONENT_ENABLED_STATE_ENABLED ||
            (current == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT && theme == DEFAULT)
        if (isOn == enabled) return
        val target = if (enabled) {
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED
        } else {
            PackageManager.COMPONENT_ENABLED_STATE_DISABLED
        }
        pm.setComponentEnabledSetting(component, target, PackageManager.DONT_KILL_APP)
    }
}
