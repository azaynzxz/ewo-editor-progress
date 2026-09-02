const APPS_SCRIPT_URL = '/api/exec'

export async function fetchAllSheetsProjects(forceRefresh = false) {
    try {
        if (!forceRefresh) {
            const cached = localStorage.getItem('ewo_all_projects_cache')
            const cachedMMB = localStorage.getItem('ewo_all_mmb_projects_cache')
            const sheets = localStorage.getItem('ewo_available_sheets')
            if (cached && sheets) {
                return {
                    projects: JSON.parse(cached),
                    mmbProjects: cachedMMB ? JSON.parse(cachedMMB) : [],
                    availableSheets: JSON.parse(sheets),
                    success: true,
                    isCached: true
                }
            }
        }
        
        // 1. Fetch current month sheet first to get list of available sheets
        const res = await fetch(`${APPS_SCRIPT_URL}?action=getAdminProjects`)
        const json = await res.json()
        
        if (!json.success) throw new Error(json.message || 'Failed to fetch initial sheet')
        
        let allProjects = json.data?.projects || []
        let allMMBProjects = json.data?.mmbProjects || []
        
        const currentSheetName = json.data?.sheetName || json.data?.currentSheet
        const availableSheets = json.data?.availableSheets || []
        
        // Mark each project with its source sheet name
        allProjects = allProjects.map(p => ({ ...p, sourceSheet: currentSheetName }))
        allMMBProjects = allMMBProjects.map(p => ({ ...p, sourceSheet: currentSheetName }))
        
        // Save available sheets to cache
        localStorage.setItem('ewo_available_sheets', JSON.stringify(availableSheets))

        // 2. Fetch all other sheets in parallel (tolerant to individual failures)
        const otherSheets = availableSheets.filter(s => s !== currentSheetName)
        if (otherSheets.length > 0) {
            const fetchPromises = otherSheets.map(async (sheetName) => {
                try {
                    const r = await fetch(`${APPS_SCRIPT_URL}?action=getAdminProjects&month=${encodeURIComponent(sheetName)}`)
                    const resJson = await r.json()
                    
                    let p = []
                    let mmb = []
                    if (resJson.success && resJson.data) {
                        if (resJson.data.projects) p = resJson.data.projects.map(pr => ({ ...pr, sourceSheet: sheetName }))
                        if (resJson.data.mmbProjects) mmb = resJson.data.mmbProjects.map(pr => ({ ...pr, sourceSheet: sheetName }))
                    }
                    return { projects: p, mmbProjects: mmb }
                } catch (err) {
                    console.error('Failed to fetch sheet:', err)
                    return { projects: [], mmbProjects: [] }
                }
            })
            const results = await Promise.all(fetchPromises)
            results.forEach(res => {
                allProjects = allProjects.concat(res.projects)
                allMMBProjects = allMMBProjects.concat(res.mmbProjects)
            })
        }
        
        // Save to local storage cache
        localStorage.setItem('ewo_all_projects_cache', JSON.stringify(allProjects))
        localStorage.setItem('ewo_all_mmb_projects_cache', JSON.stringify(allMMBProjects))
        localStorage.setItem('ewo_all_projects_cache_ts', new Date().toISOString())
        localStorage.setItem('ewo_available_sheets', JSON.stringify(availableSheets))
        
        return { projects: allProjects, mmbProjects: allMMBProjects, availableSheets, success: true }
    } catch (e) {
        console.error('Failed universal projects fetch:', e)
        // Fallback to local storage cache
        try {
            const cached = localStorage.getItem('ewo_all_projects_cache')
            const cachedMMB = localStorage.getItem('ewo_all_mmb_projects_cache')
            const sheets = localStorage.getItem('ewo_available_sheets')
            return {
                projects: cached ? JSON.parse(cached) : [],
                mmbProjects: cachedMMB ? JSON.parse(cachedMMB) : [],
                availableSheets: sheets ? JSON.parse(sheets) : [],
                isFallback: true,
                success: false,
                error: e.message
            }
        } catch {
            return { projects: [], mmbProjects: [], availableSheets: [], success: false, error: e.message }
        }
    }
}
