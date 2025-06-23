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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [shuffledOptions, setShuffledOptions] = useState({}); // Store shuffled options
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const abortControllerRef = useRef(null);
  const lastFetchedDifficulty = useRef(null);

  // Find difficulty object by either id or name
  const difficultyObj = difficultyLevel.find(
    (diff) =>
      diff.name.toLowerCase() === selectedDifficulty?.toLowerCase() ||
      diff.id === selectedDifficulty?.toLowerCase()
  );

  // Function to shuffle options once when data is loaded
  const shuffleOptionsForQuestions = useCallback((questions) => {
    const shuffled = {};
    questions.forEach((question, index) => {
      if (question.type === "multiple") {
        const options = [
          ...question.incorrect_answers,
          question.correct_answer,
        ];
        // Create a shuffled version using a seeded random approach
        const shuffledArray = [...options].sort(() => Math.random() - 0.5);
        shuffled[index] = shuffledArray;
      } else {
        shuffled[index] = ["True", "False"];
      }
    });
    return shuffled;
  }, []);

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
      setShowResults(false); // Reset results when fetching new data
      setQuizResults(null);

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
          const questions = result.results || [];
          setData(questions);
          setShuffledOptions(shuffleOptionsForQuestions(questions)); // Shuffle once
          setCurrentQuestionIndex(0);
          setSelectedAnswers({});
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
    [difficultyObj, selectedDifficulty, data, shuffleOptionsForQuestions]
  );

  useEffect(() => {
    if (
      selectedDifficulty &&
      selectedDifficulty !== lastFetchedDifficulty.current
    ) {
      setData(null);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShuffledOptions({});
      fetchDifficultyData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedDifficulty, fetchDifficultyData]);

  const handleAnswerSelect = (questionIndex, answer) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < data.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateResults = () => {
    let correctCount = 0;
    const results = data.map((question, index) => {
      const userAnswer = selectedAnswers[index];
      const correctAnswer = question.correct_answer;
      const isCorrect = userAnswer === correctAnswer;

      if (isCorrect) correctCount++;

      return {
        question: question.question,
        category: question.category,
        difficulty: question.difficulty,
        type: question.type,
        correctAnswer,
        userAnswer: userAnswer || "Not answered",
        isCorrect,
        options: shuffledOptions[index] || [],
      };
    });

    const percentage = Math.round((correctCount / data.length) * 100);

    return {
      totalQuestions: data.length,
      correctAnswers: correctCount,
      wrongAnswers: data.length - correctCount,
      percentage,
      results,
    };
  };

  const handleSubmitQuiz = () => {
    const results = calculateResults();
    setQuizResults(results);
    setShowResults(true);
  };

  const handleRetakeQuiz = () => {
    setShowResults(false);
    setQuizResults(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    // Keep the same data, just reset the user's progress
  };

  const handleGoHome = () => {
    // This would use React Router's navigate
    window.location.href = "/quiz";
  };

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
          setCurrentQuestionIndex(0);
          setSelectedAnswers({});
          setShuffledOptions({});
          setShowResults(false);
          setQuizResults(null);
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

      {/* Quiz Results */}
      {showResults && quizResults && (
        <div className="space-y-6">
          {/* Results Summary */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Quiz Results
              </h2>
              <div
                className={`text-6xl font-bold mb-4 ${
                  quizResults.percentage >= 80
                    ? "text-green-600"
                    : quizResults.percentage >= 60
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {quizResults.percentage}%
              </div>
              <p className="text-lg text-gray-600">
                You scored {quizResults.correctAnswers} out of{" "}
                {quizResults.totalQuestions} questions correctly
              </p>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {quizResults.correctAnswers}
                </div>
                <div className="text-sm text-green-700">Correct</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {quizResults.wrongAnswers}
                </div>
                <div className="text-sm text-red-700">Wrong</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {quizResults.totalQuestions}
                </div>
                <div className="text-sm text-blue-700">Total</div>
              </div>
            </div>

            {/* Performance Message */}
            <div className="text-center p-4 rounded-lg mb-6 bg-gray-50">
              {quizResults.percentage >= 80 && (
                <p className="text-green-700 font-medium">
                  🎉 Excellent work! You have a great understanding of this
                  topic.
                </p>
              )}
              {quizResults.percentage >= 60 && quizResults.percentage < 80 && (
                <p className="text-yellow-700 font-medium">
                  👍 Good job! You're on the right track, keep practicing.
                </p>
              )}
              {quizResults.percentage < 60 && (
                <p className="text-red-700 font-medium">
                  💪 Keep learning! Review the topics and try again.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRetakeQuiz}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Retake Quiz
              </button>
              <button
                onClick={handleGoHome}
                className="px-6 py-3 bg-[#0c1125] text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Go Home
              </button>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Question Review
            </h3>
            <div className="space-y-4">
              {quizResults.results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    result.isCorrect
                      ? "bg-green-50 border-green-500"
                      : "bg-red-50 border-red-500"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Question {index + 1}
                    </span>
                    <div className="flex gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          result.isCorrect
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {result.isCorrect ? "✓ Correct" : "✗ Wrong"}
                      </span>
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs capitalize">
                        {result.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="mb-2">
                    <span className="text-xs text-gray-500 font-medium">
                      Category: {result.category}
                    </span>
                  </div>

                  <p
                    className="font-medium text-gray-800 mb-3"
                    dangerouslySetInnerHTML={{ __html: result.question }}
                  />

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">
                        Your answer:
                      </span>
                      <span
                        className={`font-medium ${
                          result.isCorrect ? "text-green-700" : "text-red-700"
                        }`}
                        dangerouslySetInnerHTML={{ __html: result.userAnswer }}
                      />
                    </div>
                    {!result.isCorrect && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">
                          Correct answer:
                        </span>
                        <span
                          className="font-medium text-green-700"
                          dangerouslySetInnerHTML={{
                            __html: result.correctAnswer,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
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

      {data && data.length > 0 && !showResults && (
        <div className="space-y-4">
          {/* Question Progress */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-700">
              Question {currentQuestionIndex + 1} of {data.length}
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#0c1125] h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      ((currentQuestionIndex + 1) / data.length) * 100
                    }%`,
                  }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">
                {Math.round(((currentQuestionIndex + 1) / data.length) * 100)}%
              </span>
            </div>
          </div>

          {/* Current Question */}
          {data[currentQuestionIndex] && (
            <div
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
                  Question {currentQuestionIndex + 1}
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
                    {data[currentQuestionIndex].difficulty}
                  </span>
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded capitalize">
                    {data[currentQuestionIndex].type}
                  </span>
                </div>
              </div>

              {/* Category - Responsive display */}
              <div className="mb-2">
                <span className="text-xs text-gray-500 font-medium">
                  Category:
                  <span className="hidden sm:inline">
                    {" "}
                    {data[currentQuestionIndex].category}
                  </span>
                  <span className="sm:hidden block mt-1 text-gray-700 text-sm">
                    {data[currentQuestionIndex].category}
                  </span>
                </span>
              </div>

              <p
                className="font-medium text-gray-800 mb-4 text-lg"
                dangerouslySetInnerHTML={{
                  __html: data[currentQuestionIndex].question,
                }}
              />

              {/* Display answer options using pre-shuffled options */}
              <div className="mt-3 space-y-3">
                {shuffledOptions[currentQuestionIndex]?.map(
                  (option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`flex items-center p-2 rounded border transition-colors cursor-pointer ${
                        selectedAnswers[currentQuestionIndex] === option
                          ? "bg-blue-50 border-blue-300"
                          : "bg-white hover:bg-gray-50"
                      }`}
                      onClick={() =>
                        handleAnswerSelect(currentQuestionIndex, option)
                      }
                    >
                      <input
                        type="radio"
                        id={`q${currentQuestionIndex}_option${optionIndex}`}
                        name={`question_${currentQuestionIndex}`}
                        value={option}
                        checked={
                          selectedAnswers[currentQuestionIndex] === option
                        }
                        onChange={() =>
                          handleAnswerSelect(currentQuestionIndex, option)
                        }
                        className="mr-3 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`q${currentQuestionIndex}_option${optionIndex}`}
                        className="text-gray-700 cursor-pointer flex-1 font-medium"
                        dangerouslySetInnerHTML={{ __html: option }}
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-6">
            {/* <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 hover:bg-[#1f2c63] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-[#0c1125] transition-colors"
            >
              Previous
            </button> */}

            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className={`px-6 py-2 rounded-lg text-white font-semibold shadow-md transition-all duration-200 transform hover:scale-105 bg-gradient-to-r ${
                difficultyObj?.id === "easy"
                  ? "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  : difficultyObj?.id === "medium"
                  ? "from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                  : "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Previous
            </button>

            {/* Numbered Navigation Buttons */}
            <div className="hidden md:flex items-center gap-1 sm:gap-2 overflow-x-auto max-w-xs sm:max-w-none">
              {data.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`min-w-[28px] h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium transition-colors flex-shrink-0 ${
                    index === currentQuestionIndex
                      ? "bg-[#0c1125] text-white"
                      : selectedAnswers[index]
                      ? "bg-green-200 text-green-800"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestionIndex === data.length - 1 && !showResults ? (
              <button
                onClick={handleSubmitQuiz}
                className="px-4 py-2 bg-[#0c1125] text-white rounded-lg hover:bg-[#1f2c63] transition-colors font-semibold"
              >
                ✅ Submit Quiz
              </button>
            ) : (
              // <button
              //   onClick={handleNextQuestion}
              //   disabled={currentQuestionIndex === data.length - 1}
              //   className="px-4 py-2 bg-[#0c1125] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1f2c63] transition-colors"
              // >
              //   Next
              // </button>

              <button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === data.length - 1}
                className={`px-6 py-2 rounded-lg text-white font-semibold shadow-md transition-all duration-200 transform hover:scale-105 bg-gradient-to-r ${
                  difficultyObj?.id === "easy"
                    ? "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    : difficultyObj?.id === "medium"
                    ? "from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                    : "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Next
              </button>
            )}
          </div>
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

  // Get the selected difficulty object for small/medium screens
  const selectedDifficultyObj = difficultyLevel.find(
    (diff) => diff.name === difficulty
  );

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

        {/* Difficulty level cards - only show on large screens */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-4 mb-6">
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

        {/* Selected difficulty card for small/medium screens */}
        {selectedDifficultyObj && (
          <div className="lg:hidden mb-6">
            <div
              className={`p-4 rounded-lg bg-gradient-to-r ${selectedDifficultyObj.color} text-white shadow-lg`}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">
                  {selectedDifficultyObj.emoji}
                </div>
                <h3 className="text-xl font-bold mb-1">
                  {selectedDifficultyObj.name}
                </h3>
                <p className="text-sm opacity-90">
                  {selectedDifficultyObj.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Show difficulty content */}
        <DifficultyContent selectedDifficulty={difficulty} />
      </div>
    </div>
  );
};

export default IntegratedDifficultyPage;
