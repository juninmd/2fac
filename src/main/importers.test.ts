/** @jest-environment node */
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import * as OTPAuth from 'otpauth';
import type Store from 'electron-store';
import { importAuthy, importGoogleAuth, importEncrypted, importPlain } from './importers';
import { getTwoFAItems, setTwoFAItems } from './store';
import { encryptData } from './crypto';
import type { TwoFAItem } from './types';

// electron-store exige o binário do Electron; os testes usam um store em memória.
jest.mock('electron-store', () => class FakeStore {});

const RFC_SECRET_B32 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'; // "12345678901234567890"
const HELLO_B32 = 'JBSWY3DPEHPK3PXP'; // "Hello!\xde\xad\xbe\xef"

const createFakeStore = (): Store => {
    const data = new Map<string, unknown>();
    return {
        has: (k: string) => data.has(k),
        get: (k: string, d?: unknown) => (data.has(k) ? data.get(k) : d),
        set: (k: string, v: unknown) => void data.set(k, v),
        delete: (k: string) => void data.delete(k),
    } as unknown as Store;
};

// Encoder protobuf escrito à mão (independente do protobufjs usado pelo importador).
const varint = (n: number): number[] => {
    const out: number[] = [];
    let v = n;
    while (v > 127) { out.push((v & 127) | 128); v >>>= 7; }
    out.push(v);
    return out;
};
const lenField = (tag: number, bytes: Uint8Array | number[]): number[] => [(tag << 3) | 2, ...varint(bytes.length), ...bytes];
const strField = (tag: number, s: string): number[] => lenField(tag, Buffer.from(s, 'utf-8'));
const intField = (tag: number, n: number): number[] => [(tag << 3) | 0, ...varint(n)];

interface GoogleEntry { secret: Buffer; name?: string; issuer?: string; algorithm?: number; digits?: number; type?: number }
const migrationUri = (entries: GoogleEntry[]): string => {
    const bytes: number[] = [];
    for (const e of entries) {
        const params = [
            ...lenField(1, e.secret),
            ...(e.name ? strField(2, e.name) : []),
            ...(e.issuer ? strField(3, e.issuer) : []),
            ...intField(4, e.algorithm ?? 1),
            ...intField(5, e.digits ?? 1),
            ...intField(6, e.type ?? 2),
        ];
        bytes.push(...lenField(1, params));
    }
    bytes.push(...intField(2, 1), ...intField(3, 1), ...intField(4, 0));
    return `otpauth-migration://offline?data=${encodeURIComponent(Buffer.from(bytes).toString('base64'))}`;
};

