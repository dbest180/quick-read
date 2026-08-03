async function loadManifest() {
  const res = await fetch("data/manifest.json");
  if (!res.ok) throw new Error("Could not load manifest.json");
  return res.json();
}

function waveformBars(readTimeMinutes) {
  // 1 bar per ~3 minutes of reading, clamped between 2 and 8 bars.
  const count = Math.min(8, Math.max(2, Math.round(readTimeMinutes / 3)));
  const heights = [40, 70, 100, 55, 85, 65, 95, 50];
  let html = "";
  for (let i = 0; i < count; i++) {
    html += `<span style="height:${heights[i % heights.length]}%"></span>`;
  }
  return html;
}

function storyCard(story) {
  const tags = story.tags
    .map((t) => `<span class="tag">${t}</span>`)
    .join("");

  return `
    <a class="story-card" href="story.html?story=${encodeURIComponent(story.slug)}">
      <h3 class="story-card__title">${story.title}</h3>
      <p class="story-card__blurb">${story.blurb}</p>
      <div class="story-card__tags">${tags}</div>
      <div class="story-card__meta">
        <span>${story.chapterCount} ch · ${story.readTimeMinutes} min</span>
        <span class="waveform">${waveformBars(story.readTimeMinutes)}</span>
      </div>
    </a>
  `;
}

async function renderLibrary() {
  const grid = document.getElementById("story-grid");
  try {
    const manifest = await loadManifest();
    if (!manifest.stories.length) {
      grid.innerHTML = `<p class="library__empty">No stories yet. Add one to /stories and rebuild the manifest.</p>`;
      return;
    }
    grid.innerHTML = manifest.stories.map(storyCard).join("");
  } catch (err) {
    grid.innerHTML = `<p class="library__empty">Couldn't load the library (${err.message}). If you're testing locally, serve this folder with a local server rather than opening the file directly — see the README.</p>`;
  }
}

renderLibrary();
