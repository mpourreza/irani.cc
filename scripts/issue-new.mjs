import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { FEATURE_KINDS, isReleaseSaturday, RELEASE_DATE_ERROR } from "../src/lib/format.mjs";
import {
  STUB_SENTENCE,
  imageDir,
  isoFromShamsi,
  issueDir,
  listIssueIds,
  nextFeatureKind,
  seasonForId,
  writeIssueMeta,
} from "../src/lib/issues.mjs";

const args = parseArgs(process.argv.slice(2));

if (!args.date || !args.theme) {
  console.error("استفاده: npm run issue:new -- --date 1405-07-18 --theme \"مهرگان و انار\"");
  process.exit(1);
}

const id = args.date;
const iso = isoFromShamsi(id);
if (!iso) {
  console.error("تاریخ خورشیدی معتبر نیست. شکل درست: 1405-07-18");
  process.exit(1);
}

if (!isReleaseSaturday(iso)) {
  console.error(RELEASE_DATE_ERROR);
  process.exit(1);
}

if (existsSync(issueDir(id))) {
  console.error(`این شماره وجود دارد: ${id}`);
  process.exit(1);
}

const feature = args.feature
  ? FEATURE_KINDS.find((kind) => kind.id === args.feature)
  : nextFeatureKind(listIssueIds());

if (!feature) {
  console.error(`موضوع ناشناخته است. یکی از این‌ها: ${FEATURE_KINDS.map((kind) => kind.id).join(", ")}`);
  process.exit(1);
}

const meta = {
  id,
  isoDate: iso,
  theme: args.theme,
  season: args.season || seasonForId(id),
  occasion: args.occasion || "مناسبت این هفته را بنویسید.",
  status: "draft",
  featureKind: feature.id,
  featureTitle: args["feature-title"] || feature.label,
  coverAlt: "متن جایگزین جلد را بنویسید.",
  featureAlt: "متن جایگزین تصویر موضوع را بنویسید.",
  sectionAlts: {
    editor: "متن جایگزین تصویر نامه را بنویسید.",
    calendar: "متن جایگزین تصویر تقویم را بنویسید.",
    word: "متن جایگزین تصویر لغت را بنویسید.",
    recipe: "متن جایگزین تصویر آشپزی را بنویسید.",
    health: "متن جایگزین تصویر سلامت را بنویسید.",
    history: "متن جایگزین تصویر تاریخ را بنویسید.",
  },
  angles: {
    editor: "زاویهٔ این بخش را بنویسید.",
    calendar: "زاویهٔ این بخش را بنویسید.",
    word: "زاویهٔ این بخش را بنویسید.",
    recipe: "زاویهٔ این بخش را بنویسید.",
    health: "زاویهٔ این بخش را بنویسید.",
    history: "زاویهٔ این بخش را بنویسید.",
    feature: "زاویهٔ این بخش را بنویسید.",
  },
};

writeIssueMeta(meta);
mkdirSync(imageDir(id), { recursive: true });
for (const section of Object.keys(meta.angles)) {
  writeFileSync(path.join(issueDir(id), `${section}.md`), `${STUB_SENTENCE}\n`, "utf8");
}

console.log(`شمارهٔ ${id} ساخته شد.`);
console.log(`تاریخ میلادی: ${iso}`);
console.log(`موضوع هفته: ${feature.id} (${feature.label})`);
console.log("دبیر زاویه‌ها را در issue.json پر می‌کند. نویسنده‌ها متن را. تصویرگر جلد، موضوع، و تصویر هر بخش را.");

function parseArgs(argv) {
  const out = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      index += 1;
    }
  }
  return out;
}
