const {test, afterEach} = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const {browserRoutes, frontendRedirect} = require('../middlewares/frontendRedirect');
const app = express();
app.get(browserRoutes, frontendRedirect);
app.use((req, res) => res.status(404).json({message: 'Route not found'}));
afterEach(() => delete process.env.FRONTEND_URL);

test('opening the API service in a browser redirects to the actual app', async () => {
    for (const path of ['/', '/login', '/dashboard', '/reports']) {
        const response = await request(app).get(path);
        assert.equal(response.status, 302);
        assert.equal(response.headers.location, `https://expense-management-system-frontend-3o3i.onrender.com${path}`);
    }
});
test('redirects use a configured trusted frontend, never a query-provided host', async () => {
    process.env.FRONTEND_URL = 'http://localhost:3000';
    const response = await request(app).get('/login?next=https://untrusted.example');
    assert.equal(response.status, 302);
    assert.equal(new URL(response.headers.location).origin, 'http://localhost:3000');
});
test('API and unknown paths retain their API behavior', async () => {
    for (const path of ['/api/v1/missing', '/api/health', '/unrecognized']) {
        const response = await request(app).get(path);
        assert.equal(response.status, 404);
        assert.equal(response.headers.location, undefined);
    }
});
