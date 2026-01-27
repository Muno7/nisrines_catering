document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("productForm");
  if (!form) return;

  const rules = {
    name: { min: 2, message: "Name should be at least 2 characters." },
    name_ar: { min: 2, optional: true, message: "Arabic name should be at least 2 characters." },
    category_id: { min: 1, message: "Choose a category." },
    priceSingleCents: { min: 1, message: "Single price is required." },
    priceFamilyCents: { min: 0, optional: true, message: "Family price cannot be negative." },
    ingredients: { min: 0, optional: true },
    day: { min: 0, optional: true },
    status: { min: 2, message: "Pick a status." },
  };

  const imageInput = form.querySelector('input[type="file"][name="image"]');

  const shouldCompress = (file) => {
    if (!file || !file.type.startsWith('image/')) return false;
    const sizeMb = file.size / (1024 * 1024);
    return sizeMb > 0.7; // leave small/low-quality files untouched
  };

  const computeCompressionPlan = (file) => {
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 4) return { maxDim: 1400, quality: 0.82 };
    if (sizeMb > 2.5) return { maxDim: 1500, quality: 0.86 };
    if (sizeMb > 1.2) return { maxDim: 1700, quality: 0.9 };
    return { maxDim: 1900, quality: 0.92 };
  };

  const compressImage = (file) =>
    new Promise((resolve) => {
      if (!shouldCompress(file)) return resolve(file);

      const { maxDim, quality } = computeCompressionPlan(file);
      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size >= file.size) return resolve(file); // keep original if bigger
              const newName = file.name.replace(/\.[^.]+$/u, '') + (outputType === 'image/png' ? '.png' : '.jpg');
              resolve(new File([blob], newName, { type: outputType }));
            },
            outputType,
            quality
          );
        };
        img.onerror = () => resolve(file);
        img.src = reader.result;
      };

      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });

  const swapFile = (input, file) => {
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
  };

  if (imageInput) {
    imageInput.addEventListener('change', async () => {
      const file = imageInput.files?.[0];
      if (!file) return;
      const processed = await compressImage(file);
      if (processed !== file) swapFile(imageInput, processed);
    });
  }

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
