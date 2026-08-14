use tauri::{
  plugin::{Builder, TauriPlugin},
  Manager, Runtime,
};

pub use models::*;
#[cfg(desktop)] mod desktop;
#[cfg(mobile)] mod mobile;
mod commands;
mod error;
mod models;
pub use error::{Error, Result};
#[cfg(desktop)] use desktop::PsovaPush;
#[cfg(mobile)] use mobile::PsovaPush;

pub trait PsovaPushExt<R: Runtime> {
  fn psova_push(&self) -> &PsovaPush<R>;
}
impl<R: Runtime, T: Manager<R>> PsovaPushExt<R> for T {
  fn psova_push(&self) -> &PsovaPush<R> { self.state::<PsovaPush<R>>().inner() }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("psova-push")
    .invoke_handler(tauri::generate_handler![commands::get_registration])
    .setup(|app, api| {
      #[cfg(mobile)] let psova_push = mobile::init(app, api)?;
      #[cfg(desktop)] let psova_push = desktop::init(app, api)?;
      app.manage(psova_push);
      Ok(())
    })
    .build()
}
