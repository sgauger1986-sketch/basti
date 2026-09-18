import { brueckenSkript, nachrichtParsen, navigationEntscheiden } from '@/huelle/navigation';

const APP = 'https://serene-lichterman.82-165-52-98.plesk.page/';
const HOSTS = ['t.me', 'oauth.telegram.org'];

describe('Navigationsregeln der Hülle', () => {
  test('eigene Domain bleibt in der Hülle', () => {
    expect(navigationEntscheiden(APP, APP, HOSTS)).toBe('intern');
    expect(navigationEntscheiden(`${APP}app/projekte?x=1#a`, APP, HOSTS)).toBe('intern');
    expect(navigationEntscheiden('about:blank', APP, HOSTS)).toBe('intern');
  });
  test('erlaubte Fremd-Hosts inkl. Subdomains bleiben in der Hülle', () => {
    expect(navigationEntscheiden('https://oauth.telegram.org/auth?bot_id=1', APP, HOSTS)).toBe('intern');
    expect(navigationEntscheiden('https://t.me/heywerkibot', APP, HOSTS)).toBe('intern');
    expect(navigationEntscheiden('https://web.t.me/x', APP, HOSTS)).toBe('intern');
  });
  test('fremde Seiten und Telefon/Mail/Telegram gehen ans System', () => {
    expect(navigationEntscheiden('https://www.google.de', APP, HOSTS)).toBe('extern');
    expect(navigationEntscheiden('tel:+4912345', APP, HOSTS)).toBe('extern');
    expect(navigationEntscheiden('mailto:a@b.de', APP, HOSTS)).toBe('extern');
    expect(navigationEntscheiden('tg://resolve?domain=x', APP, HOSTS)).toBe('extern');
  });
  test('Klartext und unbekannte Schemata werden blockiert', () => {
    expect(navigationEntscheiden('http://serene-lichterman.82-165-52-98.plesk.page/', APP, HOSTS)).toBe('blockiert');
    expect(navigationEntscheiden('javascript:alert(1)', APP, HOSTS)).toBe('blockiert');
    expect(navigationEntscheiden('file:///etc/passwd', APP, HOSTS)).toBe('blockiert');
    expect(navigationEntscheiden('https://evil.de@serene-lichterman.82-165-52-98.plesk.page/', APP, HOSTS)).toBe('intern');
    expect(navigationEntscheiden('https://serene-lichterman.82-165-52-98.plesk.page.evil.de/', APP, HOSTS)).toBe('extern');
  });
});

describe('Brücken-Nachrichten', () => {
  test('gültige Nachrichten', () => {
    expect(nachrichtParsen('{"typ":"extern-oeffnen","url":"https://x.de"}')).toEqual({ typ: 'extern-oeffnen', url: 'https://x.de' });
    expect(nachrichtParsen('{"typ":"teilen","text":"Hallo","url":"https://x.de"}')).toEqual({ typ: 'teilen', text: 'Hallo', url: 'https://x.de' });
    expect(nachrichtParsen('{"typ":"haptik","art":"erfolg"}')).toEqual({ typ: 'haptik', art: 'erfolg' });
    expect(nachrichtParsen('{"typ":"push-token-anfordern"}')).toEqual({ typ: 'push-token-anfordern' });
  });
  test('ungültige Nachrichten werden verworfen', () => {
    expect(nachrichtParsen('kein json')).toBeNull();
    expect(nachrichtParsen('{"typ":"extern-oeffnen","url":"javascript:alert(1)"}')).toBeNull();
    expect(nachrichtParsen('{"typ":"unbekannt"}')).toBeNull();
    expect(nachrichtParsen('{"typ":"haptik","art":"explosion"}')).toEqual({ typ: 'haptik', art: undefined });
  });
});

describe('Brückenskript', () => {
  test('enthält App-Info und Telegram-Kompatibilität, ist gültiges JavaScript', () => {
    const js = brueckenSkript({ plattform: 'ios', version: '1.2.3', appName: 'heywerki', pushToken: 'ExponentPushToken[abc]' }, false, '#2f6b4f', '#ffffff');
    expect(js).toContain('"pushToken":"ExponentPushToken[abc]"');
    expect(js).toContain('window.Telegram.WebApp');
    expect(() => new Function(js)).not.toThrow();
  });
});
