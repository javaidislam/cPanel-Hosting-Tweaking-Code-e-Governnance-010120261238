
import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService.ts';
import { FileFolder } from './NoteSheetModule/types.ts';
import { Official } from '../types/shared.ts';
import { NoteSheetView } from './NoteSheetModule/components/NoteSheetView.tsx';
import CreateFileModal from './NoteSheetModule/components/modals/CreateFileModal.tsx';
import { FOLDERS, FolderId, checkFileAccess } from './NoteSheetModule/FolderConfig.ts';

export const NoteSheetModule: React.FC<{ currentUser: Official }> = ({ currentUser }) => {
  const [files, setFiles] = useState<FileFolder[]>([]);
  const [users, setUsers] = useState<Official[]>([]); // To resolve names
  const [selectedFile, setSelectedFile] = useState<FileFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFolder, setActiveFolder] = useState<FolderId>('Inbox');
  
  useEffect(() => {
    Promise.all([
        DataService.getFiles(),
        DataService.getUsers()
    ]).then(([fileData, userData]) => { 
        setFiles(fileData); 
        setUsers(userData);
        setLoading(false); 
    });
  }, []);

  const handleCreateFile = (newFile: FileFolder) => {
      DataService.createFile(newFile).then(() => {
          setFiles([newFile, ...files]);
          setShowCreateModal(false);
          setSelectedFile(newFile);
      });
  };

  const handleUpdateFile = (updatedFile: FileFolder) => {
      setFiles(prev => prev.map(f => f.id === updatedFile.id ? updatedFile : f));
      
      // Improved Logic: Deselect if ownership changes OR if status changes to Cold (while in Inbox/Returned)
      const ownershipChanged = updatedFile.currentOwnerId !== currentUser.id;
      const movedToCold = updatedFile.status === 'Cold' && activeFolder !== 'Cold';
      const movedToArchived = updatedFile.status === 'Archived' && activeFolder !== 'All';

      if ((activeFolder === 'Inbox' || activeFolder === 'Returned') && (ownershipChanged || movedToCold || movedToArchived)) {
          setSelectedFile(null); 
      } else {
          // Keep it open (e.g. saving drafts)
          setSelectedFile(updatedFile);
      }
  };

  // Filter Logic using centralized configuration
  const filteredFiles = files.filter(f => {
      const access = checkFileAccess(f, currentUser);
      const folderDef = FOLDERS.find(folder => folder.id === activeFolder);
      if (folderDef) {
          return folderDef.filter(f, access);
      }
      return false;
  });

  const getOwnerName = (id: string) => {
      const u = users.find(u => u.id === id);
      return u ? u.designation : 'Unknown Officer';
  };

  if (selectedFile) return <NoteSheetView file={selectedFile} onBack={() => setSelectedFile(null)} currentUser={currentUser} onUpdateFile={handleUpdateFile} forceViewOnly={selectedFile.currentOwnerId !== currentUser.id} />;

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
        <div className="w-64 bg-white border-r flex flex-col no-print">
            <div className="p-4 border-b">
                 <button onClick={() => setShowCreateModal(true)} className="w-full bg-gov-green text-white px-4 py-2.5 rounded shadow hover:bg-green-800 font-bold transition-colors"><i className="fas fa-plus mr-2"></i> New File</button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-1">
                {FOLDERS.map((folder) => {
                    // Check Permission
                    if (folder.minLevel && currentUser.level > folder.minLevel) return null;

                    // Calculate Badge Count
                    const count = folder.countFilter ? files.filter(f => folder.countFilter!(f, { isOwner: f.currentOwnerId === currentUser.id })).length : 0;
                    
                    return (
                        <React.Fragment key={folder.id}>
                            {folder.headerTitle && <div className="pt-4 pb-2 text-xs font-bold text-gray-400 uppercase">{folder.headerTitle}</div>}
                            {folder.isSeparatorBefore && <div className="border-t my-2"></div>}
                            
                            <button 
                                onClick={() => setActiveFolder(folder.id)} 
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg ${activeFolder === folder.id ? 'bg-green-100 text-gov-green' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <i className={`${folder.icon} w-6 ${folder.iconColorClass || ''}`}></i> 
                                {folder.label}
                                {count > 0 && (
                                    <span className={`ml-auto text-xs rounded-full px-2 py-0.5 ${folder.badgeColorClass || 'bg-gray-200 text-gray-600'}`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
            <h1 className="text-2xl font-serif font-bold text-gray-800 mb-6">{FOLDERS.find(f => f.id === activeFolder)?.label}</h1>
            {loading ? <div className="text-center py-20 text-gray-500">Loading...</div> : filteredFiles.length === 0 ? (<div className="text-center py-20 text-gray-400 bg-white rounded border border-dashed"><i className="fas fa-folder-open text-4xl mb-3"></i><p>No files found.</p></div>) : (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">File Number</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Subject</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th></tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredFiles.map((file) => (
                        <tr key={file.id} className="hover:bg-green-50 cursor-pointer" onClick={() => setSelectedFile(file)}>
                            <td className="px-6 py-4 text-sm font-medium text-gov-green">{file.fileNumber}</td>
                            <td className="px-6 py-4 text-sm text-gray-900"><div className="font-semibold truncate w-80">{file.subject}</div><div className="text-xs text-gray-500 truncate w-80">PUC: {file.puc.subject}</div></td>
                            <td className="px-6 py-4 text-xs text-gray-500">
                                {file.currentOwnerId === currentUser.id ? <span className="text-green-600 font-bold bg-green-100 px-2 py-1 rounded">My Desk</span> : <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">With: {getOwnerName(file.currentOwnerId)}</span>}
                                <div className="mt-1"><span className={`text-[10px] uppercase font-bold px-1 rounded ${ 
                                    file.status === 'Approved' ? 'text-green-700 bg-green-50' : 
                                    file.status === 'Rejected' ? 'text-red-700 bg-red-50' : 
                                    file.status === 'Returned' ? 'text-yellow-700 bg-yellow-50' : 
                                    file.status === 'Cold' ? 'text-blue-700 bg-blue-50' : 'text-gray-500' }`}>{file.status}</span></div>
                            </td>
                        </tr>))}
                    </tbody>
                </table>
            </div>)}
            {showCreateModal && <CreateFileModal onClose={() => setShowCreateModal(false)} onCreate={handleCreateFile} currentUser={currentUser} />}
        </div>
    </div>
  );
};
