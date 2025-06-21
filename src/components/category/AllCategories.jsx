import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { categories } from "../../data/data";

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
      const oldest = Math.min(...this.requests);
      const wait = this.timeWindow - (now - oldest);
      if (wait > 0) await new Promise((res) => setTimeout(res, wait));
    }

    this.requests.push(Date.now());
  }
}

const rateLimiter = new RateLimiter();

const CategoryContent = ({ selectedCategory }) => {
  const [data, setData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [shuffledOptions, setShuffledOptions] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const lastFetchedCategory = useRef(null);

  const categoryObj = categories.find(
    (cat) => cat.categoryOption === selectedCategory
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
        const shuffledArray = [...options].sort(() => Math.random() - 0.5);
        shuffled[index] = shuffledArray;
      } else {
        // For boolean questions
        shuffled[index] = ["True", "False"];
      }
    });
    return shuffled;
  }, []);

  const fetchCategoryData = useCallback(
    async (retryCount = 0) => {
      if (!categoryObj || !selectedCategory) return;
      if (data && lastFetchedCategory.current === selectedCategory) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setShuffledOptions({});
      setShowResults(false);
      setQuizResults(null);

      try {
        await rateLimiter.waitForSlot();

        const response = await fetch(
          `https://opentdb.com/api.php?amount=10&category=${categoryObj.id}`,
          {
            signal: abortControllerRef.current.signal,
            headers: { Accept: "application/json" },
          }
        );

        if (response.status === 429 && retryCount < 2) {
          const waitTime = Math.min(10000 * (retryCount + 1), 30000);
          await new Promise((res) => setTimeout(res, waitTime));
          return fetchCategoryData(retryCount + 1);
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch data`);
        }

        const result = await response.json();

        if (result.response_code === 0) {
          const fetchedQuestions = result.results || [];
          setData(fetchedQuestions);
          setShuffledOptions(shuffleOptionsForQuestions(fetchedQuestions));
          setCurrentIndex(0);
          lastFetchedCategory.current = selectedCategory;
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
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to fetch data");
        }
      } finally {
        setLoading(false);
      }
    },
    [categoryObj, selectedCategory, data, shuffleOptionsForQuestions]
  );

  useEffect(() => {
    if (selectedCategory && selectedCategory !== lastFetchedCategory.current) {
      setData(null);
      fetchCategoryData();
    }

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [selectedCategory, fetchCategoryData]);

  const handleAnswerSelect = (questionIndex, answer) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentIndex < data.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
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
    setCurrentIndex(0);
    setSelectedAnswers({});
    setData(null);
    lastFetchedCategory.current = null;
    fetchCategoryData();
  };

  const handleGoHome = () => {
    window.location.href = "/quiz";
  };

  if (!selectedCategory) {
    return (
      <div className="p-8 text-center text-gray-500">
        Please select a category to view content
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ba4a]"></div>
        <span className="ml-2 text-gray-600">Fetching questions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p className="font-medium">Error:</p>
        <p>{error}</p>
        <button
          onClick={() => fetchCategoryData()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Quiz Results Display
  if (showResults && quizResults) {
    return (
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
                🎉 Excellent work! You have a great understanding of this topic.
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
              className="px-6 py-3 bg-[#00ba4a] text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
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
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm mt-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{categoryObj?.emoji}</span>
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedCategory}
          </h2>
        </div>

        <button
          onClick={() => {
            setData(null);
            lastFetchedCategory.current = null;
            fetchCategoryData();
          }}
          disabled={loading}
          className="mb-4 bg-gradient-to-r from-[#00ba4a] to-[#00e6b5] text-white rounded-lg px-6 py-4 disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {loading ? "Loading..." : `Load ${selectedCategory} Questions`}
        </button>

        {!loading && (
          <div className="text-center py-8 text-gray-500">
            No questions found for this category.
          </div>
        )}
      </div>
    );
  }

  const currentQuestion = data[currentIndex];
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm mt-4 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{categoryObj?.emoji}</span>
        <h2 className="text-2xl font-bold text-gray-800">{selectedCategory}</h2>
      </div>

      {/* Question Progress */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-700">
          Question {currentIndex + 1} of {data.length}
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#00ba4a] h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / data.length) * 100}%`,
              }}
            ></div>
          </div>
          <span className="text-sm text-gray-600">
            {Math.round(((currentIndex + 1) / data.length) * 100)}%
          </span>
        </div>
      </div>

      {/* Current Question */}
      <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
        <div className="flex justify-between items-start mb-3">
          <span className="text-sm font-medium text-gray-600">
            Question {currentIndex + 1}
          </span>
          <div className="flex gap-2 text-xs">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
              {currentQuestion.difficulty}
            </span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded capitalize">
              {currentQuestion.type}
            </span>
          </div>
        </div>

        <h3
          className="text-lg font-semibold text-gray-800 mb-4"
          dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
        />

        {/* Answer Options */}
        <div className="space-y-3">
          {shuffledOptions[currentIndex]?.map((option, optionIndex) => (
            <div
              key={optionIndex}
              className={`flex items-center p-3 rounded border transition-colors cursor-pointer ${
                selectedAnswers[currentIndex] === option
                  ? "bg-blue-100 border-blue-300"
                  : "bg-white hover:bg-gray-50"
              }`}
              onClick={() => handleAnswerSelect(currentIndex, option)}
            >
              <input
                type="radio"
                id={`q${currentIndex}_option${optionIndex}`}
                name={`question_${currentIndex}`}
                value={option}
                checked={selectedAnswers[currentIndex] === option}
                onChange={() => handleAnswerSelect(currentIndex, option)}
                className="mr-3 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor={`q${currentIndex}_option${optionIndex}`}
                className="text-gray-700 cursor-pointer flex-1 font-medium"
              >
                {currentQuestion.type === "multiple" && (
                  <strong className="mr-2 text-blue-600">
                    {optionLabels[optionIndex]}.
                  </strong>
                )}
                <span dangerouslySetInnerHTML={{ __html: option }} />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentIndex === 0}
          className="px-4 py-2 bg-[#0c1125] hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        {/* Numbered Navigation Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto max-w-xs sm:max-w-none">
          {data.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`min-w-[28px] h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium hidden md:flex transition-colors items-center justify-center flex-shrink-0 ${
                index === currentIndex
                  ? "bg-[#00ba4a] text-white"
                  : selectedAnswers[index]
                  ? "bg-green-200 text-green-800"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentIndex === data.length - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            className="px-4 py-2 bg-[#00ba4a] text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
          >
            ✅ Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            disabled={currentIndex === data.length - 1}
            className="px-4 py-2 bg-[#0c1125] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};
export const IntegratedCategoryPage = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState("");

  // Handle URL param and set category
  useEffect(() => {
    if (name) {
      const decoded = decodeURIComponent(name);
      const matched = categories.find(
        (cat) =>
          cat.id === decoded.toLowerCase() ||
          cat.categoryOption.toLowerCase() === decoded.toLowerCase()
      );
      if (matched) setCategory(matched.categoryOption);
    }
  }, [name]);

  const handleChange = (e) => {
    const selected = e.target.value;
    setCategory(selected);
    const matched = categories.find((cat) => cat.categoryOption === selected);
    if (matched) {
      navigate(`/category/${matched.id}`);
    }
  };

  const selectedCategoryObj = categories.find(
    (cat) => cat.categoryOption === category
  );

  return (
    <div className="min-h-screen pt-[10rem] bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Quiz Categories
        </h1>

        {/* Dropdown */}
        <div className="mb-6">
          <label
            htmlFor="category-select"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select a Category:
          </label>
          <select
            id="category-select"
            onChange={handleChange}
            value={category}
            className="p-3 rounded-lg border border-gray-300 w-full bg-white shadow-sm focus:ring-2 focus:ring-[#00ba4a] focus:border-transparent"
          >
            <option value="" disabled>
              Choose a category...
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.categoryOption}>
                {cat.emoji} {cat.categoryOption}
              </option>
            ))}
          </select>
        </div>

        {/* Selected category card only */}
        {selectedCategoryObj && (
          <div
            className={`p-4 rounded-lg bg-gradient-to-r ${selectedCategoryObj.color} text-black shadow-lg mb-6`}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">{selectedCategoryObj.emoji}</div>
              <h3 className="text-xl font-bold mb-1">
                {selectedCategoryObj.categoryOption}
              </h3>
              <p className="text-sm opacity-90">
                {selectedCategoryObj.description}
              </p>
            </div>
          </div>
        )}

        {/* Main content */}
        <CategoryContent selectedCategory={category} />
      </div>
    </div>
  );
};

export default IntegratedCategoryPage;
