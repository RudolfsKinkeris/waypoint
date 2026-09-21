import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import TestCasesPage from './pages/TestCasesPage.jsx';
import TestSuitesPage from './pages/TestSuitesPage.jsx';
import SuiteDetailPage from './pages/SuiteDetailPage.jsx';
import BugsPage from './pages/BugsPage.jsx';
import BugDetailPage from './pages/BugDetailPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <nav className="top-nav">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/test-cases">Test Cases</NavLink>
        <NavLink to="/test-suites">Test Suites</NavLink>
        <NavLink to="/bugs">Bugs</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/test-cases" element={<TestCasesPage />} />
        <Route path="/test-suites" element={<TestSuitesPage />} />
        <Route path="/test-suites/:id" element={<SuiteDetailPage />} />
        <Route path="/bugs" element={<BugsPage />} />
        <Route path="/bugs/:id" element={<BugDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
