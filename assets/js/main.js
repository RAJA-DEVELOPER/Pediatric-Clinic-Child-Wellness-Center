/**
 * PediaCare — Shared JavaScript
 * main.js — All shared interactive functionality
 * Version: 1.0.0
 */

'use strict';

/* ============================================================
   UTILITY: LocalStorage / Cookie Helpers
   ============================================================ */
const Store = {
  get(key, fallback = null) {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },
  clear() {
    try { localStorage.clear(); } catch {}
  }
};

const Cookie = {
  set(name, value, days = 30) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
  },
  get(name) {
    const match = document.cookie
      .split('; ')
      .find(row => row.startsWith(encodeURIComponent(name) + '='));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
  },
  remove(name) {
    this.set(name, '', -1);
  }
};

/* ============================================================
   THEME: Dark / Light Mode
   ============================================================ */
const Theme = {
  STORAGE_KEY: 'pedia_theme',
  DARK: 'dark',
  LIGHT: 'light',

  init() {
    const saved = Store.get(this.STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? this.DARK : this.LIGHT);
    this.apply(theme, false);
    this._bindToggle();
    this._listenSystem();
  },

  apply(theme, save = true) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    if (save) Store.set(this.STORAGE_KEY, theme);
    this._updateToggleUI(theme);
    document.dispatchEvent(new CustomEvent('pedia:themechange', { detail: { theme } }));
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || this.LIGHT;
    this.apply(current === this.DARK ? this.LIGHT : this.DARK);
  },

  current() {
    return document.documentElement.getAttribute('data-theme') || this.LIGHT;
  },

  _updateToggleUI(theme) {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.setAttribute('aria-label', theme === this.DARK ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('title', theme === this.DARK ? 'Light mode' : 'Dark mode');
    });
  },

  _bindToggle() {
    document.addEventListener('click', e => {
      if (e.target.closest('.theme-toggle')) {
        this.toggle();
      }
    });
  },

  _listenSystem() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!Store.get(this.STORAGE_KEY)) {
        this.apply(e.matches ? this.DARK : this.LIGHT, false);
      }
    });
  }
};

/* ============================================================
   RTL: Right-to-Left Support
   ============================================================ */
const RTL = {
  STORAGE_KEY: 'pedia_dir',

  init() {
    const saved = Store.get(this.STORAGE_KEY);
    if (saved) this.apply(saved, false);
    this._bindToggle();
  },

  apply(dir, save = true) {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', dir === 'rtl' ? 'ar' : 'en');
    if (save) Store.set(this.STORAGE_KEY, dir);
    document.querySelectorAll('.rtl-toggle').forEach(btn => {
      btn.textContent = dir === 'rtl' ? 'LTR' : 'RTL';
      btn.setAttribute('aria-label', dir === 'rtl' ? 'Switch to LTR' : 'Switch to RTL');
    });
    document.dispatchEvent(new CustomEvent('pedia:dirchange', { detail: { dir } }));
  },

  toggle() {
    const current = document.documentElement.getAttribute('dir') || 'ltr';
    this.apply(current === 'rtl' ? 'ltr' : 'rtl');
  },

  _bindToggle() {
    document.addEventListener('click', e => {
      if (e.target.closest('.rtl-toggle')) this.toggle();
    });
  }
};

/* ============================================================
   NAVBAR: Sticky scroll + hamburger menu
   ============================================================ */
