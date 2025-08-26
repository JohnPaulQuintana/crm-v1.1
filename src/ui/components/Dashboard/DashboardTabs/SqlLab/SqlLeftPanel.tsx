import React, { useMemo, memo } from "react";
import type { SqlFile } from "../../../types";

interface SqlLeftPanelProps {
  brands: string[];
  files: string[];
  selectedBrand: string;
  selectedFile: string;
  sqlFiles: SqlFile[];
  isRequesting: boolean;
  inputValues: Record<string, string>;
  onBrandChange: (brand: string) => void;
  onFileChange: (file: string) => void;
  onPlaceholderChange: (placeholderKey: string, value: string) => void;
  onExecute: () => void;
  setActiveTabRight: (tab: string) => void;
  setShowVpnInfo: (info: { title: string; text: string }) => void; // setter
  setShow: (show: boolean) => void; // setter function
}

export const SqlLeftPanel: React.FC<SqlLeftPanelProps> = memo(
  ({
    brands,
    files,
    selectedBrand,
    selectedFile,
    sqlFiles,
    isRequesting,
    inputValues,
    onBrandChange,
    onFileChange,
    onPlaceholderChange,
    onExecute,
    setActiveTabRight,
    setShowVpnInfo,
    setShow,
  }) => {
    // Get unique editable segments
    const uniqueEditableSegments = useMemo(() => {
      if (sqlFiles.length === 0) return [];

      const seenValues = new Set();
      const uniqueSegments: { value: string; label: string }[] = [];

      sqlFiles[0].parsedSegments.forEach((seg) => {
        if (seg.editable && seg.value && !seenValues.has(seg.value)) {
          seenValues.add(seg.value);
          uniqueSegments.push({ value: seg.value, label: seg.label });
        }
      });

      return uniqueSegments;
    }, [sqlFiles]);

    const handleExecuteClick = () => {
      // Check for empty required inputs
      const emptyInputs = uniqueEditableSegments.filter(
        (seg) => !inputValues[seg.value]?.trim()
      );

      if (emptyInputs.length > 0) {
        setShow(true);
        setShowVpnInfo({
          title: "Validation Failed",
          text: `Please fill in all required fields: ${emptyInputs
            .map((seg) => seg.label)
            .join(", ")}`,
        });
        // alert(
        //   `Please fill in all required fields: ${emptyInputs
        //     .map((seg) => seg.label)
        //     .join(", ")}`
        // );
        return; // stop execution
      }

      onExecute(); // call parent only if validation passes
    };

    return (
      <div className="flex flex-col space-y-4 bg-white rounded-lg shadow-md p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-700">
          Editable Contents
        </h2>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600">Brand</label>
          <select
            value={selectedBrand}
            onChange={(e) => onBrandChange(e.target.value)}
            disabled={isRequesting} // ⬅ disable while running
            className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select Brand</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {files.length > 0 && (
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600">
              SQL Files
            </label>
            <select
              value={selectedFile}
              onChange={(e) => {
                setActiveTabRight("sql");
                onFileChange(e.target.value);
              }}
              disabled={isRequesting} // ⬅ disable while running
              className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select File</option>
              {files.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        )}

        {uniqueEditableSegments.map((seg) => (
          <div key={seg.value} className="flex flex-col">
            <label className="text-sm font-medium text-gray-600">
              {seg.label}
            </label>
            <input
              type="text"
              value={inputValues[seg.value] || ""}
              onChange={(e) => onPlaceholderChange(seg.value, e.target.value)}
              disabled={isRequesting} // ⬅ disable while running
              className="border border-gray-300 text-gray-700 font-semibold rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter value..."
            />
          </div>
        ))}

        <button
          onClick={handleExecuteClick}
          disabled={isRequesting}
          className={`mt-2 w-full px-4 py-2 rounded transition-colors 
          ${
            isRequesting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {isRequesting ? "Processing..." : "Execute"}
        </button>
      </div>
    );
  }
);

SqlLeftPanel.displayName = "SqlLeftPanel";
