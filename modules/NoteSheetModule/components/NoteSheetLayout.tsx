
import React from 'react';

/**
 * Renders the official Government Note Sheet background.
 * - Handles the "Green Paper" background color.
 * - Draws the Red Margin (Hashia) on the left.
 * - Sets the padding for the content area to sit to the right of the margin.
 */
export const NoteSheetContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex-1 overflow-y-auto bg-gov-paper">
            {/* Wrapper ensures the relative container grows with content so absolute margin stretches */}
            <div className="relative min-h-full">
                {/* The Red Margin (Hashia) - Visual Only */}
                <div className="absolute left-0 top-0 bottom-0 w-16 border-r-2 border-red-300 pointer-events-none z-0 hidden lg:block bg-opacity-10 bg-red-50 note-sheet-margin"></div>
                
                {/* Content Stream */}
                <div className="p-4 lg:pl-20 pr-8 font-serif text-lg leading-loose text-gray-900 relative z-10">
                    {children}
                    
                    {/* Spacer for scrolling */}
                    <div className="h-12"></div>
                </div>
            </div>
        </div>
    );
};

interface NoteBlockProps {
    index: number; // 0-based index
    children: React.ReactNode;
    noteId: string;
    isSystem?: boolean;
    isLocked?: boolean;
}

/**
 * Renders a single Paragraph/Note entry.
 * - Handles the positioning of the Paragraph Number inside the Red Margin.
 * - Handles the indentation of the content.
 * - Handles highlighting for Routing/System messages.
 */
export const NoteBlock: React.FC<NoteBlockProps> = ({ index, children, noteId, isSystem, isLocked }) => {
    
    // CASE 1: System Message (e.g. "Marked to X")
    // These are usually indented differently or centered.
    if (isSystem) {
        // Check if it's a specific routing note (starts with system_routing) or generic system note
        const isRouting = noteId.startsWith('routing'); 

        if (isRouting) {
            return (
                <div data-note-id={noteId} className="mt-8 mb-8 relative note-content">
                    {/* Visual Routing Bar */}
                    <div className="font-bold text-black uppercase text-sm border-l-4 border-black pl-3 ml-[-1rem]">
                        {children}
                    </div>
                    {/* Number is still shown for routing notes in strict official business */}
                    {index > 0 && (
                        <div className="absolute -left-20 top-1 w-16 text-center text-red-500 font-bold text-sm hidden lg:block no-print select-none">
                            {index + 1}
                        </div>
                    )}
                </div>
            );
        }

        // Generic System Log (e.g. "Moved to Cold Storage")
        return (
            <div data-note-id={noteId} className="mt-4 mb-4 text-center text-xs text-gray-500 italic no-print note-content">
                {children}
            </div>
        );
    }

    // CASE 2: Regular Note / Minute
    return (
        <div 
            data-note-id={noteId} 
            className={`mb-8 relative group note-content p-4 rounded-lg transition-colors ${isLocked ? 'bg-gray-100/30 border border-gray-200 shadow-inner' : ''}`}
        >
            {/* The Paragraph Number - positioned strictly in the Red Margin area */}
            {index > 0 && (
                <div className="absolute -left-20 top-4 w-16 text-center text-red-500 font-bold text-sm hidden lg:block no-print select-none">
                    {index + 1}
                </div>
            )}
            
            {/* The Actual Note Content */}
            <div className="note-body">
                {children}
            </div>
        </div>
    );
};
