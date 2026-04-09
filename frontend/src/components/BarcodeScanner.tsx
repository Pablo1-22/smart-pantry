import { useEffect, useRef, useState, type FormEvent } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

interface Props {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const doneRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const [cameraError, setCameraError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    let cancelled = false;
    const video = videoRef.current;
    const reader = new BrowserMultiFormatReader();

    async function start() {
      try {
        // Próbujemy z advanced constraints (sygnalizujemy chęć użycia torch + focus).
        // Na Androidzie/Chrome to "odblokuje" te możliwości w getCapabilities().
        // Jeśli advanced constraints rzucą błąd (np. iOS), ponawiamy bez nich.
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              advanced: [
                { focusMode: "continuous" } as any,
                { torch: false } as any,
              ],
            } as MediaTrackConstraints,
          });
        } catch {
          // Fallback: bez advanced constraints (np. Safari / starsze urządzenia)
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          });
        }

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();

        const track = stream.getVideoTracks()[0];

        // Polling capabilities — Samsung/Android populuje je leniwie.
        // Sprawdzamy co 300 ms przez maks. 4 sekundy.
        let attempts = 0;
        const capPoll = setInterval(() => {
          if (cancelled || attempts++ > 13) {
            clearInterval(capPoll);
            return;
          }
          try {
            const cap = track.getCapabilities() as any;

            if (cap.torch) setTorchAvailable(true);

            if (cap.focusMode?.length > 0) {
              const modes: string[] = cap.focusMode;
              const mode = modes.includes("continuous")
                ? "continuous"
                : modes.includes("auto")
                ? "auto"
                : null;
              if (mode) {
                track
                  .applyConstraints({ advanced: [{ focusMode: mode }] } as any)
                  .catch(() => {});
                clearInterval(capPoll); // focus ustawiony — nie trzeba dalej pollować
              }
            }
          } catch {}
        }, 300);

        // decodeFromVideoElement: ZXing widzi grające video z srcObject
        const controls = await reader.decodeFromVideoElement(
          video,
          (result) => {
            if (result && !doneRef.current) {
              doneRef.current = true;
              clearInterval(capPoll);
              onScanRef.current(result.getText());
            }
          }
        );

        if (cancelled) {
          controls.stop();
          clearInterval(capPoll);
          return;
        }

        controlsRef.current = controls;
      } catch (err: any) {
        if (!cancelled) setCameraError(err.message || "Brak dostępu do kamery");
      }
    }

    start();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Kliknięcie = jednorazowy focus, potem wróć do ciągłego
  async function handleTapToFocus() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({
        advanced: [{ focusMode: "single-shot" }],
      } as any);
      setTimeout(() => {
        track
          .applyConstraints({ advanced: [{ focusMode: "continuous" }] } as any)
          .catch(() => {});
      }, 800);
    } catch {}
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] } as any);
      setTorchOn(next);
    } catch {}
  }

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    doneRef.current = true;
    controlsRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
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
