import { defineCollection } from "astro:content";

// Each issue is a folder of markdown plus issue.json, read by src/lib/issues.mjs.
// This collection exists so Astro does not try to treat that folder as loose entries.
const issues = defineCollection({
  loader: {
    name: "issue-folders",
    load: async () => {},
  },
});

export const collections = { issues };
