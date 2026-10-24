/* =============================================================
   OYINBO — site behaviour
   Progressive enhancement only: every page works without this file.
   ============================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------------------------
     Opening hours — the single source of truth for the whole site.
     Index 0 = Sunday. `close` past 24 means it runs into the next day.
     Times are the venue's local time (America/Toronto).
     ----------------------------------------------------------- */
  var HOURS = [
    { day: "Sunday",    open: 17, close: 25 }, // 5:00 pm – 1:00 am
    { day: "Monday",    open: 12, close: 25 }, // 12:00 pm – 1:00 am
    { day: "Tuesday",   open: 12, close: 25 },
    { day: "Wednesday", open: 12, close: 26 }, // 12:00 pm – 2:00 am
    { day: "Thursday",  open: 12, close: 27 }, // 12:00 pm – 3:00 am
    { day: "Friday",    open: 12, close: 27 },
    { day: "Saturday",  open: 12, close: 27 }
  ];

  var TZ = "America/Toronto";

  /** Current wall-clock time at the venue, as { dow, hours, minutes }. */
  function venueNow() {
    var parts;
    try {
      parts = new Intl.DateTimeFormat("en-US", {
        timeZone: TZ,
        weekday: "short",
        hour: "numeric",
        minute: "numeric",
        hour12: false
      }).formatToParts(new Date());
    } catch (err) {
      // Environment without full ICU — fall back to the visitor's clock.
      var d = new Date();
      return { dow: d.getDay(), hours: d.getHours(), minutes: d.getMinutes() };
    }

    var map = {};
    parts.forEach(function (p) { map[p.type] = p.value; });
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var hour = parseInt(map.hour, 10);
    return {
      dow: days[map.weekday],
      hours: hour === 24 ? 0 : hour,
      minutes: parseInt(map.minute, 10)
    };
  }

  function fmt(hour24) {
    var h = ((hour24 % 24) + 24) % 24;
    var suffix = h >= 12 ? "pm" : "am";
    var display = h % 12 === 0 ? 12 : h % 12;
    return display + ":00 " + suffix;
  }

  /** @returns {{open: boolean, until: string}} */
  function openState() {
    var now = venueNow();
    var minutes = now.hours * 60 + now.minutes;

    // Today's session.
    var today = HOURS[now.dow];
    if (minutes >= today.open * 60 && minutes < today.close * 60) {
      return { open: true, until: fmt(today.close) };
    }

    // A session that started yesterday and runs past midnight.
    var yesterday = HOURS[(now.dow + 6) % 7];
    if (yesterday.close > 24 && minutes < (yesterday.close - 24) * 60) {
      return { open: true, until: fmt(yesterday.close) };
    }

    // Closed — find the next opening.
    if (minutes < today.open * 60) {
      return { open: false, until: fmt(today.open) };
    }
    return { open: false, until: fmt(HOURS[(now.dow + 1) % 7].open) };
  }

  function initStatus() {
    var nodes = document.querySelectorAll("[data-status]");
    if (!nodes.length) return;

    var state = openState();
    nodes.forEach(function (node) {
      node.classList.remove("is-open", "is-closed");
      node.classList.add(state.open ? "is-open" : "is-closed");
      var label = node.querySelector("[data-status-label]");
      if (label) {
        label.textContent = state.open
          ? "Open now · until " + state.until
          : "Closed · opens " + state.until;
      }
    });
  }

  /* ---- Highlight today in any hours table ------------------------- */
  function initHoursTable() {
    var rows = document.querySelectorAll("[data-day]");
    if (!rows.length) return;
    var dow = venueNow().dow;
    rows.forEach(function (row) {
      if (parseInt(row.getAttribute("data-day"), 10) === dow) {
        row.classList.add("is-today");
      }
    });
  }

  /* ---- Sticky header shade ---------------------------------------- */
  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var tick = function () {
      header.classList.toggle("is-stuck", window.scrollY > 16);
    };
    tick();
    window.addEventListener("scroll", tick, { passive: true });
  }

  /* ---- Mobile navigation ------------------------------------------ */
  function initNav() {
    var drawer = document.getElementById("mobile-nav");
    if (!drawer) return;
    var triggers = document.querySelectorAll("[data-nav-toggle]");
    var lastFocus = null;

    function setOpen(open) {
      drawer.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
      triggers.forEach(function (t) { t.setAttribute("aria-expanded", String(open)); });

      if (open) {
        lastFocus = document.activeElement;
        var first = drawer.querySelector("a, button");
        if (first) first.focus();
      } else if (lastFocus) {
        lastFocus.focus();
      }
    }

    triggers.forEach(function (t) {
      t.addEventListener("click", function () {
        setOpen(!drawer.classList.contains("is-open"));
      });
    });

    drawer.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) setOpen(false);
    });
  }

  /* ---- Accordion --------------------------------------------------- */
  function initAccordion() {
    document.querySelectorAll(".acc-trigger").forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var item = trigger.closest(".acc-item");
        var isOpen = item.classList.contains("is-open");

        var group = trigger.closest(".accordion");
        if (group) {
          group.querySelectorAll(".acc-item.is-open").forEach(function (other) {
            if (other !== item) {
              other.classList.remove("is-open");
              other.querySelector(".acc-trigger").setAttribute("aria-expanded", "false");
            }
          });
        }

        item.classList.toggle("is-open", !isOpen);
        trigger.setAttribute("aria-expanded", String(!isOpen));
      });
    });
  }

  /* ---- Reveal on scroll --------------------------------------------
     A rAF-throttled sweep rather than an IntersectionObserver: a jump
     scroll (anchor link, reload at offset, scrollbar drag) can carry an
     element from below the fold to above it without ever producing an
     intersection callback, which would leave it stuck at opacity 0. */
  function initReveal() {
    var pending = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!pending.length) return;

    function showAll() {
      pending.forEach(function (el) { el.classList.add("is-visible"); });
      pending = [];
    }

    if (reduceMotion) { showAll(); return; }

    var queued = false;

    function sweep() {
      queued = false;
      var limit = window.innerHeight * 0.92;
      pending = pending.filter(function (el) {
        var top = el.getBoundingClientRect().top;
        if (top > limit) return true;           // still below the fold
        var delay = parseInt(el.getAttribute("data-delay") || "0", 10);
        // Elements already scrolled past appear at once — the stagger
        // only reads as intentional for things entering from below.
        setTimeout(function () { el.classList.add("is-visible"); }, top < 0 ? 0 : delay);
        return false;
      });
      if (!pending.length) {
        window.removeEventListener("scroll", request);
        window.removeEventListener("resize", request);
      }
    }

    function request() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(sweep);
    }

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    // requestAnimationFrame is throttled while the tab is hidden, so sweep
    // directly here and again whenever the page becomes visible — otherwise
    // a background tab restored mid-page would stay blank.
    document.addEventListener("visibilitychange", sweep);
    window.addEventListener("pageshow", sweep);
    // Fonts and images shift layout after first paint; re-check once settled.
    window.addEventListener("load", sweep);
    sweep();
  }

  /* ---- Gallery lightbox ---------------------------------------------- */
  function initLightbox() {
    var triggers = document.querySelectorAll("[data-lightbox]");
    if (!triggers.length) return;

    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Photo viewer");
    box.innerHTML =
      '<button class="icon-btn lightbox__close" type="button" aria-label="Close photo">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
      '<path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '<div><img alt=""><p class="lightbox__caption"></p></div>';
    document.body.appendChild(box);

    var img = box.querySelector("img");
    var caption = box.querySelector(".lightbox__caption");
    var closeBtn = box.querySelector(".lightbox__close");
    var lastFocus = null;

    function close() {
      box.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      if (lastFocus) lastFocus.focus();
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        var source = trigger.querySelector("img");
        if (!source) return;
        lastFocus = trigger;
        img.src = trigger.getAttribute("href") || source.currentSrc || source.src;
        img.alt = source.alt || "";
        caption.textContent = source.alt || "";
        box.classList.add("is-open");
        document.body.classList.add("nav-open");
        closeBtn.focus();
      });
    });

    closeBtn.addEventListener("click", close);
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.tagName === "DIV") close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.classList.contains("is-open")) close();
    });
  }

  /* ---- Menu section scrollspy ------------------------------------------ */
  function initMenuSpy() {
    var nav = document.querySelector(".menu-nav");
    if (!nav || !("IntersectionObserver" in window)) return;

    var links = Array.prototype.slice.call(nav.querySelectorAll("a"));
    var groups = links
      .map(function (a) { return document.querySelector(a.getAttribute("href")); })
      .filter(Boolean);
    if (!groups.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });

    groups.forEach(function (g) { io.observe(g); });
  }

  /* ---- Current year ---------------------------------------------------- */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ---- Boot ------------------------------------------------------------- */
  function boot() {
    initHeader();
    initNav();
    initStatus();
    initHoursTable();
    initAccordion();
    initReveal();
    initLightbox();
    initMenuSpy();
    initYear();
    // Keep the open/closed badge honest on long-lived tabs.
    setInterval(initStatus, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
