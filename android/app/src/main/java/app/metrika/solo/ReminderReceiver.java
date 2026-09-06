package app.metrika.solo;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import org.json.JSONObject;

public final class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String id = intent.getStringExtra(NotificationScheduler.EXTRA_ID);
        if (id == null) return;
        JSONObject reminder = NotificationScheduler.find(context, id);
        if (reminder == null || !reminder.optBoolean("enabled", true)) return;
        // Keep repeating reminders alive even if permission is temporarily disabled.
        if (reminder.optJSONArray("days") != null) NotificationScheduler.schedule(context, reminder);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) return;

        Intent open = new Intent(context, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(
                context,
                0,
                open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(context, NotificationScheduler.CHANNEL_ID)
                : new Notification.Builder(context);
        builder.setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(reminder.optString("title", "Metrika"))
                .setContentText(reminder.optString("body"))
                .setStyle(new Notification.BigTextStyle().bigText(reminder.optString("body")))
                .setContentIntent(contentIntent)
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_REMINDER)
                .setVisibility(Notification.VISIBILITY_PRIVATE);
        Notification.Builder publicBuilder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(context, NotificationScheduler.CHANNEL_ID)
                : new Notification.Builder(context);
        builder.setPublicVersion(publicBuilder
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("Metrika")
                .setContentText(reminder.optString("publicBody", "Є приватне нагадування."))
                .build());
        NotificationManager manager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.notify(id.hashCode() & 0x7fffffff, builder.build());
    }
}
