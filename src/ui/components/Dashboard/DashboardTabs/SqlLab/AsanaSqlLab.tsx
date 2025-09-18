import React, { useState, useEffect, useCallback } from "react";
import { AsanaRightPanel } from "./AsanaRightPanel";
import type {
  Section,
  Task,
  InputField,
  VpnInfo,
  Description,
} from "../../../types";
import {
  handleExecutionError,
  type ExecutionResult,
} from "../../../utils/errorHandlers";

// Define the expected shape of the API response
interface AsanaApiResponse {
  success: boolean;
  data: any[]; // Assuming it's an array of tasks/sections or data objects
  sections?: Section[]; // Optional if sections are returned
}

interface AsanaSqlLabProps {
  user: any;
  isRequesting: boolean;
  setIsRequesting: (arg: boolean) => void;
  onCredentials: () => void;
  selectedProject: string | null; // 🔥 add this
}

export const AsanaSqlLab: React.FC<AsanaSqlLabProps> = ({
  user,
  isRequesting,
  setIsRequesting,
  onCredentials,
  selectedProject
}) => {
  const [asanaSections, setAsanaSections] = useState<Section[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [asanaInputValues, setAsanaInputValues] = useState<Record<string, string>>({});
  const [tableData, setTableData] = useState<any[]>([]); // Ensure `any[]` is suitable or replace with a more specific type
  const [activeTabRight, setActiveTabRight] = useState("description");
  const [currentPage, setCurrentPage] = useState(1);
  const [showVpnInfo, setShowVpnInfo] = useState<VpnInfo>({ title: "", text: "" });
  const [scriptDescription, setScriptDescription] = useState<Description>({ columns: [], description: "" });
  const [isFetchingAsana, setIsFetchingAsana] = useState(true);

  const pageSize = 20;
  const totalPages = Math.ceil(tableData.length / pageSize);

  // -------------------------------
  // Fetch Asana tasks automatically
  // -------------------------------
  useEffect(() => {
    const fetchTasks = async () => {
      setIsFetchingAsana(true); // start loading

      if (!selectedProject) {
        setAsanaSections([]);
        setSelectedTask(null);
        setAsanaInputValues({}); // Reset input values
        setScriptDescription({ columns: [], description: "" }); // Reset description
        setIsFetchingAsana(false); // stop loading
        return;
      }

      try {
        console.log(user)
        const res = (await window.electron?.getAsanaTasks(selectedProject, user.role)) ?? { success: false, data: [], sections: [] } as AsanaApiResponse;

        if (res?.success && res.sections) {
          setAsanaSections(res.sections);

          // If no tasks in the first section, reset task selection
          const firstTask = res.sections[0]?.tasks[0] || null;
          if (firstTask) {
            handleSelectTask(firstTask);
          } else {
            // Reset task and related inputs if no tasks
            setSelectedTask(null);
            setAsanaInputValues({});
            setScriptDescription({ columns: [], description: "" });
          }
        } else {
          setAsanaSections([]);
          // Reset task and related inputs if no sections
          setSelectedTask(null);
          setAsanaInputValues({});
          setScriptDescription({ columns: [], description: "" });
        }
      } catch (err) {
        console.error("Failed to fetch Asana tasks:", err);
        setAsanaSections([]);
        // Reset task and related inputs on error
        setSelectedTask(null);
        setAsanaInputValues({});
        setScriptDescription({ columns: [], description: "" });
      } finally {
        setIsFetchingAsana(false);
      }
    };

    fetchTasks();
  }, [selectedProject]); // Re-run fetch if selectedProject changes

  const handleSelectTask = useCallback(
    (task: Task & { inputs?: InputField[] }) => {
      setSelectedTask(task);

      if (task.inputs) {
        const initialValues: Record<string, string> = {};
        task.inputs.forEach((input) => {
          initialValues[input.name] = input.default;
        });
        setAsanaInputValues(initialValues);
      }

      setScriptDescription({
        columns: Object.keys(task.latest_sql?.parsed_sql.editable_contents || {}),
        description: task.notes || "No description available",
      });

      setActiveTabRight("description");
    },
    []
  );

  const handleInputChange = useCallback((name: string, value: string) => {
    setAsanaInputValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleExecuteTask = useCallback(async () => {
    if (!selectedTask?.latest_sql) return;

    let sqlContent = selectedTask.latest_sql.parsed_sql.template_script;
    const placeholders = selectedTask.latest_sql.parsed_sql.editable_contents || {};
    Object.entries(placeholders).forEach(([key, defaultValue]) => {
      const value = asanaInputValues[key] ?? defaultValue;
      sqlContent = sqlContent.replaceAll(`{{${key}}}`, value);
    });

    setIsRequesting(true);
    setTableData([]); // Clear table data before making a request
    setCurrentPage(1);
    setShowVpnInfo({ title: "", text: "" });

    console.log(sqlContent); // For debugging
    try {
      const res = await window.electron?.saveFileContent(
        selectedTask.identity.brand || "",
        selectedTask.latest_sql.gid,
        sqlContent
      );

      setIsRequesting(false);
      setActiveTabRight("result");
      console.log(res)
      if (res?.success) {
        setTableData(res.data || []);
      } else {
        const vpnInfo = handleExecutionError(res as ExecutionResult).vpnInfo;
        console.log(vpnInfo)
        setShowVpnInfo({
          ...vpnInfo,
          text: typeof vpnInfo?.text === "string" ? vpnInfo.text : "Error",
        });
      }
    } catch (err) {
      setIsRequesting(false);
      console.error("Execution failed:", err);
      setShowVpnInfo({ title: "Error", text: "An unexpected error occurred." });
    }
  }, [selectedTask, asanaInputValues, setIsRequesting]);

  // -------------------------------
  // Modern green themed loading
  // -------------------------------
  if (isFetchingAsana) {
    return (
      <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
        <div className="flex flex-col items-center bg-green-50 p-8 rounded-2xl shadow-lg animate-pulse">
          <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full mb-4 animate-spin"></div>
          <p className="text-green-700 font-bold text-lg">
            Loading Asana tasks...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] grid grid-cols-4 gap-1 bg-gray-50 p-2">
      {/* Left panel: Asana task selector & inputs */}
      <div className="col-span-1 border-r pr-2">
        <label className="block font-medium mb-2 text-green-700">Asana Tasks</label>
        <select
          value={selectedTask?.gid || ""}
          onChange={(e) => {
            const task = asanaSections
              .flatMap((sec) => sec.tasks)
              .find((t) => t.gid === e.target.value);
            if (task) handleSelectTask(task);
          }}
          className="border border-green-300 rounded-lg p-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-500"
          disabled={isFetchingAsana}
        >
          <option value="">Select a task</option>
          {asanaSections.flatMap((sec) =>
            sec.tasks.map((task) => (
              <option key={task.gid} value={task.gid}>
                {task.name}
              </option>
            ))
          )}
        </select>

        {/* Render inputs only if a valid task is selected */}
        {selectedTask && selectedTask.inputs && selectedTask.inputs.length > 0 && (
          <>
            {selectedTask.inputs.map((input) => (
              <div key={input.name} className="mb-4">
                <label className="block text-sm font-semibold text-green-700 mb-1">
                  {input.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </label>
                {input.type === "select" ? (
                  <select
                    value={asanaInputValues[input.name] || ""}
                    onChange={(e) => handleInputChange(input.name, e.target.value)}
                    className="border border-green-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-500"
                  >
                    {input.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={input.type === "date" ? "date" : "text"}
                    value={asanaInputValues[input.name] || ""}
                    onChange={(e) => handleInputChange(input.name, e.target.value)}
                    className="border border-green-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-500"
                  />
                )}
              </div>
            ))}
            <button
              onClick={handleExecuteTask}
              disabled={isRequesting || !selectedTask}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg w-full shadow"
            >
              Run Task
            </button>
          </>
        )}
      </div>

      {/* Right panel: results */}
      <AsanaRightPanel
        activeTabRight={activeTabRight}
        setActiveTabRight={setActiveTabRight}
        isRequesting={isRequesting}
        tableData={tableData}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onCredentials={onCredentials}
        showSupersetError={showVpnInfo}
        scriptDescription={scriptDescription}
      />
    </div>
  );
};

AsanaSqlLab.displayName = "AsanaSqlLab";
