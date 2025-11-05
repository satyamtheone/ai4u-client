import { QuizStats } from "../../store/quizSlice";
import { LearningBoxes } from "./Constants";
import StatBoxes from "./ChatComponents/StatBoxes";
import DynamicDropDown from "../../commonComponents/DynamicDropDown";
import { useGetLearningStatsQuery } from "../../services/api/learningApi";

const LearningProgress = ({
  handleToggleLearningGates,
  learningGatesEnabled,
}: {
  handleToggleLearningGates: () => void;
  learningGatesEnabled: boolean;
}) => {
  const { data: learningStats } = useGetLearningStatsQuery();
  const currentStats: QuizStats = learningStats ?? ({} as QuizStats);

  return (
    <DynamicDropDown
      title="🎓 Learning Progress"
      className="border-l-0"
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
            key && currentStats && key in currentStats
              ? currentStats[key as keyof QuizStats]
              : 0;

          return <StatBoxes details={details} value={statValue} key={i} />;
        })}
      </div>
    </DynamicDropDown>
  );
};

export default LearningProgress;
