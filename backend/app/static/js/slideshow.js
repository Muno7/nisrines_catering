document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("slideshowForm");
  if (!form) return;

  const compressor = window.imageCompressor;
  const fileInput = form.querySelector('input[type="file"][name="images"]');
  const submitBtn = form.querySelector('button[type="submit"]');

  const statusEl = document.createElement("div");
  statusEl.className = "muted";
  statusEl.style.marginTop = "6px";
  fileInput?.closest(".field")?.appendChild(statusEl);

  const setStatus = (text, tone = "muted") => {
    statusEl.textContent = text || "";
    if (!text) {
      statusEl.className = "muted";
      return;
    }
    if (tone === "error") {
      statusEl.className = "alert alert-danger";
      return;
    }
    if (tone === "success") {
      statusEl.className = "alert alert-success";
      return;
    }
    statusEl.className = "muted";
  };

  if (fileInput) {
    fileInput.addEventListener("change", async () => {
      if (!compressor?.compressInputFiles) return;
      await compressor.compressInputFiles(fileInput);
      setStatus("");
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!fileInput) return;
    if (compressor?.compressInputFiles) {
      await compressor.compressInputFiles(fileInput);
    }

    const files = Array.from(fileInput.files || []);
    if (!files.length) {
      setStatus("Select at least one image to upload.", "error");
      return;
    }

    const csrfToken = form.querySelector('input[name="csrf_token"]')?.value || "";
    submitBtn?.setAttribute("disabled", "disabled");
    setStatus("Preparing uploads...");

    let uploaded = 0;
    const errors = [];

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const progress = `${i + 1}/${files.length}`;
      setStatus(`Uploading ${file.name} (${progress})...`);

      const body = new FormData();
      if (csrfToken) body.append("csrf_token", csrfToken);
      body.append("images", file);

      try {
        const res = await fetch(form.action, {
          method: "POST",
          body,
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        });
        const data = await res.json();
        if (!res.ok || data?.ok === false) {
          errors.push(data?.errors?.join("; ") || `${file.name}: upload failed`);
          continue;
        }
        uploaded += data?.uploaded || 1;
      } catch (err) {
        errors.push(`${file.name}: ${err?.message || "network error"}`);
      }
    }

    submitBtn?.removeAttribute("disabled");

    if (uploaded && !errors.length) {
      setStatus(`Uploaded ${uploaded} image(s). Reloading...`, "success");
      window.setTimeout(() => window.location.reload(), 500);
      return;
    }

    if (uploaded && errors.length) {
      setStatus(
        `Uploaded ${uploaded} image(s) with ${errors.length} error(s). Reloading...`,
        "success"
      );
      window.setTimeout(() => window.location.reload(), 800);
      return;
    }

    setStatus(errors.join(" | ") || "No images were uploaded.", "error");
  });
});
