import type { IScannerControls } from '@zxing/browser';

export interface BarcodeScanResult {
  ok: boolean;
  barcode?: string;
  error?: string;
}

export interface ScannerCapabilities {
  cameraAvailable: boolean;
  nativeDetectorAvailable: boolean;
  implementation: 'native' | 'zxing' | 'manual-only';
}

type NativeBarcodeDetector = new (options?: { formats?: string[] }) => {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue?: string }[]>;
};

const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
};

/** Check browser camera / BarcodeDetector support. */
export function getScannerCapabilities(): ScannerCapabilities {
  const cameraAvailable =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  const nativeDetectorAvailable =
    typeof window !== 'undefined' && 'BarcodeDetector' in window;

  let implementation: ScannerCapabilities['implementation'] = 'manual-only';
  if (nativeDetectorAvailable) implementation = 'native';
  else if (cameraAvailable) implementation = 'zxing';

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
    return 'Camera scanner ready (ZXing fallback)';
  }
  return 'Manual barcode entry only';
}

function stopVideoStream(videoElement: HTMLVideoElement) {
  if (videoElement.srcObject) {
    (videoElement.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
  }
}

function normaliseDetectedBarcode(raw: string | undefined): string | null {
  const normalized = normalizeBarcodeInput(raw ?? '');
  return isValidBarcodeFormat(normalized) ? normalized : null;
}

async function scanWithNativeDetector(
  videoElement: HTMLVideoElement,
  timeoutMs: number
): Promise<BarcodeScanResult> {
  let stream: MediaStream | null = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
    videoElement.srcObject = stream;
    await videoElement.play();

    const BarcodeDetectorCtor = (window as typeof window & {
      BarcodeDetector?: NativeBarcodeDetector;
    }).BarcodeDetector;

    if (!BarcodeDetectorCtor) {
      return { ok: false, error: 'Barcode detector is not available.' };
    }

    const detector = new BarcodeDetectorCtor({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'],
    });
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const codes = await detector.detect(videoElement);
        for (const code of codes) {
          const barcode = normaliseDetectedBarcode(code.rawValue);
          if (barcode) return { ok: true, barcode };
        }
      } catch {
        // Keep polling while the camera stream is warming up.
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    return {
      ok: false,
      error: 'No barcode detected — try better lighting or manual entry.',
    };
  } catch {
    return { ok: false, error: 'Could not access camera. Check permissions or use manual entry.' };
  } finally {
    if (stream) stopVideoStream(videoElement);
  }
}

async function scanWithZxing(
  videoElement: HTMLVideoElement,
  timeoutMs: number
): Promise<BarcodeScanResult> {
  const { BarcodeFormat, BrowserMultiFormatReader } = await import('@zxing/browser');
  const retailBarcodeFormats = [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
  ];
  const reader = new BrowserMultiFormatReader(undefined, {
    delayBetweenScanAttempts: 250,
    delayBetweenScanSuccess: 250,
  });
  reader.possibleFormats = retailBarcodeFormats;

  const scannerState: { controls?: IScannerControls } = {};

  try {
    return await new Promise<BarcodeScanResult>((resolve) => {
      let settled = false;

      const finish = (result: BarcodeScanResult) => {
        if (settled) return;
        settled = true;
        scannerState.controls?.stop();
        stopVideoStream(videoElement);
        resolve(result);
      };

      const timeout = window.setTimeout(() => {
        finish({
          ok: false,
          error: 'No barcode detected — try better lighting or manual entry.',
        });
      }, timeoutMs);

      void reader
        .decodeFromConstraints(CAMERA_CONSTRAINTS, videoElement, (result, _error, scannerControls) => {
          scannerState.controls = scannerControls;
          const barcode = normaliseDetectedBarcode(result?.getText());
          if (barcode) {
            window.clearTimeout(timeout);
            finish({ ok: true, barcode });
          }
        })
        .then((scannerControls) => {
          scannerState.controls = scannerControls;
        })
        .catch(() => {
          window.clearTimeout(timeout);
          finish({
            ok: false,
            error: 'Could not access camera. Check permissions or use manual entry.',
          });
        });
    });
  } finally {
    scannerState.controls?.stop();
    BrowserMultiFormatReader.releaseAllStreams();
    stopVideoStream(videoElement);
  }
}

/** Uses native BarcodeDetector when available, otherwise falls back to ZXing. */
export async function scanBarcodeFromCamera(
  videoElement: HTMLVideoElement,
  timeoutMs = 15000
): Promise<BarcodeScanResult> {
  const caps = getScannerCapabilities();

  if (!caps.cameraAvailable) {
    return { ok: false, error: 'Camera not available on this device.' };
  }

  if (caps.nativeDetectorAvailable) {
    return scanWithNativeDetector(videoElement, timeoutMs);
  }

  return scanWithZxing(videoElement, timeoutMs);
}

export function normalizeBarcodeInput(raw: string): string {
  return raw.trim().replace(/\s/g, '');
}

export function isValidBarcodeFormat(barcode: string): boolean {
  return /^\d{8,14}$/.test(barcode);
}
