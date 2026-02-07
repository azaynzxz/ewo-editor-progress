import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import { IconButton } from '../ui'

function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="app-layout">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Mobile Header */}
            <header className="mobile-header">
                <IconButton onClick={() => setSidebarOpen(true)}>
                    <Menu size={24} />
                </IconButton>
                <img src="/logo.jpg" alt="EWO Logo" className="mobile-header-logo" />
                <span style={{ fontWeight: 600 }}>EWO Hub</span>
            </header>

            <main className="main-content">
                <div className="page">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

export default Layout
