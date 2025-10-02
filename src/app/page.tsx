'use client';

import React, { useState, useEffect, useCallback } from 'react';
import FileUpload from '@/components/FileUpload';
import DataPreview from '@/components/DataPreview';
import LabelingInterface from '@/components/LabelingInterface';
import ConfigurationPanel from '@/components/ConfigurationPanel';
import Results from '@/components/Results';

export type ProcessingStep = 'upload' | 'preview' | 'labeling' | 'configuration' | 'processing' | 'results';

export interface DataRow {
  [key: string]: string;
}

export interface ClusteringConfig {
  numDimensions: number;
  numClusters: number;
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('upload');
  const [csvData, setCsvData] = useState<DataRow[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<{
    identifier: string;
    description: string;
  }>({ identifier: '', description: '' });
  const [labels, setLabels] = useState<{ [key: string]: string }>({});
  const [config, setConfig] = useState<ClusteringConfig>({
    numDimensions: 40,
    numClusters: 2
  });
  const [results, setResults] = useState<unknown>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<string>('Starting analysis...');

  // Processing function
  const processData = useCallback(async () => {
    try {
      setProcessingError(null);

      // Step 1: Generate embeddings
      setProcessingProgress('Generating embeddings...');
      const descriptions = csvData.map(row => row[selectedColumns.description]);

      const embeddingsResponse = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptions })
      });

      if (!embeddingsResponse.ok) {
        let errorMessage = 'Failed to generate embeddings';
        try {
          const contentType = embeddingsResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await embeddingsResponse.json();
            errorMessage = error.error || errorMessage;
          } else {
            const textError = await embeddingsResponse.text();
            errorMessage = textError || `Server error: ${embeddingsResponse.status} ${embeddingsResponse.statusText}`;
          }
        } catch {
          errorMessage = `Server error: ${embeddingsResponse.status} ${embeddingsResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const embeddingsData = await embeddingsResponse.json();

      // Step 2: Perform statistical analysis and clustering
      setProcessingProgress('Performing statistical analysis and clustering...');
      const identifiers = csvData.map(row => row[selectedColumns.identifier]);

      const analysisResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeddings: embeddingsData.embeddings,
          labels,
          identifiers,
          config
        })
      });

      if (!analysisResponse.ok) {
        let errorMessage = 'Failed to perform analysis';
        try {
          const contentType = analysisResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await analysisResponse.json();
            errorMessage = error.error || errorMessage;
          } else {
            const textError = await analysisResponse.text();
            errorMessage = textError || `Server error: ${analysisResponse.status} ${analysisResponse.statusText}`;
          }
        } catch {
          errorMessage = `Server error: ${analysisResponse.status} ${analysisResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const analysisResults = await analysisResponse.json();

      setResults(analysisResults);
      setCurrentStep('results');

    } catch (error: unknown) {
      console.error('Processing error:', error);
      setProcessingError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }, [csvData, selectedColumns.description, selectedColumns.identifier, labels, config]);

  // Effect to start processing when entering processing step
  useEffect(() => {
    if (currentStep === 'processing' && !results && !processingError) {
      processData();
    }
  }, [currentStep, processData, processingError, results]);

  const stepTitles = {
    upload: 'Upload CSV Data',
    preview: 'Select Columns',
    labeling: 'Minimal Labeling',
    configuration: 'Configure Parameters',
    processing: 'Processing...',
    results: 'Results'
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <FileUpload
            onDataUploaded={(data) => {
              setCsvData(data);
              setCurrentStep('preview');
            }}
          />
        );
      case 'preview':
        return (
          <DataPreview
            data={csvData}
            selectedColumns={selectedColumns}
            onColumnsSelected={(columns) => {
              setSelectedColumns(columns);
              setCurrentStep('labeling');
            }}
          />
        );
      case 'labeling':
        return (
          <LabelingInterface
            data={csvData}
            selectedColumns={selectedColumns}
            labels={labels}
            onLabelsComplete={(newLabels) => {
              setLabels(newLabels);
              setCurrentStep('configuration');
            }}
          />
        );
      case 'configuration':
        return (
          <ConfigurationPanel
            config={config}
            onConfigChange={setConfig}
            onStartProcessing={() => setCurrentStep('processing')}
          />
        );
      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center p-8">
            {processingError ? (
              <div className="text-center space-y-4">
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
                    <div>
                      <h3 className="text-red-800 font-medium">Processing Failed</h3>
                      <p className="text-red-700 mt-1">{processingError}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setProcessingError(null);
                      setProcessingProgress('Starting analysis...');
                      processData();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setCurrentStep('configuration')}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Back to Configuration
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-lg text-gray-600">
                  {processingProgress}
                </p>
                <p className="text-sm text-gray-500">
                  This may take 30-60 seconds depending on your dataset size
                </p>
              </div>
            )}
          </div>
        );
      case 'results':
        return (
          <Results
            results={results as any} // eslint-disable-line @typescript-eslint/no-explicit-any
            onReset={() => {
              setCsvData([]);
              setSelectedColumns({ identifier: '', description: '' });
              setLabels({});
              setResults(null);
              setCurrentStep('upload');
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Statistical Dimension Selection for Text Classification
          </h1>
          <p className="mt-2 text-gray-600">
            Novel methodology for small-scale heterogeneous text clustering
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {stepTitles[currentStep]}
            </h2>
            <div className="flex space-x-2">
              {Object.keys(stepTitles).map((step, index) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step === currentStep
                      ? 'bg-blue-600'
                      : Object.keys(stepTitles).indexOf(currentStep) > index
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Current step content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderCurrentStep()}
        </div>
      </main>
    </div>
  );
}