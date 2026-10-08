import Link from "next/link";
import Image from "next/image";
import { readingMinutes, type DocumentBlock, type ProjectDocument as Document } from "@/content/projectDocuments";
import DocumentEnhancements from "./DocumentEnhancements";
import { DocumentFigure } from "./DocumentFigures";
import styles from "./ProjectDocument.module.css";

function DownloadIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" /></svg>;
}

function Contents({ document }: { document: Document }) {
  return <nav aria-label={`${document.name} document contents`} data-doc-toc>
    <a href="#frontispiece" className={styles.tocLink}><span>00</span>Frontispiece</a>
    {document.sections.map((section, index) => {
      const showPart = index === 0 || document.sections[index - 1].part !== section.part;
      return <div key={section.id}>
        {showPart && <p className={styles.tocPart}>{section.part}</p>}
        <a href={`#${section.id}`} className={styles.tocLink}><span>{section.number}</span>{section.title}</a>
      </div>;
    })}
  </nav>;
}

function Block({ block }: { block: DocumentBlock }) {
  switch (block.type) {
    case "paragraph": return <p className={styles.paragraph} data-doc-reveal>{block.text}</p>;
    case "heading": return <h3 className={styles.subheading} data-doc-reveal>{block.text}</h3>;
    case "list": return <ul className={styles.list} data-doc-reveal>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
    case "note": return <aside className={styles.note} data-doc-reveal><p className={styles.noteLabel}>{block.label}</p><p>{block.text}</p></aside>;
    case "table": return <div className={styles.tableWrap} tabIndex={0} role="region" aria-label={`${block.columns.join(", ")} table`} data-lenis-prevent-horizontal>
      <table><thead><tr>{block.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
        <tbody>{block.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cellIndex} scope="row">{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>;
    case "code": return <figure className={styles.code}><figcaption>{block.label}</figcaption><pre tabIndex={0} data-lenis-prevent-horizontal><code>{block.text}</code></pre></figure>;
    case "diagram": return <DocumentFigure id={block.id} />;
    case "image": return <figure className={styles.imageFigure}>
      <Image src={block.src} alt={block.alt} width={block.width} height={block.height} sizes="(max-width: 900px) 92vw, 900px" loading="lazy" className={styles.image} />
      <figcaption>{block.caption}</figcaption>
    </figure>;
  }
}

export default function ProjectDocument({ document }: { document: Document }) {
  const pdf = `/projects/${document.slug}/description.pdf`;
  return <main className={styles.page} data-project-document={document.slug}>
    <DocumentEnhancements documentId={document.slug} />
    <a href="#document-body" className={styles.skipLink}>Skip to document</a>
    <header className={styles.topbar}>
      <Link href={`/projects/${document.slug}`} className={styles.back}>&larr; <span>{document.name}</span></Link>
      <span className={styles.topbarLabel}>Abdul Moiz / Engineering studies</span>
      <a className={styles.download} href={pdf} download={`${document.name}-technical-description.pdf`}><DownloadIcon /> Download PDF</a>
      <div className={styles.readingProgress} data-reading-progress role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} />
    </header>

    <div className={styles.layout}>
      <aside className={styles.sidebar} data-desktop-toc data-lenis-prevent>
        <p className={styles.sidebarLabel}>{document.name} / Technical study</p>
        <Contents document={document} />
        <a className={styles.sidebarDownload} href={pdf} download={`${document.name}-technical-description.pdf`}><DownloadIcon /> Take the study offline</a>
      </aside>
      <details className={styles.mobileContents}>
        <summary>Contents <span>12 chapters + figures</span></summary>
        <div data-lenis-prevent><Contents document={document} /></div>
      </details>

      <article id="document-body" className={styles.article} aria-label={`${document.name} technical description`}>
        <header id="frontispiece" className={styles.frontispiece}>
          <p className={styles.eyebrow}>{document.subtitle}</p>
          <h1>{document.title}</h1>
          <p className={styles.abstract}>{document.abstract}</p>
          <div className={styles.byline}><span>Written by Abdul Moiz</span><span>{readingMinutes(document)} min read</span><span>Architecture + implementation</span></div>
          <ul className={styles.tags} aria-label="Study topics">{document.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
          <aside className={styles.introduction}>
            <p><strong>How to read this study.</strong> Start with the problem, follow the implementation through its boundaries, then examine the evidence and tradeoffs. The diagrams are system maps; the tables make configuration and responsibilities explicit.</p>
            <p>Implemented behavior, reported results, and future hardening are kept separate. Use the contents to jump to a chapter, or read from top to bottom. The PDF includes the complete text, figures, and graphs.</p>
          </aside>
          <nav className={styles.printContents} aria-label="Printed document contents">
            <p>In this study</p>
            <ol>{document.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}><span>{section.number}</span>{section.title}</a></li>)}</ol>
          </nav>
        </header>

        {document.sections.map((section) => <section id={section.id} data-doc-section key={section.id} className={styles.chapter} aria-labelledby={`heading-${section.id}`}>
          <p className={styles.part}>{section.part}</p>
          <div className={styles.chapterHeading} data-doc-reveal><span>{section.number}</span><h2 id={`heading-${section.id}`}>{section.title}</h2></div>
          {section.blocks.map((block, index) => <Block key={`${section.id}-${index}`} block={block} />)}
        </section>)}

        <footer className={styles.documentFooter}>
          <p>You&apos;ve reached the end of the study.</p>
          <div><Link href={`/projects/${document.slug}`}>&larr; Back to {document.name}</Link><a className={styles.download} href={pdf} download={`${document.name}-technical-description.pdf`}><DownloadIcon /> Download the complete PDF</a></div>
        </footer>
      </article>
    </div>
  </main>;
}
