use tauri::{command, AppHandle, Runtime};

use crate::{PsovaPushExt, RegistrationResponse, Result};

#[command]
pub(crate) async fn get_registration<R: Runtime>(app: AppHandle<R>) -> Result<RegistrationResponse> {
  app.psova_push().get_registration()
}
