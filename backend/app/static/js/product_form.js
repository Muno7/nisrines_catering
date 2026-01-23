document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("productForm");
  if (!form) return;

  const rules = {
    name: { min: 2, message: "Name should be at least 2 characters." },
    category_id: { min: 1, message: "Choose a category." },
    priceSingleCents: { min: 1, message: "Single price is required." },
    priceFamilyCents: { min: 0, optional: true, message: "Family price cannot be negative." },
    ingredients: { min: 0, optional: true },
    day: { min: 0, optional: true },
    status: { min: 2, message: "Pick a status." },
  };

  const showError = (field, message) => {
    const fieldWrapper = field.closest(".field");
    if (fieldWrapper) {
      fieldWrapper.classList.toggle("invalid", Boolean(message));
    }
    const target = form.querySelector(`[data-inline-error-for="${field.name}"]`);
    if (target) target.textContent = message || "";
  };

  const validateField = (field) => {
    const rule = rules[field.name];
    if (!rule) return true;

    const raw = (field.value || "").trim();

    if (field.name === "category_id") {
      const hasExisting = raw && raw !== "0";
      if (!hasExisting) {
        showError(field, rule.message);
        return false;
      }
      showError(field, "");
      return true;
    }
    if (!raw && rule.optional) {
      showError(field, "");
      return true;
    }

    if (!raw) {
      showError(field, rule.message);
      return false;
    }

    if (rule.min && raw.length < rule.min && field.type !== "number") {
      showError(field, rule.message);
      return false;
    }

    if (field.type === "number" || field.inputMode === "numeric") {
      const numeric = Number(raw);
      if (Number.isNaN(numeric) || numeric < rule.min) {
        showError(field, rule.message);
        return false;
      }
    }

    showError(field, "");
    return true;
  };

  form.querySelectorAll("input, textarea, select").forEach((input) => {
    input.addEventListener("input", () => validateField(input));
    input.addEventListener("blur", () => validateField(input));
  });

  form.addEventListener("submit", (event) => {
    const invalid = Array.from(form.querySelectorAll("input, textarea, select")).some(
      (input) => !validateField(input)
    );
    if (invalid) {
      event.preventDefault();
      form.querySelector(".field.invalid input, .field.invalid textarea, .field.invalid select")?.focus();
    }
  });
});
