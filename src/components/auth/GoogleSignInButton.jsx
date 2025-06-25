import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup, signInWithRedirect } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";

const GoogleSignInButton = ({ onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); // ⬅️ useNavigate from react-router-dom

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log("Sign-in successful:", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      if (onSuccess) onSuccess(user);

      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userName", user.displayName || user.email);

      // ⬇️ Redirect to login page
      navigate("/intro");
    } catch (error) {
      console.error("Error during sign-in:", error);

      if (error.code === "auth/popup-closed-by-user") {
        console.log("Sign-in cancelled by user");
      } else if (error.code === "auth/popup-blocked") {
        console.log("Popup blocked, trying redirect method...");
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError) {
          console.error("Redirect sign-in also failed:", redirectError);
          if (onError) onError(redirectError);
        }
      } else {
        if (onError) onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };
  const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" className="mr-2">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className={`flex items-center justify-center w-full sm:max-w-sm px-4 py-3 rounded-lg border border-gray-300 text-base font-medium text-gray-700 bg-white hover:bg-gray-100 shadow transition-all duration-200 ease-in-out ${
        isLoading ? "opacity-70 cursor-not-allowed" : "hover:shadow-md"
      }`}
    >
      {isLoading ? (
        <>
          <span className="mr-2 animate-spin w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full" />
          Signing in...
        </>
      ) : (
        <>
          <GoogleIcon />
          <span className="truncate">Continue with Google</span>
        </>
      )}
    </button>
  );
};

export default GoogleSignInButton;
