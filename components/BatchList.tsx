import React from 'react';
import { CheckCircle, Clock, AlertCircle, Loader2, X } from 'lucide-react';
import { BatchItem } from '../types';

interface BatchListProps {
  items: BatchItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export const BatchList: React.FC<BatchListProps> = ({ items, selectedId, onSelect, onRemove }) => {
  return (
    <div className="w-full h-full flex flex-col bg-slate-900/50 border-r border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
        <h3 className="font-semibold text-slate-200">Queue ({items.length})</h3>
        <span className="text-xs text-slate-500">{items.filter(i => i.status === 'completed').length} done</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {items.map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`
              relative flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all group
              ${selectedId === item.id 
                ? 'bg-indigo-500/20 border border-indigo-500/50' 
                : 'bg-slate-800/40 border border-transparent hover:bg-slate-800'
              }
            `}
          >
            {/* Thumbnail */}
            <div className="w-12 h-12 rounded bg-slate-900 flex-shrink-0 overflow-hidden relative border border-slate-700">
              <img 
                src={item.status === 'completed' && item.processedBase64 
                  ? `data:${item.processedMimeType};base64,${item.processedBase64}` 
                  : item.original.previewUrl
                } 
                alt="Thumbnail" 
                className="w-full h-full object-cover"
              />
              {/* Status Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                {item.status === 'processing' && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
                {item.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-400" />}
                {item.status === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                {item.status === 'queued' && <Clock className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${selectedId === item.id ? 'text-indigo-200' : 'text-slate-200'}`}>
                {item.original.file.name}
              </p>
              <p className="text-xs text-slate-500 capitalize">{item.status}</p>
            </div>

            {/* Remove Button (Hover) */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              className="p-1 rounded-md hover:bg-red-500/20 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove from queue"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};