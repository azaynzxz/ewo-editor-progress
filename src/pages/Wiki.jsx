import { useState } from 'react'
import { FileText, ChevronRight, ArrowLeft, Clock, User } from 'lucide-react'
import { PageHeader } from '../components/layout'
import { Card, CardBody, SearchInput, Button, Badge } from '../components/ui'

// Wiki articles data based on SOP content
const WIKI_ARTICLES = [
    {
        id: 'export-settings',
        title: 'Export Settings',
        category: 'Guidelines',
        description: 'Standard export settings for different platforms and clients',
        lastUpdated: '2026-02-07',
        author: 'EWO Team',
        content: `
# Export Settings Guide

This guide covers the standard export settings for all video deliverables at EWO.

## YouTube

| Setting | Value |
|---------|-------|
| **Resolution** | 1920x1080 (1080p) or 3840x2160 (4K) |
| **Frame Rate** | Match source or 30fps |
| **Codec** | H.264 |
| **Bitrate** | 15-25 Mbps (1080p), 35-68 Mbps (4K) |
| **Audio** | AAC, 48kHz, Stereo, 320kbps |

## Instagram / TikTok

| Setting | Value |
|---------|-------|
| **Resolution** | 1080x1920 (9:16 vertical) |
| **Frame Rate** | 30fps |
| **Codec** | H.264 |
| **Bitrate** | 10-15 Mbps |
| **Audio** | AAC, 48kHz, Stereo, 256kbps |

## Client Delivery

| Setting | Value |
|---------|-------|
| **Format** | ProRes 422 HQ or H.264 |
| **Include** | Draft watermark until final approval |
| **Naming** | [ClientName]_[ProjectName]_v[Version]_[Date] |

## Animation Render Settings

| Type | Resolution | Framerate | Codec | Bitrate |
|------|------------|-----------|-------|---------|
| **Draft** | 640x360 | 24-30 fps | H.264 | 2-4 Mbps |
| **Final** | 1920x1080 (HD) or 3840x2160 (4K) | 24-30 fps | H.264 | 8-15 Mbps |

## Video Ads Render Settings

| Type | Resolution | Framerate | Codec | Bitrate |
|------|------------|-----------|-------|---------|
| **Final** | 1920x1080, 1080x1920, 1080x1350, 1080x1080 | 24-30 fps | H.264 | 8-15 Mbps |

## Naming Conventions

- **Animation Files:** \`YTA - [Project Title].mp4\`
- **Animation Draft:** \`DRAFT - YTA [Project Title] Rev [x].mp4\`
- **Video Ads:** \`HOOK [X] - [Project Title] (Dimension).mp4\`

> **Pro Tip:** Always verify the export settings with the client before final delivery to avoid re-renders.
        `
    },
    {
        id: 'project-template',
        title: 'Project Template',
        category: 'Workflow',
        description: 'Standard folder structure and project setup for new projects',
        lastUpdated: '2026-02-07',
        author: 'EWO Team',
        content: `
# Project Template Guide

Follow this guide to set up new projects with our standard structure.

## Folder Structure for Animation

\`\`\`
Project_Name/
├── Draft/Render/
│   └── (draft render files)
├── File Project/
│   ├── After Effects (.aep)
│   └── Premiere Pro (.prproj)
├── Footage/Stock/
│   ├── A-Roll
│   ├── B-Roll
│   └── Additional footage
├── PSD/
│   └── (Illustrator files for animation scenes)
└── Brief & Client Files/
\`\`\`

## After Effects Project Structure

| Folder | Purpose |
|--------|---------|
| **main_comp** | Main composition containing all scenes from illustrator (PSD) |
| **Template** | Animation templates for reuse |
| **Solids** | Auto-generated folder for solid colors and adjustment layers |
| **Footage** | Additional graphics not provided by illustrator |
| **[Date folders]** | PSD files organized by edit date |

## Video Ads Project Structure

| Folder | Purpose |
|--------|---------|
| **Audio** | Voice over, sound effects, and music |
| **Footage** | A-Roll, B-Roll, raw video materials |
| **HOOKS** | Sequence hook variations |
| **TV Ads** | Alternative ad formats (optional) |

## Naming Conventions

| Type | Format | Example |
|------|--------|---------|
| **Compositions** | PascalCase | \`MainComp\`, \`IntroSequence\` |
| **Layers** | snake_case | \`bg_layer\`, \`text_main\` |
| **Files** | Descriptive | \`[ProjectName]_[Description]_v[Version]\` |

## Project Dimensions (Default)

| Project Type | Resolution | Frame Rate |
|--------------|------------|------------|
| **Animation / Web** | 1920x1080 (Full HD) | 24 fps |
| **4K Request** | 3840x2160 (Ultra HD) | 24-30 fps |
| **Ads - Vertical** | 1080x1920 (9:16) | 30 fps |
| **Ads - Square** | 1080x1080 (1:1) | 30 fps |
| **Ads - Horizontal** | 1920x1080 (16:9) | 30 fps |

## Backup Strategy

1. Save incremental versions every major change
2. Auto-save: Every 5 minutes
3. Backup to Google Drive daily

> **Critical:** The first save (\`Save As\`) must be done manually! Auto-Save won't work until the project is saved for the first time.
        `
    },
    {
        id: 'animation-workflow',
        title: 'Animation Workflow',
        category: 'Workflow',
        description: 'Step-by-step guide for animation production process',
        lastUpdated: '2026-02-07',
        author: 'EWO Team',
        content: `
# Animation Workflow Guide

Complete guide for the animation production process at EWO Studio.

## Pre-Production

### 1. Brief Analysis
Every brief received must be reviewed by the Video Editor to understand:
- Client requirements
- Best practices applicable
- Story vision based on the script

### 2. Asset Collection

1. **Download/Copy** all files from the designated source: [Youtube Animation folder](https://drive.google.com/drive/folders/19BoWkrIwu7MbAN0s35B5Q_9cqE-LffYy)
2. **Verify Assets** - Check file completeness against shot list
3. **Technical Check** - Ensure no corrupt files, wrong formats, or poor quality
4. **Assets include:** Illustrations (PSD), video footage, audio files, graphics, and documentation

> **Critical:** Save the project file immediately after creation! Auto-Save won't work until first manual save.

## Production

### Asset Handoff from Illustrator
- Animation editing depends on scene completion by the Illustrator Team
- Download all relevant scene assets from the Animation folder
- Group imports by date folder

### Layout in After Effects

1. Import all scene files and Voice Over (VO) file
2. Place VO in the main composition timeline (label as "Audio")
3. Arrange each scene one by one, syncing timing with VO dialogue
4. Use illustrator's dialog notes (start-end times) as placement guide

## Animation Presets

| Requirement | Standard |
|-------------|----------|
| **Mandatory** | Use approved internal Animation Presets and Templates |
| **Purpose** | Maintain visual consistency and speed up workflow |
| **Apply to** | Walk, Arc, Wiggle, Up/Down, Pops, Rolls/Glide, Rotate, Fly, Flip, Slides, Scale/Pulse, Flicker, Fades |

> **Reference:** Animation presets available at [s.id/AN-STD-EWO](http://s.id/AN-STD-EWO)

## Sound Effects

| Requirement | Standard |
|-------------|----------|
| **Integration** | All main visual elements (transitions, pop-ups, fast movements) must have relevant SFX |
| **Sync** | SFX must sync with the most prominent visual movement |
| **Audio Level** | Volume should not exceed **-9dB** or **-6dB**, consistent with VO and background music |

## Post-Production

### Self-QC
Before submitting, verify and fix all technical imperfections:
- Glitches
- Uneven audio levels
- Typos
- Dimension mismatches

### Revision Handling
Process revisions carefully based on feedback from Project Manager or Client. Record and apply systematically.

### Project Finalization
1. Ensure organized file structure following naming standards
2. Clear version numbering for traceability
3. Archive properly for future reference
        `
    },
    {
        id: 'video-ads-workflow',
        title: 'Video Ads Workflow',
        category: 'Workflow',
        description: 'Modular editing approach for video advertisements',
        lastUpdated: '2026-02-07',
        author: 'EWO Team',
        content: `
# Video Ads Workflow Guide

Complete guide for video advertisement production at EWO Studio.

## Asset Sources (Brief-Driven)

Unlike animation projects, video ads don't use Illustrator Team assets. Follow the brief for:
- Footage (A-Roll and B-Roll)
- Graphics (Logo, Text, etc.)
- Audio (Music, SFX, Voice Over)

## Modular Editing Structure

### Hooks & Body Approach
If the brief requires multiple hook variations, apply modular workflow:

| Component | Description |
|-----------|-------------|
| **Body** | Main content/core message of the ad |
| **Hooks** | Opening variations (first 3-5 seconds) |

**Final structure:** \`[Hook (Variant)] + [Body]\`

## Approval Workflow (Priority)

1. **Focus on Body first** - Get approval before proceeding to hooks
2. **After Body approval** - Create all hook variations (\`Hook 1\`, \`Hook 2\`, \`Hook 3\`, etc.)
3. **Combine** approved hooks with approved body

> **Warning:** Do NOT work on all hook variations if Body is still subject to major revisions!

## Voice Over Generation

If the brief doesn't include a VO file, generate using approved Text-to-Speech (e.g., ElevenLabs):

1. Verify script accuracy
2. Select appropriate and consistent voice model
3. Review audio for natural intonation (avoid robotic sound)

## Footage Selection Guidelines

### Main Principles
- Follow Brief, Script, and Voice Over as guides
- Every visual clip must support the audio narration context

### Context Matching
Focus on clips that visually reflect the narration content.

### Editing Principle

**Avoid over-literal visuals (word-for-word).** Select clips that effectively demonstrate the VO meaning.

| Scenario | Bad Example | Good Example |
|----------|-------------|--------------|
| Audio says: *"cuts boxes like butter"* | Show butter stock footage | Show the actual product cutting a box efficiently |

## Video Pacing

Maintain high visual change frequency to keep viewer retention:

| Requirement | Standard |
|-------------|----------|
| **Visual Change** | High frequency, max 2-3 seconds per clip |
| **Demo Efficiency** | Speed up product demonstrations (time-remapping) |
| **Clip Duration** | Only essential visual information, avoid excessive length |

## Software

- **Primary:** Adobe Premiere Pro 2021+
- **Alternative:** CapCut (if approved)

**Required capabilities:**
- Cut-to-Cut and trimming
- Visual Effects (VFX) and transitions
- Audio mixing and leveling
- Caption/Subtitle support
        `
    },
    {
        id: 'sound-effects-guide',
        title: 'Sound Effects Guide',
        category: 'Guidelines',
        description: 'Audio guidelines for SFX integration in video production',
        lastUpdated: '2026-02-07',
        author: 'EWO Team',
        content: `
# Sound Effects Integration Guide

Proper Sound Effects (SFX) integration is mandatory for completing animations and video projects.

## Why SFX Matters

- Increases production quality
- Drives viewer engagement
- Strengthens audiovisual experience

## Integration Rules

| Aspect | Standard |
|--------|----------|
| **Coverage** | All main visual elements (transitions, pop-ups, fast movements) |
| **Selection** | SFX relevant to the visual action |
| **Sync** | Must be synchronized with the most prominent visual movement |

## Audio Level Standards

| Level | Usage |
|-------|-------|
| **-9dB to -6dB** | Maximum SFX volume |
| **Consistency** | Maintain even levels throughout |
| **Balance** | Don't overpower Voice Over or Background Music |

## Common SFX Applications

| Visual Element | Recommended SFX |
|----------------|-----------------|
| **Transitions** | Whoosh, Swipe |
| **Pop-ups** | Pop, Bloop |
| **Button clicks** | Click, Tap |
| **Text reveals** | Typing, Subtle whoosh |
| **Logo appears** | Shimmer, Impact |
| **Fast movements** | Quick whoosh |

> **Tip:** Always preview the final mix with headphones to ensure proper balance.
        `
    }
]

