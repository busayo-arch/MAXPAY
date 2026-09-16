/* ui.js — Modals, toasts, drawer */
const UI = {
  toast(message, type = 'info') {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 2800);
  },

  modal({ title, body, onSubmit, submitLabel = 'Confirm', cancelLabel = 'Cancel', danger = false }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal">' +
        '<div class="modal-header">' +
          '<h3>' + title + '</h3>' +
          '<button class="modal-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<form class="modal-form">' +
          '<div class="modal-body">' + body + '</div>' +
          '<div class="modal-footer">' +
            '<button type="button" class="btn btn-ghost modal-cancel">' + cancelLabel + '</button>' +
            '<button type="submit" class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '">' + submitLabel + '</button>' +
          '</div>' +
        '</form>' +
      '</div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));

    const close = () => {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 250);
    };
    overlay.querySelector('.modal-close').onclick = close;
    overlay.querySelector('.modal-cancel').onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };

    overlay.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      try { onSubmit(data, close); }
      catch (err) { UI.toast(err.message, 'error'); }
    };
    return close;
  },

  confirm(title, message, onConfirm) {
    this.modal({
      title: title,
      body: '<p style="font-size:13px;color:#8fa0b0;line-height:1.5;">' + message + '</p>',
      submitLabel: 'Confirm',
      danger: true,
      onSubmit: () => onConfirm()
    });
  },

  openDrawer(html) {
    let d = document.querySelector('.drawer');
    if (d) d.remove();
    d = document.createElement('div');
    d.className = 'drawer';
    d.innerHTML = html;
    document.body.appendChild(d);
    requestAnimationFrame(() => d.classList.add('open'));
    d.querySelector('.drawer-close').onclick = () => {
      d.classList.remove('open');
      setTimeout(() => d.remove(), 300);
    };
  }
};
