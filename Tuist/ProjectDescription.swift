import ProjectDescription

let project = Project(
    name: "SecureMessenger",
    targets: [
        .target(
            name: "SecureMessenger",
            destinations: .iOS,
            product: .app,
            bundleId: "com.securemessenger.ios",
            infoPlist: .extendingDefault(
                with: [
                    "NSLocalNetworkUsageDescription": "Used for local network communication",
                    "NSBonjourServices": ["_securemessenger._tcp"],
                    "NSExceptionMinimumTLSVersion": "TLSv1.3",
                    "NSRequiresCertificateTransparency": true,
                ]
            ),
            sources: ["Sources/**"],
            resources: ["Resources/**"],
            dependencies: [
                .package(product: "Combine"),
                .package(product: "CryptoKit"),
                .package(product: "LocalAuthentication"),
                .package(product: "Security"),
                .external(name: "libsignal", condition: .when([.ios]))
            ],
            settings: .settings(
                base: [
                    "DEVELOPMENT_TEAM": "YOUR_TEAM_ID",
                    "CODE_SIGN_IDENTITY": "Apple Development",
                    "IPHONEOS_DEPLOYMENT_TARGET": "15.0",
                    "SWIFT_VERSION": "5.9",
                ]
            )
        ),
        .target(
            name: "SecureMessengerTests",
            destinations: .iOS,
            product: .unitTests,
            bundleId: "com.securemessenger.ios.tests",
            sources: ["Tests/**"],
            dependencies: ["SecureMessenger"]
        ),
    ]
)
