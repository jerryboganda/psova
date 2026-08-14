import FirebaseCore
import FirebaseMessaging
import SwiftRs
import Tauri
import UIKit

class PsovaPushPlugin: Plugin {
  @objc public func getRegistration(_ invoke: Invoke) throws {
    DispatchQueue.main.async {
      if FirebaseApp.app() == nil {
        guard Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil else {
          invoke.reject("Firebase is not configured for this iOS build")
          return
        }
        FirebaseApp.configure()
      }
      UIApplication.shared.registerForRemoteNotifications()
      Messaging.messaging().token { token, error in
        guard error == nil, let token = token, !token.isEmpty else {
          invoke.reject("Firebase registration token is unavailable")
          return
        }
        invoke.resolve(["token": token, "platform": "ios"])
      }
    }
  }
}

@_cdecl("init_plugin_psova_push")
func initPlugin() -> Plugin {
  PsovaPushPlugin()
}
