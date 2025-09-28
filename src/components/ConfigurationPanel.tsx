'use client';

import React, { useState } from 'react';
import { ClusteringConfig } from '@/app/page';

interface ConfigurationPanelProps {
  config: ClusteringConfig;
  onConfigChange: (config: ClusteringConfig) => void;
  onStartProcessing: () => void;
}

export default function ConfigurationPanel({
  config,
  onConfigChange,
  onStartProcessing
}: ConfigurationPanelProps) {
  const [localConfig, setLocalConfig] = useState(config);

  const handleConfigChange = (field: keyof ClusteringConfig, value: number) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Configure Parameters
        </h3>
        <p className="text-gray-600">
          Adjust the statistical dimension selection and clustering parameters for your analysis.
        </p>
      </div>

      {/* Methodology explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="font-medium text-blue-900 mb-2">How It Works:</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Generate 1536-dimensional embeddings for all text descriptions</li>
          <li>Use t-tests to compare embedding dimensions between labeled groups</li>
          <li>Select the most statistically discriminative dimensions</li>
          <li>Apply K-means clustering using only selected dimensions</li>
          <li>Visualize results with PCA reduction to 2D space</li>
        </ol>
      </div>

      {/* Configuration options */}
      <div className="space-y-6">
        {/* Number of dimensions */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Number of Dimensions to Select
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={localConfig.numDimensions}
              onChange={(e) => handleConfigChange('numDimensions', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>10 (fewer, more focused)</span>
              <span className="font-medium text-gray-700">
                {localConfig.numDimensions} dimensions
              </span>
              <span>100 (more, comprehensive)</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Selects the top N most discriminative dimensions from the 1536-dimensional embedding space.
            Fewer dimensions focus on the strongest differences, while more dimensions capture subtler patterns.
          </p>
        </div>

        {/* Number of clusters */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Number of Clusters
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="2"
              max="6"
              step="1"
              value={localConfig.numClusters}
              onChange={(e) => handleConfigChange('numClusters', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>2 (binary)</span>
              <span className="font-medium text-gray-700">
                {localConfig.numClusters} clusters
              </span>
              <span>6 (complex)</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Number of groups to create during clustering. Start with 2-3 clusters and increase
            if you need more granular groupings.
          </p>
        </div>
      </div>

      {/* Advanced options (collapsed by default) */}
      <div className="border border-gray-200 rounded-md">
        <details className="group">
          <summary className="flex justify-between items-center cursor-pointer p-4 hover:bg-gray-50">
            <span className="font-medium text-gray-700">Advanced Options</span>
            <svg
              className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
            <div className="space-y-4 pt-4">
              <div className="text-sm text-gray-600">
                <h5 className="font-medium text-gray-700 mb-2">Statistical Method Details:</h5>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Embedding Model: OpenAI text-embedding-3-large (1536 dimensions)</li>
                  <li>Statistical Test: Welch&apos;s t-test (unequal variances)</li>
                  <li>Significance Level: α = 0.05</li>
                  <li>Clustering Algorithm: K-means with random initialization</li>
                  <li>Visualization: PCA reduction for 2D scatter plot</li>
                </ul>
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* Processing information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Processing Information:</h4>
        <div className="text-sm text-yellow-800 space-y-1">
          <p>• Embedding generation may take 30-60 seconds depending on dataset size</p>
          <p>• Statistical analysis and clustering are performed server-side</p>
          <p>• Results include confidence metrics and dimension importance rankings</p>
        </div>
      </div>

      {/* Start processing button */}
      <div className="flex justify-center">
        <button
          onClick={onStartProcessing}
          className="px-8 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
        >
          Start Analysis
        </button>
      </div>

      {/* Configuration summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="font-medium text-gray-900 mb-2">Configuration Summary:</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <p>• Selecting top {localConfig.numDimensions} most discriminative dimensions</p>
          <p>• Creating {localConfig.numClusters} clusters using K-means algorithm</p>
          <p>• Using OpenAI text-embedding-3-large for semantic representation</p>
          <p>• Applying Welch&apos;s t-test for dimension selection</p>
        </div>
      </div>
    </div>
  );
}