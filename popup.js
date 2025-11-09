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
    addRemoveBtn.className = isInList ? "btn remove-btn" : "btn add-btn";
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
    deleteBtn.className = "icon-btn delete-btn";
    deleteBtn.setAttribute("title", "Remove");
    deleteBtn.setAttribute("aria-label", "Remove");
    deleteBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
        <path d="M10 11v6"></path>
        <path d="M14 11v6"></path>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
      </svg>
    `;
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
