package com.jmi.jmiseller;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.graphics.Color;

public class MainActivity extends BridgeActivity {
    private static final String STATUS_BAR_COLOR = "#B8860B";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Apply consistent status bar settings
        getWindow().getDecorView().postDelayed(new Runnable() {
            @Override
            public void run() {
                setupStatusBarForAllVersions();
                hideSystemUI();
            }
        }, 100);
        
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE);

    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-apply UI settings when activity resumes
        getWindow().getDecorView().postDelayed(new Runnable() {
            @Override
            public void run() {
                setupStatusBarForAllVersions();
                hideSystemUI();
            }
        }, 50);
    }

    private void setupStatusBarForAllVersions() {
        Window window = getWindow();
        int goldenColor = Color.parseColor(STATUS_BAR_COLOR);

        // For Android 5.0+ (Lollipop)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(goldenColor);
        }

        // For Android 6.0+ (Marshmallow) - Light status bar icons
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            View decorView = window.getDecorView();
            int flags = decorView.getSystemUiVisibility();
            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            decorView.setSystemUiVisibility(flags);
        }

        // Ensure status bar is always visible
        window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
    }

    private void hideSystemUI() {
        // Only hide navigation bar, keep status bar visible
        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION;

        decorView.setSystemUiVisibility(uiOptions);
    }
}