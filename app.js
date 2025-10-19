// HealthMate - Plain JS app with localStorage persistence

// STORAGE
const STORAGE_KEY = "healthmate_data_v1";

function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : { reports: [], vitals: [], timeline: [], user: null };
  } catch (e) {
    console.error(e);
    return { reports: [], vitals: [], timeline: [], user: null };
  }
}
function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// initial
let state = loadState();

// DOM refs
const panes = document.querySelectorAll(".pane");
const navLinks = document.querySelectorAll(".nav-link");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const reportFile = document.getElementById("reportFile");
const reportType = document.getElementById("reportType");
const reportDate = document.getElementById("reportDate");
const uploadBtn = document.getElementById("uploadBtn");
const reportList = document.getElementById("reportList");

const bpInput = document.getElementById("bp");
const sugarInput = document.getElementById("sugar");
const weightInput = document.getElementById("weight");
const addVitalsBtn = document.getElementById("addVitalsBtn");

const timelineContainer = document.getElementById("timelineContainer");
const langEnBtn = document.getElementById("langEn");
const langRomanBtn = document.getElementById("langRoman");

const reportCountEl = document.getElementById("reportCount");
const lastBPEl = document.getElementById("lastBP");
const lastUpdateEl = document.getElementById("lastUpdate");

const modal = document.getElementById("modal");
const modalClose = document.getElementById("modalClose");
const modalTitle = document.getElementById("modalTitle");
const modalMeta = document.getElementById("modalMeta");
const modalPreview = document.getElementById("modalPreview");
const modalSummary = document.getElementById("modalSummary");

// Navigation (show / hide sections)
function showPane(id) {
  panes.forEach(p => {
    p.style.display = p.id === id ? "" : "none";
  });
  window.location.hash = id;
}
navLinks.forEach(a => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    showPane(a.dataset.target);
  });
});

// initial hash or default to login
const initial = (window.location.hash || "#login").replace("#", "");
showPane(initial);

// login / signup (demo)
loginBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (!name) return alert("Enter name to login (demo).");
  state.user = { name };
  saveState(state);
  usernameInput.value = "";
  passwordInput.value = "";
  alert(`Welcome ${name} — demo login successful.`);
  showPane("dashboard");
  renderAll();
});
signupBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (!name) return alert("Enter name to signup (demo).");
  state.user = { name };
  saveState(state);
  usernameInput.value = "";
  passwordInput.value = "";
  alert(`Account created for ${name} (demo).`);
  showPane("dashboard");
  renderAll();
});

// helper to create ID
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

// Upload report
uploadBtn.addEventListener("click", () => {
  const file = reportFile.files[0];
  const type = reportType.value.trim();
  const date = reportDate.value;
  if (!file || !type || !date) return alert("Please choose file, type and date.");

  const id = uid();
  // create object URL for preview (not permanent)
  const url = URL.createObjectURL(file);

  const report = {
    id, name: file.name, type, date,
    uploadedAt: new Date().toISOString(),
    previewUrl: url,
    aiSummary: {
      en: "AI summary placeholder: This report appears normal. Continue healthy diet.",
      roman: "AI ka khulasa: Report theek nazar aata hai. Sehatmand ghiza jari rakhein."
    }
  };

  state.reports.unshift(report);
  state.timeline.unshift({ type: "report", ...report });
  saveState(state);

  // reset inputs
  reportFile.value = "";
  reportType.value = "";
  reportDate.value = "";

  alert("Report uploaded locally ✅ (preview available).");
  renderAll();
  showPane("dashboard");
});

// Add vitals
addVitalsBtn.addEventListener("click", () => {
  const bp = bpInput.value.trim();
  const sugar = sugarInput.value.trim();
  const weight = weightInput.value.trim();
  if (!bp || !sugar || !weight) return alert("Please fill all vitals fields.");

  const vit = { id: uid(), bp, sugar, weight, date: new Date().toISOString().slice(0,10) };
  state.vitals.unshift(vit);
  state.timeline.unshift({ type: "vitals", ...vit });
  saveState(state);

  bpInput.value = ""; sugarInput.value = ""; weightInput.value = "";
  alert("Vitals added ✅");
  renderAll();
  showPane("timeline");
});

// render functions
function renderReportsList() {
  reportList.innerHTML = "";
  if (!state.reports.length) {
    reportList.innerHTML = `<p class="small-muted">No reports uploaded yet.</p>`;
    return;
  }
  state.reports.forEach(r => {
    const div = document.createElement("div");
    div.className = "report-item";
    div.innerHTML = `
      <div class="report-meta">
        <div><strong>${escapeHtml(r.type)}</strong> — ${escapeHtml(r.name)}</div>
        <div class="small-muted">${escapeHtml(r.date)}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button class="btn-outline view-btn" data-id="${r.id}">View</button>
        <button class="btn-outline download-btn" data-id="${r.id}">Preview</button>
      </div>
    `;
    reportList.appendChild(div);
  });

  // attach events
  reportList.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => openReportModal(btn.dataset.id));
  });
  reportList.querySelectorAll(".download-btn").forEach(btn => {
    btn.addEventListener("click", () => openPreviewWindow(btn.dataset.id));
  });
}

