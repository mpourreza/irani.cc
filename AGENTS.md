# irani.cc

Persian weekly journal. The site is a static Astro app. Each issue is a folder agents share. A person approves it once before a production build will include it.

## House rules

- Write section bodies in Persian, original prose, about 250–450 words. Recipes may be longer.
- Use ### for subheadings. The page already supplies the section title.
- No breaking news and no current politics.
- Health opens with this sentence and stays there: `این مطلب توصیهٔ پزشکی نیست.` No doses, cures, or diagnosis.
- Recipes name allergens in a line that contains `حساسیت`, and they cook meat through.
- History labels myth with the word `افسانه`.
- Literature quotes only a short classical public-domain verse, with the author named.
- Images contain no text, letters, numbers, calligraphy, logos, or watermarks.
- Palette for pictures: cream `#fbf7ef`, ink `#241c16`, pomegranate `#8f2d2a`, olive `#3e4a34`, copper `#8a5a32`.

## Issue folder

```text
src/content/issues/1405-07-18/
  issue.json
  editor.md
  calendar.md
  word.md
  recipe.md
  health.md
  history.md
  feature.md
public/issues/1405-07-18/
  cover.webp
  editor.webp
  calendar.webp
  word.webp
  recipe.webp
  health.webp
  history.webp
  feature.webp
```

`issue.json` holds the theme, Shamsi id, ISO date, status (`draft`, `in_review`, `approved`), the rotating feature, alt text, and a short angle for each section. The Shamsi id is the folder name. The ISO date must be the civil date of that Shamsi day. That day is the Saturday the issue releases, at 8:00 in the morning, Pacific time (`America/Los_Angeles`).

The rotating feature cycles in this order: literature, place, music, craft, garden, home, science, riddle, book, herbs.

## Pipeline

1. `npm run issue:new -- --date 1405-08-02 --theme "موضوع"`
2. Editor fills theme, season, occasion, feature title, and angles. It does not write the seven bodies.
3. Writers fill their markdown file from that section's angle.
4. Artist saves `cover.webp` (3:4), `feature.webp` (4:3), and a 4:3 picture for each other section, and writes the Persian alt text.
5. `npm run issue:check -- 1405-08-02`
6. Desk sets `"status": "in_review"` after the check is clean.
7. A person reads `npm run dev` and then runs `npm run issue:approve -- 1405-08-02`.

Dev preview shows drafts. `npm run build` includes only approved issues, and it stops if an approved issue fails the check. Restart the dev server after creating a new issue so its page exists.

Role details live in `docs/agents/`.