const Navbar = {
  SCROLL_THRESHOLD: 50,

  init() {
    this.navbar = document.querySelector('.pedia-navbar');
    this.hamburger = document.querySelector('.navbar-hamburger');
    this.overlay = document.querySelector('.mobile-nav-overlay');
    this.drawer = document.querySelector('.mobile-nav-drawer');
    this.drawerClose = document.querySelector('.drawer-close-btn');

    this._bindScroll();
    this._bindHamburger();
    this._bindOverlay();
    this._bindNavLinks();
    this._bindDropdowns();
    this._setActiveLink();
  },

  _bindScroll() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (this.navbar) {
            this.navbar.classList.toggle('scrolled', window.scrollY > this.SCROLL_THRESHOLD);
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  },

  openDrawer() {
    this.hamburger?.classList.add('open');
    this.drawer?.classList.add('open');
    this.overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.drawer?.querySelector('a')?.focus();
  },

  closeDrawer() {
    this.hamburger?.classList.remove('open');
    this.drawer?.classList.remove('open');
    this.overlay?.classList.remove('open');
    document.body.style.overflow = '';
  },

  _bindHamburger() {
    this.hamburger?.addEventListener('click', () => {
      if (this.drawer?.classList.contains('open')) {
        this.closeDrawer();
      } else {
        this.openDrawer();
      }
    });
  },

  _bindOverlay() {
    this.overlay?.addEventListener('click', () => this.closeDrawer());
    this.drawerClose?.addEventListener('click', () => this.closeDrawer());
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.closeDrawer();
    });
  },

  _bindNavLinks() {
    this.drawer?.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => this.closeDrawer());
    });
  },

  _bindDropdowns() {
    document.querySelectorAll('.nav-item.has-dropdown').forEach(item => {
      const link = item.querySelector('a');
      link?.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.classList.toggle('open');
        }
      });
    });
  },

  _setActiveLink() {
    const path = window.location.pathname;
    document.querySelectorAll('.navbar-nav-links .nav-item > a, .mobile-nav-drawer .nav-links a').forEach(link => {
      const href = link.getAttribute('href');
      if (href && path.endsWith(href)) {
        link.classList.add('active');
      }
    });
  }
};

/* ============================================================
   SCROLL ANIMATIONS: Intersection Observer
   ============================================================ */
const ScrollAnimator = {
  CLASSES: ['fade-in', 'slide-up', 'slide-left', 'slide-right', 'scale-in', 'bounce-in', 'stagger-children'],

  init() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: show all
      this.CLASSES.forEach(cls => {
        document.querySelectorAll(`.${cls}`).forEach(el => el.classList.add('animated'));
      });
      return;
    }

    const options = {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          this.observer.unobserve(entry.target);
        }
      });
    }, options);

    const selector = this.CLASSES.map(c => `.${c}`).join(', ');
    document.querySelectorAll(selector).forEach(el => this.observer.observe(el));
  },

  observe(el) {
    this.observer?.observe(el);
  }
};

/* ============================================================
   SMOOTH SCROLL
   ============================================================ */
const SmoothScroll = {
  init() {
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const target = link.getAttribute('href');
      if (target === '#') return;
      const el = document.querySelector(target);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Update URL without jump
        history.pushState(null, '', target);
      }
    });
  }
};

/* ============================================================
   FAQ ACCORDION
   ============================================================ */
const FAQ = {
  init() {
    document.querySelectorAll('.faq-item').forEach(item => {
      const question = item.querySelector('.faq-question');
      question?.addEventListener('click', () => this.toggle(item));
      question?.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggle(item);
        }
      });
      question?.setAttribute('role', 'button');
      question?.setAttribute('tabindex', '0');
    });
  },

  toggle(item) {
    const isOpen = item.classList.contains('open');
    // Close siblings in same container
    item.closest('.faq-list, [data-faq-group]')?.querySelectorAll('.faq-item.open').forEach(openItem => {
      if (openItem !== item) this.close(openItem);
    });
    isOpen ? this.close(item) : this.open(item);
  },

  open(item) {
    item.classList.add('open');
    const answer = item.querySelector('.faq-answer');
    if (answer) {
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
    item.querySelector('.faq-question')?.setAttribute('aria-expanded', 'true');
  },

  close(item) {
    item.classList.remove('open');
    const answer = item.querySelector('.faq-answer');
    if (answer) {
      answer.style.maxHeight = '0';
    }
    item.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
  }
};

/* ============================================================
   FORM VALIDATION
   ============================================================ */