function renderTimeline(lang = "en") {
  timelineContainer.innerHTML = "";
  if (!state.timeline.length) {
    timelineContainer.innerHTML = `<p class="small-muted">No timeline items yet.</p>`;
    return;
  }
  state.timeline.forEach(item => {
    const div = document.createElement("div");
    div.className = "timeline-item";
    if (item.type === "report") {
      div.innerHTML = `
        <div style="text-align:left;">
          <div><strong>REPORT</strong> — ${escapeHtml(item.type)} • ${escapeHtml(item.name)}</div>
          <div class="small-muted">${escapeHtml(item.date)}</div>
          <div style="margin-top:8px;">${escapeHtml(lang === "en" ? (item.aiSummary?.en || "") : (item.aiSummary?.roman || ""))}</div>
        </div>
        <div><button class="btn-outline view-btn" data-id="${item.id}">Open</button></div>
      `;
    } else {
      div.innerHTML = `
        <div style="text-align:left;">
          <div><strong>VITALS</strong></div>
          <div class="small-muted">BP: ${escapeHtml(item.bp)} • Sugar: ${escapeHtml(item.sugar)} • Weight: ${escapeHtml(item.weight)} • ${escapeHtml(item.date)}</div>
        </div>
      `;
    }
    timelineContainer.appendChild(div);
  });

  timelineContainer.querySelectorAll(".view-btn").forEach(b => {
    b.addEventListener("click", ()=> openReportModal(b.dataset.id));
  });
}

function renderDashboard() {
  reportCountEl.textContent = state.reports.length;
  lastBPEl.textContent = state.vitals[0]?.bp || "--";
  lastUpdateEl.textContent = (state.reports[0]?.date || state.vitals[0]?.date) || "--";
}

function renderSummaryPane() {
  const latestReport = state.reports[0];
  const summaryEn = latestReport?.aiSummary?.en || "—";
  const summaryRoman = latestReport?.aiSummary?.roman || "—";
  document.getElementById("summaryEnglish").innerHTML = `<strong>English:</strong> ${escapeHtml(summaryEn)}`;
  document.getElementById("summaryRoman").innerHTML = `<strong>Roman Urdu:</strong> ${escapeHtml(summaryRoman)}`;
}

function renderAll(lang="en") {
  renderReportsList();
  renderTimeline(lang);
  renderDashboard();
  renderSummaryPane();
}

// modal functions
function openReportModal(id) {
  const r = state.reports.find(x=>x.id===id);
  if (!r) return alert("Report not found.");
  modalTitle.textContent = `${r.type} — ${r.name}`;
  modalMeta.textContent = `Date: ${r.date} • Uploaded: ${new Date(r.uploadedAt).toLocaleString()}`;
  modalPreview.innerHTML = "";
  if (r.previewUrl && r.name.match(/\.(pdf)$/i)) {
    const iframe = document.createElement("iframe");
    iframe.src = r.previewUrl;
    iframe.style.width = "100%";
    iframe.style.height = "450px";
    iframe.setAttribute("title", "pdf preview");
    modalPreview.appendChild(iframe);
  } else if (r.previewUrl) {
    const img = document.createElement("img");
    img.src = r.previewUrl;
    img.style.maxWidth = "100%";
    img.style.maxHeight = "380px";
    img.alt = r.name;
    modalPreview.appendChild(img);
  } else {
    modalPreview.textContent = "No preview available.";
  }
  modalSummary.innerHTML = `<h4>AI Summary</h4>
    <p>${escapeHtml(r.aiSummary?.en || "")}</p>
    <p style="margin-top:10px;"><em>Roman:</em> ${escapeHtml(r.aiSummary?.roman || "")}</p>`;
  modal.style.display = "flex";
}
modalClose.addEventListener("click", () => { modal.style.display = "none"; });

// open preview in new tab (object URL)
function openPreviewWindow(id) {
  const r = state.reports.find(x=>x.id===id);
  if (!r || !r.previewUrl) return alert("No preview available.");
  window.open(r.previewUrl, "_blank");
}

// helper to escape HTML
function escapeHtml(str) {
  if (!str) return "";
  return str.replaceAll("&", "&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

// language toggle
let currentLang = "en";
langEnBtn.addEventListener("click", ()=> { currentLang = "en"; renderTimeline(currentLang); });
langRomanBtn.addEventListener("click", ()=> { currentLang = "roman"; renderTimeline(currentLang); });

// initial render
renderAll(currentLang);

// clean up objectURLs on unload to avoid leaks
window.addEventListener("beforeunload", () => {
  state.reports.forEach(r => {
    if (r.previewUrl) {
      try { URL.revokeObjectURL(r.previewUrl); } catch(e) {}
    }
  });
});
