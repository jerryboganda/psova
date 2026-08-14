fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new().app_manifest(
            tauri_build::AppManifest::new().commands(&[
                "app_info",
                "validate_external_url",
                "journal_feature_enabled",
            ]),
        ),
    )
    .expect("failed to build PSOVA Tauri application");
}
