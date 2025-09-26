const toggle = document.getElementById("toggle");
const addRemoveBtn = document.getElementById("addRemoveBtn");
const currentUrlDiv = document.getElementById("currentUrl");
const urlListDiv = document.getElementById("urlList");

let currentHost = "";
let activeUrls = [];

// Load current state
chrome.storage.local.get(["enabled", "activeUrls"], (result) => {
  toggle.checked = result.enabled !== false; // default: true
  activeUrls = result.activeUrls || [];
  updateUI();
});

// Get current tab URL
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0] && tabs[0].url) {
    try {
      const url = new URL(tabs[0].url);
      currentHost = url.origin;
      currentUrlDiv.textContent = `Current site: ${currentHost}`;
      updateAddRemoveButton();
    } catch (e) {
      currentUrlDiv.textContent = "Cannot access current site";
      addRemoveBtn.style.display = "none";
    }
  }
});

// On toggle change
toggle.addEventListener("change", () => {
  chrome.storage.local.set({ enabled: toggle.checked });
});

// Add/Remove button functionality
addRemoveBtn.addEventListener("click", () => {
  if (currentHost) {
    const index = activeUrls.indexOf(currentHost);

    if (index === -1) {
      // Add to list
      activeUrls.push(currentHost);
    } else {
      // Remove from list
      activeUrls.splice(index, 1);
    }

    chrome.storage.local.set({ activeUrls: activeUrls }, () => {
      updateUI();
    });
  }
});

function updateAddRemoveButton() {
  if (currentHost) {
    const isInList = activeUrls.includes(currentHost);
    addRemoveBtn.textContent = isInList ? "Remove" : "Add";
    addRemoveBtn.className = isInList ? "remove-btn" : "add-btn";
  }
}

function updateUI() {
  updateAddRemoveButton();
  renderUrlList();
}

function renderUrlList() {
  urlListDiv.innerHTML = "";

  if (activeUrls.length === 0) {
    urlListDiv.innerHTML =
      '<div style="color: #666; font-style: italic;">No URLs added yet</div>';
    return;
  }

  activeUrls.forEach((url, index) => {
    const urlItem = document.createElement("div");
    urlItem.className = "url-item";

    const urlText = document.createElement("span");
    urlText.className = "url-text";
    urlText.textContent = url;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      activeUrls.splice(index, 1);
      chrome.storage.local.set({ activeUrls: activeUrls }, () => {
        updateUI();
      });
    });

    urlItem.appendChild(urlText);
    urlItem.appendChild(deleteBtn);
    urlListDiv.appendChild(urlItem);
  });
}
