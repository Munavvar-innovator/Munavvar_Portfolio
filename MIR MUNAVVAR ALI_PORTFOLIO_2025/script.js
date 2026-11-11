/* ==========================================================================
   Mir Munavvar Ali — Portfolio interactions
   ========================================================================== */
(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ── Config ─────────────────────────────────────────────────────────────
     Set to true to autoplay the 4K background video on phones/tablets too.
     Default is false to avoid pulling tens of MB over cellular; visitors can
     still start it with the MOTION toggle.                                   */
  const AUTOPLAY_VIDEO_ON_SMALL_SCREENS = false;

  /* ── Small utilities ──────────────────────────────────────────────────── */
  const onMediaChange = (query, handler) => {
    if (query?.addEventListener) query.addEventListener('change', handler);
    else if (query?.addListener) query.addListener(handler);
  };

  /* ── Footer year ──────────────────────────────────────────────────────── */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();


  /* ── Mobile navigation ────────────────────────────────────────────────── */
  const menuButton = $('.menu-toggle');
  const nav = $('.main-nav');
  function setMenu(open) {
    if (!nav || !menuButton) return;
    nav.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
  }
  menuButton?.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  if (nav) $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', e => {
    if (nav?.classList.contains('open') && !nav.contains(e.target) && !menuButton?.contains(e.target)) setMenu(false);
  });
  onMediaChange(window.matchMedia('(min-width: 801px)'), e => { if (e.matches) setMenu(false); });

  /* ── Reveal on scroll ─────────────────────────────────────────────────── */
  // When GSAP + ScrollTrigger are present, motion.js owns the reveals (richer choreography).
  // This observer is the dependency-free fallback.
  const revealEls = $$('.reveal');
  const motionOwnsReveals = Boolean(window.gsap && window.ScrollTrigger);
  if (motionOwnsReveals) {
    /* handled in motion.js */
  } else if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  /* ── Scroll progress (transform-only) + section-aware nav (IO-based) ──── */
  const progressBar = $('#scrollProgressBar');
  let progressTick = false;
  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (progressBar) progressBar.style.transform = `scaleX(${ratio})`;
    progressTick = false;
  }
  window.addEventListener('scroll', () => {
    if (!progressTick) { progressTick = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();

  const navLinks = $$('.main-nav a[href^="#"]');
  const spyTargets = ['#home', ...navLinks.map(a => a.getAttribute('href'))]
    .map(sel => $(sel)).filter(Boolean);
  function setActiveNav(id) {
    navLinks.forEach(link => {
      const on = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('active', on);
      if (on) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  }
  if ('IntersectionObserver' in window) {
    // A thin band at ~38% of the viewport height: whichever section crosses it is "current".
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActiveNav(entry.target.id === 'home' ? '' : entry.target.id); });
    }, { rootMargin: '-38% 0px -60% 0px', threshold: 0 });
    spyTargets.forEach(el => spy.observe(el));
  }

  /* ── Copy-email action ────────────────────────────────────────────────── */
  const contactEmail = $('.contact-email');
  const emailLink = contactEmail && $('a[href^="mailto:"]', contactEmail);
  if (contactEmail && emailLink) {
    const emailText = emailLink.getAttribute('href').replace(/^mailto:/i, '');
    const LABEL = 'COPY EMAIL  ↗';
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'quick-action copy-email';
    copyBtn.textContent = LABEL;
    copyBtn.setAttribute('aria-label', 'Copy email address');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(emailText);
        copyBtn.textContent = 'COPIED ✓';
        copyBtn.classList.add('copied');
        setTimeout(() => { copyBtn.textContent = LABEL; copyBtn.classList.remove('copied'); }, 1800);
      } catch {
        window.location.href = `mailto:${emailText}`;      // clipboard blocked / insecure context
      }
    });
    contactEmail.appendChild(copyBtn);
  }

  /* ── Background video ─────────────────────────────────────────────────────
     • The 4K source is only fetched when we actually intend to play it.
     • Skipped for reduced-motion, Save-Data, 2G/3G and (by default) small screens.
     • <source> errors are listened for on the <source> element — error events
       from a failed <source> do NOT fire on the parent <video>.               */
  const video = $('#heroVideo');
  const toggle = $('#videoToggle');
  if (video && toggle) {
    const source = $('source', video);
    // Slightly slow the background for a calmer, more cinematic feel.
    const VIDEO_PLAYBACK_RATE = 0.82;
    const applyVideoSpeed = () => {
      video.defaultPlaybackRate = VIDEO_PLAYBACK_RATE;
      video.playbackRate = VIDEO_PLAYBACK_RATE;
    };
    video.addEventListener('loadedmetadata', applyVideoSpeed);
    applyVideoSpeed();
    const icon = $('.video-toggle-icon', toggle);
    const label = $('.video-toggle-label', toggle);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const smallScreen = window.matchMedia('(max-width: 800px)');
    let loaded = false;
    let resumeOnVisible = false;

    const render = (playing) => {
      toggle.setAttribute('aria-pressed', String(playing));
      icon.textContent = playing ? 'Ⅱ' : '▶';
      label.textContent = playing ? 'MOTION ON' : 'MOTION OFF';
    };
    const unavailable = () => {
      video.classList.add('video-unavailable');
      toggle.hidden = true;
    };
    const load = () => {
      if (loaded || !source) return;
      loaded = true;
      source.src = source.dataset.src;
      video.load();
    };
    const play = async () => {
      if (reduced.matches) return;
      load();
      applyVideoSpeed();
      try { await video.play(); applyVideoSpeed(); } catch { render(false); }
    };

    source?.addEventListener('error', unavailable);
    video.addEventListener('error', unavailable);
    video.addEventListener('playing', () => render(true));
    video.addEventListener('pause', () => render(false));

    toggle.addEventListener('click', () => { video.paused ? play() : video.pause(); });

    // Save battery when the tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !video.paused) { resumeOnVisible = true; video.pause(); }
      else if (!document.hidden && resumeOnVisible) { resumeOnVisible = false; play(); }
    });
    onMediaChange(reduced, e => { if (e.matches) video.pause(); });

    render(false);
    if (reduced.matches) {
      // Respect the visitor's reduced-motion preference; the video toggle remains available.
      render(false);
    } else {
      // The portfolio intentionally uses the background video as part of its visual identity.
      // Start it on desktop and mobile; visitors can pause it with the MOTION toggle.
      play();
    }
  }

  /* ── Company / project image galleries ───────────────────────────────── */
  const galleryDocuments = {
    robocon: [
      ['2022 Design Details — Team Robocon MJCET', 'assets/portfolio-source/ROBOCON/2022/Design Details 2022 Document Team Robocon MJCET.pdf', 'PDF · 2022'],
      ['2021 Design Details — TRM', 'assets/portfolio-source/ROBOCON/2021/Design Details Document TRM-2021.pdf', 'PDF · 2021'],
      ['2020 Design Details — Final Draft', 'assets/portfolio-source/ROBOCON/2020/design details 2020 document (Final draft).pdf', 'PDF · 2020'],
      ['Onshape Workshop — conducted by Mir Munavvar Ali', 'assets/portfolio-source/ROBOCON/WORKSHOPS/Onshape Tool_Conducted by Mir Munavvar Ali.pptx', 'PRESENTATION · WORKSHOP'],
    ],
    hbl: [
      ['HBL Project Timeline', 'assets/portfolio-source/HBL/HBL Timeline.pdf', 'PDF · PROJECT TIMELINE'],
      ['3-Axis Take-Out Robot — Project Presentation', 'assets/portfolio-source/HBL/project presentation 28_04_22.pptx', 'POWERPOINT · PROJECT REVIEW'],
      ['Take-Out Robot — Flowchart', 'assets/portfolio-source/HBL/FLOWCHART/Flow Chat Take Out Robot.pptx', 'POWERPOINT · SYSTEM FLOW'],
      ['Full Assembly — Technical Drawing', 'assets/portfolio-source/HBL/TR-ASSEMBLY/TR ASSEMBLY.pdf', 'PDF · ASSEMBLY'],
      ['Full Assembly — Bill of Materials', 'assets/portfolio-source/HBL/TR-ASSEMBLY/BOM_HBL UPDATED ON 31-01-2022 Time 0621 PM.xlsx', 'EXCEL · BOM'],
      ['Subassembly 1 — Drawing Package', 'assets/portfolio-source/HBL/TR-SA1/TR-SA-1.pdf', 'PDF · SUBASSEMBLY'],
      ['Subassembly 1 — Reinforcement Weldment', 'assets/portfolio-source/HBL/TR-SA1/A1 Reinforcement- Welded.pdf', 'PDF · DETAIL DRAWING'],
      ['Subassembly 2 — Drawing Package', 'assets/portfolio-source/HBL/TR-SA2/TR-SA-2.pdf', 'PDF · SUBASSEMBLY'],
      ['Subassembly 2 — X-Carriage Drawing', 'assets/portfolio-source/HBL/TR-SA2/A1_X-Carriage.pdf', 'PDF · DETAIL DRAWING'],
      ['Subassembly 2 — Bill of Materials', 'assets/portfolio-source/HBL/TR-SA2/BOM TR-SA2 .pdf', 'PDF · BOM'],
      ['Subassembly 3 — Drawing Package', 'assets/portfolio-source/HBL/TR-SA3/TR-SA3.pdf', 'PDF · SUBASSEMBLY'],
      ['Subassembly 3 — Bill of Materials', 'assets/portfolio-source/HBL/TR-SA3/BOM TR-SA3 .pdf', 'PDF · BOM'],
      ['Subassembly 4 — Drawing Package', 'assets/portfolio-source/HBL/TR-SA4/TR-SA4.pdf', 'PDF · SUBASSEMBLY']
    ],
    submarine: [
      ['ME 5659 — Project Proposal', 'assets/portfolio-source/LINEARIZATION, MODELING AND CONTROL OF A  2D SUBMARINE MODEL/ME 5659 Project Proposal.pdf', 'PDF · PROPOSAL'],
      ['ME 5659 — Final Report', 'assets/portfolio-source/LINEARIZATION, MODELING AND CONTROL OF A  2D SUBMARINE MODEL/ME-5659_Final Report.pdf', 'PDF · FINAL REPORT'],
      ['ME 5659 — Final Project Presentation', 'assets/portfolio-source/LINEARIZATION, MODELING AND CONTROL OF A  2D SUBMARINE MODEL/ME5659 Final Project Presentation.pptx', 'POWERPOINT · FINAL PRESENTATION']
    ]
  };
  const companyGalleries = {
    hbl: {
      logo: 'assets/images/company-logo-hbl-clean.png',
      kicker: 'INDUSTRY-SPONSORED PROJECT · 2021–2022',
      title: 'Hyderabad Batteries Limited',
      description: '3-Axis Cartesian Take-Out Robot — selected assembly and subassembly CAD views.',
      documents: galleryDocuments.hbl,
      images: [
        ['assets/images/three-axis-pick-place-robot.png','3-axis pick-and-place robot — complete CAD assembly concept','assets/portfolio-source/HBL/project%20presentation%2028_04_22.pptx'],
        ['assets/images/tr-assembly-tr-assembly.png','Complete 3-axis Cartesian take-out robot assembly','assets/portfolio-source/HBL/TR-ASSEMBLY/TR%20ASSEMBLY.pdf'],
        ['assets/images/tr-sa1-iso-view-sa1.png','Subassembly 1 — isometric view','assets/portfolio-source/HBL/TR-SA1/TR-SA-1.pdf'],
        ['assets/images/tr-sa1-front-view-sa1.png','Subassembly 1 — front view','assets/portfolio-source/HBL/TR-SA1/TR-SA-1.pdf'],
        ['assets/images/tr-sa2-iso-view-sa2.png','Subassembly 2 — isometric view','assets/portfolio-source/HBL/TR-SA2/TR-SA-2.pdf'],
        ['assets/images/tr-sa2-top-view-sa2.png','Subassembly 2 — top view','assets/portfolio-source/HBL/TR-SA2/TR-SA-2.pdf'],
        ['assets/images/tr-sa3-iso-view-sa3.png','Subassembly 3 — isometric view','assets/portfolio-source/HBL/TR-SA3/TR-SA3.pdf'],
        ['assets/images/tr-sa3-top-view-sa3.png','Subassembly 3 — top view','assets/portfolio-source/HBL/TR-SA3/TR-SA3.pdf'],
        ['assets/images/tr-sa4-iso-view.png','Subassembly 4 — isometric view','assets/portfolio-source/HBL/TR-SA4/TR-SA4.pdf'],
        ['assets/images/tr-sa4-side-view.png','Subassembly 4 — side view','assets/portfolio-source/HBL/TR-SA4/TR-SA4.pdf'],
        ['assets/images/tr-sa4-top-view.png','Subassembly 4 — top view','assets/portfolio-source/HBL/TR-SA4/TR-SA4.pdf']
      ]
    },
    vir: {
      logo: 'assets/images/company-logo-vir-clean.png',
      kicker: 'MECHANICAL DESIGN ENGINEERING · 2023–2024',
      title: 'Vir Innovations Pvt. Ltd.',
      description: 'Stair-climbing robotics and a vehicle-alerting system. The engineering story is in Selected Work above; project visuals are available on request.',
      images: []
    },
    mowito: {
      logo: 'assets/images/company-logo-mowito-clean.png',
      kicker: 'INDUSTRIAL AUTOMATION · 2022',
      title: 'Mowito Automation',
      description: 'Electromechanical actuator and multi-aisle warehouse robot base design.',
      images: [
        ['assets/images/multi-aisle-robot-base-full-assembly-iso-view-uniform.png','Multi-aisle warehouse robot base — full assembly','assets/portfolio-source/MOWITO/Multi%20aisle%20robot%20base/Full%20Assembly%20_%20ISO%20view.png'],
        ['assets/images/multi-aisle-robot-base-iso-view-uniform.png','Multi-aisle warehouse robot base — isometric view','assets/portfolio-source/MOWITO/Multi%20aisle%20robot%20base/ISO_view.png'],
        ['assets/images/electromechanical-actuator-extended-position-uniform.png','Electromechanical actuator — extended position','assets/portfolio-source/MOWITO/ELECTROMECHANICAL%20ACTUATOR/ELECTROMECHANICAL%20ACTUATOR.mp4'],
        ['assets/images/electromechanical-actuator-retract-position-uniform.png','Electromechanical actuator — retracted position','assets/portfolio-source/MOWITO/ELECTROMECHANICAL%20ACTUATOR/ELECTROMECHANICAL%20ACTUATOR.mp4']
      ]
    },
    freelance: {
      logo: 'assets/images/logo-automata-mobility.png',
      kicker: 'AUTOMATA MOBILITY PVT. LTD. · 2024',
      title: 'Automata Mobility Private Limited',
      description: 'Independent mechanical design work focused on robotic mechanisms, product assemblies, and CAD development.',
      images: [
        ['assets/images/freelancer-sas-iso-view-sas.png','SAS mechanical assembly — isometric view','assets/portfolio-source/FREELANCER-SAS/ISO-VIEW%20%28SAS%29.png'],
        ['assets/images/freelancer-sas-full-assembly-sketch-diagram-model.jpg','SAS full assembly — sketch, diagram, and model','assets/portfolio-source/FREELANCER-SAS/Full%20assembly_sketch%20diagram_model.jpg']
      ]
    },
    robocon: {
      logo: 'assets/images/company-logo-robocon-clean.png',
      kicker: 'COMPETITIVE ROBOTICS · 2019–2022',
      title: 'Team Robocon MJCET',
      description: 'Competition robotics, mechanical design, team collaboration, and hardware development.',
      documents: galleryDocuments.robocon,
      images: [
        ['assets/images/2020-photo-6.jpg','ABU Robocon 2020 — competition robot on the field','assets/portfolio-source/ROBOCON/2020/design%20details%202020%20document%20%28Final%20draft%29.pdf'],
        ['assets/images/2021-photo-3.jpeg','ABU Robocon 2021 — competition team and robot display','assets/portfolio-source/ROBOCON/2021/Design%20Details%20Document%20TRM-2021.pdf']
      ]
    }
    ,
    'dc-motor': {
      kicker: 'NORTHEASTERN UNIVERSITY · MECHATRONICS & CONTROLS · 2025',
      title: 'DC Motor Control System',
      description: 'Closed-loop DC motor speed and position control using Arduino encoder feedback, PWM motor drive, and MATLAB/Simulink modeling.',
      images: [
        ['assets/images/dc-motor-control-simulink.png','DC motor control — Simulink model and Arduino I/O configuration','']
      ]
    },
    submarine: {
      kicker: 'NORTHEASTERN UNIVERSITY · ME 5659 · 2025',
      title: '2D Submarine Model — Linearization, Modeling & Control',
      description: 'A planar submarine dynamics project covering nonlinear modeling, linearization, state-space representation, and controller evaluation. The proposal concept image and complete project deliverables are included below.',
      documents: galleryDocuments.submarine,
      images: [
        ['assets/images/submarine-proposal-concept.jpg','Submarine concept illustration from the original project proposal','assets/portfolio-source/LINEARIZATION, MODELING AND CONTROL OF A  2D SUBMARINE MODEL/ME 5659 Project Proposal.pdf']
      ]
    }
  };
  companyGalleries.northeastern = {
    logo: 'assets/images/logo-northeastern-white.png',
    kicker: 'NORTHEASTERN UNIVERSITY · ACADEMIC ENGINEERING · 2025',
    title: 'Northeastern University — Mechatronics Projects',
    description: 'Two academic engineering projects: closed-loop DC motor control using Arduino and Simulink, and a 2D submarine dynamics model with linearization and control analysis.',
    documents: [...galleryDocuments.submarine],
    images: [
      ['assets/images/dc-motor-control-simulink.png', 'DC motor control — Simulink model and Arduino I/O configuration', ''],
      ['assets/images/submarine-proposal-concept.jpg', '2D submarine model — concept illustration from the original proposal', 'assets/portfolio-source/LINEARIZATION, MODELING AND CONTROL OF A  2D SUBMARINE MODEL/ME 5659 Project Proposal.pdf']
    ]
  };

  const galleryModal = $('#companyGalleryModal');
  if (galleryModal) {
    const galleryImage = $('#galleryMainImage');
    const galleryTitle = $('#galleryCompanyTitle');
    const galleryKicker = $('#galleryCompanyKicker');
    const galleryDescription = $('#galleryCompanyDescription');
    const imageTitle = $('#galleryImageTitle');
    const counter = $('#galleryCounter');
    const projectFile = $('#galleryProjectFile');
    const thumbnails = $('#galleryThumbnails');
    const documentsPanel = $('#galleryDocuments');
    const documentList = $('#galleryDocumentList');
    let activeGallery = null;
    let activeIndex = 0;
    let previousFocus = null;

    function showGalleryImage(index) {
      if (!activeGallery) return;
      const items = activeGallery.images;
      if (!items.length) return;
      activeIndex = (index + items.length) % items.length;
      const [src, title, file] = items[activeIndex];
      galleryImage.src = src;
      galleryImage.alt = title;
      imageTitle.textContent = title;
      counter.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
      if (file) { projectFile.href = file; projectFile.hidden = false; }
      else { projectFile.hidden = true; projectFile.removeAttribute('href'); }
      $$('.gallery-thumb', thumbnails).forEach((button, i) => {
        button.classList.toggle('active', i === activeIndex);
        button.setAttribute('aria-current', i === activeIndex ? 'true' : 'false');
      });
    }
    function openCompanyGallery(key, trigger) {
      const data = companyGalleries[key];
      if (!data) return;
      activeGallery = data;
      activeIndex = 0;
      previousFocus = trigger || document.activeElement;
      const companyLogo = $('#galleryCompanyLogo');
      if (companyLogo) {
        if (data.logo) {
          companyLogo.src = data.logo;
          companyLogo.alt = `${data.title} logo`;
          companyLogo.hidden = false;
        } else {
          companyLogo.hidden = true;
          companyLogo.removeAttribute('src');
        }
      }
      galleryKicker.textContent = data.kicker;
      galleryTitle.textContent = data.title;
      galleryDescription.textContent = data.description;
      const docs = data.documents || [];
      const documentsPanel = $('#galleryDocuments');
      const documentList = $('#galleryDocumentList');
      documentsPanel.hidden = docs.length === 0;
      documentList.replaceChildren();
      docs.forEach(([label, path, type]) => {
        const link = document.createElement('a');
        link.className = 'gallery-document-link';
        link.href = encodeURI(path);
        link.target = '_blank';
        link.rel = 'noopener';
        const name = document.createElement('span');
        name.textContent = label;
        const meta = document.createElement('small');
        meta.textContent = type;
        const arrow = document.createElement('b');
        arrow.textContent = '↗';
        link.append(name, meta, arrow);
        documentList.append(link);
      });
      thumbnails.replaceChildren();
      if (!data.images.length) {
        galleryImage.removeAttribute('src');
        galleryImage.alt = '';
        imageTitle.textContent = 'Project visuals coming soon';
        counter.textContent = 'PROJECT GALLERY';
        projectFile.hidden = true;
        const empty = document.createElement('div');
        empty.className = 'gallery-empty-state';
        empty.textContent = 'Project visuals are being curated. Supporting engineering details and records are shown in this gallery.';
        thumbnails.append(empty);
      }
      data.images.forEach(([src, title], index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'gallery-thumb';
        button.setAttribute('aria-label', `View ${title}`);
        const img = document.createElement('img');
        img.src = src; img.alt = ''; img.loading = 'lazy';
        button.append(img);
        button.addEventListener('click', () => showGalleryImage(index));
        thumbnails.append(button);
      });
      if (data.images.length) showGalleryImage(0);
      galleryModal.classList.add('open');
      galleryModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('gallery-open');
      $('.company-gallery-close', galleryModal)?.focus();
    }
    function closeCompanyGallery() {
      galleryModal.classList.remove('open');
      galleryModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('gallery-open');
      galleryImage.removeAttribute('src');
      activeGallery = null;
      previousFocus?.focus?.();
    }
    $$('[data-gallery]').forEach(button => button.addEventListener('click', () => openCompanyGallery(button.dataset.gallery, button)));
    $$('[data-gallery-close]', galleryModal).forEach(button => button.addEventListener('click', closeCompanyGallery));
    $('.gallery-prev', galleryModal)?.addEventListener('click', () => showGalleryImage(activeIndex - 1));
    $('.gallery-next', galleryModal)?.addEventListener('click', () => showGalleryImage(activeIndex + 1));
    document.addEventListener('keydown', event => {
      if (!galleryModal.classList.contains('open')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeCompanyGallery();
        return;
      }
      if (event.key === 'ArrowLeft') showGalleryImage(activeIndex - 1);
      if (event.key === 'ArrowRight') showGalleryImage(activeIndex + 1);

      // Keep keyboard focus inside the open gallery dialog.
      if (event.key === 'Tab') {
        const focusable = $$('button:not([disabled]), a[href]:not([hidden])', galleryModal)
          .filter(element => element.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }


  /* Give the opening hero and final contact area the same cinematic video visibility. */
  const heroSection = $('#home');
  const closingSections = ['#contact', '.footer-signature-art', '.site-footer']
    .map((selector) => $(selector)).filter(Boolean);

  if ('IntersectionObserver' in window) {
    const visibleClosingSections = new Set();
    const closingVideoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.08) visibleClosingSections.add(entry.target);
        else visibleClosingSections.delete(entry.target);
      });
      document.documentElement.classList.toggle('contact-video-active', visibleClosingSections.size > 0);
    }, { threshold: [0, 0.08, 0.2] });
    closingSections.forEach((section) => closingVideoObserver.observe(section));

    if (heroSection) {
      const heroVideoObserver = new IntersectionObserver(([entry]) => {
        document.documentElement.classList.toggle('hero-video-active', entry.isIntersecting && entry.intersectionRatio > 0.12);
      }, { threshold: [0, 0.12, 0.25] });
      heroVideoObserver.observe(heroSection);
    }
  } else {
    const updateVideoVisibility = () => {
      const heroVisible = heroSection && window.scrollY < heroSection.offsetHeight * 0.65;
      const closingVisible = closingSections.some((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top < window.innerHeight * 0.92 && rect.bottom > window.innerHeight * 0.08;
      });
      document.documentElement.classList.toggle('hero-video-active', Boolean(heroVisible));
      document.documentElement.classList.toggle('contact-video-active', closingVisible);
    };
    updateVideoVisibility();
    window.addEventListener('scroll', updateVideoVisibility, { passive: true });
    window.addEventListener('resize', updateVideoVisibility);
  }

})();