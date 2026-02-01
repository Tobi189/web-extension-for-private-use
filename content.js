chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "GET_CHAPTERS") {
    sendResponse({ ok: false, error: "Unknown message type", got: msg?.type });
    return;
  }

  const root = document.getElementById("chapter-list");
  if (!root) {
    sendResponse({ ok: false, error: "No #chapter-list on this page (open the Chapters tab)." });
    return;
  }

  const rows = root.querySelectorAll('div[data-chapter-number]');
  const chapters = [];

  for (const row of rows) {
    const links = [...row.querySelectorAll("a[href]")];

    // Chapter page link (the one with visible text)
    const titleLink = links.find(a => (a.textContent || "").trim().length > 0);
    const name = (titleLink?.textContent || "").trim();
    const url = titleLink?.href || "";

    // Download link (icon-only; usually Google Drive "uc?...export=download")
    const downloadLink = links.find(a => {
      const href = a.href || "";
      return (
        href.includes("drive.google.com/uc") ||
        href.includes("export=download") ||
        href.includes("drive.google.com")
      );
    });

    const downloadUrl = downloadLink?.href || "";

    if (name && url) chapters.push({ name, url, downloadUrl });
  }

  sendResponse({ ok: true, chapters });
});
