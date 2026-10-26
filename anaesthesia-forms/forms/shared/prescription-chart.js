/*
 * PrescriptionChart — builds the NSH two-page prescription chart
 * (doctor's instructions + pre-med/stat doses, then the regular medication chart)
 * and hands over to FormKit for drafts, printing and autofill.
 *
 *   PrescriptionChart.init({
 *     id:              "cs-prescription",   // draft storage key
 *     version:         "1.0",
 *     printPrefix:     "CS Prescription",   // PDF file name prefix
 *     instructionRows: 22,                  // page 1 doctor's instructions lines
 *     premedRows:      7,                   // page 1 stat dose lines (fill to the page bottom)
 *     standard: {                           // values the Autofill button fills in
 *       instructions: ["line 1", ...],
 *       premed:  [{ drug, dose, route }],
 *       regular: [{ name, dose, route, freq, period }]
 *     },
 *     suggestions: { drugs: [...], routes: [...] }  // optional; defaults below
 *   });
 */
(function () {
  "use strict";

  var DEFAULT_SUGGESTIONS = {
    drugs: ["Paracetamol", "Ibuprofen", "Morphine", "Ondansetron", "Clexane", "Lactulose"],
    routes: ["PO", "IMI", "IV", "IV/IM", "PR", "S/C"]
  };

  // Page 1 geometry (mm), measured from the original
  var INSTR_TOP = 113.8;
  var ROW_H = 4.91;
  var MED_BLOCKS = 7;
  var DATE_COLS = 14;
  var ROWS_PER_BLOCK = 6;

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  function inp(name, cls, label, attrs) {
    return '<input name="' + name + '"' + (cls ? ' class="' + cls + '"' : "") +
      (label ? ' aria-label="' + label + '"' : "") + (attrs || "") + ">";
  }

  var DRUG = ' list="rx-drugs"';
  var ROUTE = ' list="rx-routes"';

  function datalist(id, values) {
    var dl = document.createElement("datalist");
    dl.id = id;
    dl.innerHTML = values.map(function (v) { return '<option value="' + esc(v) + '"></option>'; }).join("");
    document.body.appendChild(dl);
  }

  function buildInstructions(rows) {
    var h = "";
    for (var i = 1; i <= rows; i++) {
      h += "<tr>" +
        "<td>" + inp("instr_" + i + "_dt", "", "Instruction " + i + " date/time") + "</td>" +
        "<td>" + inp("instr_" + i + "_text", "", "Instruction " + i) + "</td>" +
        "<td>" + inp("instr_" + i + "_sig", "", "Instruction " + i + " signature") + "</td>" +
        "</tr>";
    }
    document.getElementById("instr-body").innerHTML = h;
  }

  function buildPremed(rows) {
    var COLS = ["date", "drug", "dose", "route", "time", "sig", "pharm", "giv_time", "giv_sig"];
    var h = "";
    for (var i = 1; i <= rows; i++) {
      h += "<tr>" + COLS.map(function (c) {
        var attrs = c === "drug" ? DRUG : c === "route" ? ROUTE : "";
        return "<td>" + inp("premed_" + i + "_" + c, c === "drug" ? "drug" : "", "Stat dose " + i + " " + c, attrs) + "</td>";
      }).join("") + "</tr>";
    }
    document.getElementById("premed-body").innerHTML = h;
  }

  // Pre-med title, year and table sit a fixed distance below the instructions
  function positionPremed(instructionRows) {
    var end = INSTR_TOP + (instructionRows + 1) * ROW_H;   // +1 for the header row
    var set = function (sel, top) {
      var el = document.querySelector(sel);
      if (el) el.style.top = top.toFixed(2) + "mm";
    };
    set(".rx .premed-title", end + 4.3);
    set(".rx .year-p1", end + 7.6);
    set(".rx .premed", end + 12.5);
  }

  function buildChart() {
    var colW = [42.3, 17.8, 15.0, 19.9];
    var cg = "<colgroup>" + colW.map(function (w) { return '<col style="width:' + w + 'mm">'; }).join("");
    for (var c = 0; c < DATE_COLS; c++) cg += "<col>";
    cg += "</colgroup>";

    var hdr = '<tr class="hdr"><td class="yr" colspan="3"></td>' +
      '<td class="diag"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
      '<line x1="0" y1="0" x2="100" y2="100" stroke="#000" stroke-width="0.7" vector-effect="non-scaling-stroke"/></svg>' +
      '<span class="d">Date</span><span class="t">Time</span></td>';
    for (c = 1; c <= DATE_COLS; c++) {
      hdr += '<td class="dh' + (c === DATE_COLS ? " tk-r" : "") + '">' + inp("chart_date_" + c, "", "Date column " + c) + "</td>";
    }
    hdr += "</tr>";

    function lab(text, name, extra, attrs, inputAttrs) {
      return '<td class="lab ' + (extra || "") + '" rowspan="2"' + (attrs || "") + ">" +
        '<div class="lbl">' + text + "</div>" + inp(name, "", text.toLowerCase(), inputAttrs) + "</td>";
    }

    var body = "";
    for (var b = 1; b <= MED_BLOCKS; b++) {
      for (var r = 1; r <= ROWS_PER_BLOCK; r++) {
        var top = r === 1 ? " tk-t" : "";
        var bot = (b === MED_BLOCKS && r === ROWS_PER_BLOCK) ? " tk-b" : "";
        var bot2 = (b === MED_BLOCKS && r >= ROWS_PER_BLOCK - 1) ? " tk-b" : "";
        var p = "med_" + b + "_";
        var row = '<tr class="row">';

        if (r === 1) {
          row += lab("MEDICINE APPROVED NAME", p + "name", "tk-l" + top, "", DRUG) +
                 lab("DOSE", p + "dose", top) +
                 lab("ROUTE", p + "route", top, "", ROUTE);
        } else if (r === 3) {
          row += lab("FREQUENCY", p + "freq", "tk-l") +
                 lab("DATE", p + "date") +
                 lab("PERIOD", p + "period");
        } else if (r === 5) {
          row += lab("DRs SIGNATURE AND NAME", p + "sig", "tk-l" + bot2) +
                 lab("PHARMACY", p + "pharm", bot2, ' colspan="2"');
        }

        row += '<td class="tc' + top + bot + '">' + inp(p + "t" + r, "", "Medicine " + b + " time " + r) + "</td>";
        for (c = 1; c <= DATE_COLS; c++) {
          row += '<td class="gc' + top + bot + (c === DATE_COLS ? " tk-r" : "") + '">' +
            inp(p + "r" + r + "_c" + c, "", "Medicine " + b + " time " + r + " date " + c) + "</td>";
        }
        body += row + "</tr>";
      }
    }
    document.getElementById("chart").innerHTML = cg + hdr + body;
  }

  function autofillMap(std) {
    var map = {};
    (std.instructions || []).forEach(function (text, k) { if (text) map["instr_" + (k + 1) + "_text"] = text; });
    (std.premed || []).forEach(function (d, k) {
      var p = "premed_" + (k + 1) + "_";
      ["drug", "dose", "route"].forEach(function (f) { if (d[f]) map[p + f] = d[f]; });
    });
    (std.regular || []).forEach(function (d, k) {
      var p = "med_" + (k + 1) + "_";
      // blanks (e.g. Clexane dose) are left for the prescriber
      ["name", "dose", "route", "freq", "period"].forEach(function (f) { if (d[f]) map[p + f] = d[f]; });
    });
    return map;
  }

  function init(cfg) {
    var sug = cfg.suggestions || {};
    datalist("rx-drugs", sug.drugs || DEFAULT_SUGGESTIONS.drugs);
    datalist("rx-routes", sug.routes || DEFAULT_SUGGESTIONS.routes);

    buildInstructions(cfg.instructionRows);
    buildPremed(cfg.premedRows);
    positionPremed(cfg.instructionRows);
    buildChart();

    var v = document.getElementById("form-version");
    if (v) v.textContent = "v" + cfg.version;

    FormKit.init({
      id: cfg.id,
      version: cfg.version,
      autofill: autofillMap(cfg.standard || {}),
      printTitle: function (get) {
        var parts = [cfg.printPrefix];
        if (get("pt_name")) parts.push(get("pt_name"));
        if (get("pt_folder")) parts.push(get("pt_folder"));
        return parts.join(" - ");
      }
    });
  }

  window.PrescriptionChart = { init: init };
})();
