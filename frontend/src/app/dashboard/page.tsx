'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  Calendar,
  ArrowRight,
  CheckSquare,
  X,
  AlertCircle,
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  Project,
} from '@/store/slices/projectSlice';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { items: projects, loading, error } = useAppSelector((state) => state.projects);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const openCreateModal = () => {
    setEditingProject(null);
    setTitle('');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setTitle(project.title);
    setDescription(project.description || '');
    setIsModalOpen(true);
  };

  const handleSaveProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    if (editingProject) {
      await dispatch(
        updateProject({
          id: editingProject._id,
          title: title.trim(),
          description: description.trim(),
        })
      );
    } else {
      await dispatch(
        createProject({
          title: title.trim(),
          description: description.trim(),
        })
      );
    }
    setSubmitting(false);
    setIsModalOpen(false);
  };

  const handleDeleteProject = async (project: Project) => {
    const confirmed = window.confirm(
      `Delete "${project.title}" and all of its tasks? This cannot be undone.`
    );
    if (confirmed) {
      await dispatch(deleteProject(project._id));
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {/* Header Row */}
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
              <p className="mt-1 text-sm text-slate-500">
                {projects.length} {projects.length === 1 ? 'project' : 'projects'} total
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-48 animate-pulse rounded-xl border border-slate-200 bg-white p-6"
                />
              ))}
            </div>
          ) : projects.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mb-3 rounded-full bg-blue-50 p-3 text-blue-600">
                <FolderOpen className="h-7 w-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">No projects yet</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Create your first project to organize tasks, set due dates, and track progress.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create First Project</span>
              </button>
            </div>
          ) : (
            /* Project Cards Grid */
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const total = project.totalTasks ?? 0;
                const completed = project.completedTasks ?? 0;
                const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <div
                    key={project._id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/projects/${project._id}`}
                          className="text-lg font-semibold text-slate-900 hover:text-blue-600 line-clamp-1"
                        >
                          {project.title}
                        </Link>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => openEditModal(project)}
                            title="Edit Project"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project)}
                            title="Delete Project"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                        {project.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-6 space-y-3 border-t border-slate-100 pt-4">
                      {/* Task Count Summary */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                          <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
                          <span>
                            {completed}/{total} {total === 1 ? 'task' : 'tasks'} done
                          </span>
                        </span>

                        {total > 0 && (
                          <span className="font-semibold text-slate-500">
                            {progressPercent}%
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      {/* Date & Open Link */}
                      <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>

                        <Link
                          href={`/projects/${project._id}`}
                          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
                        >
                          <span>Open Tasks</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Create / Edit Project Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  {editingProject ? 'Edit Project' : 'New Project'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProject} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Website Redesign"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief overview of goals or scope..."
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting
                      ? 'Saving...'
                      : editingProject
                      ? 'Save Changes'
                      : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}