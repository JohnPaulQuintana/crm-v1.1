import React from "react";
import { Database, FileText, User } from "lucide-react";
import { motion } from "framer-motion";
import StatusCard from "./StatusCard";

interface DescriptionPreviewProps {
  activeTabRight: string;
  setActiveTabRight: (tab: string) => void;
  isRequesting: boolean;
  description: string;
  columns?: string[];
  taskInfo: any;
}

const DescriptionPreview: React.FC<DescriptionPreviewProps> = ({
  activeTabRight,
  setActiveTabRight,
  isRequesting,
  description,
  columns = [],
  taskInfo,
}) => {
  // Split by section titles (lines ending with ":")
  const sections = description
    ? description.split(/\n(?=\w.*?:)/g).map((sec) => sec.trim())
    : [];

  const renderSection = (section: string, idx: number) => {
    const [titleLine, ...bodyLines] = section.split("\n");
    console.log(titleLine)
    const title = titleLine.replace(/:$/, "").trim();
    // console.log(taskOwner)
    return (
      title && (
        <motion.div
        key={idx}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="bg-gray-50 p-4 rounded-xl shadow hover:shadow-md transition"
      >
        <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          {title}
        </h3>
        <div className="space-y-2">
          {bodyLines.map((line, i) => {
            // Key-value pair (e.g. "Start Date: 2025-09-14")
            if (/^.+?:\s+.+/.test(line)) {
              const [key, value] = line.split(/:\s+/, 2);
              return (
                <div
                  key={i}
                  className="grid grid-cols-3 bg-white px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition"
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
      </motion.div>
      )
    );
  };

  return (
    <div className="">
      {/* Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-3 rounded-sm">
        <h2 className="text-lg font-semibold text-white uppercase flex items-center gap-2">
          <FileText className="w-5 h-5" /> Description
        </h2>
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1.5 font-medium rounded-lg transition ${
              activeTabRight === "description"
                ? "bg-green-500 text-white"
                : "bg-green-600 text-white hover:bg-green-500"
            }`}
            onClick={() => setActiveTabRight("description")}
            disabled={isRequesting}
          >
            Script Description
          </button>
          <button
            className={`px-3 py-1.5 font-medium rounded-lg transition ${
              activeTabRight === "result"
                ? "bg-white text-green-700"
                : "bg-green-600 text-white hover:bg-green-500"
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
        className={`p-2 ${
          isRequesting ? "flex" : "hidden"
        } items-center justify-end bg-gradient-to-r from-green-200 via-green-400 to-green-600`}
      >
        <StatusCard color="text-white" isRequesting={isRequesting} />
      </div>

      {/* Main Content */}
      <div className=" bg-white rounded-2xl p-4 space-y-6">
        {/* Task Owner */}
        {taskInfo?.name && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-green-50 p-4 rounded-xl shadow-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-green-600" />
              <h3 className="text-lg font-semibold text-green-700">
                Task Owner:
              </h3>
              <p className="text-gray-700 text-lg">{taskInfo.requestor}</p>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-green-600" />
              <h3 className="text-lg font-semibold text-green-700">
                Script Author:
              </h3>
              <p className="text-gray-700 text-lg">{taskInfo.script_author}</p>
            </div>
          </motion.div>
        )}

        <div className="space-y-6">
          {sections.length > 0 ? (
            sections.map((s, idx) => renderSection(s, idx))
          ) : (
            <p className="font-semibold text-center text-xl text-gray-400">
              No description available.
            </p>
          )}
        </div>

        {/* Columns Section */}
        {columns.length > 0 && (
          <div className="px-4">
            <h2 className="text-lg font-semibold text-green-700 mb-2">
              Columns:
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {columns.map((col) => (
                <motion.li
                  key={col}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition flex gap-2 items-start break-words"
                >
                  <Database className="w-5 h-5 text-green-500 mb-2 flex-shrink-0" />
                  <div className="w-full text-gray-700 whitespace-pre-wrap break-words max-h-[300px] overflow-auto">
                    {col}
                  </div>
                </motion.li>
              ))}
            </ul>


          </div>
        )}
      </div>
    </div>
  );
};

export default DescriptionPreview;
