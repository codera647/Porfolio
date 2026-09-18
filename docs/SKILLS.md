# Claude skills for animation and web development

Compiled 2026-09-13 for the Abdul Moiz portfolio build. Everything here was pulled from the published skill lists of each source. The individual SKILL.md files were not read, so treat the descriptions as the authors' claims.

**Important:** skills installed in the Claude desktop app do not carry over to Claude Code in VS Code. Install them again there.

---

## 1. Animation collections

### Claude Design Skillstack, 22 skills plus 5 bundles

```
/plugin marketplace add freshtechbro/claudedesignskills
/plugin install <skill-or-bundle-name>
```

| Skill | Covers |
|---|---|
| `threejs-webgl` | Three.js WebGL/WebGPU rendering and scene management |
| `gsap-scrolltrigger` | GSAP with scroll driven timeline choreography |
| `react-three-fiber` | Declarative 3D React components on Three.js |
| `motion-framer` | Framer Motion gestures, layout animation |
| `babylonjs-engine` | Babylon.js physics and advanced 3D |
| `aframe-webxr` | WebXR, VR/AR, 360 experiences |
| `lightweight-3d-effects` | Zdog, Vanta.js, Vanilla Tilt |
| `playcanvas-engine` | PlayCanvas game engine |
| `pixijs-2d` | PixiJS 2D canvas and particles |
| `locomotive-scroll` | Smooth scrolling, parallax |
| `barba-js` | SPA style page transitions |
| `react-spring-physics` | Physics based spring motion |
| `animated-component-libraries` | Magic UI and **React Bits** prebuilt components |
| `scroll-reveal-libraries` | AOS scroll triggered reveals |
| `animejs` | Anime.js timelines, SVG morphing, staggers |
| `lottie-animations` | Lottie JSON from After Effects |
| `blender-web-pipeline` | Blender glTF export and optimisation |
| `spline-interactive` | Spline 3D pipeline |
| `rive-interactive` | Rive state machines |
| `substance-3d-texturing` | PBR materials for web |
| `web3d-integration-patterns` | Multi library integration architecture |
| `modern-web-design` | Design trends, UX practice, accessibility |

Bundles: `core-3d-animation`, `extended-3d-scroll`, `animation-components`, `authoring-motion`, `meta-skills`.

### Web Animation Skills, 9 skills

```
npx skills add iart-ai/web-animation-skills
```

| Skill | Covers |
|---|---|
| `gsap-web` | GSAP timelines, ScrollTrigger, SplitText, Flip, Lenis sync |
| `60fps-animation` | Animate transform and opacity only, kill layout thrash |
| `page-transition-animation` | Next.js App Router enter/exit, AnimatePresence exit fixes |
| `accessible-animation` | prefers-reduced-motion that scales back rather than deletes |
| `micro-interaction` | Hover, press, toggles, toasts, drawers, list animation |
| `glassmorphism` | Backdrop filters, edge highlights, specular sweeps, fallbacks |
| `svg-animation` | Stroke drawing, path morphing, motion along path |
| `lottie-animation` | Lottie/dotLottie playback, theming, cross platform export |
| `ascii-animation` | Generative ASCII fields, image/video/3D to ASCII |

---

## 2. Next.js, React and frontend quality

### Vercel agent skills

```
npx skills add vercel-labs/agent-skills
```

| Skill | Covers |
|---|---|
| `react-best-practices` | 40+ React and Next.js performance rules |
| `web-design-guidelines` | 100+ accessibility, performance and UX compliance rules |
| `react-view-transitions` | React View Transition API for page and component transitions |
| `composition-patterns` | Compound components instead of boolean prop sprawl |
| `react-native-guidelines` | React Native rules, not needed here |
| `vercel-optimize` | Cost, performance and reliability audit of a Vercel project |
| `writing-guidelines` | 80+ rules for docs and prose |
| `vercel-deploy-claimable` | Instant claimable Vercel deployments |

### Anthropic official

```
/plugin marketplace add anthropics/skills
npx skills add https://github.com/anthropics/skills --skill frontend-design
```

Relevant ones: `frontend-design` (typography, colour systems and spatial composition decided before code), `webapp-testing`, `artifacts-builder`, `canvas-design`, `algorithmic-art`, `theme-factory`, `brand-guidelines`, `mcp-builder`, plus the document skills (pdf, docx, pptx, xlsx).

### Optional

`remotion-best-practices` via `npx skills add remotion-dev/skills` if programmatic video in React ever becomes part of the site.

---

## 3. Already enabled in the Claude desktop session

These are live in the Cowork session, not in VS Code. Reinstall separately if wanted there.

`ui-ux-pro-max` (UI/UX database: styles, palettes, font pairings, UX guidelines, chart types across 10 stacks), `ui-ux-pro-max:ui-styling` (shadcn/ui and Tailwind), `ui-ux-pro-max:design-system`, `figma:figma-design-to-code`, `figma:figma-implement-motion`, `figma:figma-use-motion`, `figma:figma-shaders`, `design:design-system`, `design:design-critique`, `design:accessibility-review`, `design:design-handoff`, `accesslint:audit`, `accesslint:scan`, `accesslint:diff`, `engineering:architecture`, `engineering:code-review`, `engineering:debug`, `engineering:testing-strategy`, `artifact-design`, `artifact-diagramming`, `dataviz`.

---

## 4. Recommended install for this build

Installing all 40+ makes the agent's skill selection worse, not better. This is the focused set that actually maps to the portfolio:

```
npx skills add iart-ai/web-animation-skills
npx skills add vercel-labs/agent-skills
npx skills add https://github.com/anthropics/skills --skill frontend-design

/plugin marketplace add freshtechbro/claudedesignskills
/plugin install animation-components
/plugin install core-3d-animation
/plugin install meta-skills
```

That covers the signature draw, the card entrance, the pointer reactive name, the rotating title, reduced motion, Next.js correctness and accessibility, and leaves the 3D stack available for later without pulling in Babylon, PlayCanvas, A-Frame, Substance and the rest.

---

## 5. Skill to task mapping

| Build stage (from HANDOFF.md) | Skills to load |
|---|---|
| 1. Signature SVG draw on | `svg-animation`, `animejs`, `gsap-web` |
| 2. Rotating Engineer / Architect title | `animated-component-libraries` (covers React Bits), `motion-framer` |
| 3. Next.js scaffold | `react-best-practices`, `composition-patterns`, `frontend-design` |
| 4. Card entrance, pointer glow, name proximity | `motion-framer`, `gsap-scrolltrigger`, `60fps-animation`, `micro-interaction` |
| 5. Responsive and reduced motion | `accessible-animation`, `web-design-guidelines` |
| 6. Verification | `web-design-guidelines`, `accesslint:audit` if available, `webapp-testing` |
| Later: section transitions | `page-transition-animation`, `react-view-transitions` |
| Later: liquid glass UI | `glassmorphism` |
| Later: WebGL and ShaderGradient | `threejs-webgl`, `react-three-fiber` |

---

## Sources

- https://github.com/freshtechbro/claudedesignskills
- https://github.com/iart-ai/web-animation-skills
- https://github.com/vercel-labs/agent-skills
- https://github.com/anthropics/skills
- https://www.firecrawl.dev/blog/best-claude-code-skills
