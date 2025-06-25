// import { useEffect, useState } from "react";
// import { db, auth } from "../firebase"; // adjust path as needed
// import { collection, query, where, getDocs } from "firebase/firestore";
// import { useNavigate } from "react-router-dom";

// export default function ScoreHistory() {
//   const [scores, setScores] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const navigate = useNavigate();

//   useEffect(() => {
//     const user = auth.currentUser;
//     if (!user) {
//       navigate("/login");
//     }
//   }, []);
//   useEffect(() => {
//     const fetchScores = async () => {
//       const user = auth.currentUser;
//       if (!user) {
//         setScores([]);
//         setLoading(false);
//         return;
//       }

//       const q = query(collection(db, "scores"), where("uid", "==", user.uid));
//       const snapshot = await getDocs(q);
//       const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
//       setScores(data);
//       setLoading(false);
//     };

//     fetchScores();
//   }, []);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <p className="text-gray-600 text-xl">Loading scores...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen pt-[8rem] p-4 bg-gray-100">
//       <h3 className="text-lg font-semibold text-[#0c1125]">
//         {scores.quizType}
//         <span className="text-gray-500 text-sm">({scores.quizId})</span>
//       </h3>

//       <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
//         📊 Your Quiz Scores
//       </h2>

//       {scores.length === 0 ? (
//         <p className="text-center text-gray-600">No scores found.</p>
//       ) : (
//         <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
//           {scores
//             .sort((a, b) => new Date(b.date) - new Date(a.date))
//             .map((score) => (
//               <div
//                 key={score.id}
//                 className="bg-white rounded-lg shadow p-4 border-l-4 border-[#00ba4a]"
//               >
//                 <div className="flex justify-between items-center mb-2">
//                   <h3 className="text-lg font-semibold text-[#0c1125]">
//                     {score.quizType}: {score.quizId}
//                   </h3>
//                   <span className="text-sm text-gray-500">
//                     {new Date(score.date).toLocaleDateString()}
//                   </span>
//                 </div>
//                 <p className="text-gray-700">
//                   ✅ Correct:{" "}
//                   <span className="font-semibold">{score.correct}</span> /{" "}
//                   {score.total}
//                 </p>
//                 <p className="text-gray-700">
//                   ❌ Wrong: <span className="font-semibold">{score.wrong}</span>
//                 </p>
//                 <p className="mt-2 text-lg font-bold text-[#00ba4a]">
//                   🏆 {score.score}% Score
//                 </p>
//               </div>
//             ))}
//         </div>
//       )}
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Trophy } from "lucide-react";

export default function ScoreHistory() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchScores = async () => {
      const user = auth.currentUser;
      if (!user) {
        setScores([]);
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "scores"), where("uid", "==", user.uid));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setScores(data);
      } catch (err) {
        console.error("Error fetching scores:", err);
        setScores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  const filteredScores = scores
    .filter((score) => (filter === "all" ? true : score.quizType === filter))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const colorMap = {
    "Multiple Choice": "blue",
    "True/False": "green",
    "Flip Cards": "purple",
  };

  const iconMap = {
    "Multiple Choice": "📝",
    "True/False": "✅",
    "Flip Cards": "🎴",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-xl">Loading scores...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[8rem] p-4 bg-gray-100">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        📊 Your Quiz Scores
      </h2>

      {/* Filter Buttons */}
      <div className="flex justify-center gap-4 mb-6 flex-wrap">
        {["all", "Multiple Choice", "True/False", "Flip Cards"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === type
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {iconMap[type] || "📚"} {type === "all" ? "All Quizzes" : type}
          </button>
        ))}
      </div>

      {filteredScores.length === 0 ? (
        <p className="text-center text-gray-600">No scores found.</p>
      ) : (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredScores.map((score) => {
            const color = colorMap[score.quizType] || "gray";
            return (
              <div
                key={score.id}
                className={`bg-white rounded-lg shadow p-4 border-l-4 border-${color}-500`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-[#0c1125]">
                    {iconMap[score.quizType] || "📘"} {score.quizType}
                    <span className="block text-sm text-gray-500">
                      {score.quizId}
                    </span>
                  </h3>
                  <span className="text-sm text-gray-500">
                    {new Date(score.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700">
                  ✅ Correct:{" "}
                  <span className="font-semibold">{score.correct}</span> /{" "}
                  {score.total}
                </p>
                <p className="text-gray-700">
                  ❌ Wrong: <span className="font-semibold">{score.wrong}</span>
                </p>
                <p className="mt-2 text-lg font-bold text-green-600 flex items-center gap-1">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  {score.score}% Score
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
