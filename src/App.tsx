import { Routes, Route, Link } from 'react-router-dom';
import { ReviewPage } from './pages/ReviewPage';

function Home() {
  return (
    <div className="min-h-screen bg-obsidian text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Loom Initialized</h1>
      <Link 
        to="/review/test-share-token" 
        className="px-4 py-2 bg-hazard text-black font-bold rounded-lg hover:bg-hazard/80 transition-colors"
      >
        Go to Sample Review Page
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/review/:share_token" element={<ReviewPage />} />
    </Routes>
  );
}