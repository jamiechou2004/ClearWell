import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Paintbrush, RotateCcw, Check, X } from 'lucide-react';

interface WatermarkSelectorProps {
  imageBase64: string;
  mimeType: string;
  onConfirm: (maskBase64: string) => void;
  onCancel: () => void;
}

export const WatermarkSelector: React.FC<WatermarkSelectorProps> = ({ imageBase64, mimeType, onConfirm, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [mode, setMode] = useState<'draw' | 'erase'>('draw');
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Initialize Image
  useEffect(() => {
    const img = new Image();
    img.src = `data:${mimeType};base64,${imageBase64}`;
    img.onload = () => {
      setImageObj(img);
      initializeCanvas(img);
    };
  }, [imageBase64, mimeType]);

  const initializeCanvas = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match image resolution
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw the base image
      ctx.drawImage(img, 0, 0);
      // Setup default styles
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault(); // Prevent scrolling on touch

    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');

    if (ctx) {
      ctx.lineWidth = brushSize;
      if (mode === 'draw') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Semi-transparent red
      } else {
        // To erase properly, we need to redraw the original image part
        // But a simpler way for a "mask" UI is to just clear the red. 
        // However, we painted ON the image. 
        // Better approach: Re-draw original image slice? 
        // Complex. Let's stick to simple "Red Marker" layer approach for V2?
        // Actually, easiest implementation for "Erase":
        // We are drawing on a SINGLE canvas. 
        // If we want to erase "red" but keep "image", we need layers.
        // Let's implement layers quickly: 
        // 1. Background Image (CSS)
        // 2. Canvas (Transparent, for drawing red only)
        // This is much better for the "Erase" tool.
      }
      
      // Since I implemented single-canvas logic above, let's switch to the Layered approach now for better Eraser support.
    }
  };

  // Re-implementation with Layers for better Eraser support
  // Canvas only holds the RED MASK.
  // Image is displayed behind it.
  
  const drawLayered = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();

    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');

    if (ctx) {
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (mode === 'draw') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      } else {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      }
      
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.closePath();
  };

  const handleConfirm = () => {
    if (!canvasRef.current || !imageObj) return;
    
    // We need to merge the original image and the mask into a single image to send to Gemini as the "Guide"
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = imageObj.width;
    finalCanvas.height = imageObj.height;
    const ctx = finalCanvas.getContext('2d');
    
    if (ctx) {
        // 1. Draw Original
        ctx.drawImage(imageObj, 0, 0);
        // 2. Draw Mask (The Red Strokes)
        ctx.drawImage(canvasRef.current, 0, 0);
        
        // Export
        const dataUrl = finalCanvas.toDataURL(mimeType);
        onConfirm(dataUrl); // This is the "Visual Guide" image
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
      <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800">
        <div>
            <h3 className="font-semibold text-white">Manual Removal</h3>
            <p className="text-xs text-slate-400">Highlight the watermark in red.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={onCancel} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
            </button>
            <button 
                onClick={handleConfirm} 
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
            >
                <Check className="w-4 h-4" />
                Remove Highlighted
            </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Canvas Container */}
        <div className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-900/50">
            <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-700/50" style={{ maxHeight: '60vh', maxWidth: '100%' }}>
                {/* Background Image */}
                {imageObj && (
                    <img 
                        src={imageObj.src} 
                        style={{ display: 'block', maxWidth: '100%', maxHeight: '60vh' }}
                        alt="Background"
                    />
                )}
                {/* Drawing Layer */}
                <canvas 
                    ref={canvasRef}
                    onMouseDown={(e) => { startDrawing(e); drawLayered(e); }}
                    onMouseMove={drawLayered}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={(e) => { startDrawing(e); drawLayered(e); }}
                    onTouchMove={drawLayered}
                    onTouchEnd={stopDrawing}
                    className="absolute inset-0 cursor-crosshair touch-none"
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
        </div>

        {/* Toolbar */}
        <div className="w-full md:w-64 p-6 bg-slate-800 border-l border-slate-700 flex flex-col gap-6">
            
            <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-slate-300">Tools</span>
                <div className="flex gap-2 bg-slate-900 p-1 rounded-lg">
                    <button 
                        onClick={() => setMode('draw')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'draw' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <Paintbrush className="w-4 h-4" />
                        Draw
                    </button>
                    <button 
                        onClick={() => setMode('erase')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'erase' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <Eraser className="w-4 h-4" />
                        Erase
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-300">Brush Size</label>
                    <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">{brushSize}px</span>
                </div>
                <input 
                    type="range" min="5" max="100" value={brushSize} 
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                />
            </div>

            <div className="pt-4 mt-auto border-t border-slate-700">
                <button 
                    onClick={() => {
                        const canvas = canvasRef.current;
                        const ctx = canvas?.getContext('2d');
                        if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }}
                    className="w-full py-2 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Clear Mask
                </button>
            </div>
            
            <div className="bg-indigo-500/10 p-3 rounded-lg border border-indigo-500/20 text-xs text-indigo-200">
                <p><strong>Tip:</strong> Paint loosely over the text or logo you want to remove. The AI will remove red areas.</p>
            </div>
        </div>
      </div>
    </div>
  );
};