const FormValidator = {
  rules: {
    required: (val) => val.trim() !== '',
    email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    phone: (val) => /^[\+]?[\d\s\-\(\)]{7,15}$/.test(val.trim()),
    minLength: (val, min) => val.trim().length >= parseInt(min),
    maxLength: (val, max) => val.trim().length <= parseInt(max),
    numeric: (val) => /^\d+$/.test(val.trim()),
    match: (val, targetId) => {
      const target = document.getElementById(targetId);
      return target ? val === target.value : false;
    }
  },

  messages: {
    required: 'This field is required.',
    email: 'Please enter a valid email address.',
    phone: 'Please enter a valid phone number.',
    minLength: (min) => `Minimum ${min} characters required.`,
    maxLength: (max) => `Maximum ${max} characters allowed.`,
    numeric: 'Please enter numbers only.',
    match: 'Values do not match.'
  },

  init() {
    document.querySelectorAll('form[data-validate]').forEach(form => {
      form.addEventListener('submit', e => {
        if (!this.validateForm(form)) {
          e.preventDefault();
          e.stopPropagation();
        }
      });
      form.querySelectorAll('[data-rules]').forEach(input => {
        input.addEventListener('blur', () => this.validateField(input));
        input.addEventListener('input', () => {
          if (input.classList.contains('is-invalid')) {
            this.validateField(input);
          }
        });
      });
    });
  },

  validateForm(form) {
    let valid = true;
    form.querySelectorAll('[data-rules]').forEach(input => {
      if (!this.validateField(input)) valid = false;
    });
    return valid;
  },

  validateField(input) {
    const rules = input.dataset.rules?.split('|') || [];
    let error = null;

    for (const rule of rules) {
      const [ruleName, ...params] = rule.split(':');
      const fn = this.rules[ruleName];
      if (fn && !fn(input.value, ...params)) {
        const msg = this.messages[ruleName];
        error = typeof msg === 'function' ? msg(...params) : (msg || `Invalid value.`);
        break;
      }
    }

    this._setFieldState(input, error);
    return !error;
  },

  _setFieldState(input, error) {
    const wrapper = input.closest('.form-group') || input.parentElement;
    input.classList.toggle('is-invalid', !!error);
    input.classList.toggle('is-valid', !error && input.value.trim() !== '');

    let feedback = wrapper?.querySelector('.form-feedback');
    if (error) {
      if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'form-feedback invalid';
        input.insertAdjacentElement('afterend', feedback);
      }
      feedback.className = 'form-feedback invalid';
      feedback.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${error}`;
    } else if (feedback) {
      feedback.remove();
    }
  },

  /**
   * Programmatically validate a field
   * @param {string} inputId
   * @returns {boolean}
   */
  check(inputId) {
    const input = document.getElementById(inputId);
    return input ? this.validateField(input) : false;
  }
};

/* ============================================================
   APPOINTMENT BOOKING MODAL
   ============================================================ */
const AppointmentModal = {
  modalId: 'appointmentModal',
  currentStep: 1,
  totalSteps: 3,
  data: {
    doctor: null,
    date: null,
    time: null,
    reason: null
  },

  init() {
    this.modal = document.getElementById(this.modalId);
    if (!this.modal) return;

    this.backdrop = this.modal.querySelector('.modal-backdrop-pedia');
    this.content = this.modal.querySelector('.modal-content-pedia');
    this.closeBtn = this.modal.querySelector('.modal-close-btn');

    this.closeBtn?.addEventListener('click', () => this.close());
    this.backdrop?.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.modal.classList.contains('open')) this.close();
    });

    // Trigger buttons
    document.querySelectorAll('[data-open-appointment]').forEach(btn => {
      btn.addEventListener('click', () => {
        const doctor = btn.dataset.doctor || null;
        this.open(doctor);
      });
    });
  },

  open(doctor = null) {
    if (doctor) this.data.doctor = doctor;
    this.modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.content?.focus();
    this._renderStep(1);
  },

  close() {
    this.modal.classList.remove('open');
    document.body.style.overflow = '';
    this.currentStep = 1;
    this.data = { doctor: null, date: null, time: null, reason: null };
  },

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this._renderStep(this.currentStep + 1);
    }
  },

  prevStep() {
    if (this.currentStep > 1) {
      this._renderStep(this.currentStep - 1);
    }
  },

  _renderStep(step) {
    this.currentStep = step;
    document.querySelectorAll(`#${this.modalId} .step-panel`).forEach((panel, i) => {
      panel.classList.toggle('active', i + 1 === step);
    });
    document.querySelectorAll(`#${this.modalId} .step-item`).forEach((item, i) => {
      item.classList.toggle('active', i + 1 === step);
      item.classList.toggle('completed', i + 1 < step);
    });
  },

  submit() {
    document.dispatchEvent(new CustomEvent('pedia:appointmentbooked', { detail: this.data }));
    Toast.show('Appointment booked successfully!', 'success');
    this.close();
  }
};

