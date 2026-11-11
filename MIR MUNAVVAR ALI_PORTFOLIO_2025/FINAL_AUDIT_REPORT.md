# Portfolio code audit — final pass (November 10, 2026)

## What changed

### Architecture and de-duplication
- Removed the unused `portfolioData.js` runtime data layer. About and Expertise are authored once in the HTML and remain readable if JavaScript or a third-party CDN is unavailable.
- Removed the dormant project-filter and legacy project-detail modal implementation. The active company/project gallery remains in place.
- Removed the unused optional 3D model-viewer loader and choreography for a model section that is not present in this build.
- Removed obsolete CSS for the deleted project cards, project filters, legacy modal, and model-viewer sections.
- Updated the CAD accent host list and card micro-interactions to target sections/cards that actually exist in the current page.
- Kept `script.js` and `motion.js` separate: site behavior and motion effects have different responsibilities, and splitting them preserves graceful fallback if GSAP is unavailable.

### Performance and responsiveness
- Changed the background video preload policy to `none`. The video source is still assigned by the existing lazy playback logic, rather than fetched just because the page loads.
- Preserved deferred script loading, responsive layouts, reduced-motion handling, data-saver behavior, and the IntersectionObserver fallback.
- Kept breakpoint-specific CSS overrides where they intentionally adapt layouts; collapsing those would risk changing tablet/mobile behavior.

### Copy and résumé integration
- Shortened the hero introduction and About copy so they explain the work without repeating a résumé summary.
- Simplified the Selected Work introduction and contact invitation.
- Retained résumé-grounded experience, education, technical skills, and project outcomes already integrated into the page.
- The included résumé PDF was extracted and reviewed as the source for role names, dates, education, and skills.

## Validation performed
- `node --check script.js` — passed.
- `node --check motion.js` — passed.
- CSS parser check — passed with no top-level parse errors.
- Duplicate HTML IDs — none found.
- In-page anchor targets — all resolve.
- Local HTML asset references — all resolve.
- Browser screenshot, keyboard-only manual QA, Lighthouse, and screen-reader testing were not available in this run.

## Before publishing
1. Preview at desktop width and at 375–430 px mobile width.
2. Test the company galleries with mouse, keyboard, and touch; verify Escape closes the dialog and focus returns to the selected card.
3. Run Lighthouse and a contrast/accessibility audit on the deployed domain.
4. Confirm permission to publish company logos, project images, drawings, BOMs, reports, and other technical records. Remove any confidential employer/client material before making the archive public.
5. Replace or add absolute Open Graph image/URL metadata after the production domain is known.
