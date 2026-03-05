import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const Scanner = ({ onScanSuccess, onScanError }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanError);

        return () => {
            scanner.clear().catch((error) => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        };
    }, []);

    return (
        <div style={{ background: "#fff", padding: 16, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <div id="reader"></div>
        </div>
    );
};

export default Scanner;
