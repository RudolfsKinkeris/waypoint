import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAll } from '../api/search-api.js';

const TYPE_LABELS = { test_case: 'Test Case', bug: 'Bug', suite: 'Suite' };
const DEBOUNCE_MS = 200;

function resultHref(item) {
  if (item.type === 'bug') return `/bugs/${item.id}`;
  if (item.type === 'suite') return `/test-suites/${item.id}`;
  return '/test-cases';
}

function QuickSearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      searchAll(trimmed)
        .then((data) => {
          setResults(data.items);
          setActiveIndex(0);
        })
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  function go(item) {
    navigate(resultHref(item));
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      go(results[activeIndex]);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal quick-search-modal" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          aria-label="Search test cases, bugs, and suites"
          placeholder="Search test cases, bugs, suites..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <ul className="quick-search-results">
          {loading && <li className="quick-search-empty">Searching...</li>}
          {!loading && query.trim() && results.length === 0 && (
            <li className="quick-search-empty">No results.</li>
          )}
          {!loading &&
            results.map((item, i) => (
              <li key={`${item.type}-${item.id}`}>
                <button
                  type="button"
                  className={`quick-search-result${i === activeIndex ? ' active' : ''}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => go(item)}
                >
                  <span className="quick-search-type">{TYPE_LABELS[item.type]}</span>
                  <span className="quick-search-title">{item.title}</span>
                  {item.subtitle && <span className="quick-search-subtitle">{item.subtitle}</span>}
                </button>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

export default QuickSearchModal;
