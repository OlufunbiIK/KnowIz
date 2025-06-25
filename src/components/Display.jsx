import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import backgroundImage from "../assets/images/626f4775-3aec-427d-b099-016eaaa82613.jpg";
import "../index.css";
// import IntegratedDifficultyPage from "./level/AllLevels";
import IntegratedDisplayPage from "./display/AllDisplays";

// Extract display mode configuration to share between components
export const displayModeConfig = {
  "flip-cards": {
    name: "Flip Cards",
    emoji: "🎴",
    description: "Interactive flashcards with smooth flip animations",
    colors: {
      primary: "from-purple-500 via-purple-600 to-purple-700",
      header: "from-purple-500 via-pink-500 to-red-500",
      headerOverlay: "from-purple-600/80 to-pink-600/80",
      accent: "purple",
      ring: "ring-purple-500",
    },
  },
  "multiple-choice": {
    name: "Multiple Choice",
    emoji: "📝",
    description: "Traditional quiz with multiple answer options",
    colors: {
      primary: "from-blue-500 via-blue-600 to-blue-700",
      header: "from-blue-500 via-indigo-500 to-purple-500",
      headerOverlay: "from-blue-600/80 to-indigo-600/80",
      accent: "blue",
      ring: "ring-blue-500",
    },
  },
  "true-false": {
    name: "True/False",
    emoji: "✅",
    description: "Simple true or false questions",
    colors: {
      primary: "from-emerald-500 via-emerald-600 to-emerald-700",
      header: "from-emerald-500 via-green-500 to-teal-500",
      headerOverlay: "from-emerald-600/80 to-green-600/80",
      accent: "emerald",
      ring: "ring-emerald-500",
    },
  },
};

// Default theme for non-mode contexts
const defaultTheme = {
  colors: {
    primary: "from-gray-500 via-gray-600 to-gray-700",
    header: "from-purple-500 via-pink-500 to-red-500",
    headerOverlay: "from-purple-600/80 to-pink-600/80",
    accent: "gray",
    ring: "ring-gray-500",
  },
};

