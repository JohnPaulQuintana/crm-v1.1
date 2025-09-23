import React from "react";
import { Database } from "lucide-react";
import StatusCard from "./StatusCard";

interface DescriptionPreviewProps {
  activeTabRight: string;
  setActiveTabRight: (tab: string) => void;
  isRequesting: boolean;
  description: string;
  columns?: string[];
}

const DescriptionPreview: React.FC<DescriptionPreviewProps> = ({
  activeTabRight,
  setActiveTabRight,
  isRequesting,
  description,
  columns = [],
}) => {
  // Split by section titles (lines ending with ":")
  const sections = description
    ? description.split(/\n(?=\w.*?:)/g).map((sec) => sec.trim())
    : [];

  const renderSection = (section: string, idx: number) => {
    const [titleLine, ...bodyLines] = section.split("\n");
    const title = titleLine.replace(/:$/, "").trim();

    return (
      <div key={idx} className="bg-gray-50 p-4 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-green-700 mb-3">{title}</h3>
        <div className="space-y-2">
          {bodyLines.map((line, i) => {
            // Key-value pair (e.g. "Start Date: 2025-09-14")
            if (/^.+?:\s+.+/.test(line)) {
              const [key, value] = line.split(/:\s+/, 2);
              return (
                <div
                  key={i}
                  className="grid grid-cols-3 bg-white px-3 py-2 rounded-md shadow-sm"
                >
                  <span className="font-medium text-gray-700">{key}</span>
                  <span className="col-span-2 text-gray-600">{value}</span>
                </div>
              );
            }
            // List item (Bonus Titles, Codes, Rules)
            if (/^[-•]/.test(line) || line.trim()) {
              return (
                <li key={i} className="text-gray-700 list-disc ml-6">
                  {line.replace(/^[-•]\s*/, "")}
                </li>
              );
            }
            return null;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="">
      {/* Header */}
      <div className="grid grid-cols-2 items-center justify-between bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-2">
        <h2 className="text-lg font-semibold text-white">Description</h2>
        <div className="flex items-center justify-end gap-2">
          <button
            className={`px-3 py-2 font-medium rounded-lg transition ${
              activeTabRight === "description"
                ? "text-white bg-green-500"
                : "text-gray-700 bg-gray-200"
            }`}
            onClick={() => setActiveTabRight("description")}
            disabled={isRequesting}
          >
            Script Description
          </button>
          <button
            className={`px-3 py-2 font-medium rounded-lg transition ${
              activeTabRight === "result"
                ? "bg-white text-green-700 shadow"
                : "bg-transparent text-white hover:bg-white/20"
            }`}
            onClick={() => setActiveTabRight("result")}
            disabled={isRequesting}
          >
            Result
          </button>
        </div>
      </div>

      {/* Loader */}
      <div
        className={`p-2 ${isRequesting ? "flex" : "hidden"} items-center justify-end bg-gradient-to-r from-green-200 via-green-400 to-green-600`}
      >
        <StatusCard color="text-white" isRequesting={isRequesting} />
      </div>

      {/* Main Content */}
      <div className="px-4 bg-white rounded-2xl space-y-4 pb-4 h-full">
        <div className="text-gray-700 py-4 space-y-6">
          {sections.length > 0 ? (
            sections.map((s, idx) => renderSection(s, idx))
          ) : (
            <p className="font-semibold text-xl text-gray-400">
              No description available.
            </p>
          )}
        </div>

        {/* Columns Section */}
        {columns.length > 0 && (
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-2">Columns</h3>
            <ul className="grid grid-cols-4 gap-2">
              {columns.map((col) => (
                <li
                  key={col}
                  className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg shadow-sm"
                >
                  <Database className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">{col}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DescriptionPreview;
