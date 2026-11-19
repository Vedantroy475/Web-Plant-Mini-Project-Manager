'use client';

import { Suspense, useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Circle,
  X,
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import StatusSelect from '@/components/StatusSelect';
import DatePicker from '@/components/DatePicker';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProjects } from '@/store/slices/projectSlice';
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  setStatusFilter,
  setSortOrder,
  Task,
  TaskStatus,
  StatusFilter,
} from '@/store/slices/taskSlice';

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Done', value: 'done' },
];

function ProjectDetailContent() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const dispatch = useAppDispatch();
  const projects = useAppSelector((state) => state.projects.items);
  const project = projects.find((p) => p._id === projectId);

  const {
    items: tasks,
    statusFilter,
    sortBy,
    sortOrder,
    loading,
  } = useAppSelector((state) => state.tasks);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Ensure projects are loaded if user navigated directly to /projects/[id]
  useEffect(() => {
    if (projects.length === 0) {
      dispatch(fetchProjects());
    }
  }, [dispatch, projects.length]);

  // Fetch tasks whenever projectId, statusFilter, or sortOrder changes
  useEffect(() => {
    if (projectId) {
      dispatch(
        fetchTasks({
          projectId,
          status: statusFilter,
          sortBy,
          order: sortOrder,
        })
      );
    }
  }, [dispatch, projectId, statusFilter, sortBy, sortOrder]);

  const isOverdue = (task: Task): boolean => {
    if (!task.dueDate || task.status === 'done') return false;
    return new Date(task.dueDate) < new Date();
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setStatus('todo');
    setDueDate('');
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setStatus(task.status);
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    setSubmitting(true);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      status,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    };

    if (editingTask) {
      await dispatch(updateTask({ id: editingTask._id, ...payload }));
    } else {
      await dispatch(createTask({ projectId, ...payload }));
    }

    setSubmitting(false);
    setIsModalOpen(false);
  };

  const handleDeleteTask = async (task: Task) => {
    if (window.confirm(`Delete task "${task.title}"?`)) {
      await dispatch(deleteTask(task._id));
    }
  };

  const getStatusBadge = (taskStatus: TaskStatus) => {
    switch (taskStatus) {
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 border border-slate-200">
            <Circle className="h-3 w-3" />
            To Do
          </span>
        );
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {/* Back Link & Project Header */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="mb-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Projects</span>
            </Link>

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {project ? project.title : 'Project Tasks'}
                </h1>
                {project?.description && (
                  <p className="mt-1 max-w-2xl text-sm text-slate-600">
                    {project.description}
                  </p>
                )}
              </div>

              <button
                onClick={openCreateModal}
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Filter & Sort Control Bar */}
          <div className="mb-6 flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 sm:flex-row sm:items-center">
            {/* Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_TABS.map((tab) => {
                const active = statusFilter === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => dispatch(setStatusFilter(tab.value))}
                    className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Due Date Sort Toggle */}
            <button
              onClick={() =>
                dispatch(setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'))
              }
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
              <span>
                Due Date: {sortOrder === 'asc' ? 'Earliest First' : 'Latest First'}
              </span>
            </button>
          </div>

          {/* Task List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <h3 className="text-base font-semibold text-slate-900">No tasks found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {statusFilter !== 'all'
                  ? 'No tasks match the selected status filter.'
                  : 'Get started by adding your first task to this project.'}
              </p>
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add Task</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const overdue = isOverdue(task);

                return (
                  <div
                    key={task._id}
                    className={`flex flex-col justify-between gap-4 rounded-xl border p-5 shadow-sm transition-all sm:flex-row sm:items-center ${
                      overdue
                        ? 'border-red-300 bg-red-50/60'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3
                          className={`text-base font-semibold ${
                            task.status === 'done'
                              ? 'text-slate-400 line-through'
                              : overdue
                              ? 'text-red-900'
                              : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </h3>
                        {getStatusBadge(task.status)}
                        {overdue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
                            <AlertTriangle className="h-3 w-3" />
                            Overdue
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-sm text-slate-600">{task.description}</p>
                      )}

                      {task.dueDate && (
                        <div
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            overdue ? 'text-red-600 font-semibold' : 'text-slate-500'
                          }`}
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right Actions: Edit & Delete */}
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => openEditModal(task)}
                        title="Edit Task"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteTask(task)}
                        title="Delete Task"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Create / Edit Task Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-start justify-between border-b border-slate-100 pb-3.5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingTask ? 'Edit Task' : 'New Task'}
                  </h2>
                  {project && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      {editingTask ? 'Update task in' : 'Create and assign a task to'}{' '}
                      {project.title}.
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Implement JWT authentication"
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
                    placeholder="Details or acceptance criteria..."
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Status
                    </label>
                    <StatusSelect value={status} onChange={setStatus} />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Due Date
                    </label>
                    <DatePicker value={dueDate} onChange={setDueDate} />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting
                      ? 'Saving...'
                      : editingTask
                      ? 'Save Changes'
                      : 'Create Task'}
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

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}