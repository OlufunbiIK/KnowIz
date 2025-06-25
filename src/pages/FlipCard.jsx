import React, { useEffect, useState, useCallback, useMemo } from "react";
import "../App.css";
import {
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Home,
  CheckCircle,
  XCircle,
  Clock,
  Target,
} from "lucide-react";

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

// Loading Component
const LoadingSpinner = ({ message, color = "blue" }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className={`relative w-16 h-16 mb-4`}>
      <div
        className={`absolute inset-0 border-4 border-${color}-200 rounded-full`}
      ></div>
      <div
        className={`absolute inset-0 border-4 border-transparent border-t-${color}-600 rounded-full animate-spin`}
      ></div>
    </div>
    <p className="text-gray-600 font-medium animate-pulse">{message}</p>
  </div>
);

// Error Component
const ErrorMessage = ({ error, onRetry, color = "red" }) => (
  <div
    className={`bg-${color}-50 border border-${color}-200 rounded-xl p-6 text-center`}
  >
    <XCircle className={`w-12 h-12 text-${color}-500 mx-auto mb-3`} />
    <h3 className={`text-lg font-semibold text-${color}-800 mb-2`}>
      Oops! Something went wrong
    </h3>
    <p className={`text-${color}-700 mb-4`}>{error}</p>
    <button
      onClick={onRetry}
      className={`px-6 py-2 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 transition-colors font-medium`}
    >
      Try Again
    </button>
  </div>
);

// Progress Bar Component
const ProgressBar = ({ current, total, color = "blue" }) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r from-${color}-500 to-${color}-600 transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-600 min-w-[3rem]">
        {percentage}%
      </span>
    </div>
  );
};

