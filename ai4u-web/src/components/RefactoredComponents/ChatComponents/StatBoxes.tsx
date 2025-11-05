import { StatsBoxProps } from "../../../commonComponents/Types";

const StatBoxes = ({
  details,
  value,
  isActive,
}: {
  details: StatsBoxProps;
  value: any;
  isActive?: boolean;
}) => {
  return (
    <div
      className={`flex items-center gap-3 cursor-pointer md:p-5 p-2 rounded-xl border border-gray-100 dark:border-gray-600    shadow-md transition-all hover:-translate-y-0.5 hover:border-emerald-500 ${
        isActive &&
        " border-emerald-500 bg-gradient-to-br dark:from-emerald-500/10  dark:to-emerald-700/10 "
      } `}
    >
      {details.icon}
      <div className="flex flex-col">
        <div className="text-xs dark:text-gray-400 mb-1 text-black">
          {details.title}
        </div>
        <div className="text-xl font-semibold dark:text-white text-black">
          {value}
          {details.title === "Accuracy" && "%"}
        </div>
      </div>
    </div>
  );
};

export default StatBoxes;
