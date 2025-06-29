import { useState, useCallback } from 'react';
import { QFDData, CustomerRequirement, TechnicalRequirement, Relationship, TechnicalCorrelation, RelationshipStrength, CorrelationType } from '../types/qfd';

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialData: QFDData = {
  customerRequirements: [],
  technicalRequirements: [],
  relationships: [],
  technicalCorrelations: [],
  competitorNames: ['Competitor A', 'Competitor B']
};

export const useQFDData = () => {
  const [data, setData] = useState<QFDData>(initialData);

  const addCustomerRequirement = useCallback(() => {
    const newReq: CustomerRequirement = {
      id: generateId(),
      description: '',
      importance: 3,
      competitorRatings: data.competitorNames.map(() => 3)
    };
    setData(prev => ({
      ...prev,
      customerRequirements: [...prev.customerRequirements, newReq]
    }));
  }, [data.competitorNames]);

  const removeCustomerRequirement = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      customerRequirements: prev.customerRequirements.filter(req => req.id !== id),
      relationships: prev.relationships.filter(rel => rel.customerReqId !== id)
    }));
  }, []);

  const updateCustomerRequirement = useCallback((id: string, updates: Partial<CustomerRequirement>) => {
    setData(prev => ({
      ...prev,
      customerRequirements: prev.customerRequirements.map(req =>
        req.id === id ? { ...req, ...updates } : req
      )
    }));
  }, []);

  const addTechnicalRequirement = useCallback(() => {
    const newReq: TechnicalRequirement = {
      id: generateId(),
      description: '',
      unit: '',
      target: '',
      difficulty: 3,
      importance: 0
    };
    setData(prev => ({
      ...prev,
      technicalRequirements: [...prev.technicalRequirements, newReq]
    }));
  }, []);

  const removeTechnicalRequirement = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      technicalRequirements: prev.technicalRequirements.filter(req => req.id !== id),
      relationships: prev.relationships.filter(rel => rel.technicalReqId !== id),
      technicalCorrelations: prev.technicalCorrelations.filter(
        corr => corr.techReq1Id !== id && corr.techReq2Id !== id
      )
    }));
  }, []);

  const updateTechnicalRequirement = useCallback((id: string, updates: Partial<TechnicalRequirement>) => {
    setData(prev => ({
      ...prev,
      technicalRequirements: prev.technicalRequirements.map(req =>
        req.id === id ? { ...req, ...updates } : req
      )
    }));
  }, []);

  const updateRelationship = useCallback((customerReqId: string, technicalReqId: string, strength: RelationshipStrength) => {
    setData(prev => {
      const existingRelIndex = prev.relationships.findIndex(
        rel => rel.customerReqId === customerReqId && rel.technicalReqId === technicalReqId
      );

      let newRelationships = [...prev.relationships];

      if (strength === RelationshipStrength.NONE) {
        // Remove relationship if strength is NONE
        if (existingRelIndex >= 0) {
          newRelationships.splice(existingRelIndex, 1);
        }
      } else {
        // Add or update relationship
        const newRel: Relationship = { customerReqId, technicalReqId, strength };
        if (existingRelIndex >= 0) {
          newRelationships[existingRelIndex] = newRel;
        } else {
          newRelationships.push(newRel);
        }
      }

      return { ...prev, relationships: newRelationships };
    });
  }, []);

  const updateCorrelation = useCallback((techReq1Id: string, techReq2Id: string, correlation: CorrelationType) => {
    setData(prev => {
      const existingCorrIndex = prev.technicalCorrelations.findIndex(
        corr => (corr.techReq1Id === techReq1Id && corr.techReq2Id === techReq2Id) ||
                (corr.techReq1Id === techReq2Id && corr.techReq2Id === techReq1Id)
      );

      let newCorrelations = [...prev.technicalCorrelations];

      if (correlation === CorrelationType.NONE) {
        // Remove correlation if type is NONE
        if (existingCorrIndex >= 0) {
          newCorrelations.splice(existingCorrIndex, 1);
        }
      } else {
        // Add or update correlation (always store with consistent order)
        const [req1, req2] = [techReq1Id, techReq2Id].sort();
        const newCorr: TechnicalCorrelation = { 
          techReq1Id: req1, 
          techReq2Id: req2, 
          correlation 
        };
        
        if (existingCorrIndex >= 0) {
          newCorrelations[existingCorrIndex] = newCorr;
        } else {
          newCorrelations.push(newCorr);
        }
      }

      return { ...prev, technicalCorrelations: newCorrelations };
    });
  }, []);

  const updateCompetitorNames = useCallback((names: string[]) => {
    setData(prev => {
      // Adjust competitor ratings for all customer requirements
      const updatedCustomerReqs = prev.customerRequirements.map(req => {
        const newRatings = names.map((_, index) => req.competitorRatings[index] || 3);
        return { ...req, competitorRatings: newRatings };
      });

      return {
        ...prev,
        competitorNames: names,
        customerRequirements: updatedCustomerReqs
      };
    });
  }, []);

  const loadSampleData = useCallback(() => {
    const sampleData: QFDData = {
      customerRequirements: [
        {
          id: 'cust1',
          description: 'Easy to use interface',
          importance: 5,
          competitorRatings: [3, 4]
        },
        {
          id: 'cust2',
          description: 'Fast response time',
          importance: 4,
          competitorRatings: [4, 3]
        },
        {
          id: 'cust3',
          description: 'Reliable operation',
          importance: 5,
          competitorRatings: [3, 5]
        }
      ],
      technicalRequirements: [
        {
          id: 'tech1',
          description: 'Response time',
          unit: 'ms',
          target: '<200',
          difficulty: 3,
          importance: 0
        },
        {
          id: 'tech2',
          description: 'UI complexity score',
          unit: 'points',
          target: '<50',
          difficulty: 2,
          importance: 0
        },
        {
          id: 'tech3',
          description: 'System uptime',
          unit: '%',
          target: '>99.9',
          difficulty: 4,
          importance: 0
        }
      ],
      relationships: [
        { customerReqId: 'cust1', technicalReqId: 'tech2', strength: RelationshipStrength.STRONG },
        { customerReqId: 'cust2', technicalReqId: 'tech1', strength: RelationshipStrength.STRONG },
        { customerReqId: 'cust3', technicalReqId: 'tech3', strength: RelationshipStrength.STRONG },
        { customerReqId: 'cust1', technicalReqId: 'tech1', strength: RelationshipStrength.MEDIUM }
      ],
      technicalCorrelations: [
        { techReq1Id: 'tech1', techReq2Id: 'tech2', correlation: CorrelationType.NEGATIVE },
        { techReq1Id: 'tech1', techReq2Id: 'tech3', correlation: CorrelationType.POSITIVE },
        { techReq1Id: 'tech2', techReq2Id: 'tech3', correlation: CorrelationType.STRONG_POSITIVE }
      ],
      competitorNames: ['Product A', 'Product B']
    };
    
    setData(sampleData);
  }, []);

  return {
    data,
    addCustomerRequirement,
    removeCustomerRequirement,
    updateCustomerRequirement,
    addTechnicalRequirement,
    removeTechnicalRequirement,
    updateTechnicalRequirement,
    updateRelationship,
    updateCorrelation,
    updateCompetitorNames,
    loadSampleData
  };
};