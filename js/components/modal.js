/**
 * modal.js
 * Bottom sheet and center dialog modal system
 */

let activeModal = null;
let scrollPosition = 0;

/**
 * Create and show a modal
 * @param {{ title?: string, content: string|HTMLElement, footer?: string|HTMLElement, variant?: 'bottom'|'center', onClose?: Function }} opts
 * @returns {{ el: HTMLElement, close: Function }}
 */
export function showModal({ title, content, footer, variant = 'bottom', onClose } = {}) {
  closeModal(); // close any open modal first

  const overlay = document.createElement('div');
  overlay.className = `modal-overlay${variant === 'center' ? ' center' : ''}`;
  overlay.id = 'active-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  if (title) overlay.setAttribute('aria-label', title);

  const modal = document.createElement('div');
  modal.className = 'modal';

  let contentHTML = '';
  if (variant === 'bottom') {
    contentHTML += `<div class="modal-handle" aria-hidden="true"></div>`;
  }

  if (title) {
    contentHTML += `
      <div class="modal-header">
        <h2 class="modal-title">${title}</h2>
        <button class="modal-close" aria-label="Close modal" id="modal-close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;
  }

  modal.innerHTML = contentHTML;

  // Body
  const body = document.createElement('div');
  body.className = 'modal-body';
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    body.appendChild(content);
  }
  modal.appendChild(body);

  // Footer
  if (footer) {
    const footerEl = document.createElement('div');
    footerEl.className = 'modal-footer';
    if (typeof footer === 'string') {
      footerEl.innerHTML = footer;
    } else if (footer instanceof HTMLElement) {
      footerEl.appendChild(footer);
    }
    modal.appendChild(footerEl);
  }

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  activeModal = { overlay, onClose };

  // Lock body scroll
  scrollPosition = window.scrollY;
  document.body.style.overflow = 'hidden';
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';

  // Animate in
  requestAnimationFrame(() => {
    overlay.classList.add('open');
  });

  // Close handlers
  const closeBtn = overlay.querySelector('#modal-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', close);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Keyboard: Escape
  const keyHandler = (e) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', keyHandler, { once: true });

  // Drag-to-close for bottom sheets
  if (variant === 'bottom') {
    enableDragToClose(modal, close);
  }

  function close() {
    closeModal();
    if (onClose) onClose();
  }

  return {
    el: modal,
    close,
    getBody: () => body,
  };
}

/**
 * Close the currently active modal
 */
export function closeModal() {
  if (!activeModal) return;
  const { overlay } = activeModal;
  overlay.classList.remove('open');

  // Restore scroll
  document.body.style.overflow = '';
  document.body.style.top = '';
  document.body.style.position = '';
  document.body.style.width = '';
  window.scrollTo(0, scrollPosition);

  setTimeout(() => overlay.remove(), 500);
  activeModal = null;
}

/**
 * Enable drag-to-close for a bottom sheet
 */
function enableDragToClose(modal, close) {
  let startY = 0;
  let isDragging = false;

  const handle = modal.querySelector('.modal-handle');
  if (!handle) return;

  handle.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    isDragging = true;
  }, { passive: true });

  handle.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - startY;
    if (delta > 0) {
      modal.style.transform = `translateY(${delta}px)`;
      modal.style.transition = 'none';
    }
  }, { passive: true });

  handle.addEventListener('touchend', (e) => {
    isDragging = false;
    const endY = e.changedTouches[0].clientY;
    const delta = endY - startY;
    modal.style.transform = '';
    modal.style.transition = '';

    if (delta > 120) {
      close();
    }
  });
}

/**
 * Show a confirm dialog
 * @param {{ title?: string, message: string, confirmLabel?: string, cancelLabel?: string, dangerous?: boolean }} opts
 * @returns {Promise<boolean>}
 */
export function showConfirm({
  title = 'Confirm',
  message = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  dangerous = false,
} = {}) {
  return new Promise((resolve) => {
    const content = `
      <div class="confirm-dialog-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <p class="confirm-dialog-title">${title}</p>
      <p class="confirm-dialog-text">${message}</p>
    `;

    const footer = `
      <button class="btn btn-secondary" id="confirm-cancel">${cancelLabel}</button>
      <button class="btn ${dangerous ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">${confirmLabel}</button>
    `;

    const { el, close } = showModal({
      content,
      footer,
      variant: 'center',
      onClose: () => resolve(false),
    });

    el.querySelector('#confirm-cancel')?.addEventListener('click', () => {
      close();
      resolve(false);
    });

    el.querySelector('#confirm-ok')?.addEventListener('click', () => {
      close();
      resolve(true);
    });
  });
}

/**
 * Show a simple prompt dialog
 * @param {{ title?: string, placeholder?: string, defaultValue?: string, label?: string }} opts
 * @returns {Promise<string|null>}
 */
export function showPrompt({
  title = 'Enter Value',
  placeholder = '',
  defaultValue = '',
  label = '',
} = {}) {
  return new Promise((resolve) => {
    const inputId = `prompt-input-${Date.now()}`;
    const content = `
      ${label ? `<div class="form-label" style="margin-bottom:8px">${label}</div>` : ''}
      <input type="text" class="form-control" id="${inputId}" placeholder="${placeholder}" value="${defaultValue}" autocomplete="off" />
    `;

    const footer = `
      <button class="btn btn-secondary" id="prompt-cancel">Cancel</button>
      <button class="btn btn-primary" id="prompt-ok">OK</button>
    `;

    const { el, close } = showModal({
      title,
      content,
      footer,
      variant: 'center',
      onClose: () => resolve(null),
    });

    const input = el.querySelector(`#${inputId}`);
    setTimeout(() => input?.focus(), 300);

    const submit = () => {
      const val = input?.value?.trim() || '';
      close();
      resolve(val || null);
    };

    el.querySelector('#prompt-cancel')?.addEventListener('click', () => { close(); resolve(null); });
    el.querySelector('#prompt-ok')?.addEventListener('click', submit);
    input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  });
}
