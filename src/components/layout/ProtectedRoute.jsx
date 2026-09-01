import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute({ allowedRoles }) {
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    const loginTimestamp = localStorage.getItem('loginTimestamp');
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    // Check expiration or missing credentials
    if (!userRole || !userName || !loginTimestamp || (Date.now() - parseInt(loginTimestamp, 10) > THIRTY_DAYS_MS)) {
        // Clear all auth-related local storage, but don't nuke safe app settings like custom customClients
        ['userRole', 'userRoleRaw', 'userType', 'userName', 'userEmail', 'loginTimestamp', 'lastUsedEditor'].forEach(key => localStorage.removeItem(key));
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
