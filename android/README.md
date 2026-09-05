# Metrika for Android

Native WebView app with the complete Metrika interface bundled into the APK.
It works offline, stores data only on the device, and does not require an
OpenAI account.

## Local build

Run `npm run build:android-web`, then open the `android` directory in Android
Studio and run the `app` configuration.

## GitHub build

The repository workflow first bundles the current web interface, then builds a
signed debug APK. Open the latest successful
**Build Android APK** run and download the `Metrika-APK` artifact.
