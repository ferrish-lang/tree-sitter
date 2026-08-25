import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const parserScript = join(root, 'scripts', 'parse-fixtures.mjs');
const treeSitter = join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tree-sitter.cmd' : 'tree-sitter',
);

function run(command, args) {
  return spawnSync(command, args, { cwd: root, encoding: 'utf8' });
}

const missingRoot = run(process.execPath, [parserScript, '--check', '--root', 'test/fixtures/not-present']);
const missingRootOutput = `${missingRoot.stdout ?? ''}${missingRoot.stderr ?? ''}`;
if (missingRoot.status === 0 || !missingRootOutput.includes('Fixture directory not found')) {
  console.error('Missing fixture-root check did not fail with a direct diagnostic.');
  process.exitCode = 1;
}

const invalidFixture = 'test/fixtures/negative/missing-semicolon.frsh';
const invalid = run(treeSitter, ['parse', invalidFixture]);
const invalidOutput = `${invalid.stdout ?? ''}${invalid.stderr ?? ''}`;
if (invalid.error || !/\b(?:ERROR|MISSING)\b/.test(invalidOutput)) {
  console.error(`Negative fixture did not expose an ERROR or MISSING node: ${invalidFixture}`);
  process.exitCode = 1;
}

if (process.exitCode) process.exit(process.exitCode);
console.log('Negative fixture and missing-root checks passed.');
