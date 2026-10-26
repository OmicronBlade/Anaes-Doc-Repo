"""
Build the QR codes printed on the regional consent forms.

Each code links to a patient leaflet on the GitHub Pages site and is saved as
assets/img/qr/<leaflet>.svg. Re-run if the site address or a leaflet name changes
(and update LEAFLET_BASE in forms/shared/regional-consent.js to match):

    pip install qrcode
    python tools/build_qr.py
"""
from pathlib import Path
import qrcode
import qrcode.image.svg

BASE_URL = "https://omicronblade.github.io/Anaes-Doc-Repo/anaesthesia-forms/leaflets/"
LEAFLETS = ["regional-general", "regional-upper-limb", "regional-lower-limb", "regional-truncal"]

ROOT = Path(__file__).resolve().parent.parent


def main():
    out_dir = ROOT / "assets" / "img" / "qr"
    out_dir.mkdir(parents=True, exist_ok=True)
    for name in LEAFLETS:
        qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=1,
                           image_factory=qrcode.image.svg.SvgPathFillImage)
        qr.add_data(BASE_URL + name + ".html")
        qr.make(fit=True)
        path = out_dir / f"{name}.svg"
        qr.make_image().save(str(path))
        print(f"built {path.relative_to(ROOT)}  ->  {BASE_URL}{name}.html")


if __name__ == "__main__":
    main()
