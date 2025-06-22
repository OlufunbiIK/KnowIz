"use client";

import React, { useState, useRef, useEffect } from "react";
import { Menu, X } from "lucide-react"; // Optional: use any icon lib you prefer
import Button from "../ui/Button";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    // Only add the event listener when menu is open
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header className="bg-[#0a0a23] bg-opacity-90 py-5 px-4 shadow-lg fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-[#ffffffd5] text-3xl md:text-4xl font-extrabold tracking-wider">
          KNOW<span className="text-[#00ba4a]">IZ</span> 🤔
        </h1>

        {/* Desktop nav */}
        <div className="hidden md:block">
          <div className="flex justify-center items-center">
            <Button />
          </div>
        </div>

        {/* Hamburger icon on mobile */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-[#ffffffd5] focus:outline-none"
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div ref={menuRef} className="md:hidden mt-2 px-4">
          <div className="bg-[#0a0a23] bg-opacity-95 rounded-md p-4 shadow-md space-y-2">
            <div className="flex justify-center items-center">
              <Button />
            </div>
            {/* Add more nav links here if needed */}
          </div>
        </div>
      )}
    </header>
  );
}
