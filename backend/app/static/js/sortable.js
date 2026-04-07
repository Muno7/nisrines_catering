(function () {
  function initSortable(tbody) {
    const form = tbody.closest("form");
    if (!form) return;

    const thead = tbody.closest("table")?.querySelector("thead tr");
    if (thead) {
      const th = document.createElement("th");
      th.style.width = "40px";
      thead.prepend(th);
    }

    tbody.querySelectorAll("tr[data-id]").forEach((row) => {
      const td = document.createElement("td");
      td.className = "drag-handle";
      td.setAttribute("draggable", "true");
      td.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
        <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
        <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
      </svg>`;
      row.prepend(td);
    });

    const bar = document.createElement("div");
    bar.className = "sort-save-bar";
    bar.innerHTML = `<span class="sort-save-bar__label">You have unsaved changes</span><button class="btn" type="button">Save order</button>`;
    document.body.appendChild(bar);
    bar.querySelector("button").addEventListener("click", () => form.requestSubmit());

    let dragging = null;

    tbody.addEventListener("dragstart", (e) => {
      if (!e.target.closest(".drag-handle")) return;
      dragging = e.target.closest("tr[data-id]");
      if (!dragging) return;
      setTimeout(() => dragging.classList.add("is-dragging"), 0);
    });

    tbody.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!dragging) return;
      const rows = [...tbody.querySelectorAll("tr[data-id]")].filter((r) => r !== dragging);
      let insertBeforeRow = null;
      for (const row of rows) {
        const { top, height } = row.getBoundingClientRect();
        if (e.clientY < top + height / 2) {
          insertBeforeRow = row;
          break;
        }
      }
      tbody.insertBefore(dragging, insertBeforeRow);
    });

    tbody.addEventListener("dragend", () => {
      if (dragging) {
        dragging.classList.remove("is-dragging");
        bar.classList.add("is-visible");
      }
      dragging = null;
    });

    form.addEventListener("submit", (e) => {
      if (e.submitter?.hasAttribute("formaction")) return;
      bar.classList.remove("is-visible");
      form.querySelectorAll("input[data-order-inject]").forEach((el) => el.remove());
      tbody.querySelectorAll("tr[data-id]").forEach((row, i) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = `order_${row.dataset.id}`;
        input.value = i + 1;
        input.dataset.orderInject = "";
        form.appendChild(input);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("tbody[data-sortable]").forEach(initSortable);
  });
})();
