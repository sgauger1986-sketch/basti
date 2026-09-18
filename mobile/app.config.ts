import type { ExpoConfig } from 'expo/config';
import { brand } from './brand';

const config: ExpoConfig = {
  name: brand.name,
  slug: brand.slug,
  scheme: brand.scheme,
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: brand.iosBundleId,
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription:
        `${brand.name} nutzt die Kamera, um Fotos zu Rapporten und Baustellen aufzunehmen.`,
      NSPhotoLibraryUsageDescription:
        `${brand.name} greift auf Ihre Fotos zu, um Bilder an Rapporte anzuhängen.`,
      NSLocationWhenInUseUsageDescription:
        `${brand.name} verwendet Ihren Standort, um Rapporte der richtigen Baustelle zuzuordnen.`,
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: brand.androidPackage,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: brand.colors.androidIconBackground,
    },
    permissions: ['CAMERA', 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-image-picker',
      {
        cameraPermission: `${brand.name} nutzt die Kamera für Baustellenfotos.`,
        photosPermission: `${brand.name} greift auf Ihre Fotos zu, um Bilder an Rapporte anzuhängen.`,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: `${brand.name} verwendet Ihren Standort für Rapporte.`,
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 180,
        resizeMode: 'contain',
        backgroundColor: brand.colors.splashBackground,
      },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: {
    brandName: brand.name,
    eas: {
      // Nach `eas init` wird hier die Projekt-ID eingetragen.
      // projectId: '00000000-0000-0000-0000-000000000000',
    },
  },
};

export default config;
