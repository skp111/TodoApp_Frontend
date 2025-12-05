import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import AuthServices from "../services/authServices";

export default function ProtectedRoute({ children }) {
  const [auth, setAuth] = useState(() => 
    !!localStorage.getItem("token") //boolean initial value true if token exists else false
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await AuthServices.verifyUser();
        console.log("Verification response:", response);
        if (response.data.success) {
          setAuth(true);
        } else {
          setAuth(false);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      } catch (err) {
        console.log('verifyUser error:', err.response?.status, err.response?.data);
        setAuth(false);
      }
      finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  // ⏳ While checking, don't redirect yet
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-700">
        <p>Checking Authentication...</p>
        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif" alt="" />
      </div>
    )
  }

  // ❌ Not logged in
  if (!auth) {
    return <Navigate to="/" replace />;
  }

  // ✅ Logged in
  return children;
}
