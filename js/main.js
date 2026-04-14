// Claude Thinking — Presentation Engine

document.addEventListener('DOMContentLoaded', () => {
  initProgressBar();
  initScrollAnimations();
  initNavDots();
  initThinkingFlows();
  initTabs();
  initCounters();
  initBackToTop();
  initKeyboardToast();
  initTouchSwipe();
});

// ===== PROGRESS BAR =====
function initProgressBar() {
  const bar = document.createElement('div');
  bar.className = 'progress-bar';
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = progress + '%';
  }, { passive: true });
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.fade-in, .stagger, .tf-step').forEach(el => {
    observer.observe(el);
  });
}

// ===== NAV DOTS =====
function initNavDots() {
  const allSlides = Array.from(document.querySelectorAll('.slide'));
  if (allSlides.length === 0) return;

  // Part 구분 슬라이드만 dot으로 표시 (slide--chapter + 표지)
  const partSlides = allSlides.filter(s =>
    s.classList.contains('slide--chapter') || s.classList.contains('slide--title')
  );
  if (partSlides.length === 0) return;

  const nav = document.createElement('div');
  nav.className = 'nav';

  partSlides.forEach((slide) => {
    const dot = document.createElement('div');
    dot.className = 'nav-dot';
    dot.dataset.label = slide.dataset.title || '';
    dot.addEventListener('click', () => {
      slide.scrollIntoView({ behavior: 'smooth' });
    });
    nav.appendChild(dot);
  });

  // Tooltip element
  const tooltip = document.createElement('div');
  tooltip.className = 'nav-tooltip';
  nav.appendChild(tooltip);

  nav.addEventListener('mouseover', (e) => {
    const dot = e.target.closest('.nav-dot');
    if (!dot) { tooltip.style.opacity = '0'; return; }
    tooltip.textContent = dot.dataset.label;
    const rect = dot.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    tooltip.style.top = (rect.top - navRect.top + rect.height / 2) + 'px';
    tooltip.style.opacity = '1';
  });
  nav.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });

  document.body.appendChild(nav);

  const dots = nav.querySelectorAll('.nav-dot');

  // Track active chapter dot + sub-slide progress
  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const slideIdx = allSlides.indexOf(entry.target);
        // Find which chapter section this slide belongs to
        let chapterIdx = -1;
        for (let i = partSlides.length - 1; i >= 0; i--) {
          if (allSlides.indexOf(partSlides[i]) <= slideIdx) {
            chapterIdx = i;
            break;
          }
        }
        if (chapterIdx !== -1) {
          dots.forEach((d, i) => {
            d.classList.toggle('active', i === chapterIdx);
          });
        }
      }
    });
  }, { threshold: 0.5 });

  allSlides.forEach(slide => slideObserver.observe(slide));
}

// ===== THINKING FLOW ANIMATION =====
function initThinkingFlows() {
  document.querySelectorAll('.thinking-flow').forEach(flow => {
    const steps = flow.querySelectorAll('.tf-step');
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        steps.forEach((step, i) => {
          setTimeout(() => step.classList.add('visible'), i * 200);
        });
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(flow);
  });
}

// ===== TABS =====
function initTabs() {
  document.querySelectorAll('.tabs').forEach(tabContainer => {
    const tabs = tabContainer.querySelectorAll('.tab');
    const parent = tabContainer.parentElement;
    const contents = parent.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        parent.querySelector(`.tab-content[data-tab="${target}"]`)?.classList.add('active');
      });
    });
  });
}

// ===== COUNTER ANIMATION =====
function initCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.count);
        animateCount(entry.target, 0, target, 1200);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
}

function animateCount(el, start, end, duration) {
  const range = end - start;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    el.textContent = Math.round(start + range * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ===== BACK TO TOP =====
function initBackToTop() {
  const btn = document.querySelector('.btn-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > window.innerHeight);
  }, { passive: true });

  btn.addEventListener('click', () => {
    document.querySelector('.slide').scrollIntoView({ behavior: 'smooth' });
  });
}

// ===== KEYBOARD TOAST =====
function initKeyboardToast() {
  if ('ontouchstart' in window) return; // skip on mobile
  if (sessionStorage.getItem('ct-toast-shown')) return;

  const toast = document.createElement('div');
  toast.className = 'keyboard-toast';
  toast.innerHTML = '<span>↑↓</span> 키로 이동 · <span>Space</span> 다음 슬라이드';
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 400);
  }, 4000);

  sessionStorage.setItem('ct-toast-shown', '1');
}

// ===== TOUCH SWIPE =====
function initTouchSwipe() {
  const slides = document.querySelectorAll('.slide');
  if (slides.length === 0) return;
  const slideArr = Array.from(slides);

  let startY = 0;
  document.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const diff = startY - e.changedTouches[0].clientY;
    if (Math.abs(diff) < 60) return; // too short

    const current = slideArr.findIndex(s => {
      const rect = s.getBoundingClientRect();
      return rect.top >= -100 && rect.top <= window.innerHeight / 2;
    });

    if (diff > 0 && current < slideArr.length - 1) {
      slideArr[current + 1].scrollIntoView({ behavior: 'smooth' });
    } else if (diff < 0 && current > 0) {
      slideArr[current - 1].scrollIntoView({ behavior: 'smooth' });
    }
  }, { passive: true });
}

// ===== KEYBOARD NAVIGATION =====
(function() {
  const slides = document.querySelectorAll('.slide');
  if (slides.length === 0) return;
  const slideArr = Array.from(slides);

  document.addEventListener('keydown', (e) => {
    const current = slideArr.findIndex(s => {
      const rect = s.getBoundingClientRect();
      return rect.top >= -100 && rect.top <= window.innerHeight / 2;
    });

    if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      const next = Math.min(current + 1, slideArr.length - 1);
      slideArr[next].scrollIntoView({ behavior: 'smooth' });
    }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      const prev = Math.max(current - 1, 0);
      slideArr[prev].scrollIntoView({ behavior: 'smooth' });
    }
  });
})();
