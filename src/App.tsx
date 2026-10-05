import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import Dashboard from './pages/Dashboard';
import NewReview from './pages/NewReview';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import ScanHistory from './pages/ScanHistory';
import ScanResults from './pages/ScanResults';
import Vulnerabilities from './pages/Vulnerabilities';
import FindingDetails from './pages/FindingDetails';
import Recommendations from './pages/Recommendations';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import SecurityRules from './pages/SecurityRules';
import SecureCodingGuide from './pages/SecureCodingGuide';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="new-scan" element={<NewReview />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:projectId" element={<ProjectDetails />} />
            <Route path="scan-history" element={<ScanHistory />} />
            <Route path="scans/:scanId" element={<ScanResults />} />
            <Route path="findings" element={<Vulnerabilities />} /> 
            <Route path="manual-review" element={<Navigate to="/findings" replace />} /> 
            <Route path="findings/:findingId" element={<FindingDetails />} />
            <Route path="recommendations" element={<Recommendations />} />
            <Route path="reports" element={<Reports />} />
            <Route path="security-rules" element={<SecurityRules />} />
            <Route path="secure-coding-guide" element={<SecureCodingGuide />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
