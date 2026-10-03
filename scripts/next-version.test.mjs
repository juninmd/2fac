import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { bumpFor, nextVersion } from './next-version.mjs';

test('bumpFor: feat → minor, breaking → major, resto → patch', () => {
    assert.equal(bumpFor(['fix: a', 'chore: b']), 'patch');
    assert.equal(bumpFor(['fix: a', 'feat(ui): b']), 'minor');
    assert.equal(bumpFor(['feat: a', 'refactor!: b']), 'major');
    assert.equal(bumpFor(['feat: a\n\nBREAKING CHANGE: muda API']), 'major');
    assert.equal(bumpFor(['sem convenção']), 'patch');
    assert.equal(bumpFor(['feature: não é feat']), 'patch');
});

test('nextVersion incrementa a partir da última tag', () => {
    assert.deepEqual(nextVersion({ lastTag: 'v1.4.2', messages: ['fix: x'], baseVersion: '1.0.0' }), { release: true, version: '1.4.3', tag: 'v1.4.3', previousTag: 'v1.4.2' });
    assert.equal(nextVersion({ lastTag: 'v1.4.2', messages: ['feat: x'], baseVersion: '1.0.0' }).version, '1.5.0');
    assert.equal(nextVersion({ lastTag: 'v1.4.2', messages: ['feat!: x'], baseVersion: '1.0.0' }).version, '2.0.0');
});

test('nextVersion: primeira versão vem do package.json', () => {
    assert.deepEqual(nextVersion({ lastTag: undefined, messages: ['feat: x'], baseVersion: '1.0.0' }), { release: true, version: '1.0.0', tag: 'v1.0.0', previousTag: '' });
});

test('nextVersion pula sem commits novos ou com [skip release]', () => {
    assert.equal(nextVersion({ lastTag: 'v1.0.0', messages: [], baseVersion: '1.0.0' }).release, false);
    assert.equal(nextVersion({ lastTag: 'v1.0.0', messages: ['docs: x [skip release]'], baseVersion: '1.0.0' }).release, false);
    assert.equal(nextVersion({ lastTag: 'v1.0.0', messages: ['fix: y', 'docs: x [skip release]'], baseVersion: '1.0.0' }).release, true); // só o HEAD conta
});

test('CLI em repositório git real: lê tags e commits', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), '2fac-ver-'));
    const sh = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf-8' });
    const script = path.resolve('scripts/next-version.mjs');
    const run = () => JSON.parse(execFileSync('node', [script], { cwd: dir, encoding: 'utf-8' }));
    sh('init', '-q', '-b', 'main'); sh('config', 'user.email', 't@t'); sh('config', 'user.name', 't');
    writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ version: '1.0.0' }));
    sh('add', '.'); sh('commit', '-q', '-m', 'feat: inicial');
    assert.equal(run().tag, 'v1.0.0');
    sh('tag', 'v1.0.0');
    assert.equal(run().release, false);
    writeFileSync(path.join(dir, 'a.txt'), 'a'); sh('add', '.'); sh('commit', '-q', '-m', 'fix: bug');
    assert.equal(run().tag, 'v1.0.1');
    writeFileSync(path.join(dir, 'b.txt'), 'b'); sh('add', '.'); sh('commit', '-q', '-m', 'feat: recurso');
    assert.equal(run().tag, 'v1.1.0'); // fix + feat desde v1.0.0 → minor
    sh('tag', 'v1.1.0'); sh('tag', 'v1.10.0'); // ordena numericamente, não por texto
    writeFileSync(path.join(dir, 'c.txt'), 'c'); sh('add', '.'); sh('commit', '-q', '-m', 'chore: x');
    assert.equal(run().tag, 'v1.10.1');
    rmSync(dir, { recursive: true, force: true });
});
