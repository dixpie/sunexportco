'use client';
export default function AdminError({ reset }) { return <main className="container section"><h1>Administration unavailable</h1><p>Check MongoDB connectivity and server configuration, then retry.</p><button className="button" onClick={reset}>Try again</button></main>; }
