(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.remove("no-js");
  document.documentElement.classList.add("js-ready");
  if (reduceMotion) document.documentElement.classList.add("reduced-motion");

  /* ---------- Header scroll state ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navLinks = document.querySelector(".nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var isOpen = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Scroll reveal (GSAP if available, CSS fallback otherwise) ---------- */
  function initReveals() {
    var targets = document.querySelectorAll(".reveal");
    if (!targets.length) return;

    if (reduceMotion || typeof gsap === "undefined") {
      targets.forEach(function (el) {
        el.style.opacity = 1;
        el.style.transform = "none";
      });
      return;
    }

    if (typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }

    targets.forEach(function (el, i) {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power2.out",
        delay: (i % 4) * 0.06,
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true
        }
      });
    });
  }

  /* ---------- Hero entrance ---------- */
  function initHero() {
    if (reduceMotion || typeof gsap === "undefined") return;
    var scope = document.querySelector(".hero-home .hero-inner") || document.querySelector(".hero-copy");
    if (!scope) return;
    var tl = gsap.timeline({ defaults: { ease: "power2.out", duration: 0.8 } });
    var eyebrow = scope.querySelector(".eyebrow");
    var h1 = scope.querySelector("h1");
    var lead = scope.querySelector(".lead, .hero-lead");
    var actions = scope.querySelector(".hero-actions");

    [eyebrow, h1, lead, actions].forEach(function (el) {
      if (el) gsap.set(el, { opacity: 0, y: 18 });
    });

    if (eyebrow) tl.to(eyebrow, { opacity: 1, y: 0 }, 0.1);
    if (h1) tl.to(h1, { opacity: 1, y: 0 }, "-=0.55");
    if (lead) tl.to(lead, { opacity: 1, y: 0 }, "-=0.55");
    if (actions) tl.to(actions, { opacity: 1, y: 0 }, "-=0.5");
  }

  /* ---------- Hero rotating word (Recover / Grow) ---------- */
  function initHeroRotate() {
    var container = document.querySelector(".hero-rotate");
    if (!container) return;
    var wordEl = container.querySelector(".hero-word");
    var words = ["Recover", "Grow"];
    var widths = [];

    function measureWidths() {
      var cs = getComputedStyle(wordEl);
      var measure = document.createElement("span");
      measure.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;left:-9999px;" +
        "font-family:" + cs.fontFamily + ";font-weight:" + cs.fontWeight +
        ";font-size:" + cs.fontSize + ";letter-spacing:" + cs.letterSpacing;
      document.body.appendChild(measure);
      widths = words.map(function (w) { measure.textContent = w; return Math.ceil(measure.getBoundingClientRect().width); });
      document.body.removeChild(measure);
    }

    var i = 0;
    measureWidths();
    // Animate the width so "together." slides smoothly instead of leaving a gap
    container.style.width = widths[0] + "px";
    container.style.transition = "width 0.5s cubic-bezier(0.16, 1, 0.3, 1)";

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { measureWidths(); container.style.width = widths[i] + "px"; }, 150);
    });

    if (reduceMotion) return;
    setInterval(function () {
      i = (i + 1) % words.length;
      wordEl.classList.add("is-out");
      setTimeout(function () {
        wordEl.textContent = words[i];
        container.style.width = widths[i] + "px";
        wordEl.classList.remove("is-out");
        wordEl.classList.add("is-in");
        setTimeout(function () { wordEl.classList.remove("is-in"); }, 500);
      }, 360);
    }, 2800);
  }

  /* ---------- Phases timeline (hover / click reveals detail) ---------- */
  function initPhases() {
    var root = document.querySelector("[data-phases]");
    if (!root) return;
    var items = Array.prototype.slice.call(root.querySelectorAll(".phase-item"));
    var panels = root.querySelectorAll(".phase-panel");
    var dashDone = false;

    function activate(idx) {
      items.forEach(function (it) {
        var on = +it.dataset.phase === idx;
        it.classList.toggle("is-active", on);
        it.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach(function (p) { p.classList.toggle("is-active", +p.dataset.panel === idx); });
      if (idx === 1) runDashboard();
    }

    function runDashboard() {
      var dash = root.querySelector("[data-dash]");
      if (!dash || dashDone) return;
      dashDone = true;
      requestAnimationFrame(function () {
        setTimeout(function () {
          dash.classList.add("is-animated");
          var bot = dash.querySelector("[data-typing]");
          if (bot && !reduceMotion) {
            setTimeout(function () {
              bot.textContent = "Sanft reinigen, Feuchtigkeit spenden, kein direktes Sonnenlicht.";
              bot.classList.add("answered");
            }, 1500);
          } else if (bot) {
            bot.textContent = "Sanft reinigen, Feuchtigkeit spenden, kein direktes Sonnenlicht.";
            bot.classList.add("answered");
          }
        }, 60);
      });
    }

    items.forEach(function (it) {
      var idx = +it.dataset.phase;
      it.addEventListener("mouseenter", function () { activate(idx); });
      it.addEventListener("focus", function () { activate(idx); });
      it.addEventListener("click", function () { activate(idx); });
      it.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(idx); }
      });
    });
  }

  /* ---------- Newsletter form (client-side only, no backend wired up) ---------- */
  function initSignupForms() {
    document.querySelectorAll("[data-signup-form]").forEach(function (form) {
      var hasBackend = /cleverreach\.com/.test(form.getAttribute("action") || "");
      var feedback = form.querySelector(".form-feedback") || (form.parentElement && form.parentElement.querySelector(".form-feedback"));

      if (hasBackend) {
        // Real backend (CleverReach) validates + submits via its own script, into a hidden
        // iframe — errors returned there are invisible to the user, so we must catch the
        // obvious failure cases (missing consent, unsolved reCAPTCHA) ourselves beforehand.
        form.addEventListener("submit", function (e) {
          if (!feedback) return;
          feedback.classList.remove("is-error", "is-success");

          var consent = form.querySelector('input[name="consent"]');
          var consentLabel = form.querySelector(".form-consent");
          if (consent && !consent.checked) {
            e.preventDefault();
            if (consentLabel) consentLabel.classList.add("is-invalid");
            feedback.textContent = "Bitte stimme der Speicherung deiner E-Mail-Adresse zu.";
            feedback.classList.add("is-error", "is-visible");
            return;
          }
          if (consentLabel) consentLabel.classList.remove("is-invalid");

          if (typeof grecaptcha !== "undefined" && !grecaptcha.getResponse().length) {
            e.preventDefault();
            feedback.textContent = "Bitte bestätige das reCAPTCHA-Häkchen (\"Ich bin kein Roboter\").";
            feedback.classList.add("is-error", "is-visible");
            return;
          }

          feedback.textContent = "Danke! Bitte bestätige die Anmeldung über den Link, den wir dir gerade per E-Mail geschickt haben.";
          feedback.classList.add("is-success", "is-visible");
        });
        return;
      }

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        var email = input ? input.value.trim() : "";
        var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!feedback) return;
        feedback.classList.remove("is-error", "is-success");

        if (!valid) {
          feedback.textContent = "Bitte gib eine gültige E-Mail-Adresse ein.";
          feedback.classList.add("is-error", "is-visible");
          input.focus();
          return;
        }

        var consent = form.querySelector('input[name="consent"]');
        var consentLabel = form.querySelector(".form-consent");
        if (consent && !consent.checked) {
          if (consentLabel) consentLabel.classList.add("is-invalid");
          feedback.textContent = "Bitte stimme der Speicherung deiner E-Mail-Adresse zu.";
          feedback.classList.add("is-error", "is-visible");
          consent.focus();
          return;
        }
        if (consentLabel) consentLabel.classList.remove("is-invalid");

        feedback.textContent = "Danke! Du bist vorgemerkt — wir melden uns, sobald Awhi startet.";
        feedback.classList.add("is-success", "is-visible");
        form.reset();
      });
    });
  }

  /* ---------- Contact form (partner page): opens a pre-filled mailto, nothing stored on our side ---------- */
  function initContactForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) return;
    var feedback = form.querySelector(".form-feedback");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!feedback) return;
      feedback.classList.remove("is-error", "is-success");

      var consent = form.querySelector('input[name="consent"]');
      var consentLabel = form.querySelector(".form-consent");
      if (consent && !consent.checked) {
        if (consentLabel) consentLabel.classList.add("is-invalid");
        feedback.textContent = "Bitte stimmen Sie der Speicherung Ihrer Angaben zu.";
        feedback.classList.add("is-error", "is-visible");
        consent.focus();
        return;
      }
      if (consentLabel) consentLabel.classList.remove("is-invalid");

      var val = function (name) {
        var el = form.querySelector('[name="' + name + '"]');
        return el ? el.value.trim() : "";
      };
      var name = val("name");
      var org = val("organisation");
      var email = val("email");
      var rolle = val("rolle");
      var nachricht = val("nachricht");

      var bodyLines = [
        "Name: " + name,
        org ? "Organisation: " + org : null,
        "E-Mail: " + email,
        rolle ? "Rolle: " + rolle : null,
        "",
        nachricht
      ].filter(function (l) { return l !== null; });

      var mailto = "mailto:info@awhii.com"
        + "?subject=" + encodeURIComponent("Partneranfrage von " + (name || "Website"))
        + "&body=" + encodeURIComponent(bodyLines.join("\n"));

      window.location.href = mailto;

      feedback.textContent = "Dein E-Mail-Programm öffnet sich gleich mit einer vorausgefüllten Nachricht an uns.";
      feedback.classList.add("is-success", "is-visible");
      form.reset();
    });
  }

  /* ---------- Draw the terracotta underline swooshes on scroll ---------- */
  function initSwooshes() {
    var swooshes = document.querySelectorAll(".swoosh");
    if (!swooshes.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      swooshes.forEach(function (s) { s.classList.add("is-drawn"); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-drawn");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    swooshes.forEach(function (s) { obs.observe(s); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initReveals();
    initHero();
    initHeroRotate();
    initPhases();
    initSwooshes();
    initSignupForms();
    initContactForm();
  });
})();
