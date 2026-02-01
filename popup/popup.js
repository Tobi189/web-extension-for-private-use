const statusEl = document.getElementById("status");
const listEl = document.getElementById("list");

function render(chapters) {
  listEl.innerHTML = "";

  for (const ch of chapters) {
    const item = document.createElement("div");
    item.className = "item";

    const title = document.createElement("div");
    title.className = "itemTitle";
    title.textContent = ch.name || "(no title)";

    const actions = document.createElement("div");
    actions.className = "itemActions";

    const openBtn = document.createElement("button");
    openBtn.className = "smallBtn";
    openBtn.textContent = "Open";
    openBtn.addEventListener("click", () => {
      if (!ch.url) {
        statusEl.textContent = "No chapter URL.";
        return;
      }
      chrome.tabs.create({ url: ch.url });
    });

    const copyBtn = document.createElement("button");
    copyBtn.className = "smallBtn";
    copyBtn.textContent = "Copy link";
    copyBtn.addEventListener("click", async () => {
      if (!ch.url) {
        statusEl.textContent = "No chapter URL to copy.";
        return;
      }
      await navigator.clipboard.writeText(ch.url);
      statusEl.textContent = "Copied link.";
    });

    const downloadBtn = document.createElement("button");
    downloadBtn.className = "smallBtn";
    downloadBtn.textContent = "Download";
    downloadBtn.disabled = !ch.downloadUrl;

    downloadBtn.addEventListener("click", () => {
      statusEl.textContent = "Download clicked…";

      const url = ch.downloadUrl;
      if (!url) {
        statusEl.textContent = "No download link for this chapter.";
        return;
      }

      chrome.downloads.download({ url }, (downloadId) => {
        const err = chrome.runtime.lastError;
        if (err) {
          statusEl.textContent = `Download failed: ${err.message}`;
          // fallback: open the link
          chrome.tabs.create({ url });
          return;
        }
        statusEl.textContent = `Download started (id: ${downloadId}).`;
      });
    });

    actions.appendChild(openBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(downloadBtn);

    item.appendChild(title);
    item.appendChild(actions);
    listEl.appendChild(item);
  }
}

document.getElementById("load").addEventListener("click", async () => {
  statusEl.textContent = "Loading…";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    statusEl.textContent = "No active tab.";
    return;
  }

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

    statusEl.textContent = `Found ${res.chapters.length} chapters.`;
    render(res.chapters);
  });
});
