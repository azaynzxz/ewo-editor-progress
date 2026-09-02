import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
import { PageHeader } from '../components/layout'
import SearchableDropdown from '../components/SearchableDropdown'
import { Button, IconButton, Badge, Modal } from '../components/ui'
import { FileText, Download, Upload, Trash2, MousePointer2, Settings, Plus, Play, Edit2, SplitSquareHorizontal, Undo2, Redo2, SplitSquareVertical, ExternalLink, Sparkles } from 'lucide-react'
import jsPDF from 'jspdf'
import '../styles/script-editor.css'
import Toast from '../components/Toast'

const APPS_SCRIPT_URL = '/api/exec'

const EditorMarkup = memo(({ html, onUpdate, onSelection, onClick, updateVersion, textSize }) => {
    const timeoutRef = useRef(null);
    const callbacksRef = useRef({ onUpdate, onSelection, onClick });
    const containerRef = useRef(null);
    
    useEffect(() => {
        callbacksRef.current = { onUpdate, onSelection, onClick };
    }, [onUpdate, onSelection, onClick]);

    useEffect(() => {
        const handleSelectionChange = () => {
            if (!containerRef.current) return;
            const sel = window.getSelection();
            if (!sel.rangeCount) return;
            
            let node = sel.anchorNode;
            let activeScene = null;
            while (node && node !== document.body && node !== containerRef.current) {
                if (node.nodeType === 1 && node.classList.contains('hl-scene')) {
                    activeScene = node;
                    break;
                }
                node = node.parentNode;
            }
            
            const allScenes = containerRef.current.querySelectorAll('.hl-scene');
            allScenes.forEach(s => {
                if (s === activeScene) {
                    s.classList.add('is-active');
                } else {
                    s.classList.remove('is-active');
                }
            });
        };
        
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, []);

    const extractAndUpdate = (container) => {
        const scenes = container.querySelectorAll('.hl-scene');
        const originalDisplays = [];
        scenes.forEach(s => {
            originalDisplays.push(s.style.display);
            s.style.display = 'inline';
        });
        
        const badges = container.querySelectorAll('.action-inline-badge, .delete-scene-icon, .remove-action-btn');
        const badgeDisplays = [];
        badges.forEach(b => {
            badgeDisplays.push(b.style.display);
            b.style.display = 'none';
        });
        
        callbacksRef.current.onUpdate({ currentTarget: container });
        
        scenes.forEach((s, i) => {
            s.style.display = originalDisplays[i];
            
            // Self-healing: If user accidentally deleted the trash icon natively, regenerate it
            if (!s.querySelector('.delete-scene-icon')) {
                const icon = document.createElement('span');
                icon.className = 'delete-scene-icon';
                icon.contentEditable = 'false';
                icon.setAttribute('data-delete-scene-id', s.getAttribute('data-scene-id'));
                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>';
                s.appendChild(icon);
            }
        });
        
        // Restore existing badges, and self-heal missing action badges
        badges.forEach((b, i) => {
            if (b && b.style) {
                b.style.display = badgeDisplays[i];
            }
        });
        
        const actions = container.querySelectorAll('.hl-action');
        actions.forEach(a => {
            // Self-healing: If user accidentally deleted the action badge or X button natively, regenerate them
            const actionId = a.getAttribute('data-action-id');
            const sceneId = a.getAttribute('data-scene-id');
            if (!a.querySelector('.action-inline-badge')) {
                const badge = document.createElement('span');
                badge.className = 'action-inline-badge';
                badge.contentEditable = 'false';
                badge.innerText = actionId;
                a.appendChild(badge);
            }
            if (!a.querySelector('.remove-action-btn')) {
                const removeBtn = document.createElement('span');
                removeBtn.className = 'remove-action-btn';
                removeBtn.contentEditable = 'false';
                removeBtn.setAttribute('data-delete-action-id', actionId);
                removeBtn.setAttribute('data-delete-scene-id', sceneId);
                removeBtn.innerText = '×';
                a.appendChild(removeBtn);
            }
        });
    };

    const handleInput = (e) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        const container = e.currentTarget;
        timeoutRef.current = setTimeout(() => {
            extractAndUpdate(container);
        }, 1000);
    };

    const handleBlur = (e) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        extractAndUpdate(e.currentTarget);
    };

    return (
        <div 
            ref={containerRef}
            className="editor-markup-view"
            style={{ fontSize: `${textSize}px`, lineHeight: 1.6 }}
            onMouseUp={(e) => callbacksRef.current.onSelection(e)}
            onClick={(e) => callbacksRef.current.onClick(e)}
            onInput={handleInput}
            onBlur={handleBlur}
            contentEditable={true}
            suppressContentEditableWarning={true}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}, (prevProps, nextProps) => prevProps.updateVersion === nextProps.updateVersion && prevProps.textSize === nextProps.textSize);

