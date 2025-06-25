import React, { useEffect, useState } from "react";
import { Brain, Target, Trophy, Zap, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { Button } from "../ui/IntroButton";

const features = [
  {
    icon: Brain,
    text: "🎓 Filter by categories like Science, Entertainment, General Knowledge, and more.",
    color: "from-blue-400 to-purple-500",
  },
  {
    icon: Target,
    text: "⚙️ Choose your difficulty: Easy, Medium, or Hard.",
    color: "from-orange-400 to-red-500",
  },
  {
    icon: Zap,
    text: "🧠 Play different quiz types: Multiple Choice, True/False, or try the interactive Flip Card mode.",
    color: "from-green-400 to-emerald-500",
  },
  {
    icon: Trophy,
    text: "📈 Earn scores and track your performance!",
    color: "from-yellow-400 to-orange-500",
  },
];

export default function Intro() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 4000);

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Get user's name from displayName or extract from email
        if (currentUser.displayName) {
          setUserName(currentUser.displayName);
        } else if (currentUser.email) {
          // Extract name from email (everything before @)
          const emailName = currentUser.email.split("@")[0];
          // Capitalize first letter and replace dots/underscores with spaces
          const formattedName = emailName
            .replace(/[._]/g, " ")
            .split(" ")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
          setUserName(formattedName);
        } else {
          setUserName("User");
        }
      } else {
        // Redirect to login if not authenticated
        navigate("/login");
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="intro relative min-h-screen overflow-hidden">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0a0a23] to-slate-800">
        {/* Floating Orbs */}
        <div className="absolute top-1/6 left-1/5 w-96 h-96 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-0"></div>
        <div className="absolute top-1/2 right-1/6 w-80 h-80 bg-gradient-to-r from-blue-400/15 to-purple-400/15 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/6 left-1/3 w-72 h-72 bg-gradient-to-r from-emerald-400/20 to-green-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-4000"></div>

        {/* Geometric Elements */}
        <div className="absolute top-20 right-20 w-40 h-40 border-2 border-green-400/30 rotate-45 animate-spin-slow"></div>
        <div className="absolute bottom-32 left-16 w-32 h-32 border-2 border-emerald-300/20 rotate-12 animate-float"></div>
        <div className="absolute top-1/3 left-20 w-20 h-20 bg-gradient-to-r from-green-400/40 to-emerald-500/40 transform rotate-45 animate-pulse"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          ></div>
        </div>

        {/* Floating Icons */}
        <div className="absolute top-1/4 right-1/4 text-6xl opacity-10 animate-float">
          🎯
        </div>
        <div className="absolute bottom-1/3 right-1/5 text-5xl opacity-10 animate-float animation-delay-3000">
          🧠
        </div>
        <div className="absolute top-2/3 left-1/6 text-7xl opacity-10 animate-float animation-delay-5000">
          ⭐
        </div>

        {/* Glowing Particles */}
        <div className="absolute top-1/5 left-2/3 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
        <div className="absolute top-2/3 left-1/4 w-2 h-2 bg-emerald-300 rounded-full animate-ping animation-delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-green-500 rounded-full animate-ping animation-delay-2000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-20">
        <div
          className={`w-full max-w-4xl transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Main Content Card */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl text-center space-y-8 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 rounded-3xl"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500"></div>

            {/* Header Section */}
            <div className="relative space-y-6">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                    <Brain size={40} className="text-white animate-bounce" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-ping">
                    <Sparkles size={14} className="text-white" />
                  </div>
                </div>
              </div>

              {/* Personalized Welcome Message */}
              {userName && (
                <div className="mb-4">
                  <p className="text-2xl md:text-3xl text-green-300 font-medium animate-glow">
                    Welcome back, {userName}! 👋
                  </p>
                </div>
              )}

              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-glow">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  KnowIz
                </span>{" "}
                🎯
              </h1>

              <p className="text-xl md:text-2xl text-green-200 max-w-3xl mx-auto leading-relaxed">
                Dive into a world of knowledge and test your skills across a
                variety of quiz modes in the most{" "}
                <span className="text-green-400 font-semibold">
                  interactive
                </span>{" "}
                way possible!
              </p>
            </div>

            {/* Features Carousel */}
            <div className="relative">
              <div className="h-32 md:h-28 relative overflow-hidden bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                <div
                  key={currentIndex}
                  className="absolute w-full px-6 text-white text-lg md:text-xl transition-all duration-700 ease-in-out transform"
                  style={{
                    animation: "slideIn 0.7s ease-out",
                  }}
                >
                  <div className="flex items-center justify-center gap-4">
                    {React.createElement(features[currentIndex].icon, {
                      size: 28,
                      className: `text-transparent bg-gradient-to-r ${features[currentIndex].color} bg-clip-text animate-pulse`,
                    })}
                    <p className="text-center leading-relaxed">
                      {features[currentIndex].text}
                    </p>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {features.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentIndex
                          ? "bg-green-400 w-6"
                          : "bg-white/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Call to Action Section */}
            <div className="space-y-6 pt-4">
              <p className="text-xl md:text-2xl text-white font-medium">
                Are you ready to{" "}
                <span className="text-green-400 font-bold">
                  challenge your brain
                </span>{" "}
                and have fun while learning?
              </p>

              <div className="flex justify-center">
                <Button />
              </div>

              {/* Stats Row */}
              <div className="flex justify-center gap-8 mt-8 flex-wrap">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">1000+</div>
                  <div className="text-white/70">Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-400">50+</div>
                  <div className="text-white/70">Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-300">3</div>
                  <div className="text-white/70">Difficulty Levels</div>
                </div>
              </div>
            </div>
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
            transform: translateY(0px) rotate(12deg);
          }
          50% {
            transform: translateY(-20px) rotate(12deg);
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

        @keyframes slideIn {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0px);
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
        .animation-delay-5000 {
          animation-delay: 5s;
        }
      `}</style>
    </div>
  );
}
