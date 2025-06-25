import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Button = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/quiz")}
      className="group relative bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-green-500/25 overflow-hidden"
    >
      <span className="relative z-10 flex items-center gap-2">
        <Play
          size={20}
          className="group-hover:translate-x-1 transition-transform duration-300"
        />
        Start Quiz Journey
        <ArrowRight
          size={20}
          className="group-hover:translate-x-1 transition-transform duration-300"
        />
      </span>
      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </button>
  );
};
