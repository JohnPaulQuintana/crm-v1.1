import React from 'react';
import { CheckCircle } from 'lucide-react';
import { formatTime } from '../../../utils/timeFormatter';
import { exportToCSV, exportToExcel } from '../../../utils/exportUtils';

interface ResultPanelProps {
  isRequesting: boolean;
  elapsedMs: number;
  tableData: any[];
  dbName: string;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  isRequesting,
  elapsedMs,
  tableData,
  dbName,
  currentPage,
  totalPages,
  pageSize,
  onPageChange
}) => {
  const paginatedData = tableData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExportCSV = () => {
    const today = new Date().toISOString().split('T')[0];
    const fileName = `CRM-Report_${today}.csv`;
    exportToCSV(tableData, fileName);
  };

  const handleExportExcel = async () => {
    const today = new Date().toISOString().split('T')[0];
    const fileName = `CRM-Report_${today}.xlsx`;
    await exportToExcel(tableData, fileName);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="w-full border border-gray-300 rounded p-3 bg-gray-50 flex items-center gap-2">
        {isRequesting ? (
          <div className="loader-scrapper"></div>
        ) : (
          <CheckCircle className="w-6 h-6 text-green-600" />
        )}
        <h1>
          Sending request{' '}
          <span className="text-green-600">{formatTime(elapsedMs)}</span>
        </h1>
      </div>

      <div className="w-full border border-gray-300 rounded p-3 bg-gray-50 overflow-auto">
        {tableData.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1>{dbName}</h1>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleExportExcel}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Export Excel
                </button>
              </div>
            </div>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-green-100 text-green-900">
                  {Object.keys(tableData[0]).map((key) => (
                    <th
                      key={key}
                      className="px-4 py-2 text-left font-semibold uppercase tracking-wide"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`${
                      idx % 2 === 0 ? 'bg-green-50' : 'bg-green-25'
                    } hover:bg-green-200 transition-colors`}
                  >
                    {Object.keys(row).map((key) => (
                      <td
                        key={key}
                        className="border-t px-4 py-2 text-green-900"
                      >
                        {row[key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-green-500 hover:text-white transition disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-3 py-1">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-green-500 hover:text-white transition disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-500">No data to display</p>
        )}
      </div>
    </div>
  );
};