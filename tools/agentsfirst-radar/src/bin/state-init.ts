#!/usr/bin/env node
// state-init — bootstrap a fresh v1 radar-state.json. One-time on first deploy.
// Aborts if state already exists unless --force is passed.

import { promises as fs } from 'node:fs';
import {
  DEFAULT_STATE_PATH,
  freshState,
  writeStateAtomic,
  RadarState,
} from '../state.js';

async function main(): Promise<void> {
  const force = process.argv.includes('--force');
  try {
    await fs.access(DEFAULT_STATE_PATH);
    if (!force) {
      console.error(`✋ state already exists at ${DEFAULT_STATE_PATH}. Pass --force to overwrite.`);
      process.exit(1);
    }
    console.error(`⚠️ state exists; overwriting due to --force`);
  } catch {
    // expected — no state file yet
  }

  const state: RadarState = freshState();
  await writeStateAtomic(state);
  console.error(`✅ wrote fresh v1 state to ${DEFAULT_STATE_PATH}`);
}

void main().catch((err) => {
  console.error(`❌ state-init failed: ${err.message}`);
  process.exit(2);
});
