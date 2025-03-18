const express = require('express');
const { body, query, validationResult } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { Task, tasks, getNextId } = require('../models/Task');
const cache = require('../config/cache');
const PriorityQueue = require('../utils/PriorityQueue');

// Validation middleware
const validateTask = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('status').isIn(['pending', 'completed']).withMessage('Invalid status')
];

// Create task
router.post('/', authMiddleware, validateTask, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, priority, status } = req.body;
    const task = new Task(
      getNextId(),
      req.user.username,
      title,
      description,
      status,
      priority
    );

    tasks.set(task.id, task);
    cache.del('tasks_' + req.user.username);

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task' });
  }
});

// Get tasks with pagination and filtering
router.get('/', authMiddleware, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('priority').optional().isIn(['low', 'medium', 'high']),
  query('status').optional().isIn(['pending', 'completed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { priority, status } = req.query;

    const cacheKey = `tasks_${req.user.username}_${page}_${limit}_${priority}_${status}`;
    const cachedResult = cache.get(cacheKey);

    if (cachedResult) {
      return res.json(cachedResult);
    }

    let userTasks = Array.from(tasks.values())
      .filter(task => task.userId === req.user.username);

    if (priority) {
      userTasks = userTasks.filter(task => task.priority === priority);
    }
    if (status) {
      userTasks = userTasks.filter(task => task.status === status);
    }

    // Sort tasks using PriorityQueue
    const pq = new PriorityQueue();
    userTasks.forEach(task => pq.enqueue(task));
    userTasks = [];
    while (pq.values.length > 0) {
      userTasks.push(pq.dequeue());
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTasks = userTasks.slice(startIndex, endIndex);

    const result = {
      tasks: paginatedTasks,
      page,
      limit,
      total: userTasks.length,
      totalPages: Math.ceil(userTasks.length / limit)
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// Update task
router.put('/:id', authMiddleware, validateTask, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const taskId = parseInt(req.params.id);
    const task = tasks.get(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId !== req.user.username) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { title, description, priority, status } = req.body;
    const updatedTask = new Task(
      taskId,
      req.user.username,
      title,
      description,
      status,
      priority,
      task.createdAt
    );

    tasks.set(taskId, updatedTask);
    cache.del('tasks_' + req.user.username);

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task' });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const task = tasks.get(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId !== req.user.username) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    tasks.delete(taskId);
    cache.del('tasks_' + req.user.username);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task' });
  }
});

module.exports = router;