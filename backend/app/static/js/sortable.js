(function () {
  function getRowLabel(row) {
    const input = row.querySelector('th[scope="row"] input, .name-input');
    if (input?.value?.trim()) return input.value.trim();
    const label = row.querySelector('th[scope="row"], .row-title');
    return label?.textContent?.trim() || "row";
  }

  function initSortable(tbody) {
    const form = tbody.closest("form");
    if (!form) return;

    const thead = tbody.closest("table")?.querySelector("thead tr");
    if (thead) {
      const th = document.createElement("th");
      th.scope = "col";
      th.style.width = "40px";
      th.innerHTML = '<span class="sr-only">Reorder</span>';
      thead.prepend(th);
    }

    tbody.querySelectorAll("tr[data-id]").forEach((row) => {
      const td = document.createElement("td");
      td.className = "drag-handle";
      td.setAttribute("draggable", "true");
      td.setAttribute("tabindex", "0");
      td.setAttribute("aria-keyshortcuts", "Alt+ArrowUp Alt+ArrowDown");
      td.setAttribute("aria-label", `Reorder ${getRowLabel(row)}. Use Alt+Arrow Up or Alt+Arrow Down to move.`);
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

    const markOrderChanged = () => {
      bar.classList.add("is-visible");
    };

    const moveRow = (row, direction) => {
      if (direction === "up") {
        const previous = row.previousElementSibling;
        if (!previous) return;
        tbody.insertBefore(row, previous);
      } else {
        const next = row.nextElementSibling;
        if (!next) return;
        tbody.insertBefore(next, row);
      }
      markOrderChanged();
      row.querySelector(".drag-handle")?.focus();
    };

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
        markOrderChanged();
      }
      dragging = null;
    });

    tbody.addEventListener("keydown", (e) => {
      if (!e.target.closest(".drag-handle")) return;
      if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
      const row = e.target.closest("tr[data-id]");
      if (!row) return;
      e.preventDefault();
      moveRow(row, e.key === "ArrowUp" ? "up" : "down");
    });

    form.addEventListener("submit", (e) => {
      if (e.submitter?.hasAttribute("formaction")) return;
      bar.classList.remove("is-visible");
      form.querySelectorAll("input[data-order-inject]").forEach((el) => el.remove());
      tbody.querySelectorAll("tr[data-id]").forEach((row) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "item_ids";
        input.value = row.dataset.id;
        input.dataset.orderInject = "";
        form.appendChild(input);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("tbody[data-sortable]").forEach(initSortable);
  });
})();
