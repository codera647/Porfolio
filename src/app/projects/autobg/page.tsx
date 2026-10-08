import type { Metadata } from "next";
import Link from "next/link";
import ProjectPreviewVideo from "@/components/projects/ProjectPreviewVideo";
import {
  AutobgArchitectureDiagram,
  AutobgBackgroundDiagram,
  AutobgMattingDiagram,
  AutobgPlateDiagram,
  AutobgReflectionDiagram,
  AutobgRelightDiagram,
  AutobgTemplateDiagram,
} from "@/components/projects/AutobgDiagrams";
import styles from "../synapse/SynapseCaseStudy.module.css";
import autobg from "./AutobgCaseStudy.module.css";

export const metadata: Metadata = {
  title: "AutoBG — Abdul Moiz",
  description: "AI automotive imaging: high-resolution matting, grounded studio compositing, and controlled SDXL reflection generation.",
};

const models = [
  ["Matting", "ZhengPeng7/BiRefNet_HR", "Continuous alpha inference at a default internal resolution of 2048 × 2048."],
  ["Generation", "stabilityai/stable-diffusion-xl-base-1.0", "Shared inpainting pipeline for full backgrounds and floor-only reflections."],
  ["Conditioning", "diffusers/controlnet-canny-sdxl-1.0", "Canny edge guidance constrains generated content to the initialized vehicle structure."],
  ["VAE", "madebyollin/sdxl-vae-fp16-fix", "FP16 VAE used by the CUDA-based SDXL pipeline."],
  ["Optional relight", "Realistic Vision V5.1 + IC-Light FBC", "Independent SD1.5 module with foreground/background conditioning; not exposed by the current API."],
] as const;

const modules = [
  ["main", "Image decoding, validation, input downscaling, shared segmentation, mode dispatch, and binary PNG responses."],
  ["segment", "Cached BiRefNet model, ImageNet-normalized inference, continuous alpha, and source-resolution RGBA output."],
  ["compositing", "Studio plates, procedural templates, foreground recovery, vehicle placement, reflections, shadows, and deterministic realism."],
  ["reflect_gen", "Floor contour masks, geometric initialization, Canny guidance, SDXL inpainting, and feathered local paste-back."],
  ["aigen", "Shared FP16 SDXL loader, full-background generation, deglow, contact shadows, illumination matching, and edge integration."],
  ["make_plate / iclight", "Offline studio-plate preparation and a separate experimental conditioned-relighting module."],
] as const;

