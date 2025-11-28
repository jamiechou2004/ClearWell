import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, FileWarning, Layers } from 'lucide-react';
import { ImageFile } from '../types';

interface UploadZoneProps {
  onImagesSelected: (images: ImageFile[]) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onImagesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = (files: FileList | File[]) => {
    setError(null);
    const validImages: ImageFile[] = [];
    const fileArray = Array.from(files);
    
    let processedCount = 0;

    if (fileArray.length === 0) return;

    fileArray.forEach(file => {
      if (!file.type.startsWith('image/')) {
        return; // Skip non-images
      }

      if (file.size > 10 * 1024 * 1024) {
        setError((prev) => (prev ? `${prev} | ${file.name} too large` : `${file.name} too large`));
        processedCount++;
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const [prefix, base64] = result.split(',');
        const mimeType = prefix.match(/:(.*?);/)?.[1] || 'image/png';

        validImages.push({
          file,
          previewUrl: result,
          base64,
          mimeType
        });

        processedCount++;
        // When all files are processed/skipped
        if (processedCount === fileArray.length) {
          if (validImages.length > 0) {
            onImagesSelected(validImages);
          } else if (!error) {
            setError("No valid images found.");
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`
          relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]' 
            : 'border-slate-600 hover:border-indigo-400 hover:bg-slate-800/50 bg-slate-800/20'
          }
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          multiple
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-4">
          <div className={`
            p-4 rounded-full transition-colors duration-300
            ${isDragging ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'}
          `}>
            {error ? <FileWarning className="w-8 h-8 text-red-400" /> : <Layers className="w-8 h-8" />}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">
              {isDragging ? 'Drop them all here!' : 'Upload images'}
            </h3>
            <p className="text-slate-400 max-w-xs mx-auto">
              Drag and drop multiple images here to batch process watermarks.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-sm text-slate-500 mt-4">
            <ImageIcon className="w-4 h-4" />
            <span>Supports PNG, JPG, WEBP up to 10MB</span>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
};
