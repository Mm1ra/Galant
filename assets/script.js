(() => {
  const body = document.body;
  const html = document.documentElement;
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const bookingDialog = document.querySelector('#booking');
  const bookingForm = document.querySelector('[data-booking-form]');
  const serviceInput = document.querySelector('#booking-service');
  const durationSelect = document.querySelector('#booking-duration');
  const dateInput = document.querySelector('#booking-date');
  const status = document.querySelector('[data-form-status]');

  const setMenu = (open) => {
    if (!menuToggle || !mobileMenu) return;
    body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
  };

  menuToggle?.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && body.classList.contains('menu-open')) setMenu(false);
  });

  const themeKey = 'galant-theme';
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const applyTheme = (theme, persist) => {
    html.dataset.theme = theme;
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
      themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
    }
    if (persist) {
      try {
        localStorage.setItem(themeKey, theme);
      } catch (error) {}
    }
  };
  applyTheme(html.dataset.theme || 'light', false);
  themeToggle?.addEventListener('click', () => {
    applyTheme(html.dataset.theme === 'dark' ? 'light' : 'dark', true);
  });
  const colorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSchemeChange = (event) => {
    let saved = null;
    try {
      saved = localStorage.getItem(themeKey);
    } catch (error) {}
    if (saved) return;
    applyTheme(event.matches ? 'dark' : 'light', false);
  };
  if (colorSchemeMedia.addEventListener) colorSchemeMedia.addEventListener('change', handleSchemeChange);
  else colorSchemeMedia.addListener(handleSchemeChange);

  const openBooking = (service = '', duration = '') => {
    if (!bookingDialog) return;
    if (serviceInput) serviceInput.value = service || 'Прогулка или тренировка';
    if (durationSelect) durationSelect.value = duration ? String(duration) : '';
    setMenu(false);
    if (typeof bookingDialog.showModal === 'function') bookingDialog.showModal();
    else bookingDialog.setAttribute('open', '');
    window.setTimeout(() => document.querySelector('#booking-name')?.focus(), 80);
  };

  document.querySelectorAll('[data-booking]').forEach((button) => {
    button.addEventListener('click', () => openBooking(button.dataset.booking, button.dataset.duration));
  });

  document.querySelectorAll('[data-booking-close]').forEach((button) => {
    button.addEventListener('click', () => bookingDialog?.close());
  });

  bookingDialog?.addEventListener('click', (event) => {
    const bounds = bookingDialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) bookingDialog.close();
  });

  if (dateInput) {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    dateInput.min = new Date(today.getTime() - offset * 60000).toISOString().split('T')[0];
  }

  bookingForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!bookingForm.reportValidity()) return;
    const formData = new FormData(bookingForm);
    const service = String(formData.get('service') || '').trim();
    const name = String(formData.get('name') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const duration = String(formData.get('duration') || '').trim();
    const date = String(formData.get('date') || '').trim();
    const comment = String(formData.get('comment') || '').trim();
    const durationLabels = {30: '30 минут', 60: '1 час', 90: '1,5 часа', 120: '2 часа', 240: '4 часа', 480: '8 часов'};
    const message = [
      'Здравствуйте! Хочу записаться в клуб Galant.',
      '',
      `Услуга: ${service}`,
      `Имя: ${name}`,
      `Телефон: ${phone}`,
      `Продолжительность: ${durationLabels[duration] || duration}`,
      date ? `Желаемая дата: ${date}` : '',
      comment ? `Опыт и желаемый темп: ${comment}` : ''
    ].filter(Boolean).join('\n');
    const url = `https://wa.me/79997156651?text=${encodeURIComponent(message)}`;
    if (status) status.textContent = 'Открываем WhatsApp для отправки заявки…';
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => {
      bookingDialog?.close();
      bookingForm.reset();
      if (status) status.textContent = '';
    }, 900);
  });

  document.querySelectorAll('[role="tablist"]').forEach((tabList) => {
    const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
    const activate = (tab) => {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(item.getAttribute('aria-controls'));
        if (panel) panel.hidden = !selected;
      });
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const offset = event.key === 'ArrowRight' ? 1 : -1;
        const next = tabs[(index + offset + tabs.length) % tabs.length];
        next.focus();
        activate(next);
      });
    });

    const tabByHash = { '#beginner': 'tab-beginner', '#experienced': 'tab-experienced' };
    const applyHash = () => {
      const tabId = tabByHash[location.hash];
      if (!tabId) return;
      const tab = document.getElementById(tabId);
      if (!tab) return;
      activate(tab);
      const anchor = document.getElementById('prices');
      if (anchor) anchor.scrollIntoView({ block: 'start' });
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
  });

  document.querySelectorAll('[data-reviews-track]').forEach((track) => {
    const move = (direction) => {
      const amount = Math.max(320, track.clientWidth * 0.78);
      track.scrollBy({ left: amount * direction, behavior: 'smooth' });
    };
    track.parentElement?.querySelector('[data-review-prev]')?.addEventListener('click', () => move(-1));
    track.parentElement?.querySelector('[data-review-next]')?.addEventListener('click', () => move(1));
  });

  document.querySelectorAll('[data-map-recenter]').forEach((button) => {
    button.addEventListener('click', () => {
      const frame = document.getElementById('map-frame');
      if (frame) frame.src = frame.src;
    });
  });

  document.querySelectorAll('[data-current-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    body.classList.add('is-ready');
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        instance.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }
})();
