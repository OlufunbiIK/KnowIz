import { useSearchParams } from "react-router-dom";
import IntegratedCategoryPage from "./category/AllCategories";
import backgroundImage from "../assets/images/626f4775-3aec-427d-b099-016eaaa82613.jpg";
import "../index.css";
import IntegratedDifficultyPage from "./level/AllLevels";
import IntegratedDisplayPage, {
  MultipleChoiceContent,
  TrueFalseContent,
} from "./display/AllDisplays";

export default function Display() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const level = searchParams.get("level");
  const type = searchParams.get("type");
  const category = searchParams.get("category");

  const selected = mode || level || type || category;

  return (
    <div
      className="relative min-h-screen p-6 bg-cover bg-center bg-no-repeat flex justify-center items-center pt-[10rem]"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-60 z-0" />

      <div className="relative z-10 bg-white/80 backdrop-blur-md p-6 rounded-md shadow-md w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-4 text-center text-[#0a0a23]">
          Selected Option: {selected}
        </h1>

        <div className="mt-8 text-center text-black">
          {/* {mode === "Flip Cards" && <FlipCard />}
          {mode === "Multiple Choice" && <MultipleChoices />}
          {mode === "True/False" && <TrueOrFalse />} */}

          {mode && <IntegratedDisplayPage selected={mode} />}

          {(level === "Easy" || level === "Hard" || level === "Medium") && (
            <IntegratedDifficultyPage />
          )}

          {type === "Multiple Choice" && <MultipleChoiceContent />}
          {type === "True/False" && <TrueFalseContent />}

          {category && <IntegratedCategoryPage selectedCategory={category} />}
        </div>
      </div>
    </div>
  );
}
