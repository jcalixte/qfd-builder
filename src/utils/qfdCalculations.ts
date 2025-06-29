import { QFDData, TechnicalPriority, RelationshipStrength, CorrelationType } from '../types/qfd';

export const calculateTechnicalPriorities = (data: QFDData): TechnicalPriority[] => {
  return data.technicalRequirements.map(techReq => {
    const score = data.customerRequirements.reduce((sum, custReq) => {
      const relationship = data.relationships.find(
        r => r.customerReqId === custReq.id && r.technicalReqId === techReq.id
      );
      const relationshipValue = relationship ? relationship.strength : RelationshipStrength.NONE;
      return sum + (custReq.importance * relationshipValue);
    }, 0);

    return {
      id: techReq.id,
      description: techReq.description,
      score,
      relativeWeight: 0 // Will be calculated after all scores are computed
    };
  });
};

export const calculateTargetImpact = (data: QFDData): TargetImpactAnalysis[] => {
  const priorities = calculateTechnicalPriorities(data);
  const maxScore = Math.max(...priorities.map(p => p.score), 1);
  
  return data.technicalRequirements.map(techReq => {
    const priority = priorities.find(p => p.id === techReq.id);
    const priorityScore = priority?.score || 0;
    const normalizedPriority = (priorityScore / maxScore) * 100;
    
    // Calculate implementation challenge
    const implementationChallenge = getImplementationChallenge(techReq.difficulty, normalizedPriority);
    
    // Calculate strategic importance
    const strategicImportance = getStrategicImportance(normalizedPriority, techReq.difficulty);
    
    // Get correlations affecting this requirement
    const correlations = data.technicalCorrelations.filter(
      corr => corr.techReq1Id === techReq.id || corr.techReq2Id === techReq.id
    );
    
    const correlationImpact = getCorrelationImpact(correlations, data.technicalRequirements, priorities);
    
    return {
      id: techReq.id,
      description: techReq.description,
      target: techReq.target,
      unit: techReq.unit,
      difficulty: techReq.difficulty,
      priorityScore: priorityScore,
      normalizedPriority: normalizedPriority,
      implementationChallenge,
      strategicImportance,
      correlationImpact,
      recommendation: getTargetRecommendation(normalizedPriority, techReq.difficulty, correlationImpact)
    };
  });
};

const getImplementationChallenge = (difficulty: number, priority: number): 'Low' | 'Medium' | 'High' | 'Critical' => {
  const challengeScore = (difficulty * 20) + (priority * 0.3);
  
  if (challengeScore > 80) return 'Critical';
  if (challengeScore > 60) return 'High';
  if (challengeScore > 40) return 'Medium';
  return 'Low';
};

const getStrategicImportance = (priority: number, difficulty: number): 'Low' | 'Medium' | 'High' | 'Critical' => {
  // High priority with reasonable difficulty = high strategic importance
  // High priority with high difficulty = critical (needs special attention)
  // Low priority regardless of difficulty = lower importance
  
  if (priority > 70) {
    return difficulty >= 4 ? 'Critical' : 'High';
  } else if (priority > 40) {
    return difficulty >= 4 ? 'High' : 'Medium';
  } else if (priority > 20) {
    return 'Medium';
  }
  return 'Low';
};

const getCorrelationImpact = (correlations: any[], techReqs: any[], priorities: TechnicalPriority[]): CorrelationImpactSummary => {
  let positiveCount = 0;
  let negativeCount = 0;
  let strongPositiveCount = 0;
  let strongNegativeCount = 0;
  
  correlations.forEach(corr => {
    switch (corr.correlation) {
      case CorrelationType.STRONG_POSITIVE:
        strongPositiveCount++;
        break;
      case CorrelationType.POSITIVE:
        positiveCount++;
        break;
      case CorrelationType.NEGATIVE:
        negativeCount++;
        break;
      case CorrelationType.STRONG_NEGATIVE:
        strongNegativeCount++;
        break;
    }
  });
  
  const totalCorrelations = correlations.length;
  const netPositive = (strongPositiveCount * 2 + positiveCount) - (strongNegativeCount * 2 + negativeCount);
  
  let impact: 'Isolated' | 'Synergistic' | 'Conflicted' | 'Complex' = 'Isolated';
  
  if (totalCorrelations === 0) {
    impact = 'Isolated';
  } else if (netPositive > 1) {
    impact = 'Synergistic';
  } else if (netPositive < -1) {
    impact = 'Conflicted';
  } else {
    impact = 'Complex';
  }
  
  return {
    totalCorrelations,
    positiveCount: positiveCount + strongPositiveCount,
    negativeCount: negativeCount + strongNegativeCount,
    netImpact: netPositive,
    impact
  };
};

