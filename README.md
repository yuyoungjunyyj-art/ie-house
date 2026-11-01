# ie.house

Brand home, Ie Fushimi House of Tea, and the Ie Stays holding page. Built with Astro.

```bash
npm install
npm run dev
```

## Where things live

| What | Where |
| --- | --- |
| Page copy (English) | `src/content/en/*.json` |
| Tea list, dishes, events, seasons, journal | `src/content/en/data/*.json` |
| Address, hours, links, booking link | `src/content/settings.json` |
| Image slots and shoot list | `src/content/images.json` |
| Photographs | `src/assets/photos/` (served as AVIF and WebP) |
| Colours, type and layout | `src/styles/global.css` |

`[Text in brackets]` is a fact still to confirm. It shows on the page in italics. `npm run copy` rewrites `COPY.md` with all copy and a checklist of what is left.

## Editing content

Run `npm run dev` and `npm run cms` together, then open `http://localhost:4321/admin/`. For the live site, configure GitHub sign-in for the chosen host.

## Automatic upload

When Claude Code finishes a turn in this project, `scripts/auto-push.mjs` commits any changes and pushes them to GitHub (set up in `.claude/settings.json`). It holds back the upload if a file looks like a secret or is over 50 MB. The original `Photo/` folder is never uploaded. This repository is public, so anything else saved in this folder is published unless `.gitignore` excludes it.

## Connecting forms

Copy `.env.example` to `.env` and set both endpoints. Each receives a POST of form data and must return a 2xx status. Until they are set, the forms say they are not connected and send nothing.

## Adding Japanese

Add `'ja'` to `locales` in `src/lib/i18n.ts` and create `src/content/ja/` with the same files as `en/`. The `/ja/` pages, hreflang tags and the language toggle follow from that.
