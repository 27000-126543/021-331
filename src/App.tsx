import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ModelPage from '@/pages/ModelPage';
import IssuesPage from '@/pages/IssuesPage';
import ReviewPage from '@/pages/ReviewPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/model" replace />} />
        <Route path="/model" element={<ModelPage />} />
        <Route path="/issues" element={<IssuesPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="*" element={<Navigate to="/model" replace />} />
      </Routes>
    </Router>
  );
}
