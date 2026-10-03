import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { versionFromTag, buildReleasePayload, publish } from './gitlab-release.mjs';

const makeDir = async (names) => {
    const dir = await mkdtemp(path.join(os.tmpdir(), '2fac-rel-'));
    for (const n of names) await writeFile(path.join(dir, n), `conteudo ${n}`);
    await mkdir(path.join(dir, 'linux-unpacked'));
    await writeFile(path.join(dir, 'builder-debug.yml'), 'x');
    return dir;
};

test('versionFromTag aceita semver com prefixo v e rejeita o resto', () => {
    assert.equal(versionFromTag('v1.2.3'), '1.2.3');
    assert.equal(versionFromTag('v1.2.3-beta.1'), '1.2.3-beta.1');
    for (const bad of ['1.2.3', 'v1.2', 'latest', undefined]) assert.throws(() => versionFromTag(bad));
});

test('buildReleasePayload gera direct_asset_path e tipos de link', () => {
    const p = buildReleasePayload({ tag: 'v1.0.0', description: 'd', packageBaseUrl: 'https://gl/api/pkg', files: [{ name: 'latest.yml' }, { name: '2fac setup.exe' }] });
    assert.deepEqual(p.assets.links[0], { name: 'latest.yml', url: 'https://gl/api/pkg/latest.yml', direct_asset_path: '/latest.yml', link_type: 'other' });
    assert.equal(p.assets.links[1].url, 'https://gl/api/pkg/2fac%20setup.exe');
    assert.equal(p.assets.links[1].link_type, 'package');
});

test('publish ignora diretórios/debug, exige latest*.yml e faz dry-run sem rede', async () => {
    const dir = await makeDir(['2fac-1.0.0-linux-x86_64.AppImage', 'latest-linux.yml']);
    const payload = await publish({ apiUrl: 'http://x/api/v4', projectId: '7', tag: 'v1.0.0', token: 't', dir, description: 'd', dryRun: true });
    assert.deepEqual(payload.assets.links.map(l => l.name), ['2fac-1.0.0-linux-x86_64.AppImage', 'latest-linux.yml']);
    const noYml = await makeDir(['app.AppImage']);
    await assert.rejects(publish({ apiUrl: 'http://x', projectId: '7', tag: 'v1.0.0', token: 't', dir: noYml, description: 'd', dryRun: true }), /latest\*\.yml ausente/);
    await rm(dir, { recursive: true }); await rm(noYml, { recursive: true });
});

test('publish envia arquivos com JOB-TOKEN e cria o release', async () => {
    const calls = [];
    const server = http.createServer((req, res) => {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => { calls.push({ method: req.method, url: req.url, token: req.headers['job-token'], body: Buffer.concat(chunks).toString() }); res.writeHead(201).end('{}'); });
    });
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const apiUrl = `http://127.0.0.1:${server.address().port}/api/v4`;
    const dir = await makeDir(['latest.yml', '2fac-1.0.0-win-x64-setup.exe']);
    await publish({ apiUrl, projectId: '42', tag: 'v1.0.0', token: 'secret', dir, description: 'notas' });
    server.close();

    assert.deepEqual(calls.map(c => `${c.method} ${c.url}`), [
        'PUT /api/v4/projects/42/packages/generic/2fac/1.0.0/2fac-1.0.0-win-x64-setup.exe',
        'PUT /api/v4/projects/42/packages/generic/2fac/1.0.0/latest.yml',
        'POST /api/v4/projects/42/releases',
    ]);
    assert.ok(calls.every(c => c.token === 'secret'));
    assert.equal(calls[1].body, 'conteudo latest.yml');
    const release = JSON.parse(calls[2].body);
    assert.equal(release.tag_name, 'v1.0.0');
    assert.equal(release.assets.links.length, 2);
    await rm(dir, { recursive: true });
});

test('publish propaga erro HTTP', async () => {
    const server = http.createServer((_req, res) => res.writeHead(401).end('unauthorized'));
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const dir = await makeDir(['latest.yml']);
    await assert.rejects(publish({ apiUrl: `http://127.0.0.1:${server.address().port}`, projectId: '1', tag: 'v1.0.0', token: 'bad', dir, description: 'd' }), /401/);
    server.close(); await rm(dir, { recursive: true });
});
