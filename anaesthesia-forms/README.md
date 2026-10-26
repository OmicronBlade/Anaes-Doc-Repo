# Anaesthesia Forms

Static site for completing departmental anaesthesia documents in the browser and printing them to PDF. Hosted on GitHub Pages; no build step, no server, no data leaves the browser.

## Structure

```
index.html                 Landing page
assets/css/base.css        Shared tokens + print rules (used by every form)
assets/css/index.css       Landing page styles
assets/js/documents.js     Site config + document registry  ← edit this
assets/js/index.js         Landing page search / filter / render
assets/css/form.css        Shared form styles: toolbar, A4 sheets, print rules
assets/js/form.js          Shared form behaviour: draft autosave, clear, print, autofill, text fitting
assets/img/                Logos used on forms
forms/<id>.html|js         One page per document; the .js holds that form's settings
forms/shared/              Layouts shared by several forms (e.g. the NSH prescription chart)
forms/pdf/                 Pre-filled PDFs for landing-page quick downloads (tools/build_pdfs.py)
.nojekyll                  Tells GitHub Pages to serve files as-is
```

## Adding or updating a document

1. Add the form page to `forms/` (e.g. `forms/preop-assessment.html`).
2. In `assets/js/documents.js`, add or edit its entry: set `href: "forms/preop-assessment.html"`, bump `version`, and update `updated`.

Entries with `href: null` show as "Coming soon".

## Versions

Versions are shown on screen only. Anything with the class `screen-only` or `version-tag` is hidden in print/PDF by `base.css`.

## Publishing

Push to GitHub → Settings → Pages → Deploy from branch → `main` / root.

## Forms

- **Drafts** auto-save to the browser (localStorage) on every keystroke and restore on reload. One draft per form per browser; **Clear** deletes it.
- **Print / Save PDF** prints A4 at true size. The PDF file name is built from the patient name and folder number.
- **Landscape** pages: add `class="landscape"` to a `.sheet`.
- **Prescription charts** (C/S Prescription, Induction of Labour) share `forms/shared/prescription-chart.js|css`.
  Each form's own `.js` sets the instruction/stat-dose row counts and the `standard` values its Autofill button fills in.
  Drug and route suggestions default to the list in `prescription-chart.js` and can be overridden per form with `suggestions`.
- **PCA Prescription** (`forms/pca-prescription.*`) is a one-page form with its own layout. Toolbar options (not printed):
  drug presets (edit `PRESETS` in `pca-prescription.js`) and the pruritus-drug switch (Either / Chlorpheniramine / Cetirizine).
  The *Check all* button beside the checklist and the *Today* buttons beside each date (fill dd/mm/yyyy) are also screen-only.
  Its landing-page quick download is the blank form (`pdf.autofill: false`).
- **Default values.** A field's `value="..."` in the HTML (e.g. Ward = LW, Lock Out = 8, Qualifications = MBChB) is its default:
  Clear returns to it, and a default that has been deliberately emptied stays empty after a reload.
- **NHLS request form** (`forms/shared/nhls-request.*`): electronic Clinical Pathology form P02A1422, built from mm
  coordinates. `NhlsRequest.build(section, cfg)` makes a copy with its own prefix, defaults, ticked tests and linked fields.
- **Injury on Duty** (`forms/injury-on-duty.*`) is an eight-page A4 pack (NHLS copies A and B are pages 6–7; the A/B
  pre-fills live in `NHLS` in `injury-on-duty.js`) (margins set by `--m` in its CSS).
  Shared components from `form.css`/`form.js` it uses, available to any form:
  `.tick` tick boxes, `.circ` circle-the-option choices (`data-group` makes a set single-choice),
  `td.circle-cell` circle-a-table-block, `data-fill-today` / `data-fill-now` buttons, and ruled `.lined` boxes
  (text that no longer fits is outlined red on screen). Fields with `data-link` copy page-1 details until edited by hand.
- After changing a form that has a quick-download PDF, run `python tools/build_pdfs.py`.
