import {
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Home,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  Target,
} from "lucide-react";
import "../App.css";
import { useState, useEffect } from "react";
import { useCallback } from "react";
import { categories, difficultyLevel } from "../data/data";
import { db, auth } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

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

export const MultipleChoiceContent = ({ isActive, refreshTrigger }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [shuffledOptions, setShuffledOptions] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("any");
  const [selectedDifficulty, setSelectedDifficulty] = useState("any");
  const [savingScore, setSavingScore] = useState(false);

  const shuffleOptionsForQuestions = useCallback((questions) => {
    const shuffled = {};
    questions.forEach((question, index) => {
      const options = [...question.incorrect_answers, question.correct_answer];
      const shuffledArray = [...options].sort(() => Math.random() - 0.5);
      shuffled[index] = shuffledArray;
    });
    return shuffled;
  }, []);

  const buildApiUrl = () => {
    let url = "https://opentdb.com/api.php?amount=10&type=multiple";
    if (selectedCategory !== "any")
      url += `&category=${Number(selectedCategory)}`;

    if (selectedDifficulty !== "any")
      url += `&difficulty=${selectedDifficulty}`;
    return url;
  };

  const fetchQuestions = useCallback(
    async (retryCount = 0) => {
      if (!isActive) return;

      setLoading(true);
      setError(null);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setShuffledOptions({});
      setShowResults(false);
      setQuizResults(null);

      try {
        await rateLimiter.waitForSlot();

        const response = await fetch(buildApiUrl());

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
          const fetchedQuestions = result.results || [];
          setQuestions(fetchedQuestions);
          setShuffledOptions(shuffleOptionsForQuestions(fetchedQuestions));
        } else {
          throw new Error("Failed to fetch questions");
        }
      } catch (err) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    },
    [isActive, selectedCategory, selectedDifficulty, shuffleOptionsForQuestions]
  );

  useEffect(() => {
    if (isActive) {
      fetchQuestions();
    }
  }, [
    isActive,
    refreshTrigger,
    selectedCategory,
    selectedDifficulty,
    fetchQuestions,
  ]);

  const handleAnswerSelect = (questionIndex, answer) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
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
    const results = questions.map((question, index) => {
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

    const percentage = Math.round((correctCount / questions.length) * 100);

    return {
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      wrongAnswers: questions.length - correctCount,
      percentage,
      results,
    };
  };

  // Function to save score to Firebase
  const saveScoreToFirebase = async (results) => {
    const user = auth.currentUser;
    if (!user) {
      console.log("No user logged in, cannot save score");
      return;
    }

    setSavingScore(true);
    try {
      const categoryName =
        categories.find((cat) => cat.id.toString() === selectedCategory)
          ?.categoryOption || "Any Category";

      const difficultyName =
        difficultyLevel.find((diff) => diff.value === selectedDifficulty)
          ?.label || "Any Difficulty";

      const scoreData = {
        uid: user.uid,
        quizType: "Multiple Choice",
        quizId: `${categoryName} - ${difficultyName}`,
        correct: results.correctAnswers,
        wrong: results.wrongAnswers,
        total: results.totalQuestions,
        score: results.percentage,
        date: new Date().toISOString(),
        category: categoryName,
        difficulty: difficultyName,
        timestamp: new Date(),
      };

      await addDoc(collection(db, "scores"), scoreData);
      console.log("Score saved successfully!");
    } catch (error) {
      console.error("Error saving score:", error);
    } finally {
      setSavingScore(false);
    }
  };

  const handleSubmitQuiz = async () => {
    const results = calculateResults();
    setQuizResults(results);
    setShowResults(true);

    // Save score to Firebase after calculating results
    await saveScoreToFirebase(results);
  };

  const handleRetakeQuiz = () => {
    setShowResults(false);
    setQuizResults(null);
    setCurrentIndex(0);
    setSelectedAnswers({});
    fetchQuestions();
  };

  const handleGoHome = () => {
    window.location.href = "/quiz";
  };

  const getAnsweredCount = () => {
    return Object.keys(selectedAnswers).length;
  };

  const getCurrentCategoryIcon = () => {
    const category = categories.find(
      (cat) => cat.id.toString() === selectedCategory
    );
    return category ? category.emoji : "📝";
  };

  const getDifficultyColor = () => {
    const difficulty = difficultyLevel.find(
      (diff) => diff.value === selectedDifficulty
    );
    return difficulty ? difficulty.color : "blue";
  };

  if (!isActive) return null;

  if (loading) {
    return (
      <LoadingSpinner
        message="Loading multiple choice questions..."
        color="blue"
      />
    );
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

  if (showResults && quizResults) {
    return (
      <QuizResults
        results={quizResults}
        onRetake={handleRetakeQuiz}
        onGoHome={handleGoHome}
        color="blue"
        savingScore={savingScore}
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

  const currentQuestion = questions[currentIndex];
  const optionLabels = ["A", "B", "C", "D"];
  const difficultyColor = getDifficultyColor();

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Dynamic Theme */}
      <div className="space-y-4">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="text-3xl">{getCurrentCategoryIcon()}</div>
            <div>
              <h2 className="text-2xl font-bold text-blue-600">
                Multiple Choice Quiz
              </h2>
              <p className="text-sm text-gray-600">
                {categories.find(
                  (cat) => cat.id.toString() === selectedCategory
                )?.categoryOption || "Any Category"}
                •
                {difficultyLevel.find(
                  (diff) => diff.value === selectedDifficulty
                )?.label || "Any Difficulty"}
              </p>
            </div>
          </div>
        </div>

        {/* Quiz Controls */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={false}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.emoji} {category.categoryOption}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={false}
              >
                {difficultyLevel.map((difficulty) => (
                  <option key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {questions.length > 0 && (
            <button
              onClick={() => fetchQuestions()}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              New Quiz
            </button>
          )}
        </div>

        {/* Enhanced Progress Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-700">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium bg-${difficultyColor}-100 text-${difficultyColor}-800 capitalize`}
              >
                {currentQuestion.difficulty}
              </span>
            </div>
            <div className="text-sm text-blue-600 font-medium">
              {getAnsweredCount()}/{questions.length} answered
            </div>
          </div>

          {/* Progress Bar with Scroll Indicator */}
          <div className="space-y-2">
            <ProgressBar
              current={currentIndex + 1}
              total={questions.length}
              color="blue"
            />

            {/* Answer Progress Bar */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 min-w-[4rem]">
                Answered:
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 ease-out rounded-full"
                  style={{
                    width: `${(getAnsweredCount() / questions.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs text-emerald-600 font-medium min-w-[3rem]">
                {Math.round((getAnsweredCount() / questions.length) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Question */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Question {currentIndex + 1}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium bg-${difficultyColor}-100 text-${difficultyColor}-800 capitalize`}
            >
              {currentQuestion.difficulty}
            </span>
          </div>
          <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-medium">
            {currentQuestion.category}
          </span>
        </div>

        <h3
          className="text-xl font-bold text-gray-800 mb-6 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
        />

        {/* Answer Options */}
        <div className="space-y-3">
          {shuffledOptions[currentIndex]?.map((option, optionIndex) => (
            <div
              key={optionIndex}
              className={`group flex items-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer transform hover:scale-[1.02] ${
                selectedAnswers[currentIndex] === option
                  ? "bg-blue-100 border-blue-400 shadow-md"
                  : "bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300"
              }`}
              onClick={() => handleAnswerSelect(currentIndex, option)}
            >
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 font-bold transition-colors ${
                  selectedAnswers[currentIndex] === option
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-300 text-gray-500 group-hover:border-blue-400"
                }`}
              >
                {optionLabels[optionIndex]}
              </div>
              <span
                className="text-gray-700 font-medium flex-1"
                dangerouslySetInnerHTML={{ __html: option }}
              />
              {selectedAnswers[currentIndex] === option && (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Question Navigation Dots */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 max-w-full overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                  index === currentIndex
                    ? "bg-blue-600 text-white shadow-lg scale-110"
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

      {/* Enhanced Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentIndex === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            currentIndex === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-lg"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {getAnsweredCount()}/{questions.length}
            </div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
        </div>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            disabled={savingScore}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 font-medium shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trophy className="w-4 h-4" />
            {savingScore ? "Saving..." : "Submit Quiz"}
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:scale-105"
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
              <p className="text-sm text-blue-600 animate-pulse">
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
