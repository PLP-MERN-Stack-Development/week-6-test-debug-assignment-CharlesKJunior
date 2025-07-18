// posts.test.js - Enhanced integration tests for posts API (Week 6 Assignment)
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const Post = require('../../src/models/Post');
const User = require('../../src/models/User');
const { generateToken } = require('../../src/utils/auth');

let mongoServer;
let token;
let userId;
let postId;

// 1. SETUP: In-memory DB and test data
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create test user and post (reusable across tests)
  const user = await User.create({ 
    username: 'testuser', 
    email: 'test@example.com',
    password: 'password123' 
  });
  userId = user._id;
  token = generateToken(user);

  const post = await Post.create({
    title: 'Test Post',
    content: 'This is a test post',
    author: userId,
    category: new mongoose.Types.ObjectId(),
    slug: 'test-post'
  });
  postId = post._id;
});

// 2. TEARDOWN: Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// 3. TEST CASES ===============================================

describe('POST /api/posts', () => {
  it('should create a post (201) with valid auth + data', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'New Post',
        content: 'Content',
        category: new mongoose.Types.ObjectId().toString()
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'New Post',
      author: userId.toString()
    });
  });

  it('should fail (401) without authentication', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ title: 'Unauthorized' });

    expect(res.status).toBe(401);
  });

  it('should fail (400) with invalid data', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '' }); // Missing required fields

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

describe('GET /api/posts', () => {
  it('should list all posts (200)', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.some(p => p._id === postId.toString())).toBe(true);
  });

  it('should filter by category (200)', async () => {
    const categoryId = new mongoose.Types.ObjectId();
    await Post.create({ 
      title: 'Filtered', 
      category: categoryId, 
      author: userId 
    });

    const res = await request(app)
      .get(`/api/posts?category=${categoryId}`);

    expect(res.body.every(p => p.category === categoryId.toString())).toBe(true);
  });

  it('should paginate results (200)', async () => {
    // Create 15 posts for pagination testing
    const posts = Array.from({ length: 15 }, (_, i) => ({
      title: `Post ${i}`,
      author: userId,
      category: new mongoose.Types.ObjectId()
    }));
    await Post.insertMany(posts);

    const page1 = await request(app).get('/api/posts?page=1&limit=10');
    const page2 = await request(app).get('/api/posts?page=2&limit=10');

    expect(page1.body).toHaveLength(10);
    expect(page2.body).toHaveLength(6); // 16 total (15 new + 1 existing)
  });
});

describe('GET /api/posts/:id', () => {
  it('should retrieve a post (200) by ID', async () => {
    const res = await request(app).get(`/api/posts/${postId}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(postId.toString());
  });

  it('should fail (404) for non-existent post', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/posts/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/posts/:id', () => {
  it('should update (200) when authorized', async () => {
    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Title');
  });

  it('should fail (403) when not the author', async () => {
    const otherUser = await User.create({
      username: 'otheruser',
      email: 'other@test.com',
      password: 'password'
    });
    const otherToken = generateToken(otherUser);

    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Unauthorized Update' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/posts/:id', () => {
  it('should delete (200) when authorized', async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(await Post.findById(postId)).toBeNull();
  });
});