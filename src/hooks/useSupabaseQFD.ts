import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { QFDData, CustomerRequirement, TechnicalRequirement, RelationshipStrength, CorrelationType } from '../types/qfd';
import { Database } from '../types/database';

type QFDProject = Database['public']['Tables']['qfd_projects']['Row'];

export const useSupabaseQFD = (projectId?: string) => {
  const [data, setData] = useState<QFDData>({
    customerRequirements: [],
    technicalRequirements: [],
    relationships: [],
    technicalCorrelations: [],
    competitorNames: ['Competitor A', 'Competitor B']
  });
  const [projects, setProjects] = useState<QFDProject[]>([]);
  const [currentProject, setCurrentProject] = useState<QFDProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Request queue to prevent overwhelming Supabase
  const [requestQueue, setRequestQueue] = useState<Array<{ id: string; request: () => Promise<void> }>>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Process request queue with proper throttling
  useEffect(() => {
    if (requestQueue.length === 0 || isProcessingQueue) return;

    const processQueue = async () => {
      setIsProcessingQueue(true);
      
      // Create a copy of the queue and clear the original to prevent race conditions
      const currentQueue = [...requestQueue];
      setRequestQueue([]);
      
      for (const { request } of currentQueue) {
        try {
          await request();
          // Throttle requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (error) {
          console.error('Queued request failed:', error);
        }
      }
      
      setIsProcessingQueue(false);
    };

    processQueue();
  }, [requestQueue, isProcessingQueue]);

  // Helper to add requests to queue with deduplication
  const queueRequest = useCallback((id: string, request: () => Promise<void>) => {
    setRequestQueue(prev => {
      // Remove any existing request with the same ID to prevent duplicates
      const filtered = prev.filter(item => item.id !== id);
      return [...filtered, { id, request }];
    });
  }, []);

  // Load all projects for the user
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data: projectsData, error } = await supabase
        .from('qfd_projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(projectsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load project data
  const loadProject = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load project details
      const { data: project, error: projectError } = await supabase
        .from('qfd_projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      setCurrentProject(project);

      // Load all project data in parallel
      const [
        customerReqsResult,
        technicalReqsResult,
        relationshipsResult,
        correlationsResult,
        settingsResult
      ] = await Promise.all([
        supabase.from('customer_requirements').select('*').eq('project_id', id),
        supabase.from('technical_requirements').select('*').eq('project_id', id),
        supabase.from('relationships').select('*').eq('project_id', id),
        supabase.from('technical_correlations').select('*').eq('project_id', id),
        supabase.from('project_settings').select('*').eq('project_id', id).single()
      ]);

      // Check for errors
      if (customerReqsResult.error) throw customerReqsResult.error;
      if (technicalReqsResult.error) throw technicalReqsResult.error;
      if (relationshipsResult.error) throw relationshipsResult.error;
      if (correlationsResult.error) throw correlationsResult.error;

      // Transform data to match frontend types
      const customerRequirements: CustomerRequirement[] = customerReqsResult.data.map(req => ({
        id: req.id,
        description: req.description,
        importance: req.importance,
        competitorRatings: req.competitor_ratings
      }));

      const technicalRequirements: TechnicalRequirement[] = technicalReqsResult.data.map(req => ({
        id: req.id,
        description: req.description,
        unit: req.unit,
        target: req.target,
        difficulty: req.difficulty,
        importance: 0 // Calculated dynamically
      }));

      const relationships = relationshipsResult.data.map(rel => ({
        customerReqId: rel.customer_req_id,
        technicalReqId: rel.technical_req_id,
        strength: rel.strength as RelationshipStrength
      }));

      const technicalCorrelations = correlationsResult.data.map(corr => ({
        techReq1Id: corr.tech_req1_id,
        techReq2Id: corr.tech_req2_id,
        correlation: corr.correlation as CorrelationType
      }));

      const competitorNames = settingsResult.data?.competitor_names || ['Competitor A', 'Competitor B'];

      setData({
        customerRequirements,
        technicalRequirements,
        relationships,
        technicalCorrelations,
        competitorNames
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new project
  const createProject = useCallback(async (name: string, description: string = '') => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: project, error } = await supabase
        .from('qfd_projects')
        .insert({
          name,
          description,
          user_id: user.user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Create default project settings
      await supabase
        .from('project_settings')
        .insert({
          project_id: project.id,
          competitor_names: ['Competitor A', 'Competitor B']
        });

      await loadProjects();
      return project;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadProjects]);

  // Delete project
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('qfd_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      await loadProjects();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadProjects]);

  // Save customer requirement (queued with deduplication)
  const saveCustomerRequirement = useCallback((requirement: CustomerRequirement, projectId: string) => {
    const requestId = `customer-${requirement.id}`;
    const request = async () => {
      try {
        const { error } = await supabase
          .from('customer_requirements')
          .upsert({
            id: requirement.id,
            project_id: projectId,
            description: requirement.description,
            importance: requirement.importance,
            competitor_ratings: requirement.competitorRatings
          });

        if (error) throw error;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save customer requirement');
      }
    };

    queueRequest(requestId, request);
  }, [queueRequest]);

  // Save technical requirement (queued with deduplication)
  const saveTechnicalRequirement = useCallback((requirement: TechnicalRequirement, projectId: string) => {
    const requestId = `technical-${requirement.id}`;
    const request = async () => {
      try {
        const { error } = await supabase
          .from('technical_requirements')
          .upsert({
            id: requirement.id,
            project_id: projectId,
            description: requirement.description,
            unit: requirement.unit,
            target: requirement.target,
            difficulty: requirement.difficulty
          });

        if (error) throw error;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save technical requirement');
      }
    };

    queueRequest(requestId, request);
  }, [queueRequest]);

  // Save relationship
  const saveRelationship = useCallback(async (customerReqId: string, technicalReqId: string, strength: RelationshipStrength, projectId: string) => {
    try {
      if (strength === RelationshipStrength.NONE) {
        // Delete relationship
        const { error } = await supabase
          .from('relationships')
          .delete()
          .eq('customer_req_id', customerReqId)
          .eq('technical_req_id', technicalReqId);

        if (error) throw error;
      } else {
        // Upsert relationship
        const { error } = await supabase
          .from('relationships')
          .upsert({
            project_id: projectId,
            customer_req_id: customerReqId,
            technical_req_id: technicalReqId,
            strength: strength
          });

        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save relationship');
    }
  }, []);

  // Save correlation
  const saveCorrelation = useCallback(async (techReq1Id: string, techReq2Id: string, correlation: CorrelationType, projectId: string) => {
    try {
      // Ensure consistent ordering
      const [req1, req2] = [techReq1Id, techReq2Id].sort();

      if (correlation === CorrelationType.NONE) {
        // Delete correlation
        const { error } = await supabase
          .from('technical_correlations')
          .delete()
          .eq('tech_req1_id', req1)
          .eq('tech_req2_id', req2);

        if (error) throw error;
      } else {
        // Upsert correlation
        const { error } = await supabase
          .from('technical_correlations')
          .upsert({
            project_id: projectId,
            tech_req1_id: req1,
            tech_req2_id: req2,
            correlation: correlation
          });

        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save correlation');
    }
  }, []);

  // Save competitor names (queued with deduplication)
  const saveCompetitorNames = useCallback((names: string[], projectId: string) => {
    const requestId = `competitors-${projectId}`;
    const request = async () => {
      try {
        const { error } = await supabase
          .from('project_settings')
          .upsert({
            project_id: projectId,
            competitor_names: names
          });

        if (error) throw error;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save competitor names');
      }
    };

    queueRequest(requestId, request);
  }, [queueRequest]);

  // Delete requirement
  const deleteCustomerRequirement = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('customer_requirements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer requirement');
    }
  }, []);

  const deleteTechnicalRequirement = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('technical_requirements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete technical requirement');
    }
  }, []);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Load specific project if projectId is provided
  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId, loadProject]);

  return {
    data,
    projects,
    currentProject,
    loading: loading || isProcessingQueue,
    error,
    loadProjects,
    loadProject,
    createProject,
    deleteProject,
    saveCustomerRequirement,
    saveTechnicalRequirement,
    saveRelationship,
    saveCorrelation,
    saveCompetitorNames,
    deleteCustomerRequirement,
    deleteTechnicalRequirement,
    setError
  };
};