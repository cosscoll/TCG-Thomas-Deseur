#!/usr/bin/env node
// Compare a sanitized, READ-ONLY Floot catalogue export to the historical
// catalogue, without touching player inventories, private API routes, or SQL.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CARDS } from '../data/cards.js';
const EXPECTED_RARITIES = new Set(['commune', 'rare', 'epique', 'legendaire', 'secrete']);

export function compareCatalogue(actual, expected = CARDS) {
  if (!Array.isArray(actual)) throw new Error('Expected a JSON array of {id,rarity}');
  if (actual.some(row => !row || typeof row !== 'object' || Array.isArray(row) ||
      Object.keys(row).some(key => !['id', 'rarity'].includes(key)) ||
      typeof row.id !== 'string' || !/^[a-z0-9_]{1,64}$/.test(row.id) ||
      typeof row.rarity !== 'string' || !EXPECTED_RARITIES.has(row.rarity))) {
    throw new Error('The export must contain only valid public card IDs and canonical rarity slugs');
  }
  const counts = new Map();
  for (const row of actual) counts.set(row.id, (counts.get(row.id) || 0) + 1);
  const duplicates = [...counts].filter(([, n]) => n > 1).map(([id]) => id).sort();
  const actualMap = new Map(actual.map(({ id, rarity }) => [id, rarity]));
  const expectedMap = new Map(expected.map(({ id, rarity }) => [id, rarity]));
  const missingIds = [...expectedMap.keys()].filter(id => !actualMap.has(id)).sort();
  const unexpectedIds = [...actualMap.keys()].filter(id => !expectedMap.has(id)).sort();
  const rarityMismatches = [...expectedMap.entries()]
    .filter(([id, rarity]) => actualMap.has(id) && actualMap.get(id) !== rarity)
    .map(([id, expectedRarity]) => ({ id, expectedRarity, actualRarity: actualMap.get(id) }))
    .sort((a, b) => a.id.localeCompare(b.id));
  return {
    ok: actual.length === expected.length &&
      duplicates.length === 0 && missingIds.length === 0 &&
      unexpectedIds.length === 0 && rarityMismatches.length === 0,
    expectedCount: expected.length,
    receivedCount: actual.length,
    duplicates, missingIds, unexpectedIds, rarityMismatches,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const input = process.argv[2];
    if (!input) throw new Error('Usage: node scripts/compare_floot_catalogue.mjs <sanitized-cards.json>');
    const parsed = JSON.parse(readFileSync(input, 'utf8'));
    const result = compareCatalogue(parsed);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    // Never echo raw source data: the caller may have chosen an inappropriate file.
    process.stderr.write(`Catalogue comparison refused: ${error instanceof SyntaxError ? 'invalid JSON' : error.message}\n`);
    process.exitCode = 1;
  }
}
