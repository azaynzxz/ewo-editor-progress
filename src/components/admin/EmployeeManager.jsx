import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Loader2, Save, X, Eye, EyeOff } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwZpWsJEOFlOQkDA55JyjV1q6CkpO37VNbFi7bxrJsB2LeheFwSrDQHbm_oR5D1hl0TKQ/exec';

function EmployeeManager() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: new URLSearchParams({ action: 'getEmployees' })
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
                body: new URLSearchParams(payload)
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
                body: new URLSearchParams({ action: 'deleteEmployee', id })
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
        <div className="employee-manager">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <div>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--gray-900)' }}>Employee Directory</h2>
                    <p style={{ color: 'var(--gray-500)', fontSize: 'var(--text-sm)' }}>Manage team members, roles, and access credentials.</p>
                </div>
                <Button onClick={() => handleOpenModal()} style={{ gap: '8px' }}>
                    <Plus size={16} /> Add Employee
                </Button>
            </div>

            <Card>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--gray-200)', color: 'var(--gray-500)', fontSize: 'var(--text-xs)' }}>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>No</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>Name</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>Role</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>Status</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>Type</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>Contact Info</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {loading && employees.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                                            <Loader2 size={24} className="spin" style={{ color: 'var(--primary-600)', margin: '0 auto' }} />
                                        </td>
                                    </tr>
                                ) : (
                                    employees.map((emp) => (
                                        <motion.tr
                                            key={emp.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            style={{ borderBottom: '1px solid var(--gray-100)' }}
                                        >
                                            <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                                                {emp.no}
                                            </td>
                                            <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--gray-900)' }}>
                                                {emp.name}
                                            </td>
                                            <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
                                                {emp.role}
                                            </td>
                                            <td style={{ padding: 'var(--space-4)' }}>
                                                <Badge variant={emp.status === 'Active' ? 'success' : 'default'}>
                                                    {emp.status}
                                                </Badge>
                                            </td>
                                            <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
                                                {emp.type}
                                            </td>
                                            <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                                                {emp.email}
                                            </td>
                                            <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <Button
                                                        variant="ghost"
                                                        size="small"
                                                        onClick={() => handleOpenModal(emp)}
                                                        style={{ padding: '6px' }}
                                                    >
                                                        <Edit2 size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="small"
                                                        onClick={() => handleDelete(emp.id)}
                                                        style={{ padding: '6px', color: 'var(--danger-600)' }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                                {!loading && employees.length === 0 && (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--gray-500)' }}>
                                            No employees found.
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </Card>

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
