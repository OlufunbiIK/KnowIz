import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { difficultyLevel } from "../../data/data";

// Rate limiter class remains the same
class RateLimiter {
  constructor(maxRequests = 1, timeWindow = 6000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  async waitForSlot() {
    const now = Date.now();
    this.requests = this.requests.filter(
      (time) => now - time < this.timeWindow
    );

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest);

      if (waitTime > 0) {
        console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    this.requests.push(Date.now());
  }
}

const rateLimiter = new RateLimiter();

const DifficultyContent = ({ selectedDifficulty }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const lastFetchedDifficulty = useRef(null);

  // Find difficulty object by either id or name
  const difficultyObj = difficultyLevel.find(
    (diff) =>
      diff.name.toLowerCase() === selectedDifficulty?.toLowerCase() ||
      diff.id === selectedDifficulty?.toLowerCase()
  );

  const fetchDifficultyData = useCallback(
    async (retryCount = 0) => {
      if (!difficultyObj || !selectedDifficulty) return;

      if (data && lastFetchedDifficulty.current === selectedDifficulty) {
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        await rateLimiter.waitForSlot();

        console.log(`Fetching ${selectedDifficulty} difficulty questions`);

        const response = await fetch(
          `https://opentdb.com/api.php?amount=10&difficulty=${difficultyObj.id}`,
          {
            signal: abortControllerRef.current.signal,
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (response.status === 429) {
          if (retryCount < 2) {
            const waitTime = Math.min(10000 * (retryCount + 1), 30000);
            console.warn(
              `Rate limited. Retrying in ${waitTime}ms... (attempt ${
                retryCount + 1
              })`
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            return fetchDifficultyData(retryCount + 1);
          } else {
            throw new Error(
              "Rate limit exceeded. Please wait a few minutes before trying again."
            );
          }
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch data`);
        }

        const result = await response.json();

        if (result.response_code === 0) {
          setData(result.results || []);
          lastFetchedDifficulty.current = selectedDifficulty;
        } else {
          throw new Error(
            `API Error: ${
              result.response_code === 1
                ? "No results found"
                : "Invalid parameters"
            }`
          );
        }
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("Request was cancelled");
          return;
        }
        console.error("Fetch error:", err);
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    },
    [difficultyObj, selectedDifficulty, data]
  );

  useEffect(() => {
    if (
      selectedDifficulty &&
      selectedDifficulty !== lastFetchedDifficulty.current
    ) {
      setData(null);
      fetchDifficultyData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedDifficulty, fetchDifficultyData]);

  if (!selectedDifficulty) {
    return (
      <div className="p-8 text-center text-gray-500">
        Please select a difficulty level to view questions
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm mt-4">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{difficultyObj?.emoji}</span>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {difficultyObj?.name}
          </h2>
          <p className="text-gray-600 text-sm">{difficultyObj?.description}</p>
        </div>
      </div>

      <button
        onClick={() => {
          setData(null);
          lastFetchedDifficulty.current = null;
          fetchDifficultyData();
        }}
        disabled={loading}
        className={`mb-4 bg-gradient-to-r ${difficultyObj?.color} text-white rounded-lg px-6 py-4 disabled:opacity-50 hover:opacity-90 transition-opacity font-medium`}
      >
        {loading ? "Loading..." : `Load ${difficultyObj?.name} Questions`}
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
          {error.includes("Rate limit") && (
            <p className="text-sm mt-2">
              The API has rate limits. Please wait a few minutes before trying
              again.
            </p>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
          <span className="ml-2 text-gray-600">
            Fetching {difficultyObj?.name?.toLowerCase()} questions...
          </span>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">
              {difficultyObj?.name} Questions ({data.length}):
            </h3>
            <div className="flex gap-2 text-xs">
              {data
                .map((item) => item.category)
                .filter((cat, index, arr) => arr.indexOf(cat) === index)
                .map((category, i) => (
                  <span
                    key={i}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                  >
                    {category}
                  </span>
                ))}
            </div>
          </div>

          {data.map((item, index) => (
            <div
              key={index}
              className={`p-4 bg-gradient-to-r ${difficultyObj?.color} bg-opacity-5 rounded-lg border-l-4 border-gray-400 hover:shadow-md transition-shadow`}
              style={{
                borderLeftColor:
                  difficultyObj?.id === "easy"
                    ? "#10b981"
                    : difficultyObj?.id === "medium"
                    ? "#f59e0b"
                    : "#ef4444",
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-600">
                  Question {index + 1}
                </span>
                <div className="flex gap-2 text-xs">
                  <span
                    className={`px-2 py-1 rounded capitalize font-medium ${
                      difficultyObj?.id === "easy"
                        ? "bg-green-100 text-green-800"
                        : difficultyObj?.id === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.difficulty}
                  </span>
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded capitalize">
                    {item.type}
                  </span>
                </div>
              </div>

              <div className="mb-2">
                <span className="text-xs text-gray-500 font-medium">
                  Category: {item.category}
                </span>
              </div>

              <p
                className="font-medium text-gray-800 mb-4 text-lg"
                dangerouslySetInnerHTML={{ __html: item.question }}
              />

              {/* Display answer options */}
              <div className="mt-3 space-y-3">
                {item.type === "multiple"
                  ? [...item.incorrect_answers, item.correct_answer]
                      .sort(() => Math.random() - 0.5)
                      .map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className="flex items-center p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="radio"
                            id={`q${index}_option${optionIndex}`}
                            name={`question_${index}`}
                            value={option}
                            className="mr-3 text-blue-600 focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`q${index}_option${optionIndex}`}
                            className="text-gray-700 cursor-pointer flex-1 font-medium"
                            dangerouslySetInnerHTML={{ __html: option }}
                          />
                        </div>
                      ))
                  : ["True", "False"].map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="flex items-center p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="radio"
                          id={`q${index}_option${optionIndex}`}
                          name={`question_${index}`}
                          value={option}
                          className="mr-3 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`q${index}_option${optionIndex}`}
                          className="text-gray-700 cursor-pointer flex-1 font-medium"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No questions found for this difficulty level.
        </div>
      )}
    </div>
  );
};

export const IntegratedDifficultyPage = () => {
  const { level } = useParams();
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState("");

  useEffect(() => {
    if (level) {
      // Handle both URL parameter formats (easy/medium/hard or Easy/Medium/Hard)
      const decodedLevel = decodeURIComponent(level);
      const matchedDifficulty = difficultyLevel.find(
        (diff) =>
          diff.id === decodedLevel.toLowerCase() ||
          diff.name.toLowerCase() === decodedLevel.toLowerCase()
      );

      if (matchedDifficulty) {
        setDifficulty(matchedDifficulty.name);
      }
    }
  }, [level]);

  const handleDifficultyChange = (e) => {
    const newDifficulty = e.target.value;
    setDifficulty(newDifficulty);

    // Find the difficulty object to get its ID for URL
    const difficultyObj = difficultyLevel.find(
      (diff) => diff.name === newDifficulty
    );
    if (difficultyObj) {
      navigate(`/difficulty/${difficultyObj.id}`);
    }
  };

  const handleCardClick = (levelObj) => {
    setDifficulty(levelObj.name);
    navigate(`/difficulty/${levelObj.id}`);
  };

  return (
    <div className="min-h-screen pt-[10rem] bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Quiz Difficulty Level
        </h1>

        {/* Dropdown to switch difficulty */}
        <div className="mb-4">
          <label
            htmlFor="difficulty-select"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select Difficulty Level:
          </label>
          <select
            id="difficulty-select"
            onChange={handleDifficultyChange}
            value={difficulty}
            className="p-3 rounded-lg border border-gray-300 w-full bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="" disabled>
              Choose difficulty level...
            </option>
            {difficultyLevel.map((option) => (
              <option key={option.id} value={option.name}>
                {option.emoji} {option.name} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty level cards for visual selection */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {difficultyLevel.map((level) => (
            <div
              key={level.id}
              onClick={() => handleCardClick(level)}
              className={`p-4 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-105 bg-gradient-to-r ${
                level.color
              } text-white shadow-lg ${
                difficulty === level.name ? "ring-4 ring-white" : ""
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">{level.emoji}</div>
                <h3 className="text-xl font-bold mb-1">{level.name}</h3>
                <p className="text-sm opacity-90">{level.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Show difficulty content */}
        <DifficultyContent selectedDifficulty={difficulty} />
      </div>
    </div>
  );
};

export default IntegratedDifficultyPage;