describe('importers', () => {
    let dir: string;
    let store: Store;
    const write = async (name: string, content: string): Promise<string> => {
        const p = path.join(dir, name);
        await fs.writeFile(p, content, 'utf-8');
        return p;
    };

    beforeEach(async () => {
        dir = await fs.mkdtemp(path.join(os.tmpdir(), '2fac-import-'));
        store = createFakeStore();
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });
    afterEach(async () => {
        jest.restoreAllMocks();
        await fs.rm(dir, { recursive: true, force: true });
    });

    describe('importGoogleAuth', () => {
        it('importa um item e converte o segredo binário para base32', async () => {
            const file = await write('g.txt', migrationUri([{ secret: Buffer.from('Hello!\xde\xad\xbe\xef', 'latin1'), name: 'alice@example.com', issuer: 'Example' }]));
            expect(await importGoogleAuth(file, store)).toEqual({ success: true, count: 1 });
            expect(getTwoFAItems(store)[0]).toMatchObject({ secret: HELLO_B32, account: 'alice@example.com', issuer: 'Example', algorithm: 'SHA1', digits: 6, period: 30, type: 'totp' });
        });

        it('separa "Emissor:conta" quando o campo issuer vem vazio', async () => {
            const file = await write('g.txt', migrationUri([{ secret: Buffer.from('Hello!\xde\xad\xbe\xef', 'latin1'), name: 'GitHub:juninmd' }]));
            await importGoogleAuth(file, store);
            expect(getTwoFAItems(store)[0]).toMatchObject({ issuer: 'GitHub', account: 'juninmd' });
        });

        it('mapeia SHA256, 8 dígitos e HOTP', async () => {
            const file = await write('g.txt', migrationUri([{ secret: Buffer.from('12345678901234567890'), name: 'a', issuer: 'b', algorithm: 2, digits: 2, type: 1 }]));
            await importGoogleAuth(file, store);
            expect(getTwoFAItems(store)[0]).toMatchObject({ algorithm: 'SHA256', digits: 8, type: 'hotp' });
        });

        it('gera o código esperado pela RFC 6238 com o segredo importado', async () => {
            const file = await write('g.txt', migrationUri([{ secret: Buffer.from('12345678901234567890'), name: 'rfc', issuer: 'RFC', digits: 2 }]));
            await importGoogleAuth(file, store);
            const item = getTwoFAItems(store)[0];
            expect(item.secret).toBe(RFC_SECRET_B32);
            const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(item.secret), digits: item.digits, period: item.period, algorithm: item.algorithm });
            expect(totp.generate({ timestamp: 59_000 })).toBe('94287082');
        });

        it('aceita vários links (um por linha, lotes do Google)', async () => {
            const a = migrationUri([{ secret: Buffer.from('aaaaaaaaaa'), name: 'a', issuer: 'A' }]);
            const b = migrationUri([{ secret: Buffer.from('bbbbbbbbbb'), name: 'b', issuer: 'B' }]);
            const file = await write('g.txt', `${a}\r\n\r\n${b}\n`);
            expect(await importGoogleAuth(file, store)).toEqual({ success: true, count: 2 });
        });

        it('ignora segredos já existentes e duplicados no arquivo', async () => {
            const uri = migrationUri([{ secret: Buffer.from('Hello!\xde\xad\xbe\xef', 'latin1'), name: 'a', issuer: 'A' }]);
            const file = await write('g.txt', `${uri}\n${uri}`);
            expect(await importGoogleAuth(file, store)).toEqual({ success: true, count: 1 });
            expect(await importGoogleAuth(file, store)).toEqual({ success: false, count: 0 });
            expect(getTwoFAItems(store)).toHaveLength(1);
        });

        it('rejeita conteúdo sem o prefixo otpauth-migration', async () => {
            const res = await importGoogleAuth(await write('g.txt', 'otpauth://totp/x?secret=ABC'), store);
            expect(res.success).toBe(false);
            expect(res.error).toMatch(/otpauth-migration/);
        });

        it('falha sem lançar exceção em payload corrompido ou vazio', async () => {
            expect((await importGoogleAuth(await write('c.txt', 'otpauth-migration://offline?data=%%%'), store)).success).toBe(false);
            expect((await importGoogleAuth(await write('v.txt', migrationUri([])), store)).success).toBe(false);
            expect(getTwoFAItems(store)).toHaveLength(0);
        });
    });

    describe('importAuthy', () => {
        it.each([
            ['array', (e: object[]) => e],
            ['{tokens}', (e: object[]) => ({ tokens: e })],
            ['{entries}', (e: object[]) => ({ entries: e })],
            ['{items}', (e: object[]) => ({ items: e })],
        ])('importa JSON no formato %s', async (_n, wrap) => {
            const file = await write('a.json', JSON.stringify(wrap([{ name: 'juninmd', issuer: 'GitHub', secret: HELLO_B32 }, { account: 'x', provider: 'AWS', decrypted_seed: RFC_SECRET_B32 }])));
            expect(await importAuthy(file, store)).toEqual({ success: true, count: 2 });
            expect(getTwoFAItems(store).map(i => i.issuer)).toEqual(['GitHub', 'AWS']);
        });

        it('normaliza segredo com espaços/minúsculas e algoritmo "sha256"', async () => {
            const file = await write('a.json', JSON.stringify([{ name: 'a', issuer: 'b', secret: 'jbsw y3dp ehpk 3pxp', algorithm: 'sha256' }]));
            await importAuthy(file, store);
            expect(getTwoFAItems(store)[0]).toMatchObject({ secret: HELLO_B32, algorithm: 'SHA256' });
        });

        it('rejeita segredos que não são base32 válido', async () => {
            const file = await write('a.json', JSON.stringify([{ name: 'a', secret: 'not-a-valid-secret!!' }, { name: 'b', secret: 'abc1' }]));
            expect(await importAuthy(file, store)).toEqual({ success: false, count: 0 });
        });

        it('usa valores padrão quando dígitos/período são inválidos', async () => {
            const file = await write('a.json', JSON.stringify([{ name: 'a', secret: HELLO_B32, digits: 99, period: -5 }]));
            await importAuthy(file, store);
            expect(getTwoFAItems(store)[0]).toMatchObject({ digits: 6, period: 30 });
        });

        it('importa URIs otpauth:// (TOTP e HOTP) um por linha', async () => {
            const file = await write('a.txt', [
                `otpauth://totp/GitHub:juninmd?secret=${HELLO_B32}&issuer=GitHub&digits=8&period=60`,
                `otpauth://hotp/Bank:me?secret=${RFC_SECRET_B32}&counter=0`,
            ].join('\n'));
            expect(await importAuthy(file, store)).toEqual({ success: true, count: 2 });
            const [t, h] = getTwoFAItems(store);
            expect(t).toMatchObject({ issuer: 'GitHub', digits: 8, period: 60, type: 'totp' });
            expect(h).toMatchObject({ type: 'hotp' });
        });

        it('importa lista simples de segredos, ignorando linhas que não são segredos', async () => {
            const file = await write('a.txt', `# minhas chaves\n${HELLO_B32}\n${RFC_SECRET_B32}\nlinha com espaços e texto\n`);
            expect(await importAuthy(file, store)).toEqual({ success: true, count: 2 });
        });

        it('JSON válido cujos itens são todos duplicados NÃO cai no parser de linhas', async () => {
            setTwoFAItems(store, [{ id: '1', account: 'a', issuer: 'b', secret: HELLO_B32 }]);
            const file = await write('a.json', JSON.stringify([{ name: 'a', issuer: 'b', secret: HELLO_B32 }]));
            expect(await importAuthy(file, store)).toEqual({ success: false, count: 0 });
            expect(getTwoFAItems(store)).toHaveLength(1);
        });

        it('JSON sem itens válidos não vira "segredo" por linha', async () => {
            const file = await write('a.json', '{"version":"1.0.0-beta"}\n');
            expect(await importAuthy(file, store)).toEqual({ success: false, count: 0 });
        });

        it('falha com erro legível quando o arquivo não existe', async () => {
            const res = await importAuthy(path.join(dir, 'nao-existe.json'), store);
            expect(res.success).toBe(false);
            expect(res.error).toBeTruthy();
        });
    });

    describe('importPlain / importEncrypted', () => {
        const items: TwoFAItem[] = [
            { id: 'old1', account: 'a', issuer: 'A', secret: HELLO_B32, algorithm: 'SHA1', digits: 6, period: 30 },
            { id: 'old2', account: 'b', issuer: 'B', secret: RFC_SECRET_B32, color: '#fff', category: 'Trabalho' },
        ];

        it('importa JSON próprio gerando novos ids e preservando campos extras', async () => {
            const file = await write('p.json', JSON.stringify(items));
            expect(await importPlain(file, store)).toEqual({ success: true, count: 2 });
            const saved = getTwoFAItems(store);
            expect(saved.map(i => i.id)).not.toContain('old1');
            expect(saved[1]).toMatchObject({ color: '#fff', category: 'Trabalho' });
        });

        it('importar o mesmo backup duas vezes não duplica contas', async () => {
            const file = await write('p.json', JSON.stringify(items));
            await importPlain(file, store);
            expect(await importPlain(file, store)).toEqual({ success: false, count: 0 });
            expect(getTwoFAItems(store)).toHaveLength(2);
        });

        it('descarta entradas sem segredo válido e rejeita JSON que não é lista', async () => {
            const mixed = await write('m.json', JSON.stringify([...items, { id: 'x', account: 'sem segredo' }, null, 'texto']));
            expect(await importPlain(mixed, store)).toEqual({ success: true, count: 2 });
            const notList = await write('o.json', '{"a":1}');
            expect((await importPlain(notList, createFakeStore())).success).toBe(false);
        });

        it('backup criptografado: round-trip com a senha correta', async () => {
            const file = await write('b.enc', JSON.stringify(await encryptData(JSON.stringify(items), 'senha-forte')));
            expect(await importEncrypted(file, 'senha-forte', store)).toEqual({ success: true, count: 2 });
        });

        it('backup criptografado: senha errada devolve mensagem clara e não importa nada', async () => {
            const file = await write('b.enc', JSON.stringify(await encryptData(JSON.stringify(items), 'senha-forte')));
            const res = await importEncrypted(file, 'errada', store);
            expect(res).toEqual({ success: false, error: 'Senha incorreta ou arquivo corrompido' });
            expect(getTwoFAItems(store)).toHaveLength(0);
        });

        it('backup criptografado: rejeita arquivo que não é backup', async () => {
            expect((await importEncrypted(await write('x.enc', 'lixo'), 'x', store)).success).toBe(false);
            expect((await importEncrypted(await write('y.enc', '{"a":1}'), 'x', store)).success).toBe(false);
        });
    });
});
