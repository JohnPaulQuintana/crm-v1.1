import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertTriangle,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Table,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { exportToCSV, exportToExcel } from "../../../utils/exportUtils";
import StatusCard from "./StatusCard";

interface ResultPanelProps {
  activeTabRight: string;
  setActiveTabRight: (tab: string) => void;
  isRequesting: boolean;
  tableData: any[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  showSupersetError: { title: string; text: string };
  csvId: string;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  activeTabRight,
  setActiveTabRight,
  isRequesting,
  tableData,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  showSupersetError,
  csvId,
}) => {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const paginatedData = tableData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setOpen(false);
      const csvFilePth = await exportToCSV(csvId);
      if (csvFilePth) {
        console.log("CSV downloaded to:", csvFilePth);
      }
    } catch (error) {
      console.error("CSV export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      setOpen(false);
      const today = new Date().toISOString().split("T")[0];
      await exportToExcel(tableData, `CRM-Report_${today}.xlsx`);
    } catch (error) {
      console.error("Excel export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative w-full">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-2">
        <div className="grid grid-cols-2 w-full items-center justify-between pe-2">
          <div className="flex items-start gap-3">
            <h1 className="text-lg font-semibold text-white uppercase flex items-center gap-2">
              <Table className="w-5 h-5" /> Total Rows:{" "}
              <span className="text-white">
                {tableData.length.toLocaleString()}
              </span>
            </h1>
          </div>
          {/* Tabs */}
          <div className="flex items-center justify-end gap-2">
            <button
              className={`hidden px-3 py-2 font-semibold rounded transition ${
                activeTabRight === "sql"
                  ? "text-white bg-green-500"
                  : "text-white"
              }`}
              disabled={isRequesting}
            >
              SQL Preview
            </button>

            <button
              onClick={() => setActiveTabRight("description")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition hover:bg-green-500 ${
                activeTabRight === "description"
                  ? "text-white bg-green-500"
                  : "text-white"
              }`}
              disabled={isRequesting}
            >
              Script Description
            </button>

            <button
              onClick={() => setActiveTabRight("result")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition hover:bg-green-500 ${
                activeTabRight === "result"
                  ? "text-white bg-green-500"
                  : "text-white"
              }`}
              disabled={isRequesting}
            >
              Result
            </button>
          </div>
        </div>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => tableData.length && !exporting && setOpen(!open)}
            disabled={!tableData.length || exporting}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
              tableData.length
                ? "text-white"
                : "text-white cursor-not-allowed"
            } ${exporting ? "opacity-70 cursor-wait" : ""}`}
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {/* Processing... */}
              </>
            ) : (
              <>
                Download <ChevronDown size={16} />
              </>
            )}
          </button>

          <AnimatePresence>
            {open && tableData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
              >
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 transition"
                >
                  <FileSpreadsheet size={16} className="text-green-600" />
                  Excel
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 transition"
                >
                  <FileText size={16} className="text-green-600" />
                  CSV
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Table */}
      <div className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr
                className={`${
                  showSupersetError?.title
                    ? "bg-red-500 text-white"
                    : `text-green-900 items-center justify-end bg-gradient-to-r ${
                        isRequesting
                          ? "from-green-200 via-green-400 to-green-600"
                          : "from-green-100 via-green-200 to-green-300"
                      }`
                } rounded-t-lg`}
              >
                {tableData.length > 0 ? (
                  Object.keys(tableData[0]).map((key) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left font-semibold uppercase tracking-wide"
                    >
                      {key}
                    </th>
                  ))
                ) : (
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide flex items-center justify-between">
                    {showSupersetError?.title || "No Header Available"}!
                    <StatusCard color="text-white" isRequesting={isRequesting} />
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {tableData.length > 0 ? (
                paginatedData.map((row, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-green-50"
                    } transition-colors cursor-pointer`}
                  >
                    {Object.keys(row).map((key) => (
                      <td
                        key={key}
                        className="px-4 py-2 text-gray-700 border-t"
                      >
                        {row[key]}
                      </td>
                    ))}
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={Object.keys(tableData[0] || {}).length || 1}
                    className="py-10 text-center"
                  >
                    {showSupersetError?.text ? (
                      <div className="flex flex-col items-center space-y-3 text-red-500">
                        <AlertTriangle className="w-16 h-16" />
                        <span className="text-base">
                          {showSupersetError.text}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500">
                        No available Data to Display!
                      </span>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && tableData.length > 0 && (
        <div className="fixed w-[60%] bottom-0 right-2 bg-white p-4 flex justify-end items-center gap-2 border-t z-50">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg border bg-gray-100 hover:bg-green-500 hover:text-white transition disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg border bg-gray-100 hover:bg-green-500 hover:text-white transition disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
