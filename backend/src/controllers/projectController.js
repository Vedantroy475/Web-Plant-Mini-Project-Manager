const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');

// GET /api/projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.userId }).sort({ createdAt: -1 }).lean();
    const projectIds = projects.map((p) => p._id);

    const counts = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      {
        $group: {
          _id: '$project',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] },
          },
        },
      },
    ]);

    const countMap = Object.fromEntries(
      counts.map((c) => [c._id.toString(), { totalTasks: c.totalTasks, completedTasks: c.completedTasks }])
    );

    const enrichedProjects = projects.map((p) => ({
      ...p,
      totalTasks: countMap[p._id.toString()]?.totalTasks || 0,
      completedTasks: countMap[p._id.toString()]?.completedTasks || 0,
    }));

    res.json(enrichedProjects);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch projects.' });
  }
};

// POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Project title is required.' });
    }

    const project = await Project.create({
      title,
      description,
      owner: req.userId,
    });

    res.status(201).json({
        ...project.toObject(),
        totalTasks: 0,
        completedTasks: 0,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Failed to create project.' });
  }
};

// PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid project ID.' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this project.' });
    }

    const { title, description } = req.body;
    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;

    await project.save();
    res.json(project);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Failed to update project.' });
  }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid project ID.' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this project.' });
    }

    // Triggers the pre('deleteOne') hook in Project model to cascade-delete tasks
    await project.deleteOne();

    res.json({ message: 'Project and associated tasks deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete project.' });
  }
};