package com.sedabox.sedabox;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativePreferences")
public class NativePreferencesPlugin extends Plugin {
    private static final String STORE_NAME = "sedabox_native_preferences";

    private SharedPreferences preferences() {
        return getContext().getSharedPreferences(STORE_NAME, Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void get(PluginCall call) {
        String key = call.getString("key");
        if (key == null || key.isEmpty()) {
            call.reject("Preference key is required.", "PREFERENCE_KEY_REQUIRED");
            return;
        }

        JSObject result = new JSObject();
        result.put("value", preferences().getString(key, null));
        call.resolve(result);
    }

    @PluginMethod
    public void set(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");
        if (key == null || key.isEmpty() || value == null) {
            call.reject("Preference key and value are required.", "PREFERENCE_VALUE_REQUIRED");
            return;
        }

        // commit() is intentional here. Auth rotation awaits this bridge call,
        // so a force-close cannot leave a half-persisted native session pair.
        boolean committed = preferences().edit().putString(key, value).commit();
        if (!committed) {
            call.reject("Could not persist native preference.", "PREFERENCE_WRITE_FAILED");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String key = call.getString("key");
        if (key == null || key.isEmpty()) {
            call.reject("Preference key is required.", "PREFERENCE_KEY_REQUIRED");
            return;
        }

        boolean committed = preferences().edit().remove(key).commit();
        if (!committed) {
            call.reject("Could not remove native preference.", "PREFERENCE_REMOVE_FAILED");
            return;
        }
        call.resolve();
    }
}
