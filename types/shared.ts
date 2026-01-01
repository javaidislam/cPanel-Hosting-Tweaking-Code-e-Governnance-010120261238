
export enum DesignationLevel {
  MINISTER = 1,
  SECRETARY = 2,
  ADDITIONAL_SECRETARY = 3,
  DEPUTY_SECRETARY = 4,
  SECTION_OFFICER = 5,
  SUPERINTENDENT = 6,
  ASSISTANT = 7,
  CLERK = 8
}

// Added OfficialStatus to support imports in UserManagementModule
export type OfficialStatus = 'Active' | 'OnLeave' | 'Retired' | 'Suspended';

// Added AuthorityLog to support DataService role management
export interface AuthorityLog {
  timestamp: string;
  action: string;
  description: string;
  performedByCnic: string;
  performedByName: string;
  ipAddress: string;
  macAddress: string;
  gpsLocation: { latitude: number; longitude: number; accuracy: number; nearestLandmarks: string[] };
}

// Added SystemRole to support UserManagementModule and DataService
export interface SystemRole {
    id: string;
    title: string;
    bpsLevel: number;
    departmentId: string;
    jobDescription: string;
    definedPowers: string[];
    isActive: boolean;
    historyLog: AuthorityLog[];
}

// Added PostingHistory to track official career movements
export interface PostingHistory {
    id: string;
    roleId: string;
    designation: string;
    departmentId: string;
    startDate: string;
    endDate: string;
    remarks: string;
}

export interface Section {
  id: string;
  name: string;
  isActive: boolean;
  remarks?: string;
}

export interface Unit {
  id: string;
  name: string;
  isActive: boolean;
  sections: Section[]; // Mandatory link
}

export interface Wing {
  id: string;
  name: string;
  isActive: boolean;
  sections: Section[]; // Mandatory link
}

export interface Project {
  id: string;
  name: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: 'Proposed' | 'Ongoing' | 'Completed' | 'Suspended';
  isActive: boolean;
}

export interface Loan {
  id: string;
  source: string; // e.g. World Bank, ADB
  amount: number;
  purpose: string;
  isActive: boolean;
}

export interface CorporateEntity {
  id: string;
  name: string;
  type: 'Authority' | 'Board' | 'Company' | 'Council';
  isActive: boolean;
}

export interface AttachedDepartment {
  id: string;
  name: string;
  headDesignation: string;
  isActive: boolean;
}

export interface Department {
  id: string;
  name: string;
  headDesignation: string;
  isActive: boolean;
  attachedDepartments: AttachedDepartment[];
  wings: Wing[];
  units: Unit[];
  projects: Project[];
  loans: Loan[];
  corporateEntities: CorporateEntity[];
}

export interface Designation {
  id: string;
  title: string;
  bps: number;
  level: DesignationLevel;
  isActive: boolean;
}

export interface Official {
  id: string;
  cnic: string;
  roleId: string;
  designation: string;
  level: DesignationLevel;
  departmentId: string;
  wing?: string;
  name: string;
  status: OfficialStatus;
  serviceName?: string;
  isCadre?: boolean;
  // Added optional properties to support ERP business logic and personnel records
  personalNumber?: string;
  lastUpdated?: string;
  postingHistory?: PostingHistory[];
  formerNames?: string[];
  familyDetails?: any[];
  qualifications?: any[];
}
