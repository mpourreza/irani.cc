import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, openSync, readSync, closeSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";
import { z } from "zod";
import { isValidJalaaliDate, toGregorian } from "jalaali-js";
import {
  FEATURE_KINDS,
  SECTION_IDS,
  SECTIONS,
  countWords,
  firstParagraph,
  foldFa,
  isReleaseSaturday,
  normalizeNewlines,
  RELEASE_DATE_ERROR,
  seasonFromMonth,
} from "./format.mjs";

function findRoot() {
  const starts = [process.cwd()];
  try {
    starts.push(path.dirname(fileURLToPath(import.meta.url)));
  } catch {
    // The module URL is only a hint. The walk below still checks cwd.
  }
  for (const start of starts) {
    let dir = start;
    for (let hop = 0; hop < 8; hop += 1) {
      if (existsSync(path.join(dir, "package.json")) && existsSync(path.join(dir, "astro.config.mjs"))) {
        return dir;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return process.cwd();
}

const root = findRoot();

export const issuesRoot = path.join(root, "src", "content", "issues");
export const imagesRoot = path.join(root, "public", "issues");

export const STUB_SENTENCE = "این بخش هنوز نوشته نشده است.";
export const FIELD_STUB = "بنویسید";
export const DISCLAIMER_FOLDED = "این مطلب توصیه پزشکی نیست.";
export const DISCLAIMER = "این مطلب توصیهٔ پزشکی نیست.";

const MIN_WORDS = 250;
const MAX_WORDS = 520;
const RECIPE_MAX_WORDS = 1000;
const MIN_IMAGE_BYTES = 8000;

const featureIds = FEATURE_KINDS.map((kind) => kind.id);

const draftSchema = z.object({
  id: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isoDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  theme: z.string(),
  season: z.string(),
  occasion: z.string(),
  status: z.enum(["draft", "in_review", "approved"]),
  featureKind: z.enum(featureIds),
  featureTitle: z.string(),
  coverAlt: z.string(),
  featureAlt: z.string(),
  sectionAlts: z.object({
    editor: z.string(),
    calendar: z.string(),
    word: z.string(),
    recipe: z.string(),
    health: z.string(),
    history: z.string(),
  }),
  angles: z.object({
    editor: z.string(),
    calendar: z.string(),
    word: z.string(),
    recipe: z.string(),
    health: z.string(),
    history: z.string(),
    feature: z.string(),
  }),
});

const markdown = new MarkdownIt({
  html: false,
  linkify: false,
  breaks: false,
  typographer: false,
});

export function issueDir(id) {
  assertId(id);
  return path.join(issuesRoot, id);
}

export function imageDir(id) {
  assertId(id);
  return path.join(imagesRoot, id);
}

export function assertId(id) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(id)) {
    throw new Error(`شناسهٔ شماره نامعتبر است: ${id}`);
  }
}

export function isoFromShamsi(id) {
  const [year, month, day] = id.split("-").map(Number);
  if (!isValidJalaaliDate(year, month, day)) return null;
  const { gy, gm, gd } = toGregorian(year, month, day);
  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}

export function padIso(gy, gm, gd) {
  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}

export function seasonForId(id) {
  return seasonFromMonth(Number(id.split("-")[1]));
}

export function nextFeatureKind(existingCountOrIds) {
  if (Array.isArray(existingCountOrIds)) {
    if (existingCountOrIds.length === 0) return FEATURE_KINDS[0];
    const latest = [...existingCountOrIds].sort().at(-1);
    let featureKind = "";
    try {
      featureKind = JSON.parse(readFileSync(path.join(issuesRoot, latest, "issue.json"), "utf8")).featureKind;
    } catch {
      featureKind = "";
    }
    const index = FEATURE_KINDS.findIndex((kind) => kind.id === featureKind);
    const step = index < 0 ? existingCountOrIds.length : index + 1;
    return FEATURE_KINDS[step % FEATURE_KINDS.length];
  }
  return FEATURE_KINDS[Number(existingCountOrIds) % FEATURE_KINDS.length];
}

export function listIssueIds() {
  if (!existsSync(issuesRoot)) return [];
  return readdirSync(issuesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

export function serializeIssue(meta) {
  const ordered = {
    id: meta.id,
    isoDate: meta.isoDate,
    theme: meta.theme,
    season: meta.season,
    occasion: meta.occasion,
    status: meta.status,
    featureKind: meta.featureKind,
    featureTitle: meta.featureTitle,
    coverAlt: meta.coverAlt,
    featureAlt: meta.featureAlt,
    sectionAlts: {
      editor: meta.sectionAlts.editor,
      calendar: meta.sectionAlts.calendar,
      word: meta.sectionAlts.word,
      recipe: meta.sectionAlts.recipe,
      health: meta.sectionAlts.health,
      history: meta.sectionAlts.history,
    },
    angles: {
      editor: meta.angles.editor,
      calendar: meta.angles.calendar,
      word: meta.angles.word,
      recipe: meta.angles.recipe,
      health: meta.angles.health,
      history: meta.angles.history,
      feature: meta.angles.feature,
    },
  };
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

export function writeIssueMeta(meta) {
  const dir = issueDir(meta.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "issue.json"), serializeIssue(meta), "utf8");
}

export function renderMarkdown(source) {
  return markdown.render(normalizeNewlines(source));
}

export function imageInfo(file) {
  if (!existsSync(file)) return { exists: false, size: 0, isWebp: false };
  const size = statSync(file).size;
  const header = Buffer.alloc(12);
  const fd = openSync(file, "r");
  try {
    readSync(fd, header, 0, 12, 0);
  } finally {
    closeSync(fd);
  }
  const isWebp = header.toString("ascii", 0, 4) === "RIFF" && header.toString("ascii", 8, 12) === "WEBP";
  return { exists: true, size, isWebp };
}

function parseMeta(meta, id) {
  const result = draftSchema.safeParse(meta);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "issue"}: ${issue.message}`)
      .join("\n");
    throw new Error(`issue.json برای ${id} نامعتبر است.\n${details}`);
  }
  return result.data;
}

export function buildIssue(id, meta, rawSections, images) {
  const parsed = parseMeta(meta, id);
  const sections = {};
  for (const sectionId of SECTION_IDS) {
    const raw = normalizeNewlines(rawSections[sectionId] ?? "");
    sections[sectionId] = {
      raw,
      html: raw ? renderMarkdown(raw) : "",
      words: countWords(raw),
    };
  }
  const issue = {
    ...parsed,
    sections,
    images: {
      cover: { ...images.cover, src: `issues/${id}/cover.webp` },
      feature: { ...images.feature, src: `issues/${id}/feature.webp` },
      sections: Object.fromEntries(
        SECTION_IDS.filter((sectionId) => sectionId !== "feature").map((sectionId) => {
          const file = `${sectionId}.webp`;
          const info = images.sections?.[sectionId] ?? { exists: false, size: 0, isWebp: false };
          return [sectionId, { ...info, src: `issues/${id}/${file}` }];
        }),
      ),
    },
  };
  issue.errors = publishErrors(issue, id);
  return issue;
}

function looksStub(value) {
  return foldFa(value).includes(FIELD_STUB);
}

function publishErrors(issue, folderId) {
  const errors = [];
  if (issue.id !== folderId) {
    errors.push("شناسهٔ پوشه با id داخل issue.json یکی نیست.");
  }

  const iso = isoFromShamsi(issue.id);
  if (!iso) {
    errors.push("تاریخ خورشیدی در گاه‌شماری واقعی نیست.");
  } else if (issue.isoDate !== iso) {
    errors.push(`تاریخ میلادی با تاریخ خورشیدی نمی‌خواند. مقدار درست: ${iso}`);
  } else if (!isReleaseSaturday(iso)) {
    errors.push(RELEASE_DATE_ERROR);
  }

  if (issue.theme.trim().length < 2 || looksStub(issue.theme)) {
    errors.push("تم شماره هنوز نوشته نشده.");
  }
  if (issue.season.trim().length < 2 || looksStub(issue.season)) {
    errors.push("فصل را بنویسید.");
  }
  if (issue.occasion.trim().length < 2 || looksStub(issue.occasion)) {
    errors.push("مناسبت هفته هنوز نوشته نشده.");
  }
  if (issue.featureTitle.trim().length < 8 || looksStub(issue.featureTitle)) {
    errors.push("عنوان موضوع هفته هنوز نوشته نشده.");
  }

  for (const section of SECTIONS) {
    const angle = issue.angles[section.id] ?? "";
    if (angle.trim().length < 40 || looksStub(angle)) {
      errors.push(`زاویهٔ «${section.label}» کوتاه است یا هنوز جا نگهدار است.`);
    }
  }

  for (const name of ["coverAlt", "featureAlt"]) {
    const alt = issue[name] ?? "";
    const label = name === "coverAlt" ? "جلد" : "موضوع";
    if (alt.trim().length < 20 || looksStub(alt)) {
      errors.push(`متن جایگزین تصویر ${label} کوتاه است یا هنوز جا نگهدار است.`);
    }
  }

  for (const section of SECTIONS) {
    const body = issue.sections[section.id];
    const max = section.id === "recipe" ? RECIPE_MAX_WORDS : MAX_WORDS;
    if (!body.raw.trim()) {
      errors.push(`بخش «${section.label}» نیست.`);
      continue;
    }
    if (body.raw.includes(STUB_SENTENCE)) {
      errors.push(`بخش «${section.label}» هنوز نوشته نشده.`);
    }
    if (/^#{1,2}\s/m.test(body.raw)) {
      errors.push(`بخش «${section.label}»: زیرعنوان را با ### بنویسید.`);
    }
    if (body.words < MIN_WORDS || body.words > max) {
      errors.push(`بخش «${section.label}» ${body.words} کلمه است. بازهٔ درست ${MIN_WORDS} تا ${max} است.`);
    }
  }

  const health = issue.sections.health?.raw ?? "";
  if (health.trim() && foldFa(firstParagraph(health)) !== DISCLAIMER_FOLDED) {
    errors.push(`بخش سلامت باید با این جمله شروع شود: ${DISCLAIMER}`);
  }

  const recipe = foldFa(issue.sections.recipe?.raw ?? "");
  if (issue.sections.recipe?.raw.trim() && !recipe.includes("حساسیت")) {
    errors.push("بخش آشپزی باید حساسیت غذایی را بنویسد.");
  }

  const history = issue.sections.history?.raw ?? "";
  if (history.trim() && !history.includes("افسانه")) {
    errors.push("بخش تاریخ باید روایت افسانه‌ای را با کلمهٔ افسانه جدا کند.");
  }

  if (!issue.images.cover.exists) {
    errors.push("فایل public/issues/<id>/cover.webp نیست.");
  } else if (!issue.images.cover.isWebp || issue.images.cover.size < MIN_IMAGE_BYTES) {
    errors.push("جلد باید یک فایل webp واقعی باشد.");
  }

  if (!issue.images.feature.exists) {
    errors.push("فایل public/issues/<id>/feature.webp نیست.");
  } else if (!issue.images.feature.isWebp || issue.images.feature.size < MIN_IMAGE_BYTES) {
    errors.push("تصویر موضوع باید یک فایل webp واقعی باشد.");
  }

  for (const section of SECTIONS) {
    if (section.id === "feature") continue;
    const alt = issue.sectionAlts?.[section.id] ?? "";
    if (alt.trim().length < 20 || looksStub(alt)) {
      errors.push(`متن جایگزین تصویر «${section.label}» کوتاه است یا هنوز جا نگهدار است.`);
    }
    const image = issue.images.sections?.[section.id];
    if (!image?.exists) {
      errors.push(`فایل public/issues/<id>/${section.id}.webp نیست.`);
    } else if (!image.isWebp || image.size < MIN_IMAGE_BYTES) {
      errors.push(`تصویر «${section.label}» باید یک فایل webp واقعی باشد.`);
    }
  }

  return errors;
}

