const request = require('supertest');
const app = require('../index');
const { tasks } = require('../models/Task');

let server;
let authToken;

beforeAll(async () => {
  // Start the server on a different port for testing
  server = app.listen(3001);
  
  // Register and login to get token
  await request(app)
    .post('/api/auth/register')
    .send({
      username: 'testuser',
      password: 'testpass123'
    });

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      username: 'testuser',
      password: 'testpass123'
    });

  authToken = loginResponse.body.token;
});

afterAll(async () => {
  await server.close();
});

beforeEach(() => {
  tasks.clear();
});

describe('Task API', () => {
  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Test Description',
          priority: 'high',
          status: 'pending'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Task');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
          description: '',
          priority: 'invalid',
          status: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Create test tasks
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task 1',
          description: 'Description 1',
          priority: 'high',
          status: 'pending'
        });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task 2',
          description: 'Description 2',
          priority: 'low',
          status: 'completed'
        });
    });

    it('should get tasks with pagination', async () => {
      const response = await request(app)
        .get('/api/tasks?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks).toHaveLength(2);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
    });

    it('should filter tasks by priority and status', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=high&status=pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].priority).toBe('high');
      expect(response.body.tasks[0].status).toBe('pending');
    });
  });
});