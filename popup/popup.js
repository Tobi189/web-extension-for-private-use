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

  for (let i = 0; i < chapters.length; i++) {
    // Part header + divider at boundaries
    if (i % groupSize === 0) {
      if (i !== 0) {
        const divider = document.createElement("div");
        divider.className = "partDivider";
        listEl.appendChild(divider);
      }

      const partIndex = Math.floor(i / groupSize) + 1;
      const start = i + 1;
      const end = Math.min(i + groupSize, chapters.length);

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
        downloadPart(chapters, i, Math.min(i + groupSize, chapters.length));
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
