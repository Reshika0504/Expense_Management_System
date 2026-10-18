// Explicit manual smoke harness; never loaded by server.js or production startup.
// Builds with public browser configuration only and always creates a disposable DB.
const fs = require('node:fs');
const { spawnSync, execFileSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const repoRoot = require('node:path').resolve(__dirname, '..');
const origin = 'https://expense-management-system-frontend-3o3i.onrender.com';
const project = 'spendwise-2d716';
async function build() {
    const html = await (await fetch(origin, { signal: AbortSignal.timeout(20000) })).text();
    const asset = html.match(/src="([^"]*main[^\"]*\.js)"/);
    if (!asset) throw new Error('PUBLIC_ASSET_UNAVAILABLE');
    const url = new URL(asset[1], origin);
    if (url.origin !== origin) throw new Error('UNEXPECTED_ASSET_ORIGIN');
    const js = await (await fetch(url, { signal: AbortSignal.timeout(20000) })).text();
    const key = [...new Set(js.match(/AIza[A-Za-z0-9_-]{35}/g))];
    const appId = [...new Set(js.match(/1:[0-9]+:web:[a-f0-9]+/g))];
    if (key.length !== 1 || appId.length !== 1 || !js.includes(project + '.firebaseapp.com'))
        throw new Error('PUBLIC_CONFIG_AMBIGUOUS');
    const result = spawnSync('npm', ['run', 'build', '--prefix', 'client'], {
        cwd: repoRoot, stdio: 'inherit', env: { ...process.env, CI: 'true', REACT_APP_API_URL: '/api/v1',
            REACT_APP_FIREBASE_API_KEY: key[0], REACT_APP_FIREBASE_APP_ID: appId[0],
            REACT_APP_FIREBASE_PROJECT_ID: project,
            REACT_APP_FIREBASE_AUTH_DOMAIN: project + '.firebaseapp.com' },
    });
    if (result.status !== 0) throw new Error('LOCAL_SMOKE_BUILD_FAILED');
    fs.writeFileSync(require('node:path').join(repoRoot, 'docs/testing/phase-0.1/post-review/local-browser-build.json'), JSON.stringify({
        sourceRevision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim(),
        apiBase: '/api/v1', source: 'public deployed browser configuration',
        secretsSaved: false, publicConfigValuesSavedInReport: false,
        status: 'PASSED', deploymentPerformed: false,
    }, null, 2) + '\n');
}
async function serve() {
    const mongoose = require('mongoose');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    // Never use or load MONGO_URL, external credentials, .env or connectDb.
    const mongo = await MongoMemoryServer.create();
    process.env.JWT_SECRET = randomBytes(48).toString('hex');
    process.env.FIREBASE_PROJECT_ID = project;
    process.env.FRONTEND_URL = 'http://localhost:4317';
    process.env.NODE_ENV = 'test';
    await mongoose.connect(mongo.getUri(), { dbName: 'spendwise_disposable_browser' });
    const users = require('../models/userModel');
    const { initializeSystemCategories } = require('../models/categoryModel');
    await users.init();
    await initializeSystemCategories();
    const server = require('../app').createApp({ logging: false }).listen(4317, '127.0.0.1', () => {
        console.log('DISPOSABLE_BROWSER_READY http://localhost:4317');
    });
    const shutdown = async () => {
        await new Promise(resolve => server.close(resolve));
        await mongoose.disconnect();
        await mongo.stop();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
if (process.argv[2] === '--build') build().catch(() => {
    console.error('LOCAL_SMOKE_PREPARATION_FAILED (details suppressed)'); process.exitCode = 1;
});
else if (process.argv[2] === '--serve') serve().catch(() => {
    console.error('DISPOSABLE_SMOKE_START_FAILED (details suppressed)'); process.exitCode = 1;
});
else { console.error('Use --build or --serve for a disposable local browser check.'); process.exitCode = 1; }
