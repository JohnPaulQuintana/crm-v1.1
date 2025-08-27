import React from "react";
import { Database } from "lucide-react";

interface DescriptionPreviewProps {
  description: string;
  columns?: string[];
}

const DescriptionPreview: React.FC<DescriptionPreviewProps> = ({
  description,
  columns = [],
}) => {
  // Split description by dash and trim whitespace
  const descriptionLines = description
    ? description.split("-").map((line) => line.trim()).filter(Boolean)
    : [];

  return (
    <div className="p-4 bg-white rounded-2xl shadow-md space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Description</h2>
      <div className="text-gray-700 space-y-1">
        {descriptionLines.length > 0 ? (
          descriptionLines.map((line, idx) => <p key={idx}>{line}</p>)
        ) : (
          <p>No description available.</p>
        )}
      </div>

      {columns.length > 0 && (
        <div>
          <h3 className="text-md font-semibold text-gray-800 mb-2">Columns</h3>
          <ul className="grid grid-cols-4 gap-2">
            {columns.map((col) => (
              <li
                key={col}
                className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg shadow-sm"
              >
                <Database className="w-4 h-4 text-blue-500" />
                <span className="text-gray-700">{col}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DescriptionPreview;
