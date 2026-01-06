import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LiveScoring from "./pages/LiveScoring";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
      <div className="text-center text-white p-8">
        <h1 className="text-4xl font-bold text-cyan-400 mb-4">Cricket Match Platform</h1>
        <p className="text-xl text-gray-300 mb-8">Live Match Scoring Engine</p>
        <a 
          href="/live-scoring" 
          className="inline-block bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
        >
          Go to Live Scoring (Page 4)
        </a>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/live-scoring" element={<LiveScoring />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
