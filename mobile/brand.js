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
  /**
   * Startmodus der App:
   *  'web' = Hülle um die bestehende heywerki-Web-Oberfläche (webAppUrl)
   *  'erp' = native Bildschirme (Projekte, LVs, Rapporte) mit eigenem Backend
   */
  startModus: 'web',
  /** Adresse der bestehenden Web-Oberfläche, die in der Hülle geladen wird */
  webAppUrl: 'https://serene-lichterman.82-165-52-98.plesk.page/',
  /** Weitere Hosts, die innerhalb der Hülle geöffnet werden dürfen (z. B. Login-Anbieter). Alles andere öffnet den System-Browser. */
  webErlaubteHosts: ['t.me', 'oauth.telegram.org'],
  /** Standard-Server für den ERP-Modus (leer = nur Demo-Modus) */
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

