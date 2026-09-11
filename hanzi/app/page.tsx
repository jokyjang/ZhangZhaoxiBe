"use client";

import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent,
  FormEvent,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { HANZI_SEED } from "./hanzi-data";
import {
  buildInitialRows,
  buildRhymeGroups,
  composeReformedSyllable,
  DEFAULT_FINALS,
  DEFAULT_INITIALS,
  getRhymeGroupIdForFinal,
  isFinalColumnApplicable,
  mapPinyinSyllable,
  normalizePinyin,
  normalizeReformedSpelling,
  planCardMove,
} from "./pinyin-utils";
import { centeredScrollOffset, planCardSearch } from "./search-utils";

type HanziCard = {
  id: string;
  char: string;
  rank: number;
  pinyin: string;
  initialId?: string;
  finalId?: string;
  originInitialId?: string;
  originFinalId?: string;
};

type CardPlacement = {
  cardId: string;
  initialId: string;
  finalId: string;
  originInitialId: string;
  originFinalId: string;
};

type SavedState = {
  cards: HanziCard[];
  initials: string[];
  finals: string[];
};

type SavedEdits = {
  customCards: HanziCard[];
  deletedSeedIds: string[];
  customInitials: string[];
  customFinals: string[];
  cardMoves?: CardPlacement[];
};

type CardDraft = {
  char: string;
  rank: string;
  pinyin: string;
  initialId: string | null;
  finalId: string | null;
};

type PendingMove = {
  cardId: string;
  targetInitialId: string;
  targetFinalId: string;
};

type CellDetail = {
  key: string;
  initialId: string;
  finalId: string;
  syllable: string;
};

const STORAGE_KEY = "hanzi-rhyme-atlas-v4";
const LEGACY_STORAGE_KEYS = [
  "hanzi-rhyme-atlas-v3",
  "hanzi-rhyme-atlas-v2",
  "hanzi-rhyme-atlas-v1",
];
const INITIAL_RENDER_LIMIT = 1600;
const MAX_ZOOM_OUT = 5;
const CELL_LONG_PRESS_MS = 520;
const ZOOM_LABELS = [
  "完整视图",
  "紧凑视图",
  "仅显示汉字",
  "每格前 10 字",
  "每格前 4 字",
  "仅显示数量",
] as const;

const PREVIOUS_DEFAULT_INITIALS = [
  "∅",
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
  "zh",
  "ch",
  "sh",
  "r",
  "z",
  "c",
  "s",
  "y",
  "w",
];

const PREVIOUS_DEFAULT_FINALS = [
  "a",
  "o",
  "e",
  "i",
  "u",
  "üe",
  "ai",
  "ei",
  "ui",
  "ao",
  "ou",
  "iu",
  "ie",
  "er",
  "an",
  "en",
  "in",
  "un",
  "ian",
  "uan",
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
  "ue",
  "ng",
];

const DEFAULT_CARDS: HanziCard[] = HANZI_SEED.flatMap(
  ([rank, char, readings]) =>
    readings.map((pinyin) => ({
      id: `seed-${rank}-${pinyin}`,
      char,
      rank,
      pinyin,
    })),
);

function getCardCoordinate(card: HanziCard) {
  if (card.initialId && card.finalId) {
    return {
      initialId: card.initialId,
      finalId: card.finalId,
      groupId: getRhymeGroupIdForFinal(card.finalId),
      spelling: composeReformedSyllable(card.initialId, card.finalId),
    };
  }
  return mapPinyinSyllable(card.pinyin);
}

function getCardOriginCoordinate(card: HanziCard) {
  if (card.originInitialId && card.originFinalId) {
    return {
      initialId: card.originInitialId,
      finalId: card.originFinalId,
      groupId: getRhymeGroupIdForFinal(card.originFinalId),
      spelling: composeReformedSyllable(
        card.originInitialId,
        card.originFinalId,
      ),
    };
  }
  if (card.initialId && card.finalId) return getCardCoordinate(card);
  return mapPinyinSyllable(card.pinyin);
}

function migrateSavedCard(card: HanziCard): HanziCard {
  if (card.finalId !== "yong") return card;
  return { ...card, initialId: "y", finalId: "ong" };
}

function migrateSavedPlacement(placement: CardPlacement): CardPlacement {
  return {
    ...placement,
    ...(placement.finalId === "yong"
      ? { initialId: "y", finalId: "ong" }
      : {}),
    ...(placement.originFinalId === "yong"
      ? { originInitialId: "y", originFinalId: "ong" }
      : {}),
  };
}

function isSavedState(value: unknown): value is SavedState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<SavedState>;
  return (
    Array.isArray(state.cards) &&
    Array.isArray(state.initials) &&
    Array.isArray(state.finals)
  );
}

function isSavedEdits(value: unknown): value is SavedEdits {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<SavedEdits>;
  return (
    Array.isArray(state.customCards) &&
    Array.isArray(state.deletedSeedIds) &&
    Array.isArray(state.customInitials) &&
    Array.isArray(state.customFinals)
  );
}

