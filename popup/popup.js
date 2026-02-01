const statusEl = document.getElementById("status");
const listEl = document.getElementById("list");
const groupSizeEl = document.getElementById("groupSize");

let lastChapters = [];

function getGroupSize() {
  const n = Number(groupSizeEl?.value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 5;
}

// Open URL in a background tab so you stay where you are
async function openInBackground(url) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.create({ url, active: false, openerTabId: tab?.id });
}

async function downloadPart(chapters, startIdx, endIdxExclusive) {
  const slice = chapters.slice(startIdx, endIdxExclusive);
  const urls = slice.map(c => c.downloadUrl).filter(Boolean);

  if (urls.length === 0) {
    statusEl.textContent = "No download links in this part.";
    return;
  }

  statusEl.textContent = `Opening ${urls.length} download link(s)…`;

  for (const url of urls) {
    await openInBackground(url);
    await new Promise(r => setTimeout(r, 120));
  }

  statusEl.textContent = `Opened ${urls.length} download link(s).`;
}

function render(chapters) {
  listEl.innerHTML = "";

  const groupSize = getGroupSize();
  const N = chapters.length;

  // Move the "remainder" group to the TOP so the bottom-most part is full-sized
  const rem = N % groupSize;
  const startOffset = rem === 0 ? 0 : rem;

  // Total number of parts
  const totalParts = rem === 0 ? N / groupSize : 1 + (N - startOffset) / groupSize;

  for (let i = 0; i < N; i++) {
    // Part boundaries:
    // - always at i=0 (top group, possibly remainder)
    // - then every groupSize after startOffset
    const isBoundary = i === 0 || (i >= startOffset && (i - startOffset) % groupSize === 0);

    if (isBoundary) {
      if (i !== 0) {
        const divider = document.createElement("div");
        divider.className = "partDivider";
        listEl.appendChild(divider);
      }

      // End index (exclusive) of this group
      const j = i < startOffset ? startOffset : Math.min(i + groupSize, N);

      // Range counted from the bottom (oldest = 1)
      // Group covers [i .. j-1]
      const start = N - (j - 1); // N - j + 1
      const end = N - i;

      // Part numbering counted from the bottom (bottom-most group = Part 1)
      // Compute which group this is from the top, then invert
      const groupIdxFromTop = i < startOffset ? 0 : 1 + Math.floor((i - startOffset) / groupSize);
      const partIndex = totalParts - groupIdxFromTop;

      const header = document.createElement("div");
      header.className = "partHeader";

      const left = document.createElement("div");

      const partTitle = document.createElement("div");
      partTitle.className = "partTitle";
      partTitle.textContent = `Part ${partIndex}`;

      const partMeta = document.createElement("div");
      partMeta.className = "partMeta";
      partMeta.textContent = `${start}–${end}`;

      left.appendChild(partTitle);
      left.appendChild(partMeta);

      const partDownloadBtn = document.createElement("button");
      partDownloadBtn.className = "btn btnPrimary";
      partDownloadBtn.textContent = `Download ${start}–${end}`;
      partDownloadBtn.addEventListener("click", () => {
        downloadPart(chapters, i, j);
      });

      header.appendChild(left);
      header.appendChild(partDownloadBtn);
      listEl.appendChild(header);
    }

    const ch = chapters[i];

    // Chapter row (only Download)
    const row = document.createElement("div");
    row.className = "chapterRow";

    const chapterTitle = document.createElement("div");
    chapterTitle.className = "chapterTitle";
    chapterTitle.textContent = ch.name || "(no title)";

    const downloadBtn = document.createElement("button");
    downloadBtn.className = "btn btnGhost";
    downloadBtn.textContent = "Download";
    downloadBtn.disabled = !ch.downloadUrl;

    downloadBtn.addEventListener("click", async () => {
      if (!ch.downloadUrl) {
        statusEl.textContent = "No download link for this chapter.";
        return;
      }
      await openInBackground(ch.downloadUrl);
      statusEl.textContent = "Opened download link.";
    });

    row.appendChild(chapterTitle);
    row.appendChild(downloadBtn);
    listEl.appendChild(row);
  }
}

document.getElementById("load").addEventListener("click", async () => {
  statusEl.textContent = "Loading…";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { type: "GET_CHAPTERS" }, (res) => {
    const err = chrome.runtime.lastError;
    if (err) {
      statusEl.textContent = err.message;
      return;
    }
    if (!res?.ok) {
      statusEl.textContent = res?.error || "Failed.";
      return;
    }

    lastChapters = res.chapters || [];
    statusEl.textContent = `Found ${lastChapters.length} chapters.`;
    render(lastChapters);
  });
});

groupSizeEl.addEventListener("input", () => {
  if (!lastChapters.length) return;
  render(lastChapters);
});
