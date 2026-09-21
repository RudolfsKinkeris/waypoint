import { useEffect, useState } from 'react';

function HomePage() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    fetch('/api/hello')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage('Could not reach the server.'));
  }, []);

  return (
    <main className="app">
      <h1>Bootcamp App</h1>
      <p>{message}</p>
    </main>
  );
}

export default HomePage;
