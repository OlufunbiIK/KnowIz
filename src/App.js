import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Intro from "./components/Intro";
import Quiz from "./components/Quiz";
import Display from "./components/Display";
import Signup from "./pages/SignUp";
import Login from "./pages/Login";
import ScoreHistory from "./pages/ScoreHistory";

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/intro" element={<Intro />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/display" element={<Display />} />
          <Route path="/scores" element={<ScoreHistory />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
