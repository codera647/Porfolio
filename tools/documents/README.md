# Project technical studies

The reading routes are `/projects/synapse/description` and
`/projects/autobg/description`. Both use `src/content/projectDocuments.ts`,
the existing code-native project diagrams, and the shared document layout.
The sidebar, reading progress, and scroll reveals are progressive enhancements;
the article text is server-rendered and stays available without JavaScript.

Design reference: https://antern.co/blogs/production-grade-ai-pr-review-agent/
Only its editorial structure is used, not its article text or illustrations.

## Update and export

1. Update the shared content and/or diagram components.
2. Start a local preview: `npm.cmd run dev -- --port 3200`.
3. Run `npm.cmd run docs:pdf -- http://localhost:3200`.
4. Run `npm.cmd run docs:check -- http://localhost:3200`.
5. Run `python tools/documents/inspect_pdfs.py` and review all rendered pages.

For scroll regressions, run `node tools/documents/check-document-scroll.mjs`.
It sends real wheel events over text, figures, tables, images, and code, checks
multi-frame vertical easing without snap-back, and checks sideways table scrolling.
Horizontal content uses `data-lenis-prevent-horizontal`, not the all-axis marker:
vertical gestures must remain with the page's smooth-scroll controller.

The exporter uses an isolated headless Chrome/Edge installation and print CSS.
It creates tagged, selectable-text PDFs in `output/pdf`, then copies them to
`public/projects/<slug>/description.pdf` for direct browser downloads. These are
static assets: production does not need Chrome, a PDF server, or extra npm modules.
Regenerate both PDFs whenever content changes so downloads match the live studies.

Python visual QA needs `pymupdf`, `pypdf`, and `pillow`. QA renders and contact
sheets are ignored under `tmp/pdfs`; final PDFs are intentionally retained.

## Evidence rules

- Synapse content basis: source snapshot `b79bb2dd2794981971996096dace1200015204c9`,
  project/evaluation documentation, and the supplied benchmark snapshots.
- AutoBG content basis: source snapshot `68252421347e752e0f1e0c66cc12b624d55169d0`
  and the project README/backend/demo.
- Benchmark snapshots and approximate README timings are labeled as supplied
  evidence, not new experiments. Do not invent sample counts or quality scores.
- Keep implementation details, deployment configuration, future hardening, and
  standalone experiments distinct.
