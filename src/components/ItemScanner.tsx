import { useEffect, useRef, useState } from "react";
import {
  BarcodeFormat,
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";

interface ItemScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  onCancel: () => void;
}

type CameraStatus =
  | "starting"
  | "ready"
  | "denied"
  | "unsupported"
  | "error";

type ScanPhase = "barcode" | "expiry";

type ExpiryCaptureStatus =
  | "idle"
  | "capturing"
  | "ready"
  | "error";

export default function ItemScanner({
  onBarcodeDetected,
  onCancel,
}: ItemScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasDetectedRef = useRef(false);

  const [cameraStatus, setCameraStatus] =
    useState<CameraStatus>("starting");

  const [scanPhase, setScanPhase] =
    useState<ScanPhase>("barcode");

  const [expiryCaptureStatus, setExpiryCaptureStatus] =
    useState<ExpiryCaptureStatus>("idle");

  const [expiryCaptureMessage, setExpiryCaptureMessage] =
    useState<string | null>(null);

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

                onBarcodeDetected(barcode);
                setScanPhase("expiry");
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

  async function captureExpiryImage(): Promise<void> {
    const video = videoRef.current;

    if (
      scanPhase !== "expiry" ||
      cameraStatus !== "ready" ||
      !video ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      setExpiryCaptureStatus("error");
      setExpiryCaptureMessage(
        "The camera image is not ready yet. Please try again.",
      );
      return;
    }

    setExpiryCaptureStatus("capturing");
    setExpiryCaptureMessage(null);

    try {
      const canvas = document.createElement("canvas");

      const sourceWidth = video.videoWidth * 0.8;
      const sourceHeight = video.videoHeight * 0.18;
      const sourceX = video.videoWidth * 0.1;
      const sourceY = video.videoHeight * 0.41;

      const scale = 3;

      canvas.width = Math.round(sourceWidth * scale);
      canvas.height = Math.round(sourceHeight * scale);

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Unable to create image canvas.");
      }

      context.imageSmoothingEnabled = false;

      context.drawImage(
        video,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const imageBlob = await new Promise<Blob>(
        (resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(
                  new Error(
                    "Unable to create expiry image.",
                  ),
                );
                return;
              }

              resolve(blob);
            },
            "image/jpeg",
            0.9,
          );
        },
      );

      console.log(
        "Expiry image captured:",
        imageBlob.size,
        imageBlob.type,
      );

      const formData = new FormData();

      formData.append(
        "file",
        imageBlob,
        "expiry-capture.jpg",
      );

      const response = await fetch(
        "http://127.0.0.1:8001/ocr",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(
          `OCR request failed with status ${response.status}.`,
        );
      }

      const result = (await response.json()) as {
        lines: Array<{
          text: string;
          confidence: number;
        }>;
      };

      console.log("Expiry OCR result:", result);

      setExpiryCaptureStatus("ready");
      setExpiryCaptureMessage(
        "Expiry image read successfully.",
      );
    } catch (error) {
      console.error(
        "Failed to capture expiry image:",
        error,
      );

      setExpiryCaptureStatus("error");
      setExpiryCaptureMessage(
        "The expiry image could not be captured. Please try again.",
      );
    }
  }

  return (
    <section
      className="barcode-scanner"
      aria-labelledby="barcode-scanner-heading"
    >
      <h3 id="barcode-scanner-heading">
        {scanPhase === "barcode"
          ? "Scan barcode"
          : "Scan expiry date"}
      </h3>

      {scanPhase === "barcode" ? (
        <p>
          Hold the barcode horizontally and position it clearly in front of
          your camera.
        </p>
      ) : (
        <p>
          Barcode captured. Now point the camera at the printed expiry,
          use-by or best-before date.
        </p>
      )}

      {cameraStatus === "starting" && (
        <p role="status">
          Starting camera...
        </p>
      )}

      {cameraStatus === "ready" && (
        <p role="status">
          {scanPhase === "barcode"
            ? "Camera ready. Point it at a barcode."
            : "Expiry-date scanning will be added next."}
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

      {scanPhase === "expiry" && cameraStatus === "ready" && (
        <button
          type="button"
          onClick={() => void captureExpiryImage()}
          disabled={expiryCaptureStatus === "capturing"}
        >
          {expiryCaptureStatus === "capturing"
            ? "Capturing..."
            : "Capture expiry date"}
        </button>
      )}

      {expiryCaptureMessage && (
        <p
          role={
            expiryCaptureStatus === "error"
              ? "alert"
              : "status"
          }
        >
          {expiryCaptureMessage}
        </p>
      )}

      <button
        type="button"
        onClick={onCancel}
      >
        Cancel scanning
      </button>
    </section>
  );
}