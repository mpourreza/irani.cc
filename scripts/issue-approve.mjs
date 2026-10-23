import { loadIssue, writeIssueMeta } from "../src/lib/issues.mjs";

const id = process.argv[2];
if (!id) {
  console.error("استفاده: npm run issue:approve -- 1405-07-18");
  process.exit(1);
}

const issue = loadIssue(id);

if (issue.status === "approved") {
  console.log(`شمارهٔ ${id} قبلاً تأیید شده است.`);
  process.exit(0);
}

if (issue.status !== "in_review") {
  console.error(`وضعیت باید in_review باشد. وضعیت فعلی: ${issue.status}`);
  console.error("بعد از بررسی میز تحریر، status را در issue.json به in_review تغییر بدهید.");
  process.exit(1);
}

if (issue.errors.length > 0) {
  console.error(`شمارهٔ ${id} هنوز کامل نیست.`);
  for (const error of issue.errors) console.error(`- ${error}`);
  process.exit(1);
}

writeIssueMeta({ ...issue, status: "approved" });
console.log(`شمارهٔ ${id} تأیید شد و در ساخت نهایی می‌آید.`);
