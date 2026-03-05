import { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";

export default function Scanner({ onDetected, onCancel, t }) {
    const scannerRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!scannerRef.current) return;

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: scannerRef.current,
                constraints: {
                    facingMode: "environment",
                    width: { min: 640 },
                    height: { min: 480 },
                },
            },
            decoder: {
                readers: [
                    "ean_reader",
                    "ean_8_reader",
                    "code_128_reader",
                    "upc_reader",
                ]
            },
            locate: true,
        }, (err) => {
            if (err) {
                console.error("Scanner init error:", err);
                setError(err);
                return;
            }
            Quagga.start();
        });

        Quagga.onDetected((result) => {
            const code = result.codeResult.code;
            if (code) {
                try {
                    navigator.vibrate(200);
                    playBeepSound();
                } catch (e) { }
                Quagga.stop();
                onDetected(code);
            }
        });

        return () => {
            try {
                Quagga.stop();
            } catch (e) { }
        };
    }, [onDetected]);

    function playBeepSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 1000;
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) { }
    }

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "#000", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "env(safe-area-inset-top, 20px) 20px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", zIndex: 10 }}>
                <button onClick={onCancel} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", padding: "8px 16px", borderRadius: 20, fontSize: 14, fontWeight: 700 }}>✕ {t.close}</button>
                <div style={{ fontWeight: 800 }}>{t.scanBarcode}</div>
                <div style={{ width: 40 }} />
            </div>

            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                <div id="scanner" ref={scannerRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

                {/* Overlay */}
                <div style={{ position: "absolute", inset: 0, border: "2px solid rgba(255,255,255,0.1)", pointerEvents: "none" }}>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "80%", height: "40%", border: "2px solid #16a34a", borderRadius: 12, boxShadow: "0 0 0 1000px rgba(0,0,0,0.5)" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#16a34a", animation: "scanLine 2s linear infinite", boxShadow: "0 0 8px #16a34a" }} />
                    </div>
                </div>
            </div>

            <div style={{ padding: "20px 20px calc(20px + env(safe-area-inset-bottom, 0px))", textAlign: "center", color: "#fff", background: "rgba(0,0,0,0.8)" }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{t.pointCamera}</div>
                {error && <div style={{ fontSize: 12, color: "#ff4444", marginTop: 8 }}>{error.message || "Camera error"}</div>}
            </div>

            <style>{`
        #scanner video { width: 100%; height: 100%; object-fit: cover; }
        #scanner canvas { display: none; }
        @keyframes scanLine {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
        </div>
    );
}
