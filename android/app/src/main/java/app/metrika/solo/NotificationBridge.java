package app.metrika.solo;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import android.webkit.JavascriptInterface;

public final class NotificationBridge {
    private final Activity activity;
    private final int permissionRequestCode;

    NotificationBridge(Activity activity, int permissionRequestCode) {
        this.activity = activity;
        this.permissionRequestCode = permissionRequestCode;
    }

    @JavascriptInterface
    public boolean isAvailable() {
        return true;
    }

    @JavascriptInterface
    public boolean hasPermission() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                || activity.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED;
    }

    @JavascriptInterface
    public void requestPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || hasPermission()) return;
        activity.runOnUiThread(() -> activity.requestPermissions(
                new String[]{Manifest.permission.POST_NOTIFICATIONS},
                permissionRequestCode));
    }

    @JavascriptInterface
    public void sync(String payload) {
        NotificationScheduler.sync(activity.getApplicationContext(), payload);
    }

    @JavascriptInterface
    public void cancelAll() {
        NotificationScheduler.sync(activity.getApplicationContext(), "[]");
    }
}
