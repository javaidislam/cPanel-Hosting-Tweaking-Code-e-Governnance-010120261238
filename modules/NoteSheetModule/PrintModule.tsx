
import React, { useState, useEffect } from 'react';
import { Official } from '../../types/shared';
import { FileFolder } from './types';

// --- Types ---
export interface PrintConfig {
    includePuc: boolean;
    selectedNoteIds: string[];
}

// --- Components ---

export const PrintSettingsModal: React.FC<{ 
    file: FileFolder; 
    currentUser: Official;
    onClose: () => void; 
    onPrint: (config: PrintConfig) => void;
}> = ({ file, currentUser, onClose, onPrint }) => {
    const [includePuc, setIncludePuc] = useState(true);
    // Default to all notes selected
    const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set(file.notes.map(n => n.id)));

    const toggleNote = (id: string) => {
        const newSet = new Set(selectedNoteIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedNoteIds(newSet);
    };

    const toggleAllNotes = (checked: boolean) => {
        if (checked) setSelectedNoteIds(new Set(file.notes.map(n => n.id)));
        else setSelectedNoteIds(new Set());
    };

    const handlePrintClick = () => {
        onPrint({ 
            includePuc, 
            selectedNoteIds: Array.from(selectedNoteIds) 
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] font-sans no-print">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gov-green flex items-center">
                        <i className="fas fa-print mr-2"></i>Select Content to Print
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    {/* PUC Section */}
                    <div className="mb-6 bg-blue-50 p-4 rounded border border-blue-100">
                        <label className="flex items-start cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={includePuc} 
                                onChange={e => setIncludePuc(e.target.checked)}
                                className="mt-1 h-5 w-5 text-gov-green rounded focus:ring-gov-green"
                            />
                            <div className="ml-3">
                                <span className="block font-bold text-gray-800">Paper Under Consideration (PUC)</span>
                                <span className="block text-sm text-gray-600 italic">{file.puc.subject}</span>
                            </div>
                        </label>
                    </div>

                    {/* Notes Section */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-gray-700">Note Sheet Paragraphs</h4>
                            <label className="text-sm flex items-center space-x-2 cursor-pointer text-gray-600 hover:text-gov-green">
                                <input 
                                    type="checkbox" 
                                    checked={selectedNoteIds.size === file.notes.length}
                                    onChange={e => toggleAllNotes(e.target.checked)}
                                    className="rounded text-gov-green focus:ring-gov-green"
                                />
                                <span>Select All</span>
                            </label>
                        </div>

                        <div className="space-y-2 border rounded-lg p-2 max-h-60 overflow-y-auto bg-gray-50">
                            {file.notes.map((note, index) => {
                                // Strip HTML for preview
                                const preview = note.content.replace(/<[^>]+>/g, '').substring(0, 80) + '...';
                                return (
                                    <label key={note.id} className="flex items-center p-3 bg-white border rounded hover:bg-green-50 cursor-pointer transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedNoteIds.has(note.id)} 
                                            onChange={() => toggleNote(note.id)}
                                            className="h-5 w-5 text-gov-green rounded focus:ring-gov-green border-gray-300"
                                        />
                                        <div className="ml-4 flex-1">
                                            <div className="flex justify-between">
                                                <span className="font-bold text-sm text-gray-800">Para {index + 1}</span>
                                                <span className="text-xs text-gray-500">{note.authorDesignation}</span>
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">{preview}</div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-6 bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-200">
                        <i className="fas fa-info-circle mr-1"></i>
                        Note: Attachments linked inside notes/PUC will be printed as hyperlinks. To print attachment contents, please open them individually.
                    </div>
                </div>

                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 font-medium text-sm">Cancel</button>
                    <button onClick={handlePrintClick} className="px-4 py-2 bg-gov-green text-white rounded hover:bg-green-800 shadow-sm font-bold text-sm flex items-center">
                        <i className="fas fa-print mr-2"></i> Print Selected
                    </button>
                </div>
            </div>
        </div>
    );
};

export const PrintWatermark: React.FC<{ currentUser: Official }> = ({ currentUser }) => (
    <div className="print-watermark hidden">
        {currentUser.designation}<br/>
        {currentUser.wing || 'Secretariat'}<br/>
        GOVERNMENT OF PROVINCE
    </div>
);

export const PrintFooter: React.FC<{ currentUser: Official }> = ({ currentUser }) => (
    <div className="print-footer hidden flex justify-between">
        <span>Printed by: {currentUser.name} ({currentUser.id})</span>
        <span>{new Date().toLocaleString()}</span>
    </div>
);

export const PrintStyles = () => (
    <style>{`
        @media print {
            @page { size: A4; margin: 1.5cm; }
            body { background: white; -webkit-print-color-adjust: exact; }
            body * { visibility: hidden; }
            
            #printable-area, #printable-area * { visibility: visible; }
            #printable-area { 
                position: absolute; 
                left: 0; 
                top: 0; 
                width: 100%; 
                height: auto; 
                overflow: visible !important; 
                display: block !important; 
                background-color: transparent !important;
            }

            .no-print, .editor-area, .top-bar, .sidebar { display: none !important; }
            
            /* Dynamic Print Utilities */
            .print-hidden { display: none !important; }
            
            /* Ensure background colors for notes don't hide watermark */
            .bg-gov-paper, .bg-white, .bg-gray-50, .bg-gray-100 { 
                background-color: transparent !important; 
            }

            .print-watermark { 
                display: block !important; 
                position: fixed; 
                top: 50%; 
                left: 50%; 
                transform: translate(-50%, -50%) rotate(-45deg); 
                font-size: 3rem; 
                font-weight: bold; 
                color: rgba(0, 0, 0, 0.08); 
                z-index: -1; 
                pointer-events: none; 
                white-space: nowrap; 
                text-align: center; 
                line-height: 1.5;
            }
            
            .print-footer { 
                display: flex !important; 
                position: fixed; 
                bottom: 0; 
                left: 0; 
                width: 100%; 
                font-size: 9px; 
                color: #666; 
                border-top: 1px solid #ddd; 
                padding-top: 5px; 
                justify-content: space-between; 
            }
            
            .note-content { page-break-inside: avoid; border: none !important; }
            .puc-panel, .notes-panel { 
                width: 100% !important; 
                border: none !important; 
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
            }
        }
    `}</style>
);
