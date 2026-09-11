import {
  normalizePinyin,
  normalizeReformedSpelling,
} from "./pinyin-utils.ts";

type SearchableCard = {
  char: string;
  pinyin: string;
  rank: number;
  searchAliases?: readonly string[];
};

const PINYIN_INPUT = /^[a-züêv:āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ1-5\s'’]+$/u;

export function planCardSearch<T extends SearchableCard>(
  cards: readonly T[],
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return {
      displayCards: [...cards],
      exactPinyin: null,
      matches: [...cards],
      normalizedQuery,
    };
  }

  const normalizedCandidates = PINYIN_INPUT.test(normalizedQuery)
    ? [normalizePinyin(normalizedQuery), normalizeReformedSpelling(normalizedQuery)]
    : [];
  const exactOriginal =
    normalizedCandidates.find(
      (candidate, index) =>
        candidate &&
        normalizedCandidates.indexOf(candidate) === index &&
        cards.some((card) => card.pinyin === candidate),
    ) ?? null;
  const exactAlias = exactOriginal
    ? null
    : (normalizedCandidates.find(
        (candidate, index) =>
          candidate &&
          normalizedCandidates.indexOf(candidate) === index &&
          cards.some((card) => card.searchAliases?.includes(candidate)),
      ) ?? null);
  const exactPinyin = exactOriginal ?? exactAlias;

  const matches = exactOriginal
    ? cards.filter((card) => card.pinyin === exactOriginal)
    : exactAlias
      ? cards.filter((card) => card.searchAliases?.includes(exactAlias))
    : cards.filter(
        (card) =>
          card.char.includes(normalizedQuery) ||
          card.pinyin.includes(normalizedQuery) ||
          card.searchAliases?.some((alias) => alias.includes(normalizedQuery)) ||
          String(card.rank) === normalizedQuery,
      );

  return {
    displayCards: exactPinyin ? [...cards] : matches,
    exactPinyin,
    matches,
    normalizedQuery,
  };
}

export function centeredScrollOffset(
  itemStart: number,
  itemSize: number,
  viewportSize: number,
  scrollSize: number,
) {
  const maximum = Math.max(0, scrollSize - viewportSize);
  const centered = itemStart + itemSize / 2 - viewportSize / 2;
  return Math.max(0, Math.min(centered, maximum));
}
