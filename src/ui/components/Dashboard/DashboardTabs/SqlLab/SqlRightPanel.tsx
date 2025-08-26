import React from 'react';
import type { SqlFile } from '../../../types';
import { SqlPreview } from './SqlPreview';
import { ResultPanel } from './ResultPanel';

interface SqlRightPanelProps {
  activeTabRight: string;
  setActiveTabRight: (tab: string) => void;
  sqlFiles: SqlFile[];
  isRequesting: boolean;
  elapsedMs: number;
  tableData: any[];
  dbName: string;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onCredentials: () => void;
}

export const SqlRightPanel: React.FC<SqlRightPanelProps> = ({
  activeTabRight,
  setActiveTabRight,
  sqlFiles,
  isRequesting,
  elapsedMs,
  tableData,
  dbName,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onCredentials
}) => {
  return (
    <div className="col-span-3 flex flex-col bg-white rounded-lg shadow-md p-4 font-mono text-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTabRight('sql')}
            className={`px-3 py-2 font-semibold rounded transition ${
              activeTabRight === 'sql'
                ? 'text-white bg-green-500'
                : 'text-gray-700 bg-gray-200 hover:bg-green-500 hover:text-white'
            }`}
            disabled={isRequesting} // ⬅ disable while running
          >
            SQL Preview
          </button>
          <button
            onClick={() => setActiveTabRight('result')}
            className={`px-3 py-2 font-semibold rounded transition ${
              activeTabRight === 'result'
                ? 'text-white bg-green-500'
                : 'text-gray-700 bg-gray-200 hover:bg-green-500 hover:text-white'
            }`}
            disabled={isRequesting} // ⬅ disable while running
          >
            Result
          </button>
        </div>
        <div>
          <button
            onClick={onCredentials}
            disabled={isRequesting} // ⬅ disable while running
            className="px-3 py-2 bg-gray-200 font-semibold text-gray-700 rounded hover:bg-green-500 hover:text-white transition"
          >
            Credentials
          </button>
        </div>
      </div>

      <div className="flex-1 max-h-[80vh] overflow-y-auto">
        {activeTabRight === 'sql' && <SqlPreview sqlFiles={sqlFiles} />}
        {activeTabRight === 'result' && (
          <ResultPanel
            isRequesting={isRequesting}
            elapsedMs={elapsedMs}
            tableData={tableData}
            dbName={dbName}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </div>
  );
};