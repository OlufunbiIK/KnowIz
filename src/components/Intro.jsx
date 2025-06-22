"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/Button";

const features = [
  "🎓 Filter by categories like Science, Entertainment, General Knowledge, and more.",
  "⚙️ Choose your difficulty: Easy, Medium, or Hard.",
  "🧠 Play different quiz types: Multiple Choice, True/False, or try the interactive Flip Card mode.",
  "📈 Earn scores and track your performance!",
];

export default function Intro() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="intro relative min-h-screen md:pt-0 overflow-hidden">
      {/* Video background */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      >
        <source
          src="/videos/istockphoto-2002550891-640_adpp_is.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-60 z-0"></div>

      {/* Foreground Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-2 md:px-4 py-12">
        <div className="w-full sm:max-w-lg md:max-w-2xl lg:max-w-3xl bg-white bg-opacity-90 rounded-tl-sm rounded-tr-sm rounded-bl-sm rounded-br-3xl shadow-2xl px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-12 text-center space-y-4 sm:space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800">
            Welcome to KnowIz 🎯
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-gray-700">
            Dive into a world of knowledge and test your skills across a variety
            of quiz modes!
          </p>

          <div className="h-20 sm:h-24 md:h-28 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6 }}
                className="absolute w-full px-4 text-gray-700 text-sm sm:text-base md:text-lg"
              >
                <p>{features[currentIndex]}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="text-sm sm:text-base md:text-lg text-gray-800 font-medium">
            Are you ready to challenge your brain and have fun while learning?
            Let’s get started!
          </p>

          <div className="flex justify-center items-center mt-4 sm:mt-6 md:mt-8">
            <Button />
          </div>
        </div>
      </div>
    </div>
  );
}
