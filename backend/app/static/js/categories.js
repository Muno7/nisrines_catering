document.addEventListener("DOMContentLoaded", () => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || "";

  document.querySelectorAll(".name-input[data-category-id]").forEach((input) => {
    const row = input.closest("tr");
    const saveButton = row?.querySelector(".category-save-btn");
    const updateNameInput = document.querySelector(
      `[data-category-update-name="${input.dataset.categoryId}"]`
    );

    if (!saveButton || !updateNameInput) return;

    const syncSaveState = () => {
      const original = (input.dataset.original || "").trim();
      const current = input.value.trim();
      const changed = current !== original;

      saveButton.classList.toggle("is-visible", changed);
      saveButton.setAttribute("aria-hidden", String(!changed));
      saveButton.disabled = !current;
      updateNameInput.value = input.value;
    };

    input.addEventListener("input", syncSaveState);
    input.addEventListener("change", syncSaveState);
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || !saveButton.classList.contains("is-visible") || saveButton.disabled) return;
      event.preventDefault();
      updateNameInput.value = input.value;
      saveButton.click();
    });

    saveButton.addEventListener("click", () => {
      updateNameInput.value = input.value;
    });
  });

  document.querySelectorAll(".status-toggle").forEach((toggle) => {
    toggle.addEventListener("change", async (event) => {
      const input = event.currentTarget;
      const categoryId = input.dataset.categoryId;
      let previous = input.dataset.previous;

      if (!categoryId) {
        showToast("Missing category id; cannot update status.", "danger");
        input.checked = previous === "active";
        return;
      }

      if (!previous) {
        previous = input.checked ? "inactive" : "active";
      }

      input.disabled = true;
      const nextStatus = input.checked ? "active" : "inactive";

      try {
        const response = await fetch(`/admin/categories/${categoryId}/set-status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
            Accept: "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        });

        if (!response.ok) {
          throw new Error("Bad response");
        }

        const data = await response.json();
        input.dataset.previous = data.status;
        input.checked = data.status === "active";
      } catch (err) {
        input.checked = previous === "active";
        showToast("Could not update category status. Please try again.", "danger");
      } finally {
        input.disabled = false;
      }
    });
  });

});
