import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Overview } from './pages/Overview';
import { RaceWeekend } from './pages/RaceWeekend';
import { Drivers } from './pages/Drivers';
import { Constructors } from './pages/Constructors';
import { Historical } from './pages/Historical';
import { Predictions } from './pages/Predictions';
import { Settings } from './pages/Settings';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <MainLayout>
          <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/race-weekend" element={<RaceWeekend />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/constructors" element={<Constructors />} />
          <Route path="/historical" element={<Historical />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

