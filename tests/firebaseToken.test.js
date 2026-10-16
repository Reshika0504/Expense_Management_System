const {test} = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const {verifyFirebaseToken} = require('../services/firebaseAuth');

test('real Firebase verifier rejects missing configuration and forged tokens', async () => {
    delete process.env.FIREBASE_PROJECT_ID;
    await assert.rejects(verifyFirebaseToken('not-a-token'), {status: 503});
    process.env.FIREBASE_PROJECT_ID = 'spendwise-test';
    const forged = jwt.sign({sub: 'attacker', aud: 'spendwise-test', iss: 'https://securetoken.google.com/spendwise-test'}, 'attacker-secret', {keyid: 'forged-key'});
    await assert.rejects(verifyFirebaseToken(forged), /algorithm|RS256/i);
});
