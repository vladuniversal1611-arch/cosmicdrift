package com.bulbik.run;

import android.content.pm.ApplicationInfo;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Tells the game whether this is a debug build (Run from Android Studio) or the
// signed release for Google Play: debug builds show Google's test ads only.
@CapacitorPlugin(name = "AppInfo")
public class AppInfoPlugin extends Plugin {
    @PluginMethod
    public void isDebug(PluginCall call) {
        boolean debug = (getContext().getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        JSObject r = new JSObject();
        r.put("debug", debug);
        call.resolve(r);
    }
}
