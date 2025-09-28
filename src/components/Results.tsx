'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface ClusterItem {
  identifier: string;
  label: string | null;
}

interface Cluster {
  id: number;
  items: ClusterItem[];
  size: number;
}

interface VisualizationPoint {
  x: number;
  y: number;
  identifier: string;
  cluster: number;
  label: string | null;
}

interface DimensionStat {
  dimension: number;
  pValue: number;
  significance: string;
}

interface ResultsProps {
  results: {
    clusters: Cluster[];
    visualization: {
      points: VisualizationPoint[];
      explainedVariance: number[];
      totalVarianceExplained: number;
    };
    statistics: {
      selectedDimensions: number[];
      dimensionStats: DimensionStat[];
      numClusters: number;
      numDimensions: number;
      totalSamples: number;
      labeledSamples: number;
    };
    clusterAssignments: number[];
  } | null;
  onReset: () => void;
}

export default function Results({ results, onReset }: ResultsProps) {
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [showStatistics, setShowStatistics] = useState(false);

  if (!results) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No results to display</p>
      </div>
    );
  }

  // Prepare data for Plotly scatter plot
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
  ];

  const plotData = results.clusters.map((cluster: Cluster) => ({
    x: results.visualization.points
      .filter((p: VisualizationPoint) => p.cluster === cluster.id)
      .map((p: VisualizationPoint) => p.x),
    y: results.visualization.points
      .filter((p: VisualizationPoint) => p.cluster === cluster.id)
      .map((p: VisualizationPoint) => p.y),
    text: results.visualization.points
      .filter((p: VisualizationPoint) => p.cluster === cluster.id)
      .map((p: VisualizationPoint) => `${p.identifier}${p.label ? ` (${p.label})` : ''}`),
    mode: 'markers',
    type: 'scatter',
    name: `Cluster ${cluster.id + 1}`,
    marker: {
      color: colors[cluster.id % colors.length],
      size: 8,
      opacity: 0.7
    },
    hovertemplate: '<b>%{text}</b><br>X: %{x:.3f}<br>Y: %{y:.3f}<extra></extra>'
  }));

  const plotLayout = {
    title: {
      text: 'Clustering Results (PCA Visualization)',
      font: { size: 16 }
    },
    xaxis: {
      title: {
        text: `PC1 (${(results.visualization.explainedVariance[0] / results.visualization.explainedVariance.reduce((a: number, b: number) => a + b, 0) * 100).toFixed(1)}% variance)`
      },
      showgrid: true,
      gridcolor: '#E5E7EB'
    },
    yaxis: {
      title: {
        text: `PC2 (${(results.visualization.explainedVariance[1] / results.visualization.explainedVariance.reduce((a: number, b: number) => a + b, 0) * 100).toFixed(1)}% variance)`
      },
      showgrid: true,
      gridcolor: '#E5E7EB'
    },
    plot_bgcolor: '#FAFAFA',
    paper_bgcolor: 'white',
    margin: { l: 60, r: 40, t: 60, b: 60 },
    hovermode: 'closest' as const,
    showlegend: true,
    legend: {
      x: 1.02,
      y: 1,
      bgcolor: 'rgba(255,255,255,0.8)',
      bordercolor: '#E5E7EB',
      borderwidth: 1
    }
  };

  const exportResults = () => {
    const exportData = {
      clusters: results.clusters,
      statistics: results.statistics,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clustering-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ['Identifier', 'Cluster', 'Original_Label'];
    const rows = results.clusters.flatMap((cluster: Cluster) =>
      cluster.items.map((item: ClusterItem) => [
        item.identifier,
        `Cluster ${cluster.id + 1}`,
        item.label || 'Unlabeled'
      ])
    );

    const csvContent = [headers, ...rows]
      .map((row: (string | number)[]) => row.map((cell: string | number) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clustering-results-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Clustering Results
          </h3>
          <p className="text-gray-600">
            Statistical dimension selection and clustering analysis completed
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStatistics(!showStatistics)}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
          >
            {showStatistics ? 'Hide' : 'Show'} Statistics
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Start Over
          </button>
        </div>
      </div>

      {/* Summary statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="text-2xl font-bold text-blue-900">
            {results.statistics.numClusters}
          </div>
          <div className="text-sm text-blue-700">Clusters Created</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-2xl font-bold text-green-900">
            {results.statistics.numDimensions}
          </div>
          <div className="text-sm text-green-700">Dimensions Selected</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
          <div className="text-2xl font-bold text-purple-900">
            {results.statistics.totalSamples}
          </div>
          <div className="text-sm text-purple-700">Total Samples</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
          <div className="text-2xl font-bold text-orange-900">
            {(results.visualization.totalVarianceExplained * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-orange-700">Variance Explained</div>
        </div>
      </div>

      {/* Interactive scatter plot */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <Plot
          data={plotData as any} // eslint-disable-line @typescript-eslint/no-explicit-any
          layout={plotLayout}
          config={{
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            displaylogo: false
          }}
          style={{ width: '100%', height: '500px' }}
        />
      </div>

      {/* Statistical details */}
      {showStatistics && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Statistical Analysis Details</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-800 mb-2">Most Discriminative Dimensions</h5>
              <div className="space-y-2">
                {results.statistics.dimensionStats.slice(0, 10).map((stat: DimensionStat, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>Dimension {stat.dimension}</span>
                    <span className={`font-mono ${stat.significance === 'significant' ? 'text-green-600' : 'text-gray-500'}`}>
                      p = {stat.pValue.toExponential(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-800 mb-2">Analysis Summary</h5>
              <div className="space-y-2 text-sm text-gray-700">
                <div>• Model: OpenAI text-embedding-3-large</div>
                <div>• Statistical test: Welch&apos;s t-test</div>
                <div>• Clustering: K-means algorithm</div>
                <div>• Visualization: PCA reduction to 2D</div>
                <div>• Significant dimensions: {results.statistics.dimensionStats.filter((s: DimensionStat) => s.significance === 'significant').length}/{results.statistics.numDimensions}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cluster details */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Cluster Details</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.clusters.map((cluster: Cluster) => (
            <div
              key={cluster.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedCluster === cluster.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedCluster(
                selectedCluster === cluster.id ? null : cluster.id
              )}
            >
              <div className="flex justify-between items-center mb-2">
                <h5 className="font-medium text-gray-900">
                  Cluster {cluster.id + 1}
                </h5>
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: colors[cluster.id % colors.length] }}
                />
              </div>

              <div className="text-sm text-gray-600 mb-2">
                {cluster.size} items
              </div>

              {selectedCluster === cluster.id && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {cluster.items.map((item: ClusterItem) => (
                      <div key={item.identifier} className="text-xs text-gray-700">
                        <span className="font-mono">{item.identifier}</span>
                        {item.label && (
                          <span className="ml-2 text-blue-600">({item.label})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Export options */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Export Results</h4>
        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export as CSV
          </button>
          <button
            onClick={exportResults}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export as JSON
          </button>
        </div>
      </div>
    </div>
  );
}