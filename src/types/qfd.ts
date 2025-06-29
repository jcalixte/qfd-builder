export interface CustomerRequirement {
  id?: string;
  description: string;
  importance: number;
  competitorRatings: number[];
}

export interface TechnicalRequirement {
  id?: string;
  description: string;
  unit: string;
  target: string;
  difficulty: number;
  importance: number;
}

export interface Relationship {
  customerReqId: string;
  technicalReqId: string;
  strength: RelationshipStrength;
}

export interface TechnicalCorrelation {
  techReq1Id: string;
  techReq2Id: string;
  correlation: CorrelationType;
}

export enum RelationshipStrength {
  NONE = 0,
  WEAK = 1,
  MEDIUM = 3,
  STRONG = 9
}

export enum CorrelationType {
  NONE = 0,
  POSITIVE = 1,
  STRONG_POSITIVE = 2,
  NEGATIVE = -1,
  STRONG_NEGATIVE = -2
}

export interface QFDData {
  customerRequirements: CustomerRequirement[];
  technicalRequirements: TechnicalRequirement[];
  relationships: Relationship[];
  technicalCorrelations: TechnicalCorrelation[];
  competitorNames: string[];
}

export interface TechnicalPriority {
  id: string;
  description: string;
  score: number;
  relativeWeight: number;
}

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