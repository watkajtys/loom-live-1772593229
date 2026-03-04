import { Routes, Route, Link } from 'react-router-dom';
import ReviewConsole from './ReviewConsole';

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center space-y-4">
            <h1 className="text-4xl font-bold">Loom Initialized</h1>
            <Link 
              to="/review/test-project" 
              className="text-orange-500 hover:text-orange-400 underline underline-offset-4"
            >
              Go to Test Project Review Console
            </Link>
          </div>
        }
      />
      <Route path="/review/:slug" element={<ReviewConsole />} />
    </Routes>
  );
}
