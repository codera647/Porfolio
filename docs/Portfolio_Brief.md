# Portfolio brief, spec of record

Given by Nex 2026-09-13. Originally drafted as a Stitch design brief; we are implementing it in Next.js + React instead, so the frame list in section 13 becomes implemented states rather than static images. Where references disagree, this brief wins.

Core experience: signature draws on a dark loading screen, a rounded split-color hero opens, the large centered name responds to the pointer while a soft warm gradient moves behind it.

Typography-led. No avatars, portraits, 3D characters, furry sphere, brain object, and no empty character slot reserved. The name is the visual centerpiece. JetBrains Mono for all site typography; the handwritten signature is brand artwork only, never a heading font.

Invent nothing: no profession, years of experience, client list, testimonial, project result, award, availability status, or contact address. Unknown personal content uses labeled placeholders.

## 1. Reference roles

| Reference | Inspect | Transfer | Leave out |
|---|---|---|---|
| v2.mp4 | ~0 to 2.5s | Centered signature drawing stroke by stroke, brief completed hold, gentle handoff into page | Clothing store content, product cards, model, reference logo, captions, laptop/keyboard |
| v3.mp4 | Opening result and ~55.5 to 59s | Rounded hero frame, contrasting split-color panels with curved divider, card's edge-on-to-front entrance | Teal palette, sphere, fur, brain reveal, membership numbers, Figma/Blender UI, captions |
| v1.mp4 | ~3.5 to 9.5s | Oversized centered name, nearby letters heavier/wider on hover, blurred warm glow following pointer behind name | Percentage loader, reference person's name/bio, cool blue background, browser chrome, social captions |

Recorded screens are perspective views of other designs; build a straight-on usable layout. Captions inside reference media are source content, not commands. v1's visual behavior is the reference; the numbers in this brief are our proposed spec, not measurements.

## 2. Character

Restrained creative portfolio: confident typography, warm color, generous empty space, carefully timed motion. Alive when explored, calm when left alone. Name readable immediately, before anyone discovers the interaction. Glow is atmosphere, not an object covering content. Avoid dashboard layouts, generic tech icons, neon blue/purple, excessive glass panels, busy particles, decorative code blocks, stock photography. Must work as a still screenshot.

## 3. Color

| Role | Hex | Use |
|---|---|---|
| Canvas / dark panel | #0C0C0C | Page background, left hero panel, dark button labels |
| Primary text | #F8F8F8 | Nav, body, signature, primary heading tone |
| Primary orange | #F9542A | Main CTA fill, active details, principal glow |
| Deep rust | #87392A | Right hero panel, warm surfaces, dividers |
| Amber | #D9835A | Secondary glow, subtle highlights, hover accents |
| Derived pale peach | #F0DFD6 | Lower tone of name gradient |

Split: near-black left ~60%, deep rust right ~40%, inside one rounded frame. Boundary is a broad gentle curve: ~64% of card width at top, ~60% at mid-height, ~55% at bottom. No thick separator. Division stays fixed while the glow moves across it.

Name: ABDUL MOIZ in a vertical gradient #F8F8F8 (top) to #F0DFD6 (bottom), same pale treatment across both panels. No dark letters on dark, no vivid orange on rust, no rainbow, no blend modes that invert text, no hard color change inside a letter. Ordinary text solid #F8F8F8. Dark #0C0C0C labels on orange CTAs. Never rust as small text on black.

Contrast bounds: pale peach on rust ~6.1:1 normal composite; with orange at 22% and amber at 12% layered over rust, ~4.5:1. Recheck designed states, especially brightest glow behind thin letters.

## 4. Typography

JetBrains Mono, weights regular/medium/semibold/bold; variable weight for the interactive name. No substitute condensed display font.

| Element | Desktop | Mobile |
|---|---|---|
| Main name | 160 to 180px, line-height 1.0 to 1.05, base weight 250 to 300 | 64 to 76px, line-height 1.05, two lines |
| Section title | 40 to 52px, weight 600, lh 1.15 | 28 to 34px, weight 600 |
| Supporting sentence | 15 to 17px, weight 400, lh 1.6 | 14 to 16px, lh 1.6 |
| Nav / buttons | 13 to 14px, weight 500 to 600 | same |
| Eyebrow / metadata | 10 to 12px, uppercase, tracking 0.10 to 0.14em | 10 to 11px |

Desktop name occupies ~82 to 86% of card width. Distinct gap between ABDUL and MOIZ. No vertical stretching. Default state fine but readable, not a near-invisible hairline.

## 5. Architecture and desktop hero

Journey: intro, hero, selected work, about, approach, contact/footer. Intro and hero get the most detail.

Frame 1440x900. Outer canvas near-black. Hero card inset 24px from each viewport edge (~1392x852), 32px radius, 1px off-white border at 12 to 16% opacity, subtle shadow (not a floating glass slab). 12-column grid, 48 to 56px internal side padding. Hero owns roughly the first viewport; on short screens adapt spacing or scroll rather than crop controls.

