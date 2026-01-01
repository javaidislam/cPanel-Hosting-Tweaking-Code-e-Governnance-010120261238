
import React, { useState, useEffect } from 'react';
import { UserManagementPanel } from './UserManagementModule';
import { Department, Official, Wing, Section, AttachedDepartment, Designation, Unit, Project, Loan } from '../types/shared';
import { DepartmentService } from '../services/DepartmentService';
import { DesignationService } from '../services/DesignationService';

export const SystemConfigModule: React.FC<{ currentUser: Official }> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'depts' | 'users' | 'designations'>('depts');
  const [depts, setDepts] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<{
      type: 'DEPT' | 'ATTACHED' | 'WING' | 'SECTION' | 'UNIT' | 'PROJECT' | 'LOAN';
      mode: 'ADD' | 'EDIT';
      parentId?: string;
      data: any;
  } | null>(null);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const refresh = async () => {
      setLoading(true);
      const [visibleDepts, des] = await Promise.all([
          DepartmentService.getVisibleDepartments(currentUser), 
          DesignationService.getDesignations()
      ]);
      setDepts(visibleDepts);
      setDesignations(des);
      setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  // Consistency Fix: Role-based authority
  const isGlobalAdmin = currentUser.roleId === 'ROLE_CS' || currentUser.roleId === 'ROLE_SEC_SERVICES';

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setBulkProcessing(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
          const text = event.target?.result as string;
          const rows = text.split('\n').map(r => r.split(','));
          const headers = rows[0].map(h => h.trim());
          const data = rows.slice(1).map(row => {
              const obj: any = {};
              headers.forEach((h, i) => obj[h] = row[i]);
              return obj;
          }).filter(o => o.Type);

          const results = await DepartmentService.bulkImport(currentUser, data);
          setBulkResults(results);
          setBulkProcessing(false);
          refresh();
      };
      reader.readAsText(file);
  };

  const handleSave = async () => {
      if (!editingItem) return;
      const { type, parentId, data } = editingItem;

      try {
          if (type === 'DEPT') {
              await DepartmentService.saveDepartment(data);
          } else {
              const manager = DepartmentService.getDepartmentManager(parentId!);
              if (type === 'WING') {
                  await manager.addWing({ ...data, id: '', sections: [] });
              } else if (type === 'UNIT') {
                  await manager.addUnit({ ...data, id: '', sections: [] });
              } else if (type === 'PROJECT') {
                  await manager.addProject({ ...data, id: '', budget: data.budget || 0, status: 'Ongoing', isActive: true, startDate: '', endDate: '' });
              } else if (type === 'LOAN') {
                  await manager.addLoan({ ...data, id: '', source: data.source || '', amount: 0, purpose: '', isActive: true });
              }
          }
          setEditingItem(null);
          refresh();
      } catch (err: any) {
          alert(err.message);
      }
  };

  return (
    <div className="p-8 h-full bg-gray-50 overflow-y-auto font-sans">
      <div className="flex justify-between items-center mb-8">
          <div>
              <h1 className="text-3xl font-serif font-bold text-gov-green uppercase tracking-tight">
                  {isGlobalAdmin ? 'Provincial Statutory Registry' : 'Departmental Control Panel'}
              </h1>
              <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest bg-white border inline-block px-2 py-0.5 rounded shadow-sm">
                  {isGlobalAdmin ? 'Provincial Administrator View' : `Assigned Scope: ${depts[0]?.name || 'Loading...'}`}
              </p>
          </div>
          <div className="flex bg-white p-1 rounded-lg border shadow-sm">
              <button onClick={() => setActiveTab('depts')} className={`px-4 py-2 rounded font-bold text-xs transition-all ${activeTab === 'depts' ? 'bg-gov-green text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>HIERARCHY</button>
              <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded font-bold text-xs transition-all ${activeTab === 'users' ? 'bg-gov-green text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>PERSONNEL</button>
              {isGlobalAdmin && <button onClick={() => setActiveTab('designations')} className={`px-4 py-2 rounded font-bold text-xs transition-all ${activeTab === 'designations' ? 'bg-gov-green text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>DESIGNATIONS</button>}
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border p-6 min-h-[600px]">
        {activeTab === 'depts' && (
            <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="font-bold text-gray-700 uppercase text-xs tracking-tighter">Organizational Tree</h2>
                    <div className="flex space-x-2">
                        <button onClick={() => setShowBulkModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-[10px] font-bold shadow hover:bg-blue-800 transition-colors uppercase">
                           <i className="fas fa-file-csv mr-2"></i> Bulk Operations
                        </button>
                        {isGlobalAdmin && (
                            <button onClick={() => setEditingItem({ type: 'DEPT', mode: 'ADD', data: { name: '', wings: [], units: [], attachedDepartments: [], projects: [], loans: [], isActive: true } })} className="bg-gov-green text-white px-4 py-2 rounded text-[10px] font-bold shadow hover:bg-green-800 transition-colors uppercase">
                                <i className="fas fa-plus mr-2"></i> Create Dept
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    {depts.map(dept => {
                        const isAuthorizedForInternal = DepartmentService.canModifyStructure(currentUser, 'WING', dept.id);
                        return (
                            <div key={dept.id} className="border rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer" onClick={() => setExpandedId(expandedId === dept.id ? null : dept.id)}>
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-10 h-10 ${isGlobalAdmin ? 'bg-gov-gold' : 'bg-gov-green'} rounded flex items-center justify-center text-white shadow-inner`}>
                                            <i className="fas fa-landmark text-lg"></i>
                                        </div>
                                        <div>
                                            <div className="font-bold text-gov-green uppercase text-xs tracking-wide">{dept.name}</div>
                                            <div className="text-[9px] text-gray-400 font-mono mt-0.5">{dept.id}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <i className={`fas fa-chevron-${expandedId === dept.id ? 'up' : 'down'} text-gray-400`}></i>
                                    </div>
                                </div>
                                {expandedId === dept.id && (
                                    <div className="p-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-down">
                                        <div className="space-y-6">
                                            <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="text-[10px] font-bold text-blue-800 uppercase tracking-widest">Wings & Administrative Units</h4>
                                                    {isAuthorizedForInternal && (
                                                        <div className="flex space-x-2">
                                                            <button onClick={() => setEditingItem({ type: 'WING', mode: 'ADD', parentId: dept.id, data: { name: '', isActive: true } })} className="text-[9px] bg-blue-600 text-white px-2 py-1 rounded font-bold shadow">+ WING</button>
                                                            <button onClick={() => setEditingItem({ type: 'UNIT', mode: 'ADD', parentId: dept.id, data: { name: '', isActive: true } })} className="text-[9px] bg-purple-600 text-white px-2 py-1 rounded font-bold shadow">+ UNIT</button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    {dept.wings.map(w => (
                                                        <div key={w.id} className="text-xs p-3 bg-white border rounded shadow-sm flex justify-between items-center group">
                                                            <span className="font-bold text-gray-700">{w.name}</span>
                                                            <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded">{w.sections.length} Sections</span>
                                                        </div>
                                                    ))}
                                                    {dept.units.map(u => (
                                                        <div key={u.id} className="text-xs p-3 bg-white border border-dashed rounded flex justify-between items-center">
                                                            <span className="font-bold text-purple-700">{u.name} (Unit)</span>
                                                            <i className="fas fa-microchip text-purple-200"></i>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="bg-green-50/30 p-4 rounded-lg border border-green-100">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="text-[10px] font-bold text-green-800 uppercase tracking-widest">Projects & Loans</h4>
                                                    {isAuthorizedForInternal && (
                                                        <div className="flex space-x-1">
                                                            <button onClick={() => setEditingItem({ type: 'PROJECT', mode: 'ADD', parentId: dept.id, data: { name: '', isActive: true } })} className="text-[9px] bg-green-700 text-white px-2 py-1 rounded font-bold shadow">+ PROJECT</button>
                                                            <button onClick={() => setEditingItem({ type: 'LOAN', mode: 'ADD', parentId: dept.id, data: { source: '', isActive: true } })} className="text-[9px] bg-yellow-600 text-white px-2 py-1 rounded font-bold shadow">+ LOAN</button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    {dept.projects?.map(p => (
                                                        <div key={p.id} className="text-xs p-3 bg-white border border-green-200 rounded flex justify-between items-center shadow-sm">
                                                            <div className="font-bold text-green-900">{p.name}</div>
                                                        </div>
                                                    ))}
                                                    {dept.loans?.map(l => (
                                                        <div key={l.id} className="text-xs p-3 bg-white border border-yellow-200 rounded flex justify-between items-center shadow-sm">
                                                            <div className="font-bold text-yellow-900">{l.source}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )}

        {activeTab === 'users' && <UserManagementPanel currentUser={currentUser} />}
      </div>

      {showBulkModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[210]">
              <div className="bg-white rounded-2xl shadow-2xl p-8 w-[600px] border">
                  <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <h3 className="font-bold text-blue-700 uppercase tracking-tighter text-xl">Bulk Operations Suite</h3>
                    <button onClick={() => { setShowBulkModal(false); setBulkResults(null); }} className="text-gray-300 hover:text-red-500 transition-colors"><i className="fas fa-times fa-lg"></i></button>
                  </div>
                  
                  {!bulkResults ? (
                      <div className="space-y-6">
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                              <h4 className="font-bold text-blue-800 text-xs uppercase mb-2">CSV Upload Specifications</h4>
                              <p className="text-[10px] text-gray-600 leading-relaxed">
                                  Column Headers: <code className="bg-white px-1 border">Type, Name, ParentId, EntryIndex</code><br/>
                                  Types: <code className="bg-white px-1 border">DEPT, WING, UNIT, PROJECT, LOAN, ATTACHED</code><br/>
                                  <span className="text-red-600 font-bold mt-2 block">Note: Secretaries can only import for Parent IDs belonging to their own department.</span>
                              </p>
                          </div>
                          
                          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-10 hover:border-blue-400 transition-colors group cursor-pointer relative">
                                {bulkProcessing ? (
                                    <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                                ) : (
                                    <>
                                        <i className="fas fa-cloud-upload-alt text-4xl text-gray-300 group-hover:text-blue-500 transition-colors mb-4"></i>
                                        <p className="text-xs font-bold text-gray-400 uppercase group-hover:text-blue-600">Click or Drag CSV File</p>
                                        <input type="file" accept=".csv" onChange={handleCsvUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </>
                                )}
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-6 animate-fade-in">
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-green-50 p-4 rounded border border-green-200 text-center">
                                  <div className="text-2xl font-bold text-green-700">{bulkResults.success}</div>
                                  <div className="text-[10px] font-bold text-green-600 uppercase">Records Successful</div>
                              </div>
                              <div className="bg-red-50 p-4 rounded border border-red-200 text-center">
                                  <div className="text-2xl font-bold text-red-700">{bulkResults.failed}</div>
                                  <div className="text-[10px] font-bold text-red-600 uppercase">Records Rejected</div>
                              </div>
                          </div>
                          
                          {bulkResults.errors.length > 0 && (
                              <div className="max-h-40 overflow-y-auto border rounded p-3 bg-gray-50 text-[10px] font-mono text-red-600">
                                  {bulkResults.errors.map((e, i) => <div key={i} className="mb-1">{e}</div>)}
                              </div>
                          )}
                          
                          <button onClick={() => { setBulkResults(null); refresh(); }} className="w-full py-3 bg-gray-800 text-white rounded-lg font-bold text-xs uppercase shadow-lg">Process Another Batch</button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {editingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200]">
              <div className="bg-white rounded-2xl shadow-2xl p-8 w-[500px] border border-gray-100">
                  <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <h3 className="font-bold text-gov-green uppercase tracking-tighter text-xl">
                        Establish {editingItem.type}
                    </h3>
                    <button onClick={() => setEditingItem(null)} className="text-gray-300 hover:text-red-500 transition-colors"><i className="fas fa-times fa-lg"></i></button>
                  </div>
                  
                  <div className="space-y-6">
                      <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Nomenclature</label>
                          <input type="text" className="w-full border-2 rounded-lg p-3 text-sm focus:border-gov-green outline-none bg-gray-50" placeholder="Title..." value={editingItem.data.name || editingItem.data.source || ''} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value, source: e.target.value } })} />
                      </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
                      <button onClick={() => setEditingItem(null)} className="px-6 py-2 text-gray-500 font-bold hover:text-red-600">Cancel</button>
                      <button onClick={handleSave} className="px-8 py-2 bg-gov-green text-white rounded-lg font-bold shadow-lg hover:bg-green-800 transform active:scale-95 transition-all uppercase text-xs">Commit Entry</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
