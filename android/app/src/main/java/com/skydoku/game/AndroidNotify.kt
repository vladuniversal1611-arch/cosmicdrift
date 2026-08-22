package com.skydoku.game

import android.app.Activity
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.webkit.JavascriptInterface
import androidx.core.app.NotificationManagerCompat

/**
 * JS bridge for LOCAL re-engagement notifications. The game (JS) calls
 * `window.AndroidNotify.*` (see src/systems/notifications/NotificationSystem.js):
 * it schedules a few "come back and play" reminders when the player leaves and
 * cancels them when they return. Everything is on-device — no server needed.
 *
 * Wire it in MainActivity:
 *   notify = AndroidNotify(this)
 *   webView.addJavascriptInterface(notify, "AndroidNotify")
 */
class AndroidNotify(private val activity: Activity) {

    companion object {
        const val CHANNEL_ID = "skydoku_reminders"
        private const val REQ_BASE = 4200
        // Every reminder id the JS side uses (so cancelAll can clear them).
        private val IDS = listOf("gift", "miss", "levels")
        private fun flags(): Int =
            PendingIntent.FLAG_UPDATE_CURRENT or
                (if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0)
    }

    init { createChannel() }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val ch = NotificationChannel(CHANNEL_ID, "Reminders", NotificationManager.IMPORTANCE_DEFAULT)
            ch.description = "Reminders to come back and play"
            activity.getSystemService(NotificationManager::class.java).createNotificationChannel(ch)
        }
    }

    @JavascriptInterface
    fun available(): String = "1"

    /** Ask for the POST_NOTIFICATIONS runtime permission (Android 13+). */
    @JavascriptInterface
    fun requestPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            activity.runOnUiThread {
                activity.requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 777)
            }
        }
    }

    /** Schedule a local notification `delaySeconds` from now. */
    @JavascriptInterface
    fun schedule(id: String, delaySeconds: Int, title: String, body: String) {
        val ctx = activity.applicationContext
        val intent = Intent(ctx, NotifyReceiver::class.java).apply {
            putExtra("title", title)
            putExtra("body", body)
            putExtra("nid", id.hashCode())
        }
        val pi = PendingIntent.getBroadcast(ctx, REQ_BASE + id.hashCode(), intent, flags())
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val at = System.currentTimeMillis() + delaySeconds.toLong() * 1000L
        // Inexact + Doze-friendly (no exact-alarm permission needed).
        if (Build.VERSION.SDK_INT >= 23) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
        else am.set(AlarmManager.RTC_WAKEUP, at, pi)
    }

    /** Drop every pending reminder + any already-posted ones. */
    @JavascriptInterface
    fun cancelAll() {
        val ctx = activity.applicationContext
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        for (id in IDS) {
            val pi = PendingIntent.getBroadcast(ctx, REQ_BASE + id.hashCode(), Intent(ctx, NotifyReceiver::class.java), flags())
            am.cancel(pi)
        }
        NotificationManagerCompat.from(ctx).cancelAll()
    }
}
