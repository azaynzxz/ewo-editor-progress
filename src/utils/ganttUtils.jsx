import React from 'react';

export const ROW_COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#0ea5e9', // sky
    '#14b8a6', // teal
    '#f43f5e', // rose
];

export const STATUS_COLORS = {
    'done': '#10b981',
    'on hold': '#f59e0b',
    'under review': '#8b5cf6',
    'revision needed': '#ef4444',
};

// Generate a consistent color based on a string (like project name) so it stays the same across views
export function getConsistentColor(str, fallbackIndex = 0) {
    if (!str) return ROW_COLORS[fallbackIndex % ROW_COLORS.length];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % ROW_COLORS.length;
    return ROW_COLORS[index];
}

export function getTaskColor(projectStatus, risk, projectName, fallbackIndex) {
    const statusLower = (projectStatus || '').toLowerCase();
    if (STATUS_COLORS[statusLower]) {
        return STATUS_COLORS[statusLower];
    }
    if ((risk || '').includes('High')) {
        return '#ef4444'; // Red for high risk
    }
    return getConsistentColor(projectName, fallbackIndex);
}

export const CustomTaskListHeader = ({ headerHeight, fontFamily, fontSize }) => {
    return (
        <div style={{ height: headerHeight, fontFamily, fontSize, display: 'flex', alignItems: 'center', paddingLeft: '16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#4b5563', background: '#f9fafb', borderRight: '1px solid #e5e7eb' }}>
            Project Name
        </div>
    );
};

export const CustomTaskListTable = ({ rowHeight, rowWidth, tasks, fontFamily, fontSize }) => {
    return (
        <div style={{ borderRight: '1px solid #e5e7eb' }}>
            {tasks.map(t => {
                if (t.id === 'today-bounds-fix') return null;
                return (
                    <div 
                        key={t.id} 
                        style={{ 
                            height: rowHeight, 
                            width: rowWidth, 
                            fontFamily, 
                            fontSize: '12px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            paddingLeft: '16px', 
                            paddingRight: '8px', 
                            borderBottom: '1px solid #e5e7eb', 
                            color: '#1f2937',
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                            lineHeight: '1.3'
                        }} 
                        title={t.projectName}
                    >
                        <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {t.projectName}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export const CustomTooltip = ({ task, fontSize, fontFamily }) => {
    return (
        <div style={{ backgroundColor: 'white', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', minWidth: '180px', zIndex: 10000 }}>
            <b style={{ fontSize: '14px', fontFamily, color: '#111827' }}>{task.projectName}</b>
            <div style={{ fontSize: '12px', fontFamily, color: '#6b7280', marginTop: '4px' }}>
                {task.start.toLocaleDateString()} - {task.end.toLocaleDateString()}
            </div>
        </div>
    )
};
