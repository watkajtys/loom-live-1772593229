import { Routes, Route, Link } from 'react-router-dom';
import ReviewPage from './pages/ReviewPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={
        <div className="min-h-screen bg-obsidian text-ghost-white flex flex-col items-center justify-center space-y-4">
          <h1 className="text-4xl font-bold font-sans">CORE Initialized</h1>
          <Link to="/review/test-project" className="text-industrial-orange hover:text-industrial-orange/80 underline font-mono">
            Go to Review Page
          </Link>
        </div>
      } />
      <Route path="/review/:slug" element={<ReviewPage />} />
    </Routes>
  );
}