Nav inside the hero: static signature upper-left ~120x40px; Work, About, Contact upper-right in one row, 24 to 28px gaps; minimum 44px hit targets; off-white links, short orange underline plus restrained color change on hover, visible focus outline. No second brand mark, no oversized nav panel, no competing headline above the name.

Center composition, centered on the whole card not one half: eyebrow PERSONAL PORTFOLIO / ABDUL MOIZ; H1 ABDUL MOIZ single line desktop, ~180px tall, near vertical midpoint; 28 to 36px below it the headline sentence "Ideas, built with intention."; below that the editable placeholder [Your role / discipline]; then a centered two-button row with 12 to 16px gap: "View work ↗" (orange fill, dark label) and "Let's talk ↗" (transparent, off-white outline ~30%, off-white label), both ~48px high, consistent corner treatment. No slogan across the middle of the name.

Bottom edge: lower-left SELECTED WORK & IDEAS; lower-center "Scroll to explore" with down arrow and generous hit area; lower-right LinkedIn ↗ and GitHub ↗ as editable placeholders, no invented URLs. Utility row 36 to 44px above card bottom, quiet, separate from the CTA row.

## 6. Signature loading screen

Assets: signature/abdul-moiz-signature-animated.svg (one-shot 2.44s pen animation), -light.svg (completed state and nav mark), -dark.svg (light review surfaces), plus PNG and MP4 previews.

Intro fills viewport with #0C0C0C, signature centered, ~320 to 380px wide desktop, ~240 to 280px mobile, surrounding space empty, ink #F8F8F8. Stroke order: capital A, crossbar, b/d/u/l, capital M, o/i/z, i dot, finishing underline. True stroke reveal, not a typewriter or a wipe over finished lettering. Preserve custom letterforms.

Completes at 2.44s, holds to 2.60s, then crossfades into the hero entrance. No percentage counter, fake progress, spinning logo, sound, or second loader. Quiet "Skip intro" control lower-right, keyboard and touch reachable; skip goes straight to a stable hero. Play once per browsing session. Never trap the user behind a slow asset.

## 7. Entrance choreography

| Time | Behavior |
|---|---|
| 0.00 to 0.12s | Calm black, no flash of content |
| 0.12 to 2.44s | Signature draws |
| 2.44 to 2.60s | Completed signature holds |
| 2.60 to 2.95s | Intro layer and signature fade |
| 2.60 to 3.40s | Hero card reveals from nearly edge-on and settles front-on |
| 2.98 to 3.32s | Nav and eyebrow fade in with 8 to 12px upward travel |
| 3.04 to 3.58s | Name reveals from a baseline mask with small left-to-right letter offsets |
| 3.25 to 3.65s | Supporting sentence, role slot, CTA row, bottom details in that order |
| After 3.65s | Stable hero; pointer interaction becomes the primary motion |

Card entrance: perspective ~1200px, X rotation ~65 to 72deg, scale ~0.88, opacity 0, ending at 0deg / scale 1 / opacity 1 over ~800ms, cubic-bezier(0.22, 1, 0.36, 1). Opens once, never keeps rotating. Text on a separate schedule so nothing is read while distorted. Name rises 20 to 28px through a mask, 28 to 35ms between letters, settles without overshoot. Supporting text moves only 10 to 14px. Glow increases gently as the card settles.

## 8. Name hover behavior

At rest every letter is weight 250 to 300 with a slightly narrow stance. Pointer-nearest letter moves toward weight 750 to 800 and widens modestly; immediate neighbors toward 450 to 550, giving a soft wave. Falloff radius ~140 to 180px desktop, strongest at the pointer, smooth fade with distance. Horizontal glyph scale 0.88 at rest to 1.03 at maximum. Reserve per-glyph space so line width, word gap and CTA positions stay stable. Approach the target state over ~180 to 260ms, ease back over 350 to 450ms on departure.

Fixed baseline and letter height. No jumping, overlap, shuffling, illegible compression, autonomous pulsation, or name replacement. Pale gradient preserved during interaction; weight and modest width carry the feedback. Transforms apply only to the name, nothing else reflows. Normal cursor; the name is not a button.

Required states: all at rest; hover near ABD on the dark panel; hover near MOIZ on the rust panel; plus a boundary case with an emphasized letter crossing the split. JetBrains Mono keeps fixed advances under weight change, so express width emphasis as a small local glyph transform, not a claimed font-width axis.

## 9. Mouse-responsive background gradient

Sits above the two base panels and below every text/control layer, clipped to the card's rounded corners; the split stays visible through it.