const getTargetRecommendation = (priority: number, difficulty: number, correlationImpact: CorrelationImpactSummary): string => {
  const isHighPriority = priority > 50;
  const isHighDifficulty = difficulty >= 4;
  const hasPositiveCorrelations = correlationImpact.positiveCount > 0;
  const hasNegativeCorrelations = correlationImpact.negativeCount > 0;
  
  if (isHighPriority && isHighDifficulty && hasNegativeCorrelations) {
    return "CRITICAL: High-priority, difficult target with conflicts. Consider phased approach or alternative solutions.";
  } else if (isHighPriority && hasPositiveCorrelations) {
    return "OPPORTUNITY: High-priority target with synergies. Bundle with correlated requirements for efficiency.";
  } else if (isHighPriority && isHighDifficulty) {
    return "FOCUS: High-priority but challenging target. Allocate experienced resources and consider risk mitigation.";
  } else if (isHighPriority) {
    return "PRIORITY: Important target with manageable complexity. Good candidate for early implementation.";
  } else if (hasPositiveCorrelations) {
    return "SYNERGY: Consider implementing alongside correlated high-priority requirements.";
  } else if (hasNegativeCorrelations) {
    return "CAUTION: Monitor trade-offs with other requirements during implementation.";
  } else {
    return "STANDARD: Can be implemented independently with normal resource allocation.";
  }
};

export const calculateCorrelationImpact = (data: QFDData): { 
  priorities: TechnicalPriority[], 
  correlationInsights: CorrelationInsight[] 
} => {
  const basePriorities = calculateTechnicalPriorities(data);
  
  // Calculate correlation insights
  const correlationInsights: CorrelationInsight[] = [];
  
  data.technicalCorrelations.forEach(corr => {
    const req1 = data.technicalRequirements.find(r => r.id === corr.techReq1Id);
    const req2 = data.technicalRequirements.find(r => r.id === corr.techReq2Id);
    const priority1 = basePriorities.find(p => p.id === corr.techReq1Id);
    const priority2 = basePriorities.find(p => p.id === corr.techReq2Id);
    
    if (req1 && req2 && priority1 && priority2) {
      correlationInsights.push({
        req1: req1.description,
        req2: req2.description,
        correlation: corr.correlation,
        priority1Score: priority1.score,
        priority2Score: priority2.score,
        impact: getCorrelationImpactDescription(corr.correlation, priority1.score, priority2.score),
        recommendation: getCorrelationRecommendation(corr.correlation, priority1.score, priority2.score)
      });
    }
  });

  return { priorities: basePriorities, correlationInsights };
};

export const normalizeWeights = (priorities: TechnicalPriority[]): TechnicalPriority[] => {
  const totalScore = priorities.reduce((sum, p) => sum + p.score, 0);
  
  if (totalScore === 0) return priorities;

  return priorities.map(p => ({
    ...p,
    relativeWeight: (p.score / totalScore) * 100
  }));
};

export const getRelationshipSymbol = (strength: RelationshipStrength): string => {
  switch (strength) {
    case RelationshipStrength.STRONG: return '●●';
    case RelationshipStrength.MEDIUM: return '●';
    case RelationshipStrength.WEAK: return '▲';
    default: return '';
  }
};

export const getRelationshipColor = (strength: RelationshipStrength): string => {
  switch (strength) {
    case RelationshipStrength.STRONG: return 'bg-green-500 text-white';
    case RelationshipStrength.MEDIUM: return 'bg-yellow-500 text-white';
    case RelationshipStrength.WEAK: return 'bg-red-500 text-white';
    default: return 'bg-gray-100 text-gray-400 hover:bg-gray-200';
  }
};

