const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');

// Helper: Verify project exists and belongs to current user
const verifyProjectOwnership = async (projectId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return { error: { status: 400, message: 'Invalid project ID.' } };
  }
  const project = await Project.findById(projectId);
  if (!project) {
    return { error: { status: 404, message: 'Project not found.' } };
  }
  if (project.owner.toString() !== userId) {
    return { error: { status: 403, message: 'Not authorized to access this project.' } };
  }
  return { project };
};

// GET /api/projects/:projectId/tasks?status=todo&sortBy=dueDate&order=asc
exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { error } = await verifyProjectOwnership(projectId, req.userId);
    if (error) return res.status(error.status).json({ message: error.message });

    const { status, sortBy, order } = req.query;

    // Build filter
    const filter = { project: projectId };
    if (status && ['todo', 'in-progress', 'done'].includes(status)) {
      filter.status = status;
    }

    // Build sort
    const sortDirection = order === 'desc' ? -1 : 1;
    let sortOption = { createdAt: -1 }; // Default sort

    if (sortBy === 'dueDate') {
      sortOption = { dueDate: sortDirection, createdAt: -1 };
    } else if (sortBy === 'status') {
      sortOption = { status: sortDirection, createdAt: -1 };
    }

    const tasks = await Task.find(filter).sort(sortOption);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks.' });
  }
};

// POST /api/projects/:projectId/tasks
exports.createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { error } = await verifyProjectOwnership(projectId, req.userId);
    if (error) return res.status(error.status).json({ message: error.message });

    const { title, description, status, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required.' });
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      dueDate: dueDate || null,
      project: projectId,
    });

    res.status(201).json(task);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Failed to create task.' });
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid task ID.' });
    }

    const task = await Task.findById(id).populate('project', 'owner');
    if (!task || !task.project) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (task.project.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this task.' });
    }

    const { title, description, status, dueDate } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;

    await task.save();
    res.json(task);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Failed to update task.' });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid task ID.' });
    }

    const task = await Task.findById(id).populate('project', 'owner');
    if (!task || !task.project) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (task.project.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this task.' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task.' });
  }
};