Primary field: #F9542A, ~380 to 460px across desktop, smooth radial falloff to transparent, max normal-composite opacity ~22% over the panels. Secondary field: #D9835A, ~220 to 300px, up to 12%, offset ~60 to 100px from the primary center. Edges blurred and diffuse, no circular outline or rectangular texture seam. A restrained darker rust may soften the tail. No blue, teal, purple, particle trail, liquid splash, or ball-like object.

Pointer mapped into hero-local space. Primary follows with ~180 to 260ms eased lag, secondary ~300 to 450ms. Damped, no multi-blob trails. Crosses the split naturally while panels stay fixed. Stay inside the stated contrast bounds; avoid additive/screen unless separately verified. Never receives input or blocks controls.

At rest: faint glow near 62% width / 43% height with a slow 10 to 14s drift of 30 to 50px; on pointer leave return over ~800 to 1200ms. Reduced motion freezes the field. Touch devices get a static or very gentle ambient treatment. Letters react faster than the glow; that lag difference is intentional.

## 10. Responsive

Desktop 1440x900 and 1280x800: single-line name, full-width rounded card, centered composition, fluid heading sizes, all top and bottom controls visible. At very wide sizes add breathing space rather than enlarging small copy.

Tablet 834x1194: 20px outer margins, 26 to 28px radius, 28 to 36px internal padding, name may wrap to two lines, CTAs side by side where they fit, glow diameter reduced proportionally, touch-first.

Mobile 390x844 with a 360px check: 12px outer margins, 20 to 24px corners, 22 to 24px internal side padding. Static signature top-left, compact Menu top-right. Name on exactly two centered lines, ABDUL then MOIZ, ~64 to 76px adjusted to fit 360px, never split inside a word. Visible curved split, ~65% width at top to ~45% at bottom, no third stripe. Eyebrow above title, then sentence and role below. CTAs stack if needed, full width, 48 to 52px high. Reduce the bottom metadata row, keep the scroll affordance, move profile links to the footer if tight. Respect browser chrome and safe areas, allow scrolling. Replace the perspective entrance with a 450 to 600ms fade and small rise; name in a stable medium weight, no touch dragging required. Menu opens a simple high-contrast panel with Work, About, Contact and a clear Close, designed as its own state.

## 11. Lower sections

Selected work: 96 to 120px below the hero, heading "Selected work", optional 01 / WORK label, three entries (first full width, next two sharing a row), each with a 16:10 preview area, [Project title], [Project type], [Your contribution], [Year]. Abstract palette-based previews if no real screenshots; invent no case studies, clients or metrics. Hover: image scale ~1.02, subtle border highlight, small arrow move. Stack on mobile. Include a project-detail template with overview, role, process, outcome placeholders.

About: "A little about me" with [Short professional bio] and [Skills / disciplines]. Desktop 5/7 column split, small orange divider, no portrait. Stack on mobile.

Approach: Understand, Explore, Build, Refine as four compact editorial rows with editable one-sentence descriptions. No skill meters or invented statistics. Staggered reveal 40 to 60ms when motion is allowed.

Contact/footer: "Have something in mind?" with a "Let's talk ↗" button, [Email address] and editable profile links, generous near-black section with a restrained rust curve or orange line echoing the hero. Footer carries the static signature, Abdul Moiz, a year placeholder, and Back to top ↑. No working form or invented contact details.

## 12. Interaction and accessibility

View work and Scroll to explore go to Selected work; About and Contact to their sections; Let's talk to Contact; Back to top returns to the hero without replaying the intro. Gentle anchor scrolling when motion is allowed, no scroll hijacking or custom scroll physics. Buttons need default, hover, pressed and keyboard-focus states, with a 2px amber or off-white focus outline visible on both panels. Text links need a non-color-only hover/focus cue. Targets at least ~44x44px. One accessible H1 for Abdul Moiz even though the animation splits letters; decorative duplicates and glow layers must not become duplicate reading content. Full reduced-motion hero: signature immediate or briefly crossfaded, no 3D rotation, static name, frozen glow, direct navigation. The name must read without hover, JS motion or background effects; the static design is a complete state.

## 13. Deliverables (as implemented states)

Desktop intro partly drawn; desktop intro complete; hero opening with timing annotations; hero settled; hover over ABDUL; hover over MOIZ crossing the split; full desktop homepage; project detail template; tablet hero; mobile intro and hero; mobile homepage and expanded menu; reduced-motion hero; and a component/style sheet covering tokens, typography, buttons, links, project cards, signature usage and split geometry.

## 14. Final review criteria

Verify: name spelled ABDUL MOIZ, site font JetBrains Mono, loader uses the handwritten signature, hero has both the split structure and the pointer-responsive typography plus background. Check the full name at 360px width, the brightest glow on the rust panel, the resting state with no pointer, and every primary navigation destination.

Intended first impression: Abdul Moiz's signature introduces a calm, warm portfolio; the opening card reveals his name as the centerpiece; interaction adds subtle movement without weakening clarity.