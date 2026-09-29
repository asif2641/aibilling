"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ZoomIn, ZoomOut, RotateCw, Maximize2, FileText, Image as ImageIcon, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { BoundingBox } from "@/types";

interface DocumentViewerProps {
  fileUrl: string;
  filename: string;
  mimeType: string;
  activeBoundingBox?: BoundingBox | null;
  activeFieldLabel?: string | null;
}

export function DocumentViewer({
  fileUrl,
  filename,
  mimeType,
  activeBoundingBox,
  activeFieldLabel,
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const isPdf = mimeType.toLowerCase().includes("pdf") || filename.toLowerCase().endsWith(".pdf");

  const loadMedia = useCallback(() => {
    if (!fileUrl) return;
    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);

    let active = true;
    let createdUrl: string | null = null;

    const token = typeof window !== "undefined" ? localStorage.getItem("bill_auth_token") : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch(fileUrl, { headers })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }
        const blob = await res.blob();
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setPreviewSrc(createdUrl);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.warn("Direct blob fetch failed, falling back to direct URL:", err);
        // Fallback to fileUrl (which includes ?token=...)
        setPreviewSrc(fileUrl);
        setIsLoading(false);
      });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [fileUrl]);

  useEffect(() => {
    const cleanup = loadMedia();
    return () => {
      if (cleanup) cleanup();
    };
  }, [loadMedia]);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-md">
      {/* Top Toolbar */}
      <div className="h-12 bg-slate-800/90 border-b border-slate-700/80 px-4 flex items-center justify-between text-slate-300">
        <div className="flex items-center gap-2 min-w-0">
          {isPdf ? <FileText className="w-4 h-4 text-rose-400" /> : <ImageIcon className="w-4 h-4 text-indigo-400" />}
          <span className="text-xs font-medium text-slate-200 truncate max-w-[200px]" title={filename}>
            {filename}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono px-1.5 text-slate-400">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-700 mx-1"></div>
          <button
            onClick={handleRotate}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Rotate Clockwise"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Reset View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Document Viewport Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-slate-950 p-6 flex items-center justify-center relative bg-grid-pattern min-h-[400px]"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
            <p className="text-xs font-medium">Loading document preview...</p>
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center p-6 bg-slate-900/60 rounded-xl border border-slate-800 max-w-sm">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-200">Unable to load document preview</p>
              <p className="text-[11px] text-slate-400">{errorMessage || "Could not retrieve the file from storage."}</p>
            </div>
            <button
              onClick={loadMedia}
              className="mt-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Preview</span>
            </button>
          </div>
        ) : (
          <div
            className="relative transition-transform duration-200 ease-out origin-center inline-block max-w-full"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          >
            {isPdf ? (
              <iframe
                src={`${previewSrc || fileUrl}#toolbar=0`}
                className="w-[600px] h-[800px] bg-white rounded shadow-2xl border border-slate-700"
                title="PDF Document"
                onError={() => {
                  setHasError(true);
                  setErrorMessage("Failed to render PDF preview.");
                }}
              />
            ) : (
              <div className="relative inline-block shadow-2xl rounded overflow-hidden bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewSrc || fileUrl}
                  alt={filename}
                  className="max-w-[650px] max-h-[85vh] w-auto h-auto object-contain block select-none pointer-events-none"
                  onError={() => {
                    setHasError(true);
                    setErrorMessage("Failed to display bill image.");
                  }}
                />

                {/* Bounding Box Overlay */}
                {activeBoundingBox && (
                  <div
                    className="absolute border-2 border-indigo-500 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.6)] rounded-sm transition-all duration-300 z-10 pointer-events-none"
                    style={{
                      left: `${activeBoundingBox.x * 100}%`,
                      top: `${activeBoundingBox.y * 100}%`,
                      width: `${activeBoundingBox.width * 100}%`,
                      height: `${activeBoundingBox.height * 100}%`,
                    }}
                  >
                    {activeFieldLabel && (
                      <span className="absolute -top-6 left-0 bg-indigo-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                        {activeFieldLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="h-8 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-500">
        <span>Original Document Evidence</span>
        <span>Click any field on the right to locate on document</span>
      </div>
    </div>
  );
}
