/**
 * Verschlüsselte Ablage für Fotos. Die Kamera/Galerie liefert eine
 * unverschlüsselte Datei im Cache; sie wird sofort verschlüsselt in den
 * App-Dokumentordner übernommen und das Original gelöscht. Fotos verlassen
 * das Gerät nur über die verschlüsselte HTTPS-Verbindung zum Server.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { neueId } from '@/data/rapportSync';
import { bytesZuBase64 } from './bytes';
import { bytesEntschluesseln, bytesVerschluesseln } from './tresor';

export interface FotoAnhang {
  name: string;
  mimeType: string;
  base64: string;
}

function ordner(): Directory {
  return new Directory(Paths.document, 'fotos');
}

function datei(id: string): File {
  return new File(ordner(), `${id}.enc`);
}

/** Übernimmt eine Bilddatei verschlüsselt in den Tresor und liefert die Foto-ID */
export async function fotoAblegen(quellUri: string): Promise<string> {
  if (Platform.OS === 'web') return quellUri; // Web nur zur Entwicklung, dort keine Dateiablage
  const quelle = new File(quellUri);
  const klar = await quelle.bytes();
  const id = neueId();
  ordner().create({ idempotent: true, intermediates: true });
  datei(id).write(bytesVerschluesseln(klar));
  try {
    quelle.delete(); // unverschlüsseltes Original aus dem Cache entfernen
  } catch {
    /* Original gehört evtl. dem System (Galerie) – dann bleibt es dort */
  }
  return id;
}

async function fotoBytes(id: string): Promise<Uint8Array> {
  const f = datei(id);
  if (!f.exists) throw new Error('Foto nicht gefunden.');
  return bytesEntschluesseln(await f.bytes());
}

/** Entschlüsseltes Foto als data-URI für <Image> (bleibt nur im Arbeitsspeicher) */
export async function fotoAnzeigen(id: string): Promise<string> {
  if (Platform.OS === 'web' || id.startsWith('data:') || id.startsWith('blob:')) return id;
  return `data:image/jpeg;base64,${bytesZuBase64(await fotoBytes(id))}`;
}

/** Foto als Anhang für die Übertragung zum Server */
export async function fotoAnhang(id: string, index: number): Promise<FotoAnhang> {
  const base64 = Platform.OS === 'web' ? '' : bytesZuBase64(await fotoBytes(id));
  return { name: `foto-${index + 1}.jpg`, mimeType: 'image/jpeg', base64 };
}

export function fotoLoeschen(id: string): void {
  if (Platform.OS === 'web') return;
  try {
    const f = datei(id);
    if (f.exists) f.delete();
  } catch {
    /* bereits gelöscht */
  }
}

/** Löscht alle Fotos (bei Abmeldung / Gerät bereinigen) */
export function alleFotosLoeschen(): void {
  if (Platform.OS === 'web') return;
  try {
    const o = ordner();
    if (o.exists) o.delete();
  } catch {
    /* nichts vorhanden */
  }
}
