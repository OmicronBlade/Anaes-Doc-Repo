/*
 * C/S Prescription Chart — configuration.
 * Layout and behaviour live in shared/prescription-chart.js.
 * To change what "Autofill Standard C/S" fills in, edit `standard` below.
 */

// "Call Dr if" lines are padded with spaces so the criteria line up in a column.
var PAD = "                      ";

PrescriptionChart.init({
  id: "cs-prescription",
  version: "1.2",
  printPrefix: "CS Prescription",
  instructionRows: 22,
  premedRows: 7,

  standard: {
    instructions: [
      "Admit",
      "Observations: 15 min x 4; 30 min x 2; Hourly",
      "Call Dr if:      BP ≥ 160/110 or BP < 100/60",
      PAD + "Heart Rate > 120 or < 60",
      PAD + "Temp ≥ 38 °C",
      PAD + "Hb ≤ 7 g/dl (Ward Hb 6 hours post-op please)",
      PAD + "PPH (Soaked pad, Passing large clots PV, Altered mental state)",
      "Full ward diet as tolerated",
      "Mobilise once safe; Early catheter removal once mobilising",
      "20 IU Oxytocin in 1 litre Plasmalyte L at 125 ml/hour x1"
    ],
    premed: [
      { drug: "Morphine",    dose: "10 mg", route: "IMI" },
      { drug: "Ondansetron", dose: "4 mg",  route: "IV" }
    ],
    regular: [
      { name: "Paracetamol", dose: "1g",    route: "PO",    freq: "6 hourly",                   period: "2/52" },
      { name: "Ibuprofen",   dose: "400mg", route: "PO",    freq: "8 hourly",                   period: "5/7" },
      { name: "Morphine",    dose: "10mg",  route: "IMI",   freq: "4-6 hourly",                 period: "3/7" },
      { name: "Ondansetron", dose: "4mg",   route: "IV/IM", freq: "8 hourly/PRN",               period: "5/7" },
      { name: "Clexane",     dose: "",      route: "S/C",   freq: "Daily (Start >6 h post-op)", period: "2/52" },
      { name: "Lactulose",   dose: "10ml",  route: "PO",    freq: "12 hourly",                  period: "3/7" }
    ]
  }
});
