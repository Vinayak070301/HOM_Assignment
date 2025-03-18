class Task {
  constructor(id, userId, title, description, status, priority, createdAt) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.description = description;
    this.status = status;
    this.priority = priority;
    this.createdAt = createdAt || new Date();
  }
}

// In-memory storage (replace with a proper database in production)
const tasks = new Map();
let taskIdCounter = 1;

module.exports = {
  Task,
  tasks,
  getNextId: () => taskIdCounter++
};