/* ============================================================
   NOTIFICATION DROPDOWN
   ============================================================ */
const NotificationBell = {
  init() {
    document.querySelectorAll('.notification-bell').forEach(bell => {
      const wrapper = bell.closest('.notification-bell-wrapper');
      const dropdown = wrapper?.querySelector('.notification-dropdown');
      if (!dropdown) return;

      bell.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        this.closeAll();
        if (!isOpen) dropdown.classList.add('open');
      });
    });

    document.addEventListener('click', () => this.closeAll());

    document.querySelectorAll('.notification-mark-all').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.notification-dropdown')
          ?.querySelectorAll('.notification-item.unread')
          .forEach(item => item.classList.remove('unread'));
        const bell = btn.closest('.notification-bell-wrapper')?.querySelector('.notification-bell .badge-dot');
        if (bell) bell.style.display = 'none';
      });
    });
  },

  closeAll() {
    document.querySelectorAll('.notification-dropdown.open').forEach(d => d.classList.remove('open'));
  }
};

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
const Toast = {
  container: null,
  DURATION: 4000,

  init() {
    this.container = document.querySelector('.toast-container-pedia');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container-pedia';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = this.DURATION) {
    if (!this.container) this.init();

    const icons = {
      success: 'fa-circle-check',
      danger:  'fa-circle-xmark',
      warning: 'fa-triangle-exclamation',
      info:    'fa-circle-info'
    };

    const colors = {
      success: 'var(--color-success)',
      danger:  'var(--color-danger)',
      warning: 'var(--color-warning)',
      info:    'var(--color-info)'
    };

    const toast = document.createElement('div');
    toast.className = 'toast-pedia';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <i class="fa-solid ${icons[type] || icons.info}" style="color:${colors[type] || colors.info};font-size:1.1rem;flex-shrink:0;margin-top:1px"></i>
      <div style="flex:1;font-size:0.875rem;color:var(--text-secondary);line-height:1.5">${message}</div>
      <button onclick="this.closest('.toast-pedia').remove()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:0;line-height:1;font-size:0.875rem;flex-shrink:0">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);

    return toast;
  }
};

/* ============================================================
   COUNTER ANIMATION (Stats)
   ============================================================ */
const Counter = {
  init() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-counter]').forEach(el => observer.observe(el));
  },

  animate(el) {
    const target = parseFloat(el.dataset.counter);
    const duration = parseInt(el.dataset.duration || '1800');
    const decimals = parseInt(el.dataset.decimals || '0');
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = eased * target;
      el.textContent = prefix + value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }
};

/* ============================================================
   TABS COMPONENT
   ============================================================ */
