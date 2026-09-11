import { readFile, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";

const characterCount = 3500;
const standardListPath =
  process.env.STANDARD_LIST_PATH ?? "data/tongyong-guifan-hanzi-level-1.tsv";
const cedictPath = process.env.CEDICT_PATH ?? "/private/tmp/cedict.txt.gz";
const outputPath = process.env.HANZI_OUTPUT ?? "app/hanzi-data.ts";
const pinyinProPath = process.env.PINYIN_PRO_PATH ?? "pinyin-pro";

const { pinyin } = await import(pinyinProPath);

const initials = [
  "zh",
  "ch",
  "sh",
  "b",
  "p",
  "m",
  "f",
  "d",
  "t",
  "n",
  "l",
  "g",
  "k",
  "h",
  "j",
  "q",
  "x",
  "r",
  "z",
  "c",
  "s",
  "y",
  "w",
];

const finals = new Set([
  "a",
  "o",
  "e",
  "i",
  "u",
  "ü",
  "ai",
  "ei",
  "ui",
  "ao",
  "ou",
  "iu",
  "ie",
  "üe",
  "er",
  "an",
  "en",
  "in",
  "un",
  "ün",
  "ian",
  "uan",
  "üan",
  "ang",
  "eng",
  "ing",
  "ong",
  "ia",
  "ua",
  "iao",
  "uai",
  "iang",
  "uang",
  "iong",
  "uo",
]);

const obsoleteGlossPrefixes = [
  "variant of ",
  "old variant of ",
  "archaic variant of ",
  "ancient variant of ",
  "dialectal equivalent of ",
  "japanese variant of ",
  "erroneous variant of ",
  "unofficial variant of ",
  "euphemistic variant of ",
];

function normalizePinyin(value) {
  return value
    .replaceAll("ü", "v")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replaceAll("u:", "v")
    .replaceAll("v", "ü")
    .replace(/[1-5]/g, "")
    .replace(/[^a-zü]/g, "");
}

function finalFor(syllable) {
  const initial = initials.find((candidate) => syllable.startsWith(candidate)) ?? "";
  let final = syllable.slice(initial.length);
  if (["j", "q", "x", "y"].includes(initial) && final.startsWith("u")) {
    final = `ü${final.slice(1)}`;
  }
  return final;
}

function isGridSyllable(syllable) {
  return /^[a-zü]+$/.test(syllable) && finals.has(finalFor(syllable));
}

function parseStandardList(text) {
  const entries = text
    .split(/\r?\n/)
    .filter((line) => /^\d{4}\t/u.test(line))
    .map((line) => {
      const [indexText, char] = line.split("\t");
      return { rank: Number(indexText), char };
    });

  if (
    entries.length !== characterCount ||
    new Set(entries.map(({ char }) => char)).size !== characterCount ||
    entries.some(({ rank }, index) => rank !== index + 1)
  ) {
    throw new Error("The official level-one list must contain indexes 0001-3500 exactly once");
  }

  return entries;
}

function parseCedict(buffer, targetCharacters) {
  const text = gunzipSync(buffer).toString("utf8");
  const result = new Map();

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trimEnd();
    if (line.startsWith("#")) continue;
    const match = line.match(/^(\S+) (\S+) \[([^\]]+)\] \/(.*)\/$/);
    if (!match) continue;
    const [, , simplified, readingText, glosses] = match;
    if (!targetCharacters.has(simplified) || [...simplified].length !== 1) continue;

    const firstGloss = glosses.split("/")[0].toLowerCase();
    if (obsoleteGlossPrefixes.some((prefix) => firstGloss.startsWith(prefix))) continue;

    const readings = result.get(simplified) ?? new Set();
    const readingCandidates = [readingText];
    for (const note of glosses.matchAll(/(?:also|colloquial|often) pr\. \[([^\]]+)\]/gi)) {
      readingCandidates.push(note[1]);
    }
    for (const candidate of readingCandidates.map(normalizePinyin)) {
      if (isGridSyllable(candidate)) readings.add(candidate);
    }
    result.set(simplified, readings);
  }

  return result;
}

function pinyinProReadings(char) {
  return new Set(
    pinyin(char, { multiple: true, toneType: "none", type: "array" })
      .map(normalizePinyin)
      .filter(isGridSyllable),
  );
}

const standardEntries = parseStandardList(await readFile(standardListPath, "utf8"));
const characters = new Set(standardEntries.map(({ char }) => char));
const cedict = parseCedict(await readFile(cedictPath), characters);
const fallbacks = [];

const data = standardEntries.map(({ rank, char }) => {
  const dictionaryReadings = cedict.get(char) ?? new Set();
  const libraryReadings = pinyinProReadings(char);
  let readings = [...libraryReadings].filter((reading) => dictionaryReadings.has(reading));

  if (readings.length === 0) {
    readings = [...dictionaryReadings, ...libraryReadings]
      .filter((reading, index, all) => all.indexOf(reading) === index)
      .slice(0, 1);
    fallbacks.push({
      rank,
      char,
      reading: readings[0],
      cedict: [...dictionaryReadings],
      pinyinPro: [...libraryReadings],
    });
  }

  if (readings.length === 0) {
    throw new Error(`No standard grid reading found for official index ${rank} ${char}`);
  }

  return [rank, char, readings];
});

const knownReadings = new Map(data.map(([, char, readings]) => [char, readings]));
for (const [char, expected] of [
  ["白", "bai"],
  ["服", "fu"],
  ["女", "nü"],
  ["哼", "heng"],
]) {
  if (!knownReadings.get(char)?.includes(expected)) {
    throw new Error(`Regression check failed: ${char} must include ${expected}`);
  }
}

const source = `export type HanziSeed = readonly [rank: number, char: string, readings: readonly string[]];

// The 3,500 characters are exactly the level-one list in the State Council's
// Table of General Standard Chinese Characters (official indexes 0001-3500).
// No traditional-character frequency list or conversion table is used for membership.
// Tone-free readings are cross-checked with CC-CEDICT and pinyin-pro, and exceptional
// syllabic nasals are excluded because they do not fit the standard initial-final grid.
export const HANZI_SEED: readonly HanziSeed[] = ${JSON.stringify(data)} as const;
`;

await writeFile(outputPath, source);

console.log(
  JSON.stringify(
    {
      characters: data.length,
      readings: data.reduce((sum, [, , readings]) => sum + readings.length, 0),
      fallbacks,
      outputBytes: Buffer.byteLength(source),
      first: data[0],
      last: data.at(-1),
    },
    null,
    2,
  ),
);
