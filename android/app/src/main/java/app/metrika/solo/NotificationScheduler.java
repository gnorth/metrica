package app.metrika.solo;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

final class NotificationScheduler {
    static final String STORE = "metrika-reminders";
    static final String PAYLOAD = "payload";
    static final String EXTRA_ID = "reminder-id";
    static final String CHANNEL_ID = "metrika-gentle-reminders";

    private NotificationScheduler() {}

    static void sync(Context context, String payload) {
        SharedPreferences preferences = context.getSharedPreferences(STORE, Context.MODE_PRIVATE);
        cancelPayload(context, preferences.getString(PAYLOAD, "[]"));
        preferences.edit().putString(PAYLOAD, payload).apply();
        createChannel(context);
        schedulePayload(context, payload);
    }

    static void rescheduleAll(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(STORE, Context.MODE_PRIVATE);
        createChannel(context);
        schedulePayload(context, preferences.getString(PAYLOAD, "[]"));
    }

    static JSONObject find(Context context, String id) {
        try {
            JSONArray reminders = new JSONArray(context.getSharedPreferences(STORE, Context.MODE_PRIVATE)
                    .getString(PAYLOAD, "[]"));
            for (int index = 0; index < reminders.length(); index++) {
                JSONObject reminder = reminders.getJSONObject(index);
                if (id.equals(reminder.optString("id"))) return reminder;
            }
        } catch (Exception ignored) {
            // Invalid saved data is treated as no reminder.
        }
        return null;
    }

    static void schedule(Context context, JSONObject reminder) {
        if (!reminder.optBoolean("enabled", true)) return;
        long now = System.currentTimeMillis();
        long endsAt = reminder.optLong("endsAt", Long.MAX_VALUE);
        if (endsAt > 0 && endsAt < now) return;
        long trigger = reminder.optLong("triggerAt", 0);
        JSONArray days = reminder.optJSONArray("days");
        if (days != null && days.length() > 0) {
            trigger = nextWeeklyTrigger(reminder.optString("time", "20:00"), days, now);
        }
        if (trigger <= now || trigger > endsAt) return;
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager == null) return;
        PendingIntent pendingIntent = pendingIntent(context, reminder.optString("id"));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pendingIntent);
        } else {
            manager.set(AlarmManager.RTC_WAKEUP, trigger, pendingIntent);
        }
    }

    private static void schedulePayload(Context context, String payload) {
        try {
            JSONArray reminders = new JSONArray(payload);
            for (int index = 0; index < reminders.length(); index++) {
                schedule(context, reminders.getJSONObject(index));
            }
        } catch (Exception ignored) {
            // The web layer will send a fresh valid schedule on its next launch.
        }
    }

    private static void cancelPayload(Context context, String payload) {
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager == null) return;
        try {
            JSONArray reminders = new JSONArray(payload);
            for (int index = 0; index < reminders.length(); index++) {
                manager.cancel(pendingIntent(context, reminders.getJSONObject(index).optString("id")));
            }
        } catch (Exception ignored) {
            // Nothing to cancel.
        }
    }

    private static PendingIntent pendingIntent(Context context, String id) {
        Intent intent = new Intent(context, ReminderReceiver.class).putExtra(EXTRA_ID, id);
        return PendingIntent.getBroadcast(
                context,
                id.hashCode() & 0x7fffffff,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static long nextWeeklyTrigger(String time, JSONArray days, long now) {
        String[] parts = time.split(":");
        int hour = parts.length > 0 ? Integer.parseInt(parts[0]) : 20;
        int minute = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
        Calendar candidate = Calendar.getInstance();
        candidate.setTimeInMillis(now);
        for (int offset = 0; offset <= 7; offset++) {
            Calendar day = (Calendar) candidate.clone();
            day.add(Calendar.DAY_OF_YEAR, offset);
            day.set(Calendar.HOUR_OF_DAY, hour);
            day.set(Calendar.MINUTE, minute);
            day.set(Calendar.SECOND, 0);
            day.set(Calendar.MILLISECOND, 0);
            int calendarDay = day.get(Calendar.DAY_OF_WEEK);
            int jsDay = calendarDay == Calendar.SUNDAY ? 0 : calendarDay - 1;
            if (contains(days, jsDay) && day.getTimeInMillis() > now + 1000) {
                return day.getTimeInMillis();
            }
        }
        return 0;
    }

    private static boolean contains(JSONArray values, int target) {
        for (int index = 0; index < values.length(); index++) {
            if (values.optInt(index, -1) == target) return true;
        }
        return false;
    }

    static void createChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Делікатні нагадування",
                NotificationManager.IMPORTANCE_DEFAULT);
        channel.setDescription("Приватні локальні нагадування Metrika");
        channel.enableVibration(false);
        manager.createNotificationChannel(channel);
    }
}
