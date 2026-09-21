import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TestCasesPage from './pages/TestCasesPage.jsx';
import TestSuitesPage from './pages/TestSuitesPage.jsx';
import SuiteDetailPage from './pages/SuiteDetailPage.jsx';
import BugsPage from './pages/BugsPage.jsx';
import BugDetailPage from './pages/BugDetailPage.jsx';
import TestRunsPage from './pages/TestRunsPage.jsx';
import TestRunDetailPage from './pages/TestRunDetailPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import ReportDetailPage from './pages/ReportDetailPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <nav className="top-nav">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/test-cases">Test Cases</NavLink>
        <NavLink to="/test-suites">Test Suites</NavLink>
        <NavLink to="/bugs">Bugs</NavLink>
        <NavLink to="/test-runs">Test Runs</NavLink>
        <NavLink to="/reports">Reports</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/test-cases" element={<TestCasesPage />} />
        <Route path="/test-suites" element={<TestSuitesPage />} />
        <Route path="/test-suites/:id" element={<SuiteDetailPage />} />
        <Route path="/bugs" element={<BugsPage />} />
        <Route path="/bugs/:id" element={<BugDetailPage />} />
        <Route path="/test-runs" element={<TestRunsPage />} />
        <Route path="/test-runs/:id" element={<TestRunDetailPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:id" element={<ReportDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
