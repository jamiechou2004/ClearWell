import React, { useState } from 'react';
import { Download, Sliders, Layers, ArrowLeft, MousePointerClick } from 'lucide-react';
import { BatchItem } from '../types';
import { ImageEditor } from './ImageEditor';
import { WatermarkSelector } from './WatermarkSelector';

interface ComparisonViewProps {
  item: BatchItem;
  onUpdateProcessed: (id: string, newBase64: string) => void;
  onManualMaskRequest: (id: string, maskBase64: string) => void;
  onBack: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ item, onUpdateProcessed, onManualMaskRequest, onBack }) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit' | 'manual'>('view');

  // If we are still processing this item
  if (!item.processedBase64 && item.status === 'completed') {
      return <div className="p-8 text-center text-red-400">Error loading image data.</div>;
  }

  const downloadImage = () => {
    if (!item.processedBase64) return;
    const link = document.createElement('a');
    link.href = `data:${item.processedMimeType || 'image/png'};base64,${item.processedBase64}`;
    link.download = `clearwell-${item.original.file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditorSave = (newBase64: string) => {
      onUpdateProcessed(item.id, newBase64);
      setMode('view');
  };

  const handleManualMaskConfirm = (maskBase64: string) => {
      onManualMaskRequest(item.id, maskBase64);
      setMode('view');
  };

  if (mode === 'edit' && item.processedBase64) {
      return (
          <div className="w-full h-full max-h-[85vh] animate-fade-in flex flex-col">
              <ImageEditor 
                imageBase64={item.processedBase64}
                mimeType={item.processedMimeType || 'image/png'}
                onSave={handleEditorSave}
                onCancel={() => setMode('view')}
              />
          </div>
      );
  }

  if (mode === 'manual') {
      return (
          <div className="w-full h-full max-h-[85vh] animate-fade-in flex flex-col">
              <WatermarkSelector 
                imageBase64={item.original.base64} // Use original for masking
                mimeType={item.original.mimeType}
                onConfirm={handleManualMaskConfirm}
                onCancel={() => setMode('view')}
              />
          </div>
      );
  }

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 shrink-0 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
             <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white">
                <ArrowLeft className="w-6 h-6" />
             </button>
             <div className="min-w-0">
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-200 to-indigo-100 bg-clip-text text-transparent truncate">
                {item.original.file.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wider
                        ${item.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                          item.status === 'processing' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 
                          item.status === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-slate-700 text-slate-400'
                        }
                    `}>
                        {item.status}
                    </span>
                    <span className="text-xs text-slate-500">
                        {(item.original.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                </div>
             </div>
        </div>
       
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            disabled={item.status === 'processing'}
            onClick={() => setMode('manual')}
            className="whitespace-nowrap flex-none flex items-center px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MousePointerClick className="w-4 h-4 mr-2" />
            Manual Remove
          </button>
          
          <button
            disabled={item.status !== 'completed'}
            onClick={() => setMode('edit')}
            className="whitespace-nowrap flex-none flex items-center px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800"
          >
            <Sliders className="w-4 h-4 mr-2" />
            Edit Result
          </button>
          
          <button
            disabled={item.status !== 'completed'}
            onClick={downloadImage}
            className="whitespace-nowrap flex-none flex items-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </button>
        </div>
      </div>

      <div className="flex-1 grid md:grid-cols-2 gap-6 min-h-0 overflow-y-auto pb-4">
        {/* Original */}
        <div className="space-y-3 flex flex-col h-full">
          <div className="flex items-center justify-between text-sm text-slate-400 shrink-0 px-1">
            <span className="font-semibold uppercase tracking-wider text-xs">Original</span>
          </div>
          <div className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-800/30 flex-1 min-h-[300px]">
            <img 
              src={item.original.previewUrl} 
              alt="Original" 
              className="absolute inset-0 w-full h-full object-contain p-4"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="px-4 py-2 bg-black/70 rounded-full text-white text-sm backdrop-blur-sm font-medium">Original</span>
            </div>
          </div>
        </div>

        {/* Processed */}
        <div className="space-y-3 flex flex-col h-full">
           <div className="flex items-center justify-between text-sm text-indigo-300 shrink-0 px-1">
            <span className="font-semibold uppercase tracking-wider text-xs">Clearwell Result</span>
          </div>
          <div className="relative group rounded-xl overflow-hidden border border-indigo-500/30 bg-indigo-900/5 shadow-2xl shadow-indigo-900/10 flex-1 min-h-[300px]">
            {item.status === 'completed' && item.processedBase64 ? (
                <img 
                src={`data:${item.processedMimeType};base64,${item.processedBase64}`}
                alt="Processed" 
                className="absolute inset-0 w-full h-full object-contain p-4"
                />
            ) : item.status === 'processing' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-300 bg-slate-900/50 backdrop-blur-sm">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4 shadow-lg shadow-indigo-500/20"></div>
                    <p className="animate-pulse font-medium">Removing watermarks...</p>
                    <p className="text-xs text-indigo-400/70 mt-2">Powered by Gemini</p>
                </div>
            ) : item.status === 'error' ? (
                <div className="absolute inset-0 flex items-center justify-center text-red-400 p-8 text-center bg-slate-900/50">
                    <div className="bg-red-950/50 p-6 rounded-xl border border-red-900/50">
                        <p className="font-semibold mb-2">Processing Failed</p>
                        <p className="text-sm opacity-80">{item.error || 'Unknown error occurred'}</p>
                    </div>
                </div>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30">
                    <Layers className="w-12 h-12 mb-4 opacity-20" />
                    <p>Waiting in queue...</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Toggle for Mobile */}
      <div className="md:hidden mt-4 shrink-0">
        <button
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onTouchStart={() => setShowOriginal(true)}
            onTouchEnd={() => setShowOriginal(false)}
            className="w-full py-4 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium active:bg-slate-700 select-none flex items-center justify-center gap-2 shadow-lg"
        >
          <Layers className="w-5 h-5" />
          Hold to Compare
        </button>
      </div>
      
      {/* Mobile overlay for "Hold to Compare" */}
      {showOriginal && (
        <div className="md:hidden absolute top-0 left-0 w-full h-full z-50 bg-slate-900 flex items-center justify-center p-4">
             <div className="relative w-full h-full">
                <img 
                    src={item.original.previewUrl} 
                    className="w-full h-full object-contain"
                    alt="Original Overlay"
                />
                <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 text-white text-xs rounded-full">Original</div>
             </div>
        </div>
      )}
    </div>
  );
};
