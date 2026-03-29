import { useEffect, useRef, useState, type FormEvent } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

interface Props {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const doneRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const [cameraError, setCameraError] = useState("");
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    if (!videoRef.current) return;
    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (result && !doneRef.current) {
          doneRef.current = true;
          controlsRef.current?.stop();
          onScanRef.current(result.getText());
        }
      })
      .then((controls) => {
        controlsRef.current = controls;
      })
      .catch((err: Error) => {
        setCameraError(err.message || "Brak dostępu do kamery");
      });

    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    doneRef.current = true;
    controlsRef.current?.stop();
    onScanRef.current(code);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal barcode-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Skanuj kod kreskowy</h2>
          <button className="btn-icon btn-danger" onClick={onClose}>
            ✕
          </button>
        </div>

        {cameraError ? (
          <div className="alert alert-error">{cameraError}</div>
        ) : (
          <div className="scanner-viewport">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="scanner-video"
            />
            <div className="scanner-frame">
              <div className="scanner-line" />
            </div>
          </div>
        )}

        <p className="scanner-hint">
          Skieruj kamerę na kod kreskowy produktu (EAN-13, EAN-8, QR…)
        </p>

        <div className="scanner-divider">lub wpisz ręcznie</div>

        <form className="scanner-manual-form" onSubmit={handleManualSubmit}>
          <input
            type="text"
            inputMode="numeric"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="np. 5900259127626"
            autoFocus={!!cameraError}
            autoComplete="off"
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!manualCode.trim()}
          >
            Szukaj
          </button>
        </form>
      </div>
    </div>
  );
}
