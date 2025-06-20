import React from "react";
import { useNavigate } from "react-router-dom";

const Button = ({ label = "Let’s Go!", to = "/quiz" }) => {
  const navigate = useNavigate();

  function handleNavigation() {
    navigate(to);
  }

  return (
    <div>
      <button
        onClick={handleNavigation}
        className="group flex w-[180px] h-[55px] items-center justify-between rounded-full border-none bg-gradient-to-r from-[#00ba4a] to-[#00e6b5] px-2 shadow-[0_5px_12px_rgba(0,230,181,0.3)] transition-transform duration-200 hover:scale-[1.03]"
      >
        <span className="flex-1 text-center text-[#0a0a23] text-[1.1em] font-semibold tracking-wide">
          {label}
        </span>

        <span className="ml-2 flex h-[45px] w-[45px] items-center justify-center rounded-full border-2 border-[#0a0a23] bg-white transition-colors duration-300 group-hover:bg-[#e0fdfa]">
          <svg
            className="animate-pulse group-hover:animate-[arrow_1s_linear_infinite]"
            width={16}
            height={19}
            viewBox="0 0 16 19"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="1.61321" cy="1.61321" r="1.5" fill="black" />
            <circle cx="5.73583" cy="1.61321" r="1.5" fill="black" />
            <circle cx="5.73583" cy="5.5566" r="1.5" fill="black" />
            <circle cx="9.85851" cy="5.5566" r="1.5" fill="black" />
            <circle cx="9.85851" cy="9.5" r="1.5" fill="black" />
            <circle cx="13.9811" cy="9.5" r="1.5" fill="black" />
            <circle cx="5.73583" cy="13.4434" r="1.5" fill="black" />
            <circle cx="9.85851" cy="13.4434" r="1.5" fill="black" />
            <circle cx="1.61321" cy="17.3868" r="1.5" fill="black" />
            <circle cx="5.73583" cy="17.3868" r="1.5" fill="black" />
          </svg>
        </span>
      </button>

      {/* Keyframes for the SVG animation */}
      <style>
        {`
          @keyframes arrow {
            0% {
              opacity: 0;
              margin-left: 0px;
            }
            100% {
              opacity: 1;
              margin-left: 10px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Button;
