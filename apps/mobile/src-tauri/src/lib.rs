use serde::Serialize;
use tauri_plugin_sql::{Migration, MigrationKind};
use url::Url;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AppInfo {
    version: &'static str,
    product_name: &'static str,
    schema_version: u8,
}

#[tauri::command]
fn app_info() -> AppInfo {
    AppInfo {
        version: env!("CARGO_PKG_VERSION"),
        product_name: "PSOVA",
        schema_version: 1,
    }
}

#[tauri::command]
fn journal_feature_enabled() -> bool {
    false
}

#[tauri::command]
fn validate_external_url(raw: String) -> Result<String, String> {
    let parsed = Url::parse(&raw).map_err(|_| "Invalid URL".to_string())?;
    let allowed = match parsed.scheme() {
        "tel" | "mailto" | "geo" | "psova" => true,
        "https" => parsed
            .host_str()
            .map(|host| {
                host == "wa.me"
                    || host == "www.google.com"
                    || host == "maps.google.com"
                    || host == "psova.org.pk"
                    || host == "www.psova.org.pk"
                    || host == "hospitals.aku.edu"
                    || host.ends_with(".edu.pk")
                    || host.ends_with(".org.pk")
            })
            .unwrap_or(false),
        _ => false,
    };

    if allowed {
        Ok(parsed.to_string())
    } else {
        Err("URL destination is not allowed".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_psova_mobile_tables",
        sql: include_str!("migration.sql"),
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:psova.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_haptics::init())
        .plugin(tauri_plugin_biometric::init())
        .plugin(tauri_plugin_psova_push::init())
        .invoke_handler(tauri::generate_handler![
            app_info,
            validate_external_url,
            journal_feature_enabled
        ])
        .run(tauri::generate_context!())
        .expect("error while running PSOVA mobile");
}
