export type InitialRow = {
  id: string;
  label: string;
  sourceInitial: string | null;
  pair: number | null;
  pairPosition: "first" | "second" | null;
  note?: string;
};

export const DEFAULT_INITIAL_ROWS: InitialRow[] = [
  {
    id: "∅",
    label: "∅",
    sourceInitial: "∅",
    pair: null,
    pairPosition: null,
    note: "零声母 · 含原 y / w 音节",
  },
  { id: "p", label: "p", sourceInitial: "p", pair: 1, pairPosition: "first" },
  { id: "b", label: "b", sourceInitial: "b", pair: 1, pairPosition: "second" },
  { id: "t", label: "t", sourceInitial: "t", pair: 2, pairPosition: "first" },
  { id: "d", label: "d", sourceInitial: "d", pair: 2, pairPosition: "second" },
  { id: "k", label: "k", sourceInitial: "k", pair: 3, pairPosition: "first" },
  { id: "g", label: "g", sourceInitial: "g", pair: 3, pairPosition: "second" },
  { id: "f", label: "f", sourceInitial: "f", pair: 4, pairPosition: "first" },
  {
    id: "v",
    label: "v",
    sourceInitial: null,
    pair: 4,
    pairPosition: "second",
    note: "f 的浊音",
  },
  { id: "s", label: "s", sourceInitial: "s", pair: 5, pairPosition: "first" },
  {
    id: "z",
    label: "z",
    sourceInitial: null,
    pair: 5,
    pairPosition: "second",
    note: "s 的浊音",
  },
  { id: "ts", label: "ts", sourceInitial: "c", pair: 6, pairPosition: "first" },
  { id: "dz", label: "dz", sourceInitial: "z", pair: 6, pairPosition: "second" },
  { id: "q", label: "q", sourceInitial: "sh", pair: 7, pairPosition: "first" },
  { id: "r", label: "r", sourceInitial: "r", pair: 7, pairPosition: "second" },
  { id: "c", label: "c", sourceInitial: "ch", pair: 8, pairPosition: "first" },
  { id: "j", label: "j", sourceInitial: "zh", pair: 8, pairPosition: "second" },
  { id: "cy", label: "cy", sourceInitial: "q", pair: 9, pairPosition: "first" },
  { id: "jy", label: "jy", sourceInitial: "j", pair: 9, pairPosition: "second" },
  { id: "x", label: "x", sourceInitial: "x", pair: 10, pairPosition: "first" },
  {
    id: "y",
    label: "y",
    sourceInitial: "y",
    pair: 10,
    pairPosition: "second",
  },
  { id: "m", label: "m", sourceInitial: "m", pair: 11, pairPosition: "first" },
  { id: "n", label: "n", sourceInitial: "n", pair: 11, pairPosition: "second" },
  { id: "h", label: "h", sourceInitial: "h", pair: 12, pairPosition: "first" },
  { id: "l", label: "l", sourceInitial: "l", pair: 12, pairPosition: "second" },
];

export const DEFAULT_INITIALS = DEFAULT_INITIAL_ROWS.map((row) => row.id);

const INITIAL_ROW_BY_PINYIN = new Map(
  DEFAULT_INITIAL_ROWS.flatMap((row) =>
    row.sourceInitial === null || row.sourceInitial === "∅"
      ? []
      : [[row.sourceInitial, row.id] as const],
  ),
);

const DEFAULT_INITIAL_ID_SET = new Set(DEFAULT_INITIALS);

export function getInitialRowId(pinyinInitial: string) {
  if (pinyinInitial === "∅" || pinyinInitial === "y" || pinyinInitial === "w") {
    return "∅";
  }
  return INITIAL_ROW_BY_PINYIN.get(pinyinInitial) ?? pinyinInitial;
}

export function buildInitialRows(initials: readonly string[]): InitialRow[] {
  const enabledInitials = new Set(initials);
  const standardRows = DEFAULT_INITIAL_ROWS.filter((row) =>
    enabledInitials.has(row.id),
  );
  const customRows = initials
    .filter((initial) => !DEFAULT_INITIAL_ID_SET.has(initial))
    .map((initial) => ({
      id: initial,
      label: initial,
      sourceInitial: initial,
      pair: null,
      pairPosition: null,
      note: "自定义声母",
    })) satisfies InitialRow[];

  return [...standardRows, ...customRows];
}

export function composeReformedSyllable(initialRowId: string, final: string) {
  return initialRowId === "∅" ? final : `${initialRowId}${final}`;
}

export type FinalColumn = {
  id: string;
  label: string;
  final: string;
};

export type RhymeGroup = {
  id: string;
  label: string;
  columns: FinalColumn[];
};

