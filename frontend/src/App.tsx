import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';

const App: React.FC = () => {
  // Global Anti-Inspect & Security Protection
  useEffect(() => {
    // 1. Disable Right-Click Context Menu across the entire application
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Disable DevTools & Inspect Keyboard Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
      }

      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      // Ctrl + Shift + I (Inspect Elements)
      // Ctrl + Shift + J (Open Console)
      // Ctrl + Shift + C (Inspect Element Picker)
      if (ctrlOrCmd && e.shiftKey && (
        e.key === 'I' || e.key === 'i' ||
        e.key === 'J' || e.key === 'j' ||
        e.key === 'C' || e.key === 'c'
      )) {
        e.preventDefault();
        return false;
      }

      // Ctrl + U (View Page Source)
      if (ctrlOrCmd && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        return false;
      }

      // Ctrl + S (Save Webpage)
      if (ctrlOrCmd && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
          {/* Shared Header Navigation */}
          <Navbar />
          
          {/* Main App Page Views */}
          <main style={{ flex: 1, position: 'relative', width: '100%' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register/:eventSlug" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
