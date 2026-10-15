import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

/**
 * PROVENANCE MUST NAME THE MODEL THAT ACTUALLY RAN (P2-4).
 *
 * `model_used` is written into the bundle only after a real pipeline run, so it is
 * the single source of truth for provenance. Two ways to break the honesty rule:
 *   1. show a hardcoded model name when `model_used` is missing, and
 *   2. read the model from anywhere else.
 * This file locks both. Comments are stripped before the negative assertions
 * because these files discuss the banned pattern in their own documentation.
 */

const read = (rel) => fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const modalCode = stripComments(read('../DataIntegrityModal.jsx'));
const newsCode = stripComments(read('../NewsTab.jsx'));
const appCode = stripComments(read('../../App.jsx'));

describe('model provenance', () => {
  it('reads the model from model_used', () => {
    expect(modalCode).toMatch(/data\?\.model_used/);
    expect(appCode).toMatch(/data\?\.model_used/);
  });

  it('never substitutes a named model for missing provenance', () => {
    // A default like `model_used || 'Gemini'` states that a specific model ran
    // when nothing recorded one. A non-model fallback such as "model tidak
    // tercatat" is allowed — that is the honest case, asserted separately below.
    const NAMED_MODEL_FALLBACK = /model_used\s*\|\|\s*'[^']*(gemini|gpt|claude|deepseek|llama|qwen|nemotron|kimi)[^']*'/i;
    expect(modalCode).not.toMatch(NAMED_MODEL_FALLBACK);
    expect(newsCode).not.toMatch(NAMED_MODEL_FALLBACK);
    expect(appCode).not.toMatch(NAMED_MODEL_FALLBACK);
  });

  it('says so out loud when the news item has no recorded model', () => {
    expect(newsCode).toMatch(/model tidak tercatat/);
  });
});
