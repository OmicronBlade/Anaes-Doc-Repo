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
    siteVersion: document.getElementById("site-version"),
    credits: document.getElementById("credits")
  };

  // Drafts are hidden by default. "Drafts" switches them on for this tab
  // (kept while moving between forms); ?drafts in the address turns it on too.
  var DRAFTS_KEY = "anaesthesia-forms:show-drafts";
  function draftsStart() {
    if (/[?&]drafts\b/.test(location.search)) return true;
    try { return sessionStorage.getItem(DRAFTS_KEY) === "1"; } catch (e) { return false; }
  }
  var state = { query: "", category: "All", drafts: draftsStart() };

  function visible() {
    return DOCS.filter(function (d) { return state.drafts || !d.draft; });
  }

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
    var docs = visible();
    cats = cats.filter(function (c) {
      return c === "All" || docs.some(function (d) { return d.category === c; });
    });
    if (cats.indexOf(state.category) === -1) state.category = "All";
    var nDrafts = DOCS.filter(function (d) { return d.draft; }).length;
    els.chips.innerHTML = cats.map(function (c) {
      return '<button type="button" class="chip" data-cat="' + esc(c) + '" aria-pressed="' +
        (c === state.category) + '">' + esc(c) + "</button>";
    }).join("") +
      (nDrafts ? '<button type="button" class="chip chip-drafts" id="drafts-toggle" aria-pressed="' + state.drafts + '"' +
        ' title="' + (state.drafts ? "Hide" : "Show") + ' documents that are still drafts (not yet approved)">' +
        '<span class="dot" aria-hidden="true"></span>Drafts <span class="n">' + nDrafts + "</span></button>" : "");
  }

  // Row: title + description | [download] [version] [date] [arrow]
  // The title link is stretched over the whole row; the download button sits above it.
  function renderDoc(doc) {
    var badge = doc.draft ? ' <span class="draft-badge">Draft</span>' : "";
    var title = doc.href
      ? '<a class="doc-link" href="' + esc(doc.href) + '">' + esc(doc.title) + "</a>"
      : esc(doc.title);
    var body =
      '<div class="doc-body">' +
        '<p class="doc-title">' + title + badge + "</p>" +
        (doc.description ? '<p class="doc-desc">' + esc(doc.description) + "</p>" : "") +
      "</div>";

    var dl = doc.href && doc.pdf && doc.pdf.file
      ? '<a class="dl" href="' + esc(doc.pdf.file) + '" download="' + esc(doc.pdf.download || "") + '"' +
        ' title="' + (doc.pdf.autofill ? "Download a ready-to-print PDF with the standard values filled in" : "Download the blank form as a ready-to-print PDF") + '">' + DOWNLOAD +
        "<span>" + esc(doc.pdf.label || "PDF") + "</span></a>"
      : "";
    var meta = '<div class="doc-meta">' + dl +
      '<span class="version-tag screen-only" title="Document version">v' + esc(doc.version) + "</span>" +
      (doc.updated ? '<span class="updated">' + esc(formatDate(doc.updated)) + "</span>" : "") +
      (doc.href ? ARROW : '<span class="soon">Coming soon</span>') + "</div>";

    return '<li class="' + (doc.href ? "has-link" : "is-pending") + (doc.draft ? " is-draft" : "") + '">' +
      '<div class="doc">' + body + meta + "</div></li>";
  }

  function renderList() {
    var q = state.query.trim().toLowerCase();
    var terms = q ? q.split(/\s+/) : [];

    var matches = visible().filter(function (d) {
      if (state.category !== "All" && d.category !== state.category) return false;
      if (!terms.length) return true;
      var h = haystack(d);
      return terms.every(function (t) { return h.indexOf(t) !== -1; });
    });

    els.count.textContent = matches.length + (matches.length === 1 ? " document" : " documents");

    if (!matches.length) {
      var hidden = !state.drafts && terms.length && DOCS.some(function (d) {
        var h = haystack(d);
        return d.draft && terms.every(function (t) { return h.indexOf(t) !== -1; });
      });
      els.list.innerHTML = '<div class="empty">No documents match “' + esc(state.query) + '”.' +
        (hidden ? ' Some drafts match — switch on <b>Drafts</b> to see them.' : "") + "</div>";
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
    if (btn.id === "drafts-toggle") {
      state.drafts = !state.drafts;
      try { sessionStorage.setItem(DRAFTS_KEY, state.drafts ? "1" : "0"); } catch (err) {}
      renderChips();
      renderList();
      var t = document.getElementById("drafts-toggle");
      if (t) t.focus();
      return;
    }
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
  if (els.credits) {
    els.credits.innerHTML =
      (SITE.author ? "<span>Author: " + esc(SITE.author) + "</span>" : "") +
      (SITE.adminEmail ? '<a href="mailto:' + esc(SITE.adminEmail) + "?subject=" + encodeURIComponent((SITE.title || "Site") + " – query") +
        '">Contact site admin</a>' : "");
  }

  renderChips();
  renderList();
})();
