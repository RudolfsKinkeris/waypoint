import { useCallback, useEffect, useState } from 'react';

function HomePage() {
  const [message, setMessage] = useState('Loading...');
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setMessage('Loading...');
    setFailed(false);
    let ignore = false;

    fetch('/api/hello')
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (ignore) return;
        if (data.message) setMessage(data.message);
        else throw new Error('Unexpected response from server');
      })
      .catch(() => {
        if (ignore) return;
        setMessage("Couldn't load the greeting from the server.");
        setFailed(true);
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  return (
    <main className="test-cases-page">
      <div className="home-hero">
        <img src="/logo.svg" alt="" width="40" height="40" />
        <h1>Waypoint</h1>
      </div>
      <p aria-live="polite">{message}</p>
      {failed && (
        <button className="secondary" onClick={load}>
          Retry
        </button>
      )}
    </main>
  );
}

export default HomePage;