export function loadIssue(id) {
  assertId(id);
  const jsonPath = path.join(issueDir(id), "issue.json");
  if (!existsSync(jsonPath)) {
    throw new Error(`شماره پیدا نشد: ${id}`);
  }
  let meta;
  try {
    meta = JSON.parse(readFileSync(jsonPath, "utf8"));
  } catch (error) {
    throw new Error(`issue.json برای ${id} خوانده نشد. ${error.message}`);
  }
  const rawSections = {};
  for (const sectionId of SECTION_IDS) {
    const file = path.join(issueDir(id), `${sectionId}.md`);
    rawSections[sectionId] = existsSync(file) ? readFileSync(file, "utf8") : "";
  }
  const sections = {};
  for (const sectionId of SECTION_IDS) {
    if (sectionId === "feature") continue;
    const file = path.join(imageDir(id), `${sectionId}.webp`);
    sections[sectionId] = imageInfo(file);
  }
  return buildIssue(id, meta, rawSections, {
    cover: imageInfo(path.join(imageDir(id), "cover.webp")),
    feature: imageInfo(path.join(imageDir(id), "feature.webp")),
    sections,
  });
}

export function withVolumes(issues) {
  const volumeById = new Map(
    [...issues]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((issue, index) => [issue.id, index + 1]),
  );
  return issues.map((issue) => ({ ...issue, volume: volumeById.get(issue.id) }));
}

