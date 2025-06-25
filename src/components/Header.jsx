// import React, { useState, useRef, useEffect } from "react";
// import { Menu, X, Trophy, LogOut, Zap } from "lucide-react";
// import { Button } from "../ui/HeaderButton";
// import { useAuth } from "./context/AuthContext";

// export default function Header() {
//   const [menuOpen, setMenuOpen] = useState(false);
//   // const [user, setUser] = useState(null); // Change to true to see logged in state
//   const [scrolled, setScrolled] = useState(false);
//   const menuRef = useRef(null);
//   const { user } = useAuth();

//   // Mock navigation function
//   const navigate = (path) => {
//     navigate("/quiz");
//   };

//   // Handle scroll effect
//   useEffect(() => {
//     const handleScroll = () => {
//       setScrolled(window.scrollY > 20);
//     };
//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   const handleLogout = () => {
//     // setUser(null);
//     navigate("/");
//   };

//   // Close menu when clicking outside
//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (menuRef.current && !menuRef.current.contains(event.target)) {
//         setMenuOpen(false);
//       }
//     }

//     if (menuOpen) {
//       document.addEventListener("mousedown", handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [menuOpen]);

//   return (
//     <>
//       <header
//         className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
//           scrolled
//             ? "backdrop-blur-xl bg-[#0a0a23]/80 shadow-2xl border-b border-green-500/20"
//             : "bg-gradient-to-r from-[#0a0a23]/90 via-[#0a0a23]/95 to-[#0a0a23]/90"
//         }`}
//       >
//         {/* Animated Background Elements */}
//         <div className="absolute inset-0 overflow-hidden">
//           <div className="absolute top-0 left-1/4 w-32 h-32 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-full blur-xl animate-pulse"></div>
//           <div className="absolute top-0 right-1/4 w-24 h-24 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-full blur-lg animate-pulse animation-delay-2000"></div>

//           {/* Animated Grid */}
//           <div className="absolute inset-0 opacity-5">
//             <div
//               className="absolute inset-0"
//               style={{
//                 backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
//                                linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)`,
//                 backgroundSize: "30px 30px",
//               }}
//             ></div>
//           </div>

//           {/* Glowing Line */}
//           <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-50"></div>
//         </div>

//         <div className="relative max-w-7xl mx-auto flex justify-between items-center px-4 py-4">
//           {/* Logo with enhanced effects */}
//           <div className="relative group">
//             <h1
//               onClick={() => navigate("/intro")}
//               className="text-[#ffffffd5] text-3xl md:text-4xl font-extrabold tracking-wider cursor-pointer relative z-10 transition-all duration-300 hover:scale-105"
//             >
//               <span className="relative inline-block">
//                 KNOW
//                 <span className="absolute inset-0 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//                   KNOW
//                 </span>
//               </span>
//               <span className="text-[#00ba4a] relative inline-block ml-1 group-hover:animate-pulse">
//                 IZ
//                 <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></span>
//               </span>
//               <span className="ml-2 text-2xl group-hover:animate-bounce inline-block">
//                 🧠
//               </span>
//             </h1>

//             {/* Glow effect behind logo */}
//             <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
//           </div>

//           {/* Desktop Navigation */}
//           <div className="hidden md:flex items-center gap-6">
//             <div className="flex items-center gap-4">
//               <Button />

//               {user && (
//                 <div className="flex items-center gap-4">
//                   <a
//                     onClick={() => navigate("/scores")}
//                     className="group flex items-center gap-2 text-white/80 hover:text-green-400 font-medium transition-all duration-300 cursor-pointer relative"
//                   >
//                     <Trophy
//                       size={18}
//                       className="group-hover:rotate-12 transition-transform duration-300"
//                     />
//                     <span className="relative">
//                       My Scores
//                       <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-400 group-hover:w-full transition-all duration-300"></span>
//                     </span>
//                   </a>

//                   <button
//                     onClick={handleLogout}
//                     className="group flex items-center gap-2 text-red-400 hover:text-red-300 font-medium transition-all duration-300 hover:scale-105"
//                   >
//                     <LogOut
//                       size={18}
//                       className="group-hover:rotate-12 transition-transform duration-300"
//                     />
//                     Log Out
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Mobile Menu Toggle */}
//           <div className="md:hidden flex items-center">
//             <button
//               onClick={() => setMenuOpen(!menuOpen)}
//               className="relative text-[#ffffffd5] focus:outline-none p-2 rounded-lg hover:bg-white/10 transition-all duration-300 group"
//             >
//               <div className="relative">
//                 {menuOpen ? (
//                   <X
//                     size={28}
//                     className="group-hover:rotate-90 transition-transform duration-300"
//                   />
//                 ) : (
//                   <Menu
//                     size={28}
//                     className="group-hover:scale-110 transition-transform duration-300"
//                   />
//                 )}

//                 {/* Glow effect */}
//                 <div className="absolute inset-0 bg-green-400/20 blur-md opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 rounded-lg"></div>
//               </div>
//             </button>
//           </div>
//         </div>

//         {/* Mobile Dropdown Menu */}
//         <div
//           className={`md:hidden transition-all duration-300 ease-in-out ${
//             menuOpen
//               ? "max-h-96 opacity-100"
//               : "max-h-0 opacity-0 overflow-hidden"
//           }`}
//         >
//           <div ref={menuRef} className="mx-4 mb-4">
//             <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 shadow-2xl">
//               {/* Background decoration */}
//               <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl"></div>

//               <div className="relative space-y-4">
//                 <div className="flex justify-center">
//                   <Button />
//                 </div>

//                 {user && (
//                   <>
//                     <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

