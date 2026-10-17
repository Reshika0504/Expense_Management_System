import React from 'react';

export default function Spinner() {
    return <div className="loading-indicator" role="status"><span className="loading-ring" aria-hidden="true" /><span>Opening your space…</span></div>;
}
