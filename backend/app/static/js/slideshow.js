document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("slideshowForm");
  if (!form) return;

  const compressor = window.imageCompressor;
  const input = form.querySelector('input[type="file"][name="images"]');
  if (!input) return;

  const status = document.createElement("div");
  status.className = "muted";
  status.style.marginTop = "6px";
  input.closest(".field")?.appendChild(status);

  const setStatus = (text) => {
    status.textContent = text || "";
  };

  input.addEventListener("change", async () => {
    if (compressor?.compressInputFiles) {
      await compressor.compressInputFiles(input);
    }
    const count = input.files?.length || 0;
    setStatus(count ? `${count} image(s) ready to upload.` : "");
  });
});
