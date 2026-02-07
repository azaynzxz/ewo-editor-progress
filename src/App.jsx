import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout'
import { Dashboard, Wiki, Resources, Onboarding, ProgressFormPage } from './pages'

import './styles/variables.css'
import './styles/components.css'
import './styles/layout.css'
import './styles/wiki.css'
import './styles/App.css'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/progress" element={<ProgressFormPage />} />
                    <Route path="/wiki" element={<Wiki />} />
                    <Route path="/resources" element={<Resources />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
