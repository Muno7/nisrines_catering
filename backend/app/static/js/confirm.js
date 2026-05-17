document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("confirm-modal");
  const modalMessage = document.getElementById("confirm-message");
  const confirmBtn = document.getElementById("confirm-yes");
  const cancelBtn = document.getElementById("confirm-no");
  const hideDelayMs = 200;
  let pendingFormId = null;
  let previousFocus = null;
  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  const isModalOpen = () => modal && !modal.hidden;

  const getFocusableElements = () => {
    if (!modal) return [];
    return [...modal.querySelectorAll(focusableSelector)].filter((el) => {
      return el instanceof HTMLElement && el.offsetParent !== null;
    });
  };

  const openModal = (message, formId) => {
    pendingFormId = formId;
    previousFocus = document.activeElement;
    if (modalMessage) modalMessage.textContent = message;
    if (modal) {
      modal.hidden = false;
      modal.classList.add("show");
      cancelBtn?.focus();
    }
  };

  const closeModal = () => {
    pendingFormId = null;
    if (modal) {
      modal.classList.remove("show");
      window.setTimeout(() => {
        if (!modal.classList.contains("show")) {
          modal.hidden = true;
        }
      }, hideDelayMs);
    }
    if (previousFocus instanceof HTMLElement) {
      previousFocus.focus();
    }
    previousFocus = null;
  };

  document.querySelectorAll("[data-confirm-form]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = btn.dataset.confirmForm;
      const message = btn.dataset.confirmMessage || "Are you sure?";
      openModal(message, target);
    });
  });

  confirmBtn?.addEventListener("click", () => {
    if (pendingFormId) {
      const form = document.getElementById(pendingFormId);
      form?.submit();
    }
    closeModal();
  });

  cancelBtn?.addEventListener("click", closeModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!isModalOpen()) return;

    if (e.key === "Escape") {
      closeModal();
      return;
    }

    if (e.key !== "Tab") return;

    const focusableElements = getFocusableElements();
    if (!focusableElements.length) {
      e.preventDefault();
      modal?.querySelector(".modal")?.focus();
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
});
