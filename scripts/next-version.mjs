// Calcula a próxima versão semântica a partir dos Conventional Commits desde a última tag vX.Y.Z.
//   feat → minor · "tipo!:" ou "BREAKING CHANGE:" → major · qualquer outro commit → patch
// Sem tags anteriores, a primeira versão é a do package.json. `[skip release]` no commit pula.
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const TAG_RE = /^v(\d+)\.(\d+)\.(\d+)$/;
const SKIP_RE = /\[(skip release|skip ci|ci skip)\]/i;

export const bumpFor = (messages) => {
    let bump = 'patch';
    for (const message of messages) {
        const subject = message.split('\n')[0];
        if (/^[a-z]+(\([^)]*\))?!:/.test(subject) || /^BREAKING[ -]CHANGE:/m.test(message)) return 'major';
        if (/^feat(\([^)]*\))?:/.test(subject)) bump = 'minor';
    }
    return bump;
};

export const applyBump = (version, bump) => {
    const [major, minor, patch] = version;
    if (bump === 'major') return [major + 1, 0, 0];
    if (bump === 'minor') return [major, minor + 1, 0];
    return [major, minor, patch + 1];
};

/** Resultado: { release: false, reason } ou { release: true, tag, version, previousTag }. */
export const nextVersion = ({ lastTag, messages, baseVersion }) => {
    if (messages.length === 0 && lastTag) return { release: false, reason: 'Nenhum commit novo desde a última tag.' };
    if (messages[0] && SKIP_RE.test(messages[0].split('\n')[0])) return { release: false, reason: 'Commit marcado com [skip release].' };

    let version;
    if (lastTag) {
        const [, major, minor, patch] = TAG_RE.exec(lastTag);
        version = applyBump([+major, +minor, +patch], bumpFor(messages));
    } else {
        version = baseVersion.split('.').map(Number);
    }
    const text = version.join('.');
    return { release: true, version: text, tag: `v${text}`, previousTag: lastTag ?? '' };
};

const git = (...args) => execFileSync('git', args, { encoding: 'utf-8' }).trim();

export const readGitState = () => {
    const tags = git('tag', '--merged', 'HEAD', '--list', 'v*.*.*', '--sort=-v:refname').split('\n').filter(t => TAG_RE.test(t));
    const lastTag = tags[0];
    const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
    // messages[0] é o HEAD: só ele pode pular o release; todos entram no cálculo do bump
    const messages = git('log', range, '--format=%B%x00').split('\0').map(m => m.trim()).filter(Boolean);
    return { lastTag, messages };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const baseVersion = JSON.parse(readFileSync('package.json', 'utf-8')).version;
    const result = nextVersion({ ...readGitState(), baseVersion });
    console.log(JSON.stringify(result));
    if (process.env.GITHUB_OUTPUT) {
        const lines = Object.entries(result).map(([k, v]) => `${k}=${v}`).join('\n');
        appendFileSync(process.env.GITHUB_OUTPUT, `${lines}\n`);
    }
}
