import React, { useState } from 'react';
import { Plus, FolderOpen, Calendar, User, Search, Trash2, AlertTriangle } from 'lucide-react';
import { Database } from '../types/database';

type QFDProject = Database['public']['Tables']['qfd_projects']['Row'];

interface ProjectSelectorProps {
  projects: QFDProject[];
  currentProject: QFDProject | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string, description: string) => void;
  onDeleteProject: (projectId: string) => void;
  loading: boolean;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  currentProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  loading
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim(), newProjectDescription.trim());
      setNewProjectName('');
      setNewProjectDescription('');
      setShowCreateForm(false);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    onDeleteProject(projectId);
    setProjectToDelete(null);
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your QFD Projects</h1>
              <p className="text-gray-600 mt-1">Select a project to continue or create a new one</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              New Project
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Create Project Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Create New Project</h3>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    id="projectDescription"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project description"
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Creating...' : 'Create Project'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewProjectName('');
                      setNewProjectDescription('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Projects List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {projects.length === 0 ? (
                <>
                  <FolderOpen size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">No projects yet</p>
                  <p className="text-sm">Create your first QFD project to get started</p>
                </>
              ) : (
                <>
                  <Search size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">No projects found</p>
                  <p className="text-sm">Try adjusting your search terms</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div 
                      className="flex items-center gap-2 cursor-pointer flex-1"
                      onClick={() => onSelectProject(project.id)}
                    >
                      <FolderOpen size={20} className="text-blue-600" />
                      <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(project.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 rounded"
                      title="Delete project"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div 
                    className="cursor-pointer"
                    onClick={() => onSelectProject(project.id)}
                  >
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>Updated {formatDate(project.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this project? This action cannot be undone and will permanently remove all project data including requirements, relationships, and analysis.
            </p>
            
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProject(projectToDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};