import { useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const useUrlState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const getTab = useCallback(() => {
    return searchParams.get('tab') as 'requirements' | 'matrix' | 'analysis' || 'requirements';
  }, [searchParams]);

  const setTab = useCallback((tab: 'requirements' | 'matrix' | 'analysis') => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tab);
      return newParams;
    });
  }, [setSearchParams]);

  const navigateToProject = useCallback((projectId: string, tab: 'requirements' | 'matrix' | 'analysis' = 'requirements') => {
    navigate(`/project/${projectId}?tab=${tab}`);
  }, [navigate]);

  const navigateToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return {
    tab: getTab(),
    setTab,
    navigateToProject,
    navigateToHome,
  };
};