/*
 * Injury on Duty — builds the repeating tables, ruled boxes and linked fields,
 * then hands over to FormKit (drafts, Clear, Print).
 */
(function () {
  "use strict";

  var VERSION = "1.3";

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/&(?!\w+;|#)/g, "&amp;").replace(/"/g, "&quot;"); }
  function tick(name, label) {
    return '<label class="tick"><input type="checkbox" name="' + name + '" aria-label="' + esc(label.replace(/<[^>]+>/g, "")) + '">' +
      '<span class="box"></span><span class="t">' + label + "</span></label>";
  }
  function cellIn(name, label) { return '<td class="in"><input name="' + name + '" aria-label="' + esc(label) + '"></td>'; }

  // ---------------- Pages 6–7: NHLS request forms (A staff member, B source case) ----------------
  // Pre-filled exactly as the department's printed copies; Clear returns to these values.
  var NHLS_COMMON = {
    urgent: true,
    values: {
      hospital: "NEW SOMERSET HOSPITAL",
      ward: "OCCUPATIONAL HEALTH & SAFETY CLINIC",
      cost: "Z ARV 24",
      specimen: "BLOOD",
      persal: "5600634",
      tel_code: "21",
      tel: "402 6911"
    }
  };
  function nhlsCfg(o) {
    var values = {}, k;
    for (k in NHLS_COMMON.values) values[k] = NHLS_COMMON.values[k];
    for (k in o.values) values[k] = o.values[k];
    return { prefix: o.prefix, variant: o.variant, values: values, ticks: ["urgent"].concat(o.ticks), links: o.links, dobLink: o.dobLink };
  }
  var NHLS = {
    A: nhlsCfg({
      prefix: "nhA_", variant: "A - STAFF MEMBER",
      values: {
        diag1: "A#PEP",
        diag2: "COIDA needlestick injury:",
        diag3: "Healthcare worker or student baseline",
        other_tests: "1. HIV-ELISA\n2. Hepatitis B surface antibody titre\n3. Hepatitis C antibody\n4. Creatinine\n\n(2 x yellow tubes)"
      },
      ticks: ["chem_creatinine", "vir_hiv_serology", "vir_clinhep_c", "vir_hepimm_b"],
      links: { pt_hosp: "hcw_folder", pt_surname: "hcw_surname", pt_first: "hcw_name", dr_name: "hcw_clinician" },
      dobLink: "hcw_dob"
    }),
    B: nhlsCfg({
      prefix: "nhB_", variant: "B - SOURCE CASE",
      values: {
        diag1: "A#PEP",
        diag2: "SOURCE CASE in an occupational",
        diag3: "exposure incident (COIDA)",
        other_tests: "1. HIV-ELISA\n2. Hepatitis B surface antigen\n3. Hepatitis C antibody\n4. Syphilis serology\n\n(2 x yellow tubes)\n\n(if < 18 months old do HIV-PCR – purple tube)"
      },
      ticks: ["vir_hiv_serology", "vir_clinhep_b", "vir_clinhep_c", "imm_syphilis_serology"],
      links: { pt_hosp: "src_folder", pt_surname: "src_surname", pt_first: "src_name", dr_name: "hcw_clinician" },
      dobLink: "src_dob"
    })
  };
  $$("[data-nhls]").forEach(function (sec) { NhlsRequest.build(sec, NHLS[sec.dataset.nhls]); });

  // ---------------- Page 4: HepB immunoglobulin / vaccine given ----------------
  (function () {
    var rows = ["Dose", "Site", "Date", "Given by"], h = "";
    rows.forEach(function (r, i) {
      h += '<tr><td class="lab">' + r + ":</td>";
      for (var c = 1; c <= 4; c++) h += cellIn("hbig_" + (i + 1) + "_" + c, "HepB immunoglobulin " + r + " " + c);
      h += '<td class="sp"></td>';
      for (c = 1; c <= 4; c++) h += cellIn("hbvac_" + (i + 1) + "_" + c, "HepB vaccine " + r + " " + c);
      h += "</tr>";
    });
    $("#given-body").innerHTML = h;
  })();

  // ---------------- Page 4: blood tests ----------------
  function bloodRows(prefix, tests) {
    return tests.map(function (t, i) {
      var n = prefix + "_" + (i + 1);
      return "<tr><td>" + tick(n, t) + "</td>" + cellIn(n + "_date", "Date taken") + cellIn(n + "_result", "Result") + "</tr>";
    }).join("");
  }
  $("#hcw-bloods").innerHTML = bloodRows("hcwb", [
    "HIV ELISA",
    "HepB surface <b>Antibody</b> + titre = immunity (if incomplete/unvaccinated also do HepBsAg)",
    "Hepatitis C antibody",
    "Creatinine"
  ]);
  $("#src-bloods").innerHTML = bloodRows("srcb", [
    "HIV ELISA (if &lt; 18 months do HIV-PCR)",
    "HepBs<b>Ag (Antigen)</b>",
    "Hepatitis C antibody"
  ]);

  var ARVS = ["AZT", "D4T", "TDF", "ABC", "3TC", "FTC", "DDI", "NVP", "EFV", "Aluvia", "Atazanavir", "DTG"];
  function arvRow(key, label) {
    return '<tr><td style="padding-left:6mm">' + tick("haart_" + key, label) + '</td><td colspan="2" class="arvs m">' +
      ARVS.map(function (a) {
        return '<label class="circ"><input type="checkbox" name="haart_' + key + "_" + a.toLowerCase() + '"><span>' + a + "</span></label>";
      }).join("") + "</td></tr>";
  }
  $("#src-haart").innerHTML =
    '<tr><td style="padding-left:6mm">' + tick("haart_vl", "Latest HIV viral load") + "</td>" +
      cellIn("haart_vl_date", "Viral load date") + cellIn("haart_vl_result", "Viral load result") + "</tr>" +
    arvRow("current", "Current ARVs") + arvRow("previous", "Previous ARVs");

  // ---------------- Page 5: follow-up visits ----------------
  var VISITS = [
    { key: "fu1", title: "First visit (within 3–7 days)", items: [
      "Containment counselling", "ACTS pre- and post-test counselling", "Results of source patient", "Results of HCW",
      "Side-effect check", "Drug-interactions check", "Check HepB vaccination schedule",
      "Encourage safe sexual &amp; work practices", "Offer condoms"] },
    { key: "fu2", title: "Follow-up visit (± 2–4 weeks or intercurrent)", items: [
      "Containment counselling", "Side-effect and adherence check",
      "Give HepB IG &amp; vaccine @ 4 weeks if not immune &amp; source Hep B positive",
      "± Repeat creatinine if baseline abnormal", "Repeat FBC if on AZT",
      "Encourage safe sexual &amp; work practices", "Offer condoms"] },
    { key: "fu3", title: "Follow-up visit (6 weeks)", items: [
      "Containment counselling", "Repeat HIV-ELISA", "Repeat creatinine if on TDF", "Repeat FBC if on AZT",
      "Repeat HepC PCR &amp; Ab if exposed to Hepatitis C"] },
    { key: "fu4", title: "Follow-up visit (3 months)", items: [
      "Repeat final HIV-ELISA", "Repeat HepC PCR &amp; Ab if exposed to Hepatitis C",
      "Encourage safe sexual &amp; work practices"] },
    { key: "fu5", title: "Follow-up visit (6 months)", items: [
      "Repeat HepBsAg &amp; HepBsAb titre – if not immune and was at risk of Hep B",
      "Repeat HepC PCR &amp; Ab if exposed to Hepatitis C",
      "Encourage safe sexual &amp; work practices"] }
  ];
  $("#followup").innerHTML = VISITS.map(function (v) {
    return '<div class="fu">' +
      '<div class="fu-head"><span>' + v.title + '</span>' +
        '<span class="field"><span class="lbl">Date:</span><input class="ln" name="' + v.key + '_date" aria-label="' + esc(v.title) + ' date">' +
        '<button type="button" class="mini-btn screen-only" data-fill-today="' + v.key + '_date">Today</button></span></div>' +
      '<div class="fu-body"><ul class="cl">' +
        v.items.map(function (t, i) { return "<li>" + tick(v.key + "_" + (i + 1), t) + "</li>"; }).join("") +
      '</ul><div class="lined" data-fill><textarea name="' + v.key + '_notes" aria-label="' + esc(v.title) + ' notes"></textarea></div></div>' +
    "</div>";
  }).join("");

  // ---------------- Ruled boxes ----------------
  // data-rows="n" → n lines; data-fill → as many lines as fit the space beside the checklist
  function buildRules() {
    $$(".lined").forEach(function (box) {
      $$(".rule", box).forEach(function (r) { r.remove(); });
      var lh = parseFloat(getComputedStyle(box).getPropertyValue("--lh")) || 6.2;   // mm
      var rows = parseInt(box.dataset.rows, 10);
      if (box.hasAttribute("data-fill")) {
        var mmPx = 96 / 25.4;
        rows = Math.max(2, Math.floor(box.parentElement.getBoundingClientRect().height / (lh * mmPx)));
      }
      var frag = document.createDocumentFragment();
      for (var i = 0; i < rows; i++) { var r = document.createElement("i"); r.className = "rule"; frag.appendChild(r); }
      box.insertBefore(frag, box.firstChild);

      // first line starts after the question text, like the paper form
      var lead = $(".lead", box), ta = $("textarea", box);
      if (lead && ta) ta.style.textIndent = (lead.getBoundingClientRect().width + 6) + "px";
    });
  }
  buildRules();

  // ---------------- Linked fields ----------------
  // <input data-link="hcw_name hcw_surname"> copies from page 1 until it is edited by hand
  var links = $$("[data-link]").map(function (t) {
    var srcs = t.dataset.link.split(/\s+/).map(function (n) { return $('[name="' + n + '"]'); });
    return { t: t, srcs: srcs, last: null };
  });
  function computed(l) { return l.srcs.map(function (s) { return s.value.trim(); }).filter(Boolean).join(" "); }
  function syncLinks(force) {
    links.forEach(function (l) {
      var v = computed(l);
      if (force || l.t.value === "" || l.t.value === l.last) {
        if (l.t.value !== v) { l.t.value = v; l.t.dispatchEvent(new Event("input", { bubbles: true })); }
      }
      l.last = v;
    });
  }
  function initLinks() {
    links.forEach(function (l) { l.last = l.t.value === computed(l) || l.t.value === "" ? computed(l) : null; });
    syncLinks(false);
  }
  document.getElementById("form").addEventListener("input", function (e) {
    if (links.some(function (l) { return l.srcs.indexOf(e.target) >= 0; })) syncLinks(false);
  });

  // ---------------- Start ----------------
  FormKit.init({
    id: "injury-on-duty",
    version: VERSION,
    onReady: function () { initLinks(); NhlsRequest.refresh(); $$("textarea").forEach(FormKit.fit); },
    onReset: function () { initLinks(); NhlsRequest.refresh(); },
    printTitle: function (get) {
      var parts = ["Injury on Duty"];
      var who = [get("hcw_surname"), get("hcw_name")].filter(Boolean).join(" ");
      if (who) parts.push(who);
      return parts.join(" - ");
    }
  });
  document.getElementById("form-version").textContent = "v" + VERSION;
})();
