import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

export default function PublicRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  return isAuthenticated ? (
    <Navigate to="/" state={{ from: location }} replace />
  ) : (
    children
  );
}