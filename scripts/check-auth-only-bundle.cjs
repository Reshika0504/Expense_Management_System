// Read built source maps; report only counts/hashes, never bundled source or env values.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const dir = path.join(__dirname, '../client/build/static/js');
try {
    const maps = fs.readdirSync(dir).filter(name => name.endsWith('.js.map')).sort();
    if (!maps.length) throw new Error('NO_MAPS');
    let forbiddenSources = 0;
    const artifacts = maps.map(name => {
        const bytes = fs.readFileSync(path.join(dir, name));
        const map = JSON.parse(bytes);
        if (!Array.isArray(map.sources) || !map.sources.length) throw new Error('INCOMPLETE_MAP');
        forbiddenSources += map.sources.filter(source => /(?:firestore|(?:^|[/@-])grpc(?:[/.-]|$))/i.test(source)).length;
        return { file: name, sourceCount: map.sources.length, sha256: createHash('sha256').update(bytes).digest('hex') };
    });
    console.log(JSON.stringify({ status: forbiddenSources ? 'FAILED' : 'PASSED',
        check: 'No Firestore/gRPC module paths in all emitted JS source maps',
        forbiddenSources, artifacts,
        limitation: 'Only inspected emitted map source paths; not proof of absence from all assets or package safety.' }, null, 2));
    if (forbiddenSources) process.exitCode = 1;
} catch {
    console.log(JSON.stringify({ status: 'BLOCKED', code: 'BUILD_MAPS_MISSING_OR_UNREADABLE' }));
    process.exitCode = 1;
}
