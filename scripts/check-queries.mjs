import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const queryDirectory = join(root, 'queries');
const sample = join(root, 'examples', 'query-smoke.frsh');
const treeSitter = join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tree-sitter.cmd' : 'tree-sitter',
);
const expectations = {
  'highlights.scm': [
    ['control keyword', 'keyword.control'],
    ['declaration keyword', 'keyword.declaration'],
    ['string', 'string'],
    ['type', 'type'],
    ['function', 'function'],
    ['property', 'property'],
  ],
  'locals.scm': [
    ['definition', 'local.definition.variable'],
    ['reference', 'local.reference'],
  ],
  'folds.scm': [['fold', 'fold']],
  'indents.scm': [['indent', 'indent']],
};

function runQuery(queryPath) {
  return spawnSync(treeSitter, ['query', '--grammar-path', '.', '--captures', queryPath, sample], {
    cwd: root,
    encoding: 'utf8',
  });
}

function captureNames(output) {
  const normalized = output.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '');
  return new Set(
    [...normalized.matchAll(/capture:\s*\d+\s+-\s*([^,\s]+)\s*,\s*start:/g)].map(
      (match) => match[1],
    ),
  );
}

let failed = false;
for (const name of readdirSync(queryDirectory).filter((entry) => entry.endsWith('.scm')).sort()) {
  const queryPath = join(queryDirectory, name);
  const result = runQuery(queryPath);
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  let queryPassed = true;
  if (result.error || result.status !== 0) {
    console.error(`Query failed to compile or execute: ${name}`);
    console.error(output);
    failed = true;
    queryPassed = false;
    continue;
  }

  if (/\b(?:ERROR|MISSING)\b/.test(output)) {
    console.error(`Query sample did not parse cleanly: ${name}`);
    failed = true;
    queryPassed = false;
  }

  if (!expectations[name]) {
    console.error(`No capture expectations are registered for shipped query: ${name}`);
    failed = true;
    queryPassed = false;
    continue;
  }

  const captures = captureNames(output);
  for (const [label, capture] of expectations[name]) {
    if (!captures.has(capture)) {
      console.error(`Query ${name} did not produce the ${label} capture ${capture}.`);
      failed = true;
      queryPassed = false;
    }
  }
  if (queryPassed) console.log(`Query captures OK: ${name}`);
}

const invalid = runQuery(join(root, 'test', 'query', 'invalid-node.scm'));
if (invalid.error || invalid.status === 0) {
  console.error('Invalid query fixture unexpectedly compiled.');
  failed = true;
} else {
  console.log('Invalid query fixture failed as expected.');
}

if (failed) process.exit(1);
