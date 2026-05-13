document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("confirm-modal");
  const modalMessage = document.getElementById("confirm-message");
  const confirmBtn = document.getElementById("confirm-yes");
  const cancelBtn = document.getElementById("confirm-no");
  const hideDelayMs = 200;
  let pendingFormId = null;

  const openModal = (message, formId) => {
    pendingFormId = formId;
    if (modalMessage) modalMessage.textContent = message;
    if (modal) {
      modal.hidden = false;
      modal.classList.add("show");
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
});