const Tabs = {
  init() {
    document.querySelectorAll('[data-tabs]').forEach(container => {
      container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.activate(btn, container);
        });
        btn.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.activate(btn, container);
          }
        });
      });
    });

    // Also handle individual tab buttons without data-tabs wrapper
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-tab-target]');
      if (!btn) return;
      const targetId = btn.dataset.tabTarget;
      const target = document.getElementById(targetId);
      if (!target) return;

      const group = btn.dataset.tabGroup;
      if (group) {
        document.querySelectorAll(`[data-tab-group="${group}"]`).forEach(b => b.classList.remove('active'));
        document.querySelectorAll(`[data-tab-panel="${group}"]`).forEach(p => p.classList.remove('active'));
      }

      btn.classList.add('active');
      target.classList.add('active');
    });
  },

  activate(btn, container) {
    const targetId = btn.dataset.target || btn.dataset.tabTarget;
    container.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    if (targetId) {
      const panel = document.getElementById(targetId) || container.querySelector(targetId);
      panel?.classList.add('active');
    }

    container.dispatchEvent(new CustomEvent('pedia:tabchange', { detail: { tab: targetId, btn } }));
  }
};

/* ============================================================
   BACK TO TOP BUTTON
   ============================================================ */
const BackToTop = {
  SHOW_THRESHOLD: 400,

  init() {
    this.btn = document.querySelector('.back-to-top');
    if (!this.btn) {
      this.btn = document.createElement('button');
      this.btn.className = 'back-to-top';
      this.btn.setAttribute('aria-label', 'Back to top');
      this.btn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
      document.body.appendChild(this.btn);
    }

    this.btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.btn.classList.toggle('visible', window.scrollY > this.SHOW_THRESHOLD);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }
};

/* ============================================================
   DASHBOARD SIDEBAR (collapse / mobile)
   ============================================================ */
const DashboardSidebar = {
  STORAGE_KEY: 'pedia_sidebar_collapsed',

  init() {
    this.sidebar = document.querySelector('.dashboard-sidebar');
    this.wrapper = document.querySelector('.dashboard-wrapper');
    this.overlay = document.querySelector('.sidebar-overlay');
    this.toggleBtn = document.querySelector('.sidebar-toggle-btn');
    this.mobileToggle = document.querySelector('.topbar-mobile-toggle');

    if (!this.sidebar) return;

    // Restore collapsed state
    if (Store.get(this.STORAGE_KEY)) {
      this.wrapper?.classList.add('sidebar-collapsed');
    }

    this.toggleBtn?.addEventListener('click', () => this.toggleCollapse());
    this.mobileToggle?.addEventListener('click', () => this.openMobile());
    this.overlay?.addEventListener('click', () => this.closeMobile());

    // Sub-menu toggles
    this.sidebar.querySelectorAll('[data-submenu]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const item = link.closest('.sidebar-nav-item');
        item?.classList.toggle('open');
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.closeMobile();
    });
  },

  toggleCollapse() {
    this.wrapper?.classList.toggle('sidebar-collapsed');
    const isCollapsed = this.wrapper?.classList.contains('sidebar-collapsed');
    Store.set(this.STORAGE_KEY, isCollapsed);
  },

  openMobile() {
    this.sidebar?.classList.add('mobile-open');
    this.overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeMobile() {
    this.sidebar?.classList.remove('mobile-open');
    this.overlay?.classList.remove('active');
    document.body.style.overflow = '';
  }
};

/* ============================================================
   CHART FILTER BUTTONS
   ============================================================ */
const ChartFilter = {
  init() {
    document.querySelectorAll('.chart-controls').forEach(group => {
      group.querySelectorAll('.chart-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('.chart-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const container = btn.closest('.growth-chart-container, .dashboard-chart-card');
          container?.dispatchEvent(new CustomEvent('pedia:chartfilter', {
            detail: { filter: btn.dataset.filter, label: btn.textContent }
          }));
        });
      });
    });
  }
};

/* ============================================================
   ALERT DISMISS
   ============================================================ */
