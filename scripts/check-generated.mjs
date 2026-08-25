import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const generatedFiles = ['src/parser.c', 'src/grammar.json', 'src/node-types.json'];
const temporaryRoot = mkdtempSync(join(tmpdir(), 'tree-sitter-ferrish-generate-'));
const treeSitter = join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tree-sitter.cmd' : 'tree-sitter',
);

try {
  mkdirSync(join(temporaryRoot, 'src'));
  for (const file of ['grammar.js', 'tree-sitter.json', 'package.json']) {
    writeFileSync(join(temporaryRoot, file), readFileSync(join(root, file)));
  }

  const result = spawnSync(treeSitter, ['generate'], {
    cwd: temporaryRoot,
    encoding: 'utf8',
  });
  if (result.error || result.status !== 0) {
    console.error(`${result.stdout ?? ''}${result.stderr ?? ''}`);
    console.error('Unable to regenerate parser artifacts with the locked Tree-sitter CLI.');
    process.exitCode = 1;
  } else {
    const drift = generatedFiles.filter((file) => {
      const generated = join(temporaryRoot, file);
      return !existsSync(generated) || !readFileSync(join(root, file)).equals(readFileSync(generated));
    });
    if (drift.length > 0) {
      console.error(`Generated artifacts are out of date: ${drift.join(', ')}`);
      console.error('Run npm run generate, inspect the diff, and commit the regenerated artifacts.');
      process.exitCode = 1;
    } else {
      console.log('Generated artifacts are up to date.');
    }
  }
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
