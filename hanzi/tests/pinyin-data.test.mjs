import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildInitialRows,
  buildRhymeGroups,
  composeReformedSyllable,
  composeSyllable,
  DEFAULT_FINALS,
  DEFAULT_INITIALS,
  DEFAULT_INITIAL_ROWS,
  getFinalColumnId,
  getInitialRowId,
  getRhymeGroupId,
  isFinalColumnApplicable,
  mapPinyinSyllable,
  PINYIN_FINALS,
  planCardMove,
  splitSyllable,
} from "../app/pinyin-utils.ts";
import {
  centeredScrollOffset,
  planCardSearch,
} from "../app/search-utils.ts";

async function loadData() {
  const source = await readFile(
    new URL("../app/hanzi-data.ts", import.meta.url),
    "utf8",
  );
  const match = source.match(/= (\[.*\]) as const;/s);
  assert.ok(match, "hanzi seed data should be parseable");
  return JSON.parse(match[1]);
}

test("the dataset exactly matches the 3,500 official level-one characters", async () => {
  const data = await loadData();
  const standardList = await readFile(
    new URL("../data/tongyong-guifan-hanzi-level-1.tsv", import.meta.url),
    "utf8",
  );
  const officialCharacters = standardList
    .split(/\r?\n/)
    .filter((line) => /^\d{4}\t/u.test(line))
    .map((line) => line.split("\t")[1]);

  assert.equal(data.length, 3500);
  assert.equal(new Set(data.map(([, char]) => char)).size, 3500);
  assert.deepEqual(
    data.map(([, char]) => char),
    officialCharacters,
  );
  assert.ok(data.every(([rank], index) => rank === index + 1));
  assert.equal(data[0][0], 1);
  assert.equal(data.at(-1)[0], 3500);
  assert.equal(data[0][1], "一");
  assert.equal(data.at(-1)[1], "矗");
});

test("every character has at least one normalized toneless pinyin", async () => {
  const data = await loadData();
  for (const [, char, readings] of data) {
    assert.ok(readings.length > 0, `${char} should have a reading`);
    assert.equal(new Set(readings).size, readings.length);
    for (const reading of readings) {
      assert.match(reading, /^[a-züê]+$/u, `${char}: ${reading}`);
      const { final } = splitSyllable(reading);
      assert.ok(PINYIN_FINALS.includes(final), `${char}: unsupported final ${final}`);
    }
  }
});

test("the compact seed stays below the page-load size budget", async () => {
  const source = await readFile(
    new URL("../app/hanzi-data.ts", import.meta.url),
    "utf8",
  );
  assert.ok(Buffer.byteLength(source) < 90_000);
});

test("known false readings are absent and common polyphones remain", async () => {
  const data = await loadData();
  const readings = new Map(data.map(([, char, pinyin]) => [char, pinyin]));

  assert.deepEqual(readings.get("白"), ["bai"]);
  assert.deepEqual(readings.get("服"), ["fu"]);
  assert.deepEqual(readings.get("不"), ["bu"]);
  assert.deepEqual(readings.get("种"), ["zhong"]);
  assert.deepEqual(new Set(readings.get("行")), new Set(["xing", "hang", "heng"]));
  assert.deepEqual(new Set(readings.get("着")), new Set(["zhe", "zhuo", "zhao"]));
  assert.deepEqual(new Set(readings.get("谁")), new Set(["shui", "shei"]));
  assert.deepEqual(readings.get("女"), ["nü"]);
  assert.deepEqual(readings.get("哼"), ["heng"]);
});

test("ü finals are grouped by sound while retaining standard spelling", () => {
  assert.deepEqual(splitSyllable("nü"), { initial: "n", final: "ü" });
  assert.deepEqual(splitSyllable("lüe"), { initial: "l", final: "üe" });
  assert.deepEqual(splitSyllable("jue"), { initial: "j", final: "üe" });
  assert.deepEqual(splitSyllable("yue"), { initial: "y", final: "üe" });
  assert.deepEqual(splitSyllable("juan"), { initial: "j", final: "üan" });
  assert.deepEqual(splitSyllable("jun"), { initial: "j", final: "ün" });

  assert.equal(composeSyllable("n", "ü"), "nü");
  assert.equal(composeSyllable("j", "üe"), "jue");
  assert.equal(composeSyllable("y", "üe"), "yue");
  assert.equal(composeSyllable("j", "üan"), "juan");
  assert.equal(composeSyllable("j", "ün"), "jun");
});

test("the final axis uses the approved 38 reformed spellings", () => {
  assert.equal(DEFAULT_FINALS.length, 38);
  assert.ok(DEFAULT_FINALS.includes("u"));
  assert.ok(DEFAULT_FINALS.includes("ue"));
  assert.ok(DEFAULT_FINALS.includes("uan"));
  assert.ok(DEFAULT_FINALS.includes("un"));
  assert.ok(DEFAULT_FINALS.includes("ng"));
  assert.ok(DEFAULT_FINALS.includes("wi"));
  assert.ok(DEFAULT_FINALS.includes("wo"));
  assert.ok(DEFAULT_FINALS.includes("wow"));
  assert.ok(!DEFAULT_FINALS.includes("ü"));
  assert.ok(!DEFAULT_FINALS.includes("iong"));
  assert.ok(!DEFAULT_FINALS.includes("yong"));
});

