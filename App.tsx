import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, Plus, Github } from 'lucide-react';
import { UploadZone } from './components/UploadZone';
import { ComparisonView } from './components/ComparisonView';
import { BatchList } from './components/BatchList';
import { removeWatermark } from './services/geminiService';
import { ImageFile, BatchItem } from './types';

export default function App() {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Queue processing logic
  useEffect(() => {
    const processQueue = async () => {
      // Find the first queued item
      const nextItem = batchItems.find(item => item.status === 'queued');
      if (!nextItem) return; // Nothing to do

      // Check if something is currently processing (Simple sequential processing to be safe)
      const isProcessing = batchItems.some(item => item.status === 'processing');
      if (isProcessing) return;

      // Start processing nextItem
      setBatchItems(prev => prev.map(item => 
        item.id === nextItem.id ? { ...item, status: 'processing' } : item
      ));

      try {
        const processedBase64 = await removeWatermark(
            nextItem.original.base64, 
            nextItem.original.mimeType,
            nextItem.maskBase64 // Pass the optional mask if user created one
        );
        
        setBatchItems(prev => prev.map(item => 
          item.id === nextItem.id ? { 
            ...item, 
            status: 'completed', 
            processedBase64, 
            processedMimeType: 'image/jpeg' 
          } : item
        ));
      } catch (err: any) {
        console.error(err);
        setBatchItems(prev => prev.map(item => 
          item.id === nextItem.id ? { 
            ...item, 
            status: 'error', 
            error: err.message || 'Processing failed' 
          } : item
        ));
      }
    };

    const timer = setTimeout(processQueue, 500); // Small debounce
    return () => clearTimeout(timer);
  }, [batchItems]);

  const handleImagesSelected = (images: ImageFile[]) => {
    const newItems: BatchItem[] = images.map(img => ({
      id: Math.random().toString(36).substr(2, 9),
      original: img,
      status: 'queued'
    }));

    setBatchItems(prev => [...prev, ...newItems]);
    
    // Auto-select the first new item if nothing selected
    if (!selectedId && newItems.length > 0) {
      setSelectedId(newItems[0].id);
    }
  };

  const handleUpdateProcessed = (id: string, newBase64: string) => {
    setBatchItems(prev => prev.map(item => 
      item.id === id ? { ...item, processedBase64: newBase64 } : item
    ));
  };

  const handleManualMaskRequest = (id: string, maskBase64: string) => {
      // Re-queue the item with the mask
      setBatchItems(prev => prev.map(item => 
          item.id === id ? { ...item, status: 'queued', maskBase64, processedBase64: undefined } : item
      ));
  };

  const handleRemoveItem = (id: string) => {
    setBatchItems(prev => {
        const newState = prev.filter(item => item.id !== id);
        if (selectedId === id) {
             // If we removed the selected item, try to select the next one, or null
             const index = prev.findIndex(i => i.id === id);
             if (newState.length > 0) {
                 // Try to select item at same index, or last item
                 const nextSelection = newState[Math.min(index, newState.length - 1)];
                 setSelectedId(nextSelection.id);
             } else {
                 setSelectedId(null);
             }
        }
        return newState;
    });
  };

  const resetApp = () => {
    setBatchItems([]);
    setSelectedId(null);
  };

  const selectedItem = batchItems.find(i => i.id === selectedId);

  return (
    <div className="h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-[#0f172a] text-slate-200 selection:bg-indigo-500/30 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-md shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={resetApp}>
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Clearwell
                </h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold leading-none mt-0.5">By Jamie Zhou</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {batchItems.length > 0 && (
                 <button 
                    onClick={() => document.getElementById('add-more-trigger')?.click()} 
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors border border-slate-700"
                 >
                     <Plus className="w-4 h-4" /> 
                     <span>Add Images</span>
                 </button>
             )}
             <a href="#" className="p-2 text-slate-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
             </a>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Empty State / Initial Upload */}
        {batchItems.length === 0 ? (
          <div className="flex-1 overflow-y-auto">
              <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center min-h-full justify-center -mt-16">
                <div className="w-full max-w-3xl flex flex-col items-center animate-fade-in-up">
                    
                    <div className="text-center mb-10 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-2">
                            <Wand2 className="w-3 h-3" />
                            <span>Powered by Gemini 2.5 Flash</span>
                        </div>
                        <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-white mb-6 drop-shadow-2xl">
                            Make it Clear.
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
                            The intelligent watermark remover designed by Jamie Zhou. 
                            Upload your batch, and let Clearwell restore your images in seconds.
                        </p>
                    </div>

                    <div className="w-full transform hover:scale-[1.01] transition-transform duration-500">
                        <UploadZone onImagesSelected={handleImagesSelected} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full px-4">
                    {[
                        { title: 'Batch Processing', desc: 'Upload 50+ images. Clearwell handles the queue automatically.' },
                        { title: 'Smart Restoration', desc: 'Gemini AI reconstructs the background, not just blurs it.' },
                        { title: 'Precise Control', desc: 'Manually select complex watermarks for perfect removal.' }
                    ].map((item, i) => (
                        <div key={i} className="p-5 rounded-2xl bg-slate-800/20 border border-slate-700/30 backdrop-blur-sm text-center">
                            <h3 className="font-semibold text-slate-200 mb-2">{item.title}</h3>
                            <p className="text-sm text-slate-500">{item.desc}</p>
                        </div>
                    ))}
                    </div>
                </div>
            </div>
          </div>
        ) : (
            // Workstation Layout
            <>
                {/* Sidebar (Batch List) */}
                <div className={`
                    w-full md:w-80 border-r border-slate-800 flex-shrink-0 bg-slate-900/30 flex flex-col
                    ${selectedId ? 'hidden md:flex' : 'flex'}
                `}>
                    <BatchList 
                        items={batchItems} 
                        selectedId={selectedId} 
                        onSelect={setSelectedId}
                        onRemove={handleRemoveItem}
                    />
                    
                    <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                        <button 
                            onClick={() => document.getElementById('add-more-trigger')?.click()}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 border-dashed"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add to Queue</span>
                        </button>
                    </div>

                    {/* Hidden input to add more files to queue */}
                    <div className="hidden">
                        <UploadZone onImagesSelected={handleImagesSelected} />
                        <span id="add-more-trigger" onClick={() => {
                            // Trigger logic handled by checking for inputs in UploadZone or simulating click
                            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                            if(input) input.click();
                        }}/>
                    </div>
                </div>

                {/* Main Workspace (Comparison/Editor) */}
                <div className={`
                    flex-1 bg-slate-950 relative overflow-hidden flex flex-col
                    ${!selectedId ? 'hidden md:flex' : 'flex'}
                `}>
                    {selectedItem ? (
                        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                            <ComparisonView 
                                item={selectedItem} 
                                onUpdateProcessed={handleUpdateProcessed}
                                onManualMaskRequest={handleManualMaskRequest}
                                onBack={() => setSelectedId(null)}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                             <div className="w-20 h-20 rounded-2xl bg-slate-900/50 flex items-center justify-center mb-4 border border-slate-800 rotate-12">
                                <Sparkles className="w-10 h-10 opacity-20" />
                             </div>
                            <p className="text-lg">Select an image to start editing</p>
                        </div>
                    )}
                </div>
            </>
        )}
      </main>
    </div>
  );
}