const STANDARD_RHYME_GROUPS: RhymeGroup[] = [
  {
    id: "a",
    label: "a",
    columns: [
      { id: "a", label: "a", final: "a" },
      { id: "ia", label: "ia", final: "ia" },
      { id: "wa", label: "wa", final: "wa" },
    ],
  },
  {
    id: "r",
    label: "r",
    columns: [
      { id: "r", label: "r", final: "r" },
      { id: "wr", label: "wr", final: "wr" },
      { id: "ir", label: "ir", final: "ir" },
      { id: "er", label: "er", final: "er" },
    ],
  },
  {
    id: "e",
    label: "e",
    columns: [
      { id: "e", label: "e", final: "e" },
      { id: "we", label: "we", final: "we" },
      { id: "ie", label: "ie", final: "ie" },
      { id: "ue", label: "ue", final: "ue" },
    ],
  },
  {
    id: "i",
    label: "i",
    columns: [
      { id: "i", label: "i", final: "i" },
      { id: "wi", label: "wi", final: "wi" },
    ],
  },
  {
    id: "ei",
    label: "ei",
    columns: [
      { id: "ei", label: "ei", final: "ei" },
      { id: "wei", label: "wei", final: "wei" },
    ],
  },
  {
    id: "w",
    label: "w",
    columns: [{ id: "w", label: "w", final: "w" }],
  },
  {
    id: "u",
    label: "u",
    columns: [{ id: "u", label: "u", final: "u" }],
  },
  {
    id: "o",
    label: "o",
    columns: [
      { id: "o", label: "o", final: "o" },
      { id: "io", label: "io", final: "io" },
      { id: "wo", label: "wo", final: "wo" },
    ],
  },
  {
    id: "ow",
    label: "ow",
    columns: [
      { id: "ow", label: "ow", final: "ow" },
      { id: "iw", label: "iw", final: "iw" },
      { id: "wow", label: "wow", final: "wow" },
    ],
  },
  {
    id: "an",
    label: "an",
    columns: [
      { id: "an", label: "an", final: "an" },
      { id: "ian", label: "ian", final: "ian" },
      { id: "wan", label: "wan", final: "wan" },
      { id: "uan", label: "uan", final: "uan" },
    ],
  },
  {
    id: "en",
    label: "en",
    columns: [
      { id: "en", label: "en", final: "en" },
      { id: "in", label: "in", final: "in" },
      { id: "wn", label: "wn", final: "wn" },
      { id: "un", label: "un", final: "un" },
    ],
  },
  {
    id: "ang",
    label: "ang",
    columns: [
      { id: "ang", label: "ang", final: "ang" },
      { id: "iang", label: "iang", final: "iang" },
      { id: "wang", label: "wang", final: "wang" },
    ],
  },
  {
    id: "ng",
    label: "ng",
    columns: [
      { id: "ng", label: "ng", final: "ng" },
      { id: "eng", label: "eng", final: "eng" },
      { id: "ing", label: "ing", final: "ing" },
      { id: "ong", label: "ong", final: "ong" },
    ],
  },
];

export const DEFAULT_FINALS: string[] = STANDARD_RHYME_GROUPS.flatMap((group) =>
  group.columns.map((column) => column.id),
);

// Finals returned by splitSyllable for the official, unmodified Pinyin seed.
export const PINYIN_FINALS = [
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
] as const;

const RHYME_GROUP_BY_COLUMN = new Map(
  STANDARD_RHYME_GROUPS.flatMap((group) =>
    group.columns.map((column) => [column.id, group.id] as const),
  ),
);

const APICAL_PINYIN_INITIALS = new Set(["z", "c", "s", "zh", "ch", "sh", "r"]);
const APICAL_REFORMED_INITIALS = new Set(["s", "z", "ts", "dz", "q", "r", "c", "j"]);

const Y_FINALS: Record<string, string> = {
  i: "i",
  a: "ia",
  e: "ie",
  ao: "iao",
  ou: "iu",
  an: "ian",
  in: "in",
  ang: "iang",
  ing: "ing",
  ong: "iong",
  ü: "ü",
  üe: "üe",
  üan: "üan",
  ün: "ün",
};

const W_FINALS: Record<string, string> = {
  u: "u",
  a: "ua",
  o: "uo",
  ai: "uai",
  ei: "ui",
  an: "uan",
  en: "un",
  ang: "uang",
  eng: "weng",
};

const REFORMED_FINAL_BY_PINYIN: Record<string, string> = {
  a: "a",
  ia: "ia",
  ua: "wa",
  o: "r",
  uo: "wr",
  e: "ir",
  er: "er",
  ai: "e",
  uai: "we",
  ie: "ie",
  üe: "ue",
  i: "i",
  ei: "ei",
  ui: "wei",
  u: "w",
  ü: "u",
  ao: "o",
  iao: "io",
  ou: "ow",
  iu: "iw",
  an: "an",
  ian: "ian",
  uan: "wan",
  üan: "uan",
  en: "en",
  in: "in",
  un: "wn",
  ün: "un",
  ang: "ang",
  iang: "iang",
  uang: "wang",
  eng: "eng",
  ing: "ing",
  ong: "ong",
  iong: "ong",
  weng: "ong",
};

function canonicalPinyinFinal(initial: string, final: string) {
  if (initial === "y") return Y_FINALS[final] ?? final;
  if (initial === "w") return W_FINALS[final] ?? final;
  return final;
}

