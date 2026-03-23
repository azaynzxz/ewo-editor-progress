import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute({ allowedRoles }) {
    const userRole = localStorage.getItem('userRole');

    // If no role is selected, redirect to role selection
    if (!userRole) {
        return <Navigate to="/role-selection" replace />;
    }

    // If roles are restricted for this route and user's role isn't allowed
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/" replace />; // Redirect back to Dashboard
    }

    // Otherwise, allow access
    return <Outlet />;
}

export default ProtectedRoute;
