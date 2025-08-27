import React from "react";
import type { SqlFile } from "../../../types";
import { SqlPreview } from "./SqlPreview";
import { ResultPanel } from "./ResultPanel";
import DescriptionPreview from "./Description";
import StatusCard from "./StatusCard";
interface SqlRightPanelProps {
  activeTabRight: string;
  // setActiveTabRight: (tab: string) => void;
  sqlFiles: SqlFile[];
  isRequesting: boolean;
  // elapsedMs: number;
  tableData: any[];
  // dbName: string;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onCredentials: () => void;
  showSupersetError: { title: string; text: string };
  scriptDescription: { columns: string[]; description: string };
}

export const SqlRightPanel: React.FC<SqlRightPanelProps> = ({
  activeTabRight,
  // setActiveTabRight,
  sqlFiles,
  isRequesting,
  // elapsedMs,
  tableData,
  // dbName,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onCredentials,
  showSupersetError,
  scriptDescription
}) => {
  return (
    <div className="col-span-3 flex flex-col bg-white rounded-lg shadow-md p-4 font-mono text-sm">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          {/* SQL Preview tab - keep onClick commented */}
          <button
            // onClick={() => setActiveTabRight('sql')}
            className={`hidden px-3 py-2 font-semibold rounded transition pointer-events-none ${
              activeTabRight === "sql"
                ? "text-white bg-green-500"
                : "text-gray-700 bg-gray-200"
            }`}
            disabled={isRequesting} // disabled while running
          >
            SQL Preview
          </button>

          {/* Script Description tab */}
          <button
            // onClick={() => setActiveTabRight("description")}
            className={`px-3 py-2 font-semibold rounded transition pointer-events-none ${
              activeTabRight === "description"
                ? "text-white bg-green-500"
                : "text-gray-700 bg-gray-200"
            }`}
            disabled={isRequesting}
          >
            Script Description
          </button>

          {/* Result tab */}
          <button
            // onClick={() => setActiveTabRight("result")}
            className={`px-3 py-2 font-semibold rounded transition pointer-events-none ${
              activeTabRight === "result"
                ? "text-white bg-green-500"
                : "text-gray-700 bg-gray-200"
            }`}
            disabled={isRequesting}
          >
            Result
          </button>
        </div>

        <div className="hidden">
          <button
            onClick={onCredentials}
            disabled={isRequesting} // ⬅ disable while running
            className="px-3 py-2 bg-gray-200 font-semibold text-gray-700 rounded hover:bg-green-500 hover:text-white transition"
          >
            Credentials
          </button>
        </div>

        <StatusCard isRequesting={isRequesting} />
      </div>

      <div className="flex-1 max-h-[80vh] overflow-y-auto">
        {/* // Completed state with final time */}

        {activeTabRight === "sql" && <SqlPreview sqlFiles={sqlFiles} />}
        {activeTabRight === "result" && (
          <ResultPanel
            // isRequesting={isRequesting}
            // elapsedMs={elapsedMs}
            tableData={tableData}
            // dbName={dbName}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={onPageChange}
            showSupersetError={showSupersetError}
          />
        )}
        {activeTabRight === "description" && (
          <DescriptionPreview
            description={scriptDescription.description}
            columns={scriptDescription.columns}
          />
        )}
      </div>
    </div>
  );
};
