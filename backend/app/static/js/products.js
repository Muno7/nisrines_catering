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

  document.querySelectorAll(".status-toggle").forEach((toggle) => {
    toggle.addEventListener("change", async (event) => {
      const input = event.currentTarget;
      const productId = input.dataset.productId;
      let previous = input.dataset.previous;
      if (!previous) {
        // If missing, assume previous state was the opposite of the new toggle state
        previous = input.checked ? "inactive" : "active";
      }
      input.disabled = true;
      const nextStatus = input.checked ? "active" : "inactive";
      try {
        const response = await fetch(`/admin/products/${productId}/set-status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
            Accept: "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (!response.ok) throw new Error("Bad response");
        const data = await response.json();
        adjustStats(previous, data.status);
        input.dataset.previous = data.status;
        input.checked = data.status === "active";
      } catch (err) {
        input.checked = previous === "active";
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
