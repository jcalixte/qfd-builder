import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthForm } from './components/AuthForm';
import { ProjectSelector } from './components/ProjectSelector';
import { ProjectView } from './components/ProjectView';
import { useAuth } from './hooks/useAuth';
import { useSupabaseQFD } from './hooks/useSupabaseQFD';

function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const {
    projects,
    currentProject,
    loading: supabaseLoading,
    createProject,
    deleteProject,
  } = useSupabaseQFD();

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth form if user is not authenticated
  if (!user) {
    return <AuthForm onSignIn={signIn} onSignUp={signUp} loading={authLoading} />;
  }

  // Handle project creation
  const handleCreateProject = async (name: string, description: string) => {
    const project = await createProject(name, description);
    return project;
  };

  // Handle project deletion
  const handleDeleteProject = async (projectId: string) => {
    return await deleteProject(projectId);
  };

  return (
    <Routes>
      {/* Home route - Project selector */}
      <Route 
        path="/" 
        element={
          <ProjectSelector
            projects={projects}
            currentProject={currentProject}
            onSelectProject={(projectId) => window.location.href = `/project/${projectId}`}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
            loading={supabaseLoading}
            onSignOut={signOut}
            user={user}
          />
        } 
      />
      
      {/* Project route with ID */}
      <Route 
        path="/project/:projectId" 
        element={<ProjectView onSignOut={signOut} />} 
      />
      
      {/* Redirect any other routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;