export interface BarcodeScanResult {
  ok: boolean;
  barcode?: string;
  error?: string;
}

export interface ScannerCapabilities {
  cameraAvailable: boolean;
  nativeDetectorAvailable: boolean;
  implementation: 'placeholder' | 'native' | 'manual-only';
}

/** Check browser camera / BarcodeDetector support. */
export function getScannerCapabilities(): ScannerCapabilities {
  const cameraAvailable =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  const nativeDetectorAvailable =
    typeof window !== 'undefined' && 'BarcodeDetector' in window;

  let implementation: ScannerCapabilities['implementation'] = 'manual-only';
  if (nativeDetectorAvailable) implementation = 'native';
  else if (cameraAvailable) implementation = 'placeholder';

  return {
    cameraAvailable,
    nativeDetectorAvailable,
    implementation,
  };
}

export function getScannerStatusLabel(): string {
  const caps = getScannerCapabilities();
  if (caps.nativeDetectorAvailable) {
    return 'Camera scanner ready (browser API)';
  }
  if (caps.cameraAvailable) {
    return 'Camera preview placeholder — enter barcode manually';
  }
  return 'Manual barcode entry only';
}

/**
 * Placeholder scan flow.
 * Uses native BarcodeDetector when available; otherwise prompts manual entry.
 */
export async function scanBarcodeFromCamera(
  videoElement: HTMLVideoElement,
  timeoutMs = 15000
): Promise<BarcodeScanResult> {
  const caps = getScannerCapabilities();

  if (!caps.cameraAvailable) {
    return { ok: false, error: 'Camera not available on this device.' };
  }

  let stream: MediaStream | null = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
    videoElement.srcObject = stream;
    await videoElement.play();

    if (caps.nativeDetectorAvailable) {
      // @ts-expect-error BarcodeDetector is not in all TS libs yet
      const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
      const deadline = Date.now() + timeoutMs;

      while (Date.now() < deadline) {
        try {
          const codes = await detector.detect(videoElement);
          if (codes.length > 0 && codes[0].rawValue) {
            return { ok: true, barcode: codes[0].rawValue };
          }
        } catch {
          // continue polling
        }
        await new Promise((r) => setTimeout(r, 300));
      }

      return {
        ok: false,
        error: 'No barcode detected — try manual entry or better lighting.',
      };
    }

    return {
      ok: false,
      error:
        'Live scanning is not supported in this browser yet. Use manual barcode entry below.',
    };
  } catch {
    return { ok: false, error: 'Could not access camera. Check permissions or use manual entry.' };
  } finally {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      videoElement.srcObject = null;
    }
  }
}

export function normalizeBarcodeInput(raw: string): string {
  return raw.trim().replace(/\s/g, '');
}

export function isValidBarcodeFormat(barcode: string): boolean {
  return /^\d{8,14}$/.test(barcode);
}
