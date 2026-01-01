
import React, { useState, useEffect } from 'react';
import { Official, DesignationLevel, SystemRole, OfficialStatus, Department, Designation } from '../types/shared';
import { DataService } from '../services/dataService';
import { DepartmentService } from '../services/DepartmentService';
import { DesignationService } from '../services/DesignationService';

const LevelBadge: React.FC<{ level: number }> = ({ level }) => {
    let colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
    if (level <= 2) colorClass = 'bg-purple-100 text-purple-800 border-purple-200';
    else if (level <= 4) colorClass = 'bg-red-100 text-red-800 border-red-200';
    else if (level <= 5) colorClass = 'bg-green-100 text-green-800 border-green-200';
    
    let bs = 17;
    if (level === 1) bs = 22; else if (level === 2) bs = 21; else if (level === 3) bs = 20;
    else if (level === 4) bs = 19; else if (level === 5) bs = 17; else if (level === 6) bs = 17;
    else if (level === 7) bs = 16; else bs = 14;

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest ${colorClass}`}>
            BS-{bs}
        </span>
    );
};

const UserProfileModal: React.FC<{ 
    user?: Official | null; 
    roles: SystemRole[];
    currentUser: Official;
    onClose: () => void; 
    onSave: (u: Official) => void 
}> = ({ user, roles, currentUser, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState<'basic' | 'service'>('basic');
    const [departments, setDepartments] = useState<Department[]>([]);
    const [designations, setDesignations] = useState<Designation[]>([]);
    
    // Consistency Fix: Role-based authority
    const isGlobalAdmin = currentUser.roleId === 'ROLE_CS' || currentUser.roleId === 'ROLE_SEC_SERVICES';

    useEffect(() => {
        DepartmentService.getVisibleDepartments(currentUser).then(setDepartments);
        DesignationService.getDesignations().then(setDesignations);
    }, [currentUser]);

    const [formData, setFormData] = useState<Official>({
        id: `usr_${Date.now()}`,
        cnic: '',
        roleId: roles[0]?.id || '',
        name: '',
        designation: roles[0]?.title || '',
        level: DesignationLevel.SECTION_OFFICER,
        departmentId: user?.departmentId || currentUser.departmentId,
        wing: '',
        status: 'Active',
        serviceName: 'General Cadre',
        isCadre: true,
    });

    useEffect(() => {
        if (user) setFormData(user);
    }, [user]);

    const handleDesignationChange = (title: string) => {
        const des = designations.find(d => d.title === title);
        if (des) {
            setFormData({ ...formData, designation: des.title, level: des.level });
        } else {
            setFormData({ ...formData, designation: title });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[250] font-sans">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gov-green uppercase tracking-tighter">{user ? 'Personnel Record Update' : 'New Officer Registration'}</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Authorized HR Transaction</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors"><i className="fas fa-times fa-lg"></i></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Full Name (Per CNIC)</label>
                            <input required type="text" className="w-full border-2 rounded-lg p-3 text-sm focus:border-gov-green outline-none transition-colors shadow-inner bg-gray-50" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">CNIC Number</label>
                            <input required type="text" placeholder="42201-XXXXXXX-X" className="w-full border-2 rounded-lg p-3 text-sm font-mono focus:border-gov-green outline-none bg-gray-50" value={formData.cnic} onChange={e => setFormData({...formData, cnic: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Posting/Designation</label>
                            <select className="w-full border-2 rounded-lg p-3 text-sm focus:border-gov-green outline-none bg-gray-50" value={formData.designation} onChange={e => handleDesignationChange(e.target.value)}>
                                <option value="">Select Appointment</option>
                                {designations.map(des => <option key={des.id} value={des.title}>{des.title} (BS-{des.bps})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Assigned Department</label>
                            <select disabled={!isGlobalAdmin} className={`w-full border-2 rounded-lg p-3 text-sm focus:border-gov-green outline-none ${!isGlobalAdmin ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-50'}`} value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Service Status</label>
                            <select className="w-full border-2 rounded-lg p-3 text-sm focus:border-gov-green outline-none bg-gray-50" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as OfficialStatus})}>
                                <option value="Active">Active Duty</option>
                                <option value="OnLeave">Ex-Pakistan/Maternity Leave</option>
                                <option value="Suspended">Under Suspension (Rule 5)</option>
                                <option value="Retired">Retired / SOS</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t mt-8">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-gray-500 font-bold hover:text-red-600 transition-colors uppercase text-xs">Cancel</button>
                        <button type="submit" className="px-8 py-2 bg-gov-green text-white rounded-lg font-bold shadow-lg hover:bg-green-800 transition-all uppercase text-xs tracking-widest">
                            Commit to Personnel Registry
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const UserManagementPanel: React.FC<{ currentUser: Official }> = ({ currentUser }) => {
    const [users, setUsers] = useState<Official[]>([]);
    const [roles, setRoles] = useState<SystemRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<Official | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    // Consistency Fix: Role-based authority
    const isGlobalAdmin = currentUser.roleId === 'ROLE_CS' || currentUser.roleId === 'ROLE_SEC_SERVICES';

    const refreshData = async () => {
        setLoading(true);
        const [u, r] = await Promise.all([DataService.getVisibleUsers(currentUser), DataService.getRoles()]);
        setUsers(u);
        setRoles(r);
        setLoading(false);
    };

    useEffect(() => { refreshData(); }, [currentUser]);

    const handleUserSave = async (user: Official) => {
        await DataService.saveUser(user);
        setIsUserModalOpen(false);
        refreshData();
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="font-bold text-gray-800 uppercase text-xs tracking-tighter">
                        {isGlobalAdmin ? 'Secretariat-Wide HR Repository' : 'Departmental Personnel Manager'}
                    </h2>
                </div>
                <div className="flex space-x-3">
                    <div className="relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input type="text" className="border rounded pl-9 pr-3 py-2 text-xs outline-none focus:ring-1 focus:ring-gov-green bg-white shadow-inner" placeholder="Search CNIC or Name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }} className="px-4 py-2 bg-gov-green text-white rounded shadow text-[10px] font-bold hover:bg-green-800 transition-colors uppercase tracking-widest">
                        <i className="fas fa-plus mr-2"></i> Register New Officer
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto border rounded-xl bg-white shadow-inner">
                {loading ? (
                    <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-green"></div></div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Full Profile</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Appointment & Grade</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.cnic.includes(searchTerm)).map(user => (
                                <tr key={user.id} className="hover:bg-green-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-sm text-gray-900">{user.name}</div>
                                        <div className="text-[10px] text-gray-400 font-mono mt-1 tracking-tighter">{user.cnic}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-gov-green uppercase">{user.designation}</div>
                                        <div className="mt-1.5"><LevelBadge level={user.level} /></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                                            user.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                        }`}>{user.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }} className="text-gov-green hover:text-green-900 font-bold text-[10px] uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded border hover:bg-white transition-all">
                                            Manage Profile
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            
            {isUserModalOpen && <UserProfileModal user={editingUser} roles={roles} currentUser={currentUser} onClose={() => setIsUserModalOpen(false)} onSave={handleUserSave} />}
        </div>
    );
};
