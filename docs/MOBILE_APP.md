# Mobile App (Capacitor / Android)

The Android app is a native WebView shell (`np.edvantage.app`) that loads the
deployed site at `https://bnks-2.vercel.app/`. All privileged logic (auth,
admin, scraping, survey writes) runs server-side on Vercel — the shell only
needs internet access.

## Prerequisites

- JDK 21 on PATH (Capacitor 8 targets Java 21). If `JAVA_HOME` points at JDK
  17, override it for the build:
  `$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21.x.x'`
- Android SDK (installing [Android Studio](https://developer.android.com/studio)
  is the easiest way) with `ANDROID_HOME` set
- Node dependencies: `npm install`

## Build a debug APK

```bash
npm run apk:debug
```

Output lands at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Install it on a phone (enable "Install unknown apps" for your file manager /
browser first) or via adb:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

Debug APKs are perfect for demos and testing. A Play Store release additionally
requires a signed release build with a keystore.

## Useful commands

| Command | Action |
|---|---|
| `npm run cap:sync` | Sync web assets + plugin config into the native project |
| `npm run cap:open` | Open the project in Android Studio |
| `npm run apk:debug` | Gradle debug build |

## How it works

`capacitor.config.ts` sets `server.url` to the deployed site, so the WebView
loads the live app instead of bundled static files — this is required because
the platform's API routes (login, admin, scrapers) run server-side and can
never be bundled into the APK.

## Notes

- The phone needs an internet connection; there is no offline mode.
- The hardware back button currently exits the app. If that becomes annoying,
  wire the `@capacitor/app` plugin's `backButton` event to navigate history
  instead.
- Launcher icons are generated from `public/logo.png`; re-run the icon script
  or update the mipmaps manually if the logo changes.
