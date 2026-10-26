/*
 * Regional anaesthesia consent — clinical content.
 *
 * ONE source of truth for the four consent forms (forms/regional-consent-*.html)
 * AND the four patient leaflets (leaflets/regional-*.html), so the wording and
 * frequencies on the doctor's form always match what the patient reads.
 *
 * Each item has:
 *   id    unique within its list (also the saved field name on the form)
 *   form  short wording printed on the consent form (clinician language)
 *   pt    plain-language wording for the patient leaflet
 *   band  (risks) one of the keys in BANDS
 *   freq  (risks, optional) a more precise figure shown next to the band
 *   blocks (block-specific risks/benefits, optional) block ids it applies to;
 *          on screen these risks are highlighted when one of those blocks is ticked
 *
 * Sources:
 *   SASA/SASRA Guidelines for Regional Anaesthesia in South Africa 2016 (patient information sheets);
 *   McCombe K, Bogod D. Regional anaesthesia: risk, consent and complications. Anaesthesia 2021;76(S1):18-26;
 *   Burger R et al. Informed consent for PNBs ... a QI project. S Afr J Anaesth Analg 2024;30(2):62-66.
 *   Frequencies are approximate and rounded for discussion with patients.
 */
(function () {
  "use strict";

  // Verbal frequency scale (as used in UK RCoA / McCombe 2021 patient information)
  var BANDS = {
    "expected":  { label: "Expected",  range: "",                         pt: "This is how the block works" },
    "very-common": { label: "Very common", range: "> 1 in 10",     pt: "more than 1 in 10 people" },
    "common":    { label: "Common",    range: "1 in 10–100",       pt: "between 1 in 10 and 1 in 100 people" },
    "uncommon":  { label: "Uncommon",  range: "1 in 100–1 000",    pt: "between 1 in 100 and 1 in 1 000 people" },
    "rare":      { label: "Rare",      range: "1 in 1 000–10 000", pt: "between 1 in 1 000 and 1 in 10 000 people" },
    "very-rare": { label: "Very rare", range: "< 1 in 10 000",    pt: "fewer than 1 in 10 000 people" }
  };

  // ---------------------------------------------------------------------
  // Shared by every peripheral nerve / plane block
  // ---------------------------------------------------------------------
  // LEAD benefits open every form's benefits box; TAIL closes it (form-specific ones go between)
  var GENERAL_BENEFITS = [
    { id: "b_pain",   form: "Excellent pain relief at the operation site (often 8–24 h)",
      pt: "Excellent pain relief where you had your operation, usually lasting 8 to 24 hours." },
    { id: "b_opioid", form: "Less opioid needed: less nausea, vomiting, drowsiness, itch, constipation",
      pt: "You need less strong (morphine-type) pain medicine, so you are less likely to feel sick, vomit, feel drowsy, itch or become constipated." },
    { id: "b_recover",form: "Earlier eating, drinking, mobilising and discharge",
      pt: "You can usually eat, drink, get moving and go home sooner." }
  ];
  var LEAD = GENERAL_BENEFITS.slice(0, 2), TAIL = GENERAL_BENEFITS.slice(2);
  function benefits(specific) { return LEAD.concat(specific, TAIL); }

  var GENERAL_RISKS = [
    { id: "r_numb",    band: "expected",
      form: "Numbness / heaviness of the blocked area (usually 8–24 h, up to 48 h)",
      pt: "The area will feel numb, heavy and hard to move for 8 to 24 hours (sometimes up to 48 hours). This is how the block works." },
    { id: "r_fail",    band: "common", freq: "≈ 1 in 10–20",
      form: "Block fails or works partly: top-up, extra analgesia or GA",
      pt: "The block may not work completely. If so, we will give you extra pain medicine, repeat the block or give you a general anaesthetic." },
    { id: "r_rebound", band: "very-common",
      form: "Rebound pain as the block wears off: start oral analgesia early",
      pt: "Pain can return quite quickly when the block wears off. Take your pain medicine regularly, before the numbness has gone." },
    { id: "r_bruise",  band: "common",
      form: "Bruising or tenderness at the injection site",
      pt: "Bruising or tenderness where the needle went in. This settles by itself." },
    { id: "r_tns",     band: "common", freq: "resolves in days–weeks",
      form: "Temporary tingling, numbness or weakness after the block should have worn off",
      pt: "Tingling, a patch of numbness or weakness that lasts after the block should have worn off. Almost everyone recovers fully, usually within days to a few weeks." },
    { id: "r_bleed",   band: "uncommon",
      form: "Bleeding / haematoma (higher with anticoagulants)",
      pt: "Bleeding under the skin (a blood collection). This is more likely if you take blood-thinning medicine, so please tell us about all your medicines." },
    { id: "r_last",    band: "rare",
      form: "Local anaesthetic toxicity: seizures, arrhythmia (monitored; treatment available)",
      pt: "The local anaesthetic can get into the bloodstream and cause a fit or heart rhythm problems. We watch for this closely and have treatment ready." },
    { id: "r_nerve",   band: "rare", freq: "≈ 1 in 2 000–5 000",
      form: "Nerve damage lasting more than 6 months / permanent",
      pt: "Nerve damage that lasts longer than 6 months or is permanent (weakness, numbness or pain)." },
    { id: "r_infect",  band: "very-rare",
      form: "Infection / abscess at the injection site (higher with catheters)",
      pt: "Infection at the injection site. We use a sterile (clean) technique to prevent this." },
    { id: "r_allergy", band: "very-rare",
      form: "Severe allergic reaction to local anaesthetic",
      pt: "A serious allergic reaction to the medicines used." }
  ];

  var ALT = {
    oral:   { id: "a_analg", form: "Oral / IV analgesia (incl. opioids or PCA)", pt: "Pain medicine by mouth or through the drip, including morphine-type medicine or a patient-controlled pump (PCA)." },
    lai:    { id: "a_lai",   form: "Local anaesthetic infiltration by surgeon",  pt: "Local anaesthetic injected into the wound by the surgeon." },
    neurax: { id: "a_neurax",form: "Spinal / epidural",                          pt: "A spinal or epidural injection in the back." },
    epi:    { id: "a_epi",   form: "Epidural (thoracic)",                        pt: "An epidural injection in the back." },
    ga:     { id: "a_ga",    form: "General anaesthetic without a block",        pt: "A general anaesthetic (being fully asleep) without a nerve block, with pain medicine afterwards." },
    other:  { id: "a_other", form: "A different block",                          pt: "A different type of nerve block." }
  };

  var GENERAL_AFTERCARE = {
    protect: { id: "c_protect", form: "Protect the numb area from heat, cold, pressure and injury",
               pt: "Protect the numb area: you cannot feel heat, cold, pressure or injury there. Do not put hot water bottles or ice directly on it." },
    analg:   { id: "c_analg",   form: "Regular analgesia before the block wears off",
               pt: "Start your regular pain medicine before the numbness wears off, and take it as prescribed." },
    report:  { id: "c_report",  form: "Report numbness / weakness lasting > 48 h",
               pt: "If numbness, tingling or weakness lasts more than 48 hours, or you are worried, contact the hospital (see below)." }
  };

  // ---------------------------------------------------------------------
  // The four forms
  // ---------------------------------------------------------------------
  var FORMS = {

    // ----- General (catch-all) -----
    "general": {
      title: "General Regional Block",
      leaflet: "regional-general",
      ptTitle: "Nerve and plane blocks",
      ptArea: "the part of your body being operated on",
      ptWhat: "A nerve block is an injection of local anaesthetic (numbing medicine) next to the nerves that supply the part of your body being operated on. The anaesthetist uses an ultrasound machine to see the nerves and guide a thin needle. You may be given a little sedation first so that you are relaxed. The area becomes numb, warm and heavy over 10 to 30 minutes.",
      blocks: null,                 // free-text block field instead of a list
      benefits: benefits([
        { id: "b_awake", form: "Avoid GA or allow lighter GA / sedation",
          pt: "Depending on the operation, you may be able to stay awake or lightly sedated instead of having a general anaesthetic, or need less general anaesthetic." }
      ]),
      specificLines: 5,             // write-in block-specific risks
      risks: [],
      alternatives: [ALT.oral, ALT.lai, ALT.neurax, ALT.ga, ALT.other],
      aftercare: [GENERAL_AFTERCARE.protect, GENERAL_AFTERCARE.analg, GENERAL_AFTERCARE.report]
    },

    // ----- Upper limb -----
    "upper-limb": {
      title: "Upper Limb Nerve Block",
      leaflet: "regional-upper-limb",
      ptTitle: "Arm and shoulder nerve blocks",
      ptArea: "your shoulder, arm or hand",
      ptWhat: "The nerves to your shoulder, arm and hand run from the side of your neck, past the collarbone and through the armpit. The anaesthetist injects local anaesthetic (numbing medicine) next to these nerves — in the neck, above or below the collarbone, in the armpit or lower down the arm, depending on your operation — using an ultrasound machine to guide a thin needle. Your arm becomes numb, warm and heavy over 10 to 30 minutes.",
      blocks: [
        { id: "isb",  label: "Interscalene" },
        { id: "stb",  label: "Superior trunk" },
        { id: "scb",  label: "Supraclavicular" },
        { id: "icb",  label: "Infraclavicular" },
        { id: "axb",  label: "Axillary" },
        { id: "ssn",  label: "Suprascapular" },
        { id: "dist", label: "Forearm / wrist" }
      ],
      benefits: benefits([
        { id: "b_awake", form: "Surgery awake / lightly sedated: avoids GA and its risks",
          pt: "Your operation can often be done while you are awake or lightly sedated, with your arm completely numb. This avoids a general anaesthetic and its side effects (sore throat, nausea, confusion, breathing problems)." },
        { id: "b_shoulder", form: "Superior analgesia for shoulder surgery (very painful operation)", blocks: ["isb", "stb", "scb", "ssn"],
          pt: "Shoulder operations are among the most painful operations. A block gives much better pain relief than tablets or injections alone." }
      ]),
      risks: [
        { id: "u_phrenic", band: "very-common", freq: "ISB ≈ all; less with others", blocks: ["isb", "stb", "scb"],
          form: "Diaphragm weakness on that side → breathlessness (caution in lung disease)",
          pt: "The nerve to the breathing muscle (diaphragm) on that side is often blocked as well. You may feel a little short of breath until the block wears off. Tell us if you have lung disease." },
        { id: "u_horner",  band: "common", freq: "temporary", blocks: ["isb", "stb", "scb"],
          form: "Horner’s syndrome, hoarse voice, blocked nose (temporary)",
          pt: "A droopy eyelid, small pupil, blocked nose or hoarse voice on that side. These go away when the block wears off." },
        { id: "u_ptx",     band: "rare", freq: "with ultrasound", blocks: ["scb", "icb", "isb"],
          form: "Pneumothorax",
          pt: "A puncture of the lung (collapsed lung), causing chest pain and shortness of breath. It may need a chest drain." },
        { id: "u_phrenic_long", band: "rare", blocks: ["isb", "stb"],
          form: "Prolonged diaphragm weakness (months)",
          pt: "Weakness of the breathing muscle that lasts for months." },
        { id: "u_spinal",  band: "very-rare", blocks: ["isb"],
          form: "Spread to the epidural / spinal space or spinal cord injury",
          pt: "The local anaesthetic spreads to the spinal cord area, causing temporary weakness of both arms or breathing difficulty, or (extremely rarely) spinal cord injury." }
      ],
      alternatives: [ALT.oral, ALT.lai, ALT.ga, ALT.other],
      aftercare: [
        { id: "c_sling", form: "Arm in a sling; never let it hang over the bed edge",
          pt: "Keep your arm in the sling until feeling and strength return. Do not let it hang over the side of the bed — this can injure the nerves." },
        GENERAL_AFTERCARE.protect, GENERAL_AFTERCARE.analg,
        { id: "c_breath", form: "Report worsening breathlessness or chest pain",
          pt: "Tell the nurse or doctor straight away if you become more short of breath or have chest pain." },
        GENERAL_AFTERCARE.report
      ]
    },

    // ----- Lower limb -----
    "lower-limb": {
      title: "Lower Limb Nerve Block",
      leaflet: "regional-lower-limb",
      ptTitle: "Leg, hip and foot nerve blocks",
      ptArea: "your hip, leg, knee, ankle or foot",
      ptWhat: "The leg is supplied mainly by the femoral nerve (front of the thigh) and the sciatic nerve (back of the leg). The anaesthetist injects local anaesthetic (numbing medicine) near these nerves — in the groin, the thigh, behind the knee or around the ankle, depending on your operation — using an ultrasound machine to guide a thin needle. Your leg becomes numb, warm and heavy over 10 to 30 minutes. A block is often given together with a spinal or general anaesthetic.",
      blocks: [
        { id: "fic",  label: "Fascia iliaca" },
        { id: "peng", label: "PENG" },
        { id: "fem",  label: "Femoral" },
        { id: "lfcn", label: "Lat. femoral cutaneous" },
        { id: "acb",  label: "Adductor canal" },
        { id: "ipack",label: "IPACK" },
        { id: "obt",  label: "Obturator" },
        { id: "lp",   label: "Lumbar plexus (psoas)" },
        { id: "sci",  label: "Sciatic (proximal)" },
        { id: "pop",  label: "Popliteal sciatic" },
        { id: "ank",  label: "Ankle" }
      ],
      benefits: benefits([
        { id: "b_hip", form: "Hip fracture: analgesia before surgery, easier positioning for spinal, may reduce delirium", blocks: ["fic", "peng", "fem"],
          pt: "For a broken hip: less pain before and after the operation, easier to sit up for a spinal injection, and a lower chance of becoming confused after the operation." },
        { id: "b_mobile", form: "Motor-sparing blocks preserve strength → earlier walking & physio", blocks: ["acb", "peng", "ipack"],
          pt: "Some blocks (for example for knee or hip operations) keep most of your leg strength, so you can walk and start physiotherapy earlier." },
        { id: "b_awake", form: "Avoid GA (e.g. foot/ankle surgery with popliteal / ankle block)", blocks: ["pop", "ank", "sci"],
          pt: "For some foot and ankle operations, the block can be the only anaesthetic, so you can avoid a general anaesthetic." }
      ]),
      risks: [
        { id: "l_falls",  band: "common", freq: "less with ACB / PENG", blocks: ["fem", "fic", "lp", "acb", "peng", "obt"],
          form: "Quadriceps weakness → knee gives way → falls",
          pt: "Your thigh muscles may be weak, so your knee can give way. Do not stand or walk without help until your leg strength has fully returned." },
        { id: "l_heel",   band: "uncommon", blocks: ["sci", "pop", "ank"],
          form: "Foot drop; pressure injury to numb heel / foot",
          pt: "You may be unable to lift your foot for a while. Because the foot is numb, the heel can get a pressure sore — the nurses will help you change position." },
        { id: "l_compart",band: "rare", blocks: ["sci", "pop", "fem"],
          form: "May mask compartment syndrome (high-risk fractures): monitoring plan agreed with surgeon",
          pt: "After some leg fractures, swelling can squeeze the muscles (compartment syndrome). A block could hide the warning pain, so you will be checked regularly. Tell us at once about increasing pain or a tight, swollen leg." },
        { id: "l_lp",     band: "rare", blocks: ["lp"],
          form: "Lumbar plexus: epidural spread (hypotension, bilateral block), retroperitoneal / renal haematoma",
          pt: "With the deep (psoas) block, the local anaesthetic can spread to both legs or lower your blood pressure, and rarely there is bleeding deep in the back." }
      ],
      alternatives: [ALT.oral, ALT.lai, ALT.neurax, ALT.ga, ALT.other],
      aftercare: [
        { id: "c_walk", form: "Do not stand or walk unassisted until strength returns",
          pt: "Do not stand up or walk on your own until feeling and strength have fully returned. Always ask for help and use your crutches or walking frame." },
        GENERAL_AFTERCARE.protect, GENERAL_AFTERCARE.analg,
        { id: "c_compart", form: "Report pain out of proportion / tight swollen limb",
          pt: "Tell the nurse or doctor at once if the pain becomes much worse, or the leg feels tight and swollen." },
        GENERAL_AFTERCARE.report
      ]
    },

    // ----- Truncal & fascial plane -----
    "truncal": {
      title: "Truncal & Fascial Plane Block",
      leaflet: "regional-truncal",
      ptTitle: "Chest, back and tummy (plane) blocks",
      ptArea: "your chest, back or tummy wall",
      ptWhat: "The nerves to the chest and tummy wall run between layers of muscle (planes). The anaesthetist injects local anaesthetic (numbing medicine) into one of these layers — beside the spine, on the side of the chest or in the tummy wall, sometimes on both sides — using an ultrasound machine to guide a thin needle. Sometimes a thin tube (catheter) is left in to give pain relief for a few days.",
      blocks: [
        { id: "pvb",  label: "Paravertebral" },
        { id: "esp",  label: "Erector spinae (ESP)" },
        { id: "icn",  label: "Intercostal" },
        { id: "sap",  label: "Serratus anterior" },
        { id: "pecs", label: "PECS I / II" },
        { id: "pst",  label: "Parasternal" },
        { id: "tap",  label: "TAP" },
        { id: "rsb",  label: "Rectus sheath" },
        { id: "ql",   label: "Quadratus lumborum" },
        { id: "ilih", label: "Ilioinguinal / IH" }
      ],
      benefits: benefits([
        { id: "b_breath", form: "Rib fractures / chest surgery: deep breathing, coughing & physio easier → fewer chest infections", blocks: ["pvb", "esp", "icn", "sap", "pst"],
          pt: "After rib fractures or chest surgery, you can breathe deeply, cough and do physiotherapy more easily, which lowers the chance of a chest infection." },
        { id: "b_epi", form: "Alternative to epidural (e.g. on anticoagulants) with fewer side effects: hypotension, urinary retention, leg weakness",
          pt: "It can be used when an epidural is not possible or not suitable (for example if you take blood thinners), with fewer side effects than an epidural (low blood pressure, difficulty passing urine, weak legs)." }
      ]),
      risks: [
        { id: "t_partial", band: "expected",
          form: "Plane blocks cover the chest / abdominal wall, not visceral pain: other analgesia still needed",
          pt: "These blocks numb the skin and muscles of the chest or tummy wall, not the organs inside. You will still need some other pain medicine." },
        { id: "t_hypo",   band: "common", freq: "PVB; less with QL / ESP", blocks: ["pvb", "ql", "esp"],
          form: "Hypotension / epidural spread (both sides numb)",
          pt: "Low blood pressure, or the local anaesthetic spreading to both sides of the body. This is easily treated." },
        { id: "t_ptx",    band: "uncommon", freq: "PVB ≈ 1 in 200; others rare", blocks: ["pvb", "icn", "sap", "pecs", "pst", "esp"],
          form: "Pneumothorax",
          pt: "A puncture of the lung (collapsed lung), causing chest pain and shortness of breath. It may need a chest drain." },
        { id: "t_leg",    band: "uncommon", blocks: ["ql", "tap", "ilih"],
          form: "Leg weakness / numbness from lumbar plexus spread: assist first mobilisation",
          pt: "Numbness or weakness of the leg for a few hours. Have someone with you the first time you get up." },
        { id: "t_dose",   band: "rare", blocks: ["tap", "rsb", "ql", "icn", "esp"],
          form: "Higher LA toxicity risk with bilateral / multiple-level blocks (dose-limited, monitored)",
          pt: "Blocks on both sides need more local anaesthetic, which slightly increases the risk of it affecting the brain or heart. We keep the dose safe and monitor you." },
        { id: "t_organ",  band: "very-rare", freq: "with ultrasound", blocks: ["tap", "rsb", "ql", "ilih"],
          form: "Bowel, liver, spleen or kidney puncture",
          pt: "Injury to the bowel or an organ in the tummy (liver, spleen or kidney)." }
      ],
      catheterRisk: true,
      alternatives: [ALT.oral, ALT.lai, ALT.epi, ALT.ga, ALT.other],
      aftercare: [
        GENERAL_AFTERCARE.analg,
        { id: "c_breath", form: "Report breathlessness or chest pain (pneumothorax)",
          pt: "Tell the nurse or doctor straight away if you become short of breath or have chest pain." },
        { id: "c_firstwalk", form: "Assisted first mobilisation",
          pt: "Have someone with you the first time you get out of bed." },
        GENERAL_AFTERCARE.report
      ]
    }
  };

  // Catheter (continuous infusion) — added to any form when "Catheter" is planned
  var CATHETER_RISK = { id: "r_cath", band: "common",
    form: "Catheter: leak, dislodgement, blockage; infection risk rises after 48–72 h",
    pt: "If a thin tube (catheter) is left in for a pain-relief infusion, it can leak, fall out or block. It is usually removed after 2 to 3 days to keep the infection risk low." };

  window.REGIONAL = {
    BANDS: BANDS,
    GENERAL_RISKS: GENERAL_RISKS,
    CATHETER_RISK: CATHETER_RISK,
    FORMS: FORMS,
    CONTACT: { phone: "021 402 6911", text: "New Somerset Hospital (general enquiries) — ask for the anaesthetist on call." },
    SOURCES: [
      "SASA/SASRA Guidelines for Regional Anaesthesia in South Africa (2016)",
      "McCombe K, Bogod D. Regional anaesthesia: risk, consent and complications. Anaesthesia 2021;76(S1):18–26",
      "Burger R, Smit M, Plenge U, Gibbs MW. S Afr J Anaesth Analg 2024;30(2):62–66"
    ]
  };
})();
