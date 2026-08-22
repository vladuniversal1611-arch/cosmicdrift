package com.skydoku.game

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/**
 * Fires when a scheduled reminder alarm goes off: builds and posts the local
 * notification. Tapping it opens the game.
 */
class NotifyReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        val title = intent.getStringExtra("title") ?: "Skydoku"
        val body = intent.getStringExtra("body") ?: ""
        val nid = intent.getIntExtra("nid", 1)

        val launch = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or
            (if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0)
        val contentPi = PendingIntent.getActivity(ctx, nid, launch, flags)

        val notif = NotificationCompat.Builder(ctx, AndroidNotify.CHANNEL_ID)
            .setSmallIcon(ctx.applicationInfo.icon)   // swap for a white ic_stat_* icon for best results
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(contentPi)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        try {
            NotificationManagerCompat.from(ctx).notify(nid, notif)
        } catch (e: SecurityException) {
            // POST_NOTIFICATIONS not granted — nothing to do.
        }
    }
}
