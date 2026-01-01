
import React, { useState, useRef } from 'react';
import { AttachmentService } from '../../../services/AttachmentService';
import { toRoman, toChar } from '../utils';

const AttachmentToolbar: React.FC<{ 
    onInsert: (text: string) => void; 
    onOpenEditor: (type: string) => void;
}> = ({ onInsert, onOpenEditor }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachType, setAttachType] = useState<'PUC' | 'Annex' | 'Flag' | 'File' | 'DFA' | null>(null);
    const [counts, setCounts] = useState({ annex: 1, flag: 0 });
    const [uploading, setUploading] = useState(false);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !attachType) return;

        setUploading(true);
        let attId = '';
        try {
            attId = await AttachmentService.upload(file);
        } catch(err) {
            alert('Upload failed');
            setUploading(false);
            return;
        }
        setUploading(false);

        // Standard Hot Hyperlink for all attachments
        const linkHtml = `<a href="#" data-att-id="${attId}" class="attachment-link text-blue-700 underline font-bold cursor-pointer" title="${file.name}">${file.name}</a>`;

        let tag = '';
        if (attachType === 'PUC') {
            tag = ` [PUC: ${linkHtml}] `;
        } else if (attachType === 'Annex') {
            tag = ` [Annexure-${toRoman(counts.annex)}: ${linkHtml}] `;
            setCounts(p => ({ ...p, annex: p.annex + 1 }));
        } else if (attachType === 'Flag') {
            tag = ` [Flag-${toChar(counts.flag)}: ${linkHtml}] `;
            setCounts(p => ({ ...p, flag: p.flag + 1 }));
        } else if (attachType === 'DFA') {
            tag = ` [DFA: ${linkHtml}] `;
        } else {
            tag = ` [File: ${linkHtml}] `;
        }
        onInsert(tag);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setAttachType(null);
    };

    const trigger = (type: typeof attachType) => {
        setAttachType(type);
        fileInputRef.current?.click();
    };

    const wordTrigger = (type: string) => {
        onOpenEditor(type);
    };

    return (
        <div className="mb-2">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFile} />
            <div className="flex flex-wrap gap-2 mb-2">
                <button type="button" disabled={uploading} onClick={() => trigger('PUC')} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs border border-gray-300 font-semibold">
                    <i className="fas fa-file-alt mr-1"></i> PUC
                </button>
                <button type="button" disabled={uploading} onClick={() => trigger('Annex')} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs border border-gray-300 font-semibold">
                    <i className="fas fa-list-ol mr-1"></i> Annex
                </button>
                <button type="button" disabled={uploading} onClick={() => trigger('Flag')} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs border border-gray-300 font-semibold">
                    <i className="fas fa-flag mr-1 text-red-600"></i> Flag
                </button>
                <button type="button" disabled={uploading} onClick={() => wordTrigger('DFA')} className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-xs border border-purple-200 font-semibold">
                    <i className="fas fa-file-signature mr-1"></i> DFA (WP)
                </button>
                <button type="button" disabled={uploading} onClick={() => trigger('File')} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs border border-gray-300 font-semibold">
                    <i className="fas fa-paperclip mr-1"></i> File
                </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 self-center">Digital Word Processor:</span>
                <button type="button" onClick={() => wordTrigger('Summary for CM')} className="px-2 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 rounded text-xs border border-yellow-200 font-bold">Summ. CM</button>
                <button type="button" onClick={() => wordTrigger('Summary for Governor')} className="px-2 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 rounded text-xs border border-yellow-200 font-bold">Summ. Gov</button>
                <button type="button" onClick={() => wordTrigger('Summary for Cabinet')} className="px-2 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 rounded text-xs border border-yellow-200 font-bold">Summ. Cab</button>
                <div className="w-px h-4 bg-gray-300 mx-1 self-center"></div>
                <button type="button" onClick={() => wordTrigger('Note for CS')} className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-800 rounded text-xs border border-green-200 font-bold">Note CS</button>
                <button type="button" onClick={() => wordTrigger('Note for Secretary')} className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-800 rounded text-xs border border-green-200 font-bold">Note Sec</button>
                <button type="button" onClick={() => wordTrigger('Miscellaneous Notes')} className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded text-xs border border-blue-200 font-bold">Misc Note</button>
            </div>
        </div>
    );
};

export default AttachmentToolbar;
