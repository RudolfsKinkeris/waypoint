import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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

      <div className="view-section">
        <h3>What you can do</h3>
        <ul>
          <li>
            Write <Link to="/test-cases">test cases</Link> and group them into <Link to="/test-suites">suites</Link>.
          </li>
          <li>Run a suite and record pass/fail/skip results as you go.</li>
          <li>File a <Link to="/bugs">bug</Link> straight from a failed test, with severity and priority.</li>
          <li>
            Track <Link to="/flaky-tests">flaky tests</Link> automatically, each with an AI-written guess at the
            cause.
          </li>
          <li>Generate a shareable <Link to="/reports">report</Link> after any run.</li>
        </ul>
      </div>

      <div className="view-section">
        <h3>What you get</h3>
        <ul>
          <li>
            One <Link to="/dashboard">dashboard</Link> showing pass rate, open bugs, and flaky tests at a glance.
          </li>
          <li>A Discord alert the moment a test starts failing or turns flaky.</li>
          <li>A record of every run, so "did this ever pass?" has an actual answer.</li>
        </ul>
      </div>
    </main>
  );
}

export default HomePage;
