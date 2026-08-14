use serde::de::DeserializeOwned;
use tauri::{
  plugin::{PluginApi, PluginHandle},
  AppHandle, Runtime,
};

use crate::RegistrationResponse;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_psova_push);

pub fn init<R: Runtime, C: DeserializeOwned>(
  _app: &AppHandle<R>,
  api: PluginApi<R, C>,
) -> crate::Result<PsovaPush<R>> {
  #[cfg(target_os = "android")]
  let handle = api.register_android_plugin("pk.org.psova.mobile.push", "PsovaPushPlugin")?;
  #[cfg(target_os = "ios")]
  let handle = api.register_ios_plugin(init_plugin_psova_push)?;
  Ok(PsovaPush(handle))
}

pub struct PsovaPush<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> PsovaPush<R> {
  pub fn get_registration(&self) -> crate::Result<RegistrationResponse> {
    self.0.run_mobile_plugin("getRegistration", ()).map_err(Into::into)
  }
}
