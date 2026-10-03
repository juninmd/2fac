// Publica os artefatos de `release/` no GitLab: envia cada arquivo ao Generic Package Registry
// e cria o Release da tag com links `direct_asset_path` (/<arquivo>). O app embute como feed de
// atualização `<projeto>/-/releases/permalink/latest/downloads`, que resolve para esses links.
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PACKAGE_NAME = '2fac';
const SKIPPED = new Set(['builder-debug.yml', 'builder-effective-config.yaml']);

export const versionFromTag = (tag) => {
    const match = /^v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag ?? '');
    if (!match) throw new Error(`Tag inválida "${tag}": use o formato vMAJOR.MINOR.PATCH`);
    return match[1];
};

export const listArtifacts = async (dir) => {
    const files = [];
    for (const entry of await readdir(dir)) {
        const full = path.join(dir, entry);
        if (SKIPPED.has(entry) || !(await stat(full)).isFile()) continue;
        files.push({ name: entry, path: full });
    }
    return files.sort((a, b) => a.name.localeCompare(b.name));
};

const linkType = (name) => (/\.(yml|yaml|blockmap)$/.test(name) ? 'other' : 'package');

export const buildReleasePayload = ({ tag, description, packageBaseUrl, files }) => ({
    name: tag,
    tag_name: tag,
    description,
    assets: {
        links: files.map(({ name }) => ({
            name,
            url: `${packageBaseUrl}/${encodeURIComponent(name)}`,
            direct_asset_path: `/${name}`,
            link_type: linkType(name),
        })),
    },
});

const request = async (url, init, token) => {
    const response = await fetch(url, { ...init, headers: { 'JOB-TOKEN': token, ...init.headers } });
    if (!response.ok) throw new Error(`${init.method} ${url} → ${response.status} ${await response.text()}`);
    return response;
};

export const publish = async ({ apiUrl, projectId, tag, token, dir, description, dryRun = false }) => {
    const version = versionFromTag(tag);
    const files = await listArtifacts(dir);
    if (files.length === 0) throw new Error(`Nenhum artefato encontrado em ${dir}`);
    if (!files.some(f => /^latest.*\.yml$/.test(f.name))) {
        throw new Error('latest*.yml ausente: o auto-update não funcionaria. Verifique a configuração de publish do electron-builder.');
    }

    const packageBaseUrl = `${apiUrl}/projects/${projectId}/packages/generic/${PACKAGE_NAME}/${version}`;
    const payload = buildReleasePayload({ tag, description, packageBaseUrl, files });
    if (dryRun) return payload;

    for (const file of files) {
        console.log(`Enviando ${file.name}…`);
        await request(`${packageBaseUrl}/${encodeURIComponent(file.name)}`, { method: 'PUT', body: await readFile(file.path) }, token);
    }
    await request(`${apiUrl}/projects/${projectId}/releases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }, token);
    return payload;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const env = process.env;
    const tag = env.CI_COMMIT_TAG;
    const payload = await publish({
        apiUrl: env.CI_API_V4_URL,
        projectId: env.CI_PROJECT_ID,
        tag,
        token: env.CI_JOB_TOKEN,
        dir: env.RELEASE_DIR || 'release',
        description: env.RELEASE_NOTES || `Release ${tag}`,
        dryRun: process.argv.includes('--dry-run'),
    });
    console.log(`Release ${tag} publicado com ${payload.assets.links.length} arquivos.`);
}
