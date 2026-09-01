import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute({ allowedRoles }) {
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');

    // If no role OR no userName is present, redirect to login
    if (!userRole || !userName) {
        return <Navigate to="/login" replace />;
    }

    // If roles are restricted for this route and user's role isn't allowed
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/" replace />; // Redirect back to Dashboard
    }

    // Otherwise, allow access
    return <Outlet />;
}

export default ProtectedRoute;
