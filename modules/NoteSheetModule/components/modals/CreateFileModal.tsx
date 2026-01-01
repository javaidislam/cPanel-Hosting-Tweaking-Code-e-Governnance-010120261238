
import React, { useState, useEffect } from 'react';
import { DataService } from '../../../../services/dataService';
import { DepartmentService } from '../../../../services/DepartmentService';
import { AttachmentService } from '../../../../services/AttachmentService';
import { FileFolder, NoteParams } from '../../types';
import { Official, Department } from '../../../../types/shared';
import AttachmentToolbar from '../AttachmentToolbar';
import WordEditorModal from './WordEditorModal';
import { getDeptShortCode, linkifyPUC } from '../../utils';

const CreateFileModal: React.FC<{ onClose: () => void; onCreate: (file: FileFolder) => void; currentUser: Official }> = ({ onClose, onCreate, currentUser }) => {
  const [subject, setSubject] = useState('');
  const [initialNote, setInitialNote] = useState('');
  const [stagedAttachments, setStagedAttachments] = useState<string[]>([]);
  const [priority, setPriority] = useState<'Ordinary' | 'Urgent' | 'Immediate'>('Ordinary');
  const [deptId, setDeptId] = useState('');
  const [wpType, setWpType] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
      DepartmentService.getDepartments().then(data => {
          setDepartments(data);
          if (data.length > 0) setDeptId(data[0].id);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const attachmentsHtml = stagedAttachments.length > 0 ? stagedAttachments.join(' ') : '';
    
    // Correction 3: linkify PUC keywords
    const textContent = initialNote.replace(/\n/g, '<br/>');
    const linkifiedText = linkifyPUC(textContent);
    const finalContent = (linkifiedText + ' ' + attachmentsHtml).trim() || 'File initiated.';
    
    const draftIdMatch = finalContent.match(/data-draft-id="([^"]+)"/);
    const linkedAttachmentId = draftIdMatch ? draftIdMatch[1] : undefined;

    // Correction 2: Do not automatically sign or lock (isSigned: false, isLocked: false)
    const firstNote: NoteParams = {
        id: `note_${Date.now()}`,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorDesignation: currentUser.designation,
        content: finalContent,
        timestamp: new Date().toISOString(),
        isFinal: true,
        authorLevel: currentUser.level,
        attachmentId: linkedAttachmentId,
        isSigned: false, // Changed from true to false
        isLocked: false  // Ensure it's not locked
    };

    // Correction 1: SO(Wing)/DeptID/RandomID/Year
    const deptShort = getDeptShortCode(deptId);
    const wingPart = currentUser.wing || 'Admin';
    const fileNum = `SO(${wingPart})/${deptShort}/${Math.floor(100 + Math.random() * 899)}/${new Date().getFullYear()}`;

    const newFile: FileFolder = {
      id: `file_${Date.now()}`,
      fileNumber: fileNum,
      subject,
      departmentId: deptId,
      createdDate: new Date().toISOString(),
      priority,
      category: 'B',
      status: 'Active',
      currentOwnerId: currentUser.id,
      puc: {
        subject: 'Initiated Note Sheet',
        receivedFrom: currentUser.designation,
        date: new Date().toLocaleDateString(),
        content: 'No specific Paper Under Consideration (PUC) content provided.',
      },
      notes: [firstNote]
    };
    onCreate(newFile);
  };

  const handleStageAttachment = (html: string) => setStagedAttachments(prev => [...prev, html]);
  const removeStagedAttachment = (index: number) => setStagedAttachments(prev => prev.filter((_, i) => i !== index));

  const handleWpSave = async (html: string, lock: boolean, close: boolean) => {
      const fileName = `${wpType || 'Draft'}.html`;
      const blob = new Blob([html], { type: 'text/html' });
      const file = new File([blob], fileName, { type: 'text/html' });
      const attId = await AttachmentService.upload(file, html);
      
      const linkHtml = ` <a href="#" data-att-id="${attId}" data-draft-id="${attId}" class="attachment-link text-gov-green underline font-bold cursor-pointer" title="${fileName}">[Draft: ${fileName}]</a> `;
      
      handleStageAttachment(linkHtml);
      if (close) setWpType(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-sans">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h3 className="text-lg font-bold text-gov-green">Initiate New File</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <i className="fas fa-times fa-lg"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={deptId} onChange={e => setDeptId(e.target.value)} className="w-full border rounded p-2 outline-none">
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value as any)} className="w-full border rounded p-2 outline-none">
                    <option value="Ordinary">Ordinary</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Immediate">Immediate</option>
                </select>
              </div>
          </div>
          <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">File Subject</label>
              <input required type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full border rounded p-2 outline-none focus:ring-1 focus:ring-gov-green" placeholder="E.g., Administrative Approval for..." />
          </div>
          <div className="mb-2">
              <label className="block text-sm font-medium text-gov-green mb-1">Note Sheet (Para-1)</label>
              <div className="border rounded p-3 bg-white">
                  <AttachmentToolbar onInsert={handleStageAttachment} onOpenEditor={setWpType} />
                  <textarea required={stagedAttachments.length === 0} rows={8} value={initialNote} onChange={e => setInitialNote(e.target.value)} className="w-full border-t pt-2 outline-none font-serif text-lg leading-relaxed" placeholder="Draft your minute or attach specialized summaries..." />
                  {stagedAttachments.length > 0 && (
                        <div className="mt-3 space-y-2 border-t pt-2">
                            <div className="text-xs font-bold text-gray-500 uppercase flex items-center"><i className="fas fa-paperclip mr-2"></i>Attachments to be added:</div>
                            {stagedAttachments.map((html, i) => (
                                <div key={i} className="flex items-center justify-between bg-gray-50 border p-2 rounded shadow-sm">
                                    <div dangerouslySetInnerHTML={{__html: html}} className="text-sm overflow-hidden" />
                                    <button type="button" onClick={() => removeStagedAttachment(i)} className="text-red-500 hover:text-red-700 ml-3 px-2">
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                  )}
              </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
             <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
             <button type="submit" className="px-6 py-2 bg-gov-green text-white rounded hover:bg-green-800 shadow font-bold">Initiate File</button>
          </div>
        </form>
      </div>
      {wpType && <WordEditorModal type={wpType} currentUser={currentUser} isEditable={true} onClose={() => setWpType(null)} onSave={handleWpSave} />}
    </div>
  );
};

export default CreateFileModal;
