package pk.org.psova.mobile.push

import android.app.Activity
import android.content.Intent
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging

@TauriPlugin
class PsovaPushPlugin(private val activity: Activity) : Plugin(activity) {
  @Command
  fun getRegistration(invoke: Invoke) {
    if (FirebaseApp.getApps(activity).isEmpty() && FirebaseApp.initializeApp(activity) == null) {
      invoke.reject("Firebase is not configured for this Android build")
      return
    }
    FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
      if (!task.isSuccessful || task.result.isNullOrBlank()) {
        invoke.reject("Firebase registration token is unavailable")
        return@addOnCompleteListener
      }
      val response = JSObject()
      response.put("token", task.result)
      response.put("platform", "android")
      invoke.resolve(response)
    }
  }

  override fun onNewIntent(intent: Intent) {
    intent.getStringExtra("deepLink")?.let { deepLink ->
      val payload = JSObject()
      payload.put("deepLink", deepLink)
      trigger("notificationOpened", payload)
    }
  }
}
