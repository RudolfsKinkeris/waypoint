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
    <main className="app">
      <h1>Bootcamp App</h1>
      <p>{message}</p>
    </main>
  );
}

export default HomePage;
