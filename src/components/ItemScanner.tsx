import { useEffect, useRef, useState } from "react";
import {
  BarcodeFormat,
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import type { ProductLookupResult } from "../types";
import {
  extractExpiryDateCandidates,
  getExpiryDateStatus,
  getRelevantExpiryDates,
  parseExpiryDate,
} from "../utils/expiry";

export type BarcodeLookupOutcome =
  | {
      status: "success";
      product: ProductLookupResult;
    }
  | {
      status: "not-found";
    }
  | {
      status: "error";
    }
  | {
      status: "invalid";
    }
  | {
      status: "aborted";
    };

interface ItemScannerProps {
  onBarcodeDetected: (
    barcode: string,
  ) => Promise<BarcodeLookupOutcome>;
  onProductConfirmed: (
    barcode: string,
    product: ProductLookupResult,
  ) => void;
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

type DetectedExpiryDate = {
  candidate: string;
  date: string;
};

export default function ItemScanner({
  onBarcodeDetected,
  onProductConfirmed,
  onCancel,
}: ItemScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasDetectedRef = useRef(false);

  const ignoredBarcodesRef =
    useRef<Set<string>>(new Set());

  const [cameraStatus, setCameraStatus] =
    useState<CameraStatus>("starting");

  const [scanPhase, setScanPhase] =
    useState<ScanPhase>("barcode");

  const [detectedBarcode, setDetectedBarcode] =
    useState<string | null>(null);

  const [barcodeLookupStatus, setBarcodeLookupStatus] =
    useState<
      "idle" | "checking" | "success" | "error"
    >("idle");

  const [detectedProduct, setDetectedProduct] =
    useState<ProductLookupResult | null>(null);

  const [expiryCaptureStatus, setExpiryCaptureStatus] =
    useState<ExpiryCaptureStatus>("idle");

  const [expiryCaptureMessage, setExpiryCaptureMessage] =
    useState<string | null>(null);

  const [detectedExpiryDates, setDetectedExpiryDates] =
    useState<DetectedExpiryDate[]>([]);

  const [selectedExpiryDate, setSelectedExpiryDate] =
    useState<string>("");

  const relevantExpiryDateValues = getRelevantExpiryDates(
    detectedExpiryDates.map((expiryDate) => expiryDate.date),
  );

  const visibleExpiryDates = detectedExpiryDates.filter(
    (expiryDate) =>
      relevantExpiryDateValues.includes(expiryDate.date),
  );

  const expiryDateToConfirm =
    visibleExpiryDates.length === 1
      ? visibleExpiryDates[0].date
      : selectedExpiryDate;

  const detectedDatesAreExpired =
    visibleExpiryDates.length > 0 &&
    visibleExpiryDates.every(
      (expiryDate) =>
        getExpiryDateStatus(expiryDate.date) === "past",
    );

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

                  if (ignoredBarcodesRef.current.has(barcode)) {
                    return;
                  }

                  hasDetectedRef.current = true;

                  console.log("Barcode detected:", barcode);

                  setDetectedBarcode(barcode);
                  void checkDetectedBarcode(barcode);
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

  async function checkDetectedBarcode(
    barcode: string,
  ): Promise<void> {
    setBarcodeLookupStatus("checking");
    setDetectedProduct(null);

    const outcome = await onBarcodeDetected(barcode);

    if (outcome.status === "success") {
      setDetectedProduct(outcome.product);
      setBarcodeLookupStatus("success");
      return;
    }

    if (outcome.status === "not-found") {
      console.log(
        "Ignoring unrecognised barcode:",
        barcode,
      );

      ignoredBarcodesRef.current.add(barcode);

      setDetectedBarcode(null);
      setDetectedProduct(null);
      setBarcodeLookupStatus("idle");

      hasDetectedRef.current = false;

      return;
    }

    if (
      outcome.status === "error" ||
      outcome.status === "invalid"
    ) {
      setBarcodeLookupStatus("error");
      return;
    }

    setBarcodeLookupStatus("idle");
  }

  function handleUseBarcode(): void {
    if (
      !detectedBarcode ||
      barcodeLookupStatus !== "success" ||
      !detectedProduct
    ) {
      return;
    }

    console.log(
      "Product confirmed:",
      detectedProduct.productName,
    );

    onProductConfirmed(
      detectedBarcode,
      detectedProduct,
    );

    setScanPhase("expiry");
  }

  function handleScanAgain(): void {
    detectedBarcode && console.log(
      "Barcode rejected:",
      detectedBarcode,
    );

    setDetectedBarcode(null);
    hasDetectedRef.current = false;

    setBarcodeLookupStatus("idle");
    setDetectedProduct(null);
  }

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

    setDetectedExpiryDates([]);
    setSelectedExpiryDate("");

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
        "http://127.0.0.1:8001//ocr",
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

      const rawText = result.lines
        .map((line) => line.text)
        .join("\n");

      console.log("Expiry OCR raw text:", rawText);

      const expiryCandidates =
        extractExpiryDateCandidates(rawText);

      const parsedExpiryDates = expiryCandidates
        .map((candidate) => ({
          candidate,
          date: parseExpiryDate(candidate),
        }))
        .filter(
          (
            result,
          ): result is {
            candidate: string;
            date: string;
          } => result.date !== null,
        );

      console.log(
        "Expiry date candidates:",
        parsedExpiryDates,
      );

      setDetectedExpiryDates(parsedExpiryDates);
      setExpiryCaptureStatus("ready");

      setExpiryCaptureMessage(
        parsedExpiryDates.length > 0
          ? `Found ${parsedExpiryDates.length} possible expiry ${
              parsedExpiryDates.length === 1 ? "date" : "dates"
            }.`
          : "No expiry date was detected. Try positioning the printed date clearly inside the guide.",
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
          Product confirmed. Position the printed expiry, use-by or
          best-before date inside the guide.
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

      <div className="item-scanner-camera">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          hidden={cameraStatus !== "ready"}
        />

        {scanPhase === "barcode" &&
          cameraStatus === "ready" &&
          !detectedBarcode && (
            <div
              className="barcode-scan-target"
              aria-hidden="true"
            >
              <span>Fill most of the frame with barcode</span>
            </div>
          )}

        {scanPhase === "expiry" &&
          cameraStatus === "ready" && (
            <div
              className="expiry-scan-target"
              aria-hidden="true"
            >
              <span>Place expiry date here</span>
            </div>
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
              : "When you are ready, capture the printed expiry, use-by or best-before date."}
          </p>
        )}
      </div>

      {scanPhase === "barcode" &&
        cameraStatus === "ready" &&
        !detectedBarcode && (
          <div className="barcode-scan-progress">
            <p role="status">
              Scanning for barcode...
            </p>

            <div
              className="scan-progress-track"
              aria-hidden="true"
            >
              <div className="scan-progress-indicator" />
            </div>

            <p className="scan-guidance">
              Move closer until the barcode fills most of the guide. Keep it flat,
              horizontal and well lit.
            </p>
          </div>
        )}

      {scanPhase === "barcode" && detectedBarcode && (
        <div
          className="barcode-detected"
          aria-live="polite"
        >
          {barcodeLookupStatus === "checking" && (
            <>
              <p>
                <strong>Checking product...</strong>
              </p>

              <div
                className="scan-progress-track"
                aria-hidden="true"
              >
                <div className="scan-progress-indicator" />
              </div>

              <p className="scan-guidance">
                Barcode read. Checking the product database...
              </p>
            </>
          )}

          {barcodeLookupStatus === "success" &&
            detectedProduct && (
              <>
                <p>
                  <strong>✓ Product found</strong>
                </p>

                <p className="barcode-detected-value">
                  {detectedProduct.productName ??
                    "Unnamed product"}
                </p>

                {detectedProduct.brand && (
                  <p>Brand: {detectedProduct.brand}</p>
                )}

                <p className="scan-guidance">
                  Barcode: {detectedBarcode}
                </p>

                <div className="barcode-detected-actions">
                  <button
                    type="button"
                    onClick={handleUseBarcode}
                  >
                    Use product
                  </button>

                  <button
                    type="button"
                    onClick={handleScanAgain}
                  >
                    Scan again
                  </button>
                </div>
              </>
            )}


          {barcodeLookupStatus === "error" && (
            <>
              <p>
                <strong>Product lookup unavailable</strong>
              </p>

              <p className="scan-guidance">
                We couldn't check this barcode right now.
                You can try scanning again or enter the item
                manually.
              </p>

              <div className="barcode-detected-actions">
                <button
                  type="button"
                  onClick={handleScanAgain}
                >
                  Scan again
                </button>
              </div>
            </>
          )}
        </div>
      )}

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

      {detectedDatesAreExpired && (
        <p role="alert">
          Only a past date was detected. This item may be expired, or this could be a production or packed date. Scan again if you're unsure.
        </p>
      )}

      {visibleExpiryDates.length > 0 && (
        <fieldset className="expiry-date-options">
          <legend>Possible dates found</legend>

          {visibleExpiryDates.map((expiryDate) => (
            <label
              key={`${expiryDate.candidate}-${expiryDate.date}`}
            >
              <input
                type="radio"
                name="detected-expiry-date"
                value={expiryDate.date}
                checked={expiryDateToConfirm === expiryDate.date}
                onChange={(event) =>
                  setSelectedExpiryDate(event.target.value)
                }
              />

              <span>
                {expiryDate.candidate} → {expiryDate.date}
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {visibleExpiryDates.length > 0 && (
        <button
          type="button"
          disabled={!expiryDateToConfirm}
          onClick={() => {
            console.log(
              "Expiry date confirmed:",
              expiryDateToConfirm,
            );
          }}
        >
          {visibleExpiryDates.length === 1
            ? detectedDatesAreExpired
              ? "Use this date anyway"
              : "Use this date"
            : "Use selected date"}
        </button>
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