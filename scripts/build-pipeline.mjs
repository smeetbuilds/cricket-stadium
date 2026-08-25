import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_STAGES, TRANSFORM_STAGES, VALIDATION_STAGES } from './pipeline-stages.mjs';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptsDir, '..');
const outputPath = resolve(root, 'dist', 'index.html');

function fail(message) {
  console.error(`Phase-16 pipeline error: ${message}`);
  process.exit(1);
}

function digestOutput() {
  if (!existsSync(outputPath)) return null;
  return createHash('sha256').update(readFileSync(outputPath)).digest('hex');
}

const expectedStageCount = TRANSFORM_STAGES.length + VALIDATION_STAGES.length;
if (ALL_STAGES.length !== expectedStageCount) fail('stage manifest length is inconsistent');
if (new Set(ALL_STAGES).size !== ALL_STAGES.length) fail('duplicate build stage detected');
if (TRANSFORM_STAGES.some(stage => stage.startsWith('validate-'))) fail('validator listed as a transform');
if (VALIDATION_STAGES.some(stage => !stage.startsWith('validate-'))) fail('non-validator listed in validation phase');
if (VALIDATION_STAGES.at(-1) !== 'validate-regression-suite.mjs') fail('final regression suite must run last');

for (const stage of ALL_STAGES) {
  if (!existsSync(resolve(scriptsDir, stage))) fail(`missing stage file: scripts/${stage}`);
}

for (let index = 0; index < TRANSFORM_STAGES.length; index++) {
  const stage = TRANSFORM_STAGES[index];
  console.log(`\n[transform ${index + 1}/${TRANSFORM_STAGES.length}] ${stage}`);
  const result = spawnSync(process.execPath, [resolve(scriptsDir, stage)], {
    cwd: root,
    env: { ...process.env, MOTERA_BUILD_PIPELINE: '1' },
    stdio: 'inherit'
  });
  if (result.error) fail(`${stage} could not start: ${result.error.message}`);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync(outputPath)) fail('transform phase did not produce dist/index.html');

for (let index = 0; index < VALIDATION_STAGES.length; index++) {
  const stage = VALIDATION_STAGES[index];
  const before = digestOutput();
  console.log(`\n[validate ${index + 1}/${VALIDATION_STAGES.length}] ${stage}`);
  const result = spawnSync(process.execPath, [resolve(scriptsDir, stage)], {
    cwd: root,
    env: { ...process.env, MOTERA_BUILD_PIPELINE: '1' },
    stdio: 'inherit'
  });
  if (result.error) fail(`${stage} could not start: ${result.error.message}`);
  if (result.status !== 0) process.exit(result.status ?? 1);
  const after = digestOutput();
  if (before !== after) fail(`${stage} mutated dist/index.html; validation stages must be read-only`);
}

console.log(`\nPhase 16 pipeline complete: ${TRANSFORM_STAGES.length} transforms + ${VALIDATION_STAGES.length} read-only validators`);
