import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TestCasesPage from './pages/TestCasesPage.jsx';
import ImportTestCasesPage from './pages/ImportTestCasesPage.jsx';
import TestSuitesPage from './pages/TestSuitesPage.jsx';
import SuiteDetailPage from './pages/SuiteDetailPage.jsx';
import BugsPage from './pages/BugsPage.jsx';
import BugDetailPage from './pages/BugDetailPage.jsx';
import TestRunsPage from './pages/TestRunsPage.jsx';
import TestRunDetailPage from './pages/TestRunDetailPage.jsx';
import FlakyTestsPage from './pages/FlakyTestsPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import ReportDetailPage from './pages/ReportDetailPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import KeyboardShortcuts from './components/KeyboardShortcuts.jsx';
import TopNav from './components/TopNav.jsx';

function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <KeyboardShortcuts />
        <TopNav />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/test-cases" element={<TestCasesPage />} />
          <Route path="/test-cases/import" element={<ImportTestCasesPage />} />
          <Route path="/test-suites" element={<TestSuitesPage />} />
          <Route path="/test-suites/:id" element={<SuiteDetailPage />} />
          <Route path="/bugs" element={<BugsPage />} />
          <Route path="/bugs/:id" element={<BugDetailPage />} />
          <Route path="/test-runs" element={<TestRunsPage />} />
          <Route path="/test-runs/:id" element={<TestRunDetailPage />} />
          <Route path="/flaky-tests" element={<FlakyTestsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/:id" element={<ReportDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}

export default App;