export default function Display() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const level = searchParams.get("level");
  const category = searchParams.get("category");

  // State to track the current display mode selection
  const [currentDisplayMode, setCurrentDisplayMode] = useState(null);

  const selected = mode || level || category;

  // Get theme based on current context
  const getTheme = () => {
    if (mode && currentDisplayMode) {
      const modeKey = Object.keys(displayModeConfig).find(
        (key) =>
          displayModeConfig[key].name.toLowerCase() ===
          currentDisplayMode.toLowerCase()
      );
      return displayModeConfig[modeKey] || defaultTheme;
    }
    return defaultTheme;
  };

  const currentTheme = getTheme();

  const getDisplayTitle = () => {
    if (mode) {
      if (currentDisplayMode) {
        const modeConfig = Object.values(displayModeConfig).find(
          (config) =>
            config.name.toLowerCase() === currentDisplayMode.toLowerCase()
        );
        return `${modeConfig?.emoji} ${currentDisplayMode} Mode`;
      }
      return `Mode: ${mode}`;
    }
    if (level) return `Difficulty: ${level}`;
    if (category) return `Category: ${category}`;
    return "Quiz Selection";
  };

  const getBreadcrumb = () => {
    const breadcrumbs = ["Quiz"];
    if (mode) {
      breadcrumbs.push("Mode");
      if (currentDisplayMode) breadcrumbs.push(currentDisplayMode);
      else breadcrumbs.push(mode);
    }
    if (level) breadcrumbs.push("Level", level);
    if (category) breadcrumbs.push("Category", category);
    return breadcrumbs;
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "Easy":
        return "bg-green-500";
      case "Medium":
        return "bg-yellow-500";
      case "Hard":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getLevelWidth = (level) => {
    switch (level) {
      case "Easy":
        return "w-1/3";
      case "Medium":
        return "w-2/3";
      case "Hard":
        return "w-full";
      default:
        return "w-0";
    }
  };

  // Handler to receive mode changes from IntegratedDisplayPage
  const handleDisplayModeChange = (selectedMode) => {
    setCurrentDisplayMode(selectedMode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section with Dynamic Background */}
      <div
        className="relative h-64 md:h-80 bg-cover bg-center bg-fixed overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${backgroundImage})`,
        }}
      >
        {/* Dynamic animated background overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${currentTheme.colors.headerOverlay} animate-pulse`}
        ></div>

        <div className="relative z-10 flex flex-col justify-center items-center text-white h-full px-4">
          {/* Breadcrumb Navigation */}
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm opacity-90 bg-black/20 rounded-full px-4 py-2 backdrop-blur-sm">
              {getBreadcrumb().map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <svg
                      className="w-4 h-4 mx-2 text-white/60"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span
                    className={`transition-all duration-200 hover:text-yellow-300 ${
                      index === getBreadcrumb().length - 1
                        ? "font-semibold text-yellow-300"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    {crumb}
                  </span>
                </li>
              ))}
            </ol>
          </nav>

          {/* Main Title with Animation */}
          <h1 className="text-3xl md:text-5xl font-bold text-center mb-4 drop-shadow-lg animate-fade-in">
            {getDisplayTitle()}
          </h1>

          {/* Subtitle with Typing Effect */}
          <p className="text-lg md:text-xl text-center max-w-2xl opacity-90 animate-slide-up">
            {selected
              ? `Explore ${currentDisplayMode || selected} options below`
              : "Choose your quiz preferences"}
          </p>
        </div>

        {/* Decorative Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-16 fill-blue-50"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path d="M1200 120L0 16.48C0 16.48 0 120 0 120L1200 120Z"></path>
          </svg>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        {/* Current Selection Status Card */}
        {selected && (
          <div className="mb-8 transform hover:scale-105 transition-all duration-300">
            <div
              className={`bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${
                currentDisplayMode ? currentTheme.colors.ring + " ring-2" : ""
              }`}
            >
              <div
                className={`bg-gradient-to-r ${currentTheme.colors.header} px-6 py-4 relative`}
              >
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="relative z-10">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    Current Selection
                  </h2>
                </div>
              </div>
              <div className="px-6 py-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <span className="text-3xl font-bold text-gray-800 block">
                      {currentDisplayMode || selected}
                    </span>
                    <p className="text-gray-600 mt-1">
                      {mode &&
                        currentDisplayMode &&
                        Object.values(displayModeConfig).find(
                          (config) =>
                            config.name.toLowerCase() ===
                            currentDisplayMode.toLowerCase()
                        )?.description}
                      {mode && !currentDisplayMode && "Quiz mode configuration"}
                      {level && "Difficulty level setting"}
                      {category && "Subject category selection"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div
                      className={`px-4 py-2 bg-${currentTheme.colors.accent}-100 text-${currentTheme.colors.accent}-800 rounded-full text-sm font-medium flex items-center`}
                    >
                      <div
                        className={`w-2 h-2 bg-${currentTheme.colors.accent}-500 rounded-full mr-2 animate-pulse`}
                      ></div>
                      Active
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Content Grid */}
        <div className="space-y-8">
          {/* Mode Display Section */}
          {mode && (
            <div className="group">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform group-hover:shadow-2xl transition-all duration-300">
                <div
                  className={`bg-gradient-to-r ${currentTheme.colors.header} px-6 py-4 relative`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${currentTheme.colors.headerOverlay}`}
                  ></div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-semibold text-white flex items-center">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      {currentDisplayMode
                        ? `${currentDisplayMode} Quiz Mode`
                        : "Quiz Mode Options"}
                    </h3>
                  </div>
                </div>
                <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
                  <IntegratedDisplayPage
                    onModeChange={handleDisplayModeChange}
                    selectedMode={mode}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Difficulty Level Display Section */}
          {(level === "Easy" || level === "Hard" || level === "Medium") && (
            <div className="group">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform group-hover:shadow-2xl transition-all duration-300">
                <div className="bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 px-6 py-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/80 to-teal-600/80"></div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-semibold text-white flex items-center">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      Difficulty Level: {level}
                    </h3>
                  </div>
                </div>
                <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
                  {/* Difficulty Indicator */}
                  <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Current Difficulty
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          level === "Easy"
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : level === "Medium"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
                        {level}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${getLevelColor(
                            level
                          )} ${getLevelWidth(level)}`}
                          style={{
                            background:
                              level === "Easy"
                                ? "linear-gradient(90deg, #10b981, #34d399)"
                                : level === "Medium"
                                ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                                : "linear-gradient(90deg, #ef4444, #f87171)",
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Easy</span>
                        <span>Medium</span>
                        <span>Hard</span>
                      </div>
                    </div>
                  </div>
                  {/* <IntegratedDifficultyPage /> */}
                </div>
              </div>
            </div>
          )}

          {/* Category Display Section */}
          {category && (
            <div className="group">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform group-hover:shadow-2xl transition-all duration-300">
                <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-6 py-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600/80 to-red-600/80"></div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-semibold text-white flex items-center">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                      </div>
                      Category: {category}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* No Selection State */}
        {!selected && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 max-w-lg mx-auto transform hover:scale-105 transition-all duration-300">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-bounce"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No Selection Made
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Please select a quiz mode, difficulty level, or category from
                the navigation to continue your quiz journey.
              </p>
              <div className="mt-6 flex justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div
                  className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Information */}
        <div className="mt-16 text-center">
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <p className="text-gray-600 text-sm">
              Navigate through different quiz options using the menu above to
              customize your learning experience.
            </p>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out 0.3s both;
        }

        .group:hover .group-hover\\:shadow-2xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}
