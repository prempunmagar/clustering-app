'use client';

import React, { useCallback, useState } from 'react';
import Papa from 'papaparse';
import { DataRow } from '@/app/page';

interface FileUploadProps {
  onDataUploaded: (data: DataRow[]) => void;
}

export default function FileUpload({ onDataUploaded }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    console.log('Starting Papa.parse...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      encoding: 'UTF-8',
      complete: (results) => {
        console.log('Papa.parse complete:', results);

        if (results.errors.length > 0) {
          console.error('Papa.parse errors:', results.errors);
          setError(`CSV parsing error: ${results.errors[0].message}`);
          setIsProcessing(false);
          return;
        }

        const data = results.data as DataRow[];
        console.log('Parsed data length:', data.length);
        console.log('Sample row:', data[0]);

        if (data.length === 0) {
          setError('The CSV file appears to be empty');
          setIsProcessing(false);
          return;
        }

        // More relaxed validation - just check we have some data
        const hasData = data.some(row =>
          Object.values(row).some(value =>
            typeof value === 'string' && value.trim().length > 0
          )
        );

        if (!hasData) {
          setError('The CSV file should contain text data');
          setIsProcessing(false);
          return;
        }

        console.log('File processed successfully, calling onDataUploaded');
        setIsProcessing(false);
        onDataUploaded(data);
      },
      error: (error) => {
        console.error('Papa.parse error:', error);
        setError(`File processing error: ${error.message}`);
        setIsProcessing(false);
      }
    });
  }, [onDataUploaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input triggered');
    const files = e.target.files;
    console.log('Files selected:', files?.length || 0);

    if (files && files.length > 0) {
      console.log('Processing first file:', files[0].name);
      processFile(files[0]);
    } else {
      console.log('No files selected');
    }
  }, [processFile]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Your CSV Data
        </h3>
        <p className="text-gray-600 mb-6">
          Upload a CSV file containing identifiers and text descriptions for clustering analysis.
          The file should have at least two columns: one for identifiers and one for text descriptions.
        </p>
      </div>

      {/* File upload area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />

        <div className="space-y-4">
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">Processing your CSV file...</p>
            </>
          ) : (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <p className="text-lg text-gray-900">Drop your CSV file here</p>
                <p className="text-gray-600">or click to browse</p>
              </div>
              <p className="text-sm text-gray-500">
                Supported format: CSV files with headers
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Requirements and examples */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="font-medium text-blue-900 mb-2">Data Requirements:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• CSV format with headers</li>
          <li>• At least one column with unique identifiers</li>
          <li>• At least one column with text descriptions (minimum 10 characters)</li>
          <li>• Minimum 4 rows of data for statistical analysis</li>
        </ul>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="font-medium text-gray-900 mb-2">Example Data Structure:</h4>
        <div className="text-sm text-gray-700 font-mono bg-white p-3 rounded border">
          <div>Identifier,Description</div>
          <div>Site_001,&quot;Archaeological site with pottery fragments...&quot;</div>
          <div>Site_002,&quot;Ancient burial mound with ceremonial objects...&quot;</div>
          <div>Site_003,&quot;Settlement area with cooking hearths...&quot;</div>
        </div>
      </div>
    </div>
  );
}