// Shared dental-chart helpers: numbering systems, layout, and condition
// colors. tooth_number is only unique *within* a dentition:
//  - adult:     Universal 1-32 is canonical; FDI 11-48 is derived.
//  - pediatric: a canonical index 1-20 (A-T primary teeth) is stored; the
//               Universal letter and FDI 51-85 are both derived from it.

export const CONDITIONS = [
  { value: "healthy", label: "Healthy", color: "#ffffff", border: "#c9b28a" },
  { value: "cavity", label: "Cavity", color: "#dc2626", border: "#991b1b" },
  { value: "filling", label: "Filling", color: "#2563eb", border: "#1d4ed8" },
  { value: "crown", label: "Crown", color: "#d4af37", border: "#a67c00" },
  { value: "root_canal", label: "Root canal", color: "#7c3aed", border: "#5b21b6" },
  { value: "missing", label: "Missing", color: "#9ca3af", border: "#6b7280" },
  { value: "extraction_needed", label: "Extraction needed", color: "#ea580c", border: "#c2410c" },
  { value: "bridge", label: "Bridge", color: "#0d9488", border: "#0f766e" },
  { value: "implant", label: "Implant", color: "#4f46e5", border: "#3730a3" },
  { value: "impacted", label: "Impacted", color: "#db2777", border: "#9d174d" },
  { value: "other", label: "Other", color: "#64748b", border: "#334155" },
];

export function conditionMeta(value) {
  return CONDITIONS.find((c) => c.value === value) || null;
}

export const DENTITIONS = [
  { value: "adult", label: "Adult", sub: "32 permanent teeth" },
  { value: "pediatric", label: "Pediatric", sub: "20 primary teeth" },
];

// ---- Adult (permanent) -----------------------------------------------

// Universal 1-16 = upper arch, left-to-right on screen (patient's right side
// shown first). Universal 17-32 = lower arch, mirrored so each column lines
// up under the same quadrant position as the tooth above it.
const ADULT_UPPER_ROW = Array.from({ length: 16 }, (_, i) => i + 1);
const ADULT_LOWER_ROW = Array.from({ length: 16 }, (_, i) => 32 - i);

function universalToFdi(u) {
  let quadrant, pos;
  if (u >= 1 && u <= 8) {
    quadrant = 1;
    pos = 9 - u;
  } else if (u >= 9 && u <= 16) {
    quadrant = 2;
    pos = u - 8;
  } else if (u >= 17 && u <= 24) {
    quadrant = 3;
    pos = 25 - u;
  } else {
    quadrant = 4;
    pos = u - 24;
  }
  return quadrant * 10 + pos;
}

// ---- Pediatric (primary) ----------------------------------------------

// Canonical index 1-20. Index 1-10 = upper arch left-to-right (A-J), 11-20 =
// lower arch mirrored to match adult's column-alignment convention (T-K).
const PEDO_LETTERS = "ABCDEFGHIJKLMNOPQRST";
const PEDO_UPPER_ROW = Array.from({ length: 10 }, (_, i) => i + 1);
const PEDO_LOWER_ROW = Array.from({ length: 10 }, (_, i) => 20 - i);

function pediatricLetter(index) {
  return PEDO_LETTERS[index - 1];
}

function pediatricToFdi(index) {
  let quadrant, pos;
  if (index >= 1 && index <= 5) {
    quadrant = 5;
    pos = 6 - index;
  } else if (index >= 6 && index <= 10) {
    quadrant = 6;
    pos = index - 5;
  } else if (index >= 11 && index <= 15) {
    quadrant = 7;
    pos = 16 - index;
  } else {
    quadrant = 8;
    pos = index - 15;
  }
  return quadrant * 10 + pos;
}

// ---- Shared API ----------------------------------------------------------

export function rowsFor(dentition) {
  return dentition === "pediatric"
    ? { upper: PEDO_UPPER_ROW, lower: PEDO_LOWER_ROW }
    : { upper: ADULT_UPPER_ROW, lower: ADULT_LOWER_ROW };
}

// "universal" system: adult shows the plain number, pediatric shows the
// A-T letter. "fdi" system: quadrant-based two-digit code for both.
export function toothLabel(toothNumber, dentition, system) {
  if (dentition === "pediatric") {
    return system === "fdi" ? String(pediatricToFdi(toothNumber)) : pediatricLetter(toothNumber);
  }
  return system === "fdi" ? String(universalToFdi(toothNumber)) : String(toothNumber);
}

// Kept for the note-add page's "Universal / FDI" helper text.
export { universalToFdi };
