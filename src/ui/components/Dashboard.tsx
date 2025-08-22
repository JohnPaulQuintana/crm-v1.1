import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import LoaderModal from "./Loader";

interface DashboardProps {
  user: any;
  setUser: (u: any) => void;
}

interface SqlSegment {
  text: string;
  editable?: boolean;
  value?: string;
}

interface SqlFile {
  name: string;
  content: string;
  parsedSegments: SqlSegment[];
}

export default function Dashboard({ user, setUser }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [brands, setBrands] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [sqlFiles, setSqlFiles] = useState<SqlFile[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tabNames: Record<string, string> = {
    dashboard: "Dashboard",
    profile: "Profile",
    accounts: "Accounts",
    sql: "SQL Lab",
  };

  // Load brands on mount
  useEffect(() => {
    window.electron?.getBrands().then((res) => {
      if (res.success) setBrands(res.brands ?? []);
    });
  }, []);

  const handleBrandChange = async (brand: string) => {
    setSelectedBrand(brand);
    setSelectedFile("");
    setStatus(null);
    setFiles([]);
    setSqlFiles([]);

    const res = await window.electron?.getFiles(brand);
    if (res?.success) setFiles(res.files ?? []);
  };

  const parseSql = (sql: string): SqlSegment[] => {
    const regex = /(\{\{.*?\}\})/g; // match {{placeholder}}
    const parts = sql.split(regex);
    return parts.map((part) => ({
      text: part,
      editable: part.startsWith("{{") && part.endsWith("}}"),
      value:
        part.startsWith("{{") && part.endsWith("}}")
          ? part.slice(2, -2)
          : undefined,
    }));
  };

  const handleFileChange = async (file: string) => {
    setSelectedFile(file);
    setStatus(null);

    if (!selectedBrand) return;

    const res = await window.electron?.getFileContent(selectedBrand, file);
    if (res?.success && res.content) {
      const parsed = parseSql(res.content);
      setSqlFiles([
        { name: file, content: res.content, parsedSegments: parsed },
      ]);
    }
  };

  const handlePlaceholderChange = (
    fileIdx: number,
    segIdx: number,
    value: string
  ) => {
    const newFiles = [...sqlFiles];
    const targetSeg = newFiles[fileIdx].parsedSegments[segIdx];
    if (!targetSeg.editable || !targetSeg.value) return;

    // Update all identical placeholders
    newFiles[fileIdx].parsedSegments = newFiles[fileIdx].parsedSegments.map(
      (seg) =>
        seg.editable && seg.value === targetSeg.value ? { ...seg, value } : seg
    );

    // Rebuild content
    newFiles[fileIdx].content = newFiles[fileIdx].parsedSegments
      .map((seg) => (seg.editable ? `{{${seg.value}}}` : seg.text))
      .join("");

    setSqlFiles(newFiles);
  };

  const handleSave = async () => {
    if (!selectedBrand || !selectedFile || sqlFiles.length === 0) return;

    setStatus("Saving...");
    const sqlToSave = sqlFiles[0].content;

    const res = await window.electron?.saveFileContent(
      selectedBrand,
      selectedFile,
      sqlToSave
    );

    if (res?.success) {
      setStatus("✅ Saved successfully!");
    } else {
      setStatus("❌ Failed to save file: " + res?.error);
    }
  };

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const handleLogout = async () => {
    setLoading(true);
    await wait(2000);
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 text-xl font-bold border-b">CRM</div>
        <nav className="flex-1 p-4 space-y-2">
          {Object.keys(tabNames).map((tab) => (
            <button
              key={tab}
              className={`block w-full text-left px-4 py-2 rounded ${
                activeTab === tab
                  ? "bg-green-500 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tabNames[tab]}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">{tabNames[activeTab]}</h1>
          <div className="flex items-center space-x-4">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt="Avatar"
                className="w-10 h-10 rounded-full"
              />
            )}
            <span className="font-medium">
              {user.displayName ?? user.email}
            </span>
          </div>
        </header>

        <main className="flex-1 p-2 overflow-auto">
          {activeTab === "dashboard" && (
            <div>
              <h2 className="text-lg font-bold mb-4">Dashboard Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded shadow">Card 1</div>
                <div className="p-4 bg-white rounded shadow">Card 2</div>
                <div className="p-4 bg-white rounded shadow">Card 3</div>
              </div>
            </div>
          )}

          {activeTab === "sql" && (
            <div className="h-[calc(100vh-4rem)] grid grid-cols-3 gap-2 bg-gray-50">
              {/* Left Controls */}
              <div className="flex flex-col space-y-4 bg-white rounded-lg shadow-md p-4 overflow-y-auto">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">
                  Controls
                </h2>

                {/* Brand Selector */}
                <label className="text-sm font-medium text-gray-600">
                  Brand
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Brand</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                {/* File Selector */}
                {files.length > 0 && (
                  <>
                    <label className="text-sm font-medium text-gray-600">
                      File
                    </label>
                    <select
                      value={selectedFile}
                      onChange={(e) => handleFileChange(e.target.value)}
                      className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select File</option>
                      {files.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {/* Unique Placeholder Inputs */}
                {sqlFiles.length > 0 &&
                  Array.from(
                    new Map(
                      sqlFiles[0].parsedSegments
                        .filter((seg) => seg.editable)
                        .map((seg) => [seg.value, seg])
                    ).values()
                  ).map((seg, idx) => (
                    <div key={idx} className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600">
                        {seg.value}
                      </label>
                      <input
                        type="text"
                        value={seg.value}
                        onChange={(e) =>
                          handlePlaceholderChange(
                            0,
                            sqlFiles[0].parsedSegments.findIndex(
                              (s) => s.value === seg.value
                            ),
                            e.target.value
                          )
                        }
                        className="border border-green-500 rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  ))}

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Execute
                </button>

                {status && (
                  <p className="mt-2 text-sm text-gray-600">{status}</p>
                )}
              </div>

              {/* Right SQL Preview */}
              <div className="col-span-2 flex flex-col bg-white rounded-lg shadow-md p-4 overflow-auto font-mono text-sm">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">
                  SQL Preview
                </h2>
                {sqlFiles.length > 0 ? (
                  <div className="flex-1 w-full h-full border border-gray-300 rounded p-3 overflow-auto bg-gray-50 whitespace-pre-wrap">
                    {sqlFiles[0].parsedSegments.map((seg, idx) =>
                      seg.editable ? (
                        <span
                          key={idx}
                          className="bg-green-100 text-green-800 px-1 rounded"
                        >
                          {seg.value}
                        </span>
                      ) : (
                        <span key={idx}>{seg.text}</span>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 mt-2">
                    Select a file to view SQL content.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="bg-white p-6 rounded shadow max-w-md">
              <h2 className="text-lg font-bold mb-4">Profile</h2>
              <p>
                <strong>UID:</strong> {user.uid}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Role:</strong> {user.role}
              </p>
            </div>
          )}

          {activeTab === "accounts" && (
            <div className="bg-white p-6 rounded shadow max-w-md">
              <h2 className="text-lg font-bold mb-4">Accounts</h2>
            </div>
          )}

          {loading && (
            <LoaderModal
              type={false}
              visible={loading}
              message="Logging you out..."
              icon={"icon"}
              color="green-500"
              size={6}
            />
          )}
        </main>
      </div>
    </div>
  );
}
