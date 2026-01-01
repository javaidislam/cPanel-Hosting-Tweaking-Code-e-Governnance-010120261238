
import { Designation, DesignationLevel } from '../types/shared';

const DB_KEY = 'erp_designations';
const META_KEY = 'erp_level_metadata';

const INITIAL_DESIGNATIONS: Designation[] = [
    { id: 'des_cm', title: 'Chief Minister', bps: 22, level: DesignationLevel.MINISTER, isActive: true },
    { id: 'des_min', title: 'Minister', bps: 21, level: DesignationLevel.MINISTER, isActive: true },
    { id: 'des_cs', title: 'Chief Secretary', bps: 22, level: DesignationLevel.SECRETARY, isActive: true },
    { id: 'des_sec', title: 'Secretary', bps: 20, level: DesignationLevel.SECRETARY, isActive: true },
    { id: 'des_spec_sec', title: 'Special Secretary', bps: 20, level: DesignationLevel.SECRETARY, isActive: true },
    { id: 'des_as', title: 'Additional Secretary', bps: 19, level: DesignationLevel.ADDITIONAL_SECRETARY, isActive: true },
    { id: 'des_ds', title: 'Deputy Secretary', bps: 18, level: DesignationLevel.DEPUTY_SECRETARY, isActive: true },
    { id: 'des_so', title: 'Section Officer', bps: 17, level: DesignationLevel.SECTION_OFFICER, isActive: true },
    { id: 'des_sup', title: 'Superintendent', bps: 17, level: DesignationLevel.SUPERINTENDENT, isActive: true },
    { id: 'des_ast', title: 'Assistant', bps: 16, level: DesignationLevel.ASSISTANT, isActive: true },
    { id: 'des_ck', title: 'Senior Clerk', bps: 14, level: DesignationLevel.CLERK, isActive: true }
];

const INITIAL_META = {
  [DesignationLevel.MINISTER]: { label: 'Executive' },
  [DesignationLevel.SECRETARY]: { label: 'Principal Accounting Officer' },
  [DesignationLevel.ADDITIONAL_SECRETARY]: { label: 'Wing Head' },
  [DesignationLevel.DEPUTY_SECRETARY]: { label: 'Branch Head' },
  [DesignationLevel.SECTION_OFFICER]: { label: 'Section In-charge' },
  [DesignationLevel.SUPERINTENDENT]: { label: 'Supervisory Staff' },
  [DesignationLevel.ASSISTANT]: { label: 'Ministerial Staff' },
  [DesignationLevel.CLERK]: { label: 'Support Staff' },
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const DesignationService = {
    getDesignations: async (): Promise<Designation[]> => {
        await delay(50);
        const stored = localStorage.getItem(DB_KEY);
        if (!stored) {
            localStorage.setItem(DB_KEY, JSON.stringify(INITIAL_DESIGNATIONS));
            return INITIAL_DESIGNATIONS;
        }
        return JSON.parse(stored);
    },

    getLevelMetadata: async (): Promise<Record<number, { label: string }>> => {
        await delay(50);
        const stored = localStorage.getItem(META_KEY);
        if (!stored) {
            localStorage.setItem(META_KEY, JSON.stringify(INITIAL_META));
            return INITIAL_META;
        }
        return JSON.parse(stored);
    },

    saveDesignation: async (designation: Designation): Promise<void> => {
        await delay(50);
        const list = await DesignationService.getDesignations();
        const index = list.findIndex(d => d.id === designation.id);
        if (index >= 0) {
            list[index] = designation;
        } else {
            list.push(designation);
        }
        localStorage.setItem(DB_KEY, JSON.stringify(list));
    },

    deleteDesignation: async (id: string): Promise<void> => {
        await delay(50);
        const list = await DesignationService.getDesignations();
        const filtered = list.filter(d => d.id !== id);
        localStorage.setItem(DB_KEY, JSON.stringify(filtered));
    }
};
