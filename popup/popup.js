const statusEl = document.getElementById("status");
const listEl = document.getElementById("list");

function render(names) {
  listEl.innerHTML = "";
  for (const name of names) {
    const div = document.createElement("div");
    div.className = "item";
    div.textContent = name;
    listEl.appendChild(div);
  }
}

document.getElementById("load").addEventListener("click", async () => {
  statusEl.textContent = "Loading…";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { type: "GET_CHAPTER_NAMES" }, (res) => {
    const err = chrome.runtime.lastError;
    if (err) {
      statusEl.textContent = err.message;
      return;
    }
    if (!res?.ok) {
      statusEl.textContent = res?.error || "Failed.";
      return;
    }
    statusEl.textContent = `Found ${res.names.length} chapters.`;
    render(res.names);
  });
});
