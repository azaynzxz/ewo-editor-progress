import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Loader2, Save, X, Eye, EyeOff, Shield, Search, Inbox } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';

const APPS_SCRIPT_URL = '/api/exec';

function EmployeeManager() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [formData, setFormData] = useState({
        name: '',
        role: 'Video Editor',
        status: 'Active',
        type: 'Full Time',
        joinDate: '',
        endProbation: '',
        email: '',
        password: ''
    });

    const roles = ['Video Editor', 'Admin', 'Illustrator', 'Ads Design'];
    const types = ['Full Time', 'Freelance'];
    const statuses = ['Active', 'Inactive'];

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(filterText.toLowerCase()) ||
            emp.role.toLowerCase().includes(filterText.toLowerCase()) ||
            emp.email.toLowerCase().includes(filterText.toLowerCase());
        const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        if (a.status === 'Active' && b.status !== 'Active') return -1;
        if (a.status !== 'Active' && b.status === 'Active') return 1;
        return (parseInt(a.no) || 0) - (parseInt(b.no) || 0); // Keep original order among equals
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'getEmployees' })
            });
            const result = await response.json();
            if (result.success) {
                setEmployees(result.data);
            } else {
                alert('Failed to load employees');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (employee = null) => {
        if (employee) {
            setEditingEmployee(employee);
            setFormData({
                name: employee.name || '',
                role: employee.role || 'Video Editor',
                status: employee.status || 'Active',
                type: employee.type || 'Full Time',
                joinDate: employee.joinDate || '',
                endProbation: employee.endProbation || '',
                email: employee.email || '',
                password: employee.password || ''
            });
        } else {
            setEditingEmployee(null);
            setFormData({
                name: '',
                role: 'Video Editor',
                status: 'Active',
                type: 'Full Time',
                joinDate: '',
                endProbation: '',
                email: '',
                password: ''
            });
        }
        setShowPassword(false);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const action = editingEmployee ? 'updateEmployee' : 'createEmployee';
        const payload = {
            action,
            name: formData.name,
            role: formData.role,
            status: formData.status,
            type: formData.type,
            joinDate: formData.joinDate,
            endProbation: formData.endProbation,
            email: formData.email,
            password: formData.password
        };

        if (editingEmployee) {
            payload.id = editingEmployee.id;
            payload.no = editingEmployee.no;
        }

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.success) {
                alert(`Employee ${editingEmployee ? 'updated' : 'added'} successfully`);
                setIsModalOpen(false);
                fetchEmployees();
            } else {
                alert(result.message || 'Failed to save');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Connection error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this employee?')) return;

        try {
            setEmployees(prev => prev.filter(emp => emp.id !== id)); // optimistically remove
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'deleteEmployee', id })
            });
            const result = await response.json();
            if (result.success) {
                alert('Employee deleted');
            } else {
                fetchEmployees(); // revert
                alert(result.message || 'Failed to delete');
            }
        } catch (error) {
            console.error('Error:', error);
            fetchEmployees(); // revert
            alert('Connection error');
        }
    };

    return (
        <div className="admin-panel">
            <div className="admin-panel-header">
                <h2><Shield size={18} /> Employee Directory</h2>
                <div className="admin-filters">
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                        <input
                            type="text"
                            className="admin-filter-input"
                            placeholder="Search name, role, email..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            style={{ paddingLeft: 30 }}
                        />
                    </div>
                    <select
                        className="admin-filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                    <Button onClick={() => handleOpenModal()} style={{ padding: '8px 16px', fontSize: '13px' }}>
                        Add Employee
                    </Button>
                </div>
            </div>

            <div className="admin-table-wrap">
                {loading && employees.length === 0 ? (
                    <div style={{ padding: 'var(--space-4)' }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="admin-skeleton-row">
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '5%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '20%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '10%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '10%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '10%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '10%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '10%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '15%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '10%' }} />
                            </div>
                        ))}
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="admin-empty">
                        <Inbox size={40} />
                        <p>{filterText || statusFilter !== 'All' ? "No employees match your search" : "No employees found"}</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>NO</th>
                                <th>NAME</th>
                                <th>ROLE</th>
                                <th>STATUS</th>
                                <th>TYPE</th>
                                <th>JOIN DATE</th>
                                <th>END PROBATION</th>
                                <th>CONTACT INFO</th>
                                <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((emp) => (
                                <tr key={emp.id}>
                                    <td style={{ color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>{emp.no}</td>
                                    <td style={{ fontWeight: 600 }}>{emp.name}</td>
                                    <td>
                                        <span className={`admin-role-pill ${emp.role === 'Video Editor' ? 've' : 'ill'}`}>
                                            {emp.role === 'Video Editor' ? 'VE' : emp.role === 'Illustrator' ? 'ILL' : emp.role}
                                        </span>
                                    </td>
                                    <td>
                                        <Badge color={emp.status === 'Active' ? 'success' : 'error'}>
                                            {emp.status}
                                        </Badge>
                                    </td>
                                    <td style={{ color: 'var(--gray-600)' }}>{emp.type}</td>
                                    <td style={{ color: 'var(--gray-500)' }}>{emp.joinDate || '—'}</td>
                                    <td style={{ color: 'var(--gray-500)' }}>{emp.endProbation || '—'}</td>
                                    <td style={{ color: 'var(--gray-500)' }}>{emp.email}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                                            <Button
                                                variant="ghost"
                                                size="small"
                                                onClick={() => handleOpenModal(emp)}
                                                style={{ padding: '6px' }}
                                                title="Edit"
                                            >
                                                <Edit2 size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="small"
                                                onClick={() => handleDelete(emp.id)}
                                                style={{ padding: '6px', color: 'var(--danger-600)' }}
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => !isSubmitting && setIsModalOpen(false)}
                title={editingEmployee ? "Edit Employee" : "Add Employee"}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Name *</label>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Email *</label>
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Role</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}
                            >
                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Type</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}
                            >
                                {types.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}
                            >
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Join Date</label>
                            <input
                                type="date"
                                value={formData.joinDate}
                                onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
                                style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-1)' }}>End Probation</label>
                            <input
                                type="date"
                                value={formData.endProbation}
                                onChange={e => setFormData({ ...formData, endProbation: e.target.value })}
                                style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Password *</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                required
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', paddingRight: '40px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--gray-500)',
                                    cursor: 'pointer'
                                }}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} style={{ gap: '8px' }}>
                            {isSubmitting ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                            Save Employee
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default EmployeeManager;
