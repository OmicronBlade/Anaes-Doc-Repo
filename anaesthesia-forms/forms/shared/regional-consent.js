/*
 * RegionalConsent — builds the one-page NSH regional anaesthesia consent form
 * from the clinical content in regional-content.js, then hands over to FormKit.
 *
 *   RegionalConsent.init({ key: "upper-limb", version: "1.0" });
 *
 * key is one of REGIONAL.FORMS ("general", "upper-limb", "lower-limb", "truncal").
 * To change wording, frequencies, blocks, benefits or alternatives, edit
 * regional-content.js — the patient leaflets read the same file.
 */
(function () {
  "use strict";

  // Public URL of the patient leaflets (printed under the QR code).
  // Keep in step with BASE_URL in tools/build_qr.py.
  var LEAFLET_BASE = "omicronblade.github.io/Anaes-Doc-Repo/anaesthesia-forms/leaflets/";

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  function tick(name, text, extra) {
    return '<label class="tick"' + (extra || "") + '><input type="checkbox" name="' + name + '"><span class="box"></span><span>' + text + "</span></label>";
  }
  function circ(name, text, group) {
    return '<label class="circ"><input type="checkbox" name="' + name + '"' + (group ? ' data-group="' + group + '"' : "") + "><span>" + text + "</span></label>";
  }
  function field(label, name, style, extra) {
    return '<label class="field"' + (style ? ' style="' + style + '"' : "") + '><span class="lbl">' + label +
      '</span><input class="ln" name="' + name + '"' + (extra || "") + "></label>";
  }

  function build(cfg, f) {
    var R = window.REGIONAL, B = R.BANDS, h = "";

    // ---------- letterhead + patient sticker ----------
    h += '<header class="lh">' +
      '<div class="lh-mid"><img class="lh-crest" src="../assets/img/nsh-crest.jpg" alt="">' +
        '<div><div class="lh-hosp">New Somerset Hospital</div><div class="lh-dept">Department of Anaesthesia</div></div></div>' +
      '<div class="pt-box"><div class="pt-tag">PATIENT STICKER</div>' +
        field("Name", "pt_name") + field("Folder no.", "pt_folder") + field("Date of birth", "pt_dob") +
      "</div></header>" +
      '<div class="lh-rule"></div>';

    h += '<h1 class="doc-title">REGIONAL ANAESTHESIA CONSENT <span>— ' + esc(f.title) + "</span></h1>";

    // ---------- 1. procedure & block ----------
    h += '<h3 class="sec">1. Planned procedure &amp; block</h3>';
    h += '<div class="row">' + field("Procedure", "procedure", "flex:1") +
      '<span class="lbl">Side:</span>' + (f.sides || ["Left", "Right", "Bilateral"]).map(function (sd) {
        return circ("side_" + sd.toLowerCase().slice(0, 2), sd, "side");
      }).join("") + "</div>";

    if (f.blocks) {
      var cols = f.blocks.length > 8 ? 5 : 4;
      h += '<div class="blocks"><span class="lbl">Block(s):</span><div class="grid" style="grid-template-columns:repeat(' + cols + ',1fr)">' +
        f.blocks.map(function (b) { return tick("blk_" + b.id, esc(b.label), ' data-block="' + b.id + '"'); }).join("") +
        field("Other", "block_other", "grid-column:span " + (f.blocks.length % cols ? cols - f.blocks.length % cols : cols)) +
        '</div></div>';
    } else {
      h += '<div class="row">' + field("Block(s) planned", "block_planned", "flex:1") + "</div>";
    }

    h += '<div class="row">' +
      '<span class="lbl">Planned with:</span>' + tick("with_alone", "Block alone") + tick("with_sed", "Sedation") + tick("with_ga", "GA") + tick("with_spinal", "Spinal") +
      '<span class="gapl"></span>' + tick("site_marked", "Site marked") +
      "</div>";
    h += '<div class="row"><span class="lbl">Patient has capacity to consent:</span>' + circ("cap_y", "Yes", "cap") + circ("cap_n", "No", "cap") +
      field("If no, consent given by (name / relationship)", "cap_proxy", "flex:1") + "</div>";

    // ---------- 2. benefits (emphasised) ----------
    h += '<div class="benefits">' +
      '<h3 class="sec">2. Benefits discussed <span class="aside">why a block is recommended for this patient</span></h3>' +
      '<div class="grid2">' +
      f.benefits.map(function (b) {
        return tick(b.id, esc(b.form), b.blocks ? ' data-blocks="' + b.blocks.join(" ") + '"' : "");
      }).join("") +
      "</div>" + field("Other benefit", "b_other", "margin-top:0.6mm") + "</div>";

    // ---------- 3. risks (compact: one line per frequency group) ----------
    // Full wording and exact frequencies are in the patient leaflet.
    h += '<h3 class="sec">3. Risks discussed <span class="aside">most patients have no complications · details and figures in the patient leaflet</span></h3>';
    h += '<table class="risks"><colgroup><col class="c-t"><col class="c-b"><col></colgroup><tbody>';

    function bandRows(prefix, risks, title) {
      var out = '<tr class="sub"><th colspan="3">' + title + "</th></tr>";
      R.FORM_BANDS.forEach(function (g) {
        var items = risks.filter(function (r) { return g.bands.indexOf(r.band) !== -1; });
        if (!items.length) return;
        out += "<tr>" +
          '<td class="t">' + tick(prefix + g.key, "") + "</td>" +
          '<td class="band"><b>' + g.label + "</b> <span>(" + g.range + ")</span></td>" +
          "<td>" + items.map(function (r) {
            return "<span" + (r.blocks ? ' data-blocks="' + r.blocks.join(" ") + '"' : "") + ">" + esc(r.short) + "</span>";
          }).join('<i class="sep"> · </i>') + "</td></tr>";
      });
      return out;
    }
    h += bandRows("rg_", R.GENERAL_RISKS, "General — all nerve and plane blocks");
    if (f.risks.length) h += bandRows("rs_", f.risks, "Block-specific");
    else h += '<tr class="sub"><th colspan="3">Additional risks discussed</th></tr>';

    var n = f.extraLines || 1;
    for (var i = 1; i <= n; i++) {
      h += '<tr class="wr"><td class="t">' + tick("rx_" + i, "") + "</td>" +
        '<td colspan="2"><input name="rx_' + i + '_text" aria-label="Additional risk discussed ' + i + '"' +
        (f.extraLines ? "" : ' placeholder="Other risk discussed"') + "></td></tr>";
    }
    h += "</tbody></table>";

    // ---------- 4 & 5. alternatives | aftercare ----------
    h += '<div class="two">' +
      '<div><h3 class="sec">4. Alternatives discussed</h3><div class="list">' +
        f.alternatives.map(function (a) { return tick(a.id, esc(a.form)); }).join("") + "</div></div>" +
      '<div><h3 class="sec">5. Aftercare advised</h3><div class="list">' +
        f.aftercare.map(function (a) { return tick(a.id, esc(a.form)); }).join("") + "</div></div>" +
      "</div>";

    // ---------- 6. confirmation + QR ----------
    h += '<h3 class="sec">6. Confirmation</h3>' +
      '<div class="confirm"><div class="c-main">' +
        '<div class="row"><span class="lbl">Right to refuse explained (no effect on surgery or care):</span>' +
          circ("refuse_y", "Yes", "refuse") + circ("refuse_n", "No", "refuse") +
          '<span class="gapl"></span>' + tick("questions", "Questions answered") + "</div>" +
        '<div class="row"><span class="lbl">Patient leaflet:</span>' + circ("leaf_qr", "QR shown", null) + circ("leaf_print", "Printed copy", null) + circ("leaf_decl", "Declined", null) + "</div>" +
        '<div class="row"><span class="lbl">Interpreter:</span>' + circ("int_no", "Not needed", "int") + circ("int_yes", "Used", "int") +
          field("Language", "int_lang", "width:34mm") + field("Name", "int_name", "flex:1") + "</div>" +
        '<div class="row consent"><span class="lbl"><b>Patient gives consent for the block(s) above:</b></span>' +
          circ("consent_y", "YES", "consent") + circ("consent_n", "NO", "consent") + "</div>" +
      "</div>" +
      '<div class="qr"><img src="../assets/img/qr/' + f.leaflet + '.svg" alt="QR code to the patient information leaflet">' +
        '<div class="qr-cap"><b>Patient leaflet</b></div></div>' +
      "</div>";

    h += '<div class="sign">' +
      field("Doctor", "dr_name", "flex:1.3") + field("MP no.", "dr_mp", "flex:0.8") +
      '<div class="field" style="flex:1.2"><span class="lbl">Signature</span><span class="sigline"></span></div>' +
      "</div>" +
      '<div class="sign">' +
      '<div class="field"><span class="lbl">Date</span><input class="ln" name="date" style="width:26mm"><button type="button" class="mini-btn screen-only" data-fill-today="date">Today</button></div>' +
      '<div class="field"><span class="lbl">Time</span><input class="ln" name="time" style="width:16mm"><button type="button" class="mini-btn screen-only" data-fill-now="time">Now</button></div>' +
      '<div class="leaf-url">Patient leaflet: ' + LEAFLET_BASE + f.leaflet + ".html</div>" +
      "</div>";

    h += '<footer class="pfoot"><span>NSH Anaesthesia · Regional consent — ' + esc(f.title) + "</span>" +
      "<span>SASA/SASRA Guidelines 2016 · McCombe &amp; Bogod, Anaesthesia 2021 · frequencies approximate</span></footer>";

    return h;
  }

  // Highlight (screen only) the benefits and risks that apply to the ticked blocks
  function wireHighlights() {
    var form = $("#form");
    function update() {
      var picked = $$("input[name^='blk_']:checked", form).map(function (i) { return i.name.slice(4); });
      $$("[data-blocks]", form).forEach(function (el) {
        var ids = el.getAttribute("data-blocks").split(" ");
        el.classList.toggle("hl", picked.some(function (p) { return ids.indexOf(p) !== -1; }));
      });
    }
    form.addEventListener("change", update);
    return update;
  }

  function init(cfg) {
    var f = window.REGIONAL.FORMS[cfg.key];
    var sheet = $("#sheet");
    sheet.innerHTML = build(cfg, f);
    $("#form-version").textContent = "v" + cfg.version;
    var leafletBtn = $("#btn-leaflet");
    if (leafletBtn) leafletBtn.href = "../leaflets/" + f.leaflet + ".html";

    var update = wireHighlights();
    FormKit.init({
      id: "regional-consent-" + cfg.key,
      version: cfg.version,
      printTitle: function (get) {
        return ["Regional Consent - " + f.title, get("pt_name"), get("pt_folder")].filter(Boolean).join(" - ");
      },
      onReady: update,
      onReset: update
    });
  }

  window.RegionalConsent = { init: init };
})();
