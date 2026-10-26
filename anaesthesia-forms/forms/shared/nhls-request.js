/*
 * NHLS Clinical Pathology request form (P02A1422 version 1) — builder.
 *
 *   NhlsRequest.build(sectionElement, {
 *     prefix:   "nhA_",                 // field-name prefix (unique per copy)
 *     variant:  "A - STAFF MEMBER",     // printed beside the logo
 *     values:   { hospital: "NEW SOMERSET HOSPITAL", ... },   // default text (Clear returns to it)
 *     ticks:    ["urgent", "chem_creatinine", ...],            // boxes ticked by default
 *     links:    { surname: "hcw_surname", ... },               // copy from another field until edited
 *     dobLink:  "hcw_dob"                                      // fill the 8 D.O.B. boxes from a date field
 *   });
 *   NhlsRequest.refresh();   // after a draft is restored or the form is cleared
 *
 * Coordinates below are millimetres measured on the printed form.
 */
(function () {
  "use strict";

  var PITCH = 3.32;          // test-row spacing (mm)
  var instances = [];

  // ------------------------------------------------------------------ helpers
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
  function mm(v) { return (+v).toFixed(2) + "mm"; }

  function txt(text, x, yc, cls, extra) {
    return '<div class="a vc ' + (cls || "") + '" style="left:' + mm(x) + ";top:" + mm(yc) + ";" + (extra || "") + '">' + text + "</div>";
  }
  function txtR(text, xr, yc, cls) {
    return '<div class="a vc r ' + (cls || "") + '" style="right:' + mm(210 - xr) + ";top:" + mm(yc) + '">' + text + "</div>";
  }
  // text stretched/condensed to exactly the width it has on the printed form
  function txtFit(text, x, yc, w, cls) {
    return '<div class="a vc fitx ' + (cls || "") + '" data-fitw="' + w + '" style="left:' + mm(x) + ";top:" + mm(yc) + '">' + text + "</div>";
  }
  function txtC(text, x1, x2, yc, cls) {
    return '<div class="a vc ' + (cls || "") + '" style="left:' + mm(x1) + ";width:" + mm(x2 - x1) + ";top:" + mm(yc) + ';text-align:center">' + text + "</div>";
  }
  function hline(x1, x2, y, cls) { return '<div class="rule-h ' + (cls || "") + '" style="left:' + mm(x1) + ";width:" + mm(x2 - x1) + ";top:" + mm(y) + '"></div>'; }
  function vline(x, y1, y2, cls) { return '<div class="rule-v ' + (cls || "") + '" style="left:' + mm(x) + ";top:" + mm(y1) + ";height:" + mm(y2 - y1) + '"></div>'; }
  function rect(x1, y1, x2, y2, cls, inner) {
    return '<div class="' + cls + '" style="left:' + mm(x1) + ";top:" + mm(y1) + ";width:" + mm(x2 - x1) + ";height:" + mm(y2 - y1) + '">' + (inner || "") + "</div>";
  }
  function bar(text, x1, x2, y1, y2, light) { return rect(x1, y1, x2, y2, "bar" + (light ? " light" : ""), text); }

  // ------------------------------------------------------------------ builder
  function build(section, cfg) {
    var P = cfg.prefix, values = cfg.values || {}, ticks = cfg.ticks || [], links = cfg.links || {};
    var h = "";

    // comb ("print in blocks") field with an input on top of it
    function comb(key, x1, x2, yb, opts) {
      opts = opts || {};
      var name = P + key, v = values[key];
      var attrs = ' name="' + name + '" aria-label="' + esc(opts.label || key) + '"' +
        (v != null ? ' value="' + esc(v) + '"' : "") +
        (links[key] ? ' data-link="' + links[key] + '"' : "") +
        (opts.pt ? " data-pt" : "") + (opts.attrs || "");
      return rect(x1, yb - 2.2, x2, yb, "comb") +
        '<input class="f' + (opts.center ? " c" : "") + '"' + attrs + ' style="left:' + mm(x1) + ";top:" + mm(yb - 4.2) + ";width:" + mm(x2 - x1) + '">';
    }
    // single-character boxes
    function boxes(key, x1, n, w, y1, y2, opts) {
      opts = opts || {};
      var out = "";
      for (var i = 0; i < n; i++) {
        var ph = opts.placeholders ? opts.placeholders[i] : "";
        out += '<div class="cbox' + (opts.noBorder ? " green" : "") + '" style="left:' + mm(x1 + i * w) + ";top:" + mm(y1) + ";width:" + mm(w) + ";height:" + mm(y2 - y1) + '">' +
          '<input name="' + P + key + "_" + (i + 1) + '" data-grp="' + P + key + '" aria-label="' + esc(opts.label || key) + " " + (i + 1) + '"' +
          (ph ? ' placeholder="' + ph + '"' : "") + (opts.pt ? " data-pt" : "") + "></div>";
      }
      return out;
    }
    function check(key) { return ticks.indexOf(key) >= 0 ? " checked" : ""; }

    // ================= frame & header =================
    h += hline(8.5, 204.8, 2.5) + hline(8.5, 204.8, 267.6) + vline(8.5, 2.5, 267.6) + vline(204.8, 2.5, 267.6);
    h += txtFit("NATIONAL HEALTH LABORATORY SERVICE", 19.9, 8.6, 75.8, "t-nhls");
    h += txtFit("CLINICAL PATHOLOGY", 22.2, 15.1, 70.9, "t-cp");
    h += '<img class="a" src="../assets/img/nhls-logo.png" alt="NHLS" style="left:109.4mm;top:3.8mm;width:13mm">';
    if (cfg.variant) h += txt(esc(cfg.variant), 130.5, 12.2, "t-var");
    h += txtFit("FOR LAB LABELS", 169.3, 11.7, 31.9, "t-lab");
    h += hline(8.5, 204.8, 20.7);
    h += txtFit("PLEASE PRINT IN BLOCKS AND ( X ) THE APPLICABLE BOXES", 33.0, 23.7, 146.9, "t-print");
    h += hline(8.5, 204.8, 26.7);

    // urgent / patient ID row
    h += rect(8.5, 26.7, 141.7, 33.0, "panel");
    h += txtFit("MARK IF URGENT", 38.5, 29.8, 35.8, "t-urgent");
    h += '<label class="xbox" style="left:78mm;top:28.2mm;width:5.2mm;height:3.2mm"><input type="checkbox" name="' + P + 'urgent" aria-label="Mark if urgent"' + check("urgent") + '><span class="tb"></span></label>';
    h += vline(103.5, 26.7, 123.4) + vline(141.7, 26.7, 33.0);
    h += txt("Patient I.D. Number", 108.6, 29.8, "lab", "font-size:8.6pt");
    h += boxes("ptid", 141.7, 13, 4.85, 26.7, 33.0, { label: "Patient ID number digit", pt: true });

    // ================= left: location / clinical / practitioner =================
    h += bar("LOCATION", 8.5, 103.5, 33.0, 36.8);
    h += txt("HOSPITAL / CLINIC", 10.6, 40.8, "lab", "font-size:9.4pt") + comb("hospital", 39.6, 102.9, 41.7, { label: "Hospital / clinic" });
    h += txt("Ward", 10.6, 46.7, "lab", "font-size:9.4pt") + comb("ward", 20.2, 102.9, 47.6, { label: "Ward" });
    h += txt("Cost Centre", 10.6, 51.2, "lab", "font-size:9pt") + comb("cost", 30.1, 102.9, 52.0, { label: "Cost centre" });

    h += bar("CLINICAL &nbsp;/&nbsp; SPECIMEN DETAILS", 8.5, 103.5, 53.6, 57.8);
    h += txt("Diagnosis / reason for request", 10.6, 61.4, "lab", "font-size:9pt") + comb("diag1", 54.2, 102.9, 62.3, { label: "Diagnosis line 1" });
    h += comb("diag2", 10.2, 102.9, 66.5, { label: "Diagnosis line 2" });
    h += comb("diag3", 10.2, 102.9, 70.5, { label: "Diagnosis line 3" });
    h += txt("Medication", 10.6, 74.8, "lab", "font-size:9pt") + comb("medication", 25.2, 76.0, 75.6, { label: "Medication" });
    h += txt("Warf", 76.4, 74.2, "lab") + comb("warf", 82.6, 89.8, 75.6, { label: "Warfarin", center: true });
    h += txt("Hep", 90.6, 74.2, "lab") + comb("hep", 96.3, 102.9, 75.6, { label: "Heparin", center: true });
    h += txt("Type of specimen", 10.6, 79.5, "lab", "font-size:9pt") + comb("specimen", 34.7, 102.9, 80.4, { label: "Type of specimen" });
    h += txt("Taken on", 10.6, 84.5, "lab", "font-size:9pt") + comb("taken_on", 25.0, 70.0, 85.4, { label: "Taken on (date)" });
    h += txt("at", 70.5, 84.2, "lab") + comb("taken_at", 73.7, 85.1, 85.4, { label: "Taken at (time)", center: true });
    h += txt("h", 85.7, 84.2, "lab") + comb("taken_h", 88.1, 102.9, 85.4, { label: "Hours" });
    h += '<button type="button" class="mini-btn screen-only" data-fill-today="' + P + 'taken_on" style="left:58.5mm;top:81.2mm">Today</button>';
    h += '<button type="button" class="mini-btn screen-only" data-fill-now="' + P + 'taken_at" style="left:88.8mm;top:81.2mm">Now</button>';
    h += txt("Taken by", 10.6, 90.5, "lab", "font-size:9pt") + comb("taken_by", 25.0, 102.9, 91.4, { label: "Taken by" });

    h += bar("CONTACT DETAILS OF RESPONSIBLE PRACTITIONER", 8.5, 103.5, 93.9, 97.6);
    h += txt("NAME ( Prof / Dr / Sr )", 10.6, 101.9, "lab", "font-size:9pt") + comb("dr_name", 39.6, 102.9, 102.8, { label: "Practitioner name" });
    h += txt("Persal or Practice No", 10.6, 107.1, "lab", "font-size:9pt") + comb("persal", 39.6, 102.9, 108.0, { label: "Persal or practice number" });
    h += txt("Cell &nbsp;No", 10.6, 111.4, "lab", "font-size:9pt") + comb("cell", 25.0, 75.0, 112.3, { label: "Cell number" });
    h += txt("Bleep", 75.5, 111.0, "lab", "font-size:9pt") + comb("bleep", 83.0, 102.9, 112.3, { label: "Bleep" });
    h += txt("Tel(0", 10.6, 116.1, "lab", "font-size:9pt") + txt(")", 20.6, 116.1, "lab", "font-size:9pt");
    h += '<input class="f c" name="' + P + 'tel_code" aria-label="Telephone area code"' + (values.tel_code ? ' value="' + esc(values.tel_code) + '"' : "") + ' style="left:17.2mm;top:114.0mm;width:3.6mm;padding:0">';
    h += comb("tel", 21.8, 55.0, 117.0, { label: "Telephone number" });
    h += txt("Fax (0", 55.8, 115.7, "lab", "font-size:9pt") + txt(")", 67.6, 115.7, "lab", "font-size:9pt");
    h += '<input class="f c" name="' + P + 'fax_code" aria-label="Fax area code" style="left:64.1mm;top:113.6mm;width:3.6mm;padding:0">';
    h += comb("fax", 69.4, 102.9, 117.0, { label: "Fax number" });
    h += txt("Signature #", 10.6, 121.2, "lab", "font-size:9pt") + rect(30.1, 119.9, 102.9, 122.1, "comb");

    // ================= right: patient information =================
    h += bar("PATIENT INFORMATION", 103.5, 204.8, 33.0, 36.8);
    h += rect(103.5, 36.8, 204.8, 75.7, "panel");
    h += txtFit("PATIENT LABEL", 120.7, 54.9, 80.0, "watermark");
    h += txt("Patient Hosp./<br>Clinic Number", 105.2, 40.2, "lab2", "font-size:8.4pt") + comb("pt_hosp", 123.6, 177.0, 42.0, { label: "Patient hospital / clinic number", pt: true });
    h += txt("Fee<br>class", 177.4, 40.2, "lab2", "font-size:8.4pt") + comb("pt_fee", 184.2, 203.2, 42.0, { label: "Fee class", center: true });
    h += txt("Surname", 105.2, 45.3, "lab", "font-size:8.6pt") + comb("pt_surname", 123.6, 203.2, 46.2, { label: "Patient surname", pt: true });
    h += txt("First name", 105.2, 49.8, "lab", "font-size:8.6pt") + comb("pt_first", 123.6, 203.2, 50.7, { label: "Patient first name", pt: true });
    h += txt("Address", 105.2, 54.6, "lab", "font-size:8.6pt") + comb("pt_addr1", 120.5, 203.2, 55.5, { label: "Patient address line 1", pt: true });
    h += comb("pt_addr2", 123.6, 203.2, 60.0, { label: "Patient address line 2", pt: true });
    h += comb("pt_addr3", 123.6, 177.0, 64.1, { label: "Patient address line 3", pt: true });
    h += txt("Postal<br>Code", 177.4, 62.6, "lab2", "font-size:8.4pt") + comb("pt_postal", 184.2, 203.2, 64.1, { label: "Patient postal code", center: true, pt: true });
    h += txt("Tel/Cell", 105.2, 67.8, "lab", "font-size:8.6pt") + comb("pt_tel", 123.6, 177.0, 68.6, { label: "Patient telephone", pt: true });
    h += txt("Sex", 179.0, 67.6, "lab", "font-size:8.6pt");
    h += '<label class="circ" style="left:186.8mm;top:65.9mm"><input type="checkbox" name="' + P + 'sex_m" data-group="' + P + 'sex"' + check("sex_m") + '><span>M</span></label>';
    h += '<label class="circ" style="left:197.2mm;top:65.9mm"><input type="checkbox" name="' + P + 'sex_f" data-group="' + P + 'sex"' + check("sex_f") + '><span>F</span></label>';
    h += txt("D.O.B.", 105.2, 72.1, "lab", "font-size:8.6pt") + rect(123.6, 70.7, 177.0, 72.9, "comb");
    h += boxes("dob", 123.6, 8, 4.85, 69.0, 72.8, { label: "Date of birth", placeholders: "DDMMYYYY".split(""), noBorder: true, pt: true });
    h += txt("Age", 177.4, 72.0, "lab", "font-size:8.6pt") + comb("pt_age", 184.2, 203.2, 72.9, { label: "Age", center: true, pt: true });

    // ================= right: private patients =================
    h += bar("PRIVATE PATIENTS ONLY", 103.5, 204.8, 75.7, 79.8);
    h += txt("ICD10 diagnosis codes:", 105.2, 83.6, "lab", "font-size:8.8pt");
    h += boxes("icd_a", 141.4, 6, 4.88, 81.3, 85.9, { label: "ICD10 code A" }) + boxes("icd_b", 173.7, 6, 4.88, 81.3, 85.9, { label: "ICD10 code B" });
    h += txt("Medical Aid:", 105.2, 87.6, "lab", "font-size:8.8pt") + comb("ma_name", 121.8, 170.7, 88.6, { label: "Medical aid" });
    h += txt("Plan:", 171.9, 87.4, "lab", "font-size:8.8pt") + comb("ma_plan", 180.0, 204.0, 88.6, { label: "Plan" });
    h += txt("Medical Aid No:", 105.2, 92.1, "lab", "font-size:8.8pt") + comb("ma_no", 131.3, 170.7, 93.1, { label: "Medical aid number" });
    h += txt("Employer:", 171.4, 91.9, "lab", "font-size:8.8pt") + comb("ma_employer", 185.4, 204.0, 93.1, { label: "Employer" });
    h += txt("Authorisation No:", 105.2, 96.7, "lab", "font-size:8.8pt") + comb("ma_auth", 131.3, 170.7, 97.6, { label: "Authorisation number" });
    h += txt("Dep code:", 171.4, 96.5, "lab", "font-size:8.8pt") + comb("ma_dep", 185.4, 204.0, 97.6, { label: "Dependant code" });
    h += txt("Account to / Principal Member:", 105.2, 101.3, "lab", "font-size:8.8pt") + comb("ma_principal", 145.6, 204.0, 102.2, { label: "Principal member" });
    h += txt("Member address:", 105.2, 105.7, "lab", "font-size:8.8pt") + comb("ma_addr1", 131.3, 204.0, 106.6, { label: "Member address line 1" });
    h += comb("ma_addr2", 112.5, 170.7, 110.9, { label: "Member address line 2" });
    h += txt("Postal<br>Code", 171.9, 109.6, "lab2", "font-size:8.4pt") + comb("ma_postal", 180.0, 204.0, 110.9, { label: "Member postal code", center: true });
    h += txt("Member Tel. No. (H/Cell):", 105.2, 114.6, "lab", "font-size:8.8pt") + comb("ma_tel", 141.2, 165.6, 115.5, { label: "Member telephone (home / cell)" });
    h += txt("(W):", 165.9, 114.4, "lab", "font-size:8.8pt") + comb("ma_tel_w", 170.7, 204.0, 115.5, { label: "Member telephone (work)" });
    h += txt("Member I.D. number:", 105.2, 119.2, "lab", "font-size:8.8pt") + comb("ma_id", 136.3, 204.0, 120.1, { label: "Member ID number" });

    // ================= test sections =================
    h += bar("CHEMICAL PATHOLOGY", 8.5, 85.1, 123.4, 128.0) + bar("HAEMATOLOGY", 85.1, 123.7, 123.4, 128.0) +
         bar("VIROLOGY", 123.7, 163.1, 123.4, 128.0) + bar("IMMUNOLOGY", 163.1, 204.8, 123.4, 128.0);
    h += vline(47.0, 128.0, 267.6) + vline(85.1, 123.4, 267.6) + vline(123.7, 128.0, 209.4, "g") + vline(163.1, 128.0, 267.6, "g");
    h += bar("DRUGS", 47.0, 85.1, 197.4, 203.6);
    h += bar("OTHER TESTS (ALL DISCIPLINES)", 85.1, 163.1, 209.4, 215.5);
    h += bar("MICROBIOLOGY", 163.1, 204.8, 172.2, 178.3);
    h += bar("RECEIVED IN LAB", 163.1, 204.8, 238.9, 245.0, true);

    var CLOCK = '<svg viewBox="0 0 10 10" style="width:2.6mm;height:2.6mm;vertical-align:-0.5mm"><circle cx="5" cy="5" r="4.2" fill="none" stroke="currentColor" stroke-width="0.9"/><path d="M5 2.2V5l2.2 1.4" fill="none" stroke="currentColor" stroke-width="0.9"/></svg>';
    var DROP = '<svg viewBox="0 0 10 10" style="width:2.2mm;height:2.6mm;vertical-align:-0.5mm"><path d="M5 0.6C5 0.6 1.6 5 1.6 6.6a3.4 3.4 0 006.8 0C8.4 5 5 0.6 5 0.6z" fill="currentColor"/></svg>';

    function testColumn(col, rows) {
      var out = "", box = col.box, codeR = col.codeR || col.box - 0.35;
      rows.forEach(function (r, i) {
        var yc = col.y0 + i * PITCH, type = r[0], o = r[r.length - 1];
        if (o && typeof o === "object" && !Array.isArray(o)) { if (o.box) { box = o.box; codeR = o.box - 0.35; } } else o = {};
        var code = function (c) {
          if (!c) return "";
          var t = c === "clock" ? CLOCK : c === "drop" ? DROP : esc(c);
          var cls = "tt" + (c.length > 2 && c !== "clock" && c !== "drop" ? " small-code" : "");
          return o.codeL != null ? txt(t, o.codeL, yc, cls) : txtR(t, codeR, yc, cls);
        };
        var nameX = o.nameX || col.name;
        if (type === "h") {
          out += txt(esc(r[1]), col.hdr, yc, "tt h");
          if (typeof r[2] === "string") out += txtR(r[2], col.priceR, yc, "tt");
        } else if (type === "hx") {
          out += txt(esc(r[1]), col.hdr, yc, "tt h");
          r[2].forEach(function (p) { out += txt(p[1], p[0], yc, "tt"); });
        } else if (type === "t") {
          var key = r[4] || (col.key + "_" + slug(r[2]));
          out += code(r[1]);
          out += '<label class="tr" style="left:' + mm(box) + ";top:" + mm(yc - 1.6) + ";width:" + mm(col.priceR - box - 7) + '">' +
            '<input type="checkbox" name="' + P + key + '" aria-label="' + esc(r[2]) + '"' + check(key) + '><span class="tb"></span>' +
            '<span class="nm tt" style="left:' + mm(nameX - box) + '">' + esc(r[2]) + "</span></label>";
          if (r[3]) out += txtR(esc(r[3]), col.priceR, yc, "tt");
        } else if (type === "x") {
          out += code(r[1]) + txt(esc(r[2]), nameX, yc, "tt");
          if (r[3]) out += txtR(esc(r[3]), col.priceR, yc, "tt");
        } else if (type === "b") {
          r[1].forEach(function (b) {
            out += '<label class="tr" style="left:' + mm(b[0]) + ";top:" + mm(yc - 1.6) + ';width:8mm"><input type="checkbox" name="' + P + b[2] + '" aria-label="' + esc(b[3] || b[1]) + '"' + check(b[2]) + '><span class="tb"></span>' +
              '<span class="nm tt" style="left:5.3mm">' + b[1] + "</span></label>";
          });
        } else if (type === "s") {
          var base = r[5] || (col.key + "_" + slug(r[2]));
          out += code(r[1]) + txt(esc(r[2]), nameX, yc, "tt");
          r[3].forEach(function (bx, k) {
            var key2 = base + "_" + (r[6] ? r[6][k] : k + 1);
            out += '<label class="tr" style="left:' + mm(bx) + ";top:" + mm(yc - 1.6) + ';width:3.8mm"><input type="checkbox" name="' + P + key2 + '" aria-label="' + esc(r[2] + " " + (r[6] ? r[6][k] : k + 1)) + '"' + check(key2) + '><span class="tb"></span></label>';
          });
          if (r[4]) out += txtR(esc(r[4]), col.priceR, yc, "tt");
        } else if (type === "r") {
          out += txtR(esc(r[1]), col.priceR, yc, "tt");
        } else if (type === "pos") {
          r[1].forEach(function (p) { out += txt(esc(p[1]), p[0], yc, "tt"); });
        } else if (type === "c") {
          out += txt(esc(r[1]), o.x || nameX, yc, "tt");
        }
      });
      return out;
    }

    // Chemical pathology (general etc.)
    h += testColumn({ key: "chem", box: 14.0, name: 21.8, priceR: 46.2, hdr: 10.8, y0: 131.6 }, [
      ["h", "General:", "Rands"],
      ["t", "HS*", "Blood gases", "45"], ["t", "Y", "Sodium", "25"], ["t", "Y", "Potassium", "25"], ["t", "Y", "Chloride", "15"],
      ["t", "Y", "Urea", "25"], ["t", "Y", "Creatinine", "25"], ["t", "Y", "Calcium", "25"], ["t", "Y", "Magnesium", "25"],
      ["t", "Y", "Inorganic phosph", "25"], ["t", "Y", "Uric acid", "27"], ["t", "Y", "Total protein", "25"], ["t", "Y", "Albumin", "34"],
      ["t", "Y", "Total bilirubin", "29"], ["t", "Y", "Conj. bilirubin", "22"], ["t", "Y", "ALP", "35"], ["t", "Y", "GGT", "38"],
      ["t", "Y", "ALT", "38"], ["t", "Y", "AST", "38"], ["t", "Y", "LDH", "38"], ["t", "Y", "Amylase", "36"], ["t", "Y", "Lipase", "36"],
      ["h", "Cardiac:"], ["t", "Y", "CK", "40"], ["t", "Y", "CK-MB", "38"], ["t", "clock", "Troponin", "141"],
      ["h", "Diabetes / metabolic:", { box: 15.2 }],
      ["t", "Grey", "Glucose - fast", "25"], ["t", "Grey", "Glucose - rand", "25"], ["t", "P", "HbA1c", "71"], ["t", "Grey*", "Lactate", "173"],
      ["h", "Lipids:"], ["t", "Y", "Triglyceride", "56"], ["t", "Y", "Total cholesterol", "38"], ["t", "Y", "HDL-cholesterol", "49"],
      ["h", "Anaemia:"], ["t", "Y", "HDL-cholesterol", "59", "chem_anaemia_hdl"], ["t", "Y", "Transferrin", "83"], ["t", "Y", "Ferritin", "93"],
      ["t", "Y", "Vitamin B12", "93"], ["t", "P*", "Folate - red cell", "131"]
    ]);
    // Endocrinology + CSF
    h += testColumn({ key: "endo", box: 52.7, name: 60.5, priceR: 84.3, hdr: 49.1, y0: 131.6 }, [
      ["h", "Endocrinology:", "Rands"],
      ["t", "Y", "TSH", "146"], ["t", "Y", "Free T4", "123"], ["t", "Y", "Free T3", "123"], ["t", "Y", "bHCG", "87"], ["t", "Y", "FSH", "93"],
      ["t", "Y", "LH", "93"], ["t", "Y", "Estradiol", "93"], ["t", "Y", "Progesterone", "96"], ["t", "Y", "Prolactin", "93"],
      ["t", "Y", "Testosterone", "93"], ["t", "Y", "SHBG", "93"], ["t", "clock", "PTH", "127"], ["t", "Y", "Cortisol", "93"],
      ["t", "Y", "Insulin", "93"], ["t", "Y", "AFP", "93"],
      ["h", "Cerebrospinal fluid:"],
      ["t", "Grey", "CSF glucose", "25"], ["t", "", "CSF chloride", "18"], ["t", "", "CSF protein", "22"]
    ]);
    // Drugs
    h += testColumn({ key: "drug", box: 52.7, name: 60.5, priceR: 84.3, hdr: 49.4, y0: 206.0 }, [
      ["t", "Y", "Paracetamol", "80"], ["t", "Y", "Salicylate", "80"], ["t", "Y", "Lithium", "39"], ["t", "Y", "Methotrexate", "80"],
      ["t", "Y", "Tricyclics", "80"], ["t", "Y", "Phenytoin", "80"], ["t", "Y", "Phenobarbitone", "80"], ["t", "Y", "Epilim / Na valpr", "80"],
      ["t", "Y", "Carbamezepine", "80"], ["t", "Y", "Digoxin", "92"], ["t", "Y", "Theophylline", "80"], ["x", "", "Urine mandrax", "80"],
      ["r", "trough peak"],
      ["s", "P", "Cyclosporin", [70.7, 74.9], "154", null, ["trough", "peak"], { codeL: 50.3, nameX: 53.6 }],
      ["s", "Y", "Amikacin", [70.7, 74.9], "88", null, ["trough", "peak"], { codeL: 50.3, nameX: 53.6 }],
      ["s", "Y", "Gentamycin", [70.7, 74.9], "88", null, ["trough", "peak"], { codeL: 50.3, nameX: 53.6 }],
      ["s", "Y", "Vancomycin", [70.7, 74.9], "88", null, ["trough", "peak"], { codeL: 50.3, nameX: 53.6 }]
    ]);
    h += txt("Time of dose :", 49.4, 206.0 + 17 * PITCH, "tt b", "font-size:8.8pt");
    h += '<input class="f" name="' + P + 'dose_time" aria-label="Time of dose" style="left:71.5mm;top:' + mm(206.0 + 17 * PITCH - 2.2) + ';width:13mm;height:4.2mm">';

    // Haematology
    h += testColumn({ key: "haem", box: 91.6, name: 98.6, priceR: 122.6, hdr: 87.5, y0: 131.6 }, [
      ["h", "General:", "Rands"],
      ["t", "P", "FBC", "48"], ["t", "P", "Differential count", "26"], ["t", "P", "Film (morph)", "26"], ["t", "P", "Haemoglobim", "15"],
      ["t", "P", "White cell count", "15"], ["t", "P", "Platelet count", "18"], ["t", "P", "Reticulocytes", "24"], ["t", "P", "Malaria screen", "43"],
      ["t", "clock", "ESR", "24"],
      ["h", "Coagulation:"],
      ["t", "B", "INR", "39"], ["t", "B", "PTT", "44"], ["t", "B", "Fibrinogen", "28"], ["t", "B", "D-dimers", "216"], ["t", "B", "Thrombin time", "56"],
      ["t", "B", "Antithrombin III", "173"], ["t", "B", "Lupus anticoag", "197"], ["t", "B", "Protein C", "238"], ["t", "B", "Protein S", "293"],
      ["t", "B", "APC Resist", "205"],
      ["h", "Other:"],
      ["t", "P", "Coombs", "29"], ["t", "©", "CSF/Fld cytosp", "52"]
    ]);
    // Virology
    h += testColumn({ key: "vir", box: 129.6, name: 136.3, priceR: 161.6, hdr: 125.8, y0: 131.6 }, [
      ["h", "HIV testing:", "Rands"],
      ["t", "Y", "HIV serology", "97"], ["t", "PP", "HIV viral load", "318"], ["t", "P", "PCR : HIV", "387"],
      ["h", "Hepatitis serology:"],
      ["x", "Y", "Clinical hepatitis:", "105 ea", { nameX: 130.8 }],
      ["b", [[133.1, "A", "vir_clinhep_a", "Clinical hepatitis A"], [143.1, "B", "vir_clinhep_b", "Clinical hepatitis B"], [152.8, "C", "vir_clinhep_c", "Clinical hepatitis C"]]],
      ["x", "Y", "Hepatitis immunity:", "", { nameX: 130.8 }],
      ["b", [[133.1, "A", "vir_hepimm_a", "Hepatitis immunity A"], [143.1, "B", "vir_hepimm_b", "Hepatitis immunity B"]]],
      ["hx", "Other serology:", [[148.3, "IgM"], [155.0, "IgG"]]],
      ["pos", [[148.4, "102"], [155.9, "94"]]],
      ["s", "Y", "CMV", [148.1, 155.0], "", null, ["igm", "igg"], { nameX: 130.8 }],
      ["s", "Y", "EBV", [148.1, 155.0], "", null, ["igm", "igg"], { nameX: 130.8 }],
      ["s", "Y", "HSV", [148.1, 155.0], "", null, ["igm", "igg"], { nameX: 130.8 }],
      ["s", "Y", "VZV", [148.1, 155.0], "", null, ["igm", "igg"], { nameX: 130.8 }],
      ["s", "Y", "Rubella", [148.1, 155.0], "", null, ["igm", "igg"], { nameX: 130.8 }],
      ["s", "drop", "Measles", [148.1, 155.0], "", null, ["igm", "igg"], { nameX: 130.8 }],
      ["s", "Y", "Mumps", [148.1, 155.0], "", null, ["igm", "igg"], { nameX: 130.8 }],
      ["h", "Viral isolation:"],
      ["t", "P", "CMV pp65 Ag", "323"], ["t", "", "Rapid RSV", "87 ea"], ["t", "", "Rap. rota/adeno", "169"],
      ["t", "", "Culture (specify)", "87"], ["t", "", "PCR (specify)", "var"]
    ]);
    // Immunology
    h += testColumn({ key: "imm", box: 170.6, name: 178.3, priceR: 202.4, hdr: 166.0, y0: 130.7 }, [
      ["t", "P", "CD4 (PLG)", "64"], ["t", "Y", "CRP", "60"], ["t", "Y", "IgG, IgA, IgM", "55 ea"], ["t", "Y", "Total compl", "97"],
      ["t", "Y", "Syphilis Serology", "16"], ["t", "Y", "ASOT / DNase B", "87"], ["t", "Y", "Toxoplasma", "94"], ["t", "Y", "ANF", "116"],
      ["t", "Y", "Anti ds-DNA", "116"], ["t", "Y", "Anti cardiolipin", "93"], ["t", "Y", "ANCA", "232"], ["t", "Y", "RF", "61"],
      ["t", "Y", "ENA", "115 ea"]
    ]);
    // Microbiology
    h += txt("Specimen site:", 166.0, 180.8, "tt b", "font-size:8.8pt");
    h += '<input class="f" name="' + P + 'mic_site" aria-label="Specimen site" style="left:166.9mm;top:181.0mm;width:35.1mm">';
    h += hline(166.9, 202.0, 185.1, "g");
    h += testColumn({ key: "mic", box: 168.2, name: 174.0, priceR: 203.3, hdr: 166.0, y0: 187.2 }, [
      ["h", "General:"],
      ["t", "Y", "Routine MC&S", "≥81"], ["t", "Y", "CSF cell count,", "≥141", "mic_csf"], ["c", "microscopy & culture", { x: 175.6 }],
      ["t", "Y", "Fungal M&C", "≥67"], ["t", "Y", "Blood culture", "≥101"], ["t", "Y", "Parasites", "≥57"],
      ["h", "TB investigation:"],
      ["t", "", "Microscopy", "32", "mic_tb_microscopy"], ["t", "", "Culture", "≥101", "mic_tb_culture"], ["t", "", "Sensitivity", "≥190", "mic_tb_sensitivity"],
      ["h", "Antigen detection:"],
      ["t", "", "Cryptococcal Ag", "40"], ["t", "", "Pneumocystis", "87"], ["t", "", "Chlamydia", "116"], ["t", "", "C. difficile toxin", "217"]
    ]);

    // Other tests (free text)
    h += txt("For full repertoire of tests, consult laboratory handbook", 87.6, 217.8, "tt");
    h += '<textarea class="f" name="' + P + 'other_tests" aria-label="Other tests">' + esc(values.other_tests || "") + "</textarea>";

    // ================= footer =================
    h += txt("# &nbsp;PROVINCIAL REQUIREMENTS :", 9.7, 272.4, "lab", "font-size:9.6pt;color:#333");
    h += txt("Signature &amp; PERSAL No. of Consultant:", 9.7, 278.3, "lab", "font-size:9.6pt;color:#333;text-decoration:underline");
    h += rect(8.5, 279.9, 65.0, 285.8, "a box");
    // footer notes: same line breaks and widths as the printed form
    [["Specimens may be rejected if Patient name and number, Practitioner name, signature and", 270.6, 94.0],
     ["Persal / Practice number, or Hospital / clinic / ward are omitted.", 273.5, 65.6],
     ["I hereby certify that I have considered the repertoire of tests requested as well as previous", 279.2, 94.2],
     ["test requests for this patient and confirm that this form is duly completed and will not result", 282.2, 95.1],
     ["in any fruitless and wasteful expenditure.", 285.0, 42.5]].forEach(function (l) {
      h += txtFit(l[0], 67.3, l[1], l[2], "foot");
    });
    h += rect(164.3, 268.0, 184.9, 275.6, "panel") + rect(184.9, 268.0, 204.8, 275.6, "panel");
    h += txtC("SORT", 164.3, 184.9, 271.8, "t-sort") + txtC("LABEL", 184.9, 204.8, 271.8, "t-sort");
    h += hline(164.3, 204.8, 268.0) + hline(164.3, 204.8, 275.6) + hline(164.3, 204.8, 286.0) + vline(164.3, 268.0, 286.0) + vline(184.9, 268.0, 286.0) + vline(204.8, 268.0, 286.0);
    h += txtR("P02A1422version1_Uniprint-F", 204.6, 287.6, "code");

    section.classList.add("nhls-sheet");
    section.innerHTML = '<div class="nh">' + h + "</div>";

    // the other-tests box sits in the free area under "For full repertoire…"
    var ta = section.querySelector('textarea[name="' + P + 'other_tests"]');
    ta.style.cssText = "left:86.2mm;top:219.6mm;width:76.4mm;height:47.4mm";
    ta.defaultValue = values.other_tests || "";

    fitText(section);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitText(section); });
    instances.push({ el: section, cfg: cfg });
    wire(section, cfg);
    return section;
  }

  function fitText(section) {
    var pxPerMm = 96 / 25.4;
    Array.prototype.forEach.call(section.querySelectorAll(".fitx"), function (el) {
      el.style.transform = "translateY(-50%)";
      var w = el.getBoundingClientRect().width;
      if (!w) return;
      el.style.transform = "translateY(-50%) scaleX(" + (parseFloat(el.dataset.fitw) * pxPerMm / w).toFixed(4) + ")";
    });
  }

  // ------------------------------------------------------------------ behaviour
  function wire(section, cfg) {
    var nh = section.querySelector(".nh");

    // single-character boxes: auto-advance, backspace, paste a whole number
    nh.addEventListener("input", function (e) {
      var t = e.target;
      if (t.dataset.grp) {
        var group = Array.prototype.slice.call(nh.querySelectorAll('input[data-grp="' + t.dataset.grp + '"]'));
        var i = group.indexOf(t);
        if (t.value.length > 1) {           // pasted / typed several characters
          var chars = t.value.replace(/\s+/g, "").split("");
          for (var k = 0; k < chars.length && i + k < group.length; k++) {
            group[i + k].value = chars[k];
            if (k) group[i + k].dispatchEvent(new Event("change", { bubbles: true }));   // saves, no cascade
          }
          t.value = chars[0] || "";
          var next = group[Math.min(i + chars.length, group.length - 1)];
          if (next) next.focus();
        } else if (t.value && group[i + 1]) {
          group[i + 1].focus();
        }
      }
      watermark(nh);
    });
    function isBox(t) { return t && t.dataset && t.dataset.grp; }
    function groupOf(t) { return Array.prototype.slice.call(nh.querySelectorAll('input[data-grp="' + t.dataset.grp + '"]')); }
    function setBox(t, v) { t.value = v; t.dispatchEvent(new Event("input", { bubbles: true })); }

    // one typed character replaces the box's character (caret position doesn't matter)
    nh.addEventListener("beforeinput", function (e) {
      var t = e.target;
      if (isBox(t) && e.inputType === "insertText" && e.data && e.data.length === 1) { e.preventDefault(); setBox(t, e.data); }
    });
    // pasting a whole ID / code fills the following boxes
    nh.addEventListener("paste", function (e) {
      var t = e.target, txt = isBox(t) && (e.clipboardData || window.clipboardData).getData("text");
      if (txt) { e.preventDefault(); setBox(t, txt.trim()); }
    });
    // Backspace clears the box, or steps back to the previous one when already empty
    nh.addEventListener("keydown", function (e) {
      var t = e.target;
      if (!isBox(t) || e.key !== "Backspace") return;
      e.preventDefault();
      if (t.value) { setBox(t, ""); return; }
      var prev = groupOf(t)[groupOf(t).indexOf(t) - 1];
      if (prev) { prev.focus(); setBox(prev, ""); }
    });

    // D.O.B. boxes follow another date field (dd/mm/yyyy) until edited by hand
    if (cfg.dobLink) {
      var src = document.querySelector('[name="' + cfg.dobLink + '"]');
      if (src) src.addEventListener("input", function () { syncDob(section, cfg, false); });
    }
  }

  function dobBoxes(section, cfg) {
    return Array.prototype.slice.call(section.querySelectorAll('input[data-grp="' + cfg.prefix + 'dob"]'));
  }
  function dobFrom(cfg) {
    var src = document.querySelector('[name="' + cfg.dobLink + '"]');
    if (!src) return null;
    var m = src.value.trim().match(/^(\d{1,2})\D+(\d{1,2})\D+(\d{4})$/);
    var digits = m ? ("0" + m[1]).slice(-2) + ("0" + m[2]).slice(-2) + m[3] : src.value.replace(/\D/g, "");
    return digits.length === 8 ? digits : "";
  }
  function syncDob(section, cfg, init) {
    if (!cfg.dobLink) return;
    var boxes = dobBoxes(section, cfg), cur = boxes.map(function (b) { return b.value; }).join("");
    var want = dobFrom(cfg);
    if (want === null) return;
    var inst = instances.filter(function (x) { return x.el === section; })[0];
    if (init) inst.lastDob = (cur === "" || cur === want) ? want : null;
    if (cur === "" || cur === inst.lastDob) {
      boxes.forEach(function (b, i) {
        var v = want.charAt(i) || "";
        if (b.value !== v) { b.value = v; b.dispatchEvent(new Event("change", { bubbles: true })); }
      });
    }
    inst.lastDob = want;
    watermark(section.querySelector(".nh"));
  }

  function watermark(nh) {
    var any = Array.prototype.some.call(nh.querySelectorAll("input[data-pt]"), function (i) { return i.value.trim() !== ""; });
    nh.classList.toggle("has-patient", any);
  }

  function refresh() {
    instances.forEach(function (x) { syncDob(x.el, x.cfg, true); watermark(x.el.querySelector(".nh")); });
  }

  window.NhlsRequest = { build: build, refresh: refresh };
})();
