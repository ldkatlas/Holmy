/* ==========================================================================
   HOLMY — CHALÉ NAS MONTANHAS
   Interactive Controller & Cinematic Motion Architecture
   Ultra-Smooth RAM-Buffered Video Scrubbing Engine & Dynamic Visibility
   ========================================================================== */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 01. INITIAL SETUP & LENIS SMOOTH SCROLL
  // --------------------------------------------------------------------------
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.5,
    infinite: false,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        lenis.scrollTo(targetEl, { offset: 0, duration: 1.5 });
      }
    });
  });

  // --------------------------------------------------------------------------
  // 02. HIDE TOP-LEFT BRAND ONCE LEAVING HERO
  // Direct fail-safe viewport tracking: vanishes when hero leaves screen
  // --------------------------------------------------------------------------
  const brandAnchor = document.getElementById('brand-anchor');
  const heroSection = document.getElementById('hero');

  function updateBrandVisibility() {
    if (!brandAnchor || !heroSection) return;
    const rect = heroSection.getBoundingClientRect();
    // When hero bottom reaches within 100px of top of screen, hide logo & text
    if (rect.bottom <= 100) {
      brandAnchor.classList.add('is-hidden');
    } else {
      brandAnchor.classList.remove('is-hidden');
    }
  }

  window.addEventListener('scroll', updateBrandVisibility, { passive: true });
  window.addEventListener('resize', updateBrandVisibility, { passive: true });
  updateBrandVisibility();

  // --------------------------------------------------------------------------
  // 03. ULTRA-SMOOTH VIDEO SCROLL-SCRUBBING ENGINE (IN-MEMORY BUFFERING)
  // --------------------------------------------------------------------------
  const video = document.getElementById('hero-video');
  const heroTrack = document.querySelector('.hero-scroll-track');
  let videoDuration = 0;
  let targetProgress = 0;
  let currentProgress = 0;
  let isSeeking = false;

  if (video) {
    video.muted = true;
    video.playsInline = true;
    video.pause();

    // Cue first frame as soon as metadata is ready
    const handleMetadata = () => {
      videoDuration = video.duration || 8;
      video.currentTime = 0.001;
      initHeroCredits();
    };

    if (video.readyState >= 1) {
      handleMetadata();
    } else {
      video.addEventListener('loadedmetadata', handleMetadata);
      setTimeout(() => {
        if (!videoDuration && video.duration) {
          handleMetadata();
        } else if (!videoDuration) {
          videoDuration = 8;
          initHeroCredits();
        }
      }, 500);
    }

    // High performance optimization: prefetch video into RAM Blob URL for zero-stutter scrubbing
    fetch('video.webm')
      .then((res) => {
        if (!res.ok) throw new Error('Fetch failed');
        return res.blob();
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const prevTime = video.currentTime;
        video.src = blobUrl;
        video.currentTime = prevTime;
      })
      .catch((e) => {
        // Fallback to normal streaming if fetch fails
      });

    // High-frequency render loop for buttery smooth interpolation
    function renderVideo() {
      if (videoDuration > 0) {
        currentProgress += (targetProgress - currentProgress) * 0.18;
        const targetTime = Math.max(0, Math.min(currentProgress * (videoDuration - 0.05), videoDuration - 0.05));

        if (Math.abs(targetTime - video.currentTime) > 0.02 && !isSeeking) {
          isSeeking = true;
          video.currentTime = targetTime;
        }
      }
      requestAnimationFrame(renderVideo);
    }

    video.addEventListener('seeked', () => {
      isSeeking = false;
    });

    // Safety timeout to prevent stuck seek flag
    setInterval(() => {
      isSeeking = false;
    }, 50);

    requestAnimationFrame(renderVideo);
  }

  // --------------------------------------------------------------------------
  // 04. CINEMATIC OPENING CREDITS TIMELINE
  // --------------------------------------------------------------------------
  function initHeroCredits() {
    const act1 = document.getElementById('act-1');
    const act2 = document.getElementById('act-2');
    const act3 = document.getElementById('act-3');
    const scrollCue = document.getElementById('scroll-cue');

    // Feed scroll progress to the scrubbing engine
    ScrollTrigger.create({
      trigger: heroTrack,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        targetProgress = self.progress;
      }
    });

    // Staggered cinematic opening credits timeline
    const heroTl = gsap.timeline({
      scrollTrigger: {
        trigger: heroTrack,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.7
      }
    });

    gsap.set(act1, { opacity: 1, y: 0, scale: 1 });
    gsap.set(act2, { opacity: 0, y: 40, scale: 0.96 });
    gsap.set(act3, { opacity: 0, y: 40, scale: 0.96 });

    heroTl
      // Fade out scroll cue
      .to(scrollCue, { opacity: 0, y: 15, duration: 0.08, ease: 'power1.out' }, 0.02)
      // Act 1 exits
      .to(act1, { opacity: 0, y: -40, scale: 1.05, duration: 0.12, ease: 'power2.inOut' }, 0.22)
      // Act 2 enters
      .to(act2, { opacity: 1, y: 0, scale: 1, duration: 0.14, ease: 'power2.out' }, 0.34)
      // Act 2 exits
      .to(act2, { opacity: 0, y: -40, scale: 1.05, duration: 0.12, ease: 'power2.inOut' }, 0.58)
      // Act 3 enters
      .to(act3, { opacity: 1, y: 0, scale: 1, duration: 0.14, ease: 'power2.out' }, 0.70)
      // Act 3 exits
      .to(act3, { opacity: 0, y: -40, scale: 1.05, duration: 0.1, ease: 'power2.inOut' }, 0.86);
  }

  // --------------------------------------------------------------------------
  // 05. CINEMATIC SECTION REVEALS & EDITORIAL PARALLAX
  // --------------------------------------------------------------------------
  const revealItems = document.querySelectorAll('.reveal-item');
  revealItems.forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 45 },
      {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
          once: true
        }
      }
    );
  });

  // Parallax on architectural imagery
  const kenBurnsImages = document.querySelectorAll('.ken-burns-img');
  kenBurnsImages.forEach((img) => {
    gsap.to(img, {
      yPercent: -8,
      ease: 'none',
      scrollTrigger: {
        trigger: img.closest('.double-bezel') || img,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2
      }
    });
  });

  // Numbers animation on Manifesto stats
  const statNumbers = document.querySelectorAll('.stat-number');
  statNumbers.forEach((num) => {
    gsap.from(num, {
      scale: 0.85,
      opacity: 0,
      duration: 1.2,
      ease: 'back.out(1.5)',
      scrollTrigger: {
        trigger: num,
        start: 'top 92%',
        once: true
      }
    });
  });

  // Timeline Rows Stagger
  const timelineRows = document.querySelectorAll('.timeline-row');
  timelineRows.forEach((row, i) => {
    gsap.from(row, {
      x: -30,
      opacity: 0,
      duration: 0.8,
      delay: i * 0.08,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: row,
        start: 'top 88%',
        once: true
      }
    });
  });

  // --------------------------------------------------------------------------
  // 06. RESERVATION FORM HANDLING & CONCIERGE FEEDBACK
  // --------------------------------------------------------------------------
  const bookingForm = document.getElementById('booking-form');
  const formStatusMsg = document.getElementById('form-status-msg');
  const checkinInput = document.getElementById('checkin');
  const checkoutInput = document.getElementById('checkout');

  if (checkinInput && checkoutInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    checkinInput.min = tomorrowStr;

    checkinInput.addEventListener('change', () => {
      if (checkinInput.value) {
        const nextDay = new Date(checkinInput.value);
        nextDay.setDate(nextDay.getDate() + 2);
        checkoutInput.min = nextDay.toISOString().split('T')[0];
        if (!checkoutInput.value || checkoutInput.value < checkoutInput.min) {
          checkoutInput.value = checkoutInput.min;
        }
      }
    });
  }

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const checkin = checkinInput ? checkinInput.value : '';
      const checkout = checkoutInput ? checkoutInput.value : '';

      if (!name || !email || !phone || !checkin || !checkout) {
        if (formStatusMsg) {
          formStatusMsg.textContent = 'Por favor, preencha todos os campos obrigatórios para a consulta de disponibilidade.';
          formStatusMsg.className = 'form-status-msg error';
          formStatusMsg.style.display = 'block';
        }
        return;
      }

      const submitBtn = document.getElementById('submit-booking-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').textContent = 'PROCESSANDO CONSULTA...';
      }

      setTimeout(() => {
        if (formStatusMsg) {
          formStatusMsg.innerHTML = `
            <strong>Solicitação registrada com distinção.</strong><br>
            Agradecemos o interesse, ${name}. Nosso concierge privativo analisará a disponibilidade para o período de ${checkin} a ${checkout} e entrará em contato via WhatsApp/E-mail em até 2 horas úteis.
          `;
          formStatusMsg.className = 'form-status-msg success';
          formStatusMsg.style.display = 'block';
        }
        bookingForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.querySelector('.btn-text').textContent = 'SOLICITAR CONSULTA DE DISPONIBILIDADE';
        }
      }, 900);
    });
  }

  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });

})();