export function getFinalColumnId(initial: string, final: string) {
  const canonicalFinal = canonicalPinyinFinal(initial, final);
  if (canonicalFinal === "i" && APICAL_PINYIN_INITIALS.has(initial)) return "ng";
  return REFORMED_FINAL_BY_PINYIN[canonicalFinal] ?? canonicalFinal;
}

export function getRhymeGroupIdForFinal(finalId: string) {
  return RHYME_GROUP_BY_COLUMN.get(finalId) ?? `custom:${finalId}`;
}

export function getRhymeGroupId(initial: string, final: string) {
  return getRhymeGroupIdForFinal(getFinalColumnId(initial, final));
}

export function isFinalColumnApplicable(initialRowId: string, columnId: string) {
  if (columnId === "ng") return APICAL_REFORMED_INITIALS.has(initialRowId);
  if (columnId === "i") return !APICAL_REFORMED_INITIALS.has(initialRowId);
  return true;
}

export function buildRhymeGroups(finals: readonly string[]): RhymeGroup[] {
  const enabledFinals = new Set(finals);
  const standardGroups = STANDARD_RHYME_GROUPS.map((group) => ({
    ...group,
    columns: group.columns.filter((column) => enabledFinals.has(column.id)),
  })).filter((group) => group.columns.length > 0);
  const defaultFinals = new Set(DEFAULT_FINALS);
  const customGroups = finals
    .filter((final) => !defaultFinals.has(final))
    .map((final) => ({
      id: `custom:${final}`,
      label: final,
      columns: [{ id: final, label: final, final }],
    }));

  return [...standardGroups, ...customGroups];
}

const TONE_MAP: Record<string, string> = {
  ā: "a",
  á: "a",
  ǎ: "a",
  à: "a",
  ē: "e",
  é: "e",
  ě: "e",
  è: "e",
  ī: "i",
  í: "i",
  ǐ: "i",
  ì: "i",
  ō: "o",
  ó: "o",
  ǒ: "o",
  ò: "o",
  ū: "u",
  ú: "u",
  ǔ: "u",
  ù: "u",
  ǖ: "ü",
  ǘ: "ü",
  ǚ: "ü",
  ǜ: "ü",
};

const INITIAL_MATCH_ORDER = [
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

function normalizeBase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, (letter) => TONE_MAP[letter])
    .replace(/[1-5\s'’]/g, "");
}

export function normalizePinyin(value: string) {
  return normalizeBase(value)
    .replace(/u:|v/g, "ü")
    .replace(/[^a-züê]/g, "");
}

export function normalizeReformedSpelling(value: string) {
  return normalizeBase(value)
    .replace(/u:/g, "u")
    .replace(/ü/g, "u")
    .replace(/[^a-zê]/g, "");
}

export function splitSyllable(pinyin: string) {
  const initial =
    INITIAL_MATCH_ORDER.find((candidate) => pinyin.startsWith(candidate)) ?? "∅";
  const writtenFinal = initial === "∅" ? pinyin : pinyin.slice(initial.length);
  const final =
    ["j", "q", "x", "y"].includes(initial) && writtenFinal.startsWith("u")
      ? `ü${writtenFinal.slice(1)}`
      : writtenFinal;

  return { initial, final };
}

export function composeSyllable(initial: string, final: string) {
  if (initial === "∅") return final;
  const writtenFinal =
    ["j", "q", "x", "y"].includes(initial) && final.startsWith("ü")
      ? `u${final.slice(1)}`
      : final;
  return `${initial}${writtenFinal}`;
}

export type ReformedCoordinate = {
  pinyin: string;
  sourceInitial: string;
  sourceFinal: string;
  initialId: string;
  finalId: string;
  groupId: string;
  spelling: string;
};

export function mapPinyinSyllable(value: string): ReformedCoordinate {
  const pinyin = normalizePinyin(value);
  const { initial, final } = splitSyllable(pinyin);
  const sourceFinal = canonicalPinyinFinal(initial, final);
  // yong keeps y as a real consonant and therefore occupies y × ong.
  // Other y/w spellings continue to follow the previously confirmed
  // zero-initial orthography.
  const initialId = pinyin === "yong" ? "y" : getInitialRowId(initial);
  const finalId = getFinalColumnId(initial, final);

  return {
    pinyin,
    sourceInitial: initial,
    sourceFinal,
    initialId,
    finalId,
    groupId: getRhymeGroupIdForFinal(finalId),
    spelling: composeReformedSyllable(initialId, finalId),
  };
}

export type AtlasCoordinate = {
  initialId: string;
  finalId: string;
};

export type CardMoveDecision = "same-cell" | "same-rhyme" | "exception" | "blocked";

export function planCardMove(
  origin: AtlasCoordinate,
  target: AtlasCoordinate,
): CardMoveDecision {
  if (
    origin.initialId === target.initialId &&
    origin.finalId === target.finalId
  ) {
    return "same-cell";
  }
  if (
    getRhymeGroupIdForFinal(origin.finalId) ===
    getRhymeGroupIdForFinal(target.finalId)
  ) {
    return "same-rhyme";
  }
  if (origin.initialId === target.initialId) return "exception";
  return "blocked";
}
