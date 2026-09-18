# Animation and graphics toolkit

Repos Nex asked to keep on hand (2026-09-13). Stated intent: "we will be using them more often." Reach for these before hand rolling an effect.

| Repo | What it is | Best used for |
|---|---|---|
| https://github.com/pmndrs/react-three-fiber | Declarative React renderer for three.js. Scene as reusable components that react to state. | The substrate for any WebGL in a React app. Also the peer dependency ShaderGradient rides on. Not usually needed on its own for 2D atmosphere. |
| https://github.com/ruucm/shadergradient | Customizable animated 3D gradient for React. v2 ships only the `ShaderGradient` renderer plus canvas helper; stateless UI moved to `@shadergradient/ui`. | Rich ambient gradient fields behind a section. Strong for a contact/footer backdrop or a heavier hero variant. Needs opacity discipline where text contrast is specified. |
| https://github.com/dashersw/liquid-glass-js | WebGL glass components with real-time refraction, blur and masking. | Sparingly: a nav pill, a floating control, a project card hover. Note the portfolio brief explicitly rejects "excessive glass panels" and a "floating glass slab", so it must stay off the hero card. |
| https://github.com/collidingScopes/liquid-logo | Turns static logos/images into flowing liquid-metal animations. | A treatment for the signature mark in the footer, or a hover state on the nav signature. Cannot replace the pen-stroke intro, which the brief requires to be a true stroke reveal preserving letterforms. |

## Judgment notes for the portfolio build

The hero's pointer glow is specified with hard contrast bounds (orange at 22%, amber at 12%, normal compositing, no additive/screen unless separately verified). Two blurred radial fields in CSS or a small canvas hit that spec exactly, cost almost nothing, and are trivially freezable for reduced motion. A WebGL gradient canvas behind the hero would be heavier and harder to hold inside those bounds, so ShaderGradient is a better fit further down the page than in the hero itself.

react-three-fiber only needs to enter the dependency tree at the point ShaderGradient or another WebGL piece does. The hero card's perspective entrance (X rotation 65 to 72 degrees, scale 0.88 to 1, 800 ms) is a CSS 3D transform, not a three.js job.