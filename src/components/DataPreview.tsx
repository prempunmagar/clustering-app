'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DataRow } from '@/app/page';

interface DataPreviewProps {
  data: DataRow[];
  selectedColumns: {
    identifier: string;
    description: string;
  };
  onColumnsSelected: (columns: { identifier: string; description: string }) => void;
}

export default function DataPreview({ data, selectedColumns, onColumnsSelected }: DataPreviewProps) {
  const [localSelection, setLocalSelection] = useState(selectedColumns);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo(() => data.length > 0 ? Object.keys(data[0]) : [], [data]);

  useEffect(() => {
    // Auto-detect likely identifier and description columns
    if (columns.length > 0 && !selectedColumns.identifier && !selectedColumns.description) {
      const identifierColumn = columns.find(col =>
        /^(id|identifier|name|key|index|site|sample)/i.test(col)
      ) || columns[0];

      const descriptionColumn = columns.find(col =>
        /^(desc|description|text|content|details|summary)/i.test(col)
      ) || columns.find(col => col !== identifierColumn) || columns[1];

      setLocalSelection({
        identifier: identifierColumn,
        description: descriptionColumn || identifierColumn
      });
    }
  }, [columns, selectedColumns.identifier, selectedColumns.description]);

  const validateSelection = () => {
    if (!localSelection.identifier || !localSelection.description) {
      setError('Please select both identifier and description columns');
      return false;
    }

    if (localSelection.identifier === localSelection.description) {
      setError('Identifier and description columns must be different');
      return false;
    }

    // Check if description column has meaningful text
    const sampleDescriptions = data.slice(0, 10).map(row => row[localSelection.description]);
    const hasMeaningfulText = sampleDescriptions.some(desc =>
      typeof desc === 'string' && desc.trim().length > 10
    );

    if (!hasMeaningfulText) {
      setError('Description column should contain meaningful text (at least 10 characters)');
      return false;
    }

    setError(null);
    return true;
  };

  const handleContinue = () => {
    if (validateSelection()) {
      onColumnsSelected(localSelection);
    }
  };

  const getColumnPreview = (columnName: string) => {
    const values = data.slice(0, 5).map(row => row[columnName]);
    return values.map(value => {
      if (typeof value === 'string' && value.length > 100) {
        return value.substring(0, 100) + '...';
      }
      return value || '';
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Select Data Columns
        </h3>
        <p className="text-gray-600">
          Choose which columns contain identifiers and text descriptions for analysis.
        </p>
      </div>

      {/* Data summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="font-medium text-blue-900 mb-2">Data Summary:</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Total rows: {data.length}</p>
          <p>• Available columns: {columns.length}</p>
          <p>• Column names: {columns.join(', ')}</p>
        </div>
      </div>

      {/* Column selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identifier column */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Identifier Column
          </label>
          <select
            value={localSelection.identifier}
            onChange={(e) => setLocalSelection({ ...localSelection, identifier: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select identifier column...</option>
            {columns.map(column => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>

          {localSelection.identifier && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
              <div className="space-y-1">
                {getColumnPreview(localSelection.identifier).map((value, index) => (
                  <div key={index} className="text-xs text-gray-600 font-mono">
                    {value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description column */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Description Column
          </label>
          <select
            value={localSelection.description}
            onChange={(e) => setLocalSelection({ ...localSelection, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select description column...</option>
            {columns.map(column => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>

          {localSelection.description && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
              <div className="space-y-1">
                {getColumnPreview(localSelection.description).map((value, index) => (
                  <div key={index} className="text-xs text-gray-600">
                    {value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sample data table */}
      {localSelection.identifier && localSelection.description && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Sample Data Preview</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {localSelection.identifier}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {localSelection.description}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900 font-mono">
                      {row[localSelection.identifier]}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 max-w-md">
                      <div className="truncate">
                        {row[localSelection.description]}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            Showing first 5 rows of {data.length} total rows
          </p>
        </div>
      )}

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

      {/* Continue button */}
      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!localSelection.identifier || !localSelection.description}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Labeling
        </button>
      </div>
    </div>
  );
}