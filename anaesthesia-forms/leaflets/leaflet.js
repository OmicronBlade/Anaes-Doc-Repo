/*
 * Patient information leaflet — rendered from forms/shared/regional-content.js,
 * the same file the consent forms use, so the two never disagree.
 * Each leaflet page sets <body data-form="upper-limb"> (a key of REGIONAL.FORMS).
 */
(function () {
  "use strict";

  var VERSION = "1.1 · October 2026";
  var R = window.REGIONAL;
  var key = document.body.getAttribute("data-form");
  var f = R.FORMS[key];
  var ORDER = ["expected", "very-common", "common", "uncommon", "rare", "very-rare"];

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  var CHECK = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10"/><path d="M5.5 10.3l3 3 6-6.6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var DOT = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="4"/></svg>';

  function list(items, icon, cls) {
    return '<ul class="' + (cls || "ticks") + '">' + items.map(function (i) {
      return "<li>" + icon + "<span>" + esc(i.pt) + "</span></li>";
    }).join("") + "</ul>";
  }

  // ---------- risks grouped by how often they happen ----------
  function risksHtml() {
    var all = R.GENERAL_RISKS.concat(f.risks || []);
    var out = "";
    ORDER.forEach(function (band) {
      var items = all.filter(function (r) { return r.band === band; });
      if (!items.length) return;
      var B = R.BANDS[band];
      var level = ORDER.indexOf(band);   // 0 = expected ... 5 = very rare
      out += '<section class="band band-' + band + '">' +
        '<h3><span class="b-label">' + esc(B.label) + '</span>' +
        (band === "expected" ? "" : '<span class="b-range">' + esc(B.pt) + "</span>") +
        '<span class="meter" aria-hidden="true">' + [0, 1, 2, 3, 4].map(function (i) {
          return '<i class="' + (i < 5 - Math.max(level - 1, 0) && band !== "expected" ? "on" : "") + '"></i>';
        }).join("") + "</span></h3><ul>" +
        items.map(function (r) {
          var note = r.blocks ? "Only with some types of block — ask your anaesthetist." : "";
          return "<li><span>" + esc(r.pt) + (note ? ' <em class="note">' + esc(note) + "</em>" : "") + "</span></li>";
        }).join("") + "</ul></section>";
    });
    return out;
  }

  // ---------- summary table (the detail that used to be on the consent form) ----------
  function summaryHtml() {
    var rows = function (risks) {
      return ORDER.map(function (band) {
        return risks.filter(function (r) { return r.band === band; }).map(function (r) {
          var B = R.BANDS[band];
          return "<tr><td>" + esc(r.short) + "</td><td><b>" + esc(B.label) + "</b>" +
            (B.range ? '<span class="rng">' + esc(B.range) + "</span>" : "") +
            (r.freq ? '<span class="fq">' + esc(r.freq) + "</span>" : "") + "</td></tr>";
        }).join("");
      }).join("");
    };
    return '<section class="card summary"><h2>Risks at a glance</h2>' +
      "<p>A summary of the risks above, as discussed with your anaesthetist.</p>" +
      '<table><thead><tr><th>Risk</th><th>How often</th></tr></thead><tbody>' +
      '<tr class="grp"><th colspan="2">All nerve and plane blocks</th></tr>' + rows(R.GENERAL_RISKS) +
      ((f.risks || []).length ? '<tr class="grp"><th colspan="2">Only with some types of block</th></tr>' + rows(f.risks) : "") +
      "</tbody></table></section>";
  }

  var h = "";
  h += '<header class="lh"><img class="crest" src="../assets/img/nsh-crest.jpg" alt="New Somerset Hospital crest">' +
    '<div class="lh-text"><b>New Somerset Hospital</b><span>Department of Anaesthesia</span></div></header>';

  h += '<div class="hero"><p class="kicker">Patient information</p><h1>' + esc(f.ptTitle) + "</h1>" +
    '<p class="lede">Your anaesthetist has suggested a nerve block for ' + esc(f.ptArea) +
    ". This leaflet explains why, what to expect and the possible risks, so that you can decide together. Please keep it and take it home.</p></div>";

  h += '<section class="card benefits"><h2>Why we recommend a nerve block</h2>' +
    '<p>For most people the benefits are large and serious problems are rare. A nerve block can give you:</p>' +
    list(f.benefits, CHECK) + "</section>";

  h += '<section class="card"><h2>What happens</h2><p>' + esc(f.ptWhat) + "</p>" +
    '<ul class="plain">' +
    "<li>You will be awake or lightly sedated, with monitoring of your heart, blood pressure and oxygen.</li>" +
    "<li>The skin is cleaned and numbed first. You may feel pressure or a warm tingling. Tell the anaesthetist straight away if you feel sharp pain or an electric-shock feeling.</li>" +
    "<li>The numbness usually lasts 8 to 24 hours, sometimes up to 48 hours.</li>" +
    "</ul></section>";

  h += '<section class="card risks"><h2>Side effects and risks</h2>' +
    "<p>Most people have no problems at all. Every procedure carries some risk, and the law says you should be told about any risk that could matter to you. The list below is grouped by how often each one happens. Your anaesthetist will explain which ones apply to your block.</p>" +
    risksHtml() + "</section>";

  h += '<section class="card"><h2>Your choices</h2><p>Other ways to manage your anaesthetic and pain include:</p>' +
    list(f.alternatives, DOT, "dots") +
    '<p class="refuse"><b>You have the right to say no.</b> If you decide not to have a nerve block, it will not affect your operation or your care, and you can change your mind at any time before the block is done.</p></section>';

  h += '<section class="card"><h2>After the block</h2>' + list(f.aftercare, DOT, "dots") + "</section>";

  h += '<section class="card contact"><h2>Questions or worries?</h2>' +
    "<p>Please ask your anaesthetist anything before you decide. If you need an interpreter, ask for one.</p>" +
    '<p>After you go home, phone <a href="tel:' + R.CONTACT.phone.replace(/\s/g, "") + '"><b>' + esc(R.CONTACT.phone) + "</b></a> — " + esc(R.CONTACT.text) +
    " If you have chest pain, severe breathlessness or a fit, go to your nearest emergency unit.</p></section>";

  h += summaryHtml();

  h += '<footer><p>This leaflet supports, but does not replace, your conversation with your anaesthetist. Frequencies are approximate.</p>' +
    '<p class="refs-h">References</p><ol class="refs">' + R.SOURCES.map(function (src) {
      return "<li>" + esc(src.text) + (src.doi ? ' Available from: <a href="https://doi.org/' + src.doi + '">https://doi.org/' + esc(src.doi) + "</a>" : "") + "</li>";
    }).join("") + "</ol>" +
    '<p class="ver">Version ' + VERSION + ' · <button type="button" class="print screen-only" onclick="window.print()">Print this leaflet</button></p></footer>';

  document.getElementById("leaflet").innerHTML = h;
  document.title = f.ptTitle + " — Patient information";
})();
