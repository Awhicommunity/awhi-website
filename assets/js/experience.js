/* ============================================================
   AWHI — Experience Choreografie (nur Startseite)
   Die Linie der Genesung: ein Koru, der sich beim Scrollen
   entrollt. Ruhig, warm, präzise. Respektiert reduced motion.
   Ohne JS bleibt jeder Inhalt sichtbar (Zustände werden hier
   gesetzt, nicht im CSS versteckt).
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  var hasGsap = typeof gsap !== "undefined";
  var hasST = typeof ScrollTrigger !== "undefined";
  var loader = document.querySelector(".xp-loader");

  function removeLoader() {
    if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
    loader = null;
  }

  /* Ohne GSAP oder mit reduced motion: statisch, aber vollständig. */
  if (!hasGsap || reduceMotion) {
    removeLoader();
    var j = document.querySelector("[data-journey]");
    if (j) j.classList.add("is-static");
    return;
  }

  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth Scroll (Lenis) ----------
     Nur auf Geräten mit Maus/Trackpad: Touch-Scrolling ist nativ bereits
     butterweich (eigenes Momentum) — synthetisches Smoothing obendrauf
     konkurriert damit und macht mobil spürbar träge/ruckelig. */
  var lenis = null;
  if (!isTouch && typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, touchMultiplier: 1.4 });
    lenis.on("scroll", function () { if (hasST) ScrollTrigger.update(); });
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* Anker sanft anfahren (Lenis auf Desktop, natives smooth scroll auf Touch) */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: -64, duration: 1.4 });
      } else {
        var y = target.getBoundingClientRect().top + window.scrollY - 64;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
      history.replaceState(null, "", id);
    });
  });

  function scrollToY(y) {
    if (lenis) lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  }

  /* ---------- Helfer ---------- */
  function drawSetup(path) {
    var len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    return len;
  }

  function splitWords(el) {
    var text = el.textContent.replace(/\s+/g, " ").trim();
    el.setAttribute("aria-label", text);
    el.textContent = "";
    var frag = document.createDocumentFragment();
    text.split(" ").forEach(function (word, i) {
      var span = document.createElement("span");
      span.className = "w";
      span.textContent = word;
      span.setAttribute("aria-hidden", "true");
      frag.appendChild(span);
      frag.appendChild(document.createTextNode(" "));
    });
    el.appendChild(frag);
    return el.querySelectorAll(".w");
  }

  /* ---------- Header: verstecken beim Runter-, zeigen beim Hochscrollen ---------- */
  var header = document.querySelector(".site-header");
  var lastY = window.scrollY;
  function onScrollDir() {
    var y = window.scrollY;
    var navOpen = document.querySelector(".nav-links.is-open");
    if (header && !navOpen) {
      if (y > 420 && y > lastY + 4) header.classList.add("nav-hidden");
      else if (y < lastY - 4 || y < 420) header.classList.remove("nav-hidden");
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScrollDir, { passive: true });

  /* ---------- Custom Cursor ---------- */
  if (finePointer) {
    var cursor = document.createElement("div");
    cursor.className = "xp-cursor";
    document.body.appendChild(cursor);
    var cx = -100, cy = -100, tx = -100, ty = -100, cursorSeen = false;
    window.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!cursorSeen) { cursorSeen = true; cx = tx; cy = ty; cursor.classList.add("is-visible"); }
    }, { passive: true });
    gsap.ticker.add(function () {
      cx += (tx - cx) * 0.16;
      cy += (ty - cy) * 0.16;
      cursor.style.transform = "translate(" + (cx - 17) + "px," + (cy - 17) + "px)";
    });
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest("a, button, input, label, .xp-rail-item")) cursor.classList.add("is-hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest("a, button, input, label, .xp-rail-item")) cursor.classList.remove("is-hover");
    });
  }

  /* ---------- Magnetische Buttons ---------- */
  if (finePointer) {
    document.querySelectorAll("[data-magnetic]").forEach(function (btn) {
      var qx = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3.out" });
      var qy = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3.out" });
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * 0.22);
        qy((e.clientY - (r.top + r.height / 2)) * 0.32);
      });
      btn.addEventListener("mouseleave", function () { qx(0); qy(0); });
    });
  }

  /* ---------- Intro: Loader → Hero ---------- */
  var heroEyebrow = document.querySelector(".xp-hero-eyebrow");
  var heroMaskline = document.querySelector(".xp-maskline");
  var heroLead = document.querySelector(".xp-hero-lead");
  var heroActions = document.querySelectorAll(".xp-hero-actions > *");
  var heroScroll = document.querySelector(".xp-hero-scroll");
  var heroArcPath = document.querySelector(".xp-arc-path");
  var leadWords = heroLead ? splitWords(heroLead) : [];

  var intro = gsap.timeline({ defaults: { ease: "power3.out" } });

  if (loader) {
    var loaderPath = loader.querySelector(".xp-loader-path");
    if (loaderPath) {
      var llen = drawSetup(loaderPath);
      intro.to(loaderPath, { strokeDashoffset: 0, duration: 0.85, ease: "power2.inOut" });
      intro.to(loader, {
        opacity: 0, duration: 0.45, ease: "power1.inOut", delay: 0.1,
        onComplete: removeLoader
      });
    } else {
      removeLoader();
    }
  }

  /* Ausgangszustände erst jetzt setzen (JS-gated, kein FOUC dank Loader) */
  if (heroMaskline) gsap.set(heroMaskline, { yPercent: 112 });
  if (heroEyebrow) gsap.set(heroEyebrow, { opacity: 0, y: 14 });
  if (leadWords.length) gsap.set(leadWords, { opacity: 0, y: 18 });
  if (heroActions.length) gsap.set(heroActions, { opacity: 0, y: 18 });
  if (heroScroll) gsap.set(heroScroll, { opacity: 0 });
  if (heroArcPath) {
    var alen = drawSetup(heroArcPath);
    gsap.set(heroArcPath, { strokeDashoffset: alen });
  }

  intro.addLabel("hero", loader ? "-=0.15" : 0);
  if (heroArcPath) intro.to(heroArcPath, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" }, "hero");
  if (heroEyebrow) intro.to(heroEyebrow, { opacity: 1, y: 0, duration: 0.6 }, "hero+=0.05");
  if (heroMaskline) intro.to(heroMaskline, { yPercent: 0, duration: 1.0, ease: "power4.out" }, "hero+=0.15");
  if (leadWords.length) intro.to(leadWords, { opacity: 1, y: 0, duration: 0.7, stagger: 0.022 }, "hero+=0.45");
  if (heroActions.length) intro.to(heroActions, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, "hero+=0.7");
  if (heroScroll) intro.to(heroScroll, { opacity: 1, duration: 0.8 }, "hero+=1.0");

  /* Hero-Bogen: sanfte Parallaxe beim Scrollen */
  if (hasST) {
    gsap.to(".xp-hero-arc", {
      yPercent: 18,
      ease: "none",
      scrollTrigger: { trigger: ".xp-hero", start: "top top", end: "bottom top", scrub: 0.6 }
    });
    gsap.to(".xp-hero-inner", {
      yPercent: -6,
      opacity: 0.35,
      ease: "none",
      scrollTrigger: { trigger: ".xp-hero", start: "top top", end: "bottom 35%", scrub: 0.6 }
    });
  }

  if (!hasST) return;

  /* ---------- Sanfte Reveals ---------- */
  document.querySelectorAll("[data-xp-reveal]").forEach(function (el, i) {
    gsap.fromTo(el, { opacity: 0, y: 26 }, {
      opacity: 1, y: 0, duration: 0.85, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 86%", once: true }
    });
  });

  /* ---------- Mission: Worte gewinnen an Gewicht ---------- */
  var missionLead = document.querySelector("[data-emphasis]");
  if (missionLead) {
    var mWords = splitWords(missionLead);
    gsap.set(mWords, { opacity: 0.22 });
    gsap.to(mWords, {
      opacity: 1,
      stagger: 0.06,
      ease: "none",
      scrollTrigger: {
        trigger: missionLead,
        start: "top 80%",
        end: "bottom 42%",
        scrub: 0.4
      }
    });
  }

  /* Missions-Linie zeichnet sich beim Vorbeiscrollen */
  var missionLine = document.querySelector(".xp-line-mission .xp-line-path");
  if (missionLine) {
    drawSetup(missionLine);
    gsap.to(missionLine, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: { trigger: ".xp-mission", start: "top 70%", end: "bottom 60%", scrub: 0.5 }
    });
  }

  /* Founder: Foto öffnet sich, Zitat folgt */
  var founderPhoto = document.querySelector(".xp-founder-photo");
  if (founderPhoto) {
    var founderImg = founderPhoto.querySelector("img");
    gsap.set(founderPhoto, { clipPath: "inset(14% 14% 14% 14% round 24px)", opacity: 0 });
    if (founderImg) gsap.set(founderImg, { scale: 1.18 });
    gsap.timeline({
      scrollTrigger: { trigger: founderPhoto, start: "top 82%", once: true }
    })
      .to(founderPhoto, { clipPath: "inset(0% 0% 0% 0% round 24px)", opacity: 1, duration: 1.15, ease: "power3.inOut" })
      .to(founderImg, { scale: 1, duration: 1.3, ease: "power2.out" }, 0);
  }
  var founderKoru = document.querySelector(".xp-founder-koru path");
  if (founderKoru) {
    drawSetup(founderKoru);
    gsap.to(founderKoru, {
      strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut",
      scrollTrigger: { trigger: ".xp-founder-note", start: "top 80%", once: true }
    });
  }

  /* ---------- Phasen-Reise: gepinnte Horizontal-Fahrt (Desktop) ---------- */
  var journey = document.querySelector("[data-journey]");
  if (journey) {
    var track = journey.querySelector(".xp-track");
    var panels = journey.querySelectorAll(".xp-panel");
    var railItems = journey.querySelectorAll(".xp-rail-item");
    var railFill = journey.querySelector(".xp-rail-bar i");
    var journeyST = null;

    var mm = gsap.matchMedia();
    mm.add("(min-width: 900px)", function () {
      function dist() { return Math.max(0, track.scrollWidth - window.innerWidth); }

      var tween = gsap.to(track, {
        x: function () { return -dist(); },
        ease: "none",
        scrollTrigger: {
          trigger: journey,
          start: "top top",
          end: function () { return "+=" + (dist() + window.innerHeight * 0.25); },
          scrub: 0.65,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            var p = self.progress;
            if (railFill) railFill.style.width = (p * 100) + "%";
            var idx = Math.min(panels.length - 1, Math.round(p * (panels.length - 1)));
            railItems.forEach(function (item, i) {
              item.classList.toggle("is-active", i === idx);
            });
          }
        }
      });
      journeyST = tween.scrollTrigger;

      railItems.forEach(function (item) {
        item.addEventListener("click", onRailClick);
      });
      function onRailClick(e) {
        if (!journeyST) return;
        var i = parseInt(e.currentTarget.getAttribute("data-index"), 10) || 0;
        var p = i / (panels.length - 1);
        scrollToY(journeyST.start + p * (journeyST.end - journeyST.start));
      }

      return function () {
        railItems.forEach(function (item) { item.removeEventListener("click", onRailClick); });
        journeyST = null;
      };
    });

    mm.add("(max-width: 899px)", function () {
      /* Mobil: vertikale Reise, Panels weich einblenden */
      panels.forEach(function (panel) {
        gsap.fromTo(panel.querySelector(".xp-panel-inner"), { opacity: 0, y: 34 }, {
          opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: panel, start: "top 84%", once: true }
        });
      });
    });
  }

  /* ---------- Finale: der Koru vollendet sich ---------- */
  var finaleKoru = document.querySelector(".xp-finale-koru-path");
  if (finaleKoru) {
    drawSetup(finaleKoru);
    gsap.to(finaleKoru, {
      strokeDashoffset: 0,
      duration: 2.1,
      ease: "power2.inOut",
      scrollTrigger: { trigger: ".xp-finale", start: "top 62%", once: true }
    });
  }

  /* ---------- Zahlen zählen hoch (Partner-Statistiken) ---------- */
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;
    var prefix = el.getAttribute("data-prefix") || "";
    var state = { v: 0 };
    el.textContent = prefix + "0";
    gsap.to(state, {
      v: target,
      duration: 1.8,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 86%", once: true },
      onUpdate: function () {
        el.textContent = prefix + Math.round(state.v).toLocaleString("de-DE");
      }
    });
  });

  /* ---------- Footer: ruhiger Auftritt ---------- */
  var footerCols = document.querySelectorAll(".xp-footer .footer-grid > div");
  if (footerCols.length) {
    gsap.fromTo(footerCols, { opacity: 0, y: 22 }, {
      opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.1,
      scrollTrigger: { trigger: ".xp-footer", start: "top 92%", once: true }
    });
  }

  /* ---------- Refresh nach Fonts & Bildern ---------- */
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
