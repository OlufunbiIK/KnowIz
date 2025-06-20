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

const CategoryContent = ({ selectedCategory }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const lastFetchedCategory = useRef(null);

  const categoryObj = categories.find(
    (cat) => cat.categoryOption === selectedCategory
  );

  const fetchCategoryData = useCallback(
    async (retryCount = 0) => {
      if (!categoryObj || !selectedCategory) return;

      if (data && lastFetchedCategory.current === selectedCategory) {
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

        console.log(
          `Fetching data for category: ${selectedCategory} (ID: ${categoryObj.id})`
        );

        const response = await fetch(
          `https://opentdb.com/api.php?amount=10&category=${categoryObj.id}`,
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
            return fetchCategoryData(retryCount + 1);
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
    [categoryObj, selectedCategory, data]
  );

  useEffect(() => {
    if (selectedCategory && selectedCategory !== lastFetchedCategory.current) {
      setData(null);
      fetchCategoryData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedCategory, fetchCategoryData]);

  if (!selectedCategory) {
    return (
      <div className="p-8 text-center text-gray-500">
        Please select a category to view content
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm mt-4">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{categoryObj?.emoji}</span>
        <h2 className="text-2xl font-bold text-gray-800">{selectedCategory}</h2>
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
        {loading ? "Loading..." : `Reload ${selectedCategory} Questions`}
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ba4a]"></div>
          <span className="ml-2 text-gray-600">Fetching questions...</span>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Questions ({data.length}):
          </h3>
          {data.map((item, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500 hover:bg-gray-100 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-blue-600">
                  Question {index + 1}
                </span>
                <div className="flex gap-2 text-xs">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
                    {item.difficulty}
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded capitalize">
                    {item.type}
                  </span>
                </div>
              </div>
              <p
                className="font-medium text-gray-800 mb-3"
                dangerouslySetInnerHTML={{ __html: item.question }}
              />

              <div className="mt-3 space-y-2">
                {item.type === "multiple"
                  ? [...item.incorrect_answers, item.correct_answer]
                      .sort(() => Math.random() - 0.5)
                      .map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center">
                          <input
                            type="radio"
                            id={`q${index}_option${optionIndex}`}
                            name={`question_${index}`}
                            value={option}
                            className="mr-3 text-blue-600 focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`q${index}_option${optionIndex}`}
                            className="text-gray-700 cursor-pointer flex-1"
                            dangerouslySetInnerHTML={{ __html: option }}
                          />
                        </div>
                      ))
                  : ["True", "False"].map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center">
                        <input
                          type="radio"
                          id={`q${index}_option${optionIndex}`}
                          name={`question_${index}`}
                          value={option}
                          className="mr-3 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`q${index}_option${optionIndex}`}
                          className="text-gray-700 cursor-pointer flex-1"
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
          No questions found for this category.
        </div>
      )}
    </div>
  );
};

export const IntegratedCategoryPage = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState("");
  const decodedName = decodeURIComponent(name || "");

  useEffect(() => {
    if (name && !category) {
      setCategory(decodedName);
    }
  }, [name, decodedName, category]);

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setCategory(newCategory);
    navigate(`/category/${encodeURIComponent(newCategory)}`);
  };

  return (
    <div className="min-h-screen pt-[10rem] bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Quiz Categories
        </h1>

        <div className="mb-4">
          <label
            htmlFor="category-select"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select a Category:
          </label>
          <select
            id="category-select"
            onChange={handleCategoryChange}
            value={category}
            className="p-3 rounded-lg border border-gray-300 w-full bg-white shadow-sm focus:ring-2 focus:ring-[#00ba4a] focus:border-transparent"
          >
            <option value="" disabled>
              Choose a category...
            </option>
            {categories.map((option) => (
              <option key={option.id} value={option.categoryOption}>
                {option.emoji} {option.categoryOption}
              </option>
            ))}
          </select>
        </div>

        <CategoryContent selectedCategory={category || decodedName} />
      </div>
    </div>
  );
};

export default IntegratedCategoryPage;
