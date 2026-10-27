/*
 * Patient Safety Incident (PSI) Reporting Form — builds the four A4-landscape pages
 * (Section A notification, Section B staff statements, Section C investigation)
 * from the WCG "Patient Safety Incident Reporting Form" (docx), then hands over to FormKit.
 *
 * Column widths are taken from the original (in px at 80 dpi across a 785 px table)
 * and converted to percentages, so the proportions match the Word form.
 *
 * "Mark with an X" cells: click to mark. Cells sharing a group allow one choice only.
 * Extra staff statements: toolbar "Add statement" (count kept in the hidden "statements" field).
 */
(function () {
  "use strict";

  var VERSION = "1.0";
  var FORM_ID = "psi-report";
  var STATEMENT_LINES = { first: 16, extra: 27 };

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ---------- building blocks ----------
  function cols(px) {
    var total = px.reduce(function (a, b) { return a + b; }, 0);
    return "<colgroup>" + px.map(function (p) { return '<col style="width:' + (p / total * 100).toFixed(3) + '%">'; }).join("") + "</colgroup>";
  }
  function table(px, rows, cls, style) {
    return '<table class="blk' + (cls ? " " + cls : "") + '"' + (style ? ' style="' + style + '"' : "") + ">" + cols(px) + "<tbody>" + rows + "</tbody></table>";
  }
  // green header cell
  // extra may carry class="g …" (replaces the default class) and/or other attributes
  function hd(text, span, extra) {
    extra = extra || "";
    var cls = /class="/.test(extra) ? "" : ' class="g"';
    return "<th" + cls + (span > 1 ? ' colspan="' + span + '"' : "") + extra + ">" + text + "</th>";
  }
  // "Mark with an X" cell (uses FormKit's td.circle-cell click handling; drawn as an X)
  function xc(name, label, group, extra) {
    var plain = String(label).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return '<td class="circle-cell x"' + (extra || "") + '><input type="checkbox" name="' + name + '"' +
      (group ? ' data-group="' + group + '"' : "") + ' aria-label="' + esc(plain) + '">' + label + "</td>";
  }
  function inp(name, label, extra) {
    return '<td class="in"' + (extra || "") + '><input name="' + name + '" aria-label="' + esc(label) + '"></td>';
  }
  function today(name) { return '<button type="button" class="mini-btn screen-only" data-fill-today="' + name + '">Today</button>'; }
  function now(name) { return '<button type="button" class="mini-btn screen-only" data-fill-now="' + name + '">Now</button>'; }
  function dateIn(name, label, extra) {
    return '<td class="in dt"' + (extra || "") + '><input name="' + name + '" aria-label="' + esc(label) + '" placeholder="dd/mm/yyyy">' + today(name) + "</td>";
  }
  // ruled multi-line box spanning a full-width row
  function lines(name, label, n) {
    var r = "";
    for (var i = 0; i < n; i++) r += '<span class="rule"></span>';
    return '<tr><td class="lines" colspan="99"><div class="lined" style="--rows:' + n + '">' + r +
      '<textarea name="' + name + '" aria-label="' + esc(label) + '"></textarea></div></td></tr>';
  }
  function compiled(prefix, cls) {
    return table([227, 168, 240, 150],
      '<tr class="compiled' + (cls ? " " + cls : "") + '">' +
      '<td><span class="lbl">Compiled by:</span><input name="' + prefix + '_by" aria-label="Compiled by"></td>' +
      '<td><span class="lbl">Designation:</span><input name="' + prefix + '_desig" aria-label="Designation"></td>' +
      '<td><span class="lbl">Signature:</span></td>' +
      '<td><span class="lbl">Date:</span><input name="' + prefix + '_date" aria-label="Date">' + today(prefix + "_date") + "</td></tr>");
  }
  function page(inner, cls) {
    return '<section class="sheet landscape' + (cls ? " " + cls : "") + '"><div class="body">' + inner + '</div><div class="pno">Page | <span></span></div></section>';
  }

  // =====================================================================
  // PAGE 1 — Section A
  // =====================================================================
  function page1() {
    var h = "";
    h += '<div class="title-row"><h1>Patient Safety Incident Reporting Form</h1>' +
      '<div class="facility"><span>FACILITY:</span><input name="facility" value="New Somerset Hospital" aria-label="Facility"></div></div>';
    h += '<div class="intro">' +
      "<p><b><u>Section A</u></b> (notification) - to be completed by manager of section where incident took place. Submit section A and B to next level for notification for SAC 1 incidents</p>" +
      "<p><b><u>Section B</u></b>(Statement by staff, patient or significant other)– to be completed by staff, patients or significant other that were directly involved while the incident took place</p>" +
      "<p><b><u>Section C</u></b>(investigation) - to be completed by investigator(s) of the incident, in most cases this would be the manager(s) of section where the incident took place</p></div>";
    h += '<div class="sec-row"><h2>SECTION A - Notification</h2><div class="ref-box"><span class="g"></span><span></span></div></div>';

    // 1. Type of PSI (half width)
    h += table([140, 77, 153],
      "<tr>" + hd("1. Type of patient safety incident (PSI): Mark with an X", 3) + "</tr>" +
      "<tr>" + xc("type_noharm", "No harm", "type") + xc("type_nearmiss", "Near miss", "type") + xc("type_harmful", "Harmful (Adverse Event)", "type") + "</tr>",
      "", "width:" + (370 / 785 * 100).toFixed(3) + "%");

    // 2. Patient information | 3. Staff involved
    var pt = [["pt_name", "Patient name and surname"], ["pt_file", "Patient file number"], ["pt_location", "Location (department/ward)"],
              ["pt_age", "Age"], ["pt_gender", "Gender"], ["pt_diagnosis", "Final diagnosis"]];
    var rows = "<tr>" + hd("2. Patient information", 2, ' class="g ind"') + hd("3.&nbsp; Staff involved", 3, ' class="g ind"') + "</tr>";
    pt.forEach(function (p, i) {
      rows += '<tr class="r">' + "<td>" + p[1] + "</td>" + inp(p[0], p[1]);
      if (i === 0) rows += "<td>Name and surname</td><td>Contact detail</td><td>Department</td>";
      else rows += inp("staff" + i + "_name", "Staff " + i + " name and surname") + inp("staff" + i + "_contact", "Staff " + i + " contact detail") + inp("staff" + i + "_dept", "Staff " + i + " department");
      rows += "</tr>";
    });
    h += table([195, 173, 144, 138, 135], rows);

    // 4. Date | 5. Time
    h += table([140, 228, 99, 318],
      '<tr class="r">' + hd("4. Date of PSI", 1) + dateIn("psi_date", "Date of PSI") +
      hd("5. Time of PSI", 1) + '<td class="in dt"><input name="psi_time" aria-label="Time of PSI">' + now("psi_time") + "</td></tr>");

    // 6. SAC | 7. Date reported | 8. Days
    h += table([140, 40, 37, 41, 147, 135, 158, 87],
      "<tr>" + hd("6. SAC rating: Mark with an X", 1) +
      xc("sac_1", "1", "sac", ' style="background:#ff0000"') + xc("sac_2", "2", "sac", ' style="background:#ffc000"') + xc("sac_3", "3", "sac", ' style="background:#ffff00"') +
      '<td class="b">7. Date reported to next level if SAC = 1</td>' + dateIn("reported_date", "Date reported to next level") +
      '<td class="b c">8. No of days to report<br>PSI with SAC = 1</td>' + inp("report_days", "Number of days to report", ' data-days="psi_date reported_date"') + "</tr>",
      "sac");

    // 9. Method of detecting
    var M = [["det_hp", "Reported by health professional"], ["det_research", "Research studies"], ["det_surveys", "Surveys on patient experience of care"],
             ["det_inpatient", "Inpatient medical review"], ["det_review", "Review of record on follow-up"]];
    var mrow1 = "<tr>" + hd("9. Method of detecting PSI: Mark with an X", 1, ' rowspan="2"');
    M.forEach(function (m) { mrow1 += xc(m[0], m[1], null, ' rowspan="2"'); });
    mrow1 += '<td colspan="3" class="c ext">External sources</td>' +
      xc("det_walk", "Safety walk rounds", null, ' rowspan="2"') + xc("det_teams", "Focused teams", null, ' rowspan="2"') + xc("det_data", "Use of data", null, ' rowspan="2"') + "</tr>";
    var mrow2 = "<tr>" + xc("det_complaints", "Complaints") + xc("det_media", "Media") + xc("det_public", "Public") + "</tr>";
    h += table([140, 77, 61, 73, 55, 71, 71, 47, 48, 47, 55, 40], mrow1 + mrow2, "method");

    // 10. Short description
    h += table([785], "<tr>" + hd("10.&nbsp; Short description of Patient Safety Incident&nbsp; (detailed information available under section B as reported by staff)", 1) + "</tr>" +
      lines("description", "Short description of the patient safety incident", 7));
    return page(h, "p-a");
  }

  // =====================================================================
  // PAGE 2 — Section A (cont.) + Section B statement 1
  // =====================================================================
  function page2() {
    var h = "";
    h += table([785], "<tr>" + hd("11.&nbsp; Immediate resulting action taken to minimise harm", 1) + "</tr>" + lines("immediate_action", "Immediate resulting action taken to minimise harm", 5) +
      "<tr>" + hd("12.&nbsp; Short description of initial disclosure", 1) + "</tr>" + lines("initial_disclosure", "Short description of initial disclosure", 5));
    h += compiled("a", "tint");
    h += '<h2 class="sec-b">SECTION B- Statement by staff</h2>';
    h += table([785], "<tr>" + hd("1.&nbsp; Statement by staff: (Add sections for additional statements and information as needed)", 1) + "</tr>" +
      '<tr><td class="b">Statement 1:</td></tr>' + lines("statement1", "Statement 1", STATEMENT_LINES.first));
    h += compiled("st1");
    return page(h, "p-b");
  }

  // Extra statement pages (Statement 2, 3, …)
  function statementPage(n) {
    var h = '<h2 class="sec-b first">SECTION B- Statement by staff (continued)</h2>';
    h += table([785], '<tr><td class="b">Statement ' + n + ":</td></tr>" + lines("statement" + n, "Statement " + n, STATEMENT_LINES.extra));
    h += compiled("st" + n);
    return page(h, "p-st").replace('<section class="sheet', '<section data-statement="' + n + '" class="sheet');
  }

  // =====================================================================
  // PAGE 3 — Section C: category + contributing factors
  // =====================================================================
  function page3() {
    var h = '<h2 class="sec-c">SECTION C - Investigation</h2>';
    var G = "cat";   // "mark appropriate one" → one choice across all categories
    function it(key, label) { return xc("cat_" + key, label, G); }
    function sub(label) { return '<th class="g sub">' + label + "</th>"; }
    var c2 = [["notperf", "Not performed when indicated"], ["wrongpt", "Performed on wrong patient"], ["wrongproc", "Wrong process/ procedure/ treatment performed"],
              ["foreign", "Retention of foreign object"], ["pressure", "Pressure ulcers acquired during admission"], ["wrongsite", "Performed on wrong&nbsp; body part/ site/side"],
              ["maternal", "Maternal death"], ["neonatal", "Neonatal death"], ["stillborn", "Fresh still born"]];
    var c3 = [["clabsi", "Central line associated Blood Stream Infection"], ["pli", "Peripheral Line Infection"], ["ssi", "Surgical site"],
              ["hap", "Hospital acquired pneumonia"], ["vap", "Ventilator associated pneumonia"], ["cauti", "Catheter associated urinary tract infection"],
              ["communicable", "Communicable diseases"]];
    var c4 = [["dispensing", "Wrong dispensing"], ["omitted", "Omitted medicine or dose"], ["notavail", "Medicine not available"], ["adr", "Adverse drug reaction"],
              ["wrongmed", "Wrong medicine"], ["medwrongpt", "Wrong patient"], ["freq", "Wrong frequency"], ["route", "Wrong route"],
              ["rxerror", "Prescription error"], ["dose", "Wrong dose/ strength administered"]];
    var c5 = [["atr", "Acute transfusion reactions"], ["dtr", "Delayed transfusion reactions/ events (including Transfusion Transmitted Infections)"],
              ["wrongblood", "Errors- wrong blood/ blood products"], ["#", "7. Behaviour"], ["suicide", "Suicide"], ["attsuicide", "Attempted suicide"],
              ["selfinj", "Self inflicted injury"], ["sa_staff", "Sexual assault by staff member"], ["sa_pt", "Sexual assault by fellow patient or visitor"],
              ["pa_staff", "Physical assault by staff member"], ["pa_pt", "Physical assault by fellow patient or visitor"],
              ["abuse_pt", "Exploitation, abuse, neglect or degrading treatment by fellow patient or visitor"],
              ["abuse_staff", "Exploitation, abuse, neglect or degrading treatment by staff member"], ["wander", "Wandering/ abscond"], ["refusal", "Refusal of treatment"]];
    var c6 = [["dev_avail", "Lack of availability"], ["dev_fail", "Failure / malfunction"], ["#", "8. Patient Accidents"], ["falls", "Falls"],
              ["#", "9. Infrastructure/ Buildings/ Fixtures"], ["infra_none", "Non-Existent/ inadequate"], ["infra_damaged", "Damaged/ faulty/ worn"],
              ["#", "10. Other"], ["other", "Any other incident that does not fit into categories 1 to 9"]];
    var N = 15, rows = "";
    function cell(list, i, blankFrom) {
      if (i < list.length) return list[i][0] === "#" ? sub(list[i][1]) : it(list[i][0], list[i][1]);
      if (blankFrom === "rows") return "<td></td>";
      return i === list.length ? '<td rowspan="' + (N - list.length) + '"></td>' : "";
    }
    for (var i = 0; i < N; i++) {
      rows += "<tr>";
      if (i === 0) rows += xc("cat_consent", "Medical procedure performed without valid consent", G, ' rowspan="' + N + '"');
      rows += cell(c2, i) + cell(c3, i) + cell(c4, i) + cell(c5, i) + cell(c6, i, "rows") + "</tr>";
    }
    h += table([55, 135, 125, 105, 195, 170],
      "<tr>" + hd("1.&nbsp;&nbsp;&nbsp; Category according to type – mark appropriate one with an X", 6, ' class="g big"') + "</tr>" +
      '<tr class="cat-h">' + hd("1.Clinical admini-stration", 1) + hd("2.&nbsp;&nbsp; Clinical process/ procedure", 1) + hd("3. Health care-associated infections", 1) +
      hd("4. Medication /<br>&nbsp;IV fluids", 1) + hd("5. Blood and blood products", 1) + hd("6. Medical device", 1) + "</tr>" + rows, "cat");

    h += table([785], "<tr>" + hd("2.&nbsp;&nbsp;&nbsp; Framework for root cause analysis and implementation of action plans", 1, ' class="g big"') + "</tr>" +
      "<tr>" + hd("a.&nbsp; Contributing factors – Mark with an X", 1, ' class="g big ind2"') + "</tr>");
    var F = [
      ["1. Staff", [60, 82, 68, 90, 144, 193], [["s_cog", "Cognitive"], ["s_perf", "Performance"], ["s_beh", "Behaviour"], ["s_comm", "Communication"], ["s_path", "Patho-Physiological/ Disease"], null]],
      ["2. Patient", [60, 82, 85, 150, 67, 193], [["p_cog", "Cognitive"], ["p_beh", "Behaviour"], ["p_comm", "Communication"], ["p_path", "Patho-Physiological/ disease"], ["p_emo", "Emotional"], ["p_soc", "Social"]]],
      ["3. Work/environment", [77, 75, 70, 75, 90, 140, 110], [["w_phys", "Physical environmental / infrastructure"], ["w_remote", "Remote/ long distance from service"], ["w_equip", "Equipment"],
        ["w_cons", "Consumables"], ["w_env", "Environmental risk"], ["w_code", "Current Code/ specifications/ regulations"], ["w_sec", "Security/safety"]]],
      ["4. Organisational/service", [182, 100, 165, 95, 95], [["o_prot", "Protocols/policies/procedures"], ["o_proc", "Processes"], ["o_mgmt", "Organisational management/decisions/culture"],
        ["o_teams", "Organisation of teams"], ["o_staff", "Staff establishment"]]],
      ["5. External", [169, 233, 235], [["e_nat", "Natural Environment"], ["e_equip", "Equipment, Products,"], ["e_serv", "Services, systems and policies"]]]
    ];
    F.forEach(function (f) {
      h += table([148].concat(f[1]), '<tr><td class="b">' + f[0] + "</td>" + f[2].map(function (o) {
        return o ? xc("cf_" + o[0], o[1]) : "<td></td>";
      }).join("") + "</tr>", "cf");
    });
    h += table([148, 637], '<tr><td class="b">6. Other</td>' + inp("cf_other", "Other contributing factor") + "</tr>", "cf");
    return page(h, "p-c");
  }

  // =====================================================================
  // PAGE 4 — Section C: RCA, findings, conclusion, closure
  // =====================================================================
  function page4() {
    var h = "", r = "";
    for (var i = 1; i <= 5; i++) {
      r += '<tr class="r">' + inp("rca" + i + "_factor", "Contributing factor " + i) + inp("rca" + i + "_describe", "Factor " + i + " description") +
        inp("rca" + i + "_action", "Factor " + i + " action plan") + inp("rca" + i + "_person", "Factor " + i + " person responsible") +
        inp("rca" + i + "_date", "Factor " + i + " date for implementation") + "</tr>";
    }
    h += table([135, 257, 125, 173, 95],
      "<tr>" + hd("b.&nbsp; Root cause analysis", 5, ' class="g big ind2"') + "</tr>" +
      '<tr class="rca-h">' + hd("Contributing factor", 1) + hd("Describe the factor that contributed to the event", 1) +
      hd("Describe the action plan to rectified the identified problem", 1) + hd("Person responsible for implementing the action plan", 1) + hd("Date for implementation", 1) + "</tr>" + r);

    h += table([785], "<tr>" + hd("3.&nbsp; Findings and recommendations by Patient Safety Committee", 1) + "</tr>" + lines("findings", "Findings and recommendations by Patient Safety Committee", 5));
    h += table([340, 65, 90, 290],
      "<tr>" + hd("4.&nbsp; Conclusion", 4) + "</tr>" +
      "<tr><td>Type of behaviour according to Just Culture: mark with a X</td>" + xc("jc_noerror", "<b>No error</b>", "jc") + xc("jc_human", "<b>Human error</b>", "jc") + "<td></td></tr>" +
      lines("conclusion", "Conclusion", 4));
    h += table([785], "<tr>" + hd("5.&nbsp; Summary of final disclosure to patient/family", 1) + "</tr>" + lines("final_disclosure", "Summary of final disclosure to patient/family", 5));

    h += table([118, 100, 112, 45, 125, 85, 75, 125],
      "<tr>" + hd("6.&nbsp; Date of closure of PSI case", 1) + dateIn("closure_date", "Date of closure of PSI case") +
      hd("7.&nbsp; No days to close PSI case", 1) + inp("close_days", "Number of days to close PSI case", ' data-days="psi_date closure_date"') +
      hd("8.&nbsp; Type of closure: mark with an X", 1) +
      xc("cl_concluded", "<b>PSI case concluded</b>", "closure") + xc("cl_litigation", "<b>Litigation</b>", "closure") + xc("cl_labour", "<b>Referred to labour relations</b>", "closure") + "</tr>", "closing");
    h += table([405, 60, 67, 73, 70, 110],
      "<tr>" + hd("9.&nbsp;&nbsp; Patient outcome according to degree of harm: Mark with an X", 1) +
      xc("harm_none", "None", "harm") + xc("harm_mild", "Mild", "harm") + xc("harm_moderate", "Moderate", "harm") + xc("harm_severe", "Severe", "harm") + xc("harm_death", "Death", "harm") + "</tr>");
    h += table([187, 86, 172, 65, 70, 73, 85, 47],
      "<tr>" + hd("10. Organisational outcome:<br>Mark with an X", 1) +
      xc("org_property", "Property damage") + xc("org_resources", "Increase in required resource allocation for patient") + xc("org_media", "Media attention") +
      xc("org_complaint", "Formal complaint") + xc("org_reputation", "Damaged reputation") + xc("org_legal", "Legal ramifications") + xc("org_other", "Other") + "</tr>", "org");
    h += compiled("c", "tall");
    return page(h, "p-d");
  }

  // ---------- extra statements ----------
  function savedStatementCount() {
    try {
      var d = JSON.parse(localStorage.getItem("anaesthesia-forms:draft:" + FORM_ID));
      var n = d && d.data && parseInt(d.data.statements, 10);
      return n > 1 ? Math.min(n, 20) : 1;
    } catch (e) { return 1; }
  }
  function countField() { return $('input[name="statements"]'); }
  function statementCount() { return $$("section[data-statement]").length + 1; }
  function addStatement(silent) {
    var n = statementCount() + 1;
    var last = $$("section[data-statement]").pop() || $("section.p-b");
    last.insertAdjacentHTML("afterend", statementPage(n));
    countField().value = String(n);
    numberPages();
    if (!silent) {
      countField().dispatchEvent(new Event("input", { bubbles: true }));
      var sec = $('section[data-statement="' + n + '"]');
      sec.scrollIntoView({ behavior: "smooth", block: "start" });
      FormKit.toast("Statement " + n + " added");
    }
  }
  function removeStatement() {
    var sec = $$("section[data-statement]").pop();
    if (!sec) { FormKit.toast("Statement 1 is part of the form and can’t be removed"); return; }
    var filled = $$("input, textarea", sec).some(function (f) { return f.value.trim() !== ""; });
    if (filled && !confirm("Remove Statement " + sec.getAttribute("data-statement") + " and everything written in it?")) return;
    sec.remove();
    countField().value = String(statementCount());
    countField().dispatchEvent(new Event("input", { bubbles: true }));
    numberPages();
    FormKit.toast("Statement removed");
  }
  function numberPages() {
    $$(".sheet .pno span").forEach(function (s, i) { s.textContent = i + 1; });
    var b = $("#btn-remove-statement");
    if (b) b.disabled = statementCount() < 2;
  }

  // ---------- days between dates (fields with data-days="from to") ----------
  function parseDate(s) {
    var m = String(s).trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/);
    if (m) {
      var y = +m[3]; if (y < 100) y += 2000;
      var d = new Date(y, +m[2] - 1, +m[1]);
      return d.getDate() === +m[1] ? d : null;
    }
    m = String(s).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function wireDays() {
    var form = $("#form");
    function calc(f) {
      var k = f.getAttribute("data-days").split(" ");
      var a = parseDate($('[name="' + k[0] + '"]', form).value), b = parseDate($('[name="' + k[1] + '"]', form).value);
      return a && b ? String(Math.round((b - a) / 86400000)) : "";
    }
    // auto-filled unless the user has typed something different
    form.addEventListener("input", function (e) {
      $$("[data-days]", form).forEach(function (td) {
        var f = $("input", td);
        if (e.target === f) { f.dataset.manual = f.value.trim() === "" ? "" : "1"; return; }
        var k = td.getAttribute("data-days").split(" ");
        if (k.indexOf(e.target.name) === -1 || f.dataset.manual) return;
        var v = calc(td);
        if (f.value !== v) { f.value = v; f.dispatchEvent(new Event("change", { bubbles: true })); }
      });
    });
    return function afterRestore() {
      $$("[data-days]", form).forEach(function (td) {
        var f = $("input", td);
        f.dataset.manual = f.value && f.value !== calc(td) ? "1" : "";
      });
    };
  }

  // ---------- build ----------
  var form = $("#form");
  form.insertAdjacentHTML("beforeend",
    '<input type="text" name="statements" value="1" hidden aria-hidden="true" tabindex="-1">' +
    page1() + page2() + page3() + page4());
  for (var n = savedStatementCount(); n > 1; n--) addStatement(true);
  numberPages();
  $("#form-version").textContent = "v" + VERSION;

  var afterRestore = wireDays();
  $("#btn-add-statement").addEventListener("click", function () { addStatement(false); });
  $("#btn-remove-statement").addEventListener("click", removeStatement);

  FormKit.init({
    id: FORM_ID,
    version: VERSION,
    printTitle: function (get) {
      return ["PSI Report", get("pt_name"), get("pt_file"), get("psi_date").replace(/\//g, "-")].filter(Boolean).join(" - ");
    },
    onReady: afterRestore,
    onReset: function () {
      $$("section[data-statement]").forEach(function (s) { s.remove(); });
      countField().value = "1";
      numberPages();
      afterRestore();
    }
  });
})();
