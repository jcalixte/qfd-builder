import React from 'react';
import { BarChart3, TrendingUp, Award, AlertTriangle, CheckCircle, XCircle, ArrowUpDown, Target, Zap, Shield, Settings } from 'lucide-react';
import { QFDData } from '../types/qfd';
import { calculateCorrelationImpact, normalizeWeights, getCorrelationSymbol, getCorrelationColor, calculateTargetImpact } from '../utils/qfdCalculations';

interface PriorityAnalysisProps {
  data: QFDData;
}

export const PriorityAnalysis: React.FC<PriorityAnalysisProps> = ({ data }) => {
  const { priorities, correlationInsights } = calculateCorrelationImpact(data);
  const normalizedPriorities = normalizeWeights(priorities);
  const sortedPriorities = [...normalizedPriorities].sort((a, b) => b.score - a.score);
  const targetImpacts = calculateTargetImpact(data);

  const maxScore = Math.max(...priorities.map(p => p.score), 1);

  if (data.customerRequirements.length === 0 || data.technicalRequirements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Priority Analysis</h2>
        </div>
        <div className="text-center py-12 text-gray-500">
          <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg mb-2">Priority analysis will appear here</p>
          <p className="text-sm">Complete the relationship matrix to see technical requirement priorities.</p>
        </div>
      </div>
    );
  }

  const getCorrelationIcon = (correlation: any) => {
    if (correlation >= 1) return <CheckCircle size={16} className="text-green-600" />;
    if (correlation <= -1) return <XCircle size={16} className="text-red-600" />;
    return <ArrowUpDown size={16} className="text-gray-400" />;
  };

  const getInsightPriority = (insight: any) => {
    const totalScore = insight.priority1Score + insight.priority2Score;
    const absCorrelation = Math.abs(insight.correlation);
    
    if (totalScore > 50 && absCorrelation >= 2) return 'critical';
    if (totalScore > 30 && absCorrelation >= 1) return 'high';
    if (totalScore > 15 || absCorrelation >= 1) return 'medium';
    return 'low';
  };

  const getChallengeColor = (challenge: string) => {
    switch (challenge) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'Critical': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'High': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Medium': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCorrelationImpactIcon = (impact: string) => {
    switch (impact) {
      case 'Synergistic': return <Zap size={16} className="text-green-600" />;
      case 'Conflicted': return <AlertTriangle size={16} className="text-red-600" />;
      case 'Complex': return <Settings size={16} className="text-orange-600" />;
      default: return <Shield size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Target Impact Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <Target size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Target Impact Analysis</h2>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          This analysis shows how your technical targets align with customer priorities, implementation challenges, 
          and correlation impacts to guide strategic decision-making.
        </p>

        <div className="space-y-4">
          {targetImpacts
            .sort((a, b) => b.priorityScore - a.priorityScore)
            .map((target, index) => (
            <div key={target.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {target.description}
                    </h3>
                    <div className="flex items-center gap-2">
                      {getCorrelationImpactIcon(target.correlationImpact.impact)}
                      <span className="text-sm text-gray-600">
                        {target.correlationImpact.impact}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Target size={14} />
                      <span><strong>Target:</strong> {target.target} {target.unit}</span>
                    </div>
                    <div>
                      <strong>Priority Score:</strong> {target.priorityScore}
                    </div>
                    <div>
                      <strong>Difficulty:</strong> {target.difficulty}/5
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getChallengeColor(target.implementationChallenge)}`}>
                      {target.implementationChallenge} Challenge
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getImportanceColor(target.strategicImportance)}`}>
                      {target.strategicImportance} Strategic Importance
                    </div>
                  </div>

                  {/* Priority Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        target.normalizedPriority > 70 ? 'bg-green-500' :
                        target.normalizedPriority > 40 ? 'bg-blue-500' :
                        target.normalizedPriority > 20 ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`}
                      style={{ width: `${target.normalizedPriority}%` }}
                    ></div>
                  </div>

                  {/* Correlation Summary */}
                  {target.correlationImpact.totalCorrelations > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Correlation Impact</h4>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>{target.correlationImpact.positiveCount} Positive</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span>{target.correlationImpact.negativeCount} Negative</span>
                        </div>
                        <div>
                          <strong>Net Impact:</strong> {target.correlationImpact.netImpact > 0 ? '+' : ''}{target.correlationImpact.netImpact}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Strategic Recommendation</h4>
                    <p className="text-sm text-blue-800">{target.recommendation}</p>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {target.normalizedPriority.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">
                    Priority Weight
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Priorities */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Technical Priority Ranking</h2>
        </div>

        <div className="space-y-4">
          {sortedPriorities.map((priority, index) => (
            <div key={priority.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {index < 3 && (
                    <Award 
                      size={16} 
                      className={
                        index === 0 ? 'text-yellow-500' :
                        index === 1 ? 'text-gray-400' :
                        'text-orange-600'
                      }
                    />
                  )}
                  <span className="font-medium text-gray-900">
                    {priority.description}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {priority.relativeWeight.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">
                    Score: {priority.score}
                  </div>
                </div>
              </div>

              {/* Priority Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    index === 0 ? 'bg-green-500' :
                    index < 3 ? 'bg-blue-500' :
                    index < 6 ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`}
                  style={{ width: `${(priority.score / maxScore) * 100}%` }}
                ></div>
              </div>

              <div className="text-xs text-gray-600">
                Rank #{index + 1}
                {index === 0 && ' - Highest Priority'}
                {index < 3 && index > 0 && ' - High Priority'}
                {index >= 3 && index < 6 && ' - Medium Priority'}
                {index >= 6 && ' - Lower Priority'}
              </div>
            </div>
          ))}
        </div>

        {priorities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No priorities calculated yet.</p>
            <p className="text-sm mt-1">Add relationships in the matrix to see priority analysis.</p>
          </div>
        )}
      </div>

      {/* Correlation Impact Analysis */}
      {correlationInsights.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <ArrowUpDown size={20} />
            <h2 className="text-xl font-semibold text-gray-900">Correlation Impact Analysis</h2>
          </div>
          
          <p className="text-sm text-gray-600 mb-6">
            This analysis shows how technical requirements interact with each other and provides strategic recommendations 
            based on both priority scores and correlation types.
          </p>

          <div className="space-y-4">
            {correlationInsights
              .sort((a, b) => {
                const priorityA = getInsightPriority(a);
                const priorityB = getInsightPriority(b);
                const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                return (priorityOrder[priorityB as keyof typeof priorityOrder] || 0) - (priorityOrder[priorityA as keyof typeof priorityOrder] || 0);
              })
              .map((insight, index) => {
                const insightPriority = getInsightPriority(insight);
                const symbol = getCorrelationSymbol(insight.correlation);
                const colorClass = getCorrelationColor(insight.correlation);
                
                return (
                  <div 
                    key={index} 
                    className={`border rounded-lg p-4 ${
                      insightPriority === 'critical' ? 'border-red-300 bg-red-50' :
                      insightPriority === 'high' ? 'border-orange-300 bg-orange-50' :
                      insightPriority === 'medium' ? 'border-yellow-300 bg-yellow-50' :
                      'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {insightPriority === 'critical' && <AlertTriangle size={20} className="text-red-600" />}
                        {insightPriority === 'high' && <AlertTriangle size={20} className="text-orange-600" />}
                        {getCorrelationIcon(insight.correlation)}
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {insight.req1} ↔ {insight.req2}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${colorClass}`}>
                              {symbol}
                            </div>
                            <span className="text-sm text-gray-600">
                              Scores: {insight.priority1Score} & {insight.priority2Score}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        insightPriority === 'critical' ? 'bg-red-200 text-red-800' :
                        insightPriority === 'high' ? 'bg-orange-200 text-orange-800' :
                        insightPriority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {insightPriority.toUpperCase()}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-gray-700">
                        <strong>Impact:</strong> {insight.impact}
                      </div>
                      <div className="text-sm text-gray-700">
                        <strong>Recommendation:</strong> {insight.recommendation}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Analysis Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Understanding Target Impact Analysis</h3>
        <div className="space-y-4 text-sm text-gray-700">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What Target Impact Shows</h4>
            <p className="text-blue-800">
              Target Impact Analysis combines customer-driven priorities with technical implementation realities. 
              It shows not just what's important, but how achievable your targets are and what strategic approach to take.
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Strategic Importance vs Implementation Challenge</h4>
            <p className="text-green-800">
              <strong>High Strategic Importance + Low Challenge:</strong> Quick wins - prioritize these first.
            </p>
            <p className="text-green-800 mt-1">
              <strong>High Strategic Importance + High Challenge:</strong> Critical projects requiring dedicated resources and risk management.
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Correlation Impact Types</h4>
            <ul className="list-disc list-inside mt-2 text-purple-700 space-y-1">
              <li><strong>Synergistic:</strong> Requirements that help each other - bundle for efficiency</li>
              <li><strong>Conflicted:</strong> Requirements with trade-offs - need careful balance</li>
              <li><strong>Complex:</strong> Mixed positive and negative correlations - requires nuanced approach</li>
              <li><strong>Isolated:</strong> Independent requirements - can be tackled separately</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Using This Analysis</h4>
            <p className="text-yellow-800">
              Use the Target Impact Analysis to create your implementation roadmap. Focus on high-priority, 
              low-challenge targets first, then tackle critical high-challenge items with proper resource allocation. 
              Consider correlation impacts when sequencing your work to maximize synergies and minimize conflicts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};