//                     <a
//                       onClick={() => navigate("/scores")}
//                       className="group flex items-center gap-3 text-white/80 hover:text-green-400 font-medium transition-all duration-300 cursor-pointer p-3 rounded-xl hover:bg-white/5"
//                     >
//                       <Trophy
//                         size={20}
//                         className="group-hover:rotate-12 transition-transform duration-300"
//                       />
//                       <span>My Scores</span>
//                       <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//                         <Zap size={16} className="text-green-400" />
//                       </div>
//                     </a>

//                     <button
//                       onClick={handleLogout}
//                       className="group flex items-center gap-3 text-red-400 hover:text-red-300 font-medium transition-all duration-300 w-full p-3 rounded-xl hover:bg-red-500/5"
//                     >
//                       <LogOut
//                         size={20}
//                         className="group-hover:rotate-12 transition-transform duration-300"
//                       />
//                       <span>Log Out</span>
//                     </button>
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Spacer to prevent content from hiding behind fixed header */}
//       <div className="h-20"></div>

//       <style jsx>{`
//         .animation-delay-2000 {
//           animation-delay: 2s;
//         }

//         @keyframes float {
//           0%,
//           100% {
//             transform: translateY(0px);
//           }
//           50% {
//             transform: translateY(-10px);
//           }
//         }

//         .animate-float {
//           animation: float 3s ease-in-out infinite;
//         }
//       `}</style>
//     </>
//   );
// }

import React, { useState, useRef, useEffect } from "react";
import { Menu, X, Trophy, LogOut, Zap } from "lucide-react";
import { Button } from "../ui/HeaderButton";
import { auth } from "../firebase"; // Import Firebase auth
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null); // This will now be synced with Firebase
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "backdrop-blur-xl bg-[#0a0a23]/80 shadow-2xl border-b border-green-500/20"
            : "bg-gradient-to-r from-[#0a0a23]/90 via-[#0a0a23]/95 to-[#0a0a23]/90"
        }`}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-24 h-24 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-full blur-lg animate-pulse animation-delay-2000"></div>

          {/* Animated Grid */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)`,
                backgroundSize: "30px 30px",
              }}
            ></div>
          </div>

          {/* Glowing Line */}
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-50"></div>
        </div>

        <div className="relative max-w-7xl mx-auto flex justify-between items-center px-4 py-4">
          {/* Logo with enhanced effects */}
          <div className="relative group">
            <h1
              onClick={() => navigate("/intro")}
              className="text-[#ffffffd5] text-3xl md:text-4xl font-extrabold tracking-wider cursor-pointer relative z-10 transition-all duration-300 hover:scale-105"
            >
              <span className="relative inline-block">
                KNOW
                <span className="absolute inset-0 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  KNOW
                </span>
              </span>
              <span className="text-[#00ba4a] relative inline-block ml-1 group-hover:animate-pulse">
                IZ
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></span>
              </span>
              <span className="ml-2 text-2xl group-hover:animate-bounce inline-block">
                🧠
              </span>
            </h1>

            {/* Glow effect behind logo */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-4">
              <Button />

              {user && (
                <div className="flex items-center gap-4">
                  <a
                    onClick={() => navigate("/scores")}
                    className="group flex items-center gap-2 text-white/80 hover:text-green-400 font-medium transition-all duration-300 cursor-pointer relative"
                  >
                    <Trophy
                      size={18}
                      className="group-hover:rotate-12 transition-transform duration-300"
                    />
                    <span className="relative">
                      My Scores
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-400 group-hover:w-full transition-all duration-300"></span>
                    </span>
                  </a>

                  <button
                    onClick={handleLogout}
                    className="group flex items-center gap-2 text-red-400 hover:text-red-300 font-medium transition-all duration-300 hover:scale-105"
                  >
                    <LogOut
                      size={18}
                      className="group-hover:rotate-12 transition-transform duration-300"
                    />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative text-[#ffffffd5] focus:outline-none p-2 rounded-lg hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="relative">
                {menuOpen ? (
                  <X
                    size={28}
                    className="group-hover:rotate-90 transition-transform duration-300"
                  />
                ) : (
                  <Menu
                    size={28}
                    className="group-hover:scale-110 transition-transform duration-300"
                  />
                )}

                {/* Glow effect */}
                <div className="absolute inset-0 bg-green-400/20 blur-md opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            menuOpen
              ? "max-h-96 opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div ref={menuRef} className="mx-4 mb-4">
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 shadow-2xl">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl"></div>

              <div className="relative space-y-4">
                <div className="flex justify-center">
                  <Button />
                </div>

                {user && (
                  <>
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                    <a
                      onClick={() => navigate("/scores")}
                      className="group flex items-center gap-3 text-white/80 hover:text-green-400 font-medium transition-all duration-300 cursor-pointer p-3 rounded-xl hover:bg-white/5"
                    >
                      <Trophy
                        size={20}
                        className="group-hover:rotate-12 transition-transform duration-300"
                      />
                      <span>My Scores</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Zap size={16} className="text-green-400" />
                      </div>
                    </a>

                    <button
                      onClick={handleLogout}
                      className="group flex items-center gap-3 text-red-400 hover:text-red-300 font-medium transition-all duration-300 w-full p-3 rounded-xl hover:bg-red-500/5"
                    >
                      <LogOut
                        size={20}
                        className="group-hover:rotate-12 transition-transform duration-300"
                      />
                      <span>Log Out</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from hiding behind fixed header */}
      <div className="h-20"></div>

      <style jsx>{`
        .animation-delay-2000 {
          animation-delay: 2s;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
