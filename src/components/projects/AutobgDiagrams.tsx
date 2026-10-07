import { Arrow, FlowRow, Node, Shell } from "./SynapseDiagrams";
import styles from "./SynapseDiagrams.module.css";
import autobg from "./AutobgDiagrams.module.css";

// Source: codera647/autobg @ 68252421347e752e0f1e0c66cc12b624d55169d0.
// Match executable backend behavior where README diagrams differ from the code.

export function AutobgArchitectureDiagram() {
  return (
    <Shell project="AutoBG" title="One upload. Three rendering paths."
      columns={["Browser", "Shared backend", "Mode dispatch"]}
      caption="Every request starts with the same matte. The UI requests reflect_ai; the API defaults to template when no mode is supplied.">
      <div className={styles.architecture}>
        <div className={styles.stack}>
          <Node title="Next.js interface" detail="upload · before / after · download" />
          <Arrow down />
          <Node title="POST /process" detail="FormData: file + template + mode" accent />
          <Arrow down />
          <Node title="PNG response" detail="blob → preview + local download" />
        </div>
        <Arrow />
        <div className={styles.stack}>
          <Node title="FastAPI gateway" detail="decode RGB · validate · downscale ≤ 2048px" accent />
          <Arrow down />
          <Node title="BiRefNet HR" detail="PyTorch inference → continuous RGBA matte" />
          <Arrow down />
          <Node title="Mode router" detail="shared cutout → selected renderer" accent />
        </div>
        <Arrow />
        <div className={styles.stack}>
          <Node title="template" detail="compositing · no diffusion" />
          <Node title="reflect_ai" detail="reflect_gen · floor-only inpainting" accent />
          <Node title="ai" detail="aigen · full background inpainting" />
          <div className={autobg.note}>reflect_ai + ai reuse one cached SDXL / ControlNet pipeline.</div>
        </div>
      </div>
    </Shell>
  );
}

export function AutobgMattingDiagram() {
  return (
    <Shell project="AutoBG" title="A matte, not a binary cutout"
      columns={["Prepare", "Infer", "Restore", "Refine"]}
      caption="The continuous alpha returns to the input resolution. Template and reflection paths then recover foreground colors before tightening the edge.">
      <FlowRow nodes={[
        { title: "RGB photograph", detail: "resize to 2048² · ImageNet normalization" },
        { title: "BiRefNet HR", detail: "forward pass → sigmoid alpha", accent: true },
        { title: "RGBA cutout", detail: "LANCZOS alpha resize to source dimensions" },
        { title: "Edge refinement", detail: "foreground recovery · tighten · anti-alias", accent: true },
      ]} />
      <div className={styles.persisted}>Foreground recovery: PyMatting ML estimation when available → color-decontamination fallback otherwise.</div>
    </Shell>
  );
}

export function AutobgTemplateDiagram() {
  return (
    <Shell project="AutoBG" title="The deterministic studio compositor"
      columns={["Prepare the scene", "Ground the vehicle", "Integrate the result"]}
      caption="This is the template path after segmentation. Geometry, contact shadows, reflection, lighting, and seeded grain are handled with NumPy, OpenCV, and Pillow.">
      <div className={styles.architecture}>
        <div className={styles.stack}>
          <Node title="Studio background" detail="saved PNG plate or procedural wall + floor" accent />
          <Arrow down />
          <Node title="Prepare foreground" detail="clean edges · white balance · floor bounce" />
        </div>
        <Arrow />
        <div className={styles.stack}>
          <Node title="Scale & place" detail="70% canvas width · height capped at 56%" />
          <Arrow down />
          <Node title="Contact contour" detail="lowest opaque pixel in each column" accent />
          <Arrow down />
          <Node title="Reflection + shadow" detail="mirror per column · ambient band + dark core" />
        </div>
        <Arrow />
        <div className={styles.stack}>
          <Node title="Composite the car" detail="studio → reflection → shadow → foreground" accent />
          <Arrow down />
          <Node title="Realism finish" detail="screen-blended light wrap · seeded film grain" />
          <Arrow down />
          <Node title="Studio PNG" detail="1200 × 900 · RGB" />
        </div>
      </div>
    </Shell>
  );
}

