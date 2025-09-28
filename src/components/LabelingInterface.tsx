'use client';

import React, { useState, useEffect } from 'react';
import { DataRow } from '@/app/page';

interface LabelingInterfaceProps {
  data: DataRow[];
  selectedColumns: {
    identifier: string;
    description: string;
  };
  labels: { [key: string]: string };
  onLabelsComplete: (labels: { [key: string]: string }) => void;
}

export default function LabelingInterface({
  data,
  selectedColumns,
  labels,
  onLabelsComplete
}: LabelingInterfaceProps) {
  const [currentLabels, setCurrentLabels] = useState(labels);
  const [selectedSamples, setSelectedSamples] = useState<DataRow[]>([]);
  const [availableGroups, setAvailableGroups] = useState<string[]>(['Group A', 'Group B']);
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);

  useEffect(() => {
    // Select random samples for labeling (6-10 items)
    const numSamples = Math.min(Math.max(8, Math.floor(data.length * 0.1)), 10);
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    setSelectedSamples(shuffled.slice(0, numSamples));
  }, [data]);

  const addNewGroup = () => {
    if (newGroupName.trim() && !availableGroups.includes(newGroupName.trim())) {
      setAvailableGroups([...availableGroups, newGroupName.trim()]);
      setNewGroupName('');
      setShowNewGroup(false);
    }
  };

  const assignLabel = (identifier: string, group: string) => {
    setCurrentLabels({ ...currentLabels, [identifier]: group });
  };

  const getGroupStats = () => {
    const stats: { [key: string]: number } = {};
    availableGroups.forEach(group => {
      stats[group] = Object.values(currentLabels).filter(label => label === group).length;
    });
    return stats;
  };

  const canContinue = () => {
    const stats = getGroupStats();
    const labeledGroups = Object.keys(stats).filter(group => stats[group] > 0);
    return labeledGroups.length >= 2 && labeledGroups.every(group => stats[group] >= 1);
  };

  const handleContinue = () => {
    if (canContinue()) {
      onLabelsComplete(currentLabels);
    }
  };

  const groupStats = getGroupStats();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Minimal Labeling
        </h3>
        <p className="text-gray-600">
          Label just 1-2 examples per group. This creates reference data for statistical dimension selection.
        </p>
      </div>

      {/* Instructions and requirements */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="font-medium text-blue-900 mb-2">Requirements:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Label at least 1 example from each of 2 groups</li>
          <li>• You can create up to 6 different groups</li>
          <li>• Labels represent meaningful domain distinctions</li>
          <li>• More examples per group improve statistical power</li>
        </ul>
      </div>

      {/* Group management */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Available Groups</h4>
          <button
            onClick={() => setShowNewGroup(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Group
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableGroups.map(group => (
            <div
              key={group}
              className="px-3 py-1 bg-gray-100 border border-gray-300 rounded-full text-sm"
            >
              {group} ({groupStats[group] || 0})
            </div>
          ))}
        </div>

        {showNewGroup && (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="px-3 py-1 border border-gray-300 rounded text-sm"
              onKeyPress={(e) => e.key === 'Enter' && addNewGroup()}
            />
            <button
              onClick={addNewGroup}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowNewGroup(false);
                setNewGroupName('');
              }}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Labeling interface */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">
          Label Sample Items ({Object.keys(currentLabels).length} of {selectedSamples.length} labeled)
        </h4>

        {selectedSamples.map((sample, index) => {
          const identifier = sample[selectedColumns.identifier];
          const description = sample[selectedColumns.description];
          const currentLabel = currentLabels[identifier];

          return (
            <div
              key={identifier}
              className={`border rounded-lg p-4 ${
                currentLabel ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-white'
              }`}
            >
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">ID: </span>
                  <span className="text-sm font-mono text-gray-900">{identifier}</span>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-700">Description: </span>
                  <p className="text-sm text-gray-800 mt-1 leading-relaxed">
                    {description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700 py-1">
                    Assign to:
                  </span>
                  {availableGroups.map(group => (
                    <button
                      key={group}
                      onClick={() => assignLabel(identifier, group)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        currentLabel === group
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                  {currentLabel && (
                    <button
                      onClick={() => {
                        const newLabels = { ...currentLabels };
                        delete newLabels[identifier];
                        setCurrentLabels(newLabels);
                      }}
                      className="px-3 py-1 text-red-600 hover:text-red-800 text-sm"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress and validation */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="font-medium text-gray-900 mb-2">Labeling Progress:</h4>
        <div className="space-y-2">
          {availableGroups.map(group => {
            const count = groupStats[group] || 0;
            return (
              <div key={group} className="flex justify-between text-sm">
                <span>{group}:</span>
                <span className={count >= 1 ? 'text-green-600 font-medium' : 'text-gray-500'}>
                  {count} labeled {count >= 1 ? '✓' : '(need ≥1)'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Continue button */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {canContinue()
            ? 'Ready to proceed with statistical analysis'
            : 'Label at least 1 example from each of 2 groups to continue'
          }
        </div>
        <button
          onClick={handleContinue}
          disabled={!canContinue()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Configuration
        </button>
      </div>
    </div>
  );
}