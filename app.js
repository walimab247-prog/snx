/*
 * CryptoNewsLantern - site behaviour
 * Vanilla JS, no build step, no external dependencies.
 */
(function () {
  'use strict';

  var onReady = function (fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  };

  /* ------------------------------------------------------------------ */
  /* Fit-text: scales the oversized display headings to their container  */
  /* ------------------------------------------------------------------ */
  function initFitText() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-fit-text]'));
    if (!nodes.length) return;

    function fit(node) {
      var parent = node.parentElement;
      if (!parent) return;
      var available = parent.clientWidth;
      if (!available) return;
      var min = parseFloat(node.getAttribute('data-fit-min')) || 24;
      var max = parseFloat(node.getAttribute('data-fit-max')) || 400;

      node.style.fontSize = max + 'px';
      var width = node.scrollWidth;
      if (!width) return;
      var size = Math.min(max, Math.max(min, (max * available) / width));
      node.style.fontSize = size + 'px';

      /* One corrective pass for fonts with non-linear metrics. */
      if (node.scrollWidth > available) {
        size = Math.max(min, (size * available) / node.scrollWidth);
        node.style.fontSize = size + 'px';
      }
    }

    function fitAll() {
      nodes.forEach(fit);
    }

    fitAll();
    window.addEventListener('resize', fitAll);
    window.addEventListener('orientationchange', fitAll);
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(fitAll);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Carousel with drag, buttons, progress bar and padding controls      */
  /* ------------------------------------------------------------------ */
  function initCarousels() {
    var carousels = Array.prototype.slice.call(document.querySelectorAll('[data-carousel]'));
    carousels.forEach(setupCarousel);
  }

  function readPx(value, fallback) {
    var parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  }

  function setupCarousel(root) {
    var viewport = root.querySelector('[data-carousel-viewport]');
    var track = root.querySelector('[data-carousel-track]');
    if (!viewport || !track) return;

    var items = Array.prototype.slice.call(track.querySelectorAll('[data-carousel-item]'));
    if (!items.length) return;

    var prevBtn = root.querySelector('[data-carousel-prev]');
    var nextBtn = root.querySelector('[data-carousel-next]');
    var progress = root.querySelector('[data-carousel-progress]');
    var paddings = Array.prototype.slice.call(root.querySelectorAll('[data-carousel-padding]'));
    var controlPaddings = Array.prototype.slice.call(
      root.querySelectorAll('[data-carousel-padding-controls]')
    );

    var offset = 0;
    var maxOffset = 0;
    var dragging = false;
    var pointerId = null;
    var startX = 0;
    var startOffset = 0;
    var moved = 0;

    /*
     * The leading/trailing spacers keep the first and last slide aligned with
     * the page content column. They are driven by the CSS variables
     * --width-carousel-padding / --width-carousel-padding-controls, but when a
     * browser cannot resolve those (or the layout is nested) we fall back to a
     * measured value so the arrows never drift away from the content edge.
     */
    function syncPaddings() {
      var styles = window.getComputedStyle(root);
      var contentWidth = readPx(styles.getPropertyValue('--width-content-width'), 0);
      if (!contentWidth) {
        var reference = document.querySelector('.w-content-width');
        contentWidth = reference ? reference.clientWidth : viewport.clientWidth;
      }
      var gutter = Math.max(0, (window.innerWidth - contentWidth) / 2);

      paddings.forEach(function (node) {
        if (!node.clientWidth) node.style.width = Math.max(0, gutter - 16) + 'px';
      });
      controlPaddings.forEach(function (node) {
        if (!node.clientWidth) node.style.width = gutter + 'px';
      });
    }

    function measure() {
      syncPaddings();
      maxOffset = Math.max(0, track.scrollWidth - viewport.clientWidth);
      offset = Math.min(offset, maxOffset);
      render();
    }

    function step() {
      var first = items[0];
      var second = items[1];
      if (second) {
        var delta = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
        if (delta > 1) return delta;
      }
      return first.getBoundingClientRect().width;
    }

    function render() {
      track.style.transform = 'translate3d(' + -offset + 'px, 0px, 0px)';
      if (prevBtn) prevBtn.disabled = offset <= 1;
      if (nextBtn) nextBtn.disabled = offset >= maxOffset - 1;
      if (progress) {
        var ratio = maxOffset > 0 ? offset / maxOffset : 0;
        progress.style.transform = 'translate3d(' + ratio * 100 + '%, 0px, 0px)';
      }
    }

    function goTo(value, animate) {
      offset = Math.min(Math.max(value, 0), maxOffset);
      track.style.transition = animate === false ? 'none' : 'transform 450ms cubic-bezier(0.4, 0, 0.2, 1)';
      render();
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        goTo(offset - step(), true);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        goTo(offset + step(), true);
      });
    }

    viewport.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      dragging = true;
      moved = 0;
      pointerId = event.pointerId;
      startX = event.clientX;
      startOffset = offset;
      track.style.transition = 'none';
      viewport.classList.add('is-dragging');
      if (viewport.setPointerCapture) viewport.setPointerCapture(pointerId);
    });

    viewport.addEventListener('pointermove', function (event) {
      if (!dragging) return;
      var delta = event.clientX - startX;
      moved = Math.abs(delta);
      goTo(startOffset - delta, false);
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove('is-dragging');
      if (pointerId !== null && viewport.releasePointerCapture) {
        try {
          viewport.releasePointerCapture(pointerId);
        } catch (err) {
          /* pointer already released */
        }
      }
      pointerId = null;
      goTo(offset, true);
    }

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('pointerleave', endDrag);

    viewport.addEventListener('click', function (event) {
      if (moved > 8) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);

    root.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') goTo(offset - step(), true);
      if (event.key === 'ArrowRight') goTo(offset + step(), true);
    });

    window.addEventListener('resize', measure);
    measure();
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(measure);
    }
    Array.prototype.slice.call(track.querySelectorAll('img')).forEach(function (img) {
      if (!img.complete) img.addEventListener('load', measure);
    });
  }

  /* ------------------------------------------------------------------ */
  /* FAQ accordion                                                       */
  /* ------------------------------------------------------------------ */
  function initFaq() {
    var sections = Array.prototype.slice.call(document.querySelectorAll('[data-faq]'));
    sections.forEach(function (section) {
      var items = Array.prototype.slice.call(section.querySelectorAll('[data-faq-item]'));

      function close(item) {
        var trigger = item.querySelector('[data-faq-trigger]');
        var answer = item.querySelector('[data-faq-answer]');
        var icon = item.querySelector('[data-faq-icon]');
        item.classList.remove('is-open');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        if (answer) answer.setAttribute('aria-hidden', 'true');
        if (icon) icon.classList.remove('rotate-45');
      }

      function open(item) {
        var trigger = item.querySelector('[data-faq-trigger]');
        var answer = item.querySelector('[data-faq-answer]');
        var icon = item.querySelector('[data-faq-icon]');
        item.classList.add('is-open');
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
        if (answer) answer.setAttribute('aria-hidden', 'false');
        if (icon) icon.classList.add('rotate-45');
      }

      items.forEach(function (item) {
        var trigger = item.querySelector('[data-faq-trigger]');
        if (!trigger) return;
        close(item);

        function toggle() {
          var isOpen = item.classList.contains('is-open');
          items.forEach(close);
          if (!isOpen) open(item);
        }

        trigger.addEventListener('click', toggle);
        trigger.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
            event.preventDefault();
            toggle();
          }
        });
      });

      if (items.length) open(items[0]);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Mobile navigation                                                   */
  /* ------------------------------------------------------------------ */
  function initNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var panel = document.querySelector('[data-nav-panel]');
    if (!toggle || !panel) return;

    function setOpen(open) {
      panel.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    toggle.addEventListener('click', function () {
      setOpen(!panel.classList.contains('is-open'));
    });

    panel.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setOpen(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 768) setOpen(false);
    });

    setOpen(false);
  }

  /* ------------------------------------------------------------------ */
  /* Misc: smooth anchors, active link, current year                     */
  /* ------------------------------------------------------------------ */
  function initAnchors() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  }

  function initActiveLinks() {
    var current = window.location.pathname.split('/').pop() || 'index.html';
    Array.prototype.slice.call(document.querySelectorAll('[data-nav-link]')).forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      if (href.split('#')[0] === current) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function initYear() {
    Array.prototype.slice.call(document.querySelectorAll('[data-current-year]')).forEach(function (node) {
      node.textContent = String(new Date().getFullYear());
    });
  }

  onReady(function () {
    initNav();
    initFitText();
    initCarousels();
    initFaq();
    initAnchors();
    initActiveLinks();
    initYear();
  });
})();
