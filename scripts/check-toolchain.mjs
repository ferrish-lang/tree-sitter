import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const expectedNode = readFileSync(resolve(root, '.node-version'), 'utf8').trim();
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const expectedNpm = packageJson.packageManager.replace(/^npm@/, '');
const actualNpm = spawnSync('npm', ['--version'], { encoding: 'utf8' });

if (process.versions.node !== expectedNode) {
  console.error(`Node ${expectedNode} is required; found ${process.versions.node}.`);
  process.exitCode = 1;
}

if (actualNpm.error || actualNpm.status !== 0) {
  console.error('Unable to read the installed npm version.');
  process.exitCode = 1;
} else if (actualNpm.stdout.trim() !== expectedNpm) {
  console.error(`npm ${expectedNpm} is required; found ${actualNpm.stdout.trim()}.`);
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log(`Toolchain OK: Node ${expectedNode}, npm ${expectedNpm}.`);
}
