export const TRANSFORM_STAGES = Object.freeze([
  'build.mjs',
  'apply-row-map.mjs',
  'fix-seat-orientation.mjs',
  'fix-seat-switch.mjs',
  'fix-ground-rendering.mjs',
  'upgrade-turf-material.mjs',
  'refine-cricket-pitch.mjs',
  'optimize-shadows.mjs',
  'optimize-display.mjs',
  'optimize-render-loop.mjs',
  'optimize-runtime.mjs',
  'optimize-responsive.mjs',
  'harden-browser-runtime.mjs'
]);

export const VALIDATION_STAGES = Object.freeze([
  'validate-ui-ux.mjs',
  'validate-responsive.mjs',
  'validate-performance.mjs',
  'validate-browser-runtime.mjs',
  'validate-regression-suite.mjs'
]);

export const ALL_STAGES = Object.freeze([...TRANSFORM_STAGES, ...VALIDATION_STAGES]);
