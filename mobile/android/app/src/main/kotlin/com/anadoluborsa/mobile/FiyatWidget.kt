package com.anadoluborsa.mobile

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews

// Ana ekran fiyat widget'ı. Veriyi Flutter tarafı home_widget ile
// "HomeWidgetPreferences" dosyasına yazar; burada okunup çizilir.
// Bilinçli olarak home_widget'ın Kotlin API'sine bağımlı DEĞİL (sürüm bağımsız).
class FiyatWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        val veri = context.getSharedPreferences("HomeWidgetPreferences", Context.MODE_PRIVATE)
        for (id in ids) {
            val v = RemoteViews(context.packageName, R.layout.fiyat_widget)
            v.setTextViewText(R.id.w_ad1, veri.getString("w_ad1", "Fiyatlar için uygulamayı aç"))
            v.setTextViewText(R.id.w_f1, veri.getString("w_f1", ""))
            v.setTextViewText(R.id.w_ad2, veri.getString("w_ad2", ""))
            v.setTextViewText(R.id.w_f2, veri.getString("w_f2", ""))
            v.setTextViewText(R.id.w_ad3, veri.getString("w_ad3", ""))
            v.setTextViewText(R.id.w_f3, veri.getString("w_f3", ""))
            v.setTextViewText(R.id.w_tarih, veri.getString("w_tarih", ""))

            // Dokununca uygulama açılır
            val ac = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (ac != null) {
                val pi = PendingIntent.getActivity(
                    context, 0, ac,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                v.setOnClickPendingIntent(R.id.w_kok, pi)
            }
            manager.updateAppWidget(id, v)
        }
    }
}
