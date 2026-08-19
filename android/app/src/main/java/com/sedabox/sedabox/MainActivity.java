package com.sedabox.sedabox;

import android.content.pm.ActivityInfo;
import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeDownloadPlugin.class);
        registerPlugin(NativePreferencesPlugin.class);
        super.onCreate(savedInstanceState);
        lockPortrait();
        requestHighestRefreshRate();
    }

    @Override
    public void onResume() {
        super.onResume();
        lockPortrait();
        requestHighestRefreshRate();
    }

    /** Keep the native Capacitor shell phone UI in portrait orientation. */
    private void lockPortrait() {
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
    }

    /**
     * Ask Android for the fastest display mode at the current physical
     * resolution. The OS may still choose a lower rate for battery, thermal,
     * accessibility, or device-policy reasons.
     */
    private void requestHighestRefreshRate() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return;
        }

        Display display = getWindowManager().getDefaultDisplay();
        Display.Mode currentMode = display.getMode();
        Display.Mode bestMode = currentMode;

        for (Display.Mode mode : display.getSupportedModes()) {
            boolean sameResolution =
                mode.getPhysicalWidth() == currentMode.getPhysicalWidth()
                    && mode.getPhysicalHeight() == currentMode.getPhysicalHeight();

            if (sameResolution && mode.getRefreshRate() > bestMode.getRefreshRate()) {
                bestMode = mode;
            }
        }

        if (bestMode.getRefreshRate() <= 0f) {
            return;
        }

        // preferredRefreshRate is the least invasive window-level hint when we
        // only want a faster refresh rate and do not need to change resolution.
        WindowManager.LayoutParams params = getWindow().getAttributes();
        params.preferredRefreshRate = bestMode.getRefreshRate();
        getWindow().setAttributes(params);
    }
}