function ScriptEditor() {
    const [rawText, setRawText] = useState(() => localStorage.getItem('ewo_script_rawText') || '')
    const [updateVersion, setUpdateVersion] = useState(0)
    const [scenes, setScenes] = useState(() => {
        try {
            const cached = localStorage.getItem('ewo_script_scenes');
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    }) // { scene_id: "1", scene_text: "...", actions: [ { id: "S1", text: "..." } ] }
    const [history, setHistory] = useState(() => {
        try {
            const cached = localStorage.getItem('ewo_script_history');
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    }) // history of { scenes, rawText } for undo
    const [future, setFuture] = useState([])
    const [dragActive, setDragActive] = useState(false)
    const [activeListSceneId, setActiveListSceneId] = useState(null)
    const [selection, setSelection] = useState(null)
    const [mammothLoaded, setMammothLoaded] = useState(false)
    const [customer, setCustomer] = useState(() => localStorage.getItem('ewo_script_customer') || '')
    const [title, setTitle] = useState(() => localStorage.getItem('ewo_script_title') || '')
    const [showMetadataModal, setShowMetadataModal] = useState(false)
    const [allProjects, setAllProjects] = useState([])
    const [isExporting, setIsExporting] = useState(false)
    const [isAiSplitting, setIsAiSplitting] = useState(false)
    const [toast, setToast] = useState(null)
    const [confirmDialog, setConfirmDialog] = useState(null)
    const [editingSceneId, setEditingSceneId] = useState(null)
    const [editSceneText, setEditSceneText] = useState("")
    const [textSize, setTextSize] = useState(() => parseInt(localStorage.getItem('ewo_script_text_size') || '16'))
    
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

    useEffect(() => {
        localStorage.setItem('ewo_script_rawText', rawText);
        localStorage.setItem('ewo_script_scenes', JSON.stringify(scenes));
        localStorage.setItem('ewo_script_history', JSON.stringify(history));
    }, [rawText, scenes, history]);

    useEffect(() => {
        localStorage.setItem('ewo_script_customer', customer);
        localStorage.setItem('ewo_script_title', title);
    }, [customer, title]);

    useEffect(() => {
        localStorage.setItem('ewo_script_text_size', textSize.toString());
    }, [textSize]);

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
    const [savedClients, setSavedClients] = useState(() => {
        try {
            const cached = localStorage.getItem('ewo_saved_clients');
            if (cached) return JSON.parse(cached);
        } catch { }
        return [
            'Alex', 'Allan', 'Amanda', 'Angelo', 'Bashar', 'Bryan', 'Jordan', 'Jorge', 'Julia', 'Kristin', 'Michael', 'Ryan', 'Simon', 'Wing', 'Yannick', 'Zheng', 'Internal'
        ];
    });
    
    const editorRef = useRef(null)
    const fileInputRef = useRef(null)
    const csvInputRef = useRef(null)
    const jsonInputRef = useRef(null)

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

    const pushHistory = (newScenes, newRawText = rawText, fromLiveEdit = false) => {
        setHistory(prev => [...prev, { scenes, rawText }])
        setFuture([])
        setScenes(newScenes)
        if (newRawText !== rawText) {
            setRawText(newRawText)
        }
        if (!fromLiveEdit) setUpdateVersion(v => v + 1);
    }

    const handleUndo = useCallback(() => {
        if (history.length > 0) {
            const previous = history[history.length - 1]
            setFuture(prev => [{ scenes, rawText }, ...prev])
            setScenes(previous.scenes)
            setRawText(previous.rawText)
            setHistory(prev => prev.slice(0, -1))
            setUpdateVersion(v => v + 1);
        }
    }, [history, scenes, rawText])

    const handleRedo = useCallback(() => {
        if (future.length > 0) {
            const next = future[0]
            setHistory(prev => [...prev, { scenes, rawText }])
            setScenes(next.scenes)
            setRawText(next.rawText)
            setFuture(prev => prev.slice(1))
            setUpdateVersion(v => v + 1);
        }
    }, [future, scenes, rawText])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
                if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault()
                    handleUndo()
                } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
                    e.preventDefault()
                    handleRedo()
                }
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [handleUndo, handleRedo])

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
        setUpdateVersion(v => v + 1);
        
        // Force user to provide a new name for the imported script
        setCustomer("");
        setTitle("");
        setShowMetadataModal(true);
    }

    const handleMouseUp = (e) => {
        if (!rawText) return
        
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
                type: 'text',
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
        if (window.getSelection().toString().trim().length > 0) return;
        
        const deleteSceneBtn = e.target.closest('.delete-scene-icon');
        if (deleteSceneBtn) {
            const sceneId = deleteSceneBtn.getAttribute('data-delete-scene-id');
            handleDeleteScene(sceneId);
            setSelection(null);
            return;
        }

        const deleteActionBtn = e.target.closest('.remove-action-btn');
        if (deleteActionBtn) {
            const actionId = deleteActionBtn.getAttribute('data-delete-action-id');
            const sceneId = deleteActionBtn.getAttribute('data-delete-scene-id');
            handleDeleteAction(sceneId, actionId);
            setSelection(null);
            return;
        }
        
        setSelection(null);
    }

    const handleMarkupBlur = (e) => {
        if (!rawText) return;
        const container = e.currentTarget;
        
        let newRawText = container.innerText || "";
        newRawText = newRawText.replace(/\r\n/g, '\n');
        // Clean up any legacy "×" artifacts that got permanently stuck in the user's raw text
        newRawText = newRawText.replace(/×/g, '');

        let newScenes = [];
        const sceneNodes = container.querySelectorAll('.hl-scene');
        
        sceneNodes.forEach(node => {
            let sceneText = node.innerText.replace(/\r\n/g, '\n').trim();
            sceneText = sceneText.replace(/×/g, ''); // sanitize artifact
            
            const actionNodes = node.querySelectorAll('.hl-action');
            let actionMap = new Map();
            actionNodes.forEach(aNode => {
                let actionId = aNode.getAttribute('data-action-id') || aNode.getAttribute('title');
                if (actionId && actionId.startsWith('Action ')) actionId = actionId.replace('Action ', '');
                
                let actionText = aNode.innerText.replace(/\r\n/g, '\n').trim();
                actionText = actionText.replace(/×/g, ''); // sanitize artifact
                
                if (actionText) {
                    if (actionMap.has(actionId)) {
                        actionMap.set(actionId, actionMap.get(actionId) + '\n' + actionText);
                    } else {
                        actionMap.set(actionId, actionText);
                    }
                }
            });
            let newActions = Array.from(actionMap.entries()).map(([id, text]) => ({ id, text }));
            
            if (sceneText) {
                newScenes.push({
                    scene_id: '', // Will renumber below
                    scene_text: sceneText,
                    actions: newActions
                });
            }
        });
        // Re-number all scenes sequentially based on DOM order
        newScenes = newScenes.map((s, idx) => {
            const newId = (idx + 1).toString();
            
            // Natively mutate the DOM attribute so the CSS label updates instantly 
            // without waiting for React to overwrite the contentEditable (which it suppresses when focused)
            if (sceneNodes[idx]) {
                sceneNodes[idx].setAttribute('data-scene-id', newId);
                sceneNodes[idx].setAttribute('title', `Scene #${newId}`);
            }
            
            return {
                ...s,
                scene_id: newId
            };
        });

        if (newRawText !== rawText || JSON.stringify(newScenes) !== JSON.stringify(scenes)) {
            pushHistory(newScenes, newRawText, true);
        }
    }

    const sortAndRenumberScenes = (scenesList, currentRawText) => {
        const sorted = [...scenesList].sort((a, b) => {
            const idxA = currentRawText.indexOf(a.scene_text);
            const idxB = currentRawText.indexOf(b.scene_text);
            return idxA - idxB;
        });
        return sorted.map((s, idx) => ({ ...s, scene_id: (idx + 1).toString() }));
    };

    const handleMarkScene = () => {
        if (!selection || !selection.text) return
        
        const selText = selection.text.replace(/\r\n/g, '\n');
        
        // Check if text already in a scene
        const existingScene = scenes.find(s => s.scene_text.includes(selText) || selText.includes(s.scene_text))
        if (existingScene) {
            setToast({ message: 'Text is already part of a scene.', type: 'error' })
            return
        }

        const newScenesList = [...scenes, {
            scene_id: 'temp',
            scene_text: selText,
            actions: []
        }];
        
        const sortedScenes = sortAndRenumberScenes(newScenesList, rawText);
        
        pushHistory(sortedScenes)
        setSelection(null)
        window.getSelection().removeAllRanges()
    }

    const handleMarkAction = (sceneId) => {
        if (!selection) return
        
        pushHistory(scenes.map(scene => {
            if (scene.scene_id === sceneId) {
                let newActions = [...scene.actions];
                
                const startIndex = scene.scene_text.indexOf(selection.text);
                
                // Find the maximum end position of all existing actions that appear before the newly selected text
                let maxEndBefore = 0;
                scene.actions.forEach(a => {
                    const aStart = scene.scene_text.indexOf(a.text);
                    if (aStart !== -1) {
                        const aEnd = aStart + a.text.length;
                        if (aEnd <= startIndex && aEnd > maxEndBefore) {
                            maxEndBefore = aEnd;
                        }
                    }
                });
                
                // Auto-fill the gap before the newly selected text, if there is one
                if (startIndex > maxEndBefore) {
                    const gapText = scene.scene_text.substring(maxEndBefore, startIndex).trim();
                    if (gapText) {
                        newActions.push({ id: 'temp', text: gapText });
                    }
                }
                
                newActions.push({ id: 'temp', text: selection.text })
                
                // Sort actions based on their starting position in the scene text
                newActions.sort((a, b) => {
                    const indexA = scene.scene_text.indexOf(a.text);
                    const indexB = scene.scene_text.indexOf(b.text);
                    return indexA - indexB;
                });
                
                // Re-assign sequential IDs to all actions
                newActions = newActions.map((action, idx) => ({
                    ...action,
                    id: `S${idx + 1}`
                }));
                
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
        const remainingScenes = scenes.filter(s => s.scene_id !== sceneId);
        const sortedScenes = sortAndRenumberScenes(remainingScenes, rawText);
        pushHistory(sortedScenes);
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

    const handleSaveSceneEdit = (sceneId) => {
        const sceneToEdit = scenes.find(s => s.scene_id === sceneId);
        if (!sceneToEdit) return;

        const oldText = sceneToEdit.scene_text;
        const newText = editSceneText;

        if (oldText !== newText) {
            const newScenes = scenes.map(s => s.scene_id === sceneId ? { ...s, scene_text: newText } : s);
            const newRawText = rawText.replace(oldText, newText);
            pushHistory(newScenes, newRawText);
        }
        setEditingSceneId(null);
    }

    const handleConvertLinesToScenes = () => {
        const executeConvert = () => {
            const lines = rawText.split('\n').filter(line => line.trim().length > 0);
            const newScenes = lines.map((line, idx) => ({
                scene_id: (idx + 1).toString(),
                scene_text: line.trim(),
                actions: []
            }));
            pushHistory(newScenes);
        };

        if (scenes.length > 0) {
            setConfirmDialog({
                title: 'Overwrite Scenes',
                message: 'This will overwrite your existing scenes. Are you sure?',
                onConfirm: () => {
                    executeConvert();
                    setConfirmDialog(null);
                }
            });
        } else {
            executeConvert();
        }
    }

    const handleSplitScene = () => {
        if (!selection || !selection.activeSceneId) return;
        
        const activeScene = scenes.find(s => s.scene_id === selection.activeSceneId);
        if (!activeScene) return;

        const selText = selection.text.replace(/\r\n/g, '\n');
        let index = activeScene.scene_text.indexOf(selText);
        
        if (index === -1) {
            // Loose match ignoring extra whitespace
            const normalize = str => str.replace(/\s+/g, '');
            const normScene = normalize(activeScene.scene_text);
            const normSel = normalize(selText);
            const normIndex = normScene.indexOf(normSel);
            
            if (normIndex !== -1) {
                let charCount = 0;
                for (let i = 0; i < activeScene.scene_text.length; i++) {
                    if (!/\s/.test(activeScene.scene_text[i])) {
                        if (charCount === normIndex) {
                            index = i;
                            break;
                        }
                        charCount++;
                    }
                }
            }
        }
        
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
        
        // Auto-sort and re-number based on exact text position
        newScenes = sortAndRenumberScenes(newScenes, rawText);
        
        // Replace text in rawText to insert double newlines for visual separation
        const replacementText = [part1, part2, part3].filter(Boolean).join('\n');
        const newRawText = rawText.replace(activeScene.scene_text, replacementText);
        
        pushHistory(newScenes, newRawText);
        setSelection(null);
        window.getSelection().removeAllRanges();
    }

    const handleAISplitScene = async () => {
        if (!selection || !selection.activeSceneId) return;
        
        const activeScene = scenes.find(s => s.scene_id === selection.activeSceneId);
        if (!activeScene) return;

        const selText = selection.text.replace(/\r\n/g, '\n');
        let index = activeScene.scene_text.indexOf(selText);
        
        if (index === -1) {
            const normalize = str => str.replace(/\s+/g, '');
            const normScene = normalize(activeScene.scene_text);
            const normSel = normalize(selText);
            const normIndex = normScene.indexOf(normSel);
            
            if (normIndex !== -1) {
                let charCount = 0;
                for (let i = 0; i < activeScene.scene_text.length; i++) {
                    if (!/\s/.test(activeScene.scene_text[i])) {
                        if (charCount === normIndex) {
                            index = i;
                            break;
                        }
                        charCount++;
                    }
                }
            }
        }
        
        if (index === -1) {
            setToast({ message: 'Could not match selection exactly.', type: 'error' });
            return;
        }

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            setToast({ message: 'Missing Gemini API key in .env', type: 'error' });
            return;
        }

        setIsAiSplitting(true);
        try {
            const prompt = `You are an assistant that splits raw text into logical scenes (1-3 sentences per scene).
CRITICAL RULES:
1. DO NOT change, paraphrase, add, or remove ANY words from the original text.
2. You must only output the exact original text, inserting newlines (\\n) to separate the scenes.
3. Do not output markdown formatting, code blocks, or any conversational text.

Raw text to split:
${selText}`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1,
                        topK: 1,
                        topP: 1
                    }
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || 'API request failed');

            const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!aiText) throw new Error('No text returned from AI');

            const aiParts = aiText.split('\n').map(p => p.trim()).filter(Boolean);

            const part1 = activeScene.scene_text.substring(0, index).trim();
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
                    aiParts.forEach(part => {
                        newScenes.push({ scene_id: '', scene_text: part, actions: getActionsForPart(part) });
                    });
                    if (part3) {
                        newScenes.push({ scene_id: '', scene_text: part3, actions: getActionsForPart(part3) });
                    }
                } else {
                    newScenes.push(scene);
                }
            });
            
            // Auto-sort and re-number based on exact text position
            newScenes = sortAndRenumberScenes(newScenes, rawText);
            
            // Replace text in rawText to insert double newlines for visual separation
            const replacementText = [part1, ...aiParts, part3].filter(Boolean).join('\n');
            const newRawText = rawText.replace(activeScene.scene_text, replacementText);
            
            pushHistory(newScenes, newRawText);
            setSelection(null);
            window.getSelection().removeAllRanges();
            setToast({ message: 'Split by AI successfully!', type: 'success' });
        } catch (error) {
            console.error(error);
            setToast({ message: 'AI Split failed: ' + error.message, type: 'error' });
        } finally {
            setIsAiSplitting(false);
        }
    }

    const generateStoryboardPDF = (safeCustomer, safeTitle) => {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        })

        const boxWidth = 89
        const boxHeight = 50
        const colSpacing = 5
        const rowSpacing = 10
        const startX = 10
        const startY = 10
        const textHeight = 40 // allocated space for text

        let sceneIndex = 0

        while (sceneIndex < scenes.length) {
            if (sceneIndex > 0) {
                doc.addPage()
            }

            for (let row = 0; row < 2; row++) {
                for (let col = 0; col < 3; col++) {
                    if (sceneIndex >= scenes.length) break

                    const scene = scenes[sceneIndex]
                    const x = startX + col * (boxWidth + colSpacing)
                    const y = startY + row * (boxHeight + rowSpacing + textHeight)

                    // Draw 16:9 box
                    doc.setDrawColor(255, 0, 0) // Red border
                    doc.setLineWidth(0.5)
                    doc.rect(x, y, boxWidth, boxHeight)

                    // Add text below
                    let textY = y + boxHeight + 5
                    doc.setTextColor(0, 0, 0)
                    doc.setFontSize(9)
                    
                    // Scene ID
                    doc.setFont("helvetica", "bold")
                    doc.text(`Scene #${scene.scene_id}`, x, textY)
                    textY += 4
                    
                    doc.setFont("helvetica", "normal")
                    // Split scene text into lines
                    const sceneTextLines = doc.splitTextToSize(scene.scene_text, boxWidth)
                    doc.text(sceneTextLines, x, textY)
                    textY += (sceneTextLines.length * 4)

                    // Add actions
                    if (scene.actions && scene.actions.length > 0) {
                        textY += 2
                        scene.actions.forEach(action => {
                            const actionLabel = `[${action.id}]: `
                            const actionLines = doc.splitTextToSize(`${actionLabel}${action.text}`, boxWidth)
                            doc.text(actionLines, x, textY)
                            textY += (actionLines.length * 4)
                        })
                    }

                    sceneIndex++
                }
            }
        }

        // Add footer with date and pagination
        const totalPages = doc.internal.getNumberOfPages()
        const dateStr = new Date().toLocaleString()
        
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150) // Gray color for footer
            
            // Date on bottom left
            doc.text(`Generated: ${dateStr}`, 10, 202)
            
            // Page X of Y on bottom right
            const pageStr = `Page ${i} of ${totalPages}`
            const pageStrWidth = doc.getTextWidth(pageStr)
            doc.text(pageStr, 297 - 10 - pageStrWidth, 202)
        }
        
        doc.save(`${safeCustomer} - ${safeTitle} - Storyboard.pdf`)
    }

    const cleanWordForMatch = (word) => {
        if (!word) return '';
        return word.replace(/[^\w]/g, '').toLowerCase();
    }

    const processCsvSync = (csvText) => {
        const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const dataLines = lines.slice(1);
        
        const csvWords = [];
        for (const line of dataLines) {
            const parts = [];
            let inQuotes = false;
            let currentPart = "";
            for(let i=0; i<line.length; i++) {
                const char = line[i];
                if(char === '"') {
                    inQuotes = !inQuotes;
                } else if(char === ',' && !inQuotes) {
                    parts.push(currentPart);
                    currentPart = "";
                } else {
                    currentPart += char;
                }
            }
            parts.push(currentPart);
            
            if (parts.length >= 4) {
                csvWords.push({
                    start: parts[1],
                    end: parts[2],
                    originalWord: parts[3],
                    cleanWord: cleanWordForMatch(parts[3])
                });
            }
        }

        const syncData = [];
        let unmatchedCount = 0;
        
        scenes.forEach(scene => {
            const sceneWords = scene.scene_text.split(/\s+/).map(cleanWordForMatch).filter(w => w.length > 0);
            let matchIndex = -1;
            const wordsToMatch = Math.min(sceneWords.length, 3); // match up to 3 words
            
            if (wordsToMatch > 0) {
                for (let i = 0; i <= csvWords.length - wordsToMatch; i++) {
                    let isMatch = true;
                    for (let j = 0; j < wordsToMatch; j++) {
                        if (csvWords[i + j].cleanWord !== sceneWords[j]) {
                            isMatch = false;
                            break;
                        }
                    }
                    if (isMatch) {
                        matchIndex = i;
                        break;
                    }
                }
            }

            if (matchIndex !== -1) {
                syncData.push({
                    sceneId: `S${scene.scene_id}`,
                    startTime: csvWords[matchIndex].start
                });
            } else {
                unmatchedCount++;
            }
        });

        if (syncData.length === 0) {
            alert("Could not match any scenes to the provided CSV timing data.");
            return;
        }
        
        if (unmatchedCount > 0) {
            alert(`Matched ${syncData.length} scenes. Could not find a match for ${unmatchedCount} scenes.`);
        }

        let outCsv = "Scene Name,Start Time\n";
        syncData.forEach(row => {
            outCsv += `${row.sceneId},${row.startTime}\n`;
        });

        const safeCustomer = customer.trim().replace(/[\\/:*?"<>|]/g, '') || 'UnknownCustomer'
        const safeTitle = title.trim().replace(/[\\/:*?"<>|]/g, '') || 'Untitled'
        const blob = new Blob([outCsv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${safeCustomer} - ${safeTitle} - Timeline Sync.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleCsvSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            processCsvSync(event.target.result);
            e.target.value = null;
        };
        reader.readAsText(file);
    }

    const handleMatchToTime = () => {
        if (scenes.length === 0) {
            alert('No scenes defined to match.')
            return
        }
        if (!customer.trim() || !title.trim()) {
            setShowMetadataModal(true)
            return
        }
        csvInputRef.current?.click();
    }

    const handleExportStoryboard = () => {
        if (scenes.length === 0) {
            alert('No scenes defined to export.')
            return
        }
        if (!customer.trim() || !title.trim()) {
            setShowMetadataModal(true)
            return
        }
        
        const safeCustomer = customer.trim().replace(/[\\/:*?"<>|]/g, '')
        const safeTitle = title.trim().replace(/[\\/:*?"<>|]/g, '')

        generateStoryboardPDF(safeCustomer, safeTitle)
    }

    const handleExportJSON = async () => {
        if (scenes.length === 0) {
            alert('No scenes defined to export.')
            return
        }
        if (!customer.trim() || !title.trim()) {
            setShowMetadataModal(true)
            return
        }
        
        setIsExporting(true)
        
        const safeCustomer = customer.trim().replace(/[\\/:*?"<>|]/g, '')
        const safeTitle = title.trim().replace(/[\\/:*?"<>|]/g, '')
        
        const dataStr = JSON.stringify(scenes, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        const filename = `${safeCustomer} - ${safeTitle} - Script Annotations.json`
        a.download = filename
        
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        try {
            await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'backupJson',
                    filename: filename,
                    content: dataStr
                })
            })
            console.log(`Json file ${filename} backed up`)
            setToast({ message: `Backup successful: ${filename}`, type: 'success' })
        } catch (err) {
            console.error('Backup failed:', err)
            setToast({ message: 'Backup to Drive failed. Please try again.', type: 'error' })
        } finally {
            setIsExporting(false)
        }
    }

    const handleJsonSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                // We expect an array of scenes (or an object with a scenes array depending on how it was saved in the past)
                let importedScenes = [];
                if (Array.isArray(importedData)) {
                    importedScenes = importedData;
                } else if (importedData.scenes && Array.isArray(importedData.scenes)) {
                    importedScenes = importedData.scenes;
                } else {
                    throw new Error("Invalid JSON format. Expected an array of scenes.");
                }
                
                // Reconstruct rawText
                const reconstructedRawText = importedScenes.map(s => s.scene_text).join('\n\n');
                
                // Clear metadata to force user to enter new name on next export
                setCustomer("");
                setTitle("");
                setShowMetadataModal(true);
                
                pushHistory(importedScenes, reconstructedRawText);
                setToast({ message: `Imported ${importedScenes.length} scenes successfully.`, type: 'success' });
            } catch (err) {
                console.error("Import failed", err);
                alert("Failed to parse JSON file. Please ensure it's a valid script backup.");
            }
            e.target.value = null;
        };
        reader.readAsText(file);
    }

    // A helper to get a consistent color class for an action (1-5 scale)
    const getColorClass = (actionId) => {
        // e.g. "S2" -> parse "2"
        const num = parseInt(actionId.replace(/\D/g, '')) || 1
        return `color-badge-${((num - 1) % 5) + 1}`
    }

    // Function to render the text with highlights. 
    // This is simple exact-string matching.
    // Function to get the text with highlights as raw HTML object.
    const getAnnotatedHtml = () => {
        if (!rawText) return { __html: '' }
        
        let html = rawText
        
        html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        
        scenes.forEach(scene => {
            const sceneEscaped = scene.scene_text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
            let tokens = [{ type: 'text', content: sceneEscaped }]
            
            scene.actions.forEach(action => {
                const escapedActionText = action.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
                let replaced = false;
                
                const newTokens = [];
                for (let i = 0; i < tokens.length; i++) {
                    const token = tokens[i];
                    if (token.type !== 'text' || replaced) {
                        newTokens.push(token);
                        continue;
                    }
                    
                    const idx = token.content.indexOf(escapedActionText);
                    if (idx !== -1) {
                        const part1 = token.content.substring(0, idx);
                        const part2 = token.content.substring(idx + escapedActionText.length);
                        
                        if (part1) newTokens.push({ type: 'text', content: part1 });
                        newTokens.push({ type: 'action', action: action, content: escapedActionText });
                        if (part2) newTokens.push({ type: 'text', content: part2 });
                        replaced = true;
                    } else {
                        newTokens.push(token);
                    }
                }
                tokens = newTokens;
            })
            
            let processedSceneText = '';
            tokens.forEach(token => {
                if (token.type === 'action') {
                    const colorClass = getColorClass(token.action.id);
                    processedSceneText += `<span class="hl-action ${colorClass}" data-action-id="${token.action.id}" data-scene-id="${scene.scene_id}" title="Action ${token.action.id}">${token.content}<span class="action-inline-badge" contenteditable="false">${token.action.id}</span><span class="remove-action-btn" contenteditable="false" data-delete-action-id="${token.action.id}" data-delete-scene-id="${scene.scene_id}">×</span></span>`;
                } else {
                    processedSceneText += token.content;
                }
            });
            
            const escapedForRegex = sceneEscaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedForRegex + '[ \\t]*(\\r?\\n)?');
            
            html = html.replace(
                regex,
                `<span class="hl-scene" data-scene-id="${scene.scene_id}" title="Scene #${scene.scene_id}">${processedSceneText}<span class="delete-scene-icon" contenteditable="false" data-delete-scene-id="${scene.scene_id}"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg></span></span>`
            )
        })

        return { __html: html }
    }

    return (
        <div className="script-editor-container">
            <PageHeader 
                title="Script Editor" 
                description="Upload, annotate scenes, and export to JSON for Photoshop automation."
                action={
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <Button variant="secondary" icon={<Upload size={18} />} onClick={() => jsonInputRef.current?.click()} title="Import previously exported JSON annotations">
                            Import
                        </Button>
                        <Button variant="secondary" icon={<Download size={18} />} onClick={handleExportStoryboard} disabled={scenes.length === 0} title="Export the scenes and actions as a Storyboard PDF">
                            Storyboard
                        </Button>
                        <Button variant="primary" icon={<Download size={18} />} onClick={handleExportJSON} disabled={scenes.length === 0} loading={isExporting} title="Export the annotated scenes to JSON for automation">
                            JSON
                        </Button>
                        <Button variant="secondary" icon={<ExternalLink size={18} />} onClick={() => window.open('https://drive.google.com/open?id=1cQ-XJmmwPNXHfkEP745US-cslo5EL3FU&usp=drive_fs', '_blank', 'noopener,noreferrer')} title="Open the Google Drive project to convert the JSON to PSD">
                            To PSD
                        </Button>
                    </div>
                }
            />
            
            {toast && (
                <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
                    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
                </div>
            )}

            <Modal
                isOpen={!!confirmDialog}
                onClose={() => setConfirmDialog(null)}
                title={confirmDialog?.title}
                className="modal-confirm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setConfirmDialog(null)}>Cancel</Button>
                        <Button variant="danger" onClick={confirmDialog?.onConfirm}>Confirm</Button>
                    </>
                }
            >
                <p style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--gray-500)' }}>
                    {confirmDialog?.message}
                </p>
            </Modal>

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
                                    options={savedClients}
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
                                    const custTrim = customer.trim();
                                    if (!savedClients.includes(custTrim)) {
                                        const newClients = [...savedClients, custTrim].sort((a, b) => a.localeCompare(b));
                                        setSavedClients(newClients);
                                        localStorage.setItem('ewo_saved_clients', JSON.stringify(newClients));
                                    }
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
                            {rawText && (
                                <>
                                    <Button 
                                        variant="secondary" 
                                        size="sm"
                                        icon={<SplitSquareHorizontal size={16} />}
                                        onClick={handleConvertLinesToScenes}
                                        title="Auto-convert each non-empty line into a new Scene"
                                    >
                                        Lines to Scenes
                                    </Button>
                                    <Button 
                                        variant="secondary" 
                                        size="sm"
                                        onClick={handleMatchToTime}
                                        title="Match scenes to a word-level timing CSV"
                                    >
                                        Match to Time
                                    </Button>
                                </>
                            )}
                            <input 
                                type="file" 
                                ref={csvInputRef} 
                                style={{ display: 'none' }} 
                                accept=".csv" 
                                onChange={handleCsvSelect} 
                            />
                            <input 
                                type="file" 
                                ref={jsonInputRef} 
                                style={{ display: 'none' }} 
                                accept=".json" 
                                onChange={handleJsonSelect} 
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Button variant="ghost" size="sm" onClick={() => setTextSize(s => Math.max(12, s - 2))} title="Decrease Text Size">
                                A-
                            </Button>
                            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', minWidth: '30px', textAlign: 'center' }}>
                                {textSize}px
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => setTextSize(s => Math.min(32, s + 2))} title="Increase Text Size">
                                A+
                            </Button>
                            <div style={{ width: '1px', height: '24px', background: 'var(--gray-300)', margin: '0 var(--space-2)' }} />
                            <Badge color="blue">{scenes.length} Scenes</Badge>
                            <div style={{ width: '1px', height: '24px', background: 'var(--gray-300)', margin: '0 var(--space-2)' }} />
                            <Button variant="ghost" size="sm" onClick={handleUndo} disabled={history.length === 0} icon={<Undo2 size={16} />}>
                                Undo
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleRedo} disabled={future.length === 0} icon={<Redo2 size={16} />}>
                                Redo
                            </Button>
                            {rawText && (
                                <Button variant="ghost" size="sm" onClick={() => {
                                    setConfirmDialog({
                                        title: 'Clear All Text',
                                        message: 'Are you sure you want to clear all text and annotations? This cannot be undone.',
                                        onConfirm: () => {
                                            pushHistory([], '');
                                            setConfirmDialog(null);
                                        }
                                    });
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
                                Or <a href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRawText('\n'); setUpdateVersion(v => v+1); }}>click here</a> to paste your script directly.
                            </p>
                        </div>
                    ) : (
                        <div 
                            className="editor-content"
                            ref={editorRef}
                        >
                            <EditorMarkup 
                                html={getAnnotatedHtml().__html}
                                onUpdate={handleMarkupBlur}
                                onSelection={handleMouseUp}
                                onClick={handleMarkupClick}
                                updateVersion={updateVersion}
                                textSize={textSize}
                            />
                            
                            {/* Selection Popover */}
                            {selection && (
                                <div 
                                    className="selection-popover"
                                    style={{ top: selection.top, left: selection.left }}
                                >
                                    {selection.type === 'text' && (
                                        <>
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
                                                        onClick={handleAISplitScene}
                                                        icon={<Sparkles size={12} />}
                                                        loading={isAiSplitting}
                                                    >
                                                        AI Split
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
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ScriptEditor
