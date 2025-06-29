import React, { useState, useEffect } from 'react';
import { Factory, Download, Upload, RotateCcw, LogOut, User, Home, Loader2 } from 'lucide-react';
import { CustomerRequirements } from './components/CustomerRequirements';
import { TechnicalRequirements } from './components/TechnicalRequirements';
import { QFDMatrix } from './components/QFDMatrix';
import { PriorityAnalysis } from './components/PriorityAnalysis';
import { AuthForm } from './components/AuthForm';
import { ProjectSelector } from './components/ProjectSelector';
import { useAuth } from './hooks/useAuth';
import { useSupabaseQFD } from './hooks/useSupabaseQFD';
import { useQFDData } from './hooks/useQFDData';
import { RelationshipStrength, CorrelationType } from './types/qfd';

function App() {
  const [activeTab, setActiveTab] = useState<'requirements' | 'matrix' | 'analysis'>('requirements');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const {
    data: supabaseData,
    projects,
    currentProject,
    loading: supabaseLoading,
    error: supabaseError,
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
  } = useSupabaseQFD(selectedProjectId);

  // Fallback to local data when not connected to Supabase
  const {
    data: localData,
    addCustomerRequirement: addLocalCustomerRequirement,
    removeCustomerRequirement: removeLocalCustomerRequirement,
    updateCustomerRequirement: updateLocalCustomerRequirement,
    addTechnicalRequirement: addLocalTechnicalRequirement,
    removeTechnicalRequirement: removeLocalTechnicalRequirement,
    updateTechnicalRequirement: updateLocalTechnicalRequirement,
    updateRelationship: updateLocalRelationship,
    updateCorrelation: updateLocalCorrelation,
    updateCompetitorNames: updateLocalCompetitorNames,
    loadSampleData
  } = useQFDData();

  // Use Supabase data if user is authenticated and project is selected, otherwise use local data
  const data = user && selectedProjectId ? supabaseData : localData;
  const isUsingSupabase = user && selectedProjectId;

  // Handle project selection
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    if (projectId) {
      loadProject(projectId);
    }
  };

  // Handle project creation
  const handleCreateProject = async (name: string, description: string) => {
    const project = await createProject(name, description);
    if (project) {
      setSelectedProjectId(project.id);
    }
  };

  // Handle project deletion
  const handleDeleteProject = async (projectId: string) => {
    const success = await deleteProject(projectId);
    if (success && projectId === selectedProjectId) {
      setSelectedProjectId('');
    }
  };

  // Handle going back to home
  const handleGoHome = () => {
    setSelectedProjectId('');
    setActiveTab('requirements');
  };

  // Wrapper functions for Supabase operations
  const addCustomerRequirement = async () => {
    if (isUsingSupabase) {
      const newReq = {
        description: '',
        importance: 3,
        competitorRatings: data.competitorNames.map(() => 3)
      };
      await saveCustomerRequirement(newReq, selectedProjectId);
      loadProject(selectedProjectId);
    } else {
      addLocalCustomerRequirement();
    }
  };

  const removeCustomerRequirement = async (id: string) => {
    if (isUsingSupabase) {
      await deleteCustomerRequirement(id);
      loadProject(selectedProjectId);
    } else {
      removeLocalCustomerRequirement(id);
    }
  };

  const updateCustomerRequirement = async (id: string, updates: any) => {
    if (isUsingSupabase) {
      const requirement = data.customerRequirements.find(r => r.id === id);
      if (requirement) {
        await saveCustomerRequirement({ ...requirement, ...updates }, selectedProjectId);
        loadProject(selectedProjectId);
      }
    } else {
      updateLocalCustomerRequirement(id, updates);
    }
  };

  const addTechnicalRequirement = async () => {
    if (isUsingSupabase) {
      const newReq = {
        description: '',
        unit: '',
        target: '',
        difficulty: 3,
        importance: 0
      };
      await saveTechnicalRequirement(newReq, selectedProjectId);
      loadProject(selectedProjectId);
    } else {
      addLocalTechnicalRequirement();
    }
  };

  const removeTechnicalRequirement = async (id: string) => {
    if (isUsingSupabase) {
      await deleteTechnicalRequirement(id);
      loadProject(selectedProjectId);
    } else {
      removeLocalTechnicalRequirement(id);
    }
  };

  const updateTechnicalRequirement = async (id: string, updates: any) => {
    if (isUsingSupabase) {
      const requirement = data.technicalRequirements.find(r => r.id === id);
      if (requirement) {
        await saveTechnicalRequirement({ ...requirement, ...updates }, selectedProjectId);
        loadProject(selectedProjectId);
      }
    } else {
      updateLocalTechnicalRequirement(id, updates);
    }
  };

  const updateRelationship = async (customerReqId: string, technicalReqId: string, strength: RelationshipStrength) => {
    if (isUsingSupabase) {
      await saveRelationship(customerReqId, technicalReqId, strength, selectedProjectId);
      loadProject(selectedProjectId);
    } else {
      updateLocalRelationship(customerReqId, technicalReqId, strength);
    }
  };

  const updateCorrelation = async (techReq1Id: string, techReq2Id: string, correlation: CorrelationType) => {
    if (isUsingSupabase) {
      await saveCorrelation(techReq1Id, techReq2Id, correlation, selectedProjectId);
      loadProject(selectedProjectId);
    } else {
      updateLocalCorrelation(techReq1Id, techReq2Id, correlation);
    }
  };

  const updateCompetitorNames = async (names: string[]) => {
    if (isUsingSupabase) {
      await saveCompetitorNames(names, selectedProjectId);
      loadProject(selectedProjectId);
    } else {
      updateLocalCompetitorNames(names);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qfd-data-${currentProject?.name || 'local'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          console.log('Imported data:', importedData);
          // TODO: Implement data import functionality
        } catch (error) {
          console.error('Error importing data:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const tabs = [
    { id: 'requirements', label: 'Requirements' },
    { id: 'matrix', label: 'Matrix' },
    { id: 'analysis', label: 'Analysis' }
  ];

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

  // Show project selector if no project is selected
  if (!selectedProjectId) {
    return (
      <div>
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Factory size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">QFD Builder</h1>
                  <p className="text-sm text-gray-500">Quality Function Deployment Tool</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={16} />
                  <span>{user.email}</span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <ProjectSelector
          projects={projects}
          currentProject={currentProject}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          loading={supabaseLoading}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={handleGoHome}
                className="bg-blue-600 p-2 rounded-lg hover:bg-blue-700 transition-colors"
                title="Go to Home"
              >
                <Home size={24} className="text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">QFD Builder</h1>
                <p className="text-sm text-gray-500">Quality Function Deployment Tool</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isUsingSupabase && (
                <button
                  onClick={loadSampleData}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RotateCcw size={16} />
                  Sample Data
                </button>
              )}
              
              <label className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                <Upload size={16} />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Download size={16} />
                Export
              </button>

              <div className="flex items-center gap-2 text-sm text-gray-600 ml-4">
                <User size={16} />
                <span>{user.email}</span>
              </div>
              
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Project Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Factory size={20} className="text-blue-600" />
            <div>
              <h2 className="font-semibold text-gray-900">{currentProject?.name}</h2>
              {currentProject?.description && (
                <p className="text-sm text-gray-600">{currentProject.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleGoHome}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Switch Project
          </button>
        </div>
      </div>

      {/* Error Display */}
      {supabaseError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{supabaseError}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-600 hover:text-red-800 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Subtle loading indicator */}
            {supabaseLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <>
          {activeTab === 'requirements' && (
            <div className="space-y-8">
              <CustomerRequirements
                requirements={data.customerRequirements}
                competitorNames={data.competitorNames}
                onAddRequirement={addCustomerRequirement}
                onRemoveRequirement={removeCustomerRequirement}
                onUpdateRequirement={updateCustomerRequirement}
                onUpdateCompetitorNames={updateCompetitorNames}
              />
              <TechnicalRequirements
                requirements={data.technicalRequirements}
                onAddRequirement={addTechnicalRequirement}
                onRemoveRequirement={removeTechnicalRequirement}
                onUpdateRequirement={updateTechnicalRequirement}
              />
            </div>
          )}

          {activeTab === 'matrix' && (
            <QFDMatrix
              data={data}
              onUpdateRelationship={updateRelationship}
              onUpdateCorrelation={updateCorrelation}
            />
          )}

          {activeTab === 'analysis' && (
            <PriorityAnalysis data={data} />
          )}
        </>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>QFD Builder - Quality Function Deployment Tool inspired by Toyota Production System</p>
            <p className="mt-1">Build the House of Quality to prioritize technical requirements based on customer needs</p>
            {isUsingSupabase && (
              <p className="mt-2 text-blue-600">✓ Data automatically saved to your account</p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;