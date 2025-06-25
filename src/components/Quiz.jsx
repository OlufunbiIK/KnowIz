import React, { useState } from "react";
import { displayMode } from "../data/data";
import { useNavigate } from "react-router-dom";

export default function Quiz() {
  const [display, setDisplay] = useState("");

  const navigate = useNavigate();

  const handleDisplayChange = (e) => {
    setDisplay(e.target.value);
    console.log("Display mode selected:", e.target.value);
  };

  const handleStartQuiz = () => {
    if (!display) {
      alert("Please select at least one option to start the quiz!");
      return;
    }

    // Build query parameters based on selections
    const searchParams = new URLSearchParams();

    if (display) searchParams.set("mode", display);

    // Navigate to display page with query parameters
    navigate(`/display?${searchParams.toString()}`);
  };

  // Check if all options are selected for visual feedback
  const allSelected = display;
  const anySelected = display;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0a0a23] to-slate-800">
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-green-400 to-[#00ba4a] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-0"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-r from-green-300 to-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse animation-delay-4000"></div>

        {/* Geometric Shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 border-2 border-green-400 rotate-45 animate-spin-slow opacity-30"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 border-2 border-emerald-300 rotate-12 animate-bounce opacity-40"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 transform rotate-45 animate-pulse opacity-60"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>

        {/* Glowing Particles */}
        <div className="absolute top-1/6 left-3/4 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
        <div className="absolute top-3/4 left-1/5 w-1 h-1 bg-emerald-300 rounded-full animate-ping animation-delay-1000"></div>
        <div className="absolute top-1/2 right-1/5 w-3 h-3 bg-green-500 rounded-full animate-ping animation-delay-3000"></div>

        {/* Floating Icons */}
        <div className="absolute top-1/6 right-1/3 text-4xl opacity-20 animate-float">
          🧠
        </div>
        <div className="absolute bottom-1/3 right-1/6 text-3xl opacity-15 animate-float animation-delay-2000">
          📚
        </div>
        <div className="absolute top-2/3 left-1/6 text-5xl opacity-10 animate-float animation-delay-4000">
          ⭐
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-slate-900/20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col gap-8 justify-center items-center px-4">
        {/* Glass Card Container */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/20 shadow-2xl max-w-4xl w-full transform hover:scale-105 transition-transform duration-300">
          <div className="text-center mb-8">
            <h2 className="text-5xl font-bold text-white mb-4 drop-shadow-lg animate-glow">
              🎮 Start Your Quiz Journey!
            </h2>
            <p className="text-green-200 text-lg opacity-90">
              Choose your preferences and dive into the ultimate quiz experience
            </p>
            <div className="mt-4 w-24 h-1 bg-gradient-to-r from-green-400 to-emerald-400 mx-auto rounded-full"></div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 justify-center items-center">
            <div className="relative group">
              <select
                onChange={handleDisplayChange}
                value={display}
                className="appearance-none bg-white/10 backdrop-blur-md text-white p-4 rounded-xl border border-white/30 focus:border-green-400 focus:ring-2 focus:ring-green-400 focus:outline-none transition-all duration-300 hover:bg-white/20 hover:scale-105 min-w-[200px] cursor-pointer"
              >
                <option value="" className="bg-slate-800 text-white">
                  🎯 Display Mode
                </option>
                {displayMode.map((mode) => (
                  <option
                    key={mode.id}
                    value={mode.name}
                    className="bg-slate-800 text-white"
                  >
                    {mode.name} {mode.emoji}
                  </option>
                ))}
              </select>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          {/* Selection Summary */}
          {anySelected && (
            <div className="mt-6 p-4 backdrop-blur-md bg-white/5 rounded-xl border border-white/20">
              <h3 className="text-white font-semibold mb-2 text-center">
                Your Selection:
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {display && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm border border-green-500/30">
                    🎯 {display}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-8 text-center">
            <button
              onClick={handleStartQuiz}
              disabled={!anySelected}
              className={`font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                anySelected
                  ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-green-500/25 cursor-pointer"
                  : "bg-gray-600 text-gray-300 cursor-not-allowed opacity-50"
              }`}
            >
              {anySelected ? "🚀 Start Quiz!" : "⚠️ Select Options First"}
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-green-200 text-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  anySelected ? "bg-green-400 animate-pulse" : "bg-gray-500"
                }`}
              ></div>
              <span>
                {allSelected
                  ? "Perfect! Option selected"
                  : anySelected
                  ? "Great start! You can add more options or proceed"
                  : "Select one option to begin"}
              </span>
              <div
                className={`w-2 h-2 rounded-full ${
                  anySelected ? "bg-green-400 animate-pulse" : "bg-gray-500"
                }`}
              ></div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex gap-4 flex-wrap justify-center">
          <div className="backdrop-blur-lg bg-white/5 rounded-xl p-4 border border-white/10 text-center min-w-[120px]">
            <div className="text-2xl text-green-400 font-bold">1000+</div>
            <div className="text-white/70 text-sm">Questions</div>
          </div>
          <div className="backdrop-blur-lg bg-white/5 rounded-xl p-4 border border-white/10 text-center min-w-[120px]">
            <div className="text-2xl text-emerald-400 font-bold">50+</div>
            <div className="text-white/70 text-sm">Categories</div>
          </div>
          <div className="backdrop-blur-lg bg-white/5 rounded-xl p-4 border border-white/10 text-center min-w-[120px]">
            <div className="text-2xl text-green-300 font-bold">24/7</div>
            <div className="text-white/70 text-sm">Available</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes glow {
          0%,
          100% {
            text-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
          }
          50% {
            text-shadow: 0 0 30px rgba(34, 197, 94, 0.8),
              0 0 40px rgba(34, 197, 94, 0.3);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-3000 {
          animation-delay: 3s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
