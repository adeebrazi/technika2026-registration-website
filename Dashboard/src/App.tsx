
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnalyticsView } from './pages/Analytics';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AnalyticsView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
