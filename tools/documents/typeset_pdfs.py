"""Print-focused native typography, linked contents, tables, and vector figures.

Run via npm run docs:pdf; never screenshot the article into the document.
"""
from pathlib import Path
from html import escape
import json
import re
import shutil

import pymupdf
from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    Table, TableStyle, KeepTogether, Flowable, HRFlowable, Preformatted,
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / "tmp/pdfs/typeset"
FONTS = ROOT / "tools/documents/fonts"
PAGE_W, PAGE_H = A4
MARGIN = 48
WIDTH = PAGE_W - MARGIN * 2
INK = colors.HexColor("#303030")
RUST = colors.HexColor("#87392a")
AMBER = colors.HexColor("#d9835a")
MUTED = colors.HexColor("#67625e")
RULE = colors.HexColor("#d8d3ce")
PAPER = colors.HexColor("#ffffff")
TINT = colors.HexColor("#f7f4f0")
ROSE = colors.HexColor("#f4e9e5")

pdfmetrics.registerFont(TTFont("JetBrains", str(FONTS / "JetBrainsMono-Regular.ttf")))
pdfmetrics.registerFont(TTFont("JetBrains-Bold", str(FONTS / "JetBrainsMono-Bold.ttf")))
pdfmetrics.registerFontFamily("JetBrains", normal="JetBrains", bold="JetBrains-Bold", italic="JetBrains", boldItalic="JetBrains-Bold")


def plain(text):
    return str(text).translate(str.maketrans({"\u2011": "-", "\u2013": "-", "\u2014": "-", "\u00a0": " "}))


def rich(text):
    return escape(plain(text))


def style(name, **options):
    defaults = dict(fontName="JetBrains", fontSize=9.2, leading=14.7,
                    textColor=INK, spaceAfter=10, splitLongWords=True,
                    allowWidows=False, allowOrphans=False)
    defaults.update(options)
    return ParagraphStyle(name, **defaults)


BODY = style("Body")
SMALL = style("Small", fontSize=7.8, leading=12, textColor=MUTED, spaceAfter=8)
CAPTION = style("Caption", fontSize=7.7, leading=11.5, textColor=MUTED, spaceAfter=14)
PART = style("Part", fontSize=7.3, leading=11, textColor=RUST, spaceBefore=16, spaceAfter=8, keepWithNext=True)
CHAPTER = style("Chapter", fontName="JetBrains-Bold", fontSize=17.5, leading=22.5, spaceAfter=16, keepWithNext=True)
SUB = style("Subheading", fontName="JetBrains-Bold", fontSize=10.5, leading=15, spaceBefore=12, spaceAfter=8, keepWithNext=True)
CELL = style("Cell", fontSize=7.6, leading=11.8, spaceAfter=0)
CELL_HEAD = style("CellHeader", fontName="JetBrains-Bold", fontSize=7.2, leading=11.2, textColor=RUST, spaceAfter=0)
NOTE = style("Note", fontSize=8.3, leading=13.2, spaceAfter=0)
NOTE_HEAD = style("NoteHeader", fontName="JetBrains-Bold", fontSize=7.4, leading=11.5, textColor=RUST, spaceAfter=6)


class RoundedImage(Flowable):
    def __init__(self, filename, max_height=250):
        super().__init__()
        self.filename = filename
        with PILImage.open(filename) as image:
            w, h = image.size
        scale = min(WIDTH / w, max_height / h)
        self.width, self.height = w * scale, h * scale
        self.hAlign = "CENTER"

    def draw(self):
        c = self.canv
        c.saveState()
        path = c.beginPath()
        path.roundRect(0, 0, self.width, self.height, 8)
        c.clipPath(path, stroke=0, fill=0)
        c.drawImage(ImageReader(str(self.filename)), 0, 0, self.width, self.height, preserveAspectRatio=True, mask="auto")
        c.restoreState()


class VectorFigure(Flowable):
    """Reserve a layout slot; overlay the original vector PDF after typesetting."""
    def __init__(self, document, metadata):
        super().__init__()
        self.document, self.metadata = document, metadata
        scale = min(WIDTH / metadata["width"], 450 / metadata["height"])
        self.width, self.height = metadata["width"] * scale, metadata["height"] * scale
        self.hAlign = "CENTER"

    def drawOn(self, canvas, x, y, _sW=0):
        x = self._hAlignAdjust(x, _sW)
        self.document.placements.append({"page": canvas.getPageNumber() - 1, "x": x, "y": y,
                                         "width": self.width, "height": self.height, "file": self.metadata["file"]})


