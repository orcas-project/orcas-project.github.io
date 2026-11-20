#!/usr/bin/env python3
"""Assemble the static website and sharing metadata for its public URL."""

import argparse
from html import escape
from pathlib import Path
import shutil
from urllib.parse import urlsplit


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", required=True, help="Public HTTPS site URL")
    parser.add_argument("--output", type=Path, default=Path("_site"))
    args = parser.parse_args()
    base = args.base_url.rstrip("/") + "/"
    url = urlsplit(base)
    if url.scheme != "https" or not url.netloc or url.query or url.fragment:
        parser.error("--base-url must be an HTTPS URL without query or fragment")
    source = Path(__file__).resolve().parents[1]
    target = args.output.resolve()
    target.mkdir(parents=True, exist_ok=True)
    if any(target.iterdir()):
        parser.error("--output must be empty to avoid publishing stale files")

    for name in ("index.html", "styles.css", "script.js", ".nojekyll"):
        shutil.copy2(source / name, target / name)
    shutil.copytree(source / "assets", target / "assets")
    page = target / "index.html"
    html = page.read_text()
    html = html.replace(
        'content="assets/social-preview.webp"',
        f'content="{escape(base, quote=True)}assets/social-preview.webp"',
    )
    html = html.replace(
        "</head>",
        f'  <link rel="canonical" href="{escape(base, quote=True)}">\n'
        f'  <meta property="og:url" content="{escape(base, quote=True)}">\n</head>',
    )
    page.write_text(html)
    size = sum(p.stat().st_size for p in target.rglob("*") if p.is_file())
    print(f"Prepared {size / 1_000_000:.1f} MB at {target} for {base}")


if __name__ == "__main__":
    main()
