# Running the App on Android

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Android Studio](https://developer.android.com/studio) with Android SDK installed
- Java Development Kit (JDK 17+)
- React Native CLI: `npm install -g @react-native-community/cli`

Install project dependencies:

```bash
npm install
```

---

## Option 1: Android Emulator

1. Open Android Studio and launch **Virtual Device Manager** (AVD Manager).
2. Create or start an emulator with **API 24 or higher** (minSdkVersion is 24).
3. Confirm the emulator is running:

   ```bash
   adb devices
   ```

4. Start the Metro bundler:

   ```bash
   npm start
   ```

5. In a separate terminal, run on Android:

   ```bash
   npm run android
   ```

> **Note:** BLE (Bluetooth Low Energy) does **not** work on Android emulators. Use a physical device to test BLE scanning and device control.

---

## Option 2: Physical Device via USB (ADB)

### Enable Developer Mode on the device

1. Go to **Settings → About phone**.
2. Tap **Build number** 7 times to unlock developer options.
3. Go to **Settings → Developer options** and enable:
   - **USB debugging**

### Connect and verify

```bash
# Connect your device via USB, then verify it is listed
adb devices
```

The device should appear as `device` (not `unauthorized`). If it shows `unauthorized`, accept the RSA key prompt on the phone.

### Run the app

```bash
npm start          # Start Metro bundler
npm run android    # Build and install on the connected device
```

---

## Option 3: Wireless Debugging (ADB over Wi-Fi)

Requires Android 11+ on the device.

1. Connect the device via USB and pair it first:

   ```bash
   adb pair <ip>:<port>
   ```

   The IP and port are shown under **Settings → Developer options → Wireless debugging → Pair device with pairing code**.

2. After pairing, connect:

   ```bash
   adb connect <ip>:<port>
   ```

3. Verify:

   ```bash
   adb devices
   ```

4. Unplug USB and run:

   ```bash
   npm run android
   ```

---

## Useful ADB Commands

| Command | Description |
|---|---|
| `adb devices` | List connected devices/emulators |
| `adb logcat` | Stream device logs |
| `adb logcat *:E` | Show only error logs |
| `adb reverse tcp:8081 tcp:8081` | Forward Metro port (needed if app can't connect to bundler) |
| `adb install app-release.apk` | Install a built APK manually |
| `adb kill-server` | Restart ADB server if devices are not detected |
| `adb start-server` | Start ADB server |

---

## Troubleshooting

**Metro bundler port conflict:**
```bash
npm run start:reset   # Clears Metro cache and restarts
```

**Device not detected:**
```bash
adb kill-server
adb start-server
adb devices
```

**App installs but crashes immediately:**
- Check logs with `adb logcat` or in Android Studio's **Logcat** tab.

**BLE permissions denied:**
- Ensure the device is running Android 6+ and that Location and Bluetooth permissions are granted at runtime.
- On Android 12+, `BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT` permissions are required.
