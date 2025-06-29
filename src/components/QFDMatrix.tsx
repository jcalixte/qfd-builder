import React from 'react';
import { Grid3X3 } from 'lucide-react';
import { QFDData, RelationshipStrength, CorrelationType } from '../types/qfd';
import { 
  getRelationshipSymbol, 
  getRelationshipColor,
  getCorrelationSymbol,
  getCorrelationColor,
  getCorrelationTitle
} from '../utils/qfdCalculations';

interface QFDMatrixProps {
  data: QFDData;
  onUpdateRelationship: (customerReqId: string, technicalReqId: string, strength: RelationshipStrength) => void;
  onUpdateCorrelation: (techReq1Id: string, techReq2Id: string, correlation: CorrelationType) => void;
}

export const QFDMatrix: React.FC<QFDMatrixProps> = ({ 
  data, 
  onUpdateRelationship, 
  onUpdateCorrelation 
}) => {
  const getRelationshipStrength = (customerReqId: string, technicalReqId: string): RelationshipStrength => {
    const relationship = data.relationships.find(
      r => r.customerReqId === customerReqId && r.technicalReqId === technicalReqId
    );
    return relationship ? relationship.strength : RelationshipStrength.NONE;
  };

  const getCorrelation = (techReq1Id: string, techReq2Id: string): CorrelationType => {
    const correlation = data.technicalCorrelations.find(
      c => (c.techReq1Id === techReq1Id && c.techReq2Id === techReq2Id) ||
           (c.techReq1Id === techReq2Id && c.techReq2Id === techReq1Id)
    );
    return correlation ? correlation.correlation : CorrelationType.NONE;
  };

  const cycleRelationship = (customerReqId: string, technicalReqId: string) => {
    const currentStrength = getRelationshipStrength(customerReqId, technicalReqId);
    const strengthValues = [
      RelationshipStrength.NONE,
      RelationshipStrength.WEAK,
      RelationshipStrength.MEDIUM,
      RelationshipStrength.STRONG
    ];
    const currentIndex = strengthValues.indexOf(currentStrength);
    const nextStrength = strengthValues[(currentIndex + 1) % strengthValues.length];
    onUpdateRelationship(customerReqId, technicalReqId, nextStrength);
  };

  const cycleCorrelation = (techReq1Id: string, techReq2Id: string) => {
    const currentCorrelation = getCorrelation(techReq1Id, techReq2Id);
    const correlationValues = [
      CorrelationType.NONE,
      CorrelationType.POSITIVE,
      CorrelationType.STRONG_POSITIVE,
      CorrelationType.NEGATIVE,
      CorrelationType.STRONG_NEGATIVE
    ];
    const currentIndex = correlationValues.indexOf(currentCorrelation);
    const nextCorrelation = correlationValues[(currentIndex + 1) % correlationValues.length];
    onUpdateCorrelation(techReq1Id, techReq2Id, nextCorrelation);
  };

  if (data.customerRequirements.length === 0 || data.technicalRequirements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <Grid3X3 size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Relationship Matrix</h2>
        </div>
        <div className="text-center py-12 text-gray-500">
          <Grid3X3 size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg mb-2">Matrix will appear here</p>
          <p className="text-sm">Add both customer and technical requirements to build the relationship matrix.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Grid3X3 size={20} />
          <h2 className="text-xl font-semibold text-gray-900">House of Quality Matrix</h2>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center text-white text-xs">●●</div>
              <span>Strong (9)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded flex items-center justify-center text-white text-xs">●</div>
              <span>Medium (3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center text-white text-xs">▲</div>
              <span>Weak (1)</span>
            </div>
          </div>
          <div className="border-l pl-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded flex items-center justify-center text-white text-xs">++</div>
              <span>Strong +</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded flex items-center justify-center text-white text-xs">+</div>
              <span>Positive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-400 rounded flex items-center justify-center text-white text-xs">-</div>
              <span>Negative</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded flex items-center justify-center text-white text-xs">--</div>
              <span>Strong -</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Technical Correlation Matrix (Roof) */}
          <div className="mb-8 border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs">🏠</span>
              </div>
              Technical Requirements Correlation Matrix (Roof)
            </h3>
            <p className="text-sm text-blue-800 mb-4">
              This shows how technical requirements affect each other. Click each cell to set the correlation between two requirements.
            </p>
            
            {/* Correlation Matrix Table */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 border-b">Technical Requirement</th>
                    {data.technicalRequirements.map((techReq, index) => (
                      <th key={techReq.id} className="text-center py-2 px-2 text-xs font-medium text-gray-700 border-b">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.technicalRequirements.map((techReq1, i) => (
                    <tr key={techReq1.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3 text-sm font-medium text-gray-700 border-r">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </div>
                          <span className="truncate max-w-48" title={techReq1.description}>
                            {techReq1.description}
                          </span>
                        </div>
                      </td>
                      {data.technicalRequirements.map((techReq2, j) => {
                        if (i === j) {
                          // Diagonal - same requirement
                          return (
                            <td key={techReq2.id} className="py-2 px-2 text-center">
                              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-xs">—</span>
                              </div>
                            </td>
                          );
                        } else if (i > j) {
                          // Lower triangle - show correlation
                          const correlation = getCorrelation(techReq1.id, techReq2.id);
                          const symbol = getCorrelationSymbol(correlation);
                          const colorClass = getCorrelationColor(correlation);
                          const title = getCorrelationTitle(correlation);

                          return (
                            <td key={techReq2.id} className="py-2 px-2 text-center">
                              <button
                                onClick={() => cycleCorrelation(techReq1.id, techReq2.id)}
                                className={`w-8 h-8 rounded border-2 border-gray-200 flex items-center justify-center text-xs font-bold transition-all hover:border-gray-300 hover:shadow-sm ${colorClass}`}
                                title={`${techReq1.description} ↔ ${techReq2.description}: ${title}\nClick to change correlation`}
                              >
                                {symbol}
                              </button>
                            </td>
                          );
                        } else {
                          // Upper triangle - empty (mirror of lower triangle)
                          return (
                            <td key={techReq2.id} className="py-2 px-2 text-center">
                              <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center">
                                <span className="text-gray-300 text-xs">·</span>
                              </div>
                            </td>
                          );
                        }
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Correlation Legend */}
            <div className="mt-4 p-3 bg-white rounded-lg border">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Correlation Types:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-600 rounded flex items-center justify-center text-white">++</div>
                  <span>Strong Positive: Improving one strongly helps the other</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-400 rounded flex items-center justify-center text-white">+</div>
                  <span>Positive: Improving one helps the other</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-400 rounded flex items-center justify-center text-white">-</div>
                  <span>Negative: Trade-off exists between requirements</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded flex items-center justify-center text-white">--</div>
                  <span>Strong Negative: Strong trade-off between requirements</span>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Requirements Header */}
          <div className="flex mb-4">
            <div className="w-80 flex-shrink-0"></div>
            {data.technicalRequirements.map((techReq, index) => (
              <div
                key={techReq.id}
                className="w-24 flex-shrink-0 px-2"
              >
                <div className="transform -rotate-45 origin-bottom-left h-20 flex items-end">
                  <div className="text-xs font-medium text-gray-700 whitespace-nowrap flex items-center gap-1">
                    <span className="bg-gray-100 rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    {techReq.description}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Matrix Rows */}
          {data.customerRequirements.map((custReq) => (
            <div key={custReq.id} className="flex items-center mb-2">
              {/* Customer Requirement Label */}
              <div className="w-80 flex-shrink-0 pr-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {custReq.description}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Importance: {custReq.importance}</span>
                  </div>
                </div>
              </div>

              {/* Relationship Cells */}
              {data.technicalRequirements.map((techReq) => {
                const strength = getRelationshipStrength(custReq.id, techReq.id);
                const symbol = getRelationshipSymbol(strength);
                const colorClass = getRelationshipColor(strength);

                return (
                  <div key={techReq.id} className="w-24 flex-shrink-0 px-2">
                    <button
                      onClick={() => cycleRelationship(custReq.id, techReq.id)}
                      className={`w-full h-12 rounded-lg border-2 border-gray-200 flex items-center justify-center text-sm font-bold transition-all hover:border-gray-300 hover:shadow-md ${colorClass}`}
                      title={`Click to change relationship strength (Current: ${strength})`}
                    >
                      {symbol}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Relationship Matrix:</strong> Click on any cell to cycle through relationship strengths. 
            Strong relationships (●●) have 9x weight, Medium (●) have 3x weight, and Weak (▲) have 1x weight in priority calculations.
          </p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Technical Correlations:</strong> The correlation matrix above shows how technical requirements affect each other. 
            Each numbered requirement can be correlated with others. Use this to identify synergies and trade-offs in your technical approach.
          </p>
        </div>
      </div>
    </div>
  );
};