export const getCorrelationSymbol = (correlation: CorrelationType): string => {
  switch (correlation) {
    case CorrelationType.STRONG_POSITIVE: return '++';
    case CorrelationType.POSITIVE: return '+';
    case CorrelationType.NEGATIVE: return '-';
    case CorrelationType.STRONG_NEGATIVE: return '--';
    default: return '';
  }
};

export const getCorrelationColor = (correlation: CorrelationType): string => {
  switch (correlation) {
    case CorrelationType.STRONG_POSITIVE: return 'bg-green-600 text-white';
    case CorrelationType.POSITIVE: return 'bg-green-400 text-white';
    case CorrelationType.NEGATIVE: return 'bg-red-400 text-white';
    case CorrelationType.STRONG_NEGATIVE: return 'bg-red-600 text-white';
    default: return 'bg-gray-100 text-gray-400 hover:bg-gray-200';
  }
};

export const getCorrelationTitle = (correlation: CorrelationType): string => {
  switch (correlation) {
    case CorrelationType.STRONG_POSITIVE: return 'Strong Positive Correlation';
    case CorrelationType.POSITIVE: return 'Positive Correlation';
    case CorrelationType.NEGATIVE: return 'Negative Correlation';
    case CorrelationType.STRONG_NEGATIVE: return 'Strong Negative Correlation';
    default: return 'No Correlation';
  }
};

const getCorrelationImpactDescription = (correlation: CorrelationType, score1: number, score2: number): string => {
  const higherScore = Math.max(score1, score2);
  const lowerScore = Math.min(score1, score2);
  
  switch (correlation) {
    case CorrelationType.STRONG_POSITIVE:
      return `Strong synergy: Working on one requirement significantly helps the other. Combined impact is amplified.`;
    case CorrelationType.POSITIVE:
      return `Positive synergy: Improvements in one requirement help the other. Look for combined solutions.`;
    case CorrelationType.NEGATIVE:
      return `Trade-off exists: Improving one may compromise the other. Balance is needed.`;
    case CorrelationType.STRONG_NEGATIVE:
      return `Strong trade-off: Significant conflict between requirements. Careful optimization required.`;
    default:
      return 'No significant interaction between these requirements.';
  }
};

const getCorrelationRecommendation = (correlation: CorrelationType, score1: number, score2: number): string => {
  const totalScore = score1 + score2;
  
  switch (correlation) {
    case CorrelationType.STRONG_POSITIVE:
      return totalScore > 50 ? 
        'HIGH PRIORITY: Focus on solutions that address both requirements simultaneously for maximum impact.' :
        'Consider bundling these requirements in your development approach.';
    case CorrelationType.POSITIVE:
      return totalScore > 40 ? 
        'Look for integrated solutions that can improve both requirements together.' :
        'Moderate synergy - consider combined approaches when possible.';
    case CorrelationType.NEGATIVE:
      return totalScore > 60 ? 
        'CRITICAL: High-priority requirements in conflict. Develop compromise solutions or phased approach.' :
        'Monitor trade-offs carefully during implementation.';
    case CorrelationType.STRONG_NEGATIVE:
      return totalScore > 50 ? 
        'URGENT: Strong conflict between important requirements. Consider alternative approaches or accept trade-offs.' :
        'Strong conflict exists - may need to prioritize one over the other.';
    default:
      return 'Requirements can be addressed independently.';
  }
};

export interface CorrelationInsight {
  req1: string;
  req2: string;
  correlation: CorrelationType;
  priority1Score: number;
  priority2Score: number;
  impact: string;
  recommendation: string;
}

export interface TargetImpactAnalysis {
  id: string;
  description: string;
  target: string;
  unit: string;
  difficulty: number;
  priorityScore: number;
  normalizedPriority: number;
  implementationChallenge: 'Low' | 'Medium' | 'High' | 'Critical';
  strategicImportance: 'Low' | 'Medium' | 'High' | 'Critical';
  correlationImpact: CorrelationImpactSummary;
  recommendation: string;
}

export interface CorrelationImpactSummary {
  totalCorrelations: number;
  positiveCount: number;
  negativeCount: number;
  netImpact: number;
  impact: 'Isolated' | 'Synergistic' | 'Conflicted' | 'Complex';
}