// Flip Cards Component
export const FlipCardsContent = ({ isActive, refreshTrigger }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentQuestion = useMemo(
    () => questions[currentIndex],
    [questions, currentIndex]
  );

  const fetchQuestions = useCallback(
    async (retryCount = 0) => {
      if (!isActive) return;

      setLoading(true);
      setError(null);
      setCurrentIndex(0);
      setShowAnswer(false);

      try {
        await rateLimiter.waitForSlot();

        const response = await fetch(
          "https://opentdb.com/api.php?amount=10&type=multiple"
        );

        if (response.status === 429 && retryCount < 2) {
          const waitTime = Math.min(10000 * (retryCount + 1), 30000);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          return fetchQuestions(retryCount + 1);
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch data`);
        }

        const result = await response.json();

        if (result.response_code === 0) {
          setQuestions(result.results || []);
        } else {
          throw new Error("Failed to fetch questions");
        }
      } catch (err) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    },
    [isActive]
  );

  useEffect(() => {
    if (isActive) {
      fetchQuestions();
    }
  }, [isActive, refreshTrigger, fetchQuestions]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowAnswer(false);
    }
  };

  if (!isActive) return null;

  if (loading) {
    return <LoadingSpinner message="Loading flip cards..." color="purple" />;
  }

  if (error) {
    return (
      <ErrorMessage
        error={error}
        onRetry={() => fetchQuestions()}
        color="red"
      />
    );
  }

  if (!questions.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No questions available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-purple-600">
          <span className="text-2xl">🎴</span>
          <h2 className="text-xl font-bold">Flip Cards</h2>
        </div>
        <p className="text-sm text-gray-600">
          Card {currentIndex + 1} of {questions.length}
        </p>
        <ProgressBar
          current={currentIndex + 1}
          total={questions.length}
          color="purple"
        />
      </div>

      {/* Card Container */}
      <div className="flex justify-center">
        <div
          className="relative w-full max-w-lg h-80 cursor-pointer perspective-1000"
          onClick={() => setShowAnswer(!showAnswer)}
        >
          <div
            className={`flip-card w-full h-full ${
              showAnswer ? "rotate-y-180" : ""
            }`}
          >
            {/* Front of card */}
            <div className="backface-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl p-8 flex flex-col items-center justify-center text-white shadow-2xl border border-purple-400">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">❓</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Question</h3>
                <p
                  className="text-lg leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
                />
                <div className="mt-6 pt-4 border-t border-white/20">
                  <p className="text-sm opacity-75 animate-pulse">
                    Click to reveal answer
                  </p>
                </div>
              </div>
            </div>

            {/* Back of card */}
            <div className="backface-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 rounded-2xl p-8 flex flex-col items-center justify-center text-white shadow-2xl border border-emerald-400 rotate-y-180">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-4">Answer</h3>
                <p
                  className="text-lg font-bold leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: currentQuestion.correct_answer,
                  }}
                />
                <div className="mt-6 pt-4 border-t border-white/20">
                  <p className="text-sm opacity-75 animate-pulse">
                    Click to show question
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`flex items-center w-full sm:w-auto gap-2 px-6 py-3 justify-center rounded-xl font-medium transition-all duration-200 ${
            currentIndex === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700 hover:scale-105 shadow-lg"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className={`flex items-center gap-2 px-8 py-3 w-full sm:w-auto justify-center rounded-xl font-medium transition-all duration-200 shadow-lg hover:scale-105 ${
            showAnswer
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          {showAnswer ? "Show Question" : "Show Answer"}
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === questions.length - 1}
          className={`flex items-center justify-center gap-2 px-6 py-3 w-full sm:w-auto rounded-xl font-medium transition-all duration-200 ${
            currentIndex === questions.length - 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700 hover:scale-105 shadow-lg"
          }`}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Quiz Results Component
export const QuizResults = ({
  results,
  onRetake,
  onGoHome,
  color = "blue",
}) => {
  const getPerformanceLevel = (percentage) => {
    if (percentage >= 90)
      return { level: "Outstanding", icon: "🏆", color: "text-yellow-600" };
    if (percentage >= 80)
      return { level: "Excellent", icon: "⭐", color: "text-green-600" };
    if (percentage >= 70)
      return { level: "Good", icon: "👍", color: "text-blue-600" };
    if (percentage >= 60)
      return { level: "Fair", icon: "👌", color: "text-orange-600" };
    return { level: "Keep Trying", icon: "💪", color: "text-red-600" };
  };

  const performance = getPerformanceLevel(results.percentage);

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-xl border border-gray-200">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <div className="text-6xl">{performance.icon}</div>
            <h2 className="text-3xl font-bold text-gray-800">Quiz Complete!</h2>
            <p className={`text-xl font-semibold ${performance.color}`}>
              {performance.level}
            </p>
          </div>

          <div className="space-y-4">
            <div className={`text-7xl font-black ${performance.color}`}>
              {results.percentage}%
            </div>
            <p className="text-lg text-gray-600">
              You scored {results.correctAnswers} out of{" "}
              {results.totalQuestions} questions correctly
            </p>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-600">
                {results.correctAnswers}
              </div>
              <div className="text-sm text-emerald-700 font-medium">
                Correct
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-200">
              <div className="text-2xl font-bold text-red-600">
                {results.wrongAnswers}
              </div>
              <div className="text-sm text-red-700 font-medium">Wrong</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {results.totalQuestions}
              </div>
              <div className="text-sm text-blue-700 font-medium">Total</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={onRetake}
              className={`flex items-center gap-2 px-8 py-3 bg-${color}-600 text-white rounded-xl hover:bg-${color}-700 transition-all duration-200 font-medium shadow-lg hover:scale-105`}
            >
              <RotateCcw className="w-4 h-4" />
              Retake Quiz
            </button>
            <button
              onClick={onGoHome}
              className="flex items-center gap-2 px-8 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-medium shadow-lg hover:scale-105"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Question Review
        </h3>
        <div className="space-y-4">
          {results.results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-md ${
                result.isCorrect
                  ? "bg-emerald-50 border-emerald-500"
                  : "bg-red-50 border-red-500"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">
                  Question {index + 1}
                </span>
                <div className="flex gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      result.isCorrect
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {result.isCorrect ? "✓ Correct" : "✗ Wrong"}
                  </span>
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs capitalize">
                    {result.category}
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
                      result.isCorrect ? "text-emerald-700" : "text-red-700"
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
                      className="font-medium text-emerald-700"
                      dangerouslySetInnerHTML={{ __html: result.correctAnswer }}
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
};