class Graph(Flowable):
    def __init__(self, kind, data):
        super().__init__()
        self.kind, self.data = kind, data
        self.width = WIDTH
        self.height = 255 if kind == "retrieval" else 185 if kind == "answers" else 230

    def draw(self):
        c = self.canv
        c.setFillColor(TINT)
        c.setStrokeColor(RULE)
        c.roundRect(0, 0, self.width, self.height, 10, fill=1, stroke=1)
        c.setFillColor(INK)
        c.setFont("JetBrains-Bold", 10)
        title = {"retrieval": "Document-level hit@5", "answers": "Dual-judge answer distribution", "runtime": "Approximate warm-request timings / NVIDIA L4"}[self.kind]
        c.drawString(18, self.height - 27, title)
        if self.kind == "retrieval":
            left, bottom, chart_w, chart_h = 52, 43, WIDTH - 76, 150
            for tick in range(6):
                y = bottom + tick / 5 * chart_h
                c.setStrokeColor(RULE)
                c.setLineWidth(0.4)
                c.line(left, y, left + chart_w, y)
                c.setFillColor(MUTED)
                c.setFont("JetBrains", 7)
                c.drawRightString(left - 10, y - 2, f"{tick / 5:.1f}")
            slot = chart_w / len(self.data)
            for index, row in enumerate(self.data):
                x = left + index * slot + slot * 0.23
                h = row["value"] * chart_h
                c.setFillColor(RUST)
                c.rect(x, bottom, slot * 0.54, h, fill=1, stroke=0)
                c.setFillColor(INK)
                c.setFont("JetBrains-Bold", 7.3)
                c.drawCentredString(x + slot * 0.27, bottom + h + 7, f"{row['value']:.3f}")
                c.setFont("JetBrains", 6.7)
                c.drawCentredString(x + slot * 0.27, bottom - 15, row["name"])
            c.saveState()
            c.setStrokeColor(AMBER)
            c.setDash(3, 2)
            c.line(left, bottom + 0.839 * chart_h, left + chart_w, bottom + 0.839 * chart_h)
            c.restoreState()
        elif self.kind == "answers":
            left, chart_w = 80, WIDTH - 100
            palette = [("correct", "Correct", RUST), ("partial", "Partial", AMBER), ("incorrect", "Incorrect", INK)]
            for index, (_, label, color) in enumerate(palette):
                x = 18 + index * 145
                c.setFillColor(color)
                c.rect(x, self.height - 51, 11, 7, fill=1, stroke=0)
                c.setFillColor(MUTED)
                c.setFont("JetBrains", 7.5)
                c.drawString(x + 17, self.height - 51, label)
            for index, row in enumerate(self.data):
                y = 84 - index * 37
                c.setFillColor(INK)
                c.setFont("JetBrains-Bold", 8)
                c.drawString(18, y + 9, row["name"])
                x = left
                for key, _, color in palette:
                    w = chart_w * row[key] / 100
                    c.setFillColor(color)
                    c.rect(x, y, w, 26, fill=1, stroke=0)
                    c.setFillColor(PAPER if key != "partial" else INK)
                    c.setFont("JetBrains-Bold", 7.2)
                    c.drawCentredString(x + w / 2, y + 9, f"{row[key]}%")
                    x += w
            for tick in range(0, 101, 20):
                c.setFillColor(MUTED)
                c.setFont("JetBrains", 7)
                c.drawCentredString(left + tick / 100 * chart_w, 28, f"{tick}%")
        else:
            left, bottom, chart_w, chart_h = 125, 37, WIDTH - 171, 141
            for tick in range(0, 21, 5):
                x = left + tick / 20 * chart_w
                c.setStrokeColor(RULE)
                c.line(x, bottom, x, bottom + chart_h)
                c.setFillColor(MUTED)
                c.setFont("JetBrains", 7.5)
                c.drawCentredString(x, bottom - 16, f"{tick}s")
            for index, row in enumerate(self.data):
                y = bottom + chart_h - 31 - index * 47
                c.setFillColor(INK)
                c.setFont("JetBrains", 8)
                c.drawRightString(left - 12, y + 10, row["name"])
                w = row["value"] / 20 * chart_w
                c.setFillColor(RUST)
                c.roundRect(left, y, w, 30, min(4, w / 2), fill=1, stroke=0)
                c.setFillColor(INK)
                c.setFont("JetBrains-Bold", 8)
                c.drawString(left + w + 8, y + 10, f"~{row['value']:g}s")


