const request = require('supertest');
const app = require('../src/index'); // if you export `app` instead of listening directly

describe('Users API', () => {
  it('GET /api/users → array', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
