// Safe client-side image compression with robust fallbacks for older devices (iOS 12 / Safari 12)
import imageCompression from "browser-image-compression";

interface SafeCompressOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

export async function safeCompressImage(
  file: File,
  options: SafeCompressOptions = {}
): Promise<File> {
  const { maxSizeMB = 1.5, maxWidthOrHeight = 1920 } = options;

  // If already small enough (under 800KB), return as is
  if (file.size <= 800 * 1024) {
    return file;
  }

  // Detect whether OffscreenCanvas & Web Worker are reliably supported
  const supportsWebWorkerCanvas =
    typeof window !== "undefined" &&
    typeof window.Worker !== "undefined" &&
    typeof (window as unknown as { OffscreenCanvas?: unknown }).OffscreenCanvas !== "undefined";

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: supportsWebWorkerCanvas,
      // Increase timeout for older CPUs
      maxIteration: 8,
    });
    return compressed;
  } catch (err) {
    console.warn("Image compression failed or unsupported on this device, using original file:", err);
    return file;
  }
}
