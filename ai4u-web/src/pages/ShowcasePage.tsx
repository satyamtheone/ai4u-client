import React from "react";
import { useParams, Link } from "react-router-dom";
import DynamicButton from "../commonComponents/DynamicButton";
import { StepProgressBar } from "../commonComponents/StepProgressBar";
import { FormTextArea } from "../commonComponents/FormTextArea";
import { FormSelect } from "../commonComponents/FormSelect";
import ComponentShowcase from "../components/RefactoredComponents/RefactoredShowcase/ComponentShowCase";

// ✅ Define all showcase components in one place
const showcaseComponents = {
  button: {
    name: "DynamicButton",
    component: DynamicButton,
    variants: ["submit", "primary", "secondary", "pill"],
    propsConfig: { label: "Click Me 🚀" },
  },

  stepProgress: {
    name: "StepProgressBar",
    component: StepProgressBar,
    variants: [""],
    propsConfig: {
      totalSteps: 5,
      currentStep: 3,
      className: "w-full max-w-md mx-auto mt-4",
    },
  },

  formTextArea: {
    name: "FormTextArea",
    variants: [""],
    component: FormTextArea,
    propsConfig: {
      label: "Your Message",
      placeholder: "Type something here...",
      hint: "You can write up to 500 characters.",
      required: true,
    },
  },

  formSelect: {
    name: "FormSelect",
    variants: [""],
    component: FormSelect,
    propsConfig: {
      label: "Select Country",
      options: [
        { value: "in", label: "India" },
        { value: "us", label: "USA" },
        { value: "uk", label: "UK" },
      ],
      hint: "Pick your country",
      required: true,
    },
  },
};

const ShowcasePage: React.FC = () => {
  const { component } = useParams();
  const showcase =
    showcaseComponents[component as keyof typeof showcaseComponents];

  if (!showcase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-semibold mb-6">Component not found</h1>
      </div>
    );
  }

  const {
    name,
    component: Comp,
    variants = ["default"],
    propsConfig,
  } = showcase;

  return (
    <>
      <div className=" py-6 flex flex-wrap justify-center gap-4">
        {Object.keys(showcaseComponents).map((key) => (
          <Link
            key={key}
            to={`/showcase/${key}`}
            className="px-5 py-1  bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md"
          >
            {showcaseComponents[key as keyof typeof showcaseComponents].name}
          </Link>
        ))}
      </div>

      <ComponentShowcase
        name={name}
        Component={Comp}
        variants={variants}
        propsConfig={propsConfig}
      />
    </>
  );
};

export default ShowcasePage;