const Alerts = {
  init() {
    document.addEventListener('click', e => {
      const closeBtn = e.target.closest('.alert-close');
      if (!closeBtn) return;
      const alert = closeBtn.closest('.alert-pedia');
      if (alert) {
        alert.style.transition = 'opacity 0.25s, transform 0.25s';
        alert.style.opacity = '0';
        alert.style.transform = 'scale(0.97)';
        setTimeout(() => alert.remove(), 250);
      }
    });
  }
};

/* ============================================================
   KANBAN DRAG & DROP (Dashboard)
   ============================================================ */
const Kanban = {
  draggedCard: null,

  init() {
    document.querySelectorAll('.kanban-card').forEach(card => {
      card.setAttribute('draggable', 'true');
      card.addEventListener('dragstart', e => {
        this.draggedCard = card;
        card.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        card.style.opacity = '';
        this.draggedCard = null;
      });
    });

    document.querySelectorAll('.kanban-cards').forEach(zone => {
      zone.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        zone.classList.add('drag-over');
      });
      zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        if (this.draggedCard) {
          zone.appendChild(this.draggedCard);
        }
      });
    });
  }
};

/* ============================================================
   SETTINGS TOGGLE SWITCHES
   ============================================================ */
const Settings = {
  init() {
    document.querySelectorAll('.settings-sidebar-link').forEach(link => {
      link.addEventListener('click', () => {
        const targetId = link.dataset.target;
        document.querySelectorAll('.settings-sidebar-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.settings-panel[data-panel]').forEach(p => p.style.display = 'none');
        link.classList.add('active');
        const panel = document.querySelector(`.settings-panel[data-panel="${targetId}"]`);
        if (panel) panel.style.display = '';
      });
    });
  }
};

/* ============================================================
   SWIPER INIT HELPERS
   ============================================================ */
const Sliders = {
  init() {
    if (typeof Swiper === 'undefined') return;

    // Testimonial slider
    if (document.querySelector('.testimonials-swiper')) {
      new Swiper('.testimonials-swiper', {
        slidesPerView: 1,
        spaceBetween: 24,
        loop: true,
        autoplay: { delay: 5000, disableOnInteraction: false },
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        breakpoints: {
          640:  { slidesPerView: 1.5 },
          768:  { slidesPerView: 2 },
          1024: { slidesPerView: 3 }
        }
      });
    }

    // Doctors slider
    if (document.querySelector('.doctors-swiper')) {
      new Swiper('.doctors-swiper', {
        slidesPerView: 1.2,
        spaceBetween: 20,
        loop: false,
        pagination: { el: '.doctors-swiper-pagination', clickable: true },
        breakpoints: {
          480:  { slidesPerView: 2 },
          768:  { slidesPerView: 3 },
          1024: { slidesPerView: 4 }
        }
      });
    }

    // Generic hero slider
    if (document.querySelector('.hero-swiper')) {
      new Swiper('.hero-swiper', {
        effect: 'fade',
        loop: true,
        autoplay: { delay: 6000, disableOnInteraction: false },
        pagination: { el: '.hero-pagination', clickable: true }
      });
    }
  }
};

/* ============================================================
   SKELETON LOADER
   ============================================================ */
const Skeleton = {
  show(container) {
    container?.querySelectorAll('[data-skeleton]').forEach(el => {
      el.dataset.originalContent = el.innerHTML;
      const h = el.dataset.skeletonHeight || '16px';
      const w = el.dataset.skeletonWidth || '100%';
      el.innerHTML = `<span class="skeleton" style="display:block;height:${h};width:${w};border-radius:4px"></span>`;
    });
  },

  hide(container) {
    container?.querySelectorAll('[data-skeleton]').forEach(el => {
      if (el.dataset.originalContent !== undefined) {
        el.innerHTML = el.dataset.originalContent;
        delete el.dataset.originalContent;
      }
    });
  }
};

/* ============================================================
   DATE PICKER (Simple)
   ============================================================ */
