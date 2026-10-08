"""Render every PDF page; check extracted text and produce contact sheets for QA."""
from pathlib import Path
import json
import re
import unicodedata
import pymupdf
from pypdf import PdfReader
from PIL import Image, ImageOps, ImageDraw

destination = Path("tmp/pdfs/rendered")
destination.mkdir(parents=True, exist_ok=True)
for slug in ("synapse", "autobg"):
    filename = Path("output/pdf") / f"{slug}-technical-description.pdf"
    reader = PdfReader(filename)
    texts = [page.extract_text() or "" for page in reader.pages]
    assert len(texts) >= 5, "Expected a complete long-form document"
    assert all(len(text.strip()) > 35 for text in texts), "Blank or near-blank PDF page"
    joined = " ".join(texts)
    normalize = lambda text: re.sub(r"\s+", "", unicodedata.normalize("NFKC", text).translate(str.maketrans({"\u2011": "-", "\u2013": "-", "\u2014": "-"}))).casefold()
    expected_text = json.loads((Path("tmp/pdfs") / f"{slug}-expected-text.json").read_text(encoding="utf-8"))
    assert len(expected_text["chapters"]) == 12
    for text in expected_text["chapters"] + expected_text["paragraphs"]:
        assert normalize(text) in normalize(joined), f"Missing or clipped text: {text[:75]}"
    expected = ("0.839", "80%", "faithfulness") if slug == "synapse" else ("REFL_STEPS", "13", "BiRefNet")
    for token in expected:
        assert token in joined, f"Missing content: {token}"
    doc = pymupdf.open(filename)
    assert not re.search(r"Source basis|Source snapshot|b79bb2dd2794|68252421347e", joined, re.I), "Source basis leaked into PDF"
    assert len(doc.get_toc()) == 12, "All chapters must have native PDF bookmarks"
    assert len(doc[1].get_links()) >= 12, "Contents must link to every chapter"
    assert "ReportLab" in doc.metadata.get("producer", ""), "Final document must be typeset, not a webpage printout"
    figure_data = json.loads((Path("tmp/pdfs/typeset") / "figures.json").read_text(encoding="utf-8"))
    for figure_id, figure in figure_data.items():
        if not figure_id.startswith(slug) or figure["kind"] != "vector":
            continue
        for label in figure["nodes"]:
            assert normalize(label) in normalize(joined), f"Missing vector diagram node: {label}"
    thumbnails = []
    for index, page in enumerate(doc):
        image = page.get_pixmap(matrix=pymupdf.Matrix(1.25, 1.25), alpha=False)
        image.save(destination / f"{slug}-{index + 1:02}.png")
        thumb = Image.open(destination / f"{slug}-{index + 1:02}.png").convert("RGB")
        thumb.thumbnail((250, 354))
        tile = Image.new("RGB", (274, 386), "#202020")
        tile.paste(thumb, ((274 - thumb.width) // 2, 8))
        ImageDraw.Draw(tile).text((12, 367), f"{slug} / {index + 1}", fill="white")
        thumbnails.append(tile)
    for batch_start in range(0, len(thumbnails), 12):
        batch = thumbnails[batch_start:batch_start + 12]
        sheet = Image.new("RGB", (274 * 4, 386 * ((len(batch) + 3) // 4)), "#202020")
        for index, tile in enumerate(batch):
            sheet.paste(tile, ((index % 4) * 274, (index // 4) * 386))
        sheet.save(destination / f"{slug}-contact-{batch_start // 12 + 1}.jpg")
    print(f"PASS {filename}: {len(doc)} pages, {len(joined)} extracted characters, every page rendered.")
