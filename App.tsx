
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { NoteSheetModule } from './modules/NoteSheetModule.tsx';
import { AssetModule } from './modules/AssetModule.tsx';
import { SystemConfigModule } from './modules/SystemConfigModule.tsx';
import { Official, Department } from './types/shared.ts';
// Import StorageMode from DataService to fix type mismatch
import { DataService, StorageMode } from './services/dataService.ts';
import { DepartmentService } from './services/DepartmentService.ts';

const LoginScreen: React.FC<{ onLogin: (user: Official) => void }> = ({ onLogin }) => {
    const [users, setUsers] = useState<Official[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDeptId, setSelectedDeptId] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [statusInfo, setStatusInfo] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [mounting, setMounting] = useState(false);
    // Updated type to StorageMode to align with DataService.mountDrive return type which includes 'unmounted'
    const [storageMode, setStorageMode] = useState<StorageMode | null>(null);

    const handleMount = async () => {
        setMounting(true);
        setError('');
        setStatusInfo(null);
        
        const result = await DataService.mountDrive();
        
        if (result.success) {
            // Fix: result.mode is of type StorageMode ('physical' | 'virtual' | 'unmounted')
            setStorageMode(result.mode);
            if (result.error) setStatusInfo(result.error);

            const [userData, deptData] = await Promise.all([
                DataService.getUsers(),
                DepartmentService.getDepartments()
            ]);
            
            setUsers(userData);
            setDepartments(deptData);
            setIsMounted(true);

            // Default selection
            const sgaDept = deptData.find(d => d.id.includes('33')) || deptData[0];
            if (sgaDept) {
                setSelectedDeptId(sgaDept.id);
                const deptUsers = userData.filter(u => u.departmentId === sgaDept.id);
                if (deptUsers.length > 0) setSelectedUserId(deptUsers[0].id);
            }
        } else {
            setError(result.error || "Failed to initialize storage.");
        }
        setMounting(false);
    };

    const handleDeptChange = (deptId: string) => {
        setSelectedDeptId(deptId);
        const filtered = users.filter(u => u.departmentId === deptId);
        if (filtered.length > 0) setSelectedUserId(filtered[0].id);
        else setSelectedUserId('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '123-Abc-@') {
            const user = users.find(u => u.id === selectedUserId);
            if (user) onLogin(user);
            else setError('User profile missing in directory.');
        } else {
            setError('Invalid Password. Hint: 123-Abc-@');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="w-20 h-20 bg-gov-green rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-2 border-white">
                    <i className="fas fa-star-and-crescent text-white text-4xl"></i>
                </div>
                <h2 className="text-center text-3xl font-extrabold text-gray-900 font-serif tracking-tight">Govt. of Province</h2>
                <p className="mt-1 text-center text-sm text-gray-600 font-medium italic">Schedule-I Statutory ERP Engine</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border-t-4 border-gov-green relative">
                    
                    {!isMounted ? (
                        <div className="text-center py-10">
                            <i className="fas fa-database text-5xl text-gray-300 mb-4 block"></i>
                            <h3 className="font-bold text-gray-700 mb-2">Storage Path Locked</h3>
                            <p className="text-xs text-gray-500 mb-6">Connect to <strong>E:\User_Data</strong> or initialize Virtual Secure Storage to proceed.</p>
                            
                            {error && (
                                <div className="mb-4 text-red-600 text-[10px] font-bold bg-red-50 p-3 rounded border border-red-100 leading-tight">
                                    <i className="fas fa-exclamation-triangle mr-1"></i> {error}
                                </div>
                            )}

                            <button 
                                onClick={handleMount}
                                disabled={mounting}
                                className="w-full bg-blue-600 text-white py-3 rounded-md font-bold text-sm shadow hover:bg-blue-800 transition-all uppercase tracking-widest disabled:bg-gray-400"
                            >
                                {mounting ? 'Accessing Drive...' : 'Mount Physical / Virtual Drive'}
                            </button>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                             <div className={`absolute -top-3 right-4 px-2 py-0.5 border rounded-full text-[9px] font-bold flex items-center shadow-sm ${
                                storageMode === 'physical' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                             }`}>
                                <i className={`fas ${storageMode === 'physical' ? 'fa-check-circle' : 'fa-info-circle'} mr-1`}></i> 
                                {storageMode === 'physical' ? 'E:\\User_Data MOUNTED' : 'VIRTUAL SECURE DRIVE ACTIVE'}
                            </div>

                            {statusInfo && (
                                <div className="bg-blue-50 p-2.5 rounded border border-blue-100 text-[10px] text-blue-700 font-medium leading-tight">
                                    <i className="fas fa-shield-alt mr-1"></i> {statusInfo}
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Select Department (Schedule I)</label>
                                <select 
                                    required
                                    value={selectedDeptId}
                                    onChange={e => handleDeptChange(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2.5 text-sm border-gray-300 focus:ring-gov-green focus:border-gov-green rounded-md border bg-gray-50 font-medium"
                                >
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Authorized Official</label>
                                <select 
                                    required
                                    value={selectedUserId}
                                    onChange={e => setSelectedUserId(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2.5 text-sm border-gray-300 focus:ring-gov-green focus:border-gov-green rounded-md border bg-gray-50 font-medium"
                                >
                                    {users.filter(u => u.departmentId === selectedDeptId).map(user => (
                                        <option key={user.id} value={user.id}>{user.designation} - {user.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Security PIN</label>
                                <input 
                                    type="password" 
                                    required 
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-inner placeholder-gray-400 focus:ring-gov-green focus:border-gov-green sm:text-sm font-mono"
                                    placeholder="••••••••"
                                />
                            </div>

                            {error && <div className="text-red-700 text-xs bg-red-50 p-2.5 rounded border border-red-200 font-bold">{error}</div>}

                            <button 
                                type="submit" 
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-xl text-xs font-bold text-white bg-gov-green hover:bg-green-800 uppercase tracking-widest"
                            >
                                Establish Secure Session
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC<{ currentUser: Official }> = ({ currentUser }) => (
    <div className="p-8">
        <h1 className="text-3xl font-serif font-bold text-gov-green mb-6">Welcome, {currentUser.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                <div className="text-gray-500 text-sm font-bold uppercase">Immediate Files</div>
                <div className="text-3xl font-bold mt-2">12</div>
            </div>
             <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-gov-gold">
                <div className="text-gray-500 text-sm font-bold uppercase">Pending Drafts</div>
                <div className="text-3xl font-bold mt-2">5</div>
            </div>
             <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-gov-green">
                <div className="text-gray-500 text-sm font-bold uppercase">Processed (Month)</div>
                <div className="text-3xl font-bold mt-2">148</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                <div className="text-gray-500 text-sm font-bold uppercase">Total Assets</div>
                <div className="text-3xl font-bold mt-2">4,203</div>
            </div>
        </div>
    </div>
);

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<Official | null>(null);

  const handleLogin = (user: Official) => {
      setCurrentUser(user);
      setCurrentModule('dashboard');
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setCurrentModule('dashboard');
  };

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  const renderModule = () => {
    switch (currentModule) {
      case 'dashboard': return <Dashboard currentUser={currentUser} />;
      case 'notesheet': return <NoteSheetModule currentUser={currentUser} />;
      case 'assets': return <AssetModule />;
      case 'config': return <SystemConfigModule currentUser={currentUser} />;
      default: return <Dashboard currentUser={currentUser} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900">
      <Sidebar currentModule={currentModule} onChangeModule={setCurrentModule} currentUser={currentUser} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
        <header className="bg-white h-16 shadow-sm border-b flex justify-between items-center px-8 z-40">
            <div className="font-serif italic text-gray-500 text-lg hidden md:block">"Service to the people is the highest form of worship"</div>
            <div className="flex items-center space-x-3">
                <div className="text-right">
                    <div className="text-sm font-bold text-gray-800">{currentUser.name}</div>
                    <div className="text-xs text-gray-500">{currentUser.designation}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-gov-green font-bold text-lg">{currentUser.name.charAt(0)}</div>
            </div>
        </header>
        <main className="flex-1 overflow-hidden relative">{renderModule()}</main>
      </div>
    </div>
  );
};

export default App;
