/**
 * UK staple foods database builder / validator.
 *
 * curated-staples.json is hand-maintained with typical UK portions from
 * CoFID 2021 and UK supermarket label reference values.
 *
 * In future, the full McCance & Widdowson CoFID dataset (~2887 foods) can be
 * imported from the UK government Excel workbook:
 * https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid
 *
 * Run: npm run build:staples
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STAPLES_PATH = join(__dirname, '../src/data/meals/curated-staples.json');

const REQUIRED_FIELDS = [
  'id',
  'name',
  'servingDescription',
  'sourceLabel',
  'confidence',
  'calories',
  'protein',
  'carbs',
  'fat',
  'saturatedFat',
  'fibre',
  'sugar',
  'salt',
  'ingredients',
  'triggerTags',
];

function validateStaples() {
  const raw = readFileSync(STAPLES_PATH, 'utf8');
  const payload = JSON.parse(raw);

  if (!payload.meals || !Array.isArray(payload.meals)) {
    throw new Error('curated-staples.json must contain a meals array');
  }

  const ids = new Set();
  const names = new Set();

  for (const meal of payload.meals) {
    for (const field of REQUIRED_FIELDS) {
      if (meal[field] === undefined) {
        throw new Error(`Missing field "${field}" on staple "${meal.id ?? meal.name}"`);
      }
    }

    if (!meal.id.startsWith('staple-')) {
      throw new Error(`Staple id must start with "staple-": ${meal.id}`);
    }

    if (ids.has(meal.id)) {
      throw new Error(`Duplicate staple id: ${meal.id}`);
    }
    ids.add(meal.id);

    const normalisedName = meal.name.trim().toLowerCase();
    if (names.has(normalisedName)) {
      throw new Error(`Duplicate staple name: ${meal.name}`);
    }
    names.add(normalisedName);
  }

  if (payload.count !== payload.meals.length) {
    console.warn(
      `Warning: count field (${payload.count}) does not match meals length (${payload.meals.length})`
    );
  }

  return payload;
}

const payload = validateStaples();

console.log(`curated-staples.json: ${payload.meals.length} hand-maintained UK staple foods`);
console.log(`Source note: ${payload.source}`);
console.log(
  'Full CoFID import (~2887 foods) is not yet implemented; edit curated-staples.json directly.'
);
