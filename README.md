# Anaesthesia Forms — New Somerset Hospital

Departmental anaesthesia documents that you fill in on screen and print or save as PDF.
Built for the Department of Anaesthesia at New Somerset Hospital (NSH), Cape Town.

**Open the site:** <https://omicronblade.github.io/Anaes-Doc-Repo/>
(redirects to `anaesthesia-forms/`; GitHub Pages must be enabled — see [Publishing](#publishing)).

> **Privacy:** everything you type stays in your own browser. Nothing is sent to or stored on a
> server. Drafts are kept in that browser only, until you press **Clear**.

---

## For clinicians

### What's available

| Category | Documents |
|---|---|
| Intra-operative | PCA Prescription |
| Obstetrics | C/S Prescription Chart · Induction of Labour Form |
| Consent | Regional Anaesthesia Consent — General, Upper Limb, Lower Limb, Truncal & Plane *(draft)* |
| Patient Information | Regional anaesthesia patient leaflets ×4 *(draft)*, linked by QR code from each consent form |
| Audit, Safety & Data | Injury on Duty (PEP pack) · Patient Safety Incident (PSI) Reporting Form |
| Coming soon | Intra-operative Anaesthetic Record · Consent for Anaesthesia · Surgical Safety Checklist |

The site's front page is always the up-to-date list. **Draft** documents are hidden there until
you switch on the **Drafts** filter. Drafts also carry a DRAFT watermark and are not yet approved
for patient use.

### How to use a form

1. Open the site and pick a form. Search with the box at the top, or press <kbd>/</kbd>.
2. Fill it in. Click a tick box or "mark with an X" cell to mark it, and click again to clear it.
   **Today** and **Now** buttons fill in dates and times. <kbd>Enter</kbd> moves to the next field.
3. Your entries save automatically as a draft in this browser. They are still there if you close
   the tab and come back. **Clear** erases them.
4. Press **Print / Save PDF**. The PDF is named from the patient's name and folder number.
   Buttons and version numbers never appear on the printout.
5. Sign the paper copy by hand.

Some forms also have a **Blank PDF** (or pre-filled PDF) button on the front page for printing
straight away.

### Good to know

- **Use a shared computer with care.** Drafts stay in that browser until you press **Clear**.
  Clear the form after printing on a shared workstation.
- **Check against the official version.** These are faithful electronic copies of departmental and
  WCG forms. If an official form changes, the paper original takes precedence until this site
  is updated.
- **Regional consent forms** record the consent discussion. They do not replace it. The patient
  leaflet (QR code on the form) gives the full wording and risk figures.

### Problems or suggestions

Use **Contact site admin** at the bottom of the site, or email
[michaeljon.rosslee@gmail.com](mailto:michaeljon.rosslee@gmail.com).

---

## For maintainers

A static site with plain HTML, CSS and JavaScript. It has no build step, framework or server.

```
anaesthesia-forms/
  index.html             Front page (search, category and Drafts filters)
  assets/js/documents.js Document registry: titles, categories, versions, drafts  ← edit this
  assets/js/form.js      Shared form behaviour (drafts, Clear, Print, X/tick boxes, Today/Now)
  forms/                 One page per document, plus forms/shared/ for shared layouts
  leaflets/              Patient information leaflets
  tools/                 build_pdfs.py (quick-download PDFs), build_qr.py (leaflet QR codes)
```

**Run it locally:** open `anaesthesia-forms/index.html` in a browser, or serve the folder:

```bash
cd anaesthesia-forms && python3 -m http.server 8000   # then open http://localhost:8000
```

**Add or update a document:** add the page under `forms/`, then add or edit its entry in
`assets/js/documents.js` (bump `version` and `updated`). Add `draft: true` until it is approved.

**After changing a form with a quick-download PDF:**

```bash
pip install playwright qrcode
python anaesthesia-forms/tools/build_pdfs.py
```

[`anaesthesia-forms/README.md`](anaesthesia-forms/README.md) has the full technical notes. They
cover each form's options, the shared components, the regional-consent content file, the DRAFT
switch and the QR codes.

### Publishing

GitHub → **Settings → Pages → Deploy from a branch → `main` / root**. The site is then at
<https://omicronblade.github.io/Anaes-Doc-Repo/>. The QR codes on the consent forms point to
the leaflets at that address. If the address changes, rebuild them with `tools/build_qr.py`.

---

## Licence

| What | Licence |
|---|---|
| Software (HTML, CSS, JavaScript, tools) | [MIT](LICENSE) |
| Original clinical content (regional consent wording, patient leaflets) | [CC BY-NC-SA 4.0](LICENSE-CONTENT.md) |
| WCG, NHLS, Department of Employment and Labour and NSH forms, logos and crests | Not licensed here; owned by those organisations ([NOTICE.md](NOTICE.md)) |

© 2026 MJ Rosslee and the New Somerset Hospital Department of Anaesthesia.

**Disclaimer.** This site is provided as is, to help with completing departmental paperwork. It is
not an official Western Cape Government system and does not replace clinical judgement, local
policy or the official versions of the forms.

**Author:** MJ Rosslee · Department of Anaesthesia, New Somerset Hospital
