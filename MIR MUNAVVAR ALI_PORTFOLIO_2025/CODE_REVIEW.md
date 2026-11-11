# Portfolio release review — November 5, 2026

## Changes applied
- Uniform 16:9 media frames for company covers, gallery stage, and thumbnails; `object-fit: contain` preserves full engineering views and logos.
- Gallery dialog constrained using dynamic viewport units and internal scrolling to avoid clipping on mobile and desktop.
- Added accessible dialog naming/description and keyboard focus containment; Escape closes and restores focus.
- Removed unsupported Vir Innovations robot prototype/production-cycle reduction metrics. The project description now states the documented FEA design-evaluation work without an unverified time-saving result.
- Removed `update_gallery.py`, a stale one-off script with a hard-coded filesystem path that could replace the current five-card gallery with outdated markup.

## Automated checks performed
- `node --check`: `script.js`, `portfolioData.js`, and `motion.js` all pass.
- Local asset references in `index.html`, `script.js`, and `portfolioData.js`: no missing references found.
- Included résumé PDF text extracted and reviewed for education and employment dates.

## Items requiring owner confirmation
- Private GitHub and Google Drive records were not accessible from this uploaded ZIP; only the included résumé and project archive were reviewed.
- Verify all project metrics against approved project records. Confirm public-disclosure rights for company logos, CAD drawings, BOMs, presentations, and technical documents.
- Browser-based visual testing, accessibility tooling, and Lighthouse were not run in this environment. Do these on the deployed build before calling it production-ready.
- The résumé currently identifies Veeco co-op Jan–Aug 2026 and the education timeline Jan 2025–May 2027. Keep the site consistent if either official record changes.


## Follow-up correction (2026-11-05)
- Removed the duplicate 2D Submarine project tile from Selected Work. The submarine now appears once in the archive, where its proposal, final report, and presentation are grouped together.
- Updated the Selected Work count from six to five to match the visible project cards.
- Added a strict max-width and overflow guard to the archive grid so cards stay within the page viewport, with a single-column layout on narrow screens.


## Accuracy and media correction — November 5, 2026
- Replaced logo source images with transparent, tightly cropped primary marks; company logo cards now show the mark cleanly inside the circular emblem.
- Removed the TRM sweatshirt portrait and welding/fabrication photo from the Team Robocon gallery.
- Standardized all Mowito gallery images to 1600 × 1000 pixels.
- Updated career positioning to Mechanical Design Engineer with a developing Mechatronics focus; no current Mechatronics Engineer title is claimed.
- Updated the capability ticker to CAD/CAM, FEA, PROTOTYPING, VALIDATION, TESTING, DOCUMENTATION, CODING.
- Added a portfolio attribution note clarifying individual contributions versus team achievements.
- Removed all robot cycle-time reduction claims after the user explicitly rejected the attribution.


## Final release pass — November 6, 2026

### Additional fixes
- Added the résumé-listed freelance product-design engagement (Oct–Dec 2024) to the experience story and connected its existing CAD visuals to a new archive portal.
- Corrected the Robocon 2021 ranking year and aligned role positioning across metadata, hero, portrait caption, and footer.
- Removed a zero-byte duplicate workshop presentation that would have produced a broken public download.
- Fixed a graceful-degradation issue: dynamically generated expertise cards now participate in the normal IntersectionObserver reveal path if GSAP/ScrollTrigger cannot load.
- Added a MediaQueryList compatibility fallback for older Safari releases.

### Final automated checks
- `node --check` passes for `script.js`, `portfolioData.js`, and `motion.js`.
- No duplicate HTML IDs or broken in-page anchors.
- All local HTML references and all 56 local asset paths referenced in JavaScript resolve.
- All packaged PDFs have valid PDF headers; PPTX, XLSX, and DOCX ZIP containers pass integrity checks.
- The zero-byte duplicate file has been removed.

### Remaining owner action
Confirm public-disclosure permission for the HBL/Robocon/other technical documents and company marks before deployment. Automated browser screenshot testing was blocked by the execution environment; check the deployed site once on desktop and once on a narrow mobile viewport.
