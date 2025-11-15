"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fabric } from "fabric";
import { saveAs } from "file-saver";
import { removeBackgroundFromElement } from "@/lib/bgRemoval";

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function ImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const imageRef = useRef<fabric.Image | null>(null);

  const [loading, setLoading] = useState(false);
  const [hasImage, setHasImage] = useState(false);

  // Filters state
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [blur, setBlur] = useState(0);
  const [grayscale, setGrayscale] = useState(false);
  const [sepia, setSepia] = useState(false);
  const [invert, setInvert] = useState(false);

  // Export state
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [exportQuality, setExportQuality] = useState(0.92);

  // Crop state
  const [cropMode, setCropMode] = useState(false);
  const cropRectRef = useRef<fabric.Rect | null>(null);

  // Initialize Fabric
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: "#f8fafc",
      selection: true,
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    const onResize = () => {
      const parent = canvasRef.current?.parentElement;
      if (!parent) return;
      const width = parent.clientWidth;
      const height = Math.max(420, Math.floor((width * 9) / 16));
      canvas.setWidth(width);
      canvas.setHeight(height);
      canvas.requestRenderAll();
    };
    onResize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      canvas.dispose();
      fabricRef.current = null;
      imageRef.current = null;
    };
  }, []);

  const loadFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    fabric.Image.fromURL(url, (img) => {
      const canvas = fabricRef.current!;
      // Clear existing
      canvas.clear();
      canvas.setBackgroundColor("#ffffff", () => {});

      // Fit image to canvas
      const maxW = canvas.getWidth()!;
      const maxH = canvas.getHeight()!;
      const scale = Math.min(maxW / img.width!, maxH / img.height!);
      img.set({ left: maxW / 2, top: maxH / 2, originX: "center", originY: "center", selectable: true });
      img.scale(scale);

      canvas.add(img);
      canvas.setActiveObject(img);
      imageRef.current = img;
      setHasImage(true);
      URL.revokeObjectURL(url);
    }, { crossOrigin: "anonymous" });
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  }, [loadFile]);

  const applyFilters = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;

    const filters: any[] = [];
    if (brightness !== 0) filters.push(new (fabric as any).Image.filters.Brightness({ brightness: clamp(brightness, -1, 1) }));
    if (contrast !== 0) filters.push(new (fabric as any).Image.filters.Contrast({ contrast: clamp(contrast, -1, 1) }));
    if (saturation !== 0) filters.push(new (fabric as any).Image.filters.Saturation({ saturation: clamp(saturation, -1, 1) }));
    if (blur !== 0) filters.push(new (fabric as any).Image.filters.Blur({ blur: clamp(blur, 0, 1) }));
    if (grayscale) filters.push(new (fabric as any).Image.filters.Grayscale());
    if (sepia) filters.push(new (fabric as any).Image.filters.Sepia());
    if (invert) filters.push(new (fabric as any).Image.filters.Invert());

    img.filters = filters as any;
    img.applyFilters();
    fabricRef.current?.requestRenderAll();
  }, [brightness, contrast, saturation, blur, grayscale, sepia, invert]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const addText = useCallback(() => {
    const canvas = fabricRef.current!;
    const textbox = new fabric.Textbox("Your text", {
      left: canvas.getWidth()! / 2,
      top: canvas.getHeight()! / 2,
      originX: "center",
      originY: "center",
      fontSize: 36,
      fill: "#111827",
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system",
      editable: true,
    });
    canvas.add(textbox).setActiveObject(textbox);
  }, []);

  const fitToCanvas = useCallback(() => {
    const img = imageRef.current;
    const canvas = fabricRef.current!;
    if (!img) return;
    const maxW = canvas.getWidth()!;
    const maxH = canvas.getHeight()!;
    const scale = Math.min(maxW / img.width!, maxH / img.height!);
    img.set({ left: maxW / 2, top: maxH / 2, originX: "center", originY: "center" });
    img.scale(scale);
    canvas.requestRenderAll();
  }, []);

  const clearAll = useCallback(() => {
    fabricRef.current?.clear();
    imageRef.current = null;
    setHasImage(false);
  }, []);

  const exportImage = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const mime = exportFormat === "png" ? "image/png" : exportFormat === "jpeg" ? "image/jpeg" : "image/webp";
    const dataUrl = canvas.toDataURL({ format: exportFormat, quality: exportQuality });
    const blob = dataURLToBlob(dataUrl, mime);
    saveAs(blob, `edited.${exportFormat}`);
  }, [exportFormat, exportQuality]);

  const dataURLToBlob = (dataUrl: string, mime: string) => {
    const arr = dataUrl.split(",");
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  const startCrop = useCallback(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    const rect = new fabric.Rect({
      left: 40,
      top: 40,
      width: Math.min(300, canvas.getWidth()! - 80),
      height: Math.min(200, canvas.getHeight()! - 80),
      fill: "rgba(59,130,246,0.1)",
      stroke: "#2563eb",
      strokeWidth: 2,
      hasRotatingPoint: false,
      cornerStyle: "circle",
      cornerColor: "#2563eb",
      transparentCorners: false,
    });
    canvas.add(rect).setActiveObject(rect);
    cropRectRef.current = rect;
    setCropMode(true);
  }, []);

  const applyCrop = useCallback(() => {
    const rect = cropRectRef.current;
    const img = imageRef.current;
    const canvas = fabricRef.current!;
    if (!rect || !img) return;

    // Compute crop bounds in canvas space
    const bounds = rect.getBoundingRect(true, true);

    // Render the full scene to a temp canvas, then crop
    const temp = document.createElement("canvas");
    temp.width = canvas.getWidth()!;
    temp.height = canvas.getHeight()!;
    const tctx = temp.getContext("2d")!;
    tctx.fillStyle = "#ffffff";
    tctx.fillRect(0, 0, temp.width, temp.height);

    const dataURL = canvas.toDataURL({ format: "png", multiplier: 1 });
    const baseImg = new Image();
    baseImg.onload = () => {
      tctx.drawImage(baseImg, 0, 0);
      const crop = document.createElement("canvas");
      crop.width = Math.max(1, Math.round(bounds.width));
      crop.height = Math.max(1, Math.round(bounds.height));
      const cctx = crop.getContext("2d")!;
      cctx.drawImage(
        temp,
        Math.max(0, Math.round(bounds.left)),
        Math.max(0, Math.round(bounds.top)),
        Math.round(bounds.width),
        Math.round(bounds.height),
        0,
        0,
        Math.round(bounds.width),
        Math.round(bounds.height)
      );

      // Replace canvas with cropped image only
      canvas.clear();
      fabric.Image.fromURL(crop.toDataURL("image/png"), (newImg) => {
        const maxW = canvas.getWidth()!;
        const maxH = canvas.getHeight()!;
        const scale = Math.min(maxW / newImg.width!, maxH / newImg.height!);
        newImg.set({ left: maxW / 2, top: maxH / 2, originX: "center", originY: "center" });
        newImg.scale(scale);
        canvas.add(newImg);
        imageRef.current = newImg;
        setCropMode(false);
        cropRectRef.current = null;
      });
    };
    baseImg.src = dataURL;
  }, []);

  const cancelCrop = useCallback(() => {
    const rect = cropRectRef.current;
    if (rect) fabricRef.current?.remove(rect);
    setCropMode(false);
    cropRectRef.current = null;
  }, []);

  const removeBackground = useCallback(async () => {
    const img = imageRef.current;
    const canvas = fabricRef.current!;
    if (!img) return;
    setLoading(true);
    try {
      // Render current image to a canvas at natural size for better quality
      const naturalW = Math.round(img.getScaledWidth());
      const naturalH = Math.round(img.getScaledHeight());
      const temp = document.createElement("canvas");
      temp.width = naturalW;
      temp.height = naturalH;
      const tctx = temp.getContext("2d");
      if (!tctx) throw new Error("Context unavailable");

      // Draw current image snapshot
      const url = img.toDataURL({ format: "png" });
      const base = await loadHtmlImage(url);
      tctx.drawImage(base, 0, 0, naturalW, naturalH);

      const masked = await removeBackgroundFromElement(temp, 0.6);
      const newUrl = masked.toDataURL("image/png");

      fabric.Image.fromURL(newUrl, (newImg) => {
        // Keep position/scale roughly the same
        newImg.set({
          left: img.left,
          top: img.top,
          originX: img.originX,
          originY: img.originY,
        });
        newImg.scale(img.scaleX || 1);
        canvas.remove(img);
        canvas.add(newImg);
        canvas.setActiveObject(newImg);
        imageRef.current = newImg;
      }, { crossOrigin: "anonymous" });
    } catch (e) {
      console.error(e);
      alert("Background removal failed. Try a clearer subject image.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHtmlImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = src;
    });

  // Optional AI Enhance call
  const [prompt, setPrompt] = useState("");
  const aiEnhance = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setLoading(true);
    try {
      const dataUrl = canvas.toDataURL({ format: "png", quality: 1 });
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, prompt }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }
      const json = (await res.json()) as { image: string };
      // Replace canvas with enhanced image
      const fabricCanvas = fabricRef.current!;
      fabric.Image.fromURL(json.image, (newImg) => {
        fabricCanvas.clear();
        const maxW = fabricCanvas.getWidth()!;
        const maxH = fabricCanvas.getHeight()!;
        const scale = Math.min(maxW / newImg.width!, maxH / newImg.height!);
        newImg.set({ left: maxW / 2, top: maxH / 2, originX: "center", originY: "center" });
        newImg.scale(scale);
        fabricCanvas.add(newImg);
        imageRef.current = newImg;
        setHasImage(true);
      });
    } catch (e: any) {
      console.error(e);
      alert("AI enhance unavailable: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center px-3 py-2 rounded-md border bg-white text-sm cursor-pointer hover:bg-gray-50">
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFileChange} />
            Upload Image
          </label>
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-gray-50" onClick={fitToCanvas} disabled={!hasImage}>
            Fit to Canvas
          </button>
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-gray-50" onClick={clearAll}>
            Clear
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="px-2 py-2 rounded-md border text-sm"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as any)}
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="webp">WebP</option>
          </select>
          <div className="flex items-center gap-2 text-sm">
            <span>Quality</span>
            <input
              type="range"
              min={0.5}
              max={1}
              step={0.02}
              value={exportQuality}
              onChange={(e) => setExportQuality(parseFloat(e.target.value))}
            />
          </div>
          <button className="px-3 py-2 rounded-md border bg-brand-600 text-white text-sm hover:bg-brand-700" onClick={exportImage}>
            Export
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <canvas ref={canvasRef} className="w-full h-[480px] rounded-lg border" />
        </div>
        <div className="md:col-span-1 space-y-4">
          <section className="border rounded-lg p-3">
            <h3 className="font-medium mb-2">Filters</h3>
            <LabeledSlider label="Brightness" min={-1} max={1} step={0.02} value={brightness} setValue={setBrightness} />
            <LabeledSlider label="Contrast" min={-1} max={1} step={0.02} value={contrast} setValue={setContrast} />
            <LabeledSlider label="Saturation" min={-1} max={1} step={0.02} value={saturation} setValue={setSaturation} />
            <LabeledSlider label="Blur" min={0} max={1} step={0.01} value={blur} setValue={setBlur} />
            <div className="flex items-center gap-3 mt-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={grayscale} onChange={(e) => setGrayscale(e.target.checked)} />
                Grayscale
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sepia} onChange={(e) => setSepia(e.target.checked)} />
                Sepia
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} />
                Invert
              </label>
            </div>
          </section>

          <section className="border rounded-lg p-3">
            <h3 className="font-medium mb-2">Edit</h3>
            <div className="flex gap-2 flex-wrap">
              <button className="px-3 py-2 rounded-md border text-sm hover:bg-gray-50" onClick={addText} disabled={!hasImage}>
                Add Text
              </button>
              {!cropMode && (
                <button className="px-3 py-2 rounded-md border text-sm hover:bg-gray-50" onClick={startCrop} disabled={!hasImage}>
                  Crop
                </button>
              )}
              {cropMode && (
                <>
                  <button className="px-3 py-2 rounded-md border text-sm bg-green-600 text-white hover:bg-green-700" onClick={applyCrop}>
                    Apply Crop
                  </button>
                  <button className="px-3 py-2 rounded-md border text-sm hover:bg-gray-50" onClick={cancelCrop}>
                    Cancel
                  </button>
                </>
              )}
              <button
                className="px-3 py-2 rounded-md border text-sm hover:bg-gray-50 disabled:opacity-50"
                onClick={removeBackground}
                disabled={!hasImage || loading}
              >
                {loading ? "Processing?" : "Remove Background"}
              </button>
            </div>
          </section>

          <section className="border rounded-lg p-3">
            <h3 className="font-medium mb-2">AI Enhance (optional)</h3>
            <input
              className="w-full px-3 py-2 rounded-md border text-sm"
              placeholder="Describe enhancement (e.g., sharpen details)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              className="mt-2 w-full px-3 py-2 rounded-md border text-sm hover:bg-gray-50 disabled:opacity-50"
              onClick={aiEnhance}
              disabled={!hasImage || loading}
            >
              {loading ? "Processing?" : "Run AI Enhance"}
            </button>
            <p className="text-xs text-gray-500 mt-2">Requires OPENAI_API_KEY on server.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function LabeledSlider({
  label,
  min,
  max,
  step,
  value,
  setValue,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  setValue: (v: number) => void;
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-gray-500">{value.toFixed(2)}</span>
      </div>
      <input
        className="w-full"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
      />
    </div>
  );
}
