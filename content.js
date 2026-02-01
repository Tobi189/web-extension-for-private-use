chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "GET_CHAPTER_NAMES") {
    const root = document.getElementById("chapter-list");
    if (!root) {
      sendResponse({ ok: false, error: "No #chapter-list on this page" });
      return;
    }

    const rows = root.querySelectorAll('div[data-chapter-number]');
    const names = [...rows]
      .map(row => row.querySelector('a[href*="chapter"]')?.textContent?.trim())
      .filter(Boolean);

    sendResponse({ ok: true, names });
    return;
  }

  // optional: keep this so you see mistakes
  sendResponse({ ok: false, error: "Unknown message type", got: msg?.type });
});
