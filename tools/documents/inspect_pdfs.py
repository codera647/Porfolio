"""Render every PDF page; check extracted text and produce contact sheets for QA."""
from pathlib import Path
import pymupdf
from pypdf import PdfReader
from PIL import Image, ImageOps, ImageDraw

destination = Path("tmp/pdfs/rendered")
destination.mkdir(parents=True, exist_ok=True)
for slug in ("synapse", "autobg"):
    filename = Path("output/pdf") / f"{slug}-technical-description.pdf"
    reader = PdfReader(filename)
    texts = [page.extract_text() or "" for page in reader.pages]
    assert len(texts) >= 12, "Expected the complete chapter set"
    assert all(len(text.strip()) > 35 for text in texts), "Blank or near-blank PDF page"
    joined = " ".join(texts)
    expected = ("0.839", "80%", "faithfulness") if slug == "synapse" else ("REFL_STEPS", "13", "BiRefNet")
    for token in expected:
        assert token in joined, f"Missing content: {token}"
    doc = pymupdf.open(filename)
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
