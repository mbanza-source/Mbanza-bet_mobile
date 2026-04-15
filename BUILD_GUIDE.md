# MBANZA BET — Complete Build Guide

This guide covers how to build the Android APK and AAB files using GitHub Actions (100% free).

---

## Method 1: GitHub Actions (Recommended — FREE)

This is the easiest and most reliable method. GitHub provides free build servers that have all the Android SDK, NDK, Java, and compilation tools pre-installed.

### Step 1: Push Code to GitHub

**Option A — Using the "Save to GitHub" button (Easiest)**
1. Click the **"Save to GitHub"** button in the Emergent interface
2. Follow the prompts to create/select a repository
3. The code will be pushed automatically

**Option B — Manual push from your computer**
```bash
# After downloading the project ZIP:
unzip mbanza-bet-standalone.zip
cd mbanza-bet-standalone/frontend

git init
git add .
git commit -m "Initial commit - MBANZA BET"
git remote add origin https://github.com/YOUR_USERNAME/mbanza-bet.git
git branch -M main
git push -u origin main
```

### Step 2: Enable GitHub Actions
1. Go to your GitHub repository
2. Click the **"Actions"** tab
3. If prompted, click **"I understand my workflows, go ahead and enable them"**

### Step 3: Run the Build
1. In the **Actions** tab, click **"Build Android APK & AAB"** in the left sidebar
2. Click the **"Run workflow"** dropdown button (top right)
3. Select the **main** branch
4. Click the green **"Run workflow"** button

### Step 4: Wait for Build to Complete
- The build takes approximately **15-20 minutes**
- You can watch the progress in real-time by clicking on the running workflow
- A green checkmark means success

### Step 5: Download Your APK and AAB
1. Click on the completed workflow run
2. Scroll down to the **"Artifacts"** section at the bottom
3. You will see two downloadable files:
   - **`mbanza-bet-APK`** — Contains `mbanza-bet-release.apk`
   - **`mbanza-bet-AAB`** — Contains `mbanza-bet-release.aab`
4. Click each to download (they download as ZIP files containing the binary)

### Artifact Details
| Artifact Name | Contains | Use For |
|---|---|---|
| `mbanza-bet-APK` | `mbanza-bet-release.apk` | Direct install on any Android device |
| `mbanza-bet-AAB` | `mbanza-bet-release.aab` | Upload to Google Play Store |

---

## Method 2: Build Locally on Your Computer

If you prefer to build on your own machine:

### Prerequisites
- **Node.js 20+** — https://nodejs.org
- **Yarn** — `npm install -g yarn`
- **Java 17 (JDK)** — https://adoptium.net
- **Android Studio** — https://developer.android.com/studio
  - Install Android SDK 34
  - Install Android NDK (latest)
  - Accept all SDK licenses: `sdkmanager --licenses`

### Environment Variables
Set these in your terminal:
```bash
export ANDROID_HOME=$HOME/Android/Sdk   # or wherever your SDK is
export JAVA_HOME=/path/to/java-17
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Build Steps
```bash
cd frontend

# Install dependencies
yarn install

# Generate native Android project
npx expo prebuild --platform android --clean

# Build APK
cd android
chmod +x gradlew
./gradlew assembleRelease

# Build AAB
./gradlew bundleRelease
```

### Find Your Binaries
```bash
# APK location:
android/app/build/outputs/apk/release/app-release.apk

# AAB location:
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Method 3: EAS Build (Expo Cloud — Requires Expo Account)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile apk

# Build AAB
eas build --platform android --profile production
```

Note: EAS free tier has limited builds. Paid tiers offer unlimited builds.

---

## Installing the APK on Android

### Direct Install
1. Transfer `mbanza-bet-release.apk` to your Android phone
2. Open the file on your phone
3. If prompted, enable **"Install from unknown sources"** in Settings
4. Tap **"Install"**
5. Open MBANZA BET

### Via ADB (Developer Mode)
```bash
adb install mbanza-bet-release.apk
```

---

## Publishing AAB to Google Play Store

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app or select existing
3. Go to **Production** > **Create new release**
4. Upload `mbanza-bet-release.aab`
5. Fill in release notes
6. Submit for review

---

## Signing the APK/AAB for Production

For Play Store submission, you need a signed release build:

### Generate a Keystore
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore mbanza-bet-release.keystore \
  -alias mbanza-bet \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

### Configure Signing in `android/app/build.gradle`
After running `npx expo prebuild`, edit `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('mbanza-bet-release.keystore')
            storePassword 'YOUR_STORE_PASSWORD'
            keyAlias 'mbanza-bet'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

Or use GitHub Secrets for the keystore in CI/CD (see advanced workflow below).

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| GitHub Action fails at "Install dependencies" | Make sure `yarn.lock` is committed |
| Gradle build fails with memory error | The workflow uses default 7GB runner, should be fine |
| APK installs but crashes | Check that backend URL in `.env` is correct and accessible |
| "App not installed" error on phone | Uninstall any previous version first |
| AAB rejected by Play Store | Ensure version code is incremented in `app.json` |