export default function Home() {
  const [customCards, setCustomCards] = useState<HanziCard[]>([]);
  const [deletedSeedIds, setDeletedSeedIds] = useState<string[]>([]);
  const [cardMoves, setCardMoves] = useState<CardPlacement[]>([]);
  const [initials, setInitials] = useState<string[]>(DEFAULT_INITIALS);
  const [finals, setFinals] = useState<string[]>(DEFAULT_FINALS);
  const [hydrated, setHydrated] = useState(false);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [zoomLevel, setZoomLevel] = useState(0);
  const [heatmap, setHeatmap] = useState(false);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [axisDialog, setAxisDialog] = useState<"initial" | "final" | null>(null);
  const [axisValue, setAxisValue] = useState("");
  const [renderRankLimit, setRenderRankLimit] = useState(INITIAL_RENDER_LIMIT);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [selectedMoveCardId, setSelectedMoveCardId] = useState<string | null>(
    null,
  );
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const [moveNotice, setMoveNotice] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [cellDetail, setCellDetail] = useState<CellDetail | null>(null);
  const [longPressCellKey, setLongPressCellKey] = useState<string | null>(null);
  const tableShellRef = useRef<HTMLDivElement>(null);
  const zoomWheelTimestampRef = useRef(0);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressStartRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
  } | null>(null);
  const suppressNextCellClickRef = useRef(false);
  const [draft, setDraft] = useState<CardDraft>({
    char: "",
    rank: "",
    pinyin: "",
    initialId: null,
    finalId: null,
  });

  const deletedSeedSet = useMemo(
    () => new Set(deletedSeedIds),
    [deletedSeedIds],
  );
  const baseCards = useMemo(
    () => [
      ...DEFAULT_CARDS.filter((card) => !deletedSeedSet.has(card.id)),
      ...customCards,
    ],
    [customCards, deletedSeedSet],
  );
  const cardMoveMap = useMemo(
    () => new Map(cardMoves.map((move) => [move.cardId, move])),
    [cardMoves],
  );
  const cards = useMemo(
    () =>
      baseCards.map((card) => {
        const move = cardMoveMap.get(card.id);
        return move
          ? {
              ...card,
              initialId: move.initialId,
              finalId: move.finalId,
              originInitialId: move.originInitialId,
              originFinalId: move.originFinalId,
            }
          : card;
      }),
    [baseCards, cardMoveMap],
  );

  useEffect(() => {
    const hydrateFromStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (isSavedEdits(parsed)) {
            setCustomCards(parsed.customCards.map(migrateSavedCard));
            setDeletedSeedIds(parsed.deletedSeedIds);
            setCardMoves(
              (parsed.cardMoves ?? []).map(migrateSavedPlacement),
            );
            setInitials([
              ...DEFAULT_INITIALS,
              ...parsed.customInitials.filter(
                (initial) => !DEFAULT_INITIALS.includes(initial),
              ),
            ]);
            setFinals([
              ...DEFAULT_FINALS,
              ...parsed.customFinals.filter(
                (final) =>
                  final !== "yong" && !DEFAULT_FINALS.includes(final),
              ),
            ]);
          }
        } else {
          const legacyKey = LEGACY_STORAGE_KEYS.find((key) =>
            localStorage.getItem(key),
          );
          const legacyStored = legacyKey ? localStorage.getItem(legacyKey) : null;
          if (legacyStored) {
            const legacy: unknown = JSON.parse(legacyStored);
            if (isSavedState(legacy)) {
              const customCards = legacy.cards
                .filter((card) => !card.id.startsWith("seed-"))
                .map(migrateSavedCard);
              const customInitials = legacy.initials.filter(
                (initial) =>
                  !DEFAULT_INITIALS.includes(initial) &&
                  !PREVIOUS_DEFAULT_INITIALS.includes(initial),
              );
              const customFinals = legacy.finals.filter(
                (final) =>
                  final !== "yong" &&
                  !DEFAULT_FINALS.includes(final) &&
                  !PREVIOUS_DEFAULT_FINALS.includes(final),
              );
              setCustomCards(customCards);
              setInitials([...DEFAULT_INITIALS, ...customInitials]);
              setFinals([...DEFAULT_FINALS, ...customFinals]);
              LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
            }
          }
        }
      } catch {
        // A malformed local draft should never prevent the atlas from loading.
      } finally {
        setHydrated(true);
      }
    };
    const animationFrame = window.requestAnimationFrame(hydrateFromStorage);
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        customCards,
        deletedSeedIds,
        customInitials: initials.filter(
          (initial) => !DEFAULT_INITIALS.includes(initial),
        ),
        customFinals: finals.filter(
          (final) => final !== "yong" && !DEFAULT_FINALS.includes(final),
        ),
        cardMoves,
      } satisfies SavedEdits),
    );
  }, [cardMoves, customCards, deletedSeedIds, finals, hydrated, initials]);

  useEffect(() => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number },
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const revealAllCards = () => setRenderRankLimit(HANZI_SEED.length);
    const idleHandle = idleWindow.requestIdleCallback?.(revealAllCards, {
      timeout: 900,
    });
    const timeoutHandle =
      idleHandle === undefined ? window.setTimeout(revealAllCards, 120) : undefined;

    return () => {
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
    };
  }, []);

  useEffect(
    () => () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    },
    [],
  );

  const deferredQuery = useDeferredValue(query);
  const searchableCards = useMemo(
    () =>
      cards.map((card) => ({
        ...card,
        searchAliases: [getCardCoordinate(card).spelling],
      })),
    [cards],
  );
  const searchPlan = useMemo(
    () => planCardSearch(searchableCards, deferredQuery),
    [deferredQuery, searchableCards],
  );
  const {
    displayCards,
    exactPinyin,
    matches: filteredCards,
    normalizedQuery,
  } = searchPlan;

  const searchTargetKey = useMemo(() => {
    if (!exactPinyin) return null;
    const exactCard = filteredCards[0];
    if (!exactCard) return null;
    const coordinate = getCardCoordinate(exactCard);
    return `${coordinate.initialId}|${coordinate.finalId}`;
  }, [exactPinyin, filteredCards]);

  const initialRows = useMemo(() => buildInitialRows(initials), [initials]);
  const rhymeGroups = useMemo(() => buildRhymeGroups(finals), [finals]);
  const finalColumns = useMemo(
    () => rhymeGroups.flatMap((group) => group.columns),
    [rhymeGroups],
  );
  const displayCellCounts = useMemo(() => {
    const counts = new Map<string, number>();
    displayCards.forEach((card) => {
      const coordinate = getCardCoordinate(card);
      const key = `${coordinate.initialId}|${coordinate.finalId}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [displayCards]);
  const maximumDisplayCellCount = useMemo(
    () => Math.max(1, ...displayCellCounts.values()),
    [displayCellCounts],
  );

  const visibleCards = useMemo(
    () =>
      normalizedQuery
        ? displayCards
        : displayCards.filter(
            (card) =>
              !card.id.startsWith("seed-") || card.rank <= renderRankLimit,
          ),
    [displayCards, normalizedQuery, renderRankLimit],
  );

  const groupedCards = useMemo(() => {
    const cells = new Map<string, HanziCard[]>();
    visibleCards.forEach((card) => {
      const coordinate = getCardCoordinate(card);
      const key = `${coordinate.initialId}|${coordinate.finalId}`;
      const current = cells.get(key) ?? [];
      current.push(card);
      cells.set(key, current);
    });
    cells.forEach((cellCards) => cellCards.sort((a, b) => a.rank - b.rank));
    return cells;
  }, [visibleCards]);

  const cellDetailCards = useMemo(() => {
    if (!cellDetail) return [];
    return displayCards
      .filter((card) => {
        const coordinate = getCardCoordinate(card);
        return (
          coordinate.initialId === cellDetail.initialId &&
          coordinate.finalId === cellDetail.finalId
        );
      })
      .sort((a, b) => a.rank - b.rank);
  }, [cellDetail, displayCards]);

  useEffect(() => {
    if (!searchTargetKey) return;
    const animationFrame = window.requestAnimationFrame(() => {
      const shell = tableShellRef.current;
      const cell = Array.from(
        shell?.querySelectorAll<HTMLTableCellElement>("td[data-cell-key]") ?? [],
      ).find((candidate) => candidate.dataset.cellKey === searchTargetKey);
      if (!shell || !cell) return;

      const shellBounds = shell.getBoundingClientRect();
      const cellBounds = cell.getBoundingClientRect();
      const cellLeft = cellBounds.left - shellBounds.left + shell.scrollLeft;
      const cellTop = cellBounds.top - shellBounds.top + shell.scrollTop;

      shell.scrollTo({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        left: centeredScrollOffset(
          cellLeft,
          cellBounds.width,
          shell.clientWidth,
          shell.scrollWidth,
        ),
        top: centeredScrollOffset(
          cellTop,
          cellBounds.height,
          shell.clientHeight,
          shell.scrollHeight,
        ),
      });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [searchTargetKey]);

  const attestedCells = useMemo(
    () =>
      new Set(
        cards.map((card) => {
          const coordinate = getCardCoordinate(card);
          return `${coordinate.initialId}|${coordinate.finalId}`;
        }),
      ),
    [cards],
  );

  const axisCounts = useMemo(() => {
    const rows = new Map<string, number>();
    const columns = new Map<string, number>();
    const groups = new Map<string, number>();

    cards.forEach((card) => {
      const coordinate = getCardCoordinate(card);
      rows.set(
        coordinate.initialId,
        (rows.get(coordinate.initialId) ?? 0) + 1,
      );
      columns.set(
        coordinate.finalId,
        (columns.get(coordinate.finalId) ?? 0) + 1,
      );
      groups.set(
        coordinate.groupId,
        (groups.get(coordinate.groupId) ?? 0) + 1,
      );
    });

    return { rows, columns, groups };
  }, [cards]);

  const uniqueCharacterCount = useMemo(
    () => new Set(cards.map((card) => card.char)).size,
    [cards],
  );
  const cardsById = useMemo(
    () => new Map(cards.map((card) => [card.id, card])),
    [cards],
  );
  const activeMoveCardId = draggedCardId ?? selectedMoveCardId;
  const activeMoveCard = activeMoveCardId
    ? cardsById.get(activeMoveCardId) ?? null
    : null;

  const clearMoveMode = () => {
    setDraggedCardId(null);
    setSelectedMoveCardId(null);
    setDropTargetKey(null);
  };

  const cancelCellLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressStartRef.current = null;
    setLongPressCellKey(null);
  };

  const startCellLongPress = (
    event: ReactPointerEvent<HTMLTableCellElement>,
    detail: CellDetail,
  ) => {
    if (
      zoomLevel !== MAX_ZOOM_OUT ||
      selectedMoveCardId ||
      !event.isPrimary ||
      event.button !== 0
    ) {
      return;
    }
    cancelCellLongPress();
    const pointerId = event.pointerId;
    longPressStartRef.current = {
      pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    setLongPressCellKey(detail.key);
    longPressTimerRef.current = window.setTimeout(() => {
      if (longPressStartRef.current?.pointerId !== pointerId) return;
      suppressNextCellClickRef.current = true;
      longPressTimerRef.current = null;
      longPressStartRef.current = null;
      setLongPressCellKey(null);
      setCellDetail(detail);
    }, CELL_LONG_PRESS_MS);
  };

  const trackCellLongPress = (
    event: ReactPointerEvent<HTMLTableCellElement>,
  ) => {
    const start = longPressStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    if (
      Math.abs(event.clientX - start.x) > 10 ||
      Math.abs(event.clientY - start.y) > 10
    ) {
      cancelCellLongPress();
    }
  };

  const closeCellDetail = () => {
    suppressNextCellClickRef.current = false;
    setCellDetail(null);
  };

  const selectDetailCardForMove = (card: HanziCard) => {
    suppressNextCellClickRef.current = false;
    setEditing(true);
    setMoveNotice(null);
    setDraggedCardId(null);
    setDropTargetKey(null);
    setSelectedMoveCardId(card.id);
    setCellDetail(null);
  };

  const commitCardMove = (
    card: HanziCard,
    target: { initialId: string; finalId: string },
  ) => {
    const origin = getCardOriginCoordinate(card);
    setCardMoves((current) => {
      const withoutCard = current.filter((move) => move.cardId !== card.id);
      if (
        target.initialId === origin.initialId &&
        target.finalId === origin.finalId
      ) {
        return withoutCard;
      }
      return [
        ...withoutCard,
        {
          cardId: card.id,
          initialId: target.initialId,
          finalId: target.finalId,
          originInitialId: origin.initialId,
          originFinalId: origin.finalId,
        },
      ];
    });
    const targetSpelling = composeReformedSyllable(
      target.initialId,
      target.finalId,
    );
    setMoveNotice(`${card.char} 已移动到 ${targetSpelling}。`);
    clearMoveMode();
  };

  const requestCardMove = (
    cardId: string,
    target: { initialId: string; finalId: string },
  ) => {
    const card = cardsById.get(cardId);
    if (!card) return;
    const current = getCardCoordinate(card);
    if (
      current.initialId === target.initialId &&
      current.finalId === target.finalId
    ) {
      setMoveNotice(`${card.char} 已在这个单元格中。`);
      clearMoveMode();
      return;
    }

    const origin = getCardOriginCoordinate(card);
    const decision = planCardMove(origin, target);
    const targetSpelling = composeReformedSyllable(
      target.initialId,
      target.finalId,
    );
    if (decision === "blocked") {
      setMoveNotice(
        `不能把 ${card.char} 移到 ${targetSpelling}：目标同时改变了原声母和原韵组。`,
      );
      clearMoveMode();
      return;
    }
    if (decision === "exception") {
      setPendingMove({
        cardId,
        targetInitialId: target.initialId,
        targetFinalId: target.finalId,
      });
      setDraggedCardId(null);
      setDropTargetKey(null);
      return;
    }
    commitCardMove(card, target);
  };

  const openNewCard = (
    pinyin = "",
    target?: { initialId: string; finalId: string },
  ) => {
    const highestRank = cards.reduce((max, card) => Math.max(max, card.rank), 0);
    setDraft({
      char: "",
      rank: String(highestRank + 1),
      pinyin,
      initialId: target?.initialId ?? null,
      finalId: target?.finalId ?? null,
    });
    setCardDialogOpen(true);
  };

  const createCard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const char = Array.from(draft.char.trim())[0] ?? "";
    const targeted = Boolean(draft.initialId && draft.finalId);
    const pinyin = targeted
      ? normalizeReformedSpelling(draft.pinyin)
      : normalizePinyin(draft.pinyin);
    const rank = Math.max(1, Number.parseInt(draft.rank, 10) || cards.length + 1);
    if (!char || !pinyin) return;

    const coordinate = targeted
      ? {
          initialId: draft.initialId as string,
          finalId: draft.finalId as string,
        }
      : mapPinyinSyllable(pinyin);
    const initialRowId = coordinate.initialId;
    if (!initials.includes(initialRowId)) {
      setInitials((current) => [...current, initialRowId]);
    }
    if (!finals.includes(coordinate.finalId)) {
      setFinals((current) => [...current, coordinate.finalId]);
    }

    setCustomCards((current) => [
      ...current,
      {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `custom-${Date.now()}`,
        char,
        rank,
        pinyin,
        ...(targeted
          ? {
              initialId: coordinate.initialId,
              finalId: coordinate.finalId,
              originInitialId: coordinate.initialId,
              originFinalId: coordinate.finalId,
            }
          : {}),
      },
    ]);
    setCardDialogOpen(false);
  };

  const deleteCard = (id: string) => {
    if (activeMoveCardId === id) clearMoveMode();
    setCardMoves((current) => current.filter((move) => move.cardId !== id));
    if (id.startsWith("seed-")) {
      setDeletedSeedIds((current) =>
        current.includes(id) ? current : [...current, id],
      );
      return;
    }
    setCustomCards((current) => current.filter((card) => card.id !== id));
  };

  const addAxis = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value =
      normalizeReformedSpelling(axisValue) || axisValue.trim().toLowerCase();
    if (!value || !axisDialog) return;
    if (axisDialog === "final" && value === "yong") {
      setAxisDialog(null);
      setAxisValue("");
      return;
    }
    if (axisDialog === "initial" && !initials.includes(value)) {
      setInitials((current) => [...current, value]);
    }
    if (axisDialog === "final" && !finals.includes(value)) {
      setFinals((current) => [...current, value]);
    }
    setAxisDialog(null);
    setAxisValue("");
  };

  const restoreDefaults = () => {
    if (!window.confirm("恢复官方一级字表的 3,500 字数据？本机上的编辑将被清除。")) {
      return;
    }
    setCustomCards([]);
    setDeletedSeedIds([]);
    setCardMoves([]);
    setInitials(DEFAULT_INITIALS);
    setFinals(DEFAULT_FINALS);
    setRenderRankLimit(HANZI_SEED.length);
    setQuery("");
    setMoveNotice(null);
    setCellDetail(null);
    cancelCellLongPress();
    clearMoveMode();
  };

  const toggleEditing = () => {
    if (editing) {
      clearMoveMode();
      setPendingMove(null);
      setMoveNotice(null);
    }
    setEditing((current) => !current);
  };

  const changeZoom = (nextLevel: number) => {
    const boundedLevel = Math.max(0, Math.min(MAX_ZOOM_OUT, nextLevel));
    cancelCellLongPress();
    setZoomLevel(boundedLevel);
    if (boundedLevel !== MAX_ZOOM_OUT) {
      setHeatmap(false);
      setCellDetail(null);
    }
  };

  const handleZoomWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const now = event.timeStamp;
    if (now - zoomWheelTimestampRef.current < 180) return;
    zoomWheelTimestampRef.current = now;
    changeZoom(zoomLevel + (event.deltaY > 0 ? 1 : -1));
  };

  const pendingMoveCard = pendingMove
    ? cardsById.get(pendingMove.cardId) ?? null
    : null;
  const pendingMoveOrigin = pendingMoveCard
    ? getCardOriginCoordinate(pendingMoveCard)
    : null;
  const pendingMoveTargetSpelling = pendingMove
    ? composeReformedSyllable(
        pendingMove.targetInitialId,
        pendingMove.targetFinalId,
      )
    : "";

  return (
    <main className="atlas">
      <header className="hero">
        <div className="eyebrow">
          <span className="seal" aria-hidden="true">
            音
          </span>
          <span>新中文 · 声韵重构视图</span>
        </div>
        <div className="hero-copy">
          <div>
            <h1>
              汉字
              <span>音韵地图</span>
            </h1>
            <p>
              将国务院《通用规范汉字表》一级字表中的 3,500 个常用规范汉字，
              按 12 对新声母与 13 个新韵组铺成一张可以探索、编辑的巨型坐标表；
              字卡仍保留原始普通话拼音作为可追溯基线。
            </p>
          </div>
          <div className="hero-stats" aria-label="数据概览">
            <div>
              <strong>{uniqueCharacterCount.toLocaleString("zh-CN")}</strong>
              <span>汉字</span>
            </div>
            <div>
              <strong>{cards.length.toLocaleString("zh-CN")}</strong>
              <span>读音字卡</span>
            </div>
            <div>
              <strong>{finalColumns.length}</strong>
              <span>具体韵母列</span>
            </div>
          </div>
        </div>
      </header>

      <section className="workspace" aria-label="汉字拼音表">
        <div className="toolbar">
          <div className="search-wrap">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="搜索汉字、拼音或官方字表序号"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索汉字、拼音或字表序号…"
              type="search"
              value={query}
            />
            {normalizedQuery && (
              <span className="result-count">
                {filteredCards.length.toLocaleString("zh-CN")} 张字卡
              </span>
            )}
          </div>

          <div className="toolbar-actions">
            <div aria-label="地图缩放" className="zoom-controls" role="group">
              <button
                aria-label="缩小一级"
                disabled={zoomLevel === MAX_ZOOM_OUT}
                onClick={() => changeZoom(zoomLevel + 1)}
                type="button"
              >
                −
              </button>
              <output aria-live="polite">{ZOOM_LABELS[zoomLevel]}</output>
              <button
                aria-label="放大一级"
                disabled={zoomLevel === 0}
                onClick={() => changeZoom(zoomLevel - 1)}
                type="button"
              >
                ＋
              </button>
            </div>
            {zoomLevel === MAX_ZOOM_OUT && (
              <button
                aria-pressed={heatmap}
                className={`heatmap-toggle ${heatmap ? "is-active" : ""}`}
                onClick={() => setHeatmap((current) => !current)}
                type="button"
              >
                {heatmap ? "关闭热图" : "开启热图"}
              </button>
            )}
            <button
              aria-pressed={editing}
              className={`edit-toggle ${editing ? "is-active" : ""}`}
              onClick={toggleEditing}
              type="button"
            >
              <span aria-hidden="true">{editing ? "✓" : "✎"}</span>
              {editing ? "完成编辑" : "编辑表格"}
            </button>
            <button className="primary-button" onClick={() => openNewCard()} type="button">
              <span aria-hidden="true">＋</span>
              新建字卡
            </button>
          </div>
        </div>

        {editing && (
          <div className="edit-strip">
            <span>编辑模式</span>
            <p aria-live="polite" role="status">
              {moveNotice ??
                (selectedMoveCardId
                  ? `已选择 ${activeMoveCard?.char ?? "字卡"}，请点击目标单元格。`
                  : "拖动字卡，或点「移」选择目标；绿色可直接移动，红色需要确认。")}
            </p>
            {selectedMoveCardId && (
              <button onClick={clearMoveMode} type="button">
                取消移动
              </button>
            )}
            <button onClick={() => setAxisDialog("initial")} type="button">
              ＋ 添加声母行
            </button>
            <button onClick={() => setAxisDialog("final")} type="button">
              ＋ 添加韵母列
            </button>
            <button className="reset-button" onClick={restoreDefaults} type="button">
              恢复初始数据
            </button>
          </div>
        )}

        <div className="axis-guide">
          <span>
            <b>横轴</b> 新中文韵组 → 具体韵母
          </span>
          <i aria-hidden="true" />
          <span>
            <b>纵轴</b> 新中文声母
          </span>
          {zoomLevel === MAX_ZOOM_OUT ? (
            <>
              <span className="count-detail-hint">长按单元格查看详情</span>
              {heatmap && (
                <span className="heatmap-legend">
                  少 <i aria-hidden="true" /> 多
                </span>
              )}
            </>
          ) : (
            <em>拖动浏览；按住 Ctrl / ⌘ 滚动可缩放</em>
          )}
        </div>

        <div
          className={`table-shell zoom-level-${zoomLevel} ${
            zoomLevel >= 1 ? "is-compact" : ""
          } ${heatmap && zoomLevel === MAX_ZOOM_OUT ? "is-heatmap" : ""}`}
          onWheel={handleZoomWheel}
          ref={tableShellRef}
        >
          <table>
            <thead>
              <tr className="rhyme-group-row">
                <th className="corner-cell" rowSpan={2} scope="col">
                  <span>声母</span>
                  <i />
                  <span>韵组 / 韵母</span>
                </th>
                {rhymeGroups.map((group) => (
                  <th
                    className="rhyme-group-header"
                    colSpan={group.columns.length}
                    key={group.id}
                    scope="colgroup"
                  >
                    <div>
                      <span>{group.label}</span>
                      <small>{axisCounts.groups.get(group.id) ?? 0} 张</small>
                    </div>
                  </th>
                ))}
              </tr>
              <tr className="final-row">
                {finalColumns.map((column) => (
                  <th className="final-header" key={column.id} scope="col">
                    <div>
                      <span>{column.label}</span>
                      <small>{axisCounts.columns.get(column.id) ?? 0} 张</small>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {initialRows.map((initialRow) => (
                <tr
                  className={
                    initialRow.pairPosition === "first" ? "initial-pair-start" : ""
                  }
                  key={initialRow.id}
                >
                  <th
                    aria-label={`${initialRow.label} 声母${
                      initialRow.sourceInitial &&
                      initialRow.sourceInitial !== initialRow.label
                        ? `，原拼音 ${initialRow.sourceInitial}`
                        : initialRow.sourceInitial === null
                          ? "，原拼音无对应音"
                          : ""
                    }`}
                    className="initial-header"
                    scope="row"
                  >
                    <div>
                      <span>{initialRow.label}</span>
                      {initialRow.sourceInitial !== initialRow.label && (
                        <em className="initial-source">
                          {initialRow.sourceInitial ? (
                            <>
                              拼音 <b>{initialRow.sourceInitial}</b>
                            </>
                          ) : (
                            "拼音无对应"
                          )}
                        </em>
                      )}
                      {initialRow.note && (
                        <em className="initial-note">{initialRow.note}</em>
                      )}
                    </div>
                    <small>{axisCounts.rows.get(initialRow.id) ?? 0} 张字卡</small>
                  </th>
                  {finalColumns.map((column) => {
                    const key = `${initialRow.id}|${column.id}`;
                    const cellCards = groupedCards.get(key) ?? [];
                    const cellCount = displayCellCounts.get(key) ?? 0;
                    const visibleCellCards =
                      zoomLevel === 3
                        ? cellCards.slice(0, 10)
                        : zoomLevel === 4
                          ? cellCards.slice(0, 4)
                          : cellCards;
                    const syllable = composeReformedSyllable(
                      initialRow.id,
                      column.final,
                    );
                    const applicable = isFinalColumnApplicable(
                      initialRow.id,
                      column.id,
                    );
                    const cellDetailTarget: CellDetail = {
                      key,
                      initialId: initialRow.id,
                      finalId: column.id,
                      syllable,
                    };
                    const attested = attestedCells.has(key);
                    const isSearchTarget = searchTargetKey === key;
                    const moveDecision = activeMoveCard
                      ? planCardMove(getCardOriginCoordinate(activeMoveCard), {
                          initialId: initialRow.id,
                          finalId: column.id,
                        })
                      : null;
                    const showDropState = selectedMoveCardId
                      ? activeMoveCard !== null && moveDecision !== "blocked"
                      : dropTargetKey === key;
                    const dropClass = showDropState
                      ? moveDecision === "exception"
                        ? "is-exception-drop"
                        : moveDecision === "blocked" || !applicable
                          ? "is-blocked-drop"
                          : "is-allowed-drop"
                      : "";
                    const heatIntensity = Math.pow(
                      cellCount / maximumDisplayCellCount,
                      0.58,
                    );
                    const heatmapStyle =
                      heatmap && zoomLevel === MAX_ZOOM_OUT && applicable
                        ? ({
                            "--heat-opacity": cellCount
                              ? 0.1 + heatIntensity * 0.78
                              : 0.025,
                            "--heat-text":
                              heatIntensity > 0.58 ? "#fffaf2" : "#5a241d",
                          } as CSSProperties)
                        : undefined;
                    return (
                      <td
                        aria-label={
                          selectedMoveCardId && applicable
                            ? `将所选字卡移动到 ${syllable}`
                            : zoomLevel === MAX_ZOOM_OUT && applicable
                              ? `${syllable}，${cellCount} 张字卡，长按或按回车查看详情`
                              : undefined
                        }
                        aria-haspopup={
                          zoomLevel === MAX_ZOOM_OUT && applicable
                            ? "dialog"
                            : undefined
                        }
                        aria-current={isSearchTarget ? "true" : undefined}
                        aria-disabled={!applicable || undefined}
                        className={`${attested ? "is-attested" : ""} ${
                          isSearchTarget ? "is-search-target" : ""
                        } ${!applicable ? "is-inapplicable" : ""} ${
                          heatmapStyle ? "is-heat-cell" : ""
                        } ${longPressCellKey === key ? "is-long-pressing" : ""} ${dropClass}`}
                        data-card-count={cellCount}
                        data-cell-key={key}
                        key={key}
                        onClick={() => {
                          if (suppressNextCellClickRef.current) {
                            suppressNextCellClickRef.current = false;
                            return;
                          }
                          if (selectedMoveCardId && applicable) {
                            requestCardMove(selectedMoveCardId, {
                              initialId: initialRow.id,
                              finalId: column.id,
                            });
                          }
                        }}
                        onContextMenu={(event) => {
                          if (zoomLevel === MAX_ZOOM_OUT && applicable) {
                            event.preventDefault();
                          }
                        }}
                        onDragOver={(event) => {
                          if (!draggedCardId) return;
                          event.preventDefault();
                          event.dataTransfer.dropEffect =
                            moveDecision === "blocked" || !applicable
                              ? "none"
                              : "move";
                          if (dropTargetKey !== key) setDropTargetKey(key);
                        }}
                        onDrop={(event) => {
                          if (!draggedCardId) return;
                          event.preventDefault();
                          if (!applicable) {
                            setMoveNotice("这个声韵组合当前不可用。");
                            clearMoveMode();
                            return;
                          }
                          requestCardMove(draggedCardId, {
                            initialId: initialRow.id,
                            finalId: column.id,
                          });
                        }}
                        onKeyDown={(event) => {
                          if (
                            !applicable ||
                            (event.key !== "Enter" && event.key !== " ")
                          ) return;
                          event.preventDefault();
                          if (selectedMoveCardId) {
                            requestCardMove(selectedMoveCardId, {
                              initialId: initialRow.id,
                              finalId: column.id,
                            });
                            return;
                          }
                          if (zoomLevel === MAX_ZOOM_OUT) {
                            setCellDetail(cellDetailTarget);
                          }
                        }}
                        onPointerCancel={cancelCellLongPress}
                        onPointerDown={(event) => {
                          if (applicable) {
                            startCellLongPress(event, cellDetailTarget);
                          }
                        }}
                        onPointerLeave={cancelCellLongPress}
                        onPointerMove={trackCellLongPress}
                        onPointerUp={cancelCellLongPress}
                        style={heatmapStyle}
                        tabIndex={
                          applicable &&
                          (selectedMoveCardId || zoomLevel === MAX_ZOOM_OUT)
                            ? 0
                            : undefined
                        }
                        title={
                          zoomLevel === MAX_ZOOM_OUT && applicable
                            ? "长按查看字卡详情"
                            : undefined
                        }
                      >
                        {zoomLevel === MAX_ZOOM_OUT ? (
                          <div className="cell-count-only">
                            {applicable ? cellCount : "—"}
                          </div>
                        ) : (
                          <>
                            <div className="cell-heading">
                              <span>{applicable ? syllable : "—"}</span>
                              {cellCount > 0 && <b>{cellCount}</b>}
                              {editing && applicable && (
                                <button
                                  aria-label={`在 ${syllable} 中添加字卡`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openNewCard(syllable, {
                                      initialId: initialRow.id,
                                      finalId: column.id,
                                    });
                                  }}
                                  title={`添加到新中文音节 ${syllable}`}
                                  type="button"
                                >
                                  ＋
                                </button>
                              )}
                            </div>
                            <div className="card-stack">
                              {visibleCellCards.map((card) => {
                            const coordinate = getCardCoordinate(card);
                            const origin = getCardOriginCoordinate(card);
                            const moved =
                              coordinate.initialId !== origin.initialId ||
                              coordinate.finalId !== origin.finalId;
                            const showAssignedSpelling =
                              moved || coordinate.spelling !== card.pinyin;
                            const exception =
                              moved && coordinate.groupId !== origin.groupId;
                            const selected = activeMoveCardId === card.id;
                                return (
                              <article
                                aria-label={`${card.char}，原拼音 ${card.pinyin}${
                                  showAssignedSpelling
                                    ? `，新拼写 ${coordinate.spelling}`
                                    : ""
                                }${exception ? "，跨韵组例外" : ""}`}
                                className={`hanzi-card ${
                                  exception ? "is-pronunciation-exception" : ""
                                } ${selected ? "is-being-moved" : ""}`}
                                draggable={editing}
                                key={card.id}
                                onDragEnd={clearMoveMode}
                                onDragStart={(event) => {
                                  if (!editing) {
                                    event.preventDefault();
                                    return;
                                  }
                                  event.dataTransfer.effectAllowed = "move";
                                  event.dataTransfer.setData("text/plain", card.id);
                                  setMoveNotice(null);
                                  setSelectedMoveCardId(null);
                                  setDraggedCardId(card.id);
                                }}
                                title={
                                  exception
                                    ? "跨出原韵组的发音例外"
                                    : moved
                                      ? `已分配新拼写 ${coordinate.spelling}`
                                      : showAssignedSpelling
                                        ? `新中文拼写 ${coordinate.spelling}`
                                        : undefined
                                }
                              >
                                {zoomLevel <= 1 && (
                                  <span className="rank">
                                    #{card.rank.toLocaleString("zh-CN")}
                                  </span>
                                )}
                                <strong>{card.char}</strong>
                                {zoomLevel <= 1 && (
                                  <>
                                    <span className="pinyin">{card.pinyin}</span>
                                    {showAssignedSpelling && (
                                      <span className="assigned-spelling">
                                        → {coordinate.spelling}
                                      </span>
                                    )}
                                  </>
                                )}
                                {editing && zoomLevel <= 1 && (
                                  <>
                                    <button
                                      aria-label={`移动 ${card.char}（${card.pinyin}）`}
                                      aria-pressed={selectedMoveCardId === card.id}
                                      className="move-card"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setMoveNotice(null);
                                        setDraggedCardId(null);
                                        setDropTargetKey(null);
                                        setSelectedMoveCardId((current) =>
                                          current === card.id ? null : card.id,
                                        );
                                      }}
                                      title="选择目标单元格"
                                      type="button"
                                    >
                                      移
                                    </button>
                                    <button
                                      aria-label={`删除 ${card.char}（${card.pinyin}）`}
                                      className="delete-card"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        deleteCard(card.id);
                                      }}
                                      title="删除这张读音字卡"
                                      type="button"
                                    >
                                      ×
                                    </button>
                                  </>
                                )}
                              </article>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="table-footer">
          <p>
            字符范围与序号严格采用国务院《通用规范汉字表》一级字表（0001–3500），
            不使用繁体字频表或繁简转换表。字卡保留经交叉核对的原始普通话拼音；
            表格坐标使用当前已确认的新中文声母、韵组和具体韵母，拼音统一忽略声调。
          </p>
          <span>
            {!hydrated
              ? "正在读取本机编辑…"
              : renderRankLimit < HANZI_SEED.length && !normalizedQuery
                ? "正在空闲时补全字卡…"
                : "本机编辑自动保存"}
          </span>
        </footer>
      </section>

      {cellDetail && zoomLevel === MAX_ZOOM_OUT && (
        <div className="modal-backdrop" role="presentation">
          <div
            aria-labelledby="cell-detail-title"
            aria-modal="true"
            className="modal cell-detail-modal"
            role="dialog"
          >
            <button
              aria-label="关闭单元格详情"
              autoFocus
              className="modal-close"
              onClick={closeCellDetail}
              type="button"
            >
              ×
            </button>
            <span className="modal-kicker">SYLLABLE DETAIL</span>
            <h2 id="cell-detail-title">
              <code>{cellDetail.syllable}</code>
              <small>{cellDetailCards.length} 张字卡</small>
            </h2>
            <p>选择一张字卡，关闭详情后再点击目标单元格完成移动。</p>
            {cellDetailCards.length ? (
              <div className="cell-detail-grid">
                {cellDetailCards.map((card) => {
                  const coordinate = getCardCoordinate(card);
                  const origin = getCardOriginCoordinate(card);
                  const moved =
                    coordinate.initialId !== origin.initialId ||
                    coordinate.finalId !== origin.finalId;
                  const showAssignedSpelling =
                    moved || coordinate.spelling !== card.pinyin;
                  const exception =
                    moved && coordinate.groupId !== origin.groupId;
                  return (
                    <button
                      aria-label={`选择 ${card.char}（${card.pinyin}）进行移动`}
                      className={`cell-detail-card ${
                        exception ? "is-pronunciation-exception" : ""
                      }`}
                      key={card.id}
                      onClick={() => selectDetailCardForMove(card)}
                      type="button"
                    >
                      <span className="rank">
                        #{card.rank.toLocaleString("zh-CN")}
                      </span>
                      <strong>{card.char}</strong>
                      <span className="pinyin">{card.pinyin}</span>
                      {showAssignedSpelling && (
                        <span className="assigned-spelling">
                          → {coordinate.spelling}
                        </span>
                      )}
                      <span className="cell-detail-action">选择移动</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="cell-detail-empty">这个单元格目前没有字卡。</div>
            )}
          </div>
        </div>
      )}

      {cardDialogOpen && (
        <div className="modal-backdrop" role="presentation">
          <div
            aria-labelledby="card-dialog-title"
            aria-modal="true"
            className="modal"
            role="dialog"
          >
            <button
              aria-label="关闭"
              className="modal-close"
              onClick={() => setCardDialogOpen(false)}
              type="button"
            >
              ×
            </button>
            <span className="modal-kicker">CHARACTER CARD</span>
            <h2 id="card-dialog-title">新建汉字卡片</h2>
            <p>
              {draft.initialId
                ? "填写汉字与该单元格的新中文拼写；卡片将固定放入所选坐标。"
                : "填写一个汉字与无声调原拼音，系统会按当前规则自动映射。"}
            </p>
            <form onSubmit={createCard}>
              <label>
                汉字
                <input
                  autoFocus
                  maxLength={2}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, char: event.target.value }))
                  }
                  placeholder="例：行"
                  required
                  value={draft.char}
                />
              </label>
              <div className="form-row">
                <label>
                  排序序号
                  <input
                    min="1"
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, rank: event.target.value }))
                    }
                    required
                    type="number"
                    value={draft.rank}
                  />
                </label>
                <label>
                  {draft.initialId ? "新中文拼写" : "汉语拼音"}
                  <input
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        pinyin: event.target.value,
                      }))
                    }
                    placeholder={draft.initialId ? "例：xong" : "例：xing"}
                    required
                    value={draft.pinyin}
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button onClick={() => setCardDialogOpen(false)} type="button">
                  取消
                </button>
                <button className="primary-button" type="submit">
                  创建字卡
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingMove && pendingMoveCard && pendingMoveOrigin && (
        <div className="modal-backdrop" role="presentation">
          <div
            aria-labelledby="move-dialog-title"
            aria-modal="true"
            className="modal modal-small move-confirmation"
            role="dialog"
          >
            <span className="modal-kicker">RHYME EXCEPTION</span>
            <h2 id="move-dialog-title">确认跨出原韵组？</h2>
            <p>
              将「{pendingMoveCard.char}」从原韵组
              <b> {pendingMoveOrigin.groupId} </b>
              移至新拼写
              <b> {pendingMoveTargetSpelling}</b>。它仍保留声母
              <b> {pendingMoveOrigin.initialId}</b>，但不再保持原押韵关系。
            </p>
            <div className="exception-preview">
              <span>{pendingMoveCard.char}</span>
              <small>→ {pendingMoveTargetSpelling}</small>
              <em>确认后字卡将以红框标为例外</em>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setPendingMove(null);
                  clearMoveMode();
                }}
                type="button"
              >
                取消
              </button>
              <button
                className="danger-button"
                onClick={() => {
                  commitCardMove(pendingMoveCard, {
                    initialId: pendingMove.targetInitialId,
                    finalId: pendingMove.targetFinalId,
                  });
                  setPendingMove(null);
                }}
                type="button"
              >
                同意并标为例外
              </button>
            </div>
          </div>
        </div>
      )}

      {axisDialog && (
        <div className="modal-backdrop" role="presentation">
          <div
            aria-labelledby="axis-dialog-title"
            aria-modal="true"
            className="modal modal-small"
            role="dialog"
          >
            <button
              aria-label="关闭"
              className="modal-close"
              onClick={() => setAxisDialog(null)}
              type="button"
            >
              ×
            </button>
            <span className="modal-kicker">EDIT AXIS</span>
            <h2 id="axis-dialog-title">
              添加{axisDialog === "initial" ? "声母行" : "韵母列"}
            </h2>
            <form onSubmit={addAxis}>
              <label>
                {axisDialog === "initial" ? "声母" : "韵母"}
                <input
                  autoFocus
                  onChange={(event) => setAxisValue(event.target.value)}
                  placeholder={axisDialog === "initial" ? "例：gn" : "例：iai"}
                  required
                  value={axisValue}
                />
              </label>
              <div className="modal-actions">
                <button onClick={() => setAxisDialog(null)} type="button">
                  取消
                </button>
                <button className="primary-button" type="submit">
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
