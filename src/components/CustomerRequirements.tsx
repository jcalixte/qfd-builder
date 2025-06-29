import React from 'react';
import { Plus, X, Star } from 'lucide-react';
import { CustomerRequirement } from '../types/qfd';

interface CustomerRequirementsProps {
  requirements: CustomerRequirement[];
  competitorNames: string[];
  onAddRequirement: () => void;
  onRemoveRequirement: (id: string) => void;
  onUpdateRequirement: (id: string, updates: Partial<CustomerRequirement>) => void;
  onUpdateCompetitorNames: (names: string[]) => void;
}

export const CustomerRequirements: React.FC<CustomerRequirementsProps> = ({
  requirements,
  competitorNames,
  onAddRequirement,
  onRemoveRequirement,
  onUpdateRequirement,
  onUpdateCompetitorNames
}) => {
  const updateCompetitorName = (index: number, name: string) => {
    const newNames = [...competitorNames];
    newNames[index] = name;
    onUpdateCompetitorNames(newNames);
  };

  const addCompetitor = () => {
    onUpdateCompetitorNames([...competitorNames, `Competitor ${competitorNames.length + 1}`]);
  };

  const removeCompetitor = (index: number) => {
    const newNames = competitorNames.filter((_, i) => i !== index);
    onUpdateCompetitorNames(newNames);
    
    // Update all requirements to remove the competitor rating
    requirements.forEach(req => {
      const newRatings = req.competitorRatings.filter((_, i) => i !== index);
      onUpdateRequirement(req.id, { competitorRatings: newRatings });
    });
  };

  const updateCompetitorRating = (reqId: string, competitorIndex: number, rating: number) => {
    const requirement = requirements.find(r => r.id === reqId);
    if (requirement) {
      const newRatings = [...requirement.competitorRatings];
      newRatings[competitorIndex] = rating;
      onUpdateRequirement(reqId, { competitorRatings: newRatings });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Customer Requirements</h2>
        <button
          onClick={onAddRequirement}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Requirement
        </button>
      </div>

      {/* Competitor Names */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Competitors</h3>
          <button
            onClick={addCompetitor}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Add Competitor
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {competitorNames.map((name, index) => (
            <div key={index} className="flex items-center gap-1 bg-gray-100 rounded-lg p-2">
              <input
                type="text"
                value={name}
                onChange={(e) => updateCompetitorName(index, e.target.value)}
                className="bg-transparent border-none text-sm font-medium w-24 focus:outline-none"
              />
              <button
                onClick={() => removeCompetitor(index)}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 pr-4 font-medium text-gray-900">Requirement</th>
              <th className="text-center py-3 px-2 font-medium text-gray-900">
                <div className="flex items-center justify-center gap-1">
                  <Star size={16} />
                  Importance
                </div>
              </th>
              {competitorNames.map((name, index) => (
                <th key={index} className="text-center py-3 px-2 font-medium text-gray-900 text-sm">
                  {name}
                </th>
              ))}
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((req) => (
              <tr key={req.id} className="border-b hover:bg-gray-50">
                <td className="py-3 pr-4">
                  <input
                    type="text"
                    value={req.description}
                    onChange={(e) => onUpdateRequirement(req.id, { description: e.target.value })}
                    className="w-full bg-transparent border-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white rounded px-2 py-1"
                    placeholder="Enter customer requirement..."
                  />
                </td>
                <td className="py-3 px-2 text-center">
                  <select
                    value={req.importance}
                    onChange={(e) => onUpdateRequirement(req.id, { importance: Number(e.target.value) })}
                    className="w-16 text-center border rounded px-1 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </td>
                {competitorNames.map((_, index) => (
                  <td key={index} className="py-3 px-2 text-center">
                    <select
                      value={req.competitorRatings[index] || 1}
                      onChange={(e) => updateCompetitorRating(req.id, index, Number(e.target.value))}
                      className="w-12 text-center border rounded px-1 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 4, 5].map(val => (
                        <option key={val} value={val}>{val}</option>
                      ))}
                    </select>
                  </td>
                ))}
                <td className="py-3 pl-2">
                  <button
                    onClick={() => onRemoveRequirement(req.id)}
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
          <p>No customer requirements added yet.</p>
          <p className="text-sm mt-1">Click "Add Requirement" to get started.</p>
        </div>
      )}
    </div>
  );
};