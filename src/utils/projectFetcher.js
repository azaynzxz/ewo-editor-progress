const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwZpWsJEOFlOQkDA55JyjV1q6CkpO37VNbFi7bxrJsB2LeheFwSrDQHbm_oR5D1hl0TKQ/exec'

export async function fetchAllSheetsProjects() {
    try {
        // 1. Fetch current month sheet first to get list of available sheets
        const res = await fetch(`${APPS_SCRIPT_URL}?action=getAdminProjects`)
        const json = await res.json()
        if (!json.success) throw new Error(json.message || 'Failed to fetch initial sheet')
        
        let allProjects = json.data?.projects || []
        const currentSheetName = json.data?.sheetName
        const availableSheets = json.data?.availableSheets || []
        
        // Mark each project with its source sheet name
        allProjects = allProjects.map(p => ({ ...p, sourceSheet: currentSheetName }))
        
        // 2. Fetch all other sheets in parallel (tolerant to individual failures)
        const otherSheets = availableSheets.filter(s => s !== currentSheetName)
        if (otherSheets.length > 0) {
            const fetchPromises = otherSheets.map(async (sheetName) => {
                try {
                    const r = await fetch(`${APPS_SCRIPT_URL}?action=getAdminProjects&month=${encodeURIComponent(sheetName)}`)
                    const resJson = await r.json()
                    if (resJson.success && resJson.data?.projects) {
                        return resJson.data.projects.map(p => ({ ...p, sourceSheet: sheetName }))
                    }
                    return []
                } catch (err) {
                    console.error(`Failed to fetch sheet ${sheetName}:`, err)
                    return []
                }
            })
            const results = await Promise.all(fetchPromises)
            results.forEach(projectsList => {
                allProjects = allProjects.concat(projectsList)
            })
        }
        
        // Save to local storage cache
        localStorage.setItem('ewo_all_projects_cache', JSON.stringify(allProjects))
        localStorage.setItem('ewo_all_projects_cache_ts', new Date().toISOString())
        localStorage.setItem('ewo_available_sheets', JSON.stringify(availableSheets))
        
        return { projects: allProjects, availableSheets, success: true }
    } catch (e) {
        console.error('Failed universal projects fetch:', e)
        // Fallback to local storage cache
        try {
            const cached = localStorage.getItem('ewo_all_projects_cache')
            const sheets = localStorage.getItem('ewo_available_sheets')
            return {
                projects: cached ? JSON.parse(cached) : [],
                availableSheets: sheets ? JSON.parse(sheets) : [],
                isFallback: true,
                success: false,
                error: e.message
            }
        } catch {
            return { projects: [], availableSheets: [], success: false, error: e.message }
        }
    }
}