// Enhanced Markdown Parser
const parseMarkdown = (content) => {
    const lines = content.trim().split('\n')
    const elements = []
    let inCodeBlock = false
    let codeContent = []
    let inTable = false
    let tableRows = []
    let inOrderedList = false
    let orderedListItems = []
    let inUnorderedList = false
    let unorderedListItems = []

    const processInlineFormatting = (text) => {
        // Process inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>')
        // Process bold
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Process italic
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // Process links
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        return text
    }

    const flushOrderedList = () => {
        if (orderedListItems.length > 0) {
            elements.push(
                <ol key={`ol-${elements.length}`} className="wiki-ordered-list">
                    {orderedListItems.map((item, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: processInlineFormatting(item) }} />
                    ))}
                </ol>
            )
            orderedListItems = []
            inOrderedList = false
        }
    }

    const flushUnorderedList = () => {
        if (unorderedListItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="wiki-unordered-list">
                    {unorderedListItems.map((item, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: processInlineFormatting(item) }} />
                    ))}
                </ul>
            )
            unorderedListItems = []
            inUnorderedList = false
        }
    }

    const flushTable = () => {
        if (tableRows.length > 0) {
            const headerRow = tableRows[0]
            const bodyRows = tableRows.slice(2) // Skip header and separator
            elements.push(
                <div key={`table-${elements.length}`} className="wiki-table-wrapper">
                    <table className="wiki-table">
                        <thead>
                            <tr>
                                {headerRow.split('|').filter(cell => cell.trim()).map((cell, i) => (
                                    <th key={i} dangerouslySetInnerHTML={{ __html: processInlineFormatting(cell.trim()) }} />
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {bodyRows.map((row, i) => (
                                <tr key={i}>
                                    {row.split('|').filter(cell => cell.trim()).map((cell, j) => (
                                        <td key={j} dangerouslySetInnerHTML={{ __html: processInlineFormatting(cell.trim()) }} />
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
            tableRows = []
            inTable = false
        }
    }

    lines.forEach((line, index) => {
        const trimmed = line.trim()

        // Code blocks
        if (trimmed.startsWith('```')) {
            if (inCodeBlock) {
                elements.push(
                    <pre key={`code-${elements.length}`}>
                        <code>{codeContent.join('\n')}</code>
                    </pre>
                )
                codeContent = []
                inCodeBlock = false
            } else {
                flushOrderedList()
                flushUnorderedList()
                flushTable()
                inCodeBlock = true
            }
            return
        }

        if (inCodeBlock) {
            codeContent.push(line)
            return
        }

        // Tables
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            flushOrderedList()
            flushUnorderedList()
            inTable = true
            tableRows.push(trimmed)
            return
        } else if (inTable) {
            flushTable()
        }

        // Empty lines
        if (trimmed === '') {
            flushOrderedList()
            flushUnorderedList()
            return
        }

        // Headers
        if (trimmed.startsWith('# ')) {
            flushOrderedList()
            flushUnorderedList()
            elements.push(<h1 key={`h1-${index}`}>{trimmed.slice(2)}</h1>)
            return
        }
        if (trimmed.startsWith('## ')) {
            flushOrderedList()
            flushUnorderedList()
            elements.push(<h2 key={`h2-${index}`}>{trimmed.slice(3)}</h2>)
            return
        }
        if (trimmed.startsWith('### ')) {
            flushOrderedList()
            flushUnorderedList()
            elements.push(<h3 key={`h3-${index}`}>{trimmed.slice(4)}</h3>)
            return
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
            flushOrderedList()
            flushUnorderedList()
            elements.push(
                <blockquote key={`bq-${index}`}>
                    <p dangerouslySetInnerHTML={{ __html: processInlineFormatting(trimmed.slice(2)) }} />
                </blockquote>
            )
            return
        }

        // Ordered list
        const orderedMatch = trimmed.match(/^(\d+)\.\s(.+)/)
        if (orderedMatch) {
            flushUnorderedList()
            inOrderedList = true
            orderedListItems.push(orderedMatch[2])
            return
        }

        // Unordered list
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            flushOrderedList()
            inUnorderedList = true
            unorderedListItems.push(trimmed.slice(2))
            return
        }

        // Regular paragraph
        flushOrderedList()
        flushUnorderedList()
        elements.push(
            <p key={`p-${index}`} dangerouslySetInnerHTML={{ __html: processInlineFormatting(trimmed) }} />
        )
    })

    // Flush any remaining lists
    flushOrderedList()
    flushUnorderedList()
    flushTable()

    return elements
}

function Wiki() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedArticle, setSelectedArticle] = useState(null)

    const filteredArticles = WIKI_ARTICLES.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (selectedArticle) {
        return (
            <div className="wiki-article">
                <Button
                    variant="ghost"
                    icon={<ArrowLeft size={18} />}
                    onClick={() => setSelectedArticle(null)}
                    style={{ marginBottom: 'var(--space-4)' }}
                >
                    Back to Wiki
                </Button>

                <Card>
                    <CardBody>
                        <div className="wiki-article-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                                <Badge color="blue">{selectedArticle.category}</Badge>
                            </div>
                            <h1 className="wiki-article-title">{selectedArticle.title}</h1>
                            <div className="wiki-article-meta">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                                    <User size={14} />
                                    {selectedArticle.author}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                                    <Clock size={14} />
                                    Updated {selectedArticle.lastUpdated}
                                </span>
                            </div>
                        </div>
                        <div className="wiki-content">
                            {parseMarkdown(selectedArticle.content)}
                        </div>
                    </CardBody>
                </Card>
            </div>
        )
    }

    return (
        <>
            <PageHeader
                title="Wiki"
                description="Documentation, guides, and best practices from SOP Editor"
            />

            <div style={{ marginBottom: 'var(--space-5)', maxWidth: '400px' }}>
                <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search articles..."
                />
            </div>

            <div className="grid grid-auto">
                {filteredArticles.map((article) => (
                    <Card
                        key={article.id}
                        hoverable
                        onClick={() => setSelectedArticle(article)}
                    >
                        <CardBody>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                                <div className="card-header-icon purple">
                                    <FileText size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                                        <Badge color="blue">{article.category}</Badge>
                                    </div>
                                    <h3 style={{
                                        fontSize: 'var(--text-lg)',
                                        fontWeight: 600,
                                        margin: 'var(--space-2) 0 var(--space-1)',
                                        color: 'var(--gray-900)'
                                    }}>
                                        {article.title}
                                    </h3>
                                    <p style={{
                                        fontSize: 'var(--text-sm)',
                                        color: 'var(--gray-500)',
                                        margin: 0
                                    }}>
                                        {article.description}
                                    </p>
                                </div>
                                <ChevronRight size={20} style={{ color: 'var(--gray-400)' }} />
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>
        </>
    )
}

export default Wiki
