import React, { useState } from "react";
import {
  categories,
  displayMode,
  difficultyLevel,
  quizType,
} from "../data/data";
import { useNavigate } from "react-router-dom";

export default function Quiz() {
  const [display, setDisplay] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");

  const navigate = useNavigate();
  function navigateWithParams({ mode, level, type, category }) {
    const searchParams = new URLSearchParams();
    if (mode) searchParams.set("mode", mode);
    if (level) searchParams.set("level", level);
    if (type) searchParams.set("type", type);
    if (category) searchParams.set("category", category);
    navigate(`/display?${searchParams.toString()}`);
  }

  function handleDisplayChange(e) {
    const selectedDisplay = e.target.value;
    setDisplay(selectedDisplay);
    navigateWithParams({ mode: selectedDisplay, level, type, category });
  }

  const handleLevelChange = (e) => {
    const selectedLevel = e.target.value;

    // Map the level to the correct difficulty ID for routing
    const difficultyMap = {
      Easy: "easy",
      Medium: "medium",
      Hard: "hard",
    };
    const difficultyId = difficultyMap[selectedLevel];

    if (difficultyId) {
      // Navigate to the difficulty route with the correct ID
      navigate(`/difficulty/${difficultyId}`);
    }

    // Update your local state if needed
    setLevel(selectedLevel);
  };

  function handleCategoryChange(e) {
    const category = e.target.value;
    navigate(`/category/${encodeURIComponent(category)}`);
  }

  return (
    <div className="flex min-h-screen flex-col gap-4 justify-center items-center bg-[#f9f9f9]">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">
          🎮 Start Your Quiz Here!
        </h2>
        <div className="flex flex-col lg:flex-row gap-4 mx-2">
          <select
            onChange={handleDisplayChange}
            value={display}
            defaultValue=""
            className="p-2 rounded border border-gray-300"
          >
            <option value="" disabled>
              Display Mode
            </option>
            {displayMode.map((mode) => (
              <option key={mode.id} value={mode.name}>
                {mode.name}
                {mode.emoji}
              </option>
            ))}
          </select>

          <select
            onChange={handleLevelChange}
            value={level}
            defaultValue=""
            className="p-2 rounded border border-gray-300"
          >
            <option value="" disabled>
              Difficulty Level
            </option>
            {difficultyLevel.map((level) => (
              <option key={level.id} value={level.levelOption}>
                {level.levelOption}
                {level.emoji}
              </option>
            ))}
          </select>

          <select
            onChange={handleCategoryChange}
            value={category}
            defaultValue=""
            className="p-2 rounded border border-gray-300"
          >
            <option value="" disabled>
              Categories
            </option>
            {categories.map((option) => (
              <option key={option.id} value={option.categoryOption}>
                {option.categoryOption}
                {option.emoji}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
