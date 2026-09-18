"""Vendor the hero tech strip's brand marks from simple-icons.

    python tools/techstack/fetch_icons.py

Writes src/vendor/simple-icons/techIcons.ts. Only the paths actually used are
inlined, so there is no runtime dependency and no request that can fail.

Two things this checks rather than assumes:

* The pinned version really has every slug. `openai` and `amazonwebservices`
  resolved over the CDN's `@latest` alias but are absent from the package
  itself - a stale edge cache. Brands do get removed from simple-icons over
  trademark policy, so a 404 here means substitute or drop, never fall back to
  whatever an older build happens to still serve.
* Every icon is a single path on a 0 0 24 24 viewBox, which is what the marquee
  markup assumes.
"""
import re
import urllib.request

VERSION = "16.31.0"
OUT = "src/vendor/simple-icons/techIcons.ts"

# Sixteen: a middle ground between a tight dozen and the full stack, weighted to
# the AI/ML work the CV leads with. Every one of these is on the CV.
PICKS = [
    ("python", "Python"),
    ("pytorch", "PyTorch"),
    ("tensorflow", "TensorFlow"),
    ("scikitlearn", "scikit-learn"),
    ("opencv", "OpenCV"),
    ("huggingface", "Hugging Face"),
    ("langchain", "LangChain"),
    ("anthropic", "Anthropic"),
    ("fastapi", "FastAPI"),
    ("postgresql", "PostgreSQL"),
    ("mongodb", "MongoDB"),
    ("docker", "Docker"),
    ("kubernetes", "Kubernetes"),
    ("googlecloud", "Google Cloud"),
    ("mlflow", "MLflow"),
    ("nextdotjs", "Next.js"),
]

HEADER = '''/**
 * Vendored brand marks for the hero's tech strip. Generated - do not edit.
 *
 * Source   simple-icons v%s, https://github.com/simple-icons/simple-icons
 * Licence  CC0-1.0, which covers the SVG artwork. The marks themselves remain
 *          trademarks of their owners and are used here only to state which
 *          technologies Abdul Moiz works with - ordinary nominative use.
 *
 * Regenerate with tools/techstack/fetch_icons.py to change the selection.
 */

export type TechIcon = {
  slug: string;
  label: string;
  /** Single path on a 0 0 24 24 viewBox. */
  path: string;
};

export const TECH_ICONS: readonly TechIcon[] = [
'''


def fetch(slug: str) -> str:
    url = f"https://cdn.jsdelivr.net/npm/simple-icons@{VERSION}/icons/{slug}.svg"
    try:
        svg = urllib.request.urlopen(url, timeout=30).read().decode()
    except urllib.error.HTTPError as e:
        raise SystemExit(
            f"{slug}: HTTP {e.code} at simple-icons@{VERSION}. If this used to "
            f"exist it was probably removed for trademark reasons - substitute "
            f"or drop it, do not fall back to an older build."
        )
    box = re.search(r'viewBox="([^"]+)"', svg)
    if not box or box.group(1) != "0 0 24 24":
        raise SystemExit(f"{slug}: unexpected viewBox {box and box.group(1)}")
    paths = re.findall(r'\sd="([^"]+)"', svg)
    if len(paths) != 1:
        raise SystemExit(f"{slug}: expected one path, found {len(paths)}")
    return paths[0]


def main():
    rows = []
    for slug, label in PICKS:
        path = fetch(slug)
        rows.append(f'  {{ slug: "{slug}", label: "{label}", path: "{path}" }},')
        print(f"  {label:<14} {len(path):>5} chars")

    text = (HEADER % VERSION) + "\n".join(rows) + "\n];\n"
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"\nwrote {OUT}  ({len(text)} bytes, {len(rows)} icons)")


if __name__ == "__main__":
    main()
