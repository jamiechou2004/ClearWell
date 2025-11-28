import React, { useRef, useEffect, useState } from 'react';
import { Save, X, RotateCcw, ZoomIn } from 'lucide-react';

interface ImageEditorProps {
  imageBase64: string;
  mimeType: string;
  onSave: (newBase64: string) => void;
  onCancel: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageBase64, mimeType, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [zoom, setZoom] = useState(0); // 0 to 50
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Load image object
  useEffect(() => {
    const img = new Image();
    img.src = `data:${mimeType};base64,${imageBase64}`;
    img.onload = () => {
      setImageObj(img);
    };
  }, [imageBase64, mimeType]);

  // Draw function
  useEffect(() => {
    if (!imageObj || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset canvas dimensions to match image
    canvas.width = imageObj.width;
    canvas.height = imageObj.height;

    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Draw image with zoom (cropping)
    if (zoom > 0) {
        const cropAmount = Math.min(canvas.width, canvas.height) * (zoom / 200); 
        
        // Use a temporary canvas for the crop to ensure clean scaling
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tCtx = tempCanvas.getContext('2d');
        
        if (tCtx) {
           // We are effectively zooming into the center
           const sx = cropAmount;
           const sy = cropAmount * (imageObj.height / imageObj.width);
           const sw = imageObj.width - (sx * 2);
           const sh = imageObj.height - (sy * 2);

           ctx.drawImage(
                imageObj, 
                sx, cropAmount, // sx, sy (approximated for aspect ratio)
                sw, imageObj.height - (cropAmount * 2), // sw, sh
                0, 0, // dx, dy
                canvas.width, canvas.height // dw, dh
            );
        }
    } else {
        ctx.drawImage(imageObj, 0, 0, canvas.width, canvas.height);
    }

  }, [imageObj, brightness, contrast, zoom]);

  const handleSave = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL(mimeType);
      const cleanBase64 = dataUrl.split(',')[1];
      onSave(cleanBase64);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
      <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800">
        <h3 className="font-semibold text-white">Edit & Refine</h3>
        <div className="flex gap-2">
            <button onClick={onCancel} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
                <Save className="w-4 h-4" />
                Save Changes
            </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-900/50">
            <canvas ref={canvasRef} className="max-w-full max-h-[60vh] object-contain shadow-2xl border border-slate-700/50 rounded-lg" />
        </div>

        {/* Controls */}
        <div className="w-full md:w-72 p-6 bg-slate-800 border-l border-slate-700 space-y-8 overflow-y-auto">
            
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-300">Brightness</label>
                    <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">{brightness}%</span>
                </div>
                <input 
                    type="range" min="0" max="200" value={brightness} 
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                />
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-300">Contrast</label>
                    <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">{contrast}%</span>
                </div>
                <input 
                    type="range" min="0" max="200" value={contrast} 
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                />
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         <ZoomIn className="w-4 h-4 text-slate-400" />
                         <label className="text-sm font-medium text-slate-300">Center Zoom</label>
                    </div>
                    <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">{zoom}%</span>
                </div>
                <input 
                    type="range" min="0" max="40" value={zoom} 
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                />
                <p className="text-xs text-slate-500 leading-relaxed">Zooms into the center of the image to crop out edges.</p>
            </div>

            <div className="pt-6 border-t border-slate-700">
                <button 
                    onClick={() => { setBrightness(100); setContrast(100); setZoom(0); }}
                    className="w-full py-2 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Reset All
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};