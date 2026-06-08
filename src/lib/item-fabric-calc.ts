/**
 * Item-category fabric calculation — the single source of truth for how each
 * project item type derives its required fabric (meters).
 *
 * Used by both the Add Item wizard and the Edit Item dialog so the form behaviour
 * and the computed quantity stay identical.
 */

export const ITEM_CATEGORIES = [
  "CURTAINS",
  "PILLOWS",
  "BED_COVERS",
  "CHAIRS",
  "SOFAS",
  "OTHER",
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

/** Which inputs each category exposes in the form. */
export type CategoryFields = {
  /** width × height drive the calc (curtains, bed covers). */
  dimensions?: boolean;
  /** pillow depth (third dimension, recorded only — not part of the math). */
  depth?: boolean;
  /** editable meters-per-unit (pillows, chairs, sofas). */
  metersPerUnit?: boolean;
  /** free-text type detail, e.g. "Wingback" (chairs, sofas). */
  typeDetail?: boolean;
  /** bed-type selector that auto-fills the dimensions (bed covers). */
  bedType?: boolean;
  /** manual / remote control selector — one track per curtain. */
  trackControl?: boolean;
  /** free-text custom label (OTHER). */
  customLabel?: boolean;
};

export const CATEGORY_FIELDS: Record<ItemCategory, CategoryFields> = {
  CURTAINS: { dimensions: true, trackControl: true },
  PILLOWS: { dimensions: true, depth: true, metersPerUnit: true },
  BED_COVERS: { dimensions: true, bedType: true },
  CHAIRS: { metersPerUnit: true, typeDetail: true },
  SOFAS: { metersPerUnit: true, typeDetail: true },
  OTHER: { customLabel: true },
};

/** Starting meters-per-unit prefilled when the category is picked (always editable). */
export const CATEGORY_DEFAULT_METERS_PER_UNIT: Partial<Record<ItemCategory, number>> = {
  PILLOWS: 0.5,
  CHAIRS: 6,
  SOFAS: 14,
};

/** Curtain track control options. */
export const TRACK_CONTROLS = ["MANUAL", "REMOTE"] as const;
export type TrackControl = (typeof TRACK_CONTROLS)[number];

const IN_TO_M = 0.0254;
const roundDim = (n: number) => parseFloat((n * IN_TO_M).toFixed(3));

/** Standard mattress sizes (inches) → fabric dimensions (meters). */
export const BED_TYPES = [
  { key: "TWIN", labelEn: "Twin / Single", labelAr: "فردي", widthIn: 38, lengthIn: 75 },
  { key: "FULL", labelEn: "Double / Full", labelAr: "مزدوج", widthIn: 54, lengthIn: 75 },
  { key: "QUEEN", labelEn: "Queen", labelAr: "كوين", widthIn: 60, lengthIn: 80 },
  { key: "KING", labelEn: "King", labelAr: "كينج", widthIn: 76, lengthIn: 80 },
  { key: "CAL_KING", labelEn: "California King", labelAr: "كاليفورنيا كينج", widthIn: 72, lengthIn: 84 },
] as const;

export type BedType = (typeof BED_TYPES)[number]["key"];

/** Returns the width/height (meters) for a bed type, or null if unknown. */
export function bedDimensions(key: string): { width: number; height: number } | null {
  const bed = BED_TYPES.find((b) => b.key === key);
  if (!bed) return null;
  return { width: roundDim(bed.widthIn), height: roundDim(bed.lengthIn) };
}

/** Bilingual labels for the fixed categories (domain terms, mirrored into i18n for chrome). */
export const CATEGORY_LABELS: Record<ItemCategory, { en: string; ar: string }> = {
  CURTAINS: { en: "Curtains", ar: "ستائر" },
  PILLOWS: { en: "Pillows", ar: "وسائد" },
  BED_COVERS: { en: "Bed Covers", ar: "مفارش سرير" },
  CHAIRS: { en: "Chairs", ar: "كراسي" },
  SOFAS: { en: "Sofas", ar: "كنب" },
  OTHER: { en: "Other", ar: "أخرى" },
};

const round3 = (n: number) => parseFloat(n.toFixed(3));

export type CalcInputs = {
  count?: number | null;
  width?: number | null;
  height?: number | null;
  metersPerUnit?: number | null;
};

/**
 * Returns the computed fabric quantity (meters) for a category, or null when the
 * required inputs aren't filled in yet. The result is a suggestion — callers keep
 * the quantity field editable.
 */
export function computeItemQuantity(
  category: ItemCategory | null | undefined,
  { count, width, height, metersPerUnit }: CalcInputs,
): number | null {
  const c = Number(count) || 0;
  if (!category || c <= 0) return null;

  const fields = CATEGORY_FIELDS[category];

  // Per-unit categories (pillows, chairs, sofas) — fixed meters per piece.
  if (fields.metersPerUnit) {
    const m = Number(metersPerUnit) || 0;
    return m > 0 ? round3(c * m) : null;
  }

  // Area categories (curtains, bed covers) — width × height × count.
  if (fields.dimensions) {
    const w = Number(width) || 0;
    const h = Number(height) || 0;
    return w > 0 && h > 0 ? round3(c * w * h) : null;
  }

  return null; // OTHER — entered manually
}

/**
 * Builds the stored EN/AR item-type label from the category and optional detail.
 * Keeps the existing `itemTypeEn` / `itemTypeAr` columns (and the material report)
 * meaningful without threading the category through every read path.
 */
export function buildItemTypeLabels(
  category: ItemCategory,
  opts: { detail?: string; customEn?: string; customAr?: string },
): { itemTypeEn: string; itemTypeAr: string | undefined } {
  if (category === "OTHER") {
    return {
      itemTypeEn: (opts.customEn ?? "").trim() || CATEGORY_LABELS.OTHER.en,
      itemTypeAr: opts.customAr?.trim() || undefined,
    };
  }
  const detail = opts.detail?.trim();
  const base = CATEGORY_LABELS[category];
  return {
    itemTypeEn: detail ? `${base.en} — ${detail}` : base.en,
    itemTypeAr: detail ? `${base.ar} — ${detail}` : base.ar,
  };
}
