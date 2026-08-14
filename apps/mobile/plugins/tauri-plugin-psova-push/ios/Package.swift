// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "tauri-plugin-psova-push",
    platforms: [.macOS(.v10_15), .iOS(.v15)],
    products: [
        .library(name: "tauri-plugin-psova-push", type: .static, targets: ["tauri-plugin-psova-push"]),
    ],
    dependencies: [
        .package(name: "Tauri", path: "../.tauri/tauri-api"),
        .package(url: "https://github.com/firebase/firebase-ios-sdk.git", from: "12.0.0"),
    ],
    targets: [
        .target(
            name: "tauri-plugin-psova-push",
            dependencies: [
                .byName(name: "Tauri"),
                .product(name: "FirebaseCore", package: "firebase-ios-sdk"),
                .product(name: "FirebaseMessaging", package: "firebase-ios-sdk"),
            ],
            path: "Sources"
        ),
    ]
)