test("the initial axis follows the approved twelve-pair order", () => {
  const rows = buildInitialRows(DEFAULT_INITIALS);
  assert.equal(rows.length, 25);
  assert.deepEqual(
    rows.map((row) => row.id),
    [
      "∅",
      "p", "b",
      "t", "d",
      "k", "g",
      "f", "v",
      "s", "z",
      "ts", "dz",
      "q", "r",
      "c", "j",
      "cy", "jy",
      "x", "y",
      "m", "n",
      "h", "l",
    ],
  );
  assert.equal(rows.filter((row) => row.pair !== null).length, 24);
  assert.equal(rows.at(-1)?.id, "l");
});

test("original Pinyin initials map to the new consonant rows", () => {
  assert.equal(getInitialRowId("c"), "ts");
  assert.equal(getInitialRowId("z"), "dz");
  assert.equal(getInitialRowId("sh"), "q");
  assert.equal(getInitialRowId("ch"), "c");
  assert.equal(getInitialRowId("zh"), "j");
  assert.equal(getInitialRowId("q"), "cy");
  assert.equal(getInitialRowId("j"), "jy");
  assert.equal(getInitialRowId("w"), "∅");
  assert.equal(getInitialRowId("y"), "∅");
  assert.equal(composeReformedSyllable("q", "ang"), "qang");

  const v = DEFAULT_INITIAL_ROWS.find((row) => row.id === "v");
  const z = DEFAULT_INITIAL_ROWS.find((row) => row.id === "z");
  const y = DEFAULT_INITIAL_ROWS.find((row) => row.id === "y");
  assert.equal(v?.sourceInitial, null);
  assert.equal(z?.sourceInitial, null);
  assert.equal(y?.sourceInitial, "y");
});

test("every official reading remains reachable after initial remapping", async () => {
  const data = await loadData();
  const rowIds = new Set(DEFAULT_INITIALS);
  for (const [, char, readings] of data) {
    for (const reading of readings) {
      const coordinate = mapPinyinSyllable(reading);
      assert.ok(rowIds.has(coordinate.initialId), `${char}: missing row for ${reading}`);
      assert.ok(DEFAULT_FINALS.includes(coordinate.finalId), `${char}: missing column for ${reading}`);
    }
  }
});

test("the two-level final axis follows the approved rhyme groups", () => {
  const groups = buildRhymeGroups(DEFAULT_FINALS);
  const byId = new Map(groups.map((group) => [group.id, group]));
  const columns = groups.flatMap((group) => group.columns);

  assert.equal(groups.length, 13);
  assert.equal(columns.length, 38);
  assert.deepEqual(
    byId.get("r")?.columns.map((column) => column.final),
    ["r", "wr", "ir", "er"],
  );
  assert.deepEqual(
    byId.get("ng")?.columns.map((column) => column.final),
    ["ng", "eng", "ing", "ong"],
  );
  assert.deepEqual(
    byId.get("ei")?.columns.map((column) => column.final),
    ["ei", "wei"],
  );
  assert.deepEqual(
    byId.get("ow")?.columns.map((column) => column.final),
    ["ow", "iw", "wow"],
  );
});

test("written apical i is routed into the virtual ng vowel", () => {
  assert.equal(getFinalColumnId("b", "i"), "i");
  assert.equal(getFinalColumnId("z", "i"), "ng");
  assert.equal(getFinalColumnId("zh", "i"), "ng");
  assert.equal(getRhymeGroupId("b", "i"), "i");
  assert.equal(getRhymeGroupId("z", "i"), "ng");
  assert.equal(getRhymeGroupId("zh", "i"), "ng");
  assert.equal(isFinalColumnApplicable("b", "i"), true);
  assert.equal(isFinalColumnApplicable("dz", "i"), false);
  assert.equal(isFinalColumnApplicable("dz", "ng"), true);
  assert.equal(isFinalColumnApplicable("j", "ng"), true);
  assert.equal(isFinalColumnApplicable("b", "ng"), false);
});

test("original Pinyin maps to the approved reformed spelling", () => {
  const cases = {
    lu: ["l", "w", "lw"],
    lü: ["l", "u", "lu"],
    lüe: ["l", "ue", "lue"],
    re: ["r", "ir", "rir"],
    ruo: ["r", "wr", "rwr"],
    hui: ["h", "wei", "hwei"],
    jiu: ["jy", "iw", "jyiw"],
    shi: ["q", "ng", "qng"],
    zi: ["dz", "ng", "dzng"],
    jiong: ["jy", "ong", "jyong"],
    qiong: ["cy", "ong", "cyong"],
    xiong: ["x", "ong", "xong"],
    yong: ["y", "ong", "yong"],
    weng: ["∅", "ong", "ong"],
    wu: ["∅", "w", "w"],
    yi: ["∅", "i", "i"],
    yu: ["∅", "u", "u"],
    wen: ["∅", "wn", "wn"],
    yao: ["∅", "io", "io"],
  };

  for (const [pinyin, expected] of Object.entries(cases)) {
    const coordinate = mapPinyinSyllable(pinyin);
    assert.deepEqual(
      [coordinate.initialId, coordinate.finalId, coordinate.spelling],
      expected,
      pinyin,
    );
  }
});

