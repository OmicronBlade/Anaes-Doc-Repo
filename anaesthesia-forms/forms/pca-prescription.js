/*
 * PCA Prescription — builds the drug mixture and orders table, then wires up
 * the checklist, drug presets and pruritus-drug options before handing over to FormKit.
 *
 * To change a preset, edit PRESETS below.
 */
(function () {
  "use strict";

  var VERSION = "1.2";

  // ---------- presets (the "PCA drugs" buttons) ----------
  // tick: drugs ticked in the Start column (all others are unticked)
  // conc: concentration written in the entry box (units are printed after the box,
  //       except Fentanyl which has no printed unit, so its value includes one)
  var PRESETS = {
    "morph-ond": { tick: ["morphine", "ondansetron"], conc: {} },
    "fent-ond":  { tick: ["fentanyl", "ondansetron"], conc: { fentanyl: "20 mcg/ml" } },
    "morph-ket": { tick: ["morphine", "ketamine", "ondansetron"], conc: {} }
  };

  var DRUGS = [
    { key: "morphine",    label: "Morphine",    std: "1 mg/ml"   },
    { key: "ondansetron", label: "Ondansetron", std: "0.2 mg/ml" },
    { key: "ketamine",    label: "Ketamine",    std: "1 mg/ml"   },
    { key: "fentanyl",    label: "Fentanyl",    std: ""          }
  ];

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function fire(el, type) { el.dispatchEvent(new Event(type, { bubbles: true })); }

  // ======================================================================
  // Start / Refilled drug mixture
  // ======================================================================
  function mixtureHtml() {
    var LABEL_Y = [144.8, 150.6, 156.3, 162.1];   // text tops, mm
    var LINE_Y  = [148.3, 154.1, 159.9, 165.6];   // entry-line bottoms, mm
    var out = "";

    function section(prefix, o) {
      var g = o.grey ? " grey" : "";
      out += '<div class="abs txt' + g + (o.grey ? " bold" : " bold") + '" style="left:' + o.xcb + 'mm;top:133.2mm">' + o.title + "</div>";
      if (o.date) {
        out += '<div class="abs dt' + g + '" style="left:' + o.date + 'mm;top:133.2mm">(' +
          '<input name="' + prefix + '_d" maxlength="2" inputmode="numeric" aria-label="Refill day"><span>/</span>' +
          '<input class="m" name="' + prefix + '_m" maxlength="2" inputmode="numeric" aria-label="Refill month"><span>/20</span>' +
          '<input name="' + prefix + '_y" maxlength="2" inputmode="numeric" aria-label="Refill year">)</div>' +
          '<button type="button" class="abs today screen-only" data-today="' + prefix + '" style="left:171.5mm;top:133.2mm">Today</button>';
      }
      // Volume
      out += '<div class="abs txt' + g + '" style="left:' + o.xcb + 'mm;top:139mm">Volume</div>' +
        '<input class="abs ul c' + g + '" name="' + prefix + '_volume" inputmode="decimal" aria-label="' + o.title + ' volume" ' +
        'style="left:' + o.xstd + 'mm;top:138.7mm;width:12.7mm">' +
        '<div class="abs txt' + g + '" style="left:' + (o.xstd + 12.9) + 'mm;top:139mm"> ml</div>';

      DRUGS.forEach(function (d, i) {
        out += '<label class="abs cb' + g + '" style="left:' + o.xcb + 'mm;top:' + LABEL_Y[i] + 'mm">' +
          '<input type="checkbox" name="' + prefix + "_" + d.key + '" data-drug="' + d.key + '" data-sect="' + prefix + '">' +
          '<span class="box"></span>' + d.label + "</label>";
        if (d.std) {
          out += '<div class="abs txt' + g + '" style="left:' + o.xstd + 'mm;top:' + (LABEL_Y[i] - 0.5) + 'mm">' + d.std + "</div>" +
            '<input class="abs ul c' + g + '" name="' + prefix + "_" + d.key + '_conc" aria-label="' + d.label + ' concentration" ' +
            'style="left:' + (o.xstd + 25.4) + "mm;top:" + (LINE_Y[i] - 4.3) + 'mm;width:12.7mm">' +
            '<div class="abs txt' + g + '" style="left:' + (o.xstd + 38.3) + "mm;top:" + (LABEL_Y[i] - 0.5) + 'mm">mg/ml</div>';
        } else {
          out += '<input class="abs ul' + g + '" name="' + prefix + "_" + d.key + '_conc" aria-label="' + d.label + ' concentration" ' +
            'style="left:' + o.xstd + "mm;top:" + (LINE_Y[i] - 4.3) + 'mm;width:25.4mm">';
        }
      });
    }

    section("start", { title: "Start", xcb: 14.6, xstd: 51.1, grey: false });
    section("refill", { title: "Refilled:", xcb: 110.4, xstd: 137.0, grey: true, date: 137.0 });

    out += '<div class="abs txt" style="left:14.6mm;top:167.4mm">Other:</div>' +
      '<input class="abs" name="start_other" aria-label="Other" style="left:25.8mm;top:167.4mm;width:76mm;height:4.7mm">';
    return out;
  }
  $("#pca-drugs").outerHTML = mixtureHtml();

  // ======================================================================
  // Orders / administration table
  // ======================================================================
  var COLS = [37.4, 82.5, 15.1, 9.9, 9.9, 9.9, 9.9, 9.7];
  var N_DATES = 5;

  function inp(name, label) { return '<input name="' + name + '" aria-label="' + label + '">'; }

  function gridCells(blk, r, rowSpanNote) {
    var h = '<td class="g tl">' + inp(blk + "_" + r + "_t", "Time") + "</td>";
    for (var c = 1; c <= N_DATES; c++) {
      h += '<td class="g' + (c === 1 ? " tl" : "") + (c === N_DATES ? " tr" : "") + '">' +
        inp(blk + "_" + r + "_c" + c, "Given, date " + c) + "</td>";
    }
    return h;
  }

  function buildTable() {
    var t = $("#chart");
    var h = "<colgroup>" + COLS.map(function (w) { return '<col style="width:' + w + 'mm">'; }).join("") + "</colgroup>";

    // header
    h += '<tr class="hdr"><td class="tx tl">Drug</td><td class="tx tl">Prescription</td><td class="tx tl">Time ↓</td>';
    for (var c = 1; c <= N_DATES; c++) {
      h += '<td class="g dh' + (c === 1 ? " tl" : "") + (c === N_DATES ? " tr" : "") + '">' + inp("date_col_" + c, "Date " + c) + "</td>";
    }
    h += "</tr>";

    // Naloxone — 5 rows
    var nal = {
      label: 'Naloxone<br><span class="sub">(Respiratory Depression)</span>',
      presc: '100 micrograms IV / IM<div class="gap">At 1 minute intervals (IV) until respiratory rate 12 and<br>' +
             'above and AVPU score A or V (if no IV access give 400<br>micrograms IM)</div>',
      rows: 5
    };
    // Ondansetron — 4 rows
    var ond = { label: 'Ondansetron<br><span class="sub">(N&amp;V)</span>', presc: "4 mg IV/IM/PO PRN/8 hourly; Duration of PCA", rows: 4 };

    [["nal", nal], ["ond", ond]].forEach(function (b) {
      var blk = b[0], d = b[1];
      for (var r = 1; r <= d.rows; r++) {
        h += '<tr class="' + (r === 1 ? "first" : "") + '">';
        if (r === 1) {
          h += '<td class="tx tl" rowspan="' + d.rows + '">' + d.label + "</td>" +
               '<td class="tx tl" rowspan="' + d.rows + '">' + d.presc + "</td>";
        }
        h += gridCells(blk, r) + "</tr>";
      }
    });

    // Pruritus — 5 rows; presc cell(s) depend on the chosen mode
    var labels =
      '<div class="lab-both">Chlorpheniramine<br>OR<br>Cetirizine (Circle)<br><span class="sub">(Pruritus)</span></div>' +
      '<div class="lab-chlor">Chlorpheniramine<br><span class="sub">(Pruritus)</span></div>' +
      '<div class="lab-cet">Cetirizine<br><span class="sub">(Pruritus)</span></div>';
    for (var r = 1; r <= 5; r++) {
      h += '<tr class="' + (r === 1 ? "first " : "") + (r === 4 ? "pr4 " : "") + (r === 5 ? "last" : "") + '" id="pr' + r + '">';
      if (r === 1) {
        h += '<td class="tx tl tb" rowspan="5">' + labels + "</td>" +
             '<td class="tx tl tb presA" rowspan="3">Chlorpheniramine 4 mg PO PRN/8 hourly;<br>Duration of PCA</td>';
      }
      if (r === 4) {
        h += '<td class="tx tl tb presB" rowspan="2">Cetirizine 10 mg PO Daily; Duration of PCA</td>';
      }
      h += gridCells("pru", r) + "</tr>";
    }
    t.innerHTML = h;
  }
  buildTable();

  // ---------- pruritus mode: both / chlor / cet ----------
  var table = $("#chart");
  var modeInput = $('[name="pruritus_mode"]');

  function applyMode(mode) {
    if (["both", "chlor", "cet"].indexOf(mode) < 0) mode = "both";
    var A = $(".presA", table), B = $(".presB", table), pr1 = $("#pr1"), pr4 = $("#pr4");
    table.setAttribute("data-mode", mode);

    if (mode === "both") {
      A.rowSpan = 3; B.rowSpan = 2;
      pr4.insertBefore(B, pr4.firstChild);
    } else if (mode === "chlor") {
      A.rowSpan = 5;
    } else {
      B.rowSpan = 5;
      pr1.insertBefore(B, A.nextSibling);
    }
    $$(".seg button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.mode === mode)); });
  }

  $$(".seg button").forEach(function (b) {
    b.addEventListener("click", function () {
      modeInput.value = b.dataset.mode;
      applyMode(b.dataset.mode);
      fire(modeInput, "change");
    });
  });

  // ======================================================================
  // Today buttons: fill dd / mm / 20yy
  // ======================================================================
  $$("[data-today]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var now = new Date(), p = btn.dataset.today;
      var vals = {
        d: String(now.getDate()).padStart(2, "0"),
        m: String(now.getMonth() + 1).padStart(2, "0"),
        y: String(now.getFullYear()).slice(2)
      };
      ["d", "m", "y"].forEach(function (k) {
        var f = $('[name="' + p + "_" + k + '"]');
        f.value = vals[k];
        fire(f, "input");
      });
    });
  });

  // ======================================================================
  // Checklist: Check all
  // ======================================================================
  var checks = $$("input[data-check]");
  var checkAll = $("#btn-checkall");

  function updateCheckAll() {
    var all = checks.every(function (c) { return c.checked; });
    checkAll.textContent = all ? "Uncheck all" : "Check all";
  }
  checkAll.addEventListener("click", function () {
    var all = checks.every(function (c) { return c.checked; });
    checks.forEach(function (c) { if (c.checked === all) { c.checked = !all; fire(c, "change"); } });
    updateCheckAll();
  });

  // ======================================================================
  // Drug presets
  // ======================================================================
  function startBox(key) { return $('[name="start_' + key + '"]'); }
  function startConc(key) { return $('[name="start_' + key + '_conc"]'); }

  function applyPreset(id) {
    var p = PRESETS[id];
    DRUGS.forEach(function (d) {
      var on = p.tick.indexOf(d.key) >= 0, cb = startBox(d.key), conc = startConc(d.key);
      if (cb.checked !== on) { cb.checked = on; fire(cb, "change"); }
      var want = on ? (p.conc[d.key] != null ? p.conc[d.key] : conc.value) : "";
      if (conc.value !== want) { conc.value = want; fire(conc, "input"); }
    });
    FormKit.toast($('[data-preset="' + id + '"]').textContent + " selected");
  }

  function updatePresetState() {
    $$("[data-preset]").forEach(function (b) {
      var p = PRESETS[b.dataset.preset];
      var match = DRUGS.every(function (d) {
        return startBox(d.key).checked === (p.tick.indexOf(d.key) >= 0) &&
          (p.conc[d.key] == null || startConc(d.key).value === p.conc[d.key]);
      });
      b.classList.toggle("is-active", match);
    });
  }

  $$("[data-preset]").forEach(function (b) {
    b.addEventListener("click", function () { applyPreset(b.dataset.preset); updatePresetState(); });
  });

  $("#form").addEventListener("change", function () { updateCheckAll(); updatePresetState(); });
  $("#form").addEventListener("input", updatePresetState);

  function refresh() { applyMode(modeInput.value); updateCheckAll(); updatePresetState(); }
  applyMode("both");

  // ======================================================================
  FormKit.init({
    id: "pca-prescription",
    version: VERSION,
    onReady: refresh,
    onReset: refresh,
    printTitle: function (get) {
      var parts = ["PCA Prescription"];
      if (get("pt_name")) parts.push(get("pt_name"));
      if (get("pt_folder")) parts.push(get("pt_folder"));
      return parts.join(" - ");
    }
  });
  $("#form-version").textContent = "v" + VERSION;
})();
