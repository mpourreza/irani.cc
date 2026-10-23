export const FEATURE_KINDS = [
  { id: "literature", label: "ادبیات" },
  { id: "place", label: "شهر و جا" },
  { id: "music", label: "موسیقی و هنر" },
  { id: "craft", label: "هنر دستی" },
  { id: "garden", label: "باغ و فصل" },
  { id: "home", label: "خانه و مهمانی" },
  { id: "science", label: "دانش به زبان ساده" },
  { id: "riddle", label: "چیستان" },
  { id: "book", label: "یک کتاب" },
  { id: "herbs", label: "گیاهان خوراکی" },
];

export const SECTIONS = [
  { id: "editor", label: "نامه هفته", kicker: "۰۱" },
  { id: "calendar", label: "تقویم", kicker: "۰۲" },
  { id: "word", label: "لغت و ضرب‌المثل", kicker: "۰۳" },
  { id: "recipe", label: "آشپزی", kicker: "۰۴" },
  { id: "health", label: "سلامت", kicker: "۰۵" },
  { id: "history", label: "تاریخ", kicker: "۰۶" },
  { id: "feature", label: "موضوع هفته", kicker: "۰۷" },
];

export const SECTION_IDS = SECTIONS.map((section) => section.id);

export const STATUS_LABELS = {
  draft: "پیش‌نویس",
  in_review: "در انتظار تأیید",
  approved: "منتشرشده",
};

const MONTHS = [
  "",
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function toPersianDigits(value) {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[digit]);
}

export function formatVolume(volume) {
  return `شمارهٔ ${toPersianDigits(volume)}`;
}

export function featureById(id) {
  return FEATURE_KINDS.find((kind) => kind.id === id) ?? null;
}

export function featureLabel(id) {
  return featureById(id)?.label ?? id;
}

export function seasonFromMonth(month) {
  if (month >= 1 && month <= 3) return "بهار";
  if (month >= 4 && month <= 6) return "تابستان";
  if (month >= 7 && month <= 9) return "پاییز";
  return "زمستان";
}

export function formatShamsiId(id) {
  const [year, month, day] = id.split("-").map(Number);
  return `${toPersianDigits(day)} ${MONTHS[month]} ${toPersianDigits(year)}`;
}

export function weekdayName(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"][weekday];
}

export const RELEASE_DATE_ERROR =
  "شماره باید شنبه باشد. انتشار هر شنبه ساعت ۸ صبح به وقت پاسیفیک است.";

export function isReleaseSaturday(isoDate) {
  const [year, month, day] = String(isoDate).split("-").map(Number);
  if (!year || !month || !day) return false;
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 6;
}

export function countWords(markdown) {
  const text = normalizeNewlines(markdown)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[*_`>~]/g, " ");
  return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

export function normalizeNewlines(value) {
  return String(value).replace(/\r\n/g, "\n");
}

export function foldFa(value) {
  return normalizeNewlines(value)
    .replace(/\u0647\u200c\u06cc/g, "\u0647")
    .replace(/\u0647\u0654/g, "\u0647")
    .replace(/[\u200c\u200d]/g, "")
    .replace(/[يى]/g, "ی")
    .replace(/\u0643/g, "ک")
    .replace(/\u0654/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function firstParagraph(markdown) {
  const blocks = normalizeNewlines(markdown)
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\n\s*\n/);
  const block = blocks.find((part) => {
    const trimmed = part.trim();
    return trimmed && !trimmed.startsWith("#") && !trimmed.startsWith(">");
  });
  return (block ?? "").replace(/^>\s?/gm, "").trim();
}
