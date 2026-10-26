"""
Build the pre-filled PDFs offered as quick downloads on the landing page.

Reads window.DOCUMENTS from assets/js/documents.js (by loading index.html),
opens every form that has a `pdf` entry in a clean browser, presses its
Autofill button if `autofill: true`, and prints it to the `pdf.file` path.

Run after changing any form that has a quick-download PDF:

    pip install playwright
    python -m playwright install chromium
    python tools/build_pdfs.py

For identical output to Windows/Calibri, install the metric-compatible
Carlito font first (Debian/Ubuntu: apt install fonts-crosextra-carlito).
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        index = browser.new_page()
        index.goto((ROOT / "index.html").as_uri())
        docs = index.evaluate("() => (window.DOCUMENTS || []).filter(d => d.href && d.pdf && d.pdf.file)")
        index.close()

        for doc in docs:
            ctx = browser.new_context()          # fresh storage: no saved drafts
            page = ctx.new_page()
            page.on("dialog", lambda d: d.accept())
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))

            page.goto((ROOT / doc["href"]).as_uri())
            if doc["pdf"].get("autofill"):
                page.click("#btn-autofill")
            page.wait_for_timeout(300)
            if errors:
                raise SystemExit(f"{doc['id']}: page errors {errors}")

            out = ROOT / doc["pdf"]["file"]
            out.parent.mkdir(parents=True, exist_ok=True)
            page.emulate_media(media="print")
            page.pdf(path=str(out), prefer_css_page_size=True, print_background=True)
            print(f"built {out.relative_to(ROOT)}")
            ctx.close()

        browser.close()


if __name__ == "__main__":
    main()
