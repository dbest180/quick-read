const params = new URLSearchParams(window.location.search);
const storySlug = params.get("story");
const chapterOrder = parseInt(params.get("chapter") || "1", 10);

const els = {
  header: document.getElementById("reader-header"),
  chapterList: document.getElementById("chapter-list"),
  chapter: document.getElementById("chapter"),
  chapterNav: document.getElementById("chapter-nav"),
  progressFill: document.getElementById("progress-fill"),
};

function chapterUrl(slug, order) {
  return `story.html?story=${encodeURIComponent(slug)}&chapter=${order}`;
}

function renderHeader(story) {
  els.header.innerHTML = `
    <p class="eyebrow">Quick Reads · ${story.status}</p>
    <h1 class="reader-header__title">${story.title}</h1>
    <p class="reader-header__blurb">${story.blurb}</p>
    <p class="reader-header__meta">${story.chapterCount} chapters · ~${story.readTimeMinutes} min read</p>
  `;
}

function renderChapterList(story, currentOrder) {
  els.chapterList.innerHTML = story.chapters
    .map((ch) => {
      const current = ch.order === currentOrder ? "is-current" : "";
      return `
        <a href="${chapterUrl(story.slug, ch.order)}" class="${current}">
          <span class="chapter-list__num">${String(ch.order).padStart(2, "0")}</span>
          <span>${ch.title}</span>
        </a>
      `;
    })
    .join("");
}

function renderChapterNav(story, currentOrder) {
  const prev = story.chapters.find((c) => c.order === currentOrder - 1);
  const next = story.chapters.find((c) => c.order === currentOrder + 1);

  const dots = story.chapters
    .map((ch) => {
      const current = ch.order === currentOrder ? "is-current" : "";
      return `<a href="${chapterUrl(story.slug, ch.order)}" class="${current}" aria-label="Chapter ${ch.order}: ${ch.title}"></a>`;
    })
    .join("");

  els.chapterNav.innerHTML = `
    ${
      prev
        ? `<a class="chapter-nav__link" href="${chapterUrl(story.slug, prev.order)}"><span>&larr; Previous</span>${prev.title}</a>`
        : `<span></span>`
    }
    <div class="chapter-dots">${dots}</div>
    ${
      next
        ? `<a class="chapter-nav__link chapter-nav__link--next" href="${chapterUrl(story.slug, next.order)}"><span>Next &rarr;</span>${next.title}</a>`
        : `<span></span>`
    }
  `;
}

async function renderChapterBody(story, chapterMeta) {
  const res = await fetch(`stories/${story.slug}/${chapterMeta.file}`);
  if (!res.ok) throw new Error(`Could not load ${chapterMeta.file}`);
  const raw = await res.text();
  const html = marked.parse(raw);

  els.chapter.innerHTML = `
    <p class="eyebrow chapter__eyebrow">Chapter ${String(chapterMeta.order).padStart(2, "0")} of ${String(story.chapterCount).padStart(2, "0")}</p>
    <div class="chapter__body">${html}</div>
  `;
}

function setupProgressBar() {
  window.addEventListener("scroll", () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    els.progressFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  });
}

async function init() {
  if (!storySlug) {
    els.chapter.innerHTML = `<p class="error-state">No story specified. <a class="btn" href="index.html">&larr; Back to Quick Reads</a></p>`;
    return;
  }

  try {
    const res = await fetch("data/manifest.json");
    const manifest = await res.json();
    const story = manifest.stories.find((s) => s.slug === storySlug);

    if (!story) {
      els.chapter.innerHTML = `<p class="error-state">Story "${storySlug}" not found. <a class="btn" href="index.html">&larr; Back to Quick Reads</a></p>`;
      return;
    }

    const chapterMeta =
      story.chapters.find((c) => c.order === chapterOrder) || story.chapters[0];

    document.title = `${chapterMeta.title} — ${story.title} — Quick Reads`;

    renderHeader(story);
    renderChapterList(story, chapterMeta.order);
    await renderChapterBody(story, chapterMeta);
    renderChapterNav(story, chapterMeta.order);
    setupProgressBar();
  } catch (err) {
    els.chapter.innerHTML = `<p class="error-state">Something went wrong (${err.message}). If you're testing locally, serve this folder with a local server rather than opening the file directly — see the README.</p>`;
  }
}

init();
