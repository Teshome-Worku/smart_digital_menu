'use client';

import React, { useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/toast';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  className?: string;
}

export function ImageUpload({ currentImageUrl, onUploadSuccess, className = '' }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { memberships } = useAuth();
  const currentRestaurant = memberships[0];
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        await handleUpload(e.dataTransfer.files[0]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentRestaurant]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    if (!currentRestaurant) return;
    
    // Client-side validation
    if (!file.type.startsWith('image/')) {
      toast('Please upload a valid image file', 'error');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast('Image must be less than 5MB', 'error');
      return;
    }

    setIsUploading(true);
    
    // Show local preview immediately for better UX
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const response = await api.upload<{ imageUrl: string }>(
        `/restaurants/${currentRestaurant.restaurantId}/upload`,
        file
      );
      
      onUploadSuccess(response.imageUrl);
      setPreview(response.imageUrl);
      toast('Image uploaded successfully', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to upload image', 'error');
      // Revert preview on failure
      setPreview(currentImageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ease-in-out overflow-hidden group cursor-pointer
        ${isDragging ? 'border-primary-500 bg-primary-50/50' : 'border-surface-200 hover:border-primary-300 hover:bg-surface-50'}
        ${className}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={triggerSelect}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {preview ? (
        <div className="relative w-full h-48 sm:h-64 flex items-center justify-center bg-surface-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className={`w-full h-full object-cover transition-opacity duration-300 ${isUploading ? 'opacity-50' : 'opacity-100'}`}
          />
          
          {/* Hover Overlay */}
          {!isUploading && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-medium bg-black/50 px-4 py-2 rounded-full flex items-center gap-2 shadow-xl">
                <span>🔄</span> Replace Image
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 h-48 sm:h-64 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner">
            <span className="text-2xl">📸</span>
          </div>
          <h3 className="font-bold text-surface-900 mb-1">Upload an image</h3>
          <p className="text-sm text-surface-500 mb-4 max-w-xs mx-auto">
            Drag and drop your image here, or click to browse. Max 5MB.
          </p>
        </div>
      )}

      {/* Uploading State Overlay */}
      {isUploading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-3 shadow-lg"></div>
          <span className="text-sm font-bold text-primary-700 bg-white px-3 py-1 rounded-full shadow-sm">Uploading to Cloudinary...</span>
        </div>
      )}
    </div>
  );
}
