/**
 * ZENTRALE MARKEN-KONFIGURATION
 * ------------------------------
 * Der Produktname wird demnächst geändert. Damit die Umbenennung ein
 * Einzeiler bleibt, ist ALLES Markenbezogene hier gebündelt: App-Name,
 * Slug, URL-Schema, Bundle-IDs, Farben und Texte. Die Datei ist bewusst reines JavaScript, weil der Expo-Config-Loader
 * kein weiteres TypeScript nachladen kann. Sie wird sowohl
 * von der Expo-Konfiguration (app.config.ts) als auch von der App selbst
 * (src/brand.js) gelesen.
 *
 * WICHTIG vor dem ersten Store-Release: `iosBundleId` und `androidPackage`
 * lassen sich nach der Veröffentlichung im App Store / Play Store NICHT mehr
 * ändern. Den endgültigen Namen also VOR dem ersten Upload festlegen.
 */
/** @type {import("./brand").Brand} */
const brand = {
  /** Anzeigename der App (Home-Screen, Login, Über-Seite) */
  name: 'heywerki',
  /** Kurzer Claim unter dem Namen */
  tagline: 'Büro und Baustelle in einer App',
  /** Technischer Kurzname (nur Kleinbuchstaben, Bindestriche erlaubt) */
  slug: 'heywerki',
  /** Deep-Link-Schema, z. B. heywerki://projekt/123 */
  scheme: 'heywerki',
  /** iOS Bundle Identifier (Reverse-Domain) */
  iosBundleId: 'de.heywerki.app',
  /** Android Package Name (Reverse-Domain) */
  androidPackage: 'de.heywerki.app',
  /** Support-Adresse, die auf der Über-Seite angezeigt wird */
  supportEmail: 'support@heywerki.de',
  /** Standard-Server, der beim ersten Start vorgeschlagen wird (leer = nur Demo-Modus) */
  defaultServerUrl: '',
  /** Markenfarben (werden auch für App-Icon und Splash verwendet) */
  colors: {
    primary: '#2f6b4f',
    primaryDark: '#6bbd8f',
    splashBackground: '#2f6b4f',
    androidIconBackground: '#2f6b4f',
  },
};

module.exports = { brand };

