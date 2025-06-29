import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { QFDData, CustomerRequirement, TechnicalRequirement, RelationshipStrength, CorrelationType } from '../types/qfd';
import { Database } from '../types/database';

type QFDProject = Database['public']['Tables']['qfd_projects']['Row'];

// Query keys
const QUERY_KEYS = {
  projects: ['projects'] as const,
  project: (id: string) => ['project', id] as const,
  projectData: (id: string) => ['projectData', id] as const,
};

export const useSupabaseQFD = (projectId?: string) => {
  const queryClient = useQueryClient();

  // Load all projects for the user
  const {
    data: projects = [],
    isLoading: projectsLoading,
    error: projectsError
  } = useQuery({
    queryKey: QUERY_KEYS.projects,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qfd_projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Load specific project
  const {
    data: currentProject,
    isLoading: projectLoading,
    error: projectError
  } = useQuery({
    queryKey: QUERY_KEYS.project(projectId || ''),
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('qfd_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Load project data
  const {
    data: projectData,
    isLoading: dataLoading,
    error: dataError
  } = useQuery({
    queryKey: QUERY_KEYS.projectData(projectId || ''),
    queryFn: async () => {
      if (!projectId) return null;

      // Load all project data in parallel
      const [
        customerReqsResult,
        technicalReqsResult,
        relationshipsResult,
        correlationsResult,
        settingsResult
      ] = await Promise.all([
        supabase.from('customer_requirements').select('*').eq('project_id', projectId),
        supabase.from('technical_requirements').select('*').eq('project_id', projectId),
        supabase.from('relationships').select('*').eq('project_id', projectId),
        supabase.from('technical_correlations').select('*').eq('project_id', projectId),
        supabase.from('project_settings').select('*').eq('project_id', projectId).single()
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

      return {
        customerRequirements,
        technicalRequirements,
        relationships,
        technicalCorrelations,
        competitorNames
      };
    },
    enabled: !!projectId,
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
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

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('qfd_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      return projectId;
    },
    onSuccess: (deletedProjectId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.project(deletedProjectId) });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.projectData(deletedProjectId) });
    },
  });

  // Save customer requirement mutation
  const saveCustomerRequirementMutation = useMutation({
    mutationFn: async ({ requirement, projectId: pid }: { requirement: CustomerRequirement; projectId: string }) => {
      const { error } = await supabase
        .from('customer_requirements')
        .upsert({
          id: requirement.id,
          project_id: pid,
          description: requirement.description,
          importance: requirement.importance,
          competitor_ratings: requirement.competitorRatings
        });

      if (error) throw error;
      return requirement;
    },
    onSuccess: (_, { projectId: pid }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectData(pid) });
    },
  });

  // Save technical requirement mutation
  const saveTechnicalRequirementMutation = useMutation({
    mutationFn: async ({ requirement, projectId: pid }: { requirement: TechnicalRequirement; projectId: string }) => {
      const { error } = await supabase
        .from('technical_requirements')
        .upsert({
          id: requirement.id,
          project_id: pid,
          description: requirement.description,
          unit: requirement.unit,
          target: requirement.target,
          difficulty: requirement.difficulty
        });

      if (error) throw error;
      return requirement;
    },
    onSuccess: (_, { projectId: pid }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectData(pid) });
    },
  });

  // Save relationship mutation
  const saveRelationshipMutation = useMutation({
    mutationFn: async ({ 
      customerReqId, 
      technicalReqId, 
      strength, 
      projectId: pid 
    }: { 
      customerReqId: string; 
      technicalReqId: string; 
      strength: RelationshipStrength; 
      projectId: string;
    }) => {
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
            project_id: pid,
            customer_req_id: customerReqId,
            technical_req_id: technicalReqId,
            strength: strength
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, { projectId: pid }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectData(pid) });
    },
  });

  // Save correlation mutation
  const saveCorrelationMutation = useMutation({
    mutationFn: async ({ 
      techReq1Id, 
      techReq2Id, 
      correlation, 
      projectId: pid 
    }: { 
      techReq1Id: string; 
      techReq2Id: string; 
      correlation: CorrelationType; 
      projectId: string;
    }) => {
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
            project_id: pid,
            tech_req1_id: req1,
            tech_req2_id: req2,
            correlation: correlation
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, { projectId: pid }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectData(pid) });
    },
  });

  // Save competitor names mutation
  const saveCompetitorNamesMutation = useMutation({
    mutationFn: async ({ names, projectId: pid }: { names: string[]; projectId: string }) => {
      const { error } = await supabase
        .from('project_settings')
        .upsert({
          project_id: pid,
          competitor_names: names
        });

      if (error) throw error;
      return names;
    },
    onSuccess: (_, { projectId: pid }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectData(pid) });
    },
  });

  // Delete customer requirement mutation
  const deleteCustomerRequirementMutation = useMutation({
    mutationFn: async ({ id, projectId: pid }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('customer_requirements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (_, { projectId: pid }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectData(pid) });
    },
  });

  // Delete technical requirement mutation
  const deleteTechnicalRequirementMutation = useMutation({
    mutationFn: async ({ id, projectId: pid }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('technical_requirements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (_, { projectId: pid }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectData(pid) });
    },
  });

  // Helper functions that use mutations
  const createProject = useCallback(async (name: string, description: string = '') => {
    try {
      const project = await createProjectMutation.mutateAsync({ name, description });
      return project;
    } catch (error) {
      console.error('Failed to create project:', error);
      return null;
    }
  }, [createProjectMutation]);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await deleteProjectMutation.mutateAsync(projectId);
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  }, [deleteProjectMutation]);

  const saveCustomerRequirement = useCallback((requirement: CustomerRequirement, projectId: string) => {
    saveCustomerRequirementMutation.mutate({ requirement, projectId });
  }, [saveCustomerRequirementMutation]);

  const saveTechnicalRequirement = useCallback((requirement: TechnicalRequirement, projectId: string) => {
    saveTechnicalRequirementMutation.mutate({ requirement, projectId });
  }, [saveTechnicalRequirementMutation]);

  const saveRelationship = useCallback((customerReqId: string, technicalReqId: string, strength: RelationshipStrength, projectId: string) => {
    saveRelationshipMutation.mutate({ customerReqId, technicalReqId, strength, projectId });
  }, [saveRelationshipMutation]);

  const saveCorrelation = useCallback((techReq1Id: string, techReq2Id: string, correlation: CorrelationType, projectId: string) => {
    saveCorrelationMutation.mutate({ techReq1Id, techReq2Id, correlation, projectId });
  }, [saveCorrelationMutation]);

  const saveCompetitorNames = useCallback((names: string[], projectId: string) => {
    saveCompetitorNamesMutation.mutate({ names, projectId });
  }, [saveCompetitorNamesMutation]);

  const deleteCustomerRequirement = useCallback(async (id: string) => {
    if (!projectId) return;
    try {
      await deleteCustomerRequirementMutation.mutateAsync({ id, projectId });
    } catch (error) {
      console.error('Failed to delete customer requirement:', error);
    }
  }, [deleteCustomerRequirementMutation, projectId]);

  const deleteTechnicalRequirement = useCallback(async (id: string) => {
    if (!projectId) return;
    try {
      await deleteTechnicalRequirementMutation.mutateAsync({ id, projectId });
    } catch (error) {
      console.error('Failed to delete technical requirement:', error);
    }
  }, [deleteTechnicalRequirementMutation, projectId]);

  // Combine loading states
  const loading = projectsLoading || projectLoading || dataLoading || 
    createProjectMutation.isPending || deleteProjectMutation.isPending;

  // Combine error states
  const error = projectsError?.message || projectError?.message || dataError?.message || 
    createProjectMutation.error?.message || deleteProjectMutation.error?.message || null;

  // Default data structure
  const defaultData: QFDData = {
    customerRequirements: [],
    technicalRequirements: [],
    relationships: [],
    technicalCorrelations: [],
    competitorNames: ['Competitor A', 'Competitor B']
  };

  return {
    data: projectData || defaultData,
    projects,
    currentProject: currentProject || null,
    loading,
    error,
    loadProjects: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects }),
    loadProject: (id: string) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectData(id) });
    },
    createProject,
    deleteProject,
    saveCustomerRequirement,
    saveTechnicalRequirement,
    saveRelationship,
    saveCorrelation,
    saveCompetitorNames,
    deleteCustomerRequirement,
    deleteTechnicalRequirement,
    setError: () => {}, // No longer needed with React Query error handling
  };
};