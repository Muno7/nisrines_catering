document.addEventListener("DOMContentLoaded", () => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || "";
  const activeEl = document.getElementById("stat-active");
  const inactiveEl = document.getElementById("stat-inactive");

  const parseCount = (el) => parseInt(el?.textContent || "0", 10);
  const adjustStats = (from, to) => {
    if (from === to) return;
    const counters = { active: activeEl, inactive: inactiveEl };
    if (counters[from]) counters[from].textContent = String(parseCount(counters[from]) - 1);
    if (counters[to]) counters[to].textContent = String(parseCount(counters[to]) + 1);
  };

  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", async (event) => {
      const input = event.currentTarget;
      const productId = input.dataset.productId;
      const previous = input.dataset.previous || input.value;
      input.dataset.previous = previous;
      input.disabled = true;
      try {
        const response = await fetch(`/admin/products/${productId}/set-status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
            Accept: "application/json",
          },
          body: JSON.stringify({ status: input.value }),
        });
        if (!response.ok) throw new Error("Bad response");
        const data = await response.json();
        adjustStats(previous, data.status);
        input.dataset.previous = data.status;
      } catch (err) {
        input.value = previous;
        alert("Could not update status. Please try again.");
      } finally {
        input.disabled = false;
      }
    });
  });

  const bulkAll = document.getElementById("bulk-all");
  if (bulkAll) {
    bulkAll.addEventListener("change", (e) => {
      document.querySelectorAll(".bulk-check").forEach((cb) => {
        cb.checked = e.target.checked;
      });
    });
  }
});
