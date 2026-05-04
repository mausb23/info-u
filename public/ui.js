(function () {
  var TOAST_TYPES = {
    info: { bg: 'bg-blue-50 dark-schedule-block', border: 'border-blue-300', text: 'text-blue-700 dark-amber-banner-title', icon: 'fa-circle-info' },
    error: { bg: 'bg-red-50 dark-schedule-conflict', border: 'border-red-300', text: 'text-red-700 dark-amber-banner-title', icon: 'fa-circle-exclamation' },
    warning: { bg: 'bg-amber-50 dark-route-amber-bg', border: 'border-amber-300', text: 'text-amber-700 dark-amber-banner-title', icon: 'fa-triangle-exclamation' },
    success: { bg: 'bg-emerald-50 dark-route-emerald-bg', border: 'border-emerald-300', text: 'text-emerald-700 dark-amber-banner-title', icon: 'fa-circle-check' },
  };

  window.showToast = function (message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    if (!container) return;

    var t = TOAST_TYPES[type] || TOAST_TYPES.info;
    var toast = document.createElement('div');
    toast.className = 'pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ' + t.bg + ' ' + t.border + ' ' + t.text;
    toast.style.animation = 'fadeIn 0.25s ease';
    toast.innerHTML = '<i class="fas ' + t.icon + '"></i>' + message;
    container.appendChild(toast);

    setTimeout(function () {
      toast.style.transition = 'opacity 0.25s, transform 0.25s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(function () { toast.remove(); }, 250);
    }, 3000);
  };

  window.showConfirm = function (title, message, options) {
    options = options || {};
    var overlay = document.getElementById('confirmOverlay');
    var titleEl = document.getElementById('confirmTitle');
    var msgEl = document.getElementById('confirmMessage');
    var cancelBtn = document.getElementById('confirmCancel');
    var okBtn = document.getElementById('confirmOk');
    var iconEl = document.getElementById('confirmIcon');
    if (!overlay) return Promise.resolve(false);

    titleEl.textContent = title;
    msgEl.textContent = message;
    okBtn.textContent = options.okText || 'Sí, eliminar';
    cancelBtn.textContent = options.cancelText || 'Cancelar';
    okBtn.className = 'px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-lg ' + (options.okClass || 'bg-red-500 hover:bg-red-600');

    if (options.icon) {
      iconEl.className = 'fas ' + options.icon + ' text-xl';
    } else {
      iconEl.className = 'fas fa-exclamation-triangle text-red-400 text-xl';
    }

    overlay.classList.remove('hidden');

    return new Promise(function (resolve) {
      function cleanup(value) {
        overlay.classList.add('hidden');
        cancelBtn.removeEventListener('click', onCancel);
        okBtn.removeEventListener('click', onOk);
        overlay.removeEventListener('click', onBackdrop);
        resolve(value);
      }
      function onCancel() { cleanup(false); }
      function onOk() { cleanup(true); }
      function onBackdrop(e) { if (e.target === overlay) cleanup(false); }

      cancelBtn.addEventListener('click', onCancel);
      okBtn.addEventListener('click', onOk);
      overlay.addEventListener('click', onBackdrop);
    });
  };
})();