test("yong uses the existing y consonant row and the shared ong column", () => {
  const yong = mapPinyinSyllable("yong");
  assert.equal(yong.initialId, "y");
  assert.equal(yong.finalId, "ong");
  assert.equal(yong.spelling, "yong");
  assert.equal(mapPinyinSyllable("yi").initialId, "∅");
  assert.ok(!DEFAULT_FINALS.includes("yong"));
});

test("card moves are constrained against the immutable original coordinate", () => {
  const hua = mapPinyinSyllable("hua");
  const origin = { initialId: hua.initialId, finalId: hua.finalId };

  assert.equal(
    planCardMove(origin, { initialId: "f", finalId: "ia" }),
    "same-rhyme",
  );
  assert.equal(
    planCardMove(origin, { initialId: "h", finalId: "wo" }),
    "exception",
  );
  assert.equal(
    planCardMove(origin, { initialId: "b", finalId: "ie" }),
    "blocked",
  );
  assert.equal(
    planCardMove(origin, { initialId: "h", finalId: "wa" }),
    "same-cell",
  );
});

test("custom finals remain editable as standalone rhyme groups", () => {
  const groups = buildRhymeGroups([...DEFAULT_FINALS, "iai"]);
  const custom = groups.at(-1);
  assert.equal(custom?.id, "custom:iai");
  assert.deepEqual(custom?.columns, [{ id: "iai", label: "iai", final: "iai" }]);
});

test("complete pinyin searches match one exact syllable", async () => {
  const data = await loadData();
  const cards = data.flatMap(([rank, char, readings]) =>
    readings.map((pinyin) => ({ char, pinyin, rank })),
  );

  const hao = planCardSearch(cards, "hao");
  assert.equal(hao.exactPinyin, "hao");
  assert.equal(hao.matches.length, 9);
  assert.ok(hao.matches.every((card) => card.pinyin === "hao"));
  assert.equal(hao.displayCards.length, cards.length);

  const ha = planCardSearch(cards, "ha");
  assert.equal(ha.exactPinyin, "ha");
  assert.equal(ha.matches.length, 3);
  assert.ok(ha.matches.every((card) => card.pinyin === "ha"));
  assert.equal(ha.displayCards.length, cards.length);

  const toned = planCardSearch(cards, "hǎo");
  assert.equal(toned.exactPinyin, "hao");
  assert.equal(toned.matches.length, 9);
});

test("search keeps partial pinyin, character, and rank lookup behavior", async () => {
  const data = await loadData();
  const cards = data.flatMap(([rank, char, readings]) =>
    readings.map((pinyin) => ({ char, pinyin, rank })),
  );

  const partial = planCardSearch(cards, "h");
  assert.equal(partial.exactPinyin, null);
  assert.ok(partial.matches.length > 9);
  assert.ok(partial.matches.every((card) => card.pinyin.includes("h")));
  assert.equal(partial.displayCards.length, partial.matches.length);

  assert.ok(planCardSearch(cards, "女").matches.some((card) => card.char === "女"));
  assert.ok(planCardSearch(cards, "3500").matches.some((card) => card.char === "矗"));
});

test("search can exactly match a reformed spelling alias", () => {
  const cards = [
    {
      char: "穷",
      pinyin: "qiong",
      rank: 1,
      searchAliases: [mapPinyinSyllable("qiong").spelling],
    },
    {
      char: "雄",
      pinyin: "xiong",
      rank: 2,
      searchAliases: [mapPinyinSyllable("xiong").spelling],
    },
  ];

  const result = planCardSearch(cards, "cyong");
  assert.equal(result.exactPinyin, "cyong");
  assert.deepEqual(result.matches.map((card) => card.char), ["穷"]);
  assert.equal(result.displayCards.length, 2);
});

test("an original Pinyin exact match wins over a colliding reformed alias", () => {
  const cards = [
    { char: "路", pinyin: "lu", rank: 1, searchAliases: ["lw"] },
    { char: "吕", pinyin: "lü", rank: 2, searchAliases: ["lu"] },
  ];

  const result = planCardSearch(cards, "lu");
  assert.equal(result.exactPinyin, "lu");
  assert.deepEqual(result.matches.map((card) => card.char), ["路"]);
});

test("centered scroll offsets stay within the table bounds", () => {
  assert.equal(centeredScrollOffset(900, 188, 600, 4_000), 694);
  assert.equal(centeredScrollOffset(0, 188, 600, 4_000), 0);
  assert.equal(centeredScrollOffset(3_900, 188, 600, 4_000), 3_400);
});
