
import React, { useState, useEffect, useRef } from 'react';
import { DataService } from '../../../services/dataService';
import { AttachmentService } from '../../../services/AttachmentService';
import { FileFolder, NoteParams, EditHistoryItem } from '../types';
import { Official, DesignationLevel } from '../../../types/shared';
import { PrintSettingsModal, PrintConfig } from '../PrintModule';
import NoteInputSection from './NoteInputSection';
import WordEditorModal from './modals/WordEditorModal';
import RouteFileModal from './modals/RouteFileModal';
import { NoteSheetContainer, NoteBlock } from './NoteSheetLayout';
import { linkifyPUC } from '../utils';

export const NoteSheetView: React.FC<{ 
    file: FileFolder; 
    onBack: () => void; 
    currentUser: Official;
    onUpdateFile: (updatedFile: FileFolder) => void;
    forceViewOnly?: boolean;
}> = ({ file, onBack, currentUser, onUpdateFile, forceViewOnly }) => {
  const [notes, setNotes] = useState<NoteParams[]>(file.notes);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [wpConfig, setWpConfig] = useState<{ type: string; noteId: string; content: string; attachmentId?: string } | null>(null);
  
  const pucPanelRef = useRef<HTMLDivElement>(null);

  // Edit State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState('');

  const isApproved = file.status === 'Approved' || file.isApproved;
  const isEditable = !forceViewOnly && !isApproved && file.currentOwnerId === currentUser.id;

  // Session State Helpers
  const mySession_notes = notes.filter(n => n.authorId === currentUser.id && !n.isLocked);
  const hasUnsignedNotes = mySession_notes.some(n => !n.isSigned);
  const hasSignedNotes = mySession_notes.some(n => n.isSigned);

  // Global click listener for PUC links
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.getAttribute('data-puc-link') === 'true') {
            e.preventDefault();
            pucPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
            // Pulse the PUC panel
            pucPanelRef.current?.classList.add('ring-4', 'ring-blue-400', 'ring-opacity-50');
            setTimeout(() => {
                pucPanelRef.current?.classList.remove('ring-4', 'ring-blue-400', 'ring-opacity-50');
            }, 2000);
        }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleWpSave = async (html: string, lock: boolean, close: boolean, approved?: boolean) => {
      try {
        const fileName = `${wpConfig?.type || 'Draft'}.html`;
        const blob = new Blob([html], { type: 'text/html' });
        const fileObj = new File([blob], fileName, { type: 'text/html' });
        const attId = await AttachmentService.upload(fileObj, html, wpConfig?.attachmentId);

        const linkHtml = ` <a href="#" data-att-id="${attId}" data-draft-id="${attId}" class="attachment-link text-gov-green underline font-bold cursor-pointer" title="${fileName}">[Draft: ${fileName}]</a> `;

        let updatedFile = { ...file };
        const historyItem: EditHistoryItem = {
            id: Date.now().toString(),
            user: currentUser.name,
            designation: currentUser.designation,
            action: approved ? 'Finalized Draft' : 'Edited Draft',
            timestamp: new Date().toISOString()
        };
        
        updatedFile.editHistory = [...(file.editHistory || []), historyItem];

        if (wpConfig?.noteId !== 'NEW') {
            const updatedNotes = notes.map(n => {
                if (n.id === wpConfig?.noteId) {
                    const cleanedContent = n.content.replace(/<a[^>]+data-draft-id="[^"]+"[^>]*>.*?<\/a>/gs, '');
                    return { ...n, content: cleanedContent + linkHtml, attachmentId: attId, isLocked: lock || n.isLocked };
                }
                return n;
            });
            updatedFile.notes = updatedNotes;
        }

        if (approved) {
            updatedFile.status = 'Approved';
            updatedFile.isApproved = true;
            await DataService.archiveFinalPdf(file.id, html);
        }

        await DataService.updateFile(updatedFile);
        onUpdateFile(updatedFile);
        
        if (close) setWpConfig(null);
      } catch (e) {
          alert("Failed to save draft.");
      }
  };

  const handleRouteFile = async (targetId: string, remarks: string) => {
      try {
          const targetUser = await DataService.getUserById(targetId);
          if (!targetUser) {
              alert("Target user not found.");
              return;
          }

          const finalNotes = notes.map(n => {
              if (n.authorId === currentUser.id && !n.isLocked) {
                  return { ...n, isLocked: true };
              }
              return n;
          });

          const routingNote: NoteParams = {
              id: `routing_${Date.now()}`,
              authorId: currentUser.id,
              authorName: currentUser.name,
              authorDesignation: currentUser.designation,
              content: targetUser.designation, 
              timestamp: new Date().toISOString(),
              isFinal: true,
              isSigned: true,
              isLocked: true 
          };

          const updatedFile: FileFolder = {
              ...file,
              notes: [...finalNotes, routingNote],
              currentOwnerId: targetId,
          };

          await DataService.updateFile(updatedFile);
          onUpdateFile(updatedFile);
          setShowRouteModal(false);
          onBack(); 
      } catch (e) {
          alert("Failed to route file.");
      }
  };

  const handleAddNote = async (content: string) => {
    setSubmitting(true);
    try {
        // Correction 3: linkify PUC keywords on new manual notes
        const linkifiedContent = linkifyPUC(content);

        const note: NoteParams = {
            id: Date.now().toString(),
            authorId: currentUser.id,
            authorName: currentUser.name,
            authorDesignation: currentUser.designation,
            content: linkifiedContent,
            timestamp: new Date().toISOString(),
            isFinal: true,
            isSigned: false,
            isLocked: false
        };
        const updatedFile = { ...file, notes: [...notes, note] };
        await DataService.updateFile(updatedFile);
        onUpdateFile(updatedFile);
        setNotes(updatedFile.notes);
    } finally {
        setSubmitting(false);
    }
  };

  const handleSignSession = async () => {
      setSubmitting(true);
      try {
          const updatedNotes = notes.map(n => {
              if (n.authorId === currentUser.id && !n.isLocked) {
                  return { ...n, isSigned: true };
              }
              return n;
          });
          const updatedFile = { ...file, notes: updatedNotes };
          await DataService.updateFile(updatedFile);
          onUpdateFile(updatedFile);
          setNotes(updatedNotes);
      } finally {
          setSubmitting(false);
      }
  };

  const handleUnsignSession = async () => {
      setSubmitting(true);
      try {
          const updatedNotes = notes.map(n => {
              if (n.authorId === currentUser.id && !n.isLocked) {
                  return { ...n, isSigned: false };
              }
              return n;
          });
          const updatedFile = { ...file, notes: updatedNotes };
          await DataService.updateFile(updatedFile);
          onUpdateFile(updatedFile);
          setNotes(updatedNotes);
      } finally {
          setSubmitting(false);
      }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Delete this unsigned minute?")) return;
    const updatedNotes = notes.filter(n => n.id !== id);
    const updatedFile = { ...file, notes: updatedNotes };
    await DataService.updateFile(updatedFile);
    onUpdateFile(updatedFile);
    setNotes(updatedNotes);
  };

  const saveEdit = async (id: string) => {
    // Correction 3: linkify PUC keywords on edits
    const linkifiedContent = linkifyPUC(editBuffer.replace(/\n/g, '<br/>'));
    const updatedNotes = notes.map(n => {
        if (n.id === id) return { ...n, content: linkifiedContent };
        return n;
    });
    const updatedFile = { ...file, notes: updatedNotes };
    await DataService.updateFile(updatedFile);
    onUpdateFile(updatedFile);
    setNotes(updatedNotes);
    setEditingNoteId(null);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 font-sans relative">
        <div className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm z-20">
            <div className="flex items-center space-x-4">
                <button onClick={onBack} className="text-gray-500 hover:text-gov-green"><i className="fas fa-arrow-left fa-lg"></i></button>
                <div>
                    <h2 className="text-xl font-serif font-bold text-gray-800 leading-none">{file.fileNumber}</h2>
                    <div className="text-xs text-gray-500 mt-1">Status: {file.status.toUpperCase()}</div>
                </div>
            </div>
            <div className="flex space-x-2">
                 <button onClick={() => setShowPrintModal(true)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-semibold border"><i className="fas fa-print mr-1"></i> Print</button>
                 {isEditable && (
                    <button onClick={() => setShowRouteModal(true)} disabled={!hasSignedNotes} className={`px-4 py-1.5 rounded text-sm font-bold shadow transition-all ${!hasSignedNotes ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gov-green hover:bg-green-800 text-white'}`}>
                        <i className="fas fa-paper-plane mr-1"></i> Mark & Route
                    </button>
                 )}
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
            <div className="w-1/2 bg-white border-r flex flex-col overflow-y-auto p-6">
                <div ref={pucPanelRef} className="bg-yellow-50 p-6 rounded border border-yellow-200 shadow-sm font-serif text-lg leading-relaxed transition-all duration-500">
                    <h3 className="font-bold border-b border-yellow-200 pb-2 mb-4 uppercase text-sm tracking-wider">PUC Content</h3>
                    {file.puc.content}
                </div>
                <div className="mt-8 border-l-4 border-gov-gold pl-4">
                    <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-2">Marginal Hotlinks (Hashia)</h4>
                    {file.notes.filter(n => n.attachmentId).map(n => (
                        <div key={n.id} className="text-xs mb-1">
                             <a href="#" data-att-id={n.attachmentId} className="attachment-link text-gov-green font-bold hover:underline">
                                <i className="fas fa-link mr-1"></i> View Snapshot from {n.authorDesignation}
                             </a>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-1/2 flex flex-col bg-gray-50">
                 <NoteSheetContainer>
                     {notes.map((note, index) => {
                         const isMySessionNote = note.authorId === currentUser.id && !note.isLocked;
                         const isCurrentlyEditing = editingNoteId === note.id;

                         return (
                            <NoteBlock key={note.id} index={index} noteId={note.id} isLocked={note.isLocked}>
                                {isCurrentlyEditing ? (
                                    <div className="bg-white p-3 border-2 border-gov-green/30 rounded shadow-md">
                                        <textarea 
                                            value={editBuffer} 
                                            onChange={e => setEditBuffer(e.target.value)}
                                            className="w-full font-serif text-lg p-2 outline-none"
                                            rows={4}
                                        />
                                        <div className="flex justify-end space-x-2 mt-2 border-t pt-2">
                                            <button onClick={() => setEditingNoteId(null)} className="text-xs text-gray-500 font-bold px-3 py-1 hover:bg-gray-100 rounded">CANCEL</button>
                                            <button onClick={() => saveEdit(note.id)} className="text-xs font-bold text-white bg-gov-green px-4 py-1 rounded shadow">UPDATE</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div dangerouslySetInnerHTML={{ __html: note.content }} />
                                )}

                                <div className="mt-4 flex flex-wrap items-center justify-between border-t pt-3 border-gray-100">
                                    <div className="flex space-x-3 no-print">
                                        {/* Edit/Delete only for unsigned current session notes */}
                                        {isMySessionNote && !note.isSigned && !isCurrentlyEditing && (
                                            <>
                                                <button onClick={() => { setEditingNoteId(note.id); setEditBuffer(note.content.replace(/<br\s*\/?>/gi, '\n').replace(/<a[^>]+data-puc-link="true"[^>]*>(.*?)<\/a>/gi, '$1')); }} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase flex items-center">
                                                    <i className="fas fa-edit mr-1"></i> Edit
                                                </button>
                                                <button onClick={() => handleDeleteNote(note.id)} className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase flex items-center">
                                                    <i className="fas fa-trash-alt mr-1"></i> Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    
                                    <div className="text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            {note.isSigned && <i className="fas fa-check-circle text-gov-green text-xs" title="Electronically Signed"></i>}
                                            <div className={`font-bold uppercase text-[11px] ${note.isSigned ? 'text-gov-green' : 'text-gray-400'}`}>
                                                {note.authorName}
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-gray-600">{note.authorDesignation}</div>
                                        <div className="text-[9px] text-gray-400">{new Date(note.timestamp).toLocaleString()}</div>
                                    </div>
                                </div>
                            </NoteBlock>
                         );
                     })}
                 </NoteSheetContainer>

                 {isEditable && (
                     <NoteInputSection 
                        onAddNote={handleAddNote}
                        onSignAll={handleSignSession}
                        onUnsignAll={handleUnsignSession}
                        onOpenEditor={(type) => setWpConfig({ type, noteId: 'NEW', content: '' })}
                        isSubmitting={submitting}
                        hasUnsignedNotes={hasUnsignedNotes}
                        hasSignedNotes={hasSignedNotes}
                     />
                 )}
            </div>
        </div>

        {showRouteModal && <RouteFileModal onClose={() => setShowRouteModal(false)} onRoute={handleRouteFile} />}
        {showPrintModal && <PrintSettingsModal file={file} currentUser={currentUser} onClose={() => setShowPrintModal(false)} onPrint={() => {}} />}
        {wpConfig && <WordEditorModal type={wpConfig.type} initialContent={wpConfig.content} history={file.editHistory} currentUser={currentUser} isEditable={true} onClose={() => setWpConfig(null)} onSave={handleWpSave} />}
    </div>
  );
};
