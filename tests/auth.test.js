const {test, before, after, beforeEach, mock} = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const {MongoMemoryServer} = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const provider = require('../services/firebaseAuth');
const verify = mock.method(provider, 'verifyFirebaseToken');
const users = require('../models/userModel');
const app = express();
app.use(express.json());
app.use('/users', require('../routes/userRoute'));
let mongo;
const password = 'A-valid-test-password!';
const identity = {uid: 'google-uid-123', email: 'test.user@gmail.com', email_verified: true,
    name: 'Test User', firebase: {sign_in_provider: 'google.com'}};

before(async () => {
    process.env.JWT_SECRET = 'integration-test-only-secret-not-used-in-production';
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await users.init();
});
beforeEach(async () => {
    await users.deleteMany({});
    verify.mock.mockImplementation(async () => ({...identity}));
});
after(async () => { await mongoose.disconnect(); await mongo?.stop(); mock.restoreAll(); });

const register = (data = {}) => request(app).post('/users/register').send({name: 'Test User', email: 'test.user@gmail.com', password, ...data});
const google = () => request(app).post('/users/firebase').send({idToken: 'provider-token'});

test('registers normalized email, hashes password and returns a working JWT', async () => {
    const response = await register({email: '  Mixed.Case+tag@example.technology  ', name: '  Test User  '});
    assert.equal(response.status, 201);
    assert.equal(response.body.user.email, 'mixed.case+tag@example.technology');
    assert.equal(response.body.user.name, 'Test User');
    assert.equal(response.body.user.password, undefined);
    const stored = await users.findById(response.body.user.id).select('+password');
    assert.notEqual(stored.password, password);
    assert.equal(await bcrypt.compare(password, stored.password), true);
    const profile = await request(app).get('/users/profile').set('Authorization', `Bearer ${response.body.token}`);
    assert.equal(profile.status, 200);
    assert.equal(profile.body.user.email, 'mixed.case+tag@example.technology');
});
test('logs in with whitespace and mixed-case email', async () => {
    await register();
    const response = await request(app).post('/users/login').send({email: '  TEST.USER@GMAIL.COM ', password});
    assert.equal(response.status, 200);
    assert.equal(jwt.verify(response.body.token, process.env.JWT_SECRET).user.email, identity.email);
});
test('unknown email and incorrect password both return the same 401 response', async () => {
    await register();
    const missing = await request(app).post('/users/login').send({email: 'missing@gmail.com', password});
    const wrong = await request(app).post('/users/login').send({email: identity.email, password: 'wrong'});
    assert.equal(missing.status, 401); assert.equal(wrong.status, 401);
    assert.deepEqual(missing.body, wrong.body);
});
test('rejects invalid input and duplicate normalized email', async () => {
    assert.equal((await register({email: 'invalid'})).status, 400);
    await register();
    assert.equal((await register({email: 'TEST.USER@GMAIL.COM'})).status, 400);
});
test('Google sign-in creates an account without a local password and reuses it', async () => {
    const first = await google();
    const second = await google();
    assert.equal(first.status, 200); assert.equal(second.status, 200);
    assert.equal(first.body.user.id, second.body.user.id);
    assert.equal(await users.countDocuments(), 1);
    const passwordLogin = await request(app).post('/users/login').send({email: identity.email, password});
    assert.equal(passwordLogin.status, 401);
});
test('Google links an existing Gmail account without losing its id or password', async () => {
    const existing = await register();
    const response = await google();
    assert.equal(response.status, 200);
    assert.equal(response.body.user.id, existing.body.user.id);
    assert.equal(await users.countDocuments(), 1);
    assert.equal((await request(app).post('/users/login').send({email: identity.email, password})).status, 200);
});
test('rejects expired, forged, unverified and non-Google identities', async () => {
    verify.mock.mockImplementation(async () => { throw new Error('invalid signature'); });
    assert.equal((await google()).status, 401);
    verify.mock.mockImplementation(async () => ({...identity, email_verified: false}));
    assert.equal((await google()).status, 401);
    verify.mock.mockImplementation(async () => ({...identity, firebase: {sign_in_provider: 'phone'}}));
    assert.equal((await google()).status, 401);
    assert.equal(await users.countDocuments(), 0);
});
test('keeps existing third-party-email accounts separate until ownership can be linked', async () => {
    await register({email: 'user@example.com'});
    verify.mock.mockImplementation(async () => ({...identity, email: 'user@example.com'}));
    assert.equal((await google()).status, 409);
});
test('rejects disabled users for both login methods', async () => {
    await register();
    await users.updateOne({email: identity.email}, {$set: {isActive: false}});
    assert.equal((await google()).status, 403);
    assert.equal((await request(app).post('/users/login').send({email: identity.email, password})).status, 403);
});
test('returns actionable 503 when Google configuration is missing', async () => {
    verify.mock.mockImplementation(async () => { const error = new Error('Google sign-in is not configured'); error.status = 503; throw error; });
    assert.equal((await google()).status, 503);
});
