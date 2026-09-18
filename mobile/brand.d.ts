/** Typen zu brand.js – die Werte selbst stehen ausschließlich in brand.js. */
export interface Brand {
  readonly name: string;
  readonly tagline: string;
  readonly slug: string;
  readonly scheme: string;
  readonly iosBundleId: string;
  readonly androidPackage: string;
  readonly supportEmail: string;
  readonly startModus: 'web' | 'erp';
  readonly webAppUrl: string;
  readonly webErlaubteHosts: readonly string[];
  readonly defaultServerUrl: string;
  readonly colors: {
    readonly primary: string;
    readonly primaryDark: string;
    readonly splashBackground: string;
    readonly androidIconBackground: string;
  };
}
export const brand: Brand;
