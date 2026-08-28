import { useEffect, useRef, useState } from "react";
import {
  BarcodeFormat,
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onCancel: () => void;
}

type CameraStatus =
  | "starting"
  | "ready"
  | "denied"
  | "unsupported"
  | "error";

export default function BarcodeScanner({
  onDetected,
  onCancel,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasDetectedRef = useRef(false);

  const [cameraStatus, setCameraStatus] =
    useState<CameraStatus>("starting");

    const readerRef = useRef<BrowserMultiFormatReader | null>(null);

    if (!readerRef.current) {
    const reader = new BrowserMultiFormatReader();

    reader.possibleFormats = [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
    ];

    readerRef.current = reader;
    }

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isActive = true;
    let scannerControls: IScannerControls | null = null;

    async function startCamera(): Promise<void> {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus("unsupported");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment",
            },
          },
          audio: false,
        });

        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (videoRef.current && readerRef.current) {
            const controls = await readerRef.current.decodeFromStream(
                stream,
                videoRef.current,
                (result) => {
                if (!result || hasDetectedRef.current) {
                    return;
                }

                const barcode = result.getText().trim();

                if (!/^(?:\d{8}|\d{12,14})$/.test(barcode)) {
                    return;
                }

                hasDetectedRef.current = true;

                console.log("Barcode captured:", barcode);

                onDetected(barcode);
                },
            );

            if (!isActive) {
                controls.stop();
                stream.getTracks().forEach((track) => track.stop());
                return;
            }

            scannerControls = controls;
            }

            if (!isActive) {
            return;
            }

            setCameraStatus("ready");
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (
          error instanceof DOMException &&
          error.name === "NotAllowedError"
        ) {
          setCameraStatus("denied");
          return;
        }

        console.error("Failed to start barcode camera:", error);
        setCameraStatus("error");
      }
    }

    void startCamera();

    return () => {
        isActive = false;

        scannerControls?.stop();

        stream?.getTracks().forEach((track) => {
            track.stop();
        });
        };
  }, []);

  return (
    <section
      className="barcode-scanner"
      aria-labelledby="barcode-scanner-heading"
    >
      <h3 id="barcode-scanner-heading">
        Scan barcode
      </h3>

      <p>
        Hold the barcode horizontally and position it clearly in front of
        your camera.
        </p>

      {cameraStatus === "starting" && (
        <p role="status">
          Starting camera...
        </p>
      )}

      {cameraStatus === "ready" && (
        <p role="status">
          Camera ready. Point it at a barcode.
        </p>
      )}

      {cameraStatus === "denied" && (
        <p role="alert">
          Camera access was denied. You can still enter the barcode
          manually.
        </p>
      )}

      {cameraStatus === "unsupported" && (
        <p role="alert">
          Camera scanning is not supported in this browser. You can
          still enter the barcode manually.
        </p>
      )}

      {cameraStatus === "error" && (
        <p role="alert">
          The camera could not be started. You can still enter the
          barcode manually.
        </p>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        hidden={cameraStatus !== "ready"}
      />

      <button
        type="button"
        onClick={onCancel}
      >
        Cancel scanning
      </button>
    </section>
  );
}