class TechnicalDocument(BaseDocTemplate):
    def __init__(self, filename, project):
        self.project, self.placements = project, []
        super().__init__(str(filename), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                         topMargin=60, bottomMargin=54, title=f"{project['name']} - Technical description",
                         author="Abdul Moiz", subject=project["subtitle"], pageCompression=1)
        self.addPageTemplates(PageTemplate(id="document", frames=[Frame(MARGIN, 54, WIDTH, PAGE_H - 114,
                              leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)], onPage=self.page_chrome))

    def beforeDocument(self):
        self.placements.clear()

    def page_chrome(self, canvas, document):
        canvas.saveState()
        canvas.setFillColor(PAPER)
        canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.5)
        canvas.line(MARGIN, PAGE_H - 42, PAGE_W - MARGIN, PAGE_H - 42)
        canvas.line(MARGIN, 38, PAGE_W - MARGIN, 38)
        canvas.setFillColor(RUST)
        canvas.setFont("JetBrains-Bold", 7)
        canvas.drawString(MARGIN, PAGE_H - 32, self.project["name"].upper())
        canvas.setFillColor(MUTED)
        canvas.setFont("JetBrains", 7)
        canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 32, "TECHNICAL DESCRIPTION")
        canvas.drawString(MARGIN, 25, "Abdul Moiz / Engineering portfolio")
        canvas.drawRightString(PAGE_W - MARGIN, 25, f"{document.page:02d}")
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if getattr(flowable, "chapter_id", None):
            key, title = flowable.chapter_id, flowable.getPlainText()
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(title, key, level=0)
            self.notify("TOCEntry", (0, title, self.page, key))


def table_block(block):
    count = len(block["columns"])
    fractions = {2: [0.35, 0.65], 3: [0.24, 0.38, 0.38], 5: [0.30, 0.15, 0.15, 0.15, 0.25]}.get(count, [1 / count] * count)
    rows = [[Paragraph(rich(text), CELL_HEAD) for text in block["columns"]]]
    rows.extend([[Paragraph(rich(text), CELL) for text in row] for row in block["rows"]])
    table = Table(rows, colWidths=[WIDTH * value for value in fractions], repeatRows=1, hAlign="LEFT", spaceBefore=6, spaceAfter=16)
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, 0), ROSE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PAPER, TINT]),
        ("LINEBELOW", (0, 0), (-1, 0), 0.8, RUST),
        ("LINEBELOW", (0, 1), (-1, -1), 0.4, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 9), ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return table


def callout(block):
    content = [Paragraph(rich(block["label"].upper()), NOTE_HEAD), Paragraph(rich(block["text"]), NOTE)]
    table = Table([[content]], colWidths=[WIDTH], spaceBefore=6, spaceAfter=15)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ROSE), ("LINEBEFORE", (0, 0), (0, 0), 2, RUST),
        ("LEFTPADDING", (0, 0), (-1, -1), 14), ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 12), ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    return table


def figure_pair(flowable, caption):
    return KeepTogether([Spacer(1, 6), flowable, Spacer(1, 8), Paragraph(caption, CAPTION)])


