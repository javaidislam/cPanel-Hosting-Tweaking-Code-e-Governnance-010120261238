
import React, { useState, useEffect, useRef } from 'react';
import { Official, DesignationLevel } from '../../../../types/shared';
import { AttachmentService } from '../../../../services/AttachmentService';
import { EditHistoryItem } from '../../types';

interface WordEditorModalProps {
    type: string;
    initialContent?: string;
    currentUser: Official;
    onClose: () => void;
    onSave: (html: string, lock: boolean, close: boolean, approved?: boolean) => void;
    isEditable?: boolean;
    history?: EditHistoryItem[];
}

const WordEditorModal: React.FC<WordEditorModalProps> = ({ 
    type, initialContent, currentUser, onClose, onSave, isEditable = true, history = [] 
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [isApproved, setIsApproved] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [pageCount, setPageCount] = useState(1);

    // Attachment Confirmation State
    const [showAttModal, setShowAttModal] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [attCategory, setAttCategory] = useState('Summary');
    const [otherName, setOtherName] = useState('');

    const ATTACHMENT_OPTIONS = [
        'Summary', 'Note to the Chief Secretary', 'Summary of the Chief Minister',
        'Summary of the Governor', 'Note to the Minister', 'Annexure', 'Flag', 'Others'
    ];

    // Resizing State for Tables & Images
    const resizingRef = useRef<{
        element: HTMLElement;
        type: 'image' | 'col' | 'row';
        startX: number;
        startY: number;
        startWidth: number;
        startHeight: number;
    } | null>(null);

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = initialContent || `<div style="text-align:center; font-weight:bold; text-decoration:underline;">${type.toUpperCase()}</div><br/><b>Subject: </b>`;
        }
        if (isEditable && !isApproved) {
            document.execCommand('defaultParagraphSeparator', false, 'p');
        }
    }, [initialContent, type, isEditable, isApproved]);

    // Enhanced Resizing logic (Column & Row)
    useEffect(() => {
        if (!isEditable || isApproved || !editorRef.current) return;
        const editor = editorRef.current;

        const handleMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'TD') {
                const rect = target.getBoundingClientRect();
                const buffer = 10;
                // Column Resize Detection
                if (e.clientX > rect.right - buffer) {
                    e.preventDefault();
                    resizingRef.current = { element: target, type: 'col', startX: e.clientX, startY: e.clientY, startWidth: target.offsetWidth, startHeight: 0 };
                } 
                // Row Resize Detection
                else if (e.clientY > rect.bottom - buffer) {
                    e.preventDefault();
                    const row = target.parentElement as HTMLElement;
                    resizingRef.current = { element: row, type: 'row', startX: e.clientX, startY: e.clientY, startWidth: 0, startHeight: row.offsetHeight };
                }
            } else if (target.tagName === 'IMG') {
                resizingRef.current = { element: target, type: 'image', startX: e.clientX, startY: e.clientY, startWidth: target.offsetWidth, startHeight: target.offsetHeight };
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingRef.current) return;
            const { type, element, startX, startY, startWidth, startHeight } = resizingRef.current;
            if (type === 'col') element.style.width = `${Math.max(40, startWidth + (e.clientX - startX))}px`;
            if (type === 'row') element.style.height = `${Math.max(20, startHeight + (e.clientY - startY))}px`;
            if (type === 'image') {
                element.style.width = `${Math.max(20, startWidth + (e.clientX - startX))}px`;
                element.style.height = `${Math.max(20, startHeight + (e.clientY - startY))}px`;
            }
        };

        const handleMouseUp = () => resizingRef.current = null;

        editor.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            editor.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isEditable, isApproved]);

    const handleInput = () => {
        if (!editorRef.current) return;
        // A4 Height check (~1122px per page at 96dpi)
        const totalHeight = editorRef.current.scrollHeight;
        const newPageCount = Math.ceil(totalHeight / 1122);
        
        if (newPageCount > 5) {
            setStatusMsg("CRITICAL: 5 PAGE LIMIT EXCEEDED. UNDOING...");
            document.execCommand('undo');
        } else {
            setPageCount(newPageCount);
            setStatusMsg('');
        }
    };

    const execCommand = (cmd: string, val: string = '') => {
        if (isApproved) return;
        document.execCommand(cmd, false, val);
        editorRef.current?.focus();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPendingFile(file);
            setShowAttModal(true);
        }
    };

    const confirmAttachment = async () => {
        if (!pendingFile) return;
        setIsProcessing(true);
        try {
            const attId = await AttachmentService.upload(pendingFile);
            const nomenclature = attCategory === 'Others' ? (otherName || 'Official Document') : attCategory;
            
            // Insert Hot Hyperlink at cursor
            const linkHtml = `<a href="#" data-att-id="${attId}" class="attachment-link font-bold text-gov-green underline" title="${pendingFile.name}">${nomenclature}</a>&nbsp;`;
            execCommand('insertHTML', linkHtml);
            
            setShowAttModal(false);
            setPendingFile(null);
            setOtherName('');
        } catch (e) {
            alert("Attachment upload failed.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFinalAction = async (approved: boolean) => {
        if (!editorRef.current) return;
        setIsProcessing(true);
        try {
            const content = editorRef.current.innerHTML;
            await onSave(content, approved, approved, approved);
            if (approved) {
                setIsApproved(true);
                setStatusMsg("DOCUMENT FINALIZED & PDF ARCHIVED.");
            } else {
                setStatusMsg("Draft Saved.");
                setTimeout(() => setStatusMsg(''), 2000);
            }
        } catch (e) {
            setStatusMsg("Error communicating with secretariat server.");
        } finally {
            setIsProcessing(false);
        }
    };

    const canApprove = currentUser.level <= DesignationLevel.ADDITIONAL_SECRETARY;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex z-[110] font-sans">
            <style>{`
                .a4-page {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 1in;
                    background: white;
                    margin: 0 auto;
                    position: relative;
                    box-shadow: 0 0 40px rgba(0,0,0,0.5);
                    box-sizing: border-box;
                    word-wrap: break-word;
                }
                .hashia-right {
                    position: absolute;
                    right: -160px;
                    top: 0;
                    bottom: 0;
                    width: 140px;
                    border-left: 2px solid rgba(239, 68, 68, 0.4);
                    padding-left: 10px;
                    pointer-events: none;
                }
                .para-lane-left {
                    position: absolute;
                    left: -50px;
                    width: 40px;
                    text-align: right;
                    color: #ef4444;
                    font-weight: bold;
                    pointer-events: none;
                }
                .editor-content table { border-collapse: collapse; width: 100%; table-layout: auto; }
                .editor-content td { border: 1px solid #000; padding: 8px; position: relative; }
                ins { background: #dcfce7; text-decoration: none; border-bottom: 2px solid #16a34a; }
                del { background: #fee2e2; color: #b91c1c; text-decoration: line-through; }
            `}</style>

            {/* Left Sidebar: Edit History */}
            <div className="w-80 bg-gray-800 text-gray-300 border-r border-gray-700 flex flex-col no-print">
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex items-center space-x-2">
                    <i className="fas fa-history text-gov-gold"></i>
                    <h3 className="font-bold text-xs uppercase tracking-widest">Audit Trail & History</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {history.map((h, i) => (
                        <div key={i} className="bg-white/5 border-l-2 border-gov-gold p-3 rounded-r text-xs">
                            <div className="font-bold text-white">{h.designation}</div>
                            <div className="text-gray-400 mt-1">{h.action}</div>
                            <div className="text-[10px] text-gray-500 mt-2">{new Date(h.timestamp).toLocaleString()}</div>
                        </div>
                    ))}
                    {history.length === 0 && <div className="text-center py-10 text-gray-600 italic text-sm">No recorded edits.</div>}
                </div>
                <div className="p-4 bg-gray-900 border-t border-gray-700 text-[10px] text-center font-bold text-gray-500 uppercase">
                    A4 Page Count: {pageCount} / 5
                </div>
            </div>

            {/* Main Center Area */}
            <div className="flex-1 overflow-y-auto bg-gray-700 flex flex-col items-center">
                {/* Fixed Dashboard Toolbar */}
                <div className="w-full bg-white border-b px-8 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg">
                    <div className="flex items-center space-x-6">
                        <button onClick={onClose} className="text-gray-400 hover:text-red-600 transition-colors">
                            <i className="fas fa-arrow-left fa-lg"></i>
                        </button>
                        <div className="h-8 w-px bg-gray-200"></div>
                        {!isApproved && (
                            <div className="flex items-center space-x-2">
                                <button onClick={() => execCommand('bold')} className="w-9 h-9 hover:bg-gray-100 rounded flex items-center justify-center text-gray-700"><i className="fas fa-bold"></i></button>
                                <button onClick={() => execCommand('italic')} className="w-9 h-9 hover:bg-gray-100 rounded flex items-center justify-center text-gray-700"><i className="fas fa-italic"></i></button>
                                <button onClick={() => execCommand('underline')} className="w-9 h-9 hover:bg-gray-100 rounded flex items-center justify-center text-gray-700"><i className="fas fa-underline"></i></button>
                                <div className="w-px h-6 bg-gray-200 mx-2"></div>
                                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-1.5 bg-gov-cream hover:bg-gray-100 rounded text-xs font-bold text-gov-green border border-gov-green/20">
                                    <i className="fas fa-paperclip mr-2"></i> Attach Document
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        {statusMsg && <span className="text-xs font-bold text-gov-green animate-pulse mr-4">{statusMsg}</span>}
                        {!isApproved ? (
                            <>
                                <button onClick={() => handleFinalAction(false)} disabled={isProcessing} className="px-5 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded text-sm font-bold shadow-sm hover:bg-blue-100">
                                    <i className="fas fa-save mr-2"></i> Save Changes
                                </button>
                                {canApprove && (
                                    <button onClick={() => handleFinalAction(true)} disabled={isProcessing} className="px-5 py-2 bg-gov-green text-white rounded text-sm font-bold shadow-xl hover:bg-green-800 transform active:scale-95 transition-all">
                                        <i className="fas fa-check-double mr-2"></i> Save & Approve
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="px-5 py-2 bg-red-50 text-red-700 border border-red-200 rounded text-sm font-bold flex items-center">
                                <i className="fas fa-lock mr-2"></i> APPROVED & ARCHIVED
                            </div>
                        )}
                    </div>
                </div>

                {/* Editor Container */}
                <div className="py-16 px-40">
                    <div className="a4-page shadow-2xl">
                        {/* Marginalia Area */}
                        <div className="hashia-right no-print">
                            <div className="text-[10px] text-gray-400 font-bold uppercase mb-4 tracking-widest">Hashia</div>
                        </div>
                        <div className="para-lane-left no-print"></div>

                        <div 
                            ref={editorRef}
                            contentEditable={!isApproved}
                            onInput={handleInput}
                            className="editor-content font-serif text-[12pt] leading-relaxed outline-none min-h-full"
                        ></div>
                    </div>
                </div>
            </div>

            {/* Hidden Input */}
            <input type="file" ref={fileInputRef} className="hidden" accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,image/*,video/*" onChange={handleFileUpload} />

            {/* Nomenclature Confirmation Modal */}
            {showAttModal && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-2xl p-8 w-[480px]">
                        <h3 className="text-xl font-bold text-gov-green border-b pb-3 mb-5 uppercase tracking-tighter">Official Attachment Definition</h3>
                        <p className="text-xs text-gray-500 mb-6 italic">File Detected: <span className="font-bold text-black">{pendingFile?.name}</span></p>
                        
                        <div className="grid grid-cols-1 gap-2 mb-6 max-h-60 overflow-y-auto border p-4 bg-gray-50 rounded shadow-inner">
                            {ATTACHMENT_OPTIONS.map(opt => (
                                <label key={opt} className="flex items-center space-x-3 text-sm p-2 hover:bg-white rounded cursor-pointer transition-colors border border-transparent hover:border-gov-green/20">
                                    <input type="radio" name="att_cat" checked={attCategory === opt} onChange={() => setAttCategory(opt)} className="text-gov-green focus:ring-gov-green" />
                                    <span className="font-medium text-gray-700">{opt}</span>
                                </label>
                            ))}
                        </div>

                        {attCategory === 'Others' && (
                            <div className="mb-6 animate-fade-in">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Custom Nomenclature (Max 50 Characters)</label>
                                <input maxLength={50} type="text" value={otherName} onChange={e => setOtherName(e.target.value)} className="w-full border rounded p-2 text-sm outline-none focus:ring-1 focus:ring-gov-green" placeholder="Enter custom name..." />
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button onClick={() => { setShowAttModal(false); setPendingFile(null); }} className="px-6 py-2 text-sm text-gray-500 font-bold hover:text-red-600">Cancel</button>
                            <button onClick={confirmAttachment} className="px-8 py-2 bg-gov-green text-white text-sm font-bold rounded shadow-lg hover:bg-green-800 transition-colors">
                                <i className="fas fa-check mr-2"></i> Confirm & Attach
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WordEditorModal;
