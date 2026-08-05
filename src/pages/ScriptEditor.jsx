import { useState, useRef, useEffect, useCallback } from 'react'
import { PageHeader } from '../components/layout'
import SearchableDropdown from '../components/SearchableDropdown'
import { Button, IconButton, Badge } from '../components/ui'
import { FileText, Download, Upload, Trash2, MousePointer2, Settings, Plus, Play, Edit2, SplitSquareHorizontal, Undo2, SplitSquareVertical } from 'lucide-react'
import '../styles/script-editor.css'

function ScriptEditor() {
    const [rawText, setRawText] = useState('')
    const [isEditMode, setIsEditMode] = useState(false)
    const [scenes, setScenes] = useState([]) // { scene_id: "1", scene_text: "...", actions: [ { id: "S1", text: "..." } ] }
    const [history, setHistory] = useState([]) // history of { scenes, rawText } for undo
    const [dragActive, setDragActive] = useState(false)
    const [activeListSceneId, setActiveListSceneId] = useState(null)
    const [selection, setSelection] = useState(null)
    const [mammothLoaded, setMammothLoaded] = useState(false)
    const [customer, setCustomer] = useState('')
    const [title, setTitle] = useState('')
    const [showMetadataModal, setShowMetadataModal] = useState(false)
    const [allProjects, setAllProjects] = useState([])
    
    useEffect(() => {
        const loadCached = () => {
            try {
                const cached = localStorage.getItem('ewo_all_projects_cache');
                if (cached) {
                    setAllProjects(JSON.parse(cached));
                }
            } catch { }
        };
        loadCached();
        window.addEventListener('ewo_deadlines_refreshed', loadCached);
        return () => window.removeEventListener('ewo_deadlines_refreshed', loadCached);
    }, []);

    const getTitlesForClient = (clientName) => {
        if (!clientName || !allProjects.length) return [];
        const titles = allProjects
            .filter(p => {
                if (!p.clients) return true;
                const clientList = p.clients.split(',').map(c => c.trim().toLowerCase());
                return clientList.includes(clientName.toLowerCase());
            })
            .map(p => p.projectName);
        return [...new Set(titles)];
    };
    
    const DEFAULT_CLIENTS = [
        'Alex', 'Allan', 'Amanda', 'Angelo', 'Bashar', 'Bryan', 'Jordan', 'Jorge', 'Julia', 'Kristin', 'Michael', 'Ryan', 'Simon', 'Wing', 'Yannick', 'Zheng', 'Internal'
    ];
    
    const editorRef = useRef(null)
    const fileInputRef = useRef(null)

    // Load Mammoth.js dynamically for .docx parsing
    useEffect(() => {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js'
        script.async = true
        script.onload = () => setMammothLoaded(true)
        document.body.appendChild(script)
        
        return () => {
            document.body.removeChild(script)
        }
    }, [])

    const pushHistory = (newScenes, newRawText = rawText) => {
        setHistory(prev => [...prev, { scenes, rawText }])
        setScenes(newScenes)
        if (newRawText !== rawText) {
            setRawText(newRawText)
        }
    }

    const handleUndo = useCallback(() => {
        if (history.length > 0) {
            const previous = history[history.length - 1]
            setScenes(previous.scenes)
            setRawText(previous.rawText)
            setHistory(prev => prev.slice(0, -1))
        }
    }, [history])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
                e.preventDefault()
                handleUndo()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [handleUndo])

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
        else if (e.type === 'dragleave') setDragActive(false)
    }

    const handleDrop = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await processFile(e.dataTransfer.files[0])
        }
    }

    const handleFileSelect = async (e) => {
        if (e.target.files && e.target.files[0]) {
            await processFile(e.target.files[0])
        }
    }

    const processFile = async (file) => {
        let text = '';
        if (file.name.endsWith('.txt')) {
            text = await file.text()
        } else if (file.name.endsWith('.docx')) {
            if (!window.mammoth) {
                alert("Document parser is still loading, please try again in a moment.")
                return
            }
            const arrayBuffer = await file.arrayBuffer()
            const result = await window.mammoth.extractRawText({ arrayBuffer })
            text = result.value
        } else {
            alert('Unsupported file type. Please use .txt or .docx')
            return
        }

        // Normalize newlines: remove excessive empty lines
        let normalized = text.replace(/\r\n/g, '\n')
        normalized = normalized.replace(/\n{3,}/g, '\n\n')
        setRawText(normalized)
        
        if (!customer || !title) {
            setShowMetadataModal(true)
        }
    }

    const handleMouseUp = (e) => {
        if (isEditMode || !rawText) return
        
        const sel = window.getSelection()
        const text = sel.toString().trim()
        
        if (text.length > 0) {
            // Get approximate position to show popover
            const range = sel.getRangeAt(0)
            const rect = range.getBoundingClientRect()
            const containerRect = editorRef.current.getBoundingClientRect()
            
            let node = sel.anchorNode;
            let activeSceneId = null;
            while (node && node !== editorRef.current) {
                if (node.nodeType === 1 && node.classList.contains('hl-scene')) {
                    activeSceneId = node.getAttribute('data-scene-id');
                    break;
                }
                node = node.parentNode;
            }
            
            if (activeSceneId) {
                setActiveListSceneId(activeSceneId);
                const el = document.getElementById(`scene-list-item-${activeSceneId}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            
            setSelection({
                text,
                activeSceneId,
                top: rect.bottom - containerRect.top + editorRef.current.scrollTop + 10,
                left: Math.max(0, rect.left - containerRect.left + (rect.width / 2) - 100)
            })
        } else {
            setSelection(null)
        }
    }

    const handleMarkupClick = (e) => {
        if (isEditMode || selection) return; // Don't trigger if they are making a selection
        const sceneNode = e.target.closest('.hl-scene');
        if (sceneNode) {
            const sceneId = sceneNode.getAttribute('data-scene-id');
            setActiveListSceneId(sceneId);
            const el = document.getElementById(`scene-list-item-${sceneId}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            setActiveListSceneId(null);
        }
    }

    const handleMarkScene = () => {
        if (!selection) return
        const newSceneId = (scenes.length + 1).toString()
        pushHistory([...scenes, {
            scene_id: newSceneId,
            scene_text: selection.text,
            actions: []
        }])
        setSelection(null)
        window.getSelection().removeAllRanges()
    }

    const handleMarkAction = (sceneId) => {
        if (!selection) return
        
        pushHistory(scenes.map(scene => {
            if (scene.scene_id === sceneId) {
                let newActions = [...scene.actions];
                
                // Smart auto-fill: if there are no actions yet and the user highlights the latter part of the scene,
                // auto-assign the preceding text as S1.
                if (scene.actions.length === 0) {
                    const index = scene.scene_text.indexOf(selection.text);
                    if (index > 0) {
                        const beforeText = scene.scene_text.substring(0, index).trim();
                        if (beforeText) {
                            newActions.push({ id: 'S1', text: beforeText });
                        }
                    }
                }
                
                const newActionId = `S${newActions.length + 1}`
                newActions.push({ id: newActionId, text: selection.text })
                
                return {
                    ...scene,
                    actions: newActions
                }
            }
            return scene
        }))
        
        setSelection(null)
        window.getSelection().removeAllRanges()
    }

    const handleDeleteScene = (sceneId) => {
        pushHistory(scenes.filter(s => s.scene_id !== sceneId))
    }

    const handleDeleteAction = (sceneId, actionId) => {
        pushHistory(scenes.map(s => {
            if (s.scene_id === sceneId) {
                // Re-number remaining actions to keep S1, S2 sequential
                const remaining = s.actions.filter(a => a.id !== actionId)
                const renumbered = remaining.map((a, idx) => ({ ...a, id: `S${idx + 1}` }))
                return { ...s, actions: renumbered }
            }
            return s
        }))
    }

    const handleConvertLinesToScenes = () => {
        if (scenes.length > 0) {
            if (!window.confirm("This will overwrite your existing scenes. Are you sure?")) return;
        }
        const lines = rawText.split('\n').filter(line => line.trim().length > 0);
        const newScenes = lines.map((line, idx) => ({
            scene_id: (idx + 1).toString(),
            scene_text: line.trim(),
            actions: []
        }));
        pushHistory(newScenes);
    }

    const handleSplitScene = () => {
        if (!selection || !selection.activeSceneId) return;
        
        const activeScene = scenes.find(s => s.scene_id === selection.activeSceneId);
        if (!activeScene) return;

        const index = activeScene.scene_text.indexOf(selection.text);
        if (index === -1) return;
        
        const part1 = activeScene.scene_text.substring(0, index).trim();
        const part2 = selection.text.trim();
        const part3 = activeScene.scene_text.substring(index + selection.text.length).trim();
        
        let newScenes = [];
        scenes.forEach(scene => {
            if (scene.scene_id === selection.activeSceneId) {
                const getActionsForPart = (partText) => {
                    return scene.actions.filter(a => partText.includes(a.text));
                };
                
                if (part1) {
                    newScenes.push({ scene_id: '', scene_text: part1, actions: getActionsForPart(part1) });
                }
                if (part2) {
                    newScenes.push({ scene_id: '', scene_text: part2, actions: getActionsForPart(part2) });
                }
                if (part3) {
                    newScenes.push({ scene_id: '', scene_text: part3, actions: getActionsForPart(part3) });
                }
            } else {
                newScenes.push(scene);
            }
        });
        
        // Re-number all scenes
        newScenes = newScenes.map((s, idx) => ({
            ...s,
            scene_id: (idx + 1).toString()
        }));
        
        // Replace text in rawText to insert double newlines for visual separation
        const replacementText = [part1, part2, part3].filter(Boolean).join('\n\n');
        const newRawText = rawText.replace(activeScene.scene_text, replacementText);
        
        pushHistory(newScenes, newRawText);
        setSelection(null);
        window.getSelection().removeAllRanges();
    }

    const handleExport = () => {
        if (scenes.length === 0) {
            alert('No scenes defined to export.')
            return
        }
        if (!customer.trim() || !title.trim()) {
            setShowMetadataModal(true)
            return
        }
        
        const dataStr = JSON.stringify(scenes, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        const safeCustomer = customer.trim().replace(/[\\/:*?"<>|]/g, '')
        const safeTitle = title.trim().replace(/[\\/:*?"<>|]/g, '')
        a.download = `${safeCustomer} - ${safeTitle} - Script Annotations.json`
        
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // A helper to get a consistent color class for an action (1-5 scale)
    const getColorClass = (actionId) => {
        // e.g. "S2" -> parse "2"
        const num = parseInt(actionId.replace(/\D/g, '')) || 1
        return `color-badge-${((num - 1) % 5) + 1}`
    }

    // Function to render the text with highlights. 
    // This is simple exact-string matching.
    const renderAnnotatedText = () => {
        if (!rawText) return null
        
        // Very basic highlighter: We will try to find scenes and wrap them in a span, 
        // and inside those scenes, wrap actions in another span.
        // For robustness without a full AST, we render raw text but provide visual cues 
        // to the sides, or just rely on the right panel. Let's do simple highlighting:
        
        // We'll replace all action texts with a styled span. Since actions might overlap 
        // or have same text, this is a basic greedy approach.
        let html = rawText
        
        // Escape HTML to prevent injection
        html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        
        // Highlight Scenes
        scenes.forEach(scene => {
            // First highlight actions inside this scene's text
            let processedSceneText = scene.scene_text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
            
            scene.actions.forEach(action => {
                const escapedActionText = action.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
                const colorClass = getColorClass(action.id)
                // We use replace to only replace the first occurrence in the scene text to avoid messing up duplicates
                processedSceneText = processedSceneText.replace(
                    escapedActionText, 
                    `<span class="hl-action ${colorClass}" title="${action.id}">${escapedActionText}</span>`
                )
            })
            
            // Now replace the scene text in the main html
            const sceneEscaped = scene.scene_text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
            html = html.replace(
                sceneEscaped,
                `<div class="hl-scene" data-scene-id="${scene.scene_id}" title="Scene #${scene.scene_id}">${processedSceneText}</div>`
            )
        })

        return <div dangerouslySetInnerHTML={{ __html: html }} />
    }

    return (
        <div className="script-editor-container">
            <PageHeader 
                title="Script Editor" 
                description="Upload, annotate scenes, and export to JSON for Photoshop automation."
                action={
                    <Button variant="primary" icon={<Download size={18} />} onClick={handleExport} disabled={scenes.length === 0}>
                        Export JSON
                    </Button>
                }
            />
            
            {showMetadataModal && (
                <div className="modal-backdrop" onClick={() => setShowMetadataModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Project Details</h3>
                        </div>
                        <div className="modal-body" style={{ overflow: 'visible', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                                Please specify the customer and title for naming your exported JSON data.
                            </p>
                            <div>
                                <label className="input-label" style={{ marginBottom: 'var(--space-2)' }}>Customer</label>
                                <SearchableDropdown
                                    value={customer}
                                    onChange={setCustomer}
                                    options={DEFAULT_CLIENTS}
                                    placeholder="Select customer..."
                                    allowCustom={true}
                                />
                            </div>
                            <div style={{ position: 'relative', zIndex: 10 }}>
                                <label className="input-label" style={{ marginBottom: 'var(--space-2)' }}>Project Title</label>
                                <SearchableDropdown
                                    value={title}
                                    onChange={setTitle}
                                    options={getTitlesForClient(customer)}
                                    placeholder="Select Title..."
                                    allowCustom={true}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <Button variant="ghost" onClick={() => setShowMetadataModal(false)}>
                                Skip for Now
                            </Button>
                            <Button variant="primary" onClick={() => {
                                if (!customer.trim() || !title.trim()) {
                                    alert("Please fill out both fields.");
                                } else {
                                    setShowMetadataModal(false);
                                }
                            }}>
                                Save Details
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="script-editor-workspace">
                {/* Left Area: Editor */}
                <div className="editor-panel">
                    <div className="editor-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Button 
                                variant={!isEditMode ? "primary" : "secondary"} 
                                size="sm"
                                icon={<MousePointer2 size={16} />}
                                onClick={() => setIsEditMode(false)}
                            >
                                Annotate Mode
                            </Button>
                            <Button 
                                variant={isEditMode ? "primary" : "secondary"} 
                                size="sm"
                                icon={<Edit2 size={16} />}
                                onClick={() => setIsEditMode(true)}
                            >
                                Edit Text
                            </Button>
                            {!isEditMode && rawText && (
                                <Button 
                                    variant="secondary" 
                                    size="sm"
                                    icon={<SplitSquareHorizontal size={16} />}
                                    onClick={handleConvertLinesToScenes}
                                    title="Auto-convert each non-empty line into a new Scene"
                                >
                                    Lines to Scenes
                                </Button>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Button variant="ghost" size="sm" onClick={handleUndo} disabled={history.length === 0} icon={<Undo2 size={16} />}>
                                Undo
                            </Button>
                            {rawText && (
                                <Button variant="ghost" size="sm" onClick={() => {
                                    if (window.confirm("Clear all text and annotations?")) {
                                        pushHistory([], '')
                                    }
                                }}>
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                    
                    {!rawText ? (
                        <div 
                            className={`upload-state ${dragActive ? 'drag-active' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            style={{ cursor: 'pointer' }}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                accept=".txt,.docx" 
                                onChange={handleFileSelect} 
                            />
                            <div className="card-header-icon blue" style={{ width: 64, height: 64, borderRadius: '50%', marginBottom: 'var(--space-4)' }}>
                                <Upload size={32} />
                            </div>
                            <h3 style={{ margin: '0 0 var(--space-2)' }}>Upload Script</h3>
                            <p style={{ color: 'var(--gray-500)', margin: '0 0 var(--space-4)' }}>
                                Drag and drop a .txt or .docx file here, or click to browse.
                            </p>
                            <p style={{ color: 'var(--gray-400)', fontSize: 'var(--text-sm)', margin: 0 }}>
                                Alternatively, click "Edit Text" mode and paste your script directly.
                            </p>
                        </div>
                    ) : (
                        <div 
                            className="editor-content"
                            ref={editorRef}
                        >
                            {isEditMode ? (
                                <textarea 
                                    className="editor-textarea"
                                    value={rawText}
                                    onChange={(e) => setRawText(e.target.value)}
                                    placeholder="Type or paste your script here..."
                                />
                            ) : (
                                <div 
                                    className="editor-markup-view"
                                    onMouseUp={handleMouseUp}
                                    onClick={handleMarkupClick}
                                >
                                    {renderAnnotatedText()}
                                    
                                    {/* Selection Popover */}
                                    {selection && (
                                        <div 
                                            className="selection-popover"
                                            style={{ top: selection.top, left: selection.left }}
                                        >
                                            <p style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--gray-500)', fontWeight: 600, padding: '0 var(--space-2)' }}>
                                                MARK AS:
                                            </p>
                                            {selection.activeSceneId ? (
                                                <>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        style={{ justifyContent: 'flex-start', fontSize: '13px' }} 
                                                        onClick={() => handleMarkAction(selection.activeSceneId)}
                                                        icon={<Play size={12} />}
                                                    >
                                                        Add as Action (S{(scenes.find(s => s.scene_id === selection.activeSceneId)?.actions?.length || 0) + 1})
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        style={{ justifyContent: 'flex-start', fontSize: '13px' }} 
                                                        onClick={handleSplitScene}
                                                        icon={<SplitSquareVertical size={12} />}
                                                    >
                                                        Split to new Scene
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button variant="ghost" size="sm" style={{ justifyContent: 'flex-start' }} onClick={handleMarkScene} icon={<Plus size={14} />}>
                                                    New Scene
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Right Area: Annotations */}
                <div className="annotations-panel">
                    <div className="editor-header">
                        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600 }}>Annotations</h3>
                        <Badge color="blue">{scenes.length} Scenes</Badge>
                    </div>
                    <div className="annotations-list">
                        {scenes.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--gray-400)', marginTop: 'var(--space-8)' }}>
                                <FileText size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.5 }} />
                                <p>No scenes marked yet.</p>
                                <p style={{ fontSize: 'var(--text-sm)' }}>Highlight text in Annotate Mode to create scenes and actions.</p>
                            </div>
                        ) : (
                            scenes.map((scene) => (
                                <div 
                                    key={scene.scene_id} 
                                    id={`scene-list-item-${scene.scene_id}`}
                                    className={`scene-item ${activeListSceneId === scene.scene_id ? 'active' : ''}`}
                                >
                                    <div className="scene-item-header">
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            Scene #{scene.scene_id}
                                        </span>
                                        <IconButton size="sm" onClick={() => handleDeleteScene(scene.scene_id)}>
                                            <Trash2 size={16} />
                                        </IconButton>
                                    </div>
                                    <div className="scene-item-body">
                                        <div style={{ fontStyle: 'italic', marginBottom: 'var(--space-2)' }}>
                                            "{scene.scene_text.length > 60 ? scene.scene_text.substring(0, 60) + '...' : scene.scene_text}"
                                        </div>
                                        
                                        <div className="action-list">
                                            {scene.actions.length === 0 ? (
                                                <div style={{ color: 'var(--gray-400)', fontStyle: 'italic', fontSize: 'var(--text-xs)' }}>
                                                    No actions marked. Highlight text to add actions.
                                                </div>
                                            ) : (
                                                scene.actions.map(action => {
                                                    const colorClass = getColorClass(action.id)
                                                    return (
                                                        <div key={action.id} className="action-item">
                                                            <Badge className={colorClass} style={{ fontWeight: 700 }}>
                                                                {action.id}
                                                            </Badge>
                                                            <div className="action-item-text">
                                                                {action.text}
                                                            </div>
                                                            <IconButton size="sm" onClick={() => handleDeleteAction(scene.scene_id, action.id)}>
                                                                <Trash2 size={14} />
                                                            </IconButton>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ScriptEditor
