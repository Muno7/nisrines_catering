document.addEventListener("DOMContentLoaded", () => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || "";

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

  const rows = document.querySelectorAll("tr[data-category-row]");
  rows.forEach((row) => {
    const nameInput = row.querySelector(".name-input");
    const orderInput = row.querySelector(".order-input");
    const saveBtn = row.querySelector(".row-save-btn");

    const markDirty = () => {
      if (!saveBtn) return;
      const nameChanged = nameInput && nameInput.value !== nameInput.dataset.original;
      const orderChanged = orderInput && orderInput.value !== orderInput.dataset.original;
      if (nameChanged || orderChanged) {
        saveBtn.classList.add("show");
      } else {
        saveBtn.classList.remove("show");
      }
    };

    nameInput?.addEventListener("input", markDirty);
    orderInput?.addEventListener("input", markDirty);
  });
});
