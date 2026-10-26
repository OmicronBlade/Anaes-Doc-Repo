(function () {
  "use strict";

  var SITE = window.SITE || {};
  var DOCS = (window.DOCUMENTS || []).slice();

  var els = {
    title: document.getElementById("site-title"),
    subtitle: document.getElementById("site-subtitle"),
    search: document.getElementById("search"),
    chips: document.getElementById("chips"),
    list: document.getElementById("list"),
    count: document.getElementById("count"),
    siteVersion: document.getElementById("site-version")
  };

  var state = { query: "", category: "All" };

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  }

  function haystack(doc) {
    return [doc.title, doc.description, doc.category, (doc.tags || []).join(" ")]
      .join(" ").toLowerCase();
  }

  var ARROW = '<svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg>';

  var DOWNLOAD = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 2.5v8M4.5 7L8 10.5 11.5 7M3 13.5h10"/></svg>';

  // ---------- render ----------
  function renderChips() {
    var cats = ["All"].concat(SITE.categories || []);
    // only show categories that actually have documents
    cats = cats.filter(function (c) {
      return c === "All" || DOCS.some(function (d) { return d.category === c; });
    });
    els.chips.innerHTML = cats.map(function (c) {
      return '<button type="button" class="chip" data-cat="' + esc(c) + '" aria-pressed="' +
        (c === state.category) + '">' + esc(c) + "</button>";
    }).join("");
  }

  function renderDoc(doc) {
    var meta =
      '<span class="version-tag screen-only" title="Document version">v' + esc(doc.version) + "</span>" +
      (doc.updated ? '<span class="updated">' + esc(formatDate(doc.updated)) + "</span>" : "");

    var body =
      "<div>" +
        '<p class="doc-title">' + esc(doc.title) + "</p>" +
        (doc.description ? '<p class="doc-desc">' + esc(doc.description) + "</p>" : "") +
      "</div>";

    if (doc.href) {
      var dl = doc.pdf && doc.pdf.file
        ? '<a class="dl" href="' + esc(doc.pdf.file) + '" download="' + esc(doc.pdf.download || "") + '"' +
          ' title="' + (doc.pdf.autofill ? "Download a ready-to-print PDF with the standard values filled in" : "Download the blank form as a ready-to-print PDF") + '">' + DOWNLOAD +
          "<span>" + esc(doc.pdf.label || "PDF") + "</span></a>"
        : "";
      return '<li class="has-link"><a class="doc" href="' + esc(doc.href) + '">' + body +
        '<div class="doc-meta">' + meta + ARROW + "</div></a>" + dl + "</li>";
    }
    return '<li><div class="doc is-pending" aria-disabled="true">' + body +
      '<div class="doc-meta">' + meta + '<span class="soon">Coming soon</span></div></div></li>';
  }

  function renderList() {
    var q = state.query.trim().toLowerCase();
    var terms = q ? q.split(/\s+/) : [];

    var matches = DOCS.filter(function (d) {
      if (state.category !== "All" && d.category !== state.category) return false;
      if (!terms.length) return true;
      var h = haystack(d);
      return terms.every(function (t) { return h.indexOf(t) !== -1; });
    });

    els.count.textContent = matches.length + (matches.length === 1 ? " document" : " documents");

    if (!matches.length) {
      els.list.innerHTML = '<div class="empty">No documents match “' + esc(state.query) + '”.</div>';
      return;
    }

    var order = SITE.categories || [];
    var groups = {};
    matches.forEach(function (d) { (groups[d.category] = groups[d.category] || []).push(d); });

    var keys = Object.keys(groups).sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

    els.list.innerHTML = keys.map(function (cat) {
      var items = groups[cat].sort(function (a, b) { return a.title.localeCompare(b.title); });
      return '<section class="group" aria-label="' + esc(cat) + '">' +
        "<h2>" + esc(cat) + "</h2>" +
        '<ul class="doc-list">' + items.map(renderDoc).join("") + "</ul></section>";
    }).join("");
  }

  // ---------- events ----------
  els.search.addEventListener("input", function (e) {
    state.query = e.target.value;
    renderList();
  });

  els.chips.addEventListener("click", function (e) {
    var btn = e.target.closest(".chip");
    if (!btn) return;
    state.category = btn.getAttribute("data-cat");
    renderChips();
    renderList();
  });

  document.addEventListener("keydown", function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (e.key === "/" && !typing) {
      e.preventDefault();
      els.search.focus();
    } else if (e.key === "Escape" && document.activeElement === els.search) {
      els.search.value = "";
      state.query = "";
      renderList();
    }
  });

  // ---------- init ----------
  if (SITE.title) { els.title.textContent = SITE.title; document.title = SITE.title; }
  if (SITE.subtitle) els.subtitle.textContent = SITE.subtitle;
  if (SITE.version) els.siteVersion.textContent = "v" + SITE.version;

  renderChips();
  renderList();
})();
