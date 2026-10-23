# irani.cc

A Persian weekly journal. This copy runs locally. The same build can later go to GitHub Pages.

```bash
npm install
npm run dev
```

Open the home page for the current issue. The archive lists that issue and earlier ones. A later Saturday stays off those pages until 8:00 in the morning, Pacific time. Drafts show in the dev server once that time has passed; until then, open the issue at its own address. `npm run build` keeps only approved issues that have reached that morning.

## Make a week

```bash
npm run issue:new -- --date 1405-08-02 --theme "موضوع هفته"
npm run issue:check -- 1405-08-02
npm run issue:approve -- 1405-08-02
```

`issue:new` scaffolds the folder. Editors, writers, and the artist fill it. The desk runs the check and sets `status` to `in_review`. Approve only works from `in_review`, and only when the check is clean. Roles are in `AGENTS.md` and `docs/agents/`.

Restart `npm run dev` after creating an issue so the new page is registered.

## GitHub Pages, later

`.github/workflows/pages.yml` builds the site and deploys to Pages when this repository is pushed to `main` and Pages is enabled. This project does not turn that on by itself.

`astro.config.mjs` sets `site` to `https://irani.cc` and `base` to `/`. When you attach the domain, add a `public/CNAME` file containing `irani.cc`. If the first public URL is a project site (`username.github.io/repo/`), set `base` to `/repo/` before that deploy.
