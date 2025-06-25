import { useState, useEffect } from "react";
import { FlipCardsContent } from "../../pages/FlipCard";
import { MultipleChoiceContent } from "../../pages/MultipleChoice";
import { TrueFalseContent } from "../../pages/TrueOrFalse";

const displayMode = [
  {
    id: "flip-cards",
    name: "Flip Cards",
    emoji: "🎴",
    description: "Interactive flashcards with smooth flip animations",
    color: "from-purple-500 via-purple-600 to-purple-700",
    hoverColor:
      "hover:from-purple-600 hover:via-purple-700 hover:to-purple-800",
  },
  {
    id: "multiple-choice",
    name: "Multiple Choice",
    emoji: "📝",
    description: "Traditional quiz with multiple answer options",
    color: "from-blue-500 via-blue-600 to-blue-700",
    hoverColor: "hover:from-blue-600 hover:via-blue-700 hover:to-blue-800",
  },
  {
    id: "true-false",
    name: "True/False",
    emoji: "✅",
    description: "Simple true or false questions",
    color: "from-emerald-500 via-emerald-600 to-emerald-700",
    hoverColor:
      "hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800",
  },
];

export const DisplayContent = ({ selectedMode, refreshTrigger }) => {
  const modeObj = displayMode.find(
    (mode) =>
      mode.name.toLowerCase() === selectedMode?.toLowerCase() ||
      mode.id === selectedMode?.toLowerCase()
  );

  if (!selectedMode) {
    return (
      <div className="p-8 text-center text-[#0c1125]">
        Please select a display mode to start
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm mt-4">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{modeObj?.emoji}</span>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{modeObj?.name}</h2>
          <p className="text-gray-600 text-sm">{modeObj?.description}</p>
        </div>
      </div>

      {selectedMode === "Flip Cards" && (
        <FlipCardsContent
          key={`flip-${refreshTrigger}`}
          isActive
          refreshTrigger={refreshTrigger}
        />
      )}
      {selectedMode === "Multiple Choice" && (
        <MultipleChoiceContent
          key={`mc-${refreshTrigger}`}
          isActive
          refreshTrigger={refreshTrigger}
        />
      )}
      {selectedMode === "True/False" && (
        <TrueFalseContent
          key={`tf-${refreshTrigger}`}
          isActive
          refreshTrigger={refreshTrigger}
        />
      )}
    </div>
  );
};

const IntegratedDisplayPage = ({ selectedMode: propMode }) => {
  const [selectedDisplayMode, setSelectedDisplayMode] = useState(
    propMode || ""
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (propMode) {
      setSelectedDisplayMode(propMode);
    }
  }, [propMode]);

  const handleModeChange = (e) => {
    setSelectedDisplayMode(e.target.value);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleCardClick = (mode) => {
    if (selectedDisplayMode === mode.name) {
      // Refresh if same mode clicked
      setRefreshTrigger((prev) => prev + 1);
    } else {
      // Change mode and refresh
      setSelectedDisplayMode(mode.name);
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const renderActiveComponent = () => {
    if (selectedDisplayMode === "Flip Cards") {
      return (
        <FlipCardsContent
          key={`flip-${refreshTrigger}`}
          isActive
          refreshTrigger={refreshTrigger}
        />
      );
    }

    if (selectedDisplayMode === "Multiple Choice") {
      return (
        <MultipleChoiceContent
          key={`mc-${refreshTrigger}`}
          isActive
          refreshTrigger={refreshTrigger}
        />
      );
    }

    if (selectedDisplayMode === "True/False") {
      return (
        <TrueFalseContent
          key={`tf-${refreshTrigger}`}
          isActive
          refreshTrigger={refreshTrigger}
        />
      );
    }

    return (
      <div className="p-8 text-center text-gray-500">
        Please select a quiz mode to begin.
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
          Quiz Display Modes
        </h1>

        {/* Dropdown for small screens */}
        <div className="lg:hidden mb-6">
          <select
            onChange={handleModeChange}
            value={selectedDisplayMode}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm bg-white"
          >
            <option value="" disabled>
              Select quiz mode...
            </option>
            {displayMode.map((mode) => (
              <option key={mode.id} value={mode.name}>
                {mode.emoji} {mode.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cards for larger screens */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-4 mb-6">
          {displayMode.map((mode) => (
            <div
              key={mode.id}
              onClick={() => handleCardClick(mode)}
              className={`p-4 cursor-pointer rounded-xl text-white shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r ${
                mode.color
              } ${
                selectedDisplayMode === mode.name ? "ring-2 ring-white" : ""
              }`}
            >
              <div className="text-center space-y-1">
                <div className="text-3xl">{mode.emoji}</div>
                <h3 className="text-lg font-bold">{mode.name}</h3>
                <p className="text-sm opacity-90">{mode.description}</p>
                <p className="text-xs mt-1 opacity-70">
                  {selectedDisplayMode === mode.name
                    ? "Click to refresh questions"
                    : "Click to select"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Render Selected Component */}
        {renderActiveComponent()}
      </div>
    </div>
  );
};

export default IntegratedDisplayPage;
