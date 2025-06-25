import React from "react";
import { useNavigate } from "react-router-dom";

export const Button = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/quiz")}
      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-green-500/25"
    >
      Get Started
    </button>
  );
};
