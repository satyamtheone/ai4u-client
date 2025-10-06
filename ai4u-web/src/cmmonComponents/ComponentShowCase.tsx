import React, { useState } from "react";

interface ComponentShowcaseProps {
  name: string;
  Component: React.FC<any>;
  variants?: string[];
  defaultVariant?: string;
  sizes?: string[];
  defaultSize?: string;
  propsConfig?: Record<string, any>;
}

const ComponentShowcase: React.FC<ComponentShowcaseProps> = ({
  name,
  Component,
  variants = ["default"],
  defaultVariant = "default",
  sizes = ["default"],
  defaultSize = "default",
  propsConfig = {},
}) => {
  const [variant, setVariant] = useState(defaultVariant);
  const [size, setSize] = useState(defaultSize);

  const codeExample = `
<${name} 
  variant="${variant}"
  size="${size}
  ${Object.entries(propsConfig)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ")}
/>
  `.trim();

  return (
    <div className="h-4/5 flex flex-col md:flex-row dark:bg-darkBackGround-50 bg-gray-200 text-white p-6 gap-6">
      {/* Left side — Live Preview */}
      <div className="flex-1 flex flex-col items-center justify-center dark:bg-darkBackGround-1150 bg-gray-800 rounded-2xl p-8 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">{name} Preview</h2>
        <Component variant={variant} {...propsConfig} />

        {/* Variant Switcher */}
        {variants && variants.length > 1 && (
          <div className="flex flex-wrap w-full justify-center gap-4 mt-10">
            {variants.map((v) => (
              <button
                key={v}
                onClick={() => setVariant(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  variant === v
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}

        {sizes.length > 1 && (
          <div className="flex flex-wrap w-full justify-center gap-4 mt-10">
            {sizes.map((v) => (
              <button
                key={v}
                onClick={() => setSize(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  variant === v
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right side — Code Section */}
      <div className=" md:w-2/4 dark:bg-darkBackGround-1150 bg-gray-800 rounded-2xl p-8 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Code Example</h2>
        <pre className="bg-[#0f1115] text-blue-300 rounded-xl p-6 overflow-x-auto font-mono text-sm leading-relaxed border border-gray-700">
          {codeExample}
        </pre>
      </div>
    </div>
  );
};

export default ComponentShowcase;
