
export interface NoteParams {
  id: string;
  authorId: string;
  authorName: string;
  authorDesignation: string;
  content: string; // HTML/Rich Text
  timestamp: string;
  isFinal: boolean;
  signatureUrl?: string;
  draftType?: string; 
  isLocked?: boolean;
  authorLevel?: number;
  attachmentId?: string;
  isSigned?: boolean;
  isApproved?: boolean; // Indicates if this specific draft was the approved final version
}

export interface EditHistoryItem {
    id: string;
    user: string;
    designation: string;
    action: string;
    timestamp: string;
}

export interface FileFolder {
  id: string;
  fileNumber: string; 
  subject: string;
  departmentId: string;
  createdDate: string;
  priority: 'Immediate' | 'Urgent' | 'Ordinary' | 'Resident';
  category: 'A' | 'B' | 'C' | 'D';
  status: 'Active' | 'Closed' | 'Archived' | 'Approved' | 'Rejected' | 'Returned' | 'Cold';
  currentOwnerId: string;
  isApproved?: boolean; // Global lock flag
  editHistory?: EditHistoryItem[];
  trackChangesLog?: any[];
  puc: {
    subject: string;
    receivedFrom: string;
    date: string;
    content: string;
    attachmentUrl?: string;
  };
  notes: NoteParams[];
}
