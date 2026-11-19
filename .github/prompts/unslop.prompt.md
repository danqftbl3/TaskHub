---
name: "Unslop UI Audit and Redesign"
description: "Audit and redesign a component or page with the Unslop methodology: product-specific direction, complete UI audit, nine ordered redline passes, and verification."
argument-hint: "Component/page, route, or file to audit and redesign"
agent: "agent"
---

Perform a complete Unslop UI audit and redesign of **${input:target:the selected component or page}**. Follow the project-wide rules in [copilot-instructions.md](../copilot-instructions.md); those instructions contain the full audit, token scale, nine passes, RTL requirements, and final checklist.

## Work sequence

1. Find the target implementation, related styles/components, existing tokens, and how to render it. If the target is unclear, identify the most likely page and state your assumption before editing. Render/screenshot the current UI when practical and use it as the baseline.
2. Audit every applicable category in the instruction checklist. Report each finding as `location — sign — fix`; include surfaces/color, type, icons, spacing, copy, components/data, landing/hero, visuals, motion, and template fallback. For Arabic, Persian, Urdu, Hebrew, or `dir="rtl"`, apply the RTL rules first and let them override conflicting rules.
3. Decide scope: use all nine passes for heavy slop; in polish mode fix only observed issues and preserve the existing brand/direction; if there is no slop, report that and stop after at most three exact-value suggestions unless changes are authorized.
4. Write the five-line direction: Product, Character, World, Moments, Signature. Derive it from this product, not trends. This prompt explicitly requests a redesign, so implement the direction without pausing for routine approval; ask only when a material product/design decision is genuinely ambiguous.
5. Implement in order, completing each pass across the target before advancing:
   1. Spacing
   2. Color
   3. Icons
   4. Copy
   5. Type
   6. Layout
   7. Details
   8. Visuals
   9. Motion
   Preserve the product name, real brand, features, content, and section order. Do not invent data, claims, or functionality. Reuse project components and tokens where sound; do not make unrelated changes.
6. Verify the actual target: render again if practical (keep the total screen renders to three or fewer), compare with the baseline and audit, run the smallest relevant test/build/lint command available, and resolve any introduced failures.
7. Report the five-line direction, the main audit findings, changes organized by all nine passes, files changed, checks run, any remaining issues, and any image prompt.

## Visual generation

Do not invoke a paid or cost-incurring image-generation tool without first showing the user the proposed prompt, model, and size and obtaining confirmation. If no image tool is available, build a truthful product preview in code where feasible. If a necessary hero image cannot be made, report a ready-to-use image prompt and keep any unfilled region as an unlabelled plain surface; never ship a fake image, textual placeholder, or generic AI decoration.

Do not create a story file or video unless requested. If requested, follow the optional shareable redline story instructions in [copilot-instructions.md](../copilot-instructions.md).
