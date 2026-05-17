// fileToWebp.ts

export const fileToWebp = async (
  file: File | Blob,
  quality = 0.88,
): Promise<Blob> => {
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();

      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Image load failed"));

      image.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context পাওয়া যায়নি");
    }

    ctx.drawImage(img, 0, 0);

    const webpBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("WebP conversion failed"));
            return;
          }
          resolve(blob);
        },
        "image/webp",
        quality,
      );
    });

    return webpBlob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
