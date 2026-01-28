(function () {
  const shouldCompress = (file) => {
    if (!file || !file.type?.startsWith("image/")) return false;
    const sizeMb = file.size / (1024 * 1024);
    return sizeMb > 0.7;
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
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size >= file.size) return resolve(file);
              const newName =
                file.name.replace(/\.[^.]+$/u, "") +
                (outputType === "image/png" ? ".png" : ".jpg");
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

  const swapInputFiles = (input, files) => {
    const dt = new DataTransfer();
    files.forEach((file) => dt.items.add(file));
    input.files = dt.files;
  };

  const compressInputFiles = async (input) => {
    const list = Array.from(input.files || []);
    if (!list.length) return;
    const compressed = [];
    for (const file of list) {
      compressed.push(await compressImage(file));
    }
    const changed =
      compressed.length !== list.length ||
      compressed.some((file, idx) => file !== list[idx]);
    if (changed) swapInputFiles(input, compressed);
  };

  window.imageCompressor = {
    shouldCompress,
    compressImage,
    compressInputFiles,
    swapInputFiles,
  };
})();
