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
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: "environment" }, // rear camera
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        videoRef.current,
        (result) => {
          if (result && !doneRef.current) {
            doneRef.current = true;
            controlsRef.current?.stop();
            onScanRef.current(result.getText());
          }
        }
      )
      .then((controls) => {
        controlsRef.current = controls;

        // After stream starts — configure autofocus & check torch
        const stream = videoRef.current?.srcObject as MediaStream | null;
        const track = stream?.getVideoTracks()[0];
        if (!track) return;

        const capabilities = track.getCapabilities() as Record<string, unknown>;

        if (capabilities.torch) setTorchAvailable(true);

        const focusModes = capabilities.focusMode as string[] | undefined;
        if (focusModes?.includes("continuous")) {
          track
            .applyConstraints({ advanced: [{ focusMode: "continuous" }] } as unknown as MediaTrackConstraints)
            .catch(() => {});
        }
      })
      .catch((err: Error) => {
        setCameraError(err.message || "Brak dostępu do kamery");
      });

    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  // Tap on video = single-shot focus, then back to continuous
  async function handleTapToFocus() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({
        advanced: [{ focusMode: "single-shot" }],
      } as unknown as MediaTrackConstraints);
      setTimeout(() => {
        track
          .applyConstraints({ advanced: [{ focusMode: "continuous" }] } as unknown as MediaTrackConstraints)
          .catch(() => {});
      }, 800);
    } catch {}
  }

  async function toggleTorch() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next }],
      } as unknown as MediaTrackConstraints);
      setTorchOn(next);
    } catch {}
  }

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
              onClick={handleTapToFocus}
            />
            <div className="scanner-frame">
              <div className="scanner-line" />
            </div>
            {torchAvailable && (
              <button
                type="button"
                className={`scanner-torch ${torchOn ? "active" : ""}`}
                onClick={toggleTorch}
                title={torchOn ? "Wyłącz latarkę" : "Włącz latarkę"}
              >
                {torchOn ? "🔦" : "💡"}
              </button>
            )}
          </div>
        )}

        <p className="scanner-hint">
          Skieruj kamerę na kod kreskowy • dotknij obrazu aby ustawić ostrość
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
