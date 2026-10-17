import {useEffect, useState} from 'react';

export default function ConnectionNotice({loading}) {
    const [waiting, setWaiting] = useState(false);
    useEffect(() => {
        setWaiting(false);
        if (!loading) return;
        const timer = setTimeout(() => setWaiting(true), 8000);
        return () => clearTimeout(timer);
    }, [loading]);
    return waiting ? <p className="connection-notice" role="status">Still connecting. The first sign-in after a break can take about a minute. Please keep this page open.</p> : null;
}
