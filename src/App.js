import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Intro from "./components/Intro";
import Quiz from "./components/Quiz";
import Display from "./components/Display";
import IntegratedCategoryPage from "./components/category/AllCategories";
import IntegratedDifficultyPage from "./components/level/AllLevels";

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Intro />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/display" element={<Display />} />
          <Route path="/category/:name" element={<IntegratedCategoryPage />} />
          <Route
            path="/difficulty/:level"
            element={<IntegratedDifficultyPage />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
