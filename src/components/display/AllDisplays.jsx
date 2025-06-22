import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { displayMode } from "../../data/data";
import { useNavigate, useParams } from "react-router-dom";

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

// Flip Cards Component
export const FlipCardsContent = ({ isActive, refreshTrigger }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Memoize the current question to prevent unnecessary re-renders
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
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-2 text-gray-600">Loading flip cards...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>Error: {error}</p>
        <button
          onClick={() => fetchQuestions()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No questions available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <span className="text-sm text-gray-600">
          Card {currentIndex + 1} of {questions.length}
        </span>
      </div>

      <div
        className="relative w-full h-64 cursor-pointer"
        onClick={() => setShowAnswer(!showAnswer)}
      >
        <div
          className={`absolute inset-0 w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
            showAnswer ? "rotate-y-180" : ""
          }`}
        >
          {/* Front of card */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg p-2 md:p-6 flex items-center justify-center text-white shadow-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Question</h3>
              <p
                className="text-base"
                dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
              ></p>
              <p className="text-sm mt-4 opacity-75">Click to reveal answer</p>
            </div>
          </div>

          {/* Back of card */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-r from-green-400 to-green-600 rounded-lg p-6 flex items-center justify-center text-white shadow-lg rotate-y-180">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Answer</h3>
              <p
                className="text-base font-bold"
                dangerouslySetInnerHTML={{
                  __html: currentQuestion.correct_answer,
                }}
              ></p>
              <p className="text-sm mt-4 opacity-75">Click to show question</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`px-4 py-2 rounded text-white w-full cursor-pointer transition-all duration-200 ${
            currentIndex === 0
              ? "bg-[#0c1125] cursor-not-allowed opacity-70"
              : "bg-[#0c1125] hover:bg-[#233166]"
          }`}
        >
          ← Previous
        </button>

        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className={`px-6 py-2 text-white rounded w-full 4 ${
            showAnswer
              ? "bg-green-500 hover:bg-green-600"
              : "bg-purple-500 hover:bg-purple-600"
          }`}
        >
          {showAnswer ? "Show Question" : "Show Answer"}
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === questions.length - 1}
          className="px-4 py-2 bg-[#0c1125] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#233166] w-full"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

// Multiple Choice Component
export const MultipleChoiceContent = ({ isActive, refreshTrigger }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [shuffledOptions, setShuffledOptions] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to shuffle options once when data is loaded
  const shuffleOptionsForQuestions = useCallback((questions) => {
    const shuffled = {};
    questions.forEach((question, index) => {
      const options = [...question.incorrect_answers, question.correct_answer];
      const shuffledArray = [...options].sort(() => Math.random() - 0.5);
      shuffled[index] = shuffledArray;
    });
    return shuffled;
  }, []);

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
    [isActive, shuffleOptionsForQuestions]
  );

  useEffect(() => {
    if (isActive) {
      fetchQuestions();
    }
  }, [isActive, refreshTrigger, fetchQuestions]);

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
    fetchQuestions();
  };

  const handleGoHome = () => {
    window.location.href = "/quiz";
  };

  if (!isActive) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">
          Loading multiple choice questions...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>Error: {error}</p>
        <button
          onClick={() => fetchQuestions()}
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
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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

  if (!questions.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No questions available.
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="space-y-6">
      {/* Question Progress */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-700">
          Question {currentIndex + 1} of {questions.length}
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            ></div>
          </div>
          <span className="text-sm text-gray-600">
            {Math.round(((currentIndex + 1) / questions.length) * 100)}%
          </span>
        </div>
      </div>

      {/* Current Question */}
      <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
        <div className="flex justify-between items-start mb-3">
          <span className="text-sm font-medium text-gray-600">
            Question {currentIndex + 1}
          </span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs capitalize">
            {currentQuestion.category}
          </span>
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
                <strong className="mr-2 text-blue-600">
                  {optionLabels[optionIndex]}.
                </strong>
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
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        {/* Numbered Navigation Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto max-w-xs sm:max-w-none">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`min-w-[28px] h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium transition-colors hidden md:flex flex-shrink-0 ${
                index === currentIndex
                  ? "bg-blue-600 text-white"
                  : selectedAnswers[index]
                  ? "bg-green-200 text-green-800"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            ✅ Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            disabled={currentIndex === questions.length - 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

// True/False Component
export const TrueFalseContent = ({ isActive, refreshTrigger }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuestions = useCallback(
    async (retryCount = 0) => {
      if (!isActive) return;

      setLoading(true);
      setError(null);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setShowResults(false);
      setQuizResults(null);

      try {
        await rateLimiter.waitForSlot();

        const response = await fetch(
          "https://opentdb.com/api.php?amount=10&type=boolean"
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
    fetchQuestions();
  };

  const handleGoHome = () => {
    window.location.href = "/quiz";
  };

  if (!isActive) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-2 text-gray-600">
          Loading true/false questions...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>Error: {error}</p>
        <button
          onClick={() => fetchQuestions()}
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
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              🔁 Retake Quiz
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
                        result.isCorrect ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {result.userAnswer === "True"
                        ? "✅ True"
                        : result.userAnswer === "False"
                        ? "❌ False"
                        : result.userAnswer}
                    </span>
                  </div>
                  {!result.isCorrect && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">
                        Correct answer:
                      </span>
                      <span className="font-medium text-green-700">
                        {result.correctAnswer === "True"
                          ? "✅ True"
                          : "❌ False"}
                      </span>
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

  if (!questions.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No questions available.
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="space-y-6">
      {/* Question Progress */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-700">
          Question {currentIndex + 1} of {questions.length}
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            ></div>
          </div>
          <span className="text-sm text-gray-600">
            {Math.round(((currentIndex + 1) / questions.length) * 100)}%
          </span>
        </div>
      </div>

      {/* Current Question */}
      <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
        <div className="flex justify-between items-start mb-3">
          <span className="text-sm font-medium text-gray-600">
            Question {currentIndex + 1}
          </span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs capitalize">
            {currentQuestion.category}
          </span>
        </div>

        <h3
          className="text-lg font-semibold text-gray-800 mb-6"
          dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
        />

        {/* True/False Options */}
        <div className="flex flex-col md:flex-row justify-center gap-6">
          <div
            className={`flex items-center p-4 rounded-lg border-2 transition-colors cursor-pointer ${
              selectedAnswers[currentIndex] === "True"
                ? "bg-green-100 border-green-300"
                : "bg-white hover:bg-gray-50 border-gray-200"
            }`}
            onClick={() => handleAnswerSelect(currentIndex, "True")}
          >
            <input
              type="radio"
              id={`q${currentIndex}_true`}
              name={`question_${currentIndex}`}
              value="True"
              checked={selectedAnswers[currentIndex] === "True"}
              onChange={() => handleAnswerSelect(currentIndex, "True")}
              className="mr-3 text-green-600 focus:ring-green-500"
            />
            <label
              htmlFor={`q${currentIndex}_true`}
              className="text-gray-700 cursor-pointer font-medium"
            >
              ✅ True
            </label>
          </div>

          <div
            className={`flex items-center p-4 rounded-lg border-2 transition-colors cursor-pointer ${
              selectedAnswers[currentIndex] === "False"
                ? "bg-red-100 border-red-300"
                : "bg-white hover:bg-gray-50 border-gray-200"
            }`}
            onClick={() => handleAnswerSelect(currentIndex, "False")}
          >
            <input
              type="radio"
              id={`q${currentIndex}_false`}
              name={`question_${currentIndex}`}
              value="False"
              checked={selectedAnswers[currentIndex] === "False"}
              onChange={() => handleAnswerSelect(currentIndex, "False")}
              className="mr-3 text-red-600 focus:ring-red-500"
            />
            <label
              htmlFor={`q${currentIndex}_false`}
              className="text-gray-700 cursor-pointer font-medium"
            >
              ❌ False
            </label>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentIndex === 0}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        {/* Numbered Navigation Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto max-w-xs sm:max-w-none">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`min-w-[28px] h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium transition-colors hidden md:flex flex-shrink-0 ${
                index === currentIndex
                  ? "bg-green-600 text-white"
                  : selectedAnswers[index]
                  ? "bg-green-200 text-green-800"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            ✅ Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            disabled={currentIndex === questions.length - 1}
            className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

// Main Display Content Component
const DisplayContent = ({ selectedMode, refreshTrigger }) => {
  const modeObj = displayMode.find(
    (mode) =>
      mode.name.toLowerCase() === selectedMode?.toLowerCase() ||
      mode.id === selectedMode?.toLowerCase()
  );

  if (!selectedMode) {
    return (
      <div className="p-8 text-center text-[#0c1125]">
        Please select a display mode to start
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm mt-4">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{modeObj?.emoji}</span>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{modeObj?.name}</h2>
          <p className="text-gray-600 text-sm">{modeObj?.description}</p>
        </div>
      </div>

      <FlipCardsContent
        key={`flip-${refreshTrigger}`}
        isActive={selectedMode === "Flip Cards"}
        refreshTrigger={refreshTrigger}
      />
      <MultipleChoiceContent
        key={`mc-${refreshTrigger}`}
        isActive={selectedMode === "Multiple Choice"}
        refreshTrigger={refreshTrigger}
      />
      <TrueFalseContent
        key={`tf-${refreshTrigger}`}
        isActive={selectedMode === "True/False"}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};

// Main Integrated Display Page Component
export const IntegratedDisplayPage = ({ selectedMode: propMode }) => {
  const [selectedDisplayMode, setSelectedDisplayMode] = useState(
    propMode || ""
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (propMode) {
      setSelectedDisplayMode(propMode);
    }
  }, [propMode]);

  const handleModeChange = (e) => {
    setSelectedDisplayMode(e.target.value);
    setRefreshTrigger((prev) => prev + 1); // Trigger refresh when mode changes
  };

  const handleCardClick = (modeObj) => {
    if (selectedDisplayMode === modeObj.name) {
      // If clicking the same mode, just refresh the questions
      setRefreshTrigger((prev) => prev + 1);
    } else {
      // If clicking a different mode, change mode and refresh
      setSelectedDisplayMode(modeObj.name);
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  return (
    <div className="p-2 lg:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-4 text-center">
          Quiz Display Modes
        </h1>

        {/* Dropdown */}
        <div className="mb-4">
          <select
            onChange={handleModeChange}
            value={selectedDisplayMode}
            className="p-2 sm:p-3 rounded-lg border border-gray-300 w-full bg-white shadow-sm text-sm sm:text-base"
          >
            <option value="" disabled>
              Choose mode...
            </option>
            {displayMode.map((option) => (
              <option key={option.id} value={option.name}>
                {option.emoji} {option.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cards - Show selected card only on small/medium screens, all cards on large screens */}
        <div className="mb-4">
          {/* Show only selected card on small and medium screens */}
          <div className="lg:hidden">
            {selectedDisplayMode && (
              <div className="grid grid-cols-1 gap-3">
                {displayMode
                  .filter((mode) => mode.name === selectedDisplayMode)
                  .map((mode) => (
                    <div
                      key={mode.id}
                      onClick={() => handleCardClick(mode)}
                      className={`p-2 sm:p-4 rounded-lg cursor-pointer transition-all duration-200 bg-gradient-to-r ${mode.color} text-white shadow-lg ring-2 ring-white hover:scale-105`}
                    >
                      <div className="text-center">
                        <div className="text-2xl sm:text-3xl mb-1">
                          {mode.emoji}
                        </div>
                        <h3 className="text-sm sm:text-lg font-bold mb-1">
                          {mode.name}
                        </h3>
                        <p className="text-xs sm:text-sm opacity-90 hidden sm:block">
                          {mode.description}
                        </p>
                        <p className="text-xs opacity-75 mt-1">
                          Click to refresh questions
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Show all cards on large screens */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-3">
            {displayMode.map((mode) => (
              <div
                key={mode.id}
                onClick={() => handleCardClick(mode)}
                className={`p-2 md:p-4 rounded-lg cursor-pointer transition-all duration-200 bg-gradient-to-r ${
                  mode.color
                } text-white shadow-lg hover:scale-105 ${
                  selectedDisplayMode === mode.name ? "ring-2 ring-white" : ""
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl mb-1">{mode.emoji}</div>
                  <h3 className="text-sm sm:text-lg font-bold mb-1">
                    {mode.name}
                  </h3>
                  <p className="text-xs sm:text-sm opacity-90 hidden sm:block">
                    {mode.description}
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    {selectedDisplayMode === mode.name
                      ? "Click to refresh"
                      : "Click to select"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DisplayContent
          selectedMode={selectedDisplayMode}
          refreshTrigger={refreshTrigger}
        />
      </div>

      <style jsx>{`
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default IntegratedDisplayPage;
