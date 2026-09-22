import { useEffect, useState } from 'react';

function HomePage() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    let ignore = false;

    fetch('/api/hello')
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) setMessage(data.message);
      })
      .catch(() => {
        if (!ignore) setMessage('Could not reach the server.');
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="test-cases-page">
      <div className="home-hero">
        <img src="/logo.svg" alt="" width="40" height="40" />
        <h1>Waypoint</h1>
      </div>
      <p>{message}</p>
    </main>
  );
}

export default HomePage;
