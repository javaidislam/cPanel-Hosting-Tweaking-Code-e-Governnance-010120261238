
import { FileFolder } from './types';
import { Official, DesignationLevel } from '../../types/shared';

export type FolderId = 'Inbox' | 'Outbox' | 'Returned' | 'Approved' | 'Rejected' | 'Cold' | 'All';

/**
 * centralized permission logic to determine a user's relationship with a file.
 */
export const checkFileAccess = (f: FileFolder, currentUser: Official) => {
    // 1. Basic Roles
    const isOwner = f.currentOwnerId === currentUser.id;
    const isInRoutingChain = f.notes.some(n => n.authorId === currentUser.id);

    // 2. High Level View Permissions
    const isChiefSecretary = currentUser.id === 'usr_cs';
    const isDeptSecretary = currentUser.level === DesignationLevel.SECRETARY && f.departmentId === currentUser.departmentId;

    // 3. Determine View Right
    let hasViewRight = isOwner || isInRoutingChain;
    if (isChiefSecretary) hasViewRight = true;
    if (isDeptSecretary) hasViewRight = true;

    return { isOwner, isInRoutingChain, hasViewRight };
};

export interface FolderDefinition {
    id: FolderId;
    label: string;
    icon: string;
    iconColorClass?: string;
    badgeColorClass?: string;
    /** Filter logic for the main file list */
    filter: (file: FileFolder, access: { isOwner: boolean; isInRoutingChain: boolean; hasViewRight: boolean }) => boolean;
    /** Filter logic for the badge count (e.g. unread/active items) */
    countFilter?: (file: FileFolder, access: { isOwner: boolean }) => boolean; 
    /** Minimum designation level required to see this folder */
    minLevel?: number; 
    /** Visual separator before this item in sidebar */
    isSeparatorBefore?: boolean;
    /** Section header title before this item */
    headerTitle?: string;
}

export const FOLDERS: FolderDefinition[] = [
    {
        id: 'Inbox',
        label: 'Inbox',
        icon: 'fas fa-inbox',
        badgeColorClass: 'bg-gov-green text-white',
        // Inbox: Owned by user, not closed/archived/cold. Includes Approved/Rejected if currently with user.
        filter: (f, { isOwner }) => isOwner && f.status !== 'Closed' && f.status !== 'Archived' && f.status !== 'Cold',
        countFilter: (f, { isOwner }) => isOwner && (f.status === 'Active' || f.status === 'Approved' || f.status === 'Rejected')
    },
    {
        id: 'Outbox',
        label: 'Outbox',
        icon: 'fas fa-paper-plane',
        // Outbox: Worked on by user, but not currently owning it. Excludes Cold files.
        filter: (f, { isOwner, isInRoutingChain }) => isInRoutingChain && !isOwner && f.status !== 'Cold'
    },
    {
        id: 'Returned',
        label: 'Returned',
        icon: 'fas fa-undo',
        iconColorClass: 'text-yellow-600',
        badgeColorClass: 'bg-yellow-100 text-yellow-800',
        headerTitle: 'Status Folders',
        filter: (f, { isOwner }) => isOwner && f.status === 'Returned',
        countFilter: (f, { isOwner }) => isOwner && f.status === 'Returned'
    },
    {
        id: 'Approved',
        label: 'Approved',
        icon: 'fas fa-check-circle',
        iconColorClass: 'text-green-600',
        filter: (f, { hasViewRight }) => hasViewRight && f.status === 'Approved'
    },
    {
        id: 'Rejected',
        label: 'Rejected',
        icon: 'fas fa-times-circle',
        iconColorClass: 'text-red-600',
        filter: (f, { hasViewRight }) => hasViewRight && f.status === 'Rejected'
    },
    {
        id: 'Cold',
        label: 'Cold Storage',
        icon: 'fas fa-snowflake',
        iconColorClass: 'text-blue-400',
        filter: (f, { hasViewRight }) => hasViewRight && f.status === 'Cold'
    },
    {
        id: 'All',
        label: 'Global Repository',
        icon: 'fas fa-history',
        minLevel: DesignationLevel.SECRETARY,
        isSeparatorBefore: true,
        filter: (f, { hasViewRight }) => hasViewRight
    }
];
