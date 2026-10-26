/*
 * Induction of Labour Form — configuration.
 * Same chart as the C/S Prescription form, with 12 instruction lines and
 * the pre-med/stat doses extended to the bottom of page 1.
 * To change what "Autofill Standard Induction" fills in, edit `standard` below.
 */
PrescriptionChart.init({
  id: "induction-of-labour",
  version: "1.2",
  printPrefix: "Induction of Labour",
  instructionRows: 12,
  premedRows: 17,

  standard: {
    instructions: [
      "PLACEHOLDER FOR NOW"
    ],
    premed: [],
    regular: [
      { name: "Paracetamol", dose: "1g",   route: "PO",  freq: "6 hourly" },
      { name: "Morphine",    dose: "10mg", route: "IMI", freq: "As needed 4-6 hourly if < 7 cm" }
    ]
  }
});
