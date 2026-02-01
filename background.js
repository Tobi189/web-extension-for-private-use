chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type !== "RUN") return;

  await chrome.scripting.executeScript({
    target: { tabId: msg.tabId },
    func: () => {
      alert("Hello from the extension!");
    }
  });
});
