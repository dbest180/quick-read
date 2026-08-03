# Quick Reads

A small, static library of short fiction. No backend, no build step for the
site itself — just HTML/CSS/JS plus a Python script that keeps the library
manifest in sync with what's in `/stories`. Deploys straight to GitHub Pages.

## Structure

```
quick-reads/
├── index.html              Landing page (nav, hero, story grid)
├── story.html              Reader page (loads a story via ?story=slug)
├── favicon.svg
├── css/
│   ├── variables.css       Colors, type, spacing tokens
│   ├── main.css            Nav, dividers, buttons, footer
│   ├── landing.css         Hero + story card grid
│   └── reader.css          Chapter view, progress bar, chapter nav
├── js/
│   ├── main.js              Landing page: fetches manifest, renders cards
│   └── reader.js             Reader page: loads chapters, handles nav/progress
├── data/
│   └── manifest.json        AUTO-GENERATED — do not hand-edit, see below
├── scripts/
│   └── build_manifest.py    Scans /stories, regenerates manifest.json
└── stories/
    └── prototype/            One folder per story
        ├── meta.json         Title, blurb, tags, status, dateAdded
        ├── 01_The_Awakening.md
        ├── 02_The_Weight_of_Memory.md
        └── ... etc
```

## Adding a new story

1. `mkdir stories/your-story-slug`
2. Add a `meta.json` in that folder:
   ```json
   {
     "title": "Your Title",
     "slug": "your-story-slug",
     "blurb": "One or two sentences for the story card.",
     "tags": ["sci-fi"],
     "status": "complete",
     "dateAdded": "2026-08-15"
   }
   ```
3. Drop your chapter files in, named with a numeric prefix so they sort
   correctly: `01_First_Chapter.md`, `02_Second_Chapter.md`, etc. Each file's
   first `# Heading` becomes the chapter title shown in the reader.
4. Regenerate the manifest:
   ```
   python3 scripts/build_manifest.py
   ```
5. Commit and push. GitHub Pages redeploys automatically.

That's the whole workflow — you never touch `index.html`, `story.html`, or
`manifest.json` by hand.

## Running locally

Browsers block `fetch()` of local files over `file://`, so you need a local
server, not a double-click:

```
cd quick-reads
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploying to GitHub Pages

1. Push this folder to a GitHub repo (as the repo root, or a `/docs` folder
   — either works, just match it in the Pages settings).
2. Repo Settings → Pages → set the source branch/folder.
3. Update the GitHub link in the footer of `index.html` / `story.html` to
   point at your actual repo.

## Notes / things to adjust

- `stories/prototype` uses "Prototype" as a placeholder title — rename it
  (and the slug, if you want the URL to change) in `meta.json` whenever you
  land on a real title.
- Markdown rendering uses [marked.js](https://marked.js.org/) from a CDN —
  no build step, but it does mean the reader page needs internet access to
  load the library the first time.
- Read time is estimated at 200 words/minute in `build_manifest.py` — tweak
  `WORDS_PER_MINUTE` if that doesn't match how your readers actually read.
