const removeToast = (toast) => {
  toast.classList.add("toast-hide");
  setTimeout(() => toast.remove(), 220);
};

const initToast = (toast) => {
  toast.querySelector(".toast-close")?.addEventListener("click", () => removeToast(toast));
  setTimeout(() => removeToast(toast), 4500);
};

function showToast(message, type = "info") {
  let stack = document.getElementById("toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toast-stack";
    stack.id = "toast-stack";
    document.body.appendChild(stack);
  }

  const toast = document.createElement("div");
  toast.className = `toast alert-${type}`;
  toast.setAttribute("role", "status");
  toast.innerHTML = `<span class="toast-text">${message}</span><button class="toast-close" type="button" aria-label="Dismiss">&times;</button>`;

  stack.appendChild(toast);
  initToast(toast);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#toast-stack .toast").forEach(initToast);
});
