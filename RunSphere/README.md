RunSphere is an [**Expo**](https://expo.dev) React Native app. The project is configured to run in Expo Go for mobile preview, while EAS is available for cloud builds and future standalone releases.

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, start the Expo dev server from the app root:

```sh
npm start
```

## Step 2: Open it on your phone

Open the project in Expo Go by scanning the QR code shown in the Expo terminal or by using the tunnel option if your device is on a different network:

```sh
npm run start -- --tunnel
```

You can also launch a local Android preview from Expo if you want to test on an emulator:

```sh
npm run android
```

For production or shareable builds, use EAS:

```sh
npm run eas:build
```

## Step 3: Modify your app

Open `App.tsx` in your text editor of choice and make changes. Expo Go will refresh automatically through [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Expo Go**: Shake the device and tap **Reload**, or use the developer menu from the Expo client.

## Congratulations! :tada:

You've successfully run and modified your Expo app.

### Now what?

- If you want to create a standalone build, use EAS Build.
- If you're curious to learn more about Expo, check out the [docs](https://docs.expo.dev/).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Expo troubleshooting](https://docs.expo.dev/troubleshooting/overview/) page.

# Learn More

To learn more about Expo and React Native, take a look at the following resources:

- [Expo Documentation](https://docs.expo.dev/) - learn how Expo Go and EAS work.
- [React Native Website](https://reactnative.dev) - learn more about React Native.
