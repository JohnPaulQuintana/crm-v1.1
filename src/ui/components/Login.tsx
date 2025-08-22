import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import LoaderModal from "./Loader";
// import { FaUserCircle } from "react-icons/fa";

interface LoginProps {
  setUser: (u: any) => void;
}

export default function Login({ setUser }: LoginProps) {
  const [email, setEmail] = useState("exousia.navi@auroramy.com");
  const [password, setPassword] = useState("3tYfGWEwHzDTZ7S");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); // success msg
  const [loading, setLoading] = useState(false);

  // const fetchCsrf = async () => {
  //   try {
  //     const csrf = await window.electronAPI!.getSupersetCsrf();
  //     console.log("CSRF token:", csrf);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  // useEffect(() => {
  //   fetchCsrf();
  // }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // ✅ start loader
    setError("");
    setMessage("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Logged in!");

      const token = await auth.currentUser?.getIdToken();
      if (token) {
        // send token to backend and await profile info
        //   Use a non-null assertion (!)
        const data = await window.electron!.sendToken(token);
        console.log("🔗 Token sent to backend:", data);
        if (data.success) {
          console.log("🎉 Backend verified:", data);
          setMessage(`Welcome ${data.name ?? ""} (${data.email ?? ""})`);
          setUser({
            uid: data.uid,
            name: data.name,
            email: data.email,
            photoURL: data.photoURL,
            role: data.role, // include role
          });
          // const csrfToken = await window.electronAPI!.getSupersetCsrf();
          // console.log("CSRF token:", csrfToken);
        } else {
          console.error("⚠️ Backend rejected:", data.error);
          setError("Login failed: " + data.error);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false); // ✅ stop loader
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-green-700">
          CRM Login
        </h2>

        <form className="space-y-4" onSubmit={handleLogin}>
          {/* email input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* password input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          {message && (
            <p className="text-sm text-green-600 font-medium">{message}</p>
          )}

          <button
            type="submit"
            className="w-full py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {loading && (
            <LoaderModal
              type={true}
              visible={loading}
              message="Authenticating..."
              icon={'icon'}
              color="green-500"
              size={6}
            />
          )}
        </form>
      </div>
    </div>
  );
}
