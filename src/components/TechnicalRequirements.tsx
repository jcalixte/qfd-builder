import React, { useState, useEffect } from 'react';
import { Plus, X, Wrench } from 'lucide-react';
import { TechnicalRequirement } from '../types/qfd';
import { useDebounce } from '../hooks/useDebounce';

interface TechnicalRequirementsProps {
  requirements: TechnicalRequirement[];
  onAddRequirement: () => void;
  onRemoveRequirement: (id: string) => void;
  onUpdateRequirement: (id: string, updates: Partial<TechnicalRequirement>) => void;
}

export const TechnicalRequirements: React.FC<TechnicalRequirementsProps> = ({
  requirements,
  onAddRequirement,
  onRemoveRequirement,
  onUpdateRequirement
}) => {
  const [localRequirements, setLocalRequirements] = useState<Record<string, Partial<TechnicalRequirement>>>({});
  const debouncedRequirements = useDebounce(localRequirements, 1000); // Increased debounce time

  // Apply debounced updates in batches
  useEffect(() => {
    const updates = Object.entries(debouncedRequirements);
    if (updates.length === 0) return;

    // Process updates sequentially with delay to avoid overwhelming Supabase
    const processUpdates = async () => {
      for (const [id, updateData] of updates) {
        if (Object.keys(updateData).length > 0) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between updates
          onUpdateRequirement(id, updateData);
        }
      }
    };

    processUpdates();
    setLocalRequirements({});
  }, [debouncedRequirements, onUpdateRequirement]);

  const updateLocalRequirement = (id: string, updates: Partial<TechnicalRequirement>) => {
    setLocalRequirements(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));
  };

  const getDisplayValue = (req: TechnicalRequirement, field: keyof TechnicalRequirement) => {
    const localUpdate = req.id ? localRequirements[req.id] : undefined;
    if (localUpdate && field in localUpdate) {
      return localUpdate[field];
    }
    return req[field];
  };

  // Handle immediate updates for dropdowns (no debouncing needed)
  const handleImmediateUpdate = (id: string, updates: Partial<TechnicalRequirement>) => {
    onUpdateRequirement(id, updates);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Technical Requirements</h2>
        <button
          onClick={onAddRequirement}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus size={16} />
          Add Requirement
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 pr-4 font-medium text-gray-900">Technical Specification</th>
              <th className="text-center py-3 px-2 font-medium text-gray-900">Unit</th>
              <th className="text-center py-3 px-2 font-medium text-gray-900">Target</th>
              <th className="text-center py-3 px-2 font-medium text-gray-900">
                <div className="flex items-center justify-center gap-1">
                  <Wrench size={16} />
                  Difficulty
                </div>
              </th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((req) => (
              <tr key={req.id} className="border-b hover:bg-gray-50">
                <td className="py-3 pr-4">
                  <input
                    type="text"
                    value={getDisplayValue(req, 'description') as string}
                    onChange={(e) => req.id && updateLocalRequirement(req.id, { description: e.target.value })}
                    className="w-full bg-transparent border-none text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white rounded px-2 py-1"
                    placeholder="Enter technical specification..."
                  />
                </td>
                <td className="py-3 px-2 text-center">
                  <input
                    type="text"
                    value={getDisplayValue(req, 'unit') as string}
                    onChange={(e) => req.id && updateLocalRequirement(req.id, { unit: e.target.value })}
                    className="w-16 text-center border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="unit"
                  />
                </td>
                <td className="py-3 px-2 text-center">
                  <input
                    type="text"
                    value={getDisplayValue(req, 'target') as string}
                    onChange={(e) => req.id && updateLocalRequirement(req.id, { target: e.target.value })}
                    className="w-20 text-center border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="target"
                  />
                </td>
                <td className="py-3 px-2 text-center">
                  <select
                    value={getDisplayValue(req, 'difficulty') as number}
                    onChange={(e) => req.id && handleImmediateUpdate(req.id, { difficulty: Number(e.target.value) })}
                    className="w-16 text-center border rounded px-1 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {[1, 2, 3, 4, 5].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3 pl-2">
                  <button
                    onClick={() => req.id && onRemoveRequirement(req.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {requirements.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No technical requirements added yet.</p>
          <p className="text-sm mt-1">Click "Add Requirement" to get started.</p>
        </div>
      )}
    </div>
  );
};