export default function AutobgCaseStudy() {
  return (
    <main className={`${styles.page} ${autobg.page}`}>
      <nav className={styles.nav} aria-label="Project navigation">
        <Link href="/#projects" className={styles.back}>← Back to projects</Link>
        <span>Abdul Moiz / Selected work</span>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroTopline}>
          <p>Projects / 02 / AutoBG</p>
          <p>Computer vision + generative imaging</p>
        </div>
        <h1>AutoBG</h1>
        <div className={styles.heroSummary}>
          <p className={styles.lede}>Everyday car photos.<br />Studio-ready results.</p>
          <div className={styles.heroActions}>
            <a href="#demo" className={styles.primaryAction}>See the demo <span aria-hidden="true">↓</span></a>
            <a href="#system" className={styles.secondaryAction}>Explore the system <span aria-hidden="true">↓</span></a>
            <Link href="/projects/autobg/description" className={styles.secondaryAction}>Read the technical study <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <ul className={styles.heroTags} aria-label="Project technologies">
          {['Computer vision', 'BiRefNet HR', 'SDXL', 'ControlNet', 'FastAPI', 'PyTorch / CUDA'].map((tag) => <li key={tag}>{tag}</li>)}
        </ul>
      </header>

      <section id="demo" className={`${styles.heroMedia} ${autobg.demo}`} aria-label="AutoBG product demonstration">
        <ProjectPreviewVideo
          className={`${styles.caseVideo} ${autobg.video}`}
          src="/projects/autobg/demo.mp4"
          poster="/projects/autobg/poster.jpg"
          label="AutoBG demo: car photo upload, generation, studio result, and PNG download"
          eager
        />
        <p className={autobg.demoCaption}>Upload a car photo → generate a studio composite → download the PNG.</p>
      </section>

      <section className={styles.intro} aria-labelledby="autobg-overview">
        <p className={styles.sectionIndex}>01 / The idea</p>
        <div className={styles.introGrid}>
          <h2 id="autobg-overview">Change the setting.<br />Keep the car.</h2>
          <div className={styles.introCopy}>
            <p>AutoBG turns a raw vehicle photograph into a composed studio image. High-resolution matting separates the car; a geometry-aware compositor places it, grounds the wheels, and integrates the lighting. Diffusion is applied where it adds value—not automatically across the entire image.</p>
            <dl>
              <div><dt>Problem</dt><dd>Inconsistent backgrounds, contaminated edges, and vehicles that look pasted into a scene.</dd></div>
              <div><dt>Approach</dt><dd>Shared segmentation + deterministic compositing + controlled generative refinement.</dd></div>
              <div><dt>Demo workflow</dt><dd>Upload → before / after → downloadable PNG. No manual masking.</dd></div>
              <div><dt>Interface</dt><dd>Next.js / React frontend; FastAPI image-processing backend.</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section id="system" className={styles.system} aria-labelledby="autobg-system">
        <header className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>02 / System architecture</p>
          <h2 id="autobg-system">One matte.<br />Three possibilities.</h2>
          <p>The browser sends a multipart image request to FastAPI. Input validation and segmentation are shared; the rendering mode determines how much of the scene is generated. Results return directly as PNG bytes.</p>
        </header>
        <AutobgArchitectureDiagram />
        <div className={styles.architectureNotes}>
          <article><span>01 / Template</span><h3>Consistency first.</h3><p>A fixed studio, geometric reflection, contour-following shadows, light wrap, and seeded grain. No diffusion after matting.</p></article>
          <article><span>02 / Reflect AI</span><h3>Generate selectively.</h3><p>The current UI uses White Studio + reflect_ai. SDXL refines a masked floor reflection while retaining the prepared car and surrounding studio.</p></article>
          <article><span>03 / AI background</span><h3>A new environment.</h3><p>Generate the wider background with SDXL, then harmonize and re-paste the car cutout with contact shadows and edge-aware integration.</p></article>
        </div>
      </section>

      <section className={styles.pipeline} aria-labelledby="autobg-matting">
        <header className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>03 / Matting &amp; compositing</p>
          <h2 id="autobg-matting">The small details<br />make it believable.</h2>
          <p>Mirrors, tires, and fine silhouette edges need a continuous alpha matte. Foreground-color recovery removes contamination from the old background. Shadows and reflections then follow the vehicle&apos;s actual contact contour, not just its bounding box.</p>
        </header>
        <div className={`${styles.diagramGrid} ${autobg.diagrams}`}>
          <AutobgMattingDiagram />
          <AutobgTemplateDiagram />
        </div>
        <ul className={styles.agentList} aria-label="Compositing design decisions">
          <li><span>01</span><div><h3>Clean the edge.</h3><p>PyMatting foreground estimation is preferred; guided color diffusion is the fallback. A one-pixel contraction and anti-aliasing reduce the faint background rim.</p></div></li>
          <li><span>02</span><div><h3>Find the ground.</h3><p>The lowest opaque pixel in each column anchors the reflection and shadow contour, adapting to side, front, and three-quarter views.</p></div></li>
          <li><span>03</span><div><h3>Integrate the light.</h3><p>The template path applies white-balance correction and floor bounce before compositing, then finishes with light wrap and deterministic grain.</p></div></li>
        </ul>
      </section>

      <section className={styles.visuals} aria-labelledby="autobg-generation">
        <header className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>04 / Controlled generation</p>
          <h2 id="autobg-generation">Give AI a boundary.</h2>
          <p>A geometric mirror provides the reflection&apos;s initial color and shape. A contour-following mask limits the edit; Canny conditioning guides SDXL. The output is blended with the geometric result and pasted back only through the softened floor mask.</p>
        </header>
        <AutobgReflectionDiagram />
        <AutobgBackgroundDiagram />
        <div className={styles.modelGrid}>
          <div className={styles.modelIntro}><p>Model roster</p><h3>Matting, generation,<br />and conditioning.</h3></div>
          <dl>
            {models.map(([role, model, detail]) => (
              <div key={role}><dt>{role}</dt><dd><strong className={autobg.modelName}>{model}</strong><span className={autobg.modelDetail}>{detail}</span></dd></div>
            ))}
          </dl>
        </div>
      </section>

      <section className={styles.foundation} aria-labelledby="autobg-tooling">
        <header className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>05 / Supporting tools</p>
          <h2 id="autobg-tooling">Reusable studios.<br />Room to experiment.</h2>
          <p>An offline plate builder reconstructs an empty studio from a reference photograph. A separate IC-Light experiment conditions relighting on both foreground and background. These are supporting modules, not extra steps in every request.</p>
        </header>
        <div className={`${styles.diagramGrid} ${autobg.diagrams}`}>
          <AutobgPlateDiagram />
          <AutobgRelightDiagram />
        </div>
        <ul className={styles.agentList} aria-label="Backend modules">
          {modules.map(([name, detail], index) => (
            <li key={name}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{name}</h3><p>{detail}</p></div></li>
          ))}
        </ul>
      </section>

      <section className={styles.evaluation} aria-labelledby="autobg-performance">
        <header className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>06 / Runtime tradeoffs</p>
          <h2 id="autobg-performance">Choose the work<br />the image needs.</h2>
          <p>Template composition prioritizes consistency and speed. Reflection inpainting spends GPU time on a narrow edit; full-background generation spends more on the wider scene. These are approximate NVIDIA L4 timings reported in the project README, not new portfolio benchmarks.</p>
        </header>
        <div className={autobg.timings}>
          <article><p>Template composite</p><strong>~0.7s</strong><span>Matting + deterministic studio compositing.</span></article>
          <article><p>AI reflection</p><strong>~13s</strong><span>Matting + fixed studio + SDXL floor reflection.</span></article>
          <article><p>AI background</p><strong>~18s</strong><span>Matting + full SDXL background generation.</span></article>
        </div>
        <p className={autobg.runtimeNote}>Model loading and warmup are separate from request timings. Actual runtime depends on image size, configuration, and GPU. SDXL is cached and optionally preloaded at startup.</p>
      </section>

      <footer className={styles.footer}>
        <p>Next project / Custom agent harness</p>
        <Link href="/projects/trailforge">Explore Trailforge <span aria-hidden="true">↗</span></Link>
        <Link href="/#projects">← Back to selected work</Link>
      </footer>
    </main>
  );
}
