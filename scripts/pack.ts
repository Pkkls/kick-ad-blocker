import { mkdirSync, readdirSync, statSync, existsSync, rmSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const DIST = resolve(ROOT, 'dist');
const RELEASE = resolve(ROOT, 'release');

interface PackageJson {
  version: string;
}

async function main(): Promise<void> {
  if (!existsSync(DIST)) {
    console.error('dist/ does not exist. Run `npm run build` first.');
    process.exit(1);
  }
  if (!existsSync(RELEASE)) mkdirSync(RELEASE, { recursive: true });

  const pkg = JSON.parse(await readFile(resolve(ROOT, 'package.json'), 'utf8')) as PackageJson;
  const tag = process.env.BROWSER === 'firefox' ? 'firefox' : 'chromium';
  const zipName = `kick-ad-blocker-${pkg.version}-${tag}.zip`;
  const zipPath = resolve(RELEASE, zipName);

  if (existsSync(zipPath)) rmSync(zipPath);

  await zipDir(DIST, zipPath);

  const sha = sha256(zipPath);
  console.info(`Packed: ${relative(ROOT, zipPath)} (${sha.slice(0, 12)}...)`);
}

function sha256(path: string): string {
  const hash = createHash('sha256');
  hash.update(readFileSync(path));
  return hash.digest('hex');
}

function zipDir(dir: string, outPath: string): Promise<void> {
  return new Promise((resolveOk, reject) => {
    if (process.platform === 'win32') {
      const ps = spawn('powershell', [
        '-NoLogo',
        '-NoProfile',
        '-Command',
        `Compress-Archive -Path '${join(dir, '*')}' -DestinationPath '${outPath}' -Force`,
      ]);
      ps.on('exit', (code) => (code === 0 ? resolveOk() : reject(new Error(`zip exit ${code ?? '?'}`))));
      ps.on('error', reject);
      return;
    }
    const zip = spawn('zip', ['-r', '-X', outPath, '.'], { cwd: dir });
    zip.on('exit', (code) => (code === 0 ? resolveOk() : reject(new Error(`zip exit ${code ?? '?'}`))));
    zip.on('error', reject);
  });
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