def build(project, figures):
    slug = project["slug"]
    layout = WORK / f"{slug}-layout.pdf"
    document = TechnicalDocument(layout, project)
    story = [Spacer(1, 34)]
    story.append(Paragraph(rich(project["name"]), style("CoverName", fontName="JetBrains-Bold", fontSize=42, leading=48, spaceAfter=19)))
    story.append(Paragraph(rich(project["subtitle"].upper()), style("CoverSubtitle", fontSize=8.8, leading=14, textColor=RUST, spaceAfter=18)))
    story.append(Paragraph(rich(project["title"]), style("CoverTitle", fontName="JetBrains-Bold", fontSize=23, leading=30, spaceAfter=22)))
    story.append(Paragraph(rich(project["abstract"]), style("CoverAbstract", fontSize=10.2, leading=17, spaceAfter=20)))
    story.append(HRFlowable(width="100%", thickness=1, color=RUST, spaceAfter=18))
    story.append(Paragraph("Written by Abdul Moiz<br/>Architecture / Implementation / Evaluation", SMALL))
    story.append(Paragraph(rich(" / ".join(project["tags"])), SMALL))
    story.append(PageBreak())
    story.append(Paragraph("Contents", CHAPTER))
    story.append(Paragraph("A complete technical description of the product, its architecture, implementation boundaries, and evaluation. Select a chapter below to jump to its page.", BODY))
    toc = TableOfContents()
    toc.levelStyles = [style("ContentsEntry", fontSize=9, leading=15, spaceBefore=10, spaceAfter=6, leftIndent=0, firstLineIndent=0)]
    toc.dotsMinLevel = 0
    story.extend([Spacer(1, 14), toc, PageBreak()])

    figure_number, table_number = 0, 0
    for section_index, section in enumerate(project["sections"]):
        if section_index:
            story.append(Spacer(1, 8))
            story.append(HRFlowable(width="100%", thickness=0.5, color=RULE, spaceAfter=3))
        story.append(Paragraph(rich(section["part"].upper()), PART))
        heading = Paragraph(rich(f"{section['number']} / {section['title']}"), CHAPTER)
        heading.chapter_id = section["id"]
        story.append(heading)
        for block in section["blocks"]:
            kind = block["type"]
            if kind == "paragraph":
                story.append(Paragraph(rich(block["text"]), BODY))
            elif kind == "heading":
                story.append(Paragraph(rich(block["text"]), SUB))
            elif kind == "list":
                for item in block["items"]:
                    bullet = style("Bullet", leftIndent=14, firstLineIndent=0, bulletIndent=0, bulletFontName="JetBrains", bulletFontSize=9, spaceAfter=7)
                    story.append(Paragraph(rich(item), bullet, bulletText="-"))
                story.append(Spacer(1, 4))
            elif kind == "note":
                story.append(callout(block))
            elif kind == "table":
                table_number += 1
                story.append(Paragraph(f"TABLE {table_number:02d} / {rich(' / '.join(block['columns']))}", style("TableLabel", fontSize=7.2, leading=11, textColor=RUST, spaceBefore=6, spaceAfter=3, keepWithNext=True)))
                story.append(table_block(block))
            elif kind == "code":
                label = Paragraph(rich(block["label"]), NOTE_HEAD)
                code = Preformatted(plain(block["text"]), style("Code", fontSize=8.2, leading=12.8, spaceAfter=0), maxLineLength=90)
                box = Table([[[label, code]]], colWidths=[WIDTH], spaceBefore=6, spaceAfter=14)
                box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), TINT), ("BOX", (0, 0), (-1, -1), 0.5, RULE),
                    ("LEFTPADDING", (0, 0), (-1, -1), 14), ("RIGHTPADDING", (0, 0), (-1, -1), 14),
                    ("TOPPADDING", (0, 0), (-1, -1), 13), ("BOTTOMPADDING", (0, 0), (-1, -1), 13)]))
                story.append(box)
            elif kind == "image":
                figure_number += 1
                caption = re.sub(r"^Figure \d+\.\s*", "", block["caption"])
                story.append(figure_pair(RoundedImage(ROOT / "public" / block["src"].lstrip("/")), f"<b>Figure {figure_number:02d}.</b> {rich(caption)}"))
            elif kind == "diagram":
                metadata = figures[block["id"]]
                if metadata["kind"] == "results":
                    for chart, data, caption in [
                        ("retrieval", metadata["retrieval"], "Retrieval results. Overall 0.839; 1-hop 1.000; 2-hop 1.000; 3-hop 0.773; born-digital 0.857; scanned 0.824. The dashed reference marks overall hit@5."),
                        ("answers", metadata["answers"], "Answer quality. Judge A: 80% correct / 14% partial / 6% incorrect. Judge B: 70% correct / 12% partial / 18% incorrect."),
                    ]:
                        figure_number += 1
                        story.append(figure_pair(Graph(chart, data), f"<b>Figure {figure_number:02d}.</b> {rich(caption)}"))
                elif metadata["kind"] == "runtime":
                    figure_number += 1
                    story.append(figure_pair(Graph("runtime", metadata["rows"]), f"<b>Figure {figure_number:02d}.</b> Approximate reported timings: template 0.7s, AI reflection 13s, AI background 18s. Cold model loading is separate; these are not new benchmark measurements."))
                else:
                    figure_number += 1
                    story.append(figure_pair(VectorFigure(document, metadata), f"<b>Figure {figure_number:02d}.</b> {rich(metadata['caption'])}"))

    document.multiBuild(story)
    result = pymupdf.open(layout)
    for placement in document.placements:
        vector = pymupdf.open(ROOT / placement["file"])
        if len(vector) != 1:
            raise ValueError(f"Diagram split into {len(vector)} pages: {placement['file']}")
        page = result[placement["page"]]
        rect = pymupdf.Rect(placement["x"], PAGE_H - placement["y"] - placement["height"],
                           placement["x"] + placement["width"], PAGE_H - placement["y"])
        page.show_pdf_page(rect, vector, 0, keep_proportion=True)
        vector.close()
    output = ROOT / "output/pdf" / f"{slug}-technical-description.pdf"
    output.parent.mkdir(parents=True, exist_ok=True)
    result.save(output, garbage=4, deflate=True)
    pages = len(result)
    result.close()
    destination = ROOT / "public/projects" / slug / "description.pdf"
    shutil.copyfile(output, destination)
    print(f"Typeset {project['name']}: {pages} pages, {figure_number} figures, {table_number} tables -> {output}")


if __name__ == "__main__":
    documents = json.loads((WORK / "documents.json").read_text(encoding="utf-8"))
    figures = json.loads((WORK / "figures.json").read_text(encoding="utf-8"))
    for project in documents:
        build(project, figures)
