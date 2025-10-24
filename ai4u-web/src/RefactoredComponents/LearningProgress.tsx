import { QuizStats } from "../store/quizSlice";
import { LearningBoxes } from "./Constants";
import StatBoxes from "./ChatComponents/StatBoxes";
import DynamicDropDown from "../commonComponents/DynamicDropDown";
import { useAppSelector } from "../hooks/redux";
import { useEffect, useState } from "react";

const LearningProgress = ({
  handleToggleLearningGates,
  learningGatesEnabled,
}: {
  handleToggleLearningGates: () => void;
  learningGatesEnabled: boolean;
}) => {
  const [currentStats, setCurrentStats] = useState<Partial<QuizStats>>({});
  const learningService = useAppSelector(
    (state) => (state.config as any).learningService
  );

  useEffect(() => {
    // Guard: don’t call before the service exists
    if (
      !learningService ||
      typeof learningService.getLearningStats !== "function"
    ) {
      console.warn("LearningService not initialized yet");
      return;
    }
    const fetchLearningStats = async () => {
      try {
        console.log("Fetching learning stats...");
        const stats = await learningService.getLearningStats();
        setCurrentStats(stats as QuizStats);
      } catch (err) {
        console.error("❌ Failed to fetch learning stats:", err);
      }
    };

    fetchLearningStats();
  }, [learningService]);
  return (
    <DynamicDropDown
      title="🎓 Learning Progress"
      rightElement={
        <button
          onClick={handleToggleLearningGates}
          className={`md:px-4 px-2 md:py-2 py-1 rounded-lg text-xs font-medium transition-colors ${
            learningGatesEnabled
              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
              : "bg-gray-500 text-white cursor-not-allowed"
          }`}
        >
          {learningGatesEnabled ? "Disable" : "Enable"} Learning Gates
        </button>
      }
    >
      <div className="grid md:grid-cols-4 grid-cols-2 gap-4 ">
        {LearningBoxes.map((details, i) => {
          const key = details.value?.toLowerCase().trim();
          const statValue =
            key && key in currentStats
              ? currentStats[key as keyof QuizStats]
              : 0;

          console.log("Rendering stat:", details.title, "Value:", statValue);

          return (
            <StatBoxes
              details={details}
              value={statValue}
              key={i}
              // isActive={details.title === "Responses Left"}
            />
          );
        })}
      </div>
    </DynamicDropDown>
  );
};

export default LearningProgress;
