/**
 * Build generated-meals.json from the community BBC Good Food dataset:
 * https://github.com/mneedham/bbcgoodfood (stream_all.json)
 *
 * The upstream file is newline-delimited Python dict literals (single quotes), not JSON.
 *
 * Run: npm run build:meals
 * Optional: node scripts/build-meal-database.mjs --limit=700
 */

import { createWriteStream, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { createInterface } from 'node:readline';
import { pipeline } from 'node:stream/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '../src/data/meals/generated-meals.json');
const SOURCE_URL =
  'https://raw.githubusercontent.com/mneedham/bbcgoodfood/master/stream_all.json';

const limitArg = process.argv.find((a) => a.startsWith('--limit'));
const LIMIT = limitArg
  ? Number(limitArg.includes('=') ? limitArg.split('=')[1] : process.argv[process.argv.indexOf(limitArg) + 1])
  : 650;

const PRIORITY_PATTERNS = [
  /sausage\s+and\s+mash/i,
  /bangers/i,
  /toad\s+in\s+the\s+hole/i,
  /fish\s+fingers/i,
  /cottage\s+pie/i,
  /shepherd/i,
  /macaroni\s+cheese/i,
  /bubble\s+and\s+squeak/i,
  /pie\s+and\s+mash/i,
  /gammon/i,
  /full\s+english/i,
  /roast\s+chicken/i,
  /family\s+meal/i,
  /\bbritish\b/i,
  /comfort\s+food/i,
];

function isPriorityMeal(title) {
  return PRIORITY_PATTERNS.some((pattern) => pattern.test(title));
}

/** Convert a Python literal (dict/list/str) line to JSON text. */
function pythonLiteralToJson(text) {
  let out = '';
  let i = 0;

  while (i < text.length) {
    const c = text[i];

    if (c === "'" || c === '"') {
      const quote = c;
      out += '"';
      i += 1;
      while (i < text.length) {
        if (text[i] === '\\' && i + 1 < text.length) {
          const next = text[i + 1];
          if (next === quote || next === '\\') {
            out += '\\' + next;
            i += 2;
            continue;
          }
          out += text[i];
          i += 1;
          continue;
        }
        if (text[i] === quote) {
          out += '"';
          i += 1;
          break;
        }
        if (text[i] === '"') out += '\\"';
        else if (text[i] === '\\') out += '\\\\';
        else if (text[i] === '\n') out += '\\n';
        else if (text[i] === '\r') out += '\\r';
        else if (text[i] === '\t') out += '\\t';
        else out += text[i];
        i += 1;
      }
      continue;
    }

    if (text.startsWith('None', i) && !/[A-Za-z0-9_]/.test(text[i + 4] ?? '')) {
      out += 'null';
      i += 4;
      continue;
    }
    if (text.startsWith('True', i) && !/[A-Za-z0-9_]/.test(text[i + 4] ?? '')) {
      out += 'true';
      i += 4;
      continue;
    }
    if (text.startsWith('False', i) && !/[A-Za-z0-9_]/.test(text[i + 5] ?? '')) {
      out += 'false';
      i += 5;
      continue;
    }

    out += c;
    i += 1;
  }

  return out;
}

function parseNutritionLine(line) {
  const text = String(line);
  const kcal = text.match(/kcal\s*(\d+)/i)?.[1];
  const protein = text.match(/protein\s*([\d.]+)\s*g/i)?.[1];
  const carbs = text.match(/carbohydrate\s*([\d.]+)\s*g/i)?.[1];
  const fat = text.match(/(?<!saturated\s)fat\s*([\d.]+)\s*g/i)?.[1];
  const saturatedFat = text.match(/saturated\s+fat\s*([\d.]+)\s*g/i)?.[1];
  const sugar =
    text.match(/(?:added\s+)?sugar[s]?\s*([\d.]+)\s*g/i)?.[1] ??
    text.match(/sugars?\s*([\d.]+)\s*g/i)?.[1];
  const fibre = text.match(/fibre\s*([\d.]+)\s*g/i)?.[1];
  const salt = text.match(/salt\s*([\d.]+)\s*g/i)?.[1];
  return { kcal, protein, carbs, fat, saturatedFat, sugar, fibre, salt };
}

function parseNutritionInfo(nutritionInfo) {
  const totals = {};
  for (const line of nutritionInfo ?? []) {
    const parsed = parseNutritionLine(line);
    for (const [key, value] of Object.entries(parsed)) {
      if (value != null) totals[key] = value;
    }
  }
  return totals;
}

function inferTriggerTags(name, ingredients = []) {
  const text = `${name} ${ingredients.join(' ')}`.toLowerCase();
  const tags = new Set();
  const rules = [
    [/milk|cheese|cream|butter|yogurt|dairy/i, 'dairy'],
    [/wheat|flour|pasta|bread|gluten/i, 'gluten'],
    [/tomato|passata/i, 'tomato'],
    [/onion/i, 'onion'],
    [/garlic/i, 'garlic'],
    [/chilli|chili|spicy|curry/i, 'spicy'],
    [/bacon|sausage|ham|pepperoni/i, 'processedMeat'],
    [/fried|deep.?fried/i, 'fried'],
    [/chocolate|cream|butter|pastry/i, 'fatty'],
  ];
  for (const [pattern, tag] of rules) {
    if (pattern.test(text)) tags.add(tag);
  }
  if (tags.size === 0) tags.add('unknown');
  return [...tags];
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function decodeHtmlEntities(text) {
  return String(text)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function main() {
  console.log(`Downloading BBC Good Food dataset…`);
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Download returned no body');
  }

  const seen = new Set();
  const priorityMeals = [];
  const regularMeals = [];
  let parsedLines = 0;
  let failedLines = 0;

  const nodeStream = Readable.fromWeb(response.body);
  const rl = createInterface({ input: nodeStream, crlfDelay: Infinity });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let row;
    try {
      row = JSON.parse(pythonLiteralToJson(trimmed));
      parsedLines += 1;
    } catch {
      failedLines += 1;
      continue;
    }

    const page = row?.page;
    const recipe = page?.recipe;
    const title = decodeHtmlEntities(String(page?.title ?? '')).trim();
    const nutritionInfo = recipe?.nutrition_info;
    if (!title || !Array.isArray(nutritionInfo) || nutritionInfo.length === 0) continue;

    const nutrients = parseNutritionInfo(nutritionInfo);
    const calories = Number(nutrients.kcal);
    if (!Number.isFinite(calories) || calories < 80 || calories > 2500) continue;

    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const ingredients = Array.isArray(recipe.ingredients)
      ? recipe.ingredients.map((item) => decodeHtmlEntities(String(item)))
      : [];

    const id = `bbc-${page?.article?.id ?? slugify(title)}`;
    const serves = recipe?.serves ?? recipe?.servings;

    const meal = {
      id,
      name: title,
      aliases: [],
      servingDescription: `BBC Good Food per serving${serves ? ` (serves ${serves})` : ''}`,
      sourceLabel: 'BBC Good Food (community dataset)',
      sourceUrl: 'https://github.com/mneedham/bbcgoodfood',
      confidence: 'high',
      calories: Math.round(calories),
      protein: Math.round(Number(nutrients.protein) || 0),
      carbs: Math.round(Number(nutrients.carbs) || 0),
      fat: Math.round(Number(nutrients.fat) || 0),
      saturatedFat: Math.round(
        Number(nutrients.saturatedFat) || (Number(nutrients.fat) || 0) * 0.4
      ),
      fibre: Math.round(Number(nutrients.fibre) || 0),
      sugar: Math.round(Number(nutrients.sugar) || 0),
      salt: Math.round((Number(nutrients.salt) || 0) * 100) / 100,
      ingredients: ingredients.slice(0, 8),
      triggerTags: inferTriggerTags(title, ingredients),
    };

    if (isPriorityMeal(title)) {
      priorityMeals.push(meal);
    } else {
      regularMeals.push(meal);
    }
  }

  const meals = [...priorityMeals];
  for (const meal of regularMeals) {
    if (meals.length >= LIMIT) break;
    meals.push(meal);
  }
  meals.splice(LIMIT);

  meals.sort((a, b) => a.name.localeCompare(b.name));

  mkdirSync(dirname(OUT_PATH), { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    source: SOURCE_URL,
    count: meals.length,
    meals,
  };

  await pipeline(
    Readable.from([JSON.stringify(payload, null, 2)]),
    createWriteStream(OUT_PATH)
  );

  console.log(
    `Parsed ${parsedLines} lines (${failedLines} failed), wrote ${meals.length} meals to ${OUT_PATH}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