const DatePicker = {
  init() {
    document.querySelectorAll('.date-picker-grid').forEach(grid => {
      grid.querySelectorAll('.date-cell:not(.disabled)').forEach(cell => {
        cell.addEventListener('click', () => {
          grid.querySelectorAll('.date-cell').forEach(c => c.classList.remove('selected'));
          cell.classList.add('selected');
          const container = grid.closest('[data-datepicker-container]');
          container?.dispatchEvent(new CustomEvent('pedia:dateselect', {
            detail: { date: cell.dataset.date, label: cell.textContent }
          }));
        });
      });
    });

    document.querySelectorAll('.time-slot:not(.taken)').forEach(slot => {
      slot.addEventListener('click', () => {
        const group = slot.closest('.time-slots-grid');
        group?.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
        slot.classList.add('selected');
      });
    });
  }
};

/* ============================================================
   PRINT HELPER
   ============================================================ */
const Print = {
  init() {
    document.querySelectorAll('[data-print]').forEach(btn => {
      btn.addEventListener('click', () => window.print());
    });
  }
};

/* ============================================================
   GLOBAL HELPERS
   ============================================================ */

/**
 * Debounce utility
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Format a date to locale string
 * @param {string|Date} date
 * @param {object} opts
 * @returns {string}
 */
function formatDate(date, opts = { year: 'numeric', month: 'long', day: 'numeric' }) {
  return new Intl.DateTimeFormat('en-US', opts).format(new Date(date));
}

/**
 * Capitalize first letter
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

/**
 * Generate a random ID
 * @returns {string}
 */
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Trap focus inside element (for modals)
 * @param {HTMLElement} container
 */
function trapFocus(container) {
  const focusable = container.querySelectorAll(
    'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  container.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  });
}

// Expose globals
window.PediaCare = {
  Theme,
  RTL,
  Navbar,
  ScrollAnimator,
  SmoothScroll,
  FAQ,
  FormValidator,
  AppointmentModal,
  NotificationBell,
  Toast,
  Counter,
  Tabs,
  BackToTop,
  DashboardSidebar,
  ChartFilter,
  Alerts,
  Kanban,
  Settings,
  Sliders,
  Skeleton,
  DatePicker,
  Store,
  Cookie,
  utils: { debounce, formatDate, capitalize, uid, trapFocus }
};

/* ============================================================
   BOOTSTRAP TOOLTIP INIT
   ============================================================ */
function initBootstrapTooltips() {
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    const tooltipEls = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipEls.forEach(el => new bootstrap.Tooltip(el, { trigger: 'hover focus' }));
  }
}

/* ============================================================
   BOOTSTRAP POPOVER INIT
   ============================================================ */
function initBootstrapPopovers() {
  if (typeof bootstrap !== 'undefined' && bootstrap.Popover) {
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => new bootstrap.Popover(el));
  }
}

/* ============================================================
   DOCUMENT READY — INIT ALL
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Core
  Theme.init();
  RTL.init();
  Navbar.init();
  SmoothScroll.init();
  BackToTop.init();

  // Animations
  ScrollAnimator.init();
  Counter.init();

  // Components
  FAQ.init();
  FormValidator.init();
  Tabs.init();
  Alerts.init();
  DatePicker.init();
  Print.init();
  ChartFilter.init();

  // Modals & Dropdowns
  AppointmentModal.init();
  NotificationBell.init();
  Toast.init();

  // Dashboard (runs only if dashboard elements exist)
  DashboardSidebar.init();
  Kanban.init();
  Settings.init();

  // Third-party
  Sliders.init();
  initBootstrapTooltips();
  initBootstrapPopovers();

  // Mark body as JS-enhanced
  document.body.classList.add('js-ready');

  // Dispatch ready event
  document.dispatchEvent(new Event('pedia:ready'));
});

/* ============================================================
   WINDOW LOAD — deferred tasks
   ============================================================ */
window.addEventListener('load', () => {
  // Hide any loading screens
  document.querySelector('.page-loader')?.classList.add('hidden');
  document.dispatchEvent(new Event('pedia:loaded'));
});
