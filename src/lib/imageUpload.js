import { ref, deleteObject } from 'firebase/storage';

// Downscales an image client-side before upload — phone camera photos are often
// 10-20MB/4000px+, which is overkill for a website and slows down masonry grids.
// Videos and non-image files pass through untouched.
export function compressImage(file, maxDimension = 1600, quality = 0.82) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return Promise.resolve(file);
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file),
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

// Best-effort Storage delete — never throws, since a missing/already-deleted file
// shouldn't block removing the Firestore record that referenced it.
export async function deleteStorageFileByUrl(storage, url) {
  if (!url) return;
  try {
    await deleteObject(ref(storage, url));
  } catch {
    // Ignore — file may already be gone, or the URL wasn't a Storage URL.
  }
}
