import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const check = process.argv.includes('--check');
const rootArgumentIndex = process.argv.indexOf('--root');
const fixtureRoot = resolve(
  root,
  rootArgumentIndex === -1 ? 'test/fixtures/valid' : process.argv[rootArgumentIndex + 1],
);
const treeSitter = join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tree-sitter.cmd' : 'tree-sitter',
);

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function findFixtures(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findFixtures(path);
    return entry.isFile() && entry.name.endsWith('.frsh') ? [path] : [];
  });
}

if (!existsSync(fixtureRoot) || !statSync(fixtureRoot).isDirectory()) {
  fail(`Fixture directory not found: ${relative(root, fixtureRoot)}`);
} else {
  const fixtures = findFixtures(fixtureRoot).sort();
  if (fixtures.length === 0) {
    fail(`No .frsh fixtures found under: ${relative(root, fixtureRoot)}`);
  }

  for (const fixture of fixtures) {
    const fixturePath = relative(root, fixture);
    const result = spawnSync(treeSitter, ['parse', '--grammar-path', '.', fixturePath], {
      cwd: root,
      encoding: 'utf8',
    });
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    process.stdout.write(`\n### ${fixturePath}\n${output}`);

    if (result.error || result.status !== 0) {
      fail(`Fixture parser command failed: ${fixturePath}`);
      continue;
    }
    if (check && /\b(?:ERROR|MISSING)\b/.test(output)) {
      fail(`Fixture parse output contains ERROR or MISSING nodes: ${fixturePath}`);
    }
  }
}

if (check && existsSync(fixtureRoot)) {
  for (const fixture of findFixtures(fixtureRoot)) {
    if (!readFileSync(fixture, 'utf8').trim()) {
      fail(`Fixture is empty: ${relative(root, fixture)}`);
    }
  }
}
