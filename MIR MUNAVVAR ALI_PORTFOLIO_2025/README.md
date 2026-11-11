# Mir Munavvar Ali — Engineering Portfolio

A responsive, dark industrial-style engineering portfolio highlighting mechanical design, mechatronics, robotics, precision hardware, and hands-on product development.

## Run locally
1. Extract this folder.
2. Open `index.html` in a modern browser. For best results, serve the folder locally:
   - `python -m http.server 8000`
   - Visit `http://localhost:8000`

No build step is required; this is a static HTML/CSS/JavaScript site.

## Deployment
Upload the complete `portfolio_gallery_edit` folder to a static host such as GitHub Pages, Netlify, or Vercel. Preserve the relative paths and include the entire `assets` directory. The résumé PDF and background video are loaded from `assets/`.

## Structure
- `index.html` — page sections, navigation, education, project cards, dialogs, and contact
- `styles.css` — responsive visual system and layout
- `script.js` — galleries, filters, dialogs, navigation, and interaction logic
- `motion.js` — scroll and interface motion
- `assets/images/` — project thumbnails and company/team logo covers
- `assets/portfolio-source/` — supporting CAD exports, drawings, BOMs, reports, presentations, and source evidence
- `assets/Munavvar_Ali_Final_Engineering_Resume.pdf` — résumé download
- `assets/robotic-background*.mp4` — background motion footage

## Project gallery
Company covers are ordered as HBL, Vir Innovations, Team Robocon MJCET, and Mowito Automation. Selecting a cover opens its corresponding project gallery. Only supplied project visuals are used; no unrelated imagery is attributed to a company.

## Education layout fix
The two education entries use matching label-height spacing so both degree headings align on the same horizontal baseline on desktop. The layout collapses to one column on narrow screens.

## Final checks
- All locally referenced image, video, and résumé paths in the page/data files were checked against the included assets.
- No Lorem Ipsum, “insert text here,” or TODO copy remains in the page or portfolio data.
- Verify external social links and the résumé PDF once more after deployment.


## Portfolio archive updates

- Added a dedicated **Documents & technical files** area to the Team Robocon MJCET gallery, including 2020–2022 design-detail documents and Onshape workshop presentations.
- Added the **2D Submarine Model** project album, with a concept illustration extracted from the original ME 5659 proposal and links to the proposal, final report, and final presentation.
- Expanded the Hyderabad Batteries Limited gallery with a dedicated document library covering the project timeline, system flowchart, project presentation, assembly drawing, subassembly drawings, and available BOMs.
- Retained the four existing company logo assets (HBL, Vir Innovations, Team Robocon MJCET, and Mowito Automation).


## Code review and release notes (November 2026)

- Normalized company-cover, gallery-viewer, and thumbnail media frames to a shared 16:9 aspect ratio. Images use `object-fit: contain` so CAD drawings and company marks are not cropped.
- Constrained the gallery dialog to the dynamic viewport height (`dvh`) and enabled internal scrolling on smaller screens, keeping it clear of the page header/footer.
- Added dialog title/description semantics and keyboard focus containment; Escape closes the gallery and restores focus to the card that opened it.
- Removed unsupported robot production/prototype-cycle reduction claims. The portfolio now describes the documented FEA work without assigning an unverified time-saving metric.
- Removed the obsolete `update_gallery.py` one-off script. It contained a hard-coded local path and would overwrite the current five-card archive with an outdated four-card layout.
- Checked JavaScript syntax with Node.js and verified local references in the page and data scripts against the packaged files. All checked local references resolve.

### Source-of-truth and release caveats

The included résumé PDF was used as the primary source for career dates, education, and résumé-aligned achievement wording. I could not inspect private Google Drive files or the live GitHub account from this uploaded archive, so those sources have not been independently cross-checked. Review any project-specific numerical claims against the original signed-off project records before publication. In particular, retain only figures you can substantiate publicly and have permission to disclose.

### Pre-publication checklist

1. Test the site on current Chrome, Firefox, Safari, and mobile browsers.
2. Test gallery open/close, keyboard navigation, every document link, and all external profile links on the deployed domain.
3. Confirm the résumé is the intended public version and contains no private contact details you do not want published.
4. Add the final canonical domain and social-preview image metadata (`og:url`, `og:image`).
5. Confirm permission to publish every company logo, project image, drawing, BOM, and technical document. Remove confidential or third-party materials.
6. Run an accessibility audit and a Lighthouse performance audit after deployment; external font, GSAP, and model-viewer CDN availability can affect runtime behavior.


## Accuracy and presentation update — November 5, 2026
- Company emblems use tightly cropped transparent logo artwork so only the primary brand mark appears inside each circular disc.
- Team Robocon gallery excludes the personal TRM sweatshirt portrait and the welding/fabrication photo; it retains robot and competition-team imagery.
- All four Mowito gallery images are standardized to 1600 × 1000 pixels on a matching neutral canvas.
- The hero and About copy identify the user as a Mechanical Design Engineer developing a Mechatronics specialization through graduate study and project work.
- The capability ticker lists only: CAD/CAM, FEA, Prototyping, Validation, Testing, Documentation, and Coding.
- Added an attribution statement distinguishing individual engineering contributions from collaborative team outcomes.
- Removed the unsupported claim that robot production/prototype cycles were reduced by one-third or 5×.


## Final release positioning
The portfolio presents the owner as a **Mechanical Design Engineer** developing toward **Mechatronics Engineering** through graduate study and hands-on controls projects. The existing visual theme is retained. The freelance engagement is included in the experience timeline and its existing CAD images are accessible through the Freelance Design gallery.


## Release cleanup — November 10, 2026

- Removed the unused `portfolioData.js` layer and its runtime replacement of About and Expertise copy. The visible HTML is now the single source for those sections, so the content remains complete if JavaScript or a CDN is unavailable.
- Removed unused legacy project-filter, project-detail-modal, and optional 3D-viewer code. The active company/project gallery remains the only project-dialog implementation.
- Removed the unused project-modal markup and stopped loading the unused portfolio data script.
- Reduced background-video preload to `none`; the video source is still assigned only when playback is requested, avoiding unnecessary network work.
- Updated the hero, About, archive, and contact copy to be shorter and more conversational.
- Removed stale CAD-accent host selectors for sections that do not exist in this build.
- Kept responsive CSS overrides where they serve distinct breakpoints or component states; they are not safe to collapse into one rule without changing layout behavior.
