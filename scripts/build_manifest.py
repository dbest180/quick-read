#!/usr/bin/env python3
"""
build_manifest.py

Scans /stories for story folders and regenerates /data/manifest.json.

Usage:
    python3 scripts/build_manifest.py

To add a new story:
    1. Create a folder under /stories, e.g. stories/my-new-story/
    2. Add a meta.json in that folder (see stories/prototype/meta.json for the shape)
    3. Add chapter files named with a numeric prefix, e.g. 01_First.md, 02_Second.md
       (each chapter should start with a single "# " heading — that becomes the
       chapter title)
    4. Run this script. Commit + push. GitHub Pages does the rest.
"""

import json
import re
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent
STORIES_DIR = ROOT / "stories"
OUTPUT_FILE = ROOT / "data" / "manifest.json"

WORDS_PER_MINUTE = 200

CHAPTER_FILENAME_RE = re.compile(r"^(\d+)[_\-].+\.md$")
HEADING_RE = re.compile(r"^#\s+(.*)$", re.MULTILINE)
CHAPTER_PREFIX_RE = re.compile(r"^Chapter\s*\d+\s*[:\-]\s*", re.IGNORECASE)


def word_count(text: str) -> int:
    # Strip markdown syntax roughly, then count words.
    stripped = re.sub(r"[#*_`>\[\]()]", " ", text)
    stripped = re.sub(r"^-{3,}$", " ", stripped, flags=re.MULTILINE)
    return len(stripped.split())


def extract_chapter_title(text: str, fallback: str) -> str:
    match = HEADING_RE.search(text)
    if not match:
        return fallback
    title = match.group(1).strip()
    # Strip a leading "Chapter N:" if present, since the number is tracked separately.
    title = CHAPTER_PREFIX_RE.sub("", title).strip()
    return title or fallback


def build_story(story_dir: Path) -> dict:
    meta_path = story_dir / "meta.json"
    if not meta_path.exists():
        raise FileNotFoundError(f"Missing meta.json in {story_dir}")

    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)

    chapter_files = sorted(
        (f for f in story_dir.glob("*.md") if CHAPTER_FILENAME_RE.match(f.name)),
        key=lambda f: int(CHAPTER_FILENAME_RE.match(f.name).group(1)),
    )

    if not chapter_files:
        raise ValueError(f"No numbered chapter files found in {story_dir}")

    chapters = []
    total_words = 0

    for idx, chapter_file in enumerate(chapter_files, start=1):
        text = chapter_file.read_text(encoding="utf-8")
        title = extract_chapter_title(text, fallback=chapter_file.stem)
        words = word_count(text)
        total_words += words
        chapters.append(
            {
                "order": idx,
                "file": chapter_file.name,
                "title": title,
                "wordCount": words,
            }
        )

    return {
        "slug": meta.get("slug", story_dir.name),
        "title": meta.get("title", story_dir.name),
        "blurb": meta.get("blurb", ""),
        "tags": meta.get("tags", []),
        "status": meta.get("status", "complete"),
        "dateAdded": meta.get("dateAdded", ""),
        "chapterCount": len(chapters),
        "wordCount": total_words,
        "readTimeMinutes": max(1, round(total_words / WORDS_PER_MINUTE)),
        "chapters": chapters,
    }


def main():
    if not STORIES_DIR.exists():
        raise SystemExit(f"No stories directory found at {STORIES_DIR}")

    story_dirs = [d for d in STORIES_DIR.iterdir() if d.is_dir()]
    stories = [build_story(d) for d in sorted(story_dirs)]

    # Newest first.
    stories.sort(key=lambda s: s.get("dateAdded", ""), reverse=True)

    manifest = {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "storyCount": len(stories),
        "stories": stories,
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")

    print(f"Wrote {OUTPUT_FILE} ({len(stories)} stor{'y' if len(stories) == 1 else 'ies'})")
    for s in stories:
        print(f"  - {s['title']} ({s['chapterCount']} chapters, ~{s['readTimeMinutes']} min)")


if __name__ == "__main__":
    main()
