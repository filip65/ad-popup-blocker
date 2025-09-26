// Globálna premenná na sledovanie, či je aktívny tab v zozname
let isCurrentTabInActiveList = false;

// Funkcia na kontrolu, či je tab v zozname activeUrls
function checkIfTabInActiveList(tab) {
  chrome.storage.local.get(["activeUrls"], (result) => {
    const activeUrls = result.activeUrls || [];

    if (tab && tab.url) {
      try {
        const url = new URL(tab.url);
        const origin = url.origin;

        isCurrentTabInActiveList = activeUrls.includes(origin);
        console.log("Current tab origin:", origin);
        console.log("Is in active list:", isCurrentTabInActiveList);
        console.log("Active URLs:", activeUrls);
      } catch (e) {
        isCurrentTabInActiveList = false;
        console.log("Cannot parse URL:", tab.url);
      }
    }
  });
}

// Sledovanie zmien aktívneho tabu
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    checkIfTabInActiveList(tab);
  });
});

// Sledovanie aktualizácií tabu (keď sa zmení URL)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    checkIfTabInActiveList(tab);
  }
});

// Inicializácia pri spustení
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    checkIfTabInActiveList(tabs[0]);
  }
});

// Upravený listener pre vytváranie nových tabov
chrome.tabs.onCreated.addListener((tab) => {
  chrome.storage.local.get(["enabled"], (result) => {
    if (result.enabled !== false) {
      if (tab.id && tab.active && tab.url !== "chrome://newtab/") {
        console.log(
          "New tab created, current tab in active list:",
          isCurrentTabInActiveList
        );

        // Zablokuj nový tab len ak sa pôvodný aktívny tab nachádzal v zozname activeUrls
        if (isCurrentTabInActiveList) {
          console.log("Blocking new tab because current tab is in active list");
          chrome.tabs.remove(tab.id);
        }
      }
    }
  });
});