export function loadIssues({ includeUnapproved }) {
  const issues = withVolumes(listIssueIds().map((id) => loadIssue(id)));
  return selectForSite(issues, includeUnapproved);
}

export function selectForSite(issues, includeUnapproved) {
  const sorted = [...issues].sort(
    (a, b) => b.isoDate.localeCompare(a.isoDate) || b.id.localeCompare(a.id),
  );
  if (includeUnapproved) return sorted;
  const published = sorted.filter((issue) => issue.status === "approved");
  const blocked = published.filter((issue) => issue.errors.length > 0);
  if (blocked.length > 0) {
    const details = blocked
      .map((issue) => `${issue.id}\n${issue.errors.map((error) => `- ${error}`).join("\n")}`)
      .join("\n\n");
    throw new Error(`شمارهٔ تأییدشده کامل نیست و ساخت متوقف شد.\n\n${details}`);
  }
  return published;
}

export function visibleIds(issues, includeUnapproved) {
  const sorted = [...issues].sort(
    (a, b) => b.isoDate.localeCompare(a.isoDate) || b.id.localeCompare(a.id),
  );
  const visible = includeUnapproved ? sorted : sorted.filter((issue) => issue.status === "approved");
  return visible.map((issue) => issue.id);
}

export function assertInvariants() {
  const hamza = foldFa("این مطلب توصیهٔ پزشکی نیست.");
  const yeh = foldFa("این مطلب توصیه‌ی پزشکی نیست.");
  if (hamza !== DISCLAIMER_FOLDED || yeh !== DISCLAIMER_FOLDED) {
    throw new Error("شکل‌های جملهٔ سلامت به یک صورت جمع نمی‌شوند.");
  }
  const ids = visibleIds(
    [
      { id: "a", status: "draft", isoDate: "2026-01-02" },
      { id: "b", status: "approved", isoDate: "2026-01-01" },
      { id: "c", status: "in_review", isoDate: "2026-01-03" },
    ],
    false,
  );
  if (ids.join(",") !== "b") {
    throw new Error("صافی شماره‌های منتشرشده درست کار نمی‌کند.");
  }
  if (!isReleaseSaturday("2026-10-10") || isReleaseSaturday("2026-10-08")) {
    throw new Error("تشخیص شنبهٔ انتشار درست کار نمی‌کند.");
  }
  const numbered = withVolumes([{ id: "1405-07-18" }, { id: "1405-05-03" }]);
  const first = numbered.find((issue) => issue.id === "1405-05-03");
  const second = numbered.find((issue) => issue.id === "1405-07-18");
  if (first?.volume !== 1 || second?.volume !== 2) {
    throw new Error("شمارهٔ جلدها به ترتیب تاریخ نیست.");
  }
}
