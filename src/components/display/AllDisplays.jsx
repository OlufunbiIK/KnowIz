import React, { useEffect, useState, useRef, useCallback } from "react";
import { displayMode } from "../../data/data";

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
export const FlipCardsContent = ({ isActive }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuestions = useCallback(
    async (retryCount = 0) => {
      if (!isActive) return;

      setLoading(true);
      setError(null);

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
  }, [isActive, fetchQuestions]);

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

  const currentQuestion = questions[currentIndex];

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
          <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg p-6 flex items-center justify-center text-white shadow-lg">
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

      <div className="flex justify-between items-center">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
        >
          ← Previous
        </button>

        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          {showAnswer ? "Show Question" : "Show Answer"}
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === questions.length - 1}
          className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

// Multiple Choice Component
export const MultipleChoiceContent = ({ isActive }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuestions = useCallback(
    async (retryCount = 0) => {
      if (!isActive) return;

      setLoading(true);
      setError(null);

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
  }, [isActive, fetchQuestions]);

  const handleRetakeQuiz = () => {
    setScore(null);
    setSelectedAnswers([]);
    setCurrentIndex(0);
    fetchQuestions();
  };

  const handleAnswer = (answer) => {
    setSelectedAnswers((prev) => [...prev, answer]);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      calculateScore([...selectedAnswers, answer]);
    }
  };

  const calculateScore = (answers) => {
    const correct = questions.reduce((acc, q, idx) => {
      return q.correct_answer === answers[idx] ? acc + 1 : acc;
    }, 0);
    setScore(correct);
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

  if (score !== null) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          ✅ Score: {score} / {questions.length}
        </h2>
        <p className="text-xl mb-6">
          {score >= 9
            ? "🎉 Excellent!"
            : score >= 7
            ? "✅ Good Job!"
            : score >= 5
            ? "😐 Fair"
            : "❌ Needs Improvement"}
        </p>

        <div className="space-y-4 mb-6">
          {questions.map((q, index) => {
            const isCorrect = q.correct_answer === selectedAnswers[index];
            return (
              <div
                key={index}
                className={`p-4 rounded shadow ${
                  isCorrect ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <p
                  className="font-semibold mb-1"
                  dangerouslySetInnerHTML={{
                    __html: `${index + 1}. ${q.question}`,
                  }}
                ></p>

                {isCorrect ? (
                  <p>
                    ✅ <span className="font-medium">Correct:</span>{" "}
                    <span
                      className="text-green-700"
                      dangerouslySetInnerHTML={{ __html: q.correct_answer }}
                    ></span>
                  </p>
                ) : (
                  <>
                    <p>
                      ❌ <span className="font-medium">Your Answer:</span>{" "}
                      <span
                        className="text-red-700"
                        dangerouslySetInnerHTML={{
                          __html: selectedAnswers[index],
                        }}
                      ></span>
                    </p>
                    <p>
                      ✅ <span className="font-medium">Correct Answer:</span>{" "}
                      <span
                        className="text-green-700"
                        dangerouslySetInnerHTML={{ __html: q.correct_answer }}
                      ></span>
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleRetakeQuiz}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🔁 Retake Quiz
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

  const currentQuestion = questions[currentIndex];
  const allAnswers = [
    ...currentQuestion.incorrect_answers,
    currentQuestion.correct_answer,
  ].sort(() => Math.random() - 0.5);
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-xl font-bold text-gray-800 mb-4">
          Question {currentIndex + 1} of {questions.length}
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg space-y-4">
        <h3
          className="text-lg font-semibold text-gray-800"
          dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
        ></h3>
        {allAnswers.map((ans, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(ans)}
            className="block w-full bg-white hover:bg-blue-100 text-left px-4 py-3 rounded border border-gray-200 transition-colors"
          >
            <strong className="mr-2 text-blue-600">{optionLabels[i]}.</strong>
            <span dangerouslySetInnerHTML={{ __html: ans }}></span>
          </button>
        ))}
      </div>
    </div>
  );
};

// True/False Component
export const TrueFalseContent = ({ isActive }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuestions = useCallback(
    async (retryCount = 0) => {
      if (!isActive) return;

      setLoading(true);
      setError(null);

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
  }, [isActive, fetchQuestions]);

  const handleRetake = () => {
    setCurrentIndex(0);
    setSelectedAnswers([]);
    setScore(null);
    fetchQuestions();
  };

  const handleAnswer = (answer) => {
    const newAnswers = [...selectedAnswers, answer];
    setSelectedAnswers(newAnswers);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      calculateScore(newAnswers);
    }
  };

  const calculateScore = (answers) => {
    const correct = questions.reduce((acc, q, idx) => {
      return q.correct_answer === answers[idx] ? acc + 1 : acc;
    }, 0);
    setScore(correct);
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
          onClick={handleRetake}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (score !== null) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          ✅ Score: {score} / {questions.length}
        </h2>

        <p className="text-xl mb-6">
          {score >= 9
            ? "🎉 Excellent!"
            : score >= 7
            ? "✅ Good Job!"
            : score >= 5
            ? "😐 Fair"
            : "❌ Needs Improvement"}
        </p>

        <div className="space-y-4 mb-6">
          {questions.map((q, index) => {
            const isCorrect = q.correct_answer === selectedAnswers[index];
            return (
              <div
                key={index}
                className={`p-4 rounded shadow ${
                  isCorrect ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <p
                  className="font-semibold"
                  dangerouslySetInnerHTML={{ __html: q.question }}
                ></p>
                <p>
                  ✅ Correct: <strong>{q.correct_answer}</strong>
                </p>
                {!isCorrect && (
                  <p>
                    ❌ You chose:{" "}
                    <strong className="text-red-600">
                      {selectedAnswers[index]}
                    </strong>
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleRetake}
          className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
        >
          🔁 Retake Quiz
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

  const current = questions[currentIndex];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Question {currentIndex + 1} of {questions.length}
        </h2>
      </div>

      <div className="bg-green-50 p-6 rounded-lg space-y-6">
        <p
          className="text-lg font-medium text-gray-800"
          dangerouslySetInnerHTML={{ __html: current.question }}
        ></p>

        <div className="flex flex-col md:flex-row justify-center gap-6">
          <button
            onClick={() => handleAnswer("True")}
            className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 font-medium"
          >
            ✅ True
          </button>
          <button
            onClick={() => handleAnswer("False")}
            className="bg-red-500 text-white px-8 py-3 rounded-lg hover:bg-red-600 font-medium"
          >
            ❌ False
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Display Content Component
const DisplayContent = ({ selectedMode }) => {
  const modeObj = displayMode.find(
    (mode) =>
      mode.name.toLowerCase() === selectedMode?.toLowerCase() ||
      mode.id === selectedMode?.toLowerCase()
  );

  if (!selectedMode) {
    return (
      <div className="p-8 text-center text-gray-500">
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

      <FlipCardsContent isActive={selectedMode === "Flip Cards"} />
      <MultipleChoiceContent isActive={selectedMode === "Multiple Choice"} />
      <TrueFalseContent isActive={selectedMode === "True/False"} />
    </div>
  );
};

// Main Integrated Display Page Component
export const IntegratedDisplayPage = ({ selectedMode: propMode }) => {
  const [selectedDisplayMode, setSelectedDisplayMode] = useState(
    propMode || ""
  );

  useEffect(() => {
    if (propMode) {
      setSelectedDisplayMode(propMode);
    }
  }, [propMode]);

  const handleModeChange = (e) => {
    setSelectedDisplayMode(e.target.value);
  };

  const handleCardClick = (modeObj) => {
    setSelectedDisplayMode(modeObj.name);
  };

  return (
    <div className="bg-gray-100 p-2 sm:p-4 lg:p-6">
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

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {displayMode.map((mode) => (
            <div
              key={mode.id}
              onClick={() => handleCardClick(mode)}
              className={`p-3 sm:p-4 rounded-lg cursor-pointer transition-all duration-200 bg-gradient-to-r ${
                mode.color
              } text-white shadow-lg ${
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
              </div>
            </div>
          ))}
        </div>

        <DisplayContent selectedMode={selectedDisplayMode} />
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
