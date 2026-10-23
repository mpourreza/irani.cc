import { SECTIONS } from "../src/lib/format.mjs";
import { assertInvariants, listIssueIds, loadIssue } from "../src/lib/issues.mjs";

assertInvariants();

const id = process.argv[2];
const ids = id ? [id] : listIssueIds();

if (ids.length === 0) {
  console.error("شماره‌ای برای بررسی نیست.");
  process.exit(1);
}

let failed = false;
for (const issueId of ids) {
  const issue = loadIssue(issueId);
  console.log(`\n${issue.id} · ${issue.status}`);
  for (const section of SECTIONS) {
    console.log(`${section.label}: ${issue.sections[section.id].words} کلمه`);
  }
  if (issue.errors.length > 0) {
    failed = true;
    for (const error of issue.errors) console.error(`- ${error}`);
  } else {
    console.log("کامل است.");
  }
}

process.exit(failed ? 1 : 0);
