
import React, { useState } from 'react';
import AttachmentToolbar from './AttachmentToolbar';

interface NoteInputSectionProps {
  onAddNote: (content: string) => Promise<void>;
  onSignAll: () => Promise<void>;
  onUnsignAll: () => Promise<void>;
  onOpenEditor: (type: string) => void;
  isSubmitting: boolean;
  hasUnsignedNotes: boolean;
  hasSignedNotes: boolean;
}

/**
 * NoteInputSection handles the active drafting area.
 * It provides separate actions for adding a paragraph (Add Note)
 * and finalizing the session (Sign Note).
 */
const NoteInputSection: React.FC<NoteInputSectionProps> = ({ 
  onAddNote, 
  onSignAll,
  onUnsignAll,
  onOpenEditor, 
  isSubmitting,
  hasUnsignedNotes,
  hasSignedNotes
}) => {
  const [newNote, setNewNote] = useState('');
  const [stagedAttachments, setStagedAttachments] = useState<string[]>([]);

  const handleStageAttachment = (html: string) => {
    setStagedAttachments(prev => [...prev, html]);
  };

  const removeStagedAttachment = (index: number) => {
    setStagedAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddAction = async () => {
    if (!newNote.trim() && stagedAttachments.length === 0) return;
    const finalContent = (newNote.replace(/\n/g, '<br/>') + ' ' + stagedAttachments.join(' ')).trim();
    await onAddNote(finalContent);
    setNewNote('');
    setStagedAttachments([]);
  };

  return (
    <div className="bg-white border-t p-4 shadow-lg no-print">
      {/* Attachment & Digital Word Processor Toolbar */}
      <AttachmentToolbar 
        onInsert={handleStageAttachment} 
        onOpenEditor={onOpenEditor} 
      />

      {/* Main Drafting Area */}
      <div className="relative mt-2">
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          disabled={hasSignedNotes} // Prevent adding more text if session is already signed
          className={`w-full border rounded p-4 font-serif text-lg leading-relaxed outline-none transition-all min-h-[100px] resize-y ${
            hasSignedNotes ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'focus:ring-2 focus:ring-gov-green/20'
          }`}
          placeholder={hasSignedNotes ? "Unsign to edit or add more notes..." : "Type your official minute here..."}
        />
        
        {stagedAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 px-1">
            {stagedAttachments.map((html, i) => (
              <div key={i} className="flex items-center bg-blue-50 border border-blue-100 px-2 py-1 rounded text-[10px] animate-fade-in shadow-sm">
                <span dangerouslySetInnerHTML={{ __html: html }} className="truncate max-w-[150px]" />
                {!hasSignedNotes && (
                    <button onClick={() => removeStagedAttachment(i)} className="ml-2 text-red-400 hover:text-red-600">
                        <i className="fas fa-times-circle"></i>
                    </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Actions: Add, Sign, Unsign */}
      <div className="flex justify-between items-center mt-3">
        <div className="flex space-x-2">
            {!hasSignedNotes ? (
                <button
                    onClick={handleAddAction}
                    disabled={isSubmitting || (!newNote.trim() && stagedAttachments.length === 0)}
                    className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-bold shadow hover:bg-blue-700 disabled:bg-gray-300 transition-all flex items-center"
                >
                    <i className="fas fa-plus mr-2"></i> Add Note
                </button>
            ) : (
                <div className="text-xs text-gov-green font-bold flex items-center bg-green-50 px-3 py-2 rounded border border-green-100">
                    <i className="fas fa-check-circle mr-2"></i> Session Electronically Signed
                </div>
            )}
        </div>

        <div className="flex space-x-2">
            {!hasSignedNotes ? (
                <button
                    onClick={onSignAll}
                    disabled={isSubmitting || !hasUnsignedNotes}
                    className={`px-8 py-2 rounded font-bold text-white shadow-md flex items-center transition-all transform active:scale-95 ${
                        isSubmitting || !hasUnsignedNotes ? 'bg-gray-400 cursor-not-allowed' : 'bg-gov-green hover:bg-green-800'
                    }`}
                >
                    <i className="fas fa-file-signature mr-2"></i> Sign Note
                </button>
            ) : (
                <button
                    onClick={onUnsignAll}
                    disabled={isSubmitting}
                    className="px-8 py-2 bg-red-50 text-red-700 border border-red-200 rounded font-bold text-sm shadow hover:bg-red-100 transition-all flex items-center"
                >
                    <i className="fas fa-undo mr-2"></i> Unsign Note
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default NoteInputSection;