export function AutobgReflectionDiagram() {
  return (
    <Shell project="AutoBG" title="Generate the reflection. Preserve the scene."
      columns={["Build an initialization", "Constrain diffusion", "Blend back locally"]}
      caption="Only the feathered floor band is pasted back into the base composite. The vehicle geometry is not regenerated, and the studio outside that mask is retained.">
      <div className={styles.architecture}>
        <div className={styles.stack}>
          <Node title="Base composite" detail="studio + contact shadow + prepared car" />
          <Arrow down />
          <Node title="Geometric mirror" detail="per-column contact · fade · distance blur" accent />
          <Arrow down />
          <Node title="Initialization image" detail="base + geometric floor reflection" />
        </div>
        <Arrow />
        <div className={styles.stack}>
          <Node title="Floor-only mask" detail="contact contour · 50% of car height · feather" accent />
          <Arrow down />
          <Node title="Canny conditioning" detail="edges from the initialization image" />
          <Arrow down />
          <Node title="SDXL + ControlNet" detail="1024² · 22 steps · strength 0.32 · seed 7" accent />
        </div>
        <Arrow />
        <div className={styles.stack}>
          <Node title="Blend AI + geometry" detail="50 / 50 by default · soften with blur" />
          <Arrow down />
          <Node title="Masked paste-back" detail="take only the refined floor region" accent />
          <Arrow down />
          <Node title="Final composite" detail="1200 × 900 · PNG response" />
        </div>
      </div>
    </Shell>
  );
}

export function AutobgBackgroundDiagram() {
  return (
    <Shell project="AutoBG" title="Full-background generation"
      columns={["Condition", "Generate", "Ground", "Match"]}
      caption="The ai path generates a new scene, then harmonizes and re-pastes the original cutout. Default generation is 1024 × 1024; it is a separate path from floor-only reflection.">
      <FlowRow nodes={[
        { title: "Place the cutout", detail: "gray canvas · background mask · Canny edges" },
        { title: "SDXL inpainting", detail: "template prompt · 30 steps · guidance 7", accent: true },
        { title: "Ground the scene", detail: "deglow · ambient shadow · wheel cores" },
        { title: "Match illumination", detail: "LAB color + exposure harmonization", accent: true },
      ]} />
      <div className={styles.persisted}>Finish → guided-filter alpha → paste original cutout → light wrap → film grain.</div>
    </Shell>
  );
}

export function AutobgPlateDiagram() {
  return (
    <Shell project="AutoBG" title="Build a reusable studio plate"
      columns={["Reference", "Remove", "Reconstruct", "Reuse"]}
      caption="make_plate is an offline preparation utility. The compositor loads plates/white_studio.png when it exists, otherwise it builds the background procedurally.">
      <FlowRow nodes={[
        { title: "Reference photo", detail: "plates/reference.png or .jpg" },
        { title: "Mask the vehicle", detail: "BiRefNet alpha → 35 × 35 dilation", accent: true },
        { title: "Empty-studio inpaint", detail: "SDXL · 30 steps · ControlNet disabled" },
        { title: "Save the plate", detail: "resize back → white_studio.png", accent: true },
      ]} />
    </Shell>
  );
}

export function AutobgRelightDiagram() {
  return (
    <Shell project="AutoBG" title="Optional IC-Light relighting module"
      columns={["Conditioning images", "Patched SD1.5", "Relit output"]}
      caption="iclight is present as an independent experiment; main does not expose it as a processing mode. It is not part of the demo's reflect_ai path.">
      <div className={styles.architecture}>
        <div className={styles.stack}>
          <Node title="Foreground on gray" detail="car cutout normalized on a 512² canvas" />
          <Node title="Studio background" detail="template image resized to 512²" />
          <Arrow down />
          <Node title="VAE encoding" detail="foreground + background → 8 conditioning channels" accent />
        </div>
        <Arrow />
        <div className={styles.stack}>
          <Node title="UNet: 4 → 12 channels" detail="noisy latent + foreground + background" accent />
          <Arrow down />
          <Node title="IC-Light FBC offsets" detail="additive weight merge · hooked forward pass" />
        </div>
        <Arrow />
        <div className={styles.stack}>
          <Node title="SD1.5 relight" detail="25 steps · foreground + background conditioning" accent />
          <Arrow down />
          <Node title="Upscale the result" detail="512² → 1024² · LANCZOS" />
        </div>
      </div>
    </Shell>
  );
}
