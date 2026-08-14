use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::{Error, RegistrationResponse};

pub fn init<R: Runtime, C: DeserializeOwned>(app: &AppHandle<R>, _api: PluginApi<R, C>) -> crate::Result<PsovaPush<R>> {
  Ok(PsovaPush(app.clone()))
}

pub struct PsovaPush<R: Runtime>(#[allow(dead_code)] AppHandle<R>);

impl<R: Runtime> PsovaPush<R> {
  pub fn get_registration(&self) -> crate::Result<RegistrationResponse> {
    Err(Error::UnsupportedPlatform)
  }
}
