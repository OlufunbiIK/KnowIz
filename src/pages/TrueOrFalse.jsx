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
import { useState, useEffect, useCallback, useRef } from "react";
import "../App.css";
import { categories, difficultyLevel } from "../data/data";
// Add Firebase imports
import { db, auth } from "../firebase"; // adjust path as needed
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Rate limiter class
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

export const TrueFalseContent = ({ isActive, refreshTrigger }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("any");
  const [selectedDifficulty, setSelectedDifficulty] = useState("any");
  const [savingScore, setSavingScore] = useState(false);

  // Add ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Add ref to prevent multiple concurrent requests
  const requestInProgressRef = useRef(false);

  // Function to save score to Firebase
  const saveScoreToFirebase = async (quizResults) => {
    const user = auth.currentUser;
    if (!user) {
      console.log("No authenticated user, skipping score save");
      return;
    }

    setSavingScore(true);
    try {
      // Get category name for display
      const categoryName =
        selectedCategory === "any"
          ? "Mixed"
          : categories.find((cat) => cat.id === selectedCategory)
              ?.categoryOption || "Unknown";

      // Create quiz identifier
      const quizId = `${categoryName} (${
        selectedDifficulty === "any" ? "Mixed" : selectedDifficulty
      })`;

      const scoreData = {
        uid: user.uid,
        quizType: "True/False",
        quizId: quizId,
        score: quizResults.percentage,
        correct: quizResults.correctAnswers,
        wrong: quizResults.wrongAnswers,
        total: quizResults.totalQuestions,
        category: categoryName,
        difficulty: selectedDifficulty === "any" ? "Mixed" : selectedDifficulty,
        date: new Date().toISOString(),
        timestamp: serverTimestamp(),
        questions: quizResults.results.map((result) => ({
          question: result.question.replace(/<[^>]*>/g, ""), // Strip HTML tags
          userAnswer: result.userAnswer,
          correctAnswer: result.correctAnswer,
          isCorrect: result.isCorrect,
          category: result.category,
          difficulty: result.difficulty,
        })),
      };

      await addDoc(collection(db, "scores"), scoreData);
      console.log("Score saved successfully!");
    } catch (error) {
      console.error("Error saving score:", error);
      // You might want to show a toast notification here
    } finally {
      setSavingScore(false);
    }
  };

  // Memoize fetchQuestions to prevent unnecessary recreations
  const fetchQuestions = useCallback(
    async (retryCount = 0) => {
      if (!isActive || !isMountedRef.current || requestInProgressRef.current) {
        return;
      }

      requestInProgressRef.current = true;
      setLoading(true);
      setError(null);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setShowResults(false);
      setQuizResults(null);

      try {
        // Wait for rate limiter before making request
        await rateLimiter.waitForSlot();

        if (!isMountedRef.current) return; // Check if still mounted after waiting

        let url = "https://opentdb.com/api.php?amount=10&type=boolean";
        if (selectedCategory !== "any") {
          url += `&category=${selectedCategory}`;
        }
        if (selectedDifficulty !== "any") {
          url += `&difficulty=${selectedDifficulty}`;
        }

        const response = await fetch(url);

        if (!isMountedRef.current) return; // Check if still mounted after fetch

        // Handle rate limiting with exponential backoff
        if (response.status === 429) {
          if (retryCount < 2) {
            // Reduced retry attempts from 3 to 2
            const waitTime = Math.min(5000 * Math.pow(2, retryCount), 30000); // Increased base wait time
            console.log(`Rate limited. Retrying in ${waitTime}ms...`);

            requestInProgressRef.current = false; // Release lock before retry
            await new Promise((resolve) => setTimeout(resolve, waitTime));

            if (isMountedRef.current) {
              return fetchQuestions(retryCount + 1);
            }
            return;
          } else {
            throw new Error(
              "Rate limit exceeded. Please try again in a few minutes."
            );
          }
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch questions`);
        }

        const result = await response.json();

        if (!isMountedRef.current) return; // Final check before setting state

        // Check API response codes
        if (result.response_code === 0) {
          setQuestions(result.results || []);
        } else if (result.response_code === 1) {
          throw new Error("No results found. Try different settings.");
        } else if (result.response_code === 2) {
          throw new Error("Invalid parameter. Please check your settings.");
        } else if (result.response_code === 3) {
          throw new Error("Token not found.");
        } else if (result.response_code === 4) {
          throw new Error("Token empty. Please reset your session.");
        } else {
          throw new Error("Failed to fetch questions. Please try again.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        if (isMountedRef.current) {
          setError(err.message || "Error fetching data");
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
        requestInProgressRef.current = false;
      }
    },
    [isActive, selectedCategory, selectedDifficulty] // Stable dependencies
  );

  // Single useEffect to handle all fetch triggers
  useEffect(() => {
    let timeoutId;

    if (isActive) {
      // Add small delay to prevent rapid successive calls
      timeoutId = setTimeout(() => {
        fetchQuestions();
      }, 100);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    isActive,
    selectedCategory,
    selectedDifficulty,
    refreshTrigger,
    fetchQuestions,
  ]);

  // Cleanup effect
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      requestInProgressRef.current = false;
    };
  }, []);

  const handleAnswerSelect = (index, answer) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [index]: answer,
    }));
  };

  const handleSubmitQuiz = async () => {
    let correctCount = 0;
    const results = questions.map((q, i) => {
      const userAnswer = selectedAnswers[i];
      const correct = q.correct_answer;
      const isCorrect = userAnswer === correct;
      if (isCorrect) correctCount++;
      return {
        question: q.question,
        category: q.category,
        difficulty: q.difficulty,
        type: q.type,
        correctAnswer: correct,
        userAnswer: userAnswer || "Not answered",
        isCorrect,
      };
    });

    const percentage = Math.round((correctCount / questions.length) * 100);

    const quizResults = {
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      wrongAnswers: questions.length - correctCount,
      percentage,
      results,
    };

    setQuizResults(quizResults);
    setShowResults(true);

    // Save score to Firebase
    await saveScoreToFirebase(quizResults);
  };

  const handleRetakeQuiz = () => {
    // Add small delay to prevent rapid successive calls
    setTimeout(() => {
      fetchQuestions();
    }, 500);
  };

  const handleGoHome = () => {
    window.location.href = "/quiz";
  };

  // Handle category/difficulty changes with debouncing
  const handleCategoryChange = (newCategory) => {
    setSelectedCategory(newCategory);
  };

  const handleDifficultyChange = (newDifficulty) => {
    setSelectedDifficulty(newDifficulty);
  };

  // Debounced fetch function for new quiz button
  const handleNewQuiz = useCallback(() => {
    if (!requestInProgressRef.current) {
      fetchQuestions();
    }
  }, [fetchQuestions]);

  if (!isActive) return null;

  if (loading) {
    return (
      <LoadingSpinner message="Loading true/false questions..." color="green" />
    );
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={handleNewQuiz} color="red" />;
  }

  if (showResults && quizResults) {
    return (
      <QuizResults
        results={quizResults}
        onRetake={handleRetakeQuiz}
        onGoHome={handleGoHome}
        color="green"
        savingScore={savingScore}
      />
    );
  }

  if (!questions.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No questions available. Try different settings.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="text-3xl">🧠</div>
            <div>
              <h2 className="text-2xl font-bold text-green-600">
                True / False Quiz
              </h2>
              <p className="text-sm text-gray-600">
                Answer quickly and accurately
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-green-700">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                {currentQuestion.difficulty || "Any"}
              </span>
            </div>
            <div className="text-sm text-green-600 font-medium">
              {Object.keys(selectedAnswers).length}/{questions.length} answered
            </div>
          </div>
          <ProgressBar
            current={currentIndex + 1}
            total={questions.length}
            color="green"
          />
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-600 min-w-[4rem]">Answered:</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 ease-out rounded-full"
              style={{
                width: `${
                  (Object.keys(selectedAnswers).length / questions.length) * 100
                }%`,
              }}
            />
          </div>
          <span className="text-xs text-emerald-600 font-medium min-w-[3rem]">
            {Math.round(
              (Object.keys(selectedAnswers).length / questions.length) * 100
            )}
            %
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={loading || requestInProgressRef.current}
            >
              <option value="any">Any Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.categoryOption}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => handleDifficultyChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={loading || requestInProgressRef.current}
            >
              <option value="any">Any Difficulty</option>
              {difficultyLevel.map((diff) => (
                <option key={diff.value} value={diff.value}>
                  {diff.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {questions.length > 0 && (
          <button
            onClick={handleNewQuiz}
            disabled={loading || requestInProgressRef.current}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            {loading || requestInProgressRef.current
              ? "Loading..."
              : "New Quiz"}
          </button>
        )}
      </div>

      {/* Current Question */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200 shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            Question {currentIndex + 1}
          </span>
          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs capitalize font-medium">
            {currentQuestion.category}
          </span>
        </div>

        <h3
          className="text-xl font-bold text-gray-800 mb-6 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
        />

        <div className="flex gap-4 justify-center">
          {["True", "False"].map((option) => (
            <div
              key={option}
              className={`flex-1 md:flex-initial text-center px-6 py-4 font-medium rounded-xl border-2 cursor-pointer transition-all ${
                selectedAnswers[currentIndex] === option
                  ? option === "True"
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-red-600 text-white border-red-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
              onClick={() => handleAnswerSelect(currentIndex, option)}
            >
              {option === "True" ? "✅ True" : "❌ False"}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 max-w-full overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center relative ${
                  index === currentIndex
                    ? "bg-green-600 text-white shadow-lg scale-110"
                    : selectedAnswers[index]
                    ? "bg-emerald-200 text-emerald-800 hover:bg-emerald-300"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                {index + 1}
                {selectedAnswers[index] && index !== currentIndex && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentIndex(currentIndex - 1)}
          disabled={currentIndex === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            currentIndex === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700 hover:scale-105 shadow-lg"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            disabled={savingScore}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 font-medium shadow-lg hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" />
            {savingScore ? "Saving..." : "Submit Quiz"}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-medium shadow-lg hover:scale-105"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
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
  savingScore = false,
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
            {savingScore && (
              <p className="text-sm text-blue-600 font-medium">
                💾 Saving your score...
              </p>
            )}
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
