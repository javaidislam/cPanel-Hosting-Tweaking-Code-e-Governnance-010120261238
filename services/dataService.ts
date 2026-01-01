
import { Asset } from '../modules/AssetModule/types.ts';
import { FileFolder } from '../modules/NoteSheetModule/types.ts';
import { Official, DesignationLevel, SystemRole, Department } from '../types/shared.ts';

/**
 * HOSTED DATA SERVICE (cPanel / MySQL Bridge)
 * Uses relative paths to work across any domain/folder in a shared hosting environment.
 */

export type StorageMode = 'mysql' | 'unmounted';

// Using relative path ensures it works on shared hosting subdirectories or root
const BRIDGE_URL = './db_bridge.php';
let currentMode: StorageMode = 'unmounted';
let mountError: string | null = null;

async function readFile<T>(fileName: string): Promise<T[]> {
    try {
        const response = await fetch(`${BRIDGE_URL}?file=${fileName}`);
        if (!response.ok) throw new Error("Server communication error");
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error(`Read error for ${fileName}:`, e);
        return [];
    }
}

async function writeFile<T>(fileName: string, data: T[]) {
    try {
        const response = await fetch(`${BRIDGE_URL}?file=${fileName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Server write error");
    } catch (e) {
        console.error(`Write error for ${fileName}:`, e);
    }
}

export const DataService = {
  mountDrive: async (): Promise<{ success: boolean; mode: StorageMode; error?: string }> => {
      try {
          // Verify connection to the bridge
          const test = await fetch(`${BRIDGE_URL}?file=ping`);
          if (test.ok) {
              currentMode = 'mysql';
              return { success: true, mode: 'mysql' };
          }
          throw new Error("Cannot reach database bridge.");
      } catch (e: any) {
          currentMode = 'unmounted';
          mountError = e.message;
          return { success: false, mode: 'unmounted', error: mountError };
      }
  },

  isMounted: () => currentMode !== 'unmounted',
  getStorageMode: () => currentMode,
  getMountError: () => mountError,

  getUsers: async (): Promise<Official[]> => {
      let users = await readFile<Official>('users.json');
      if (users.length === 0) {
          await DataService.seedInitialUsers();
          users = await readFile<Official>('users.json');
      }
      return users;
  },

  seedInitialUsers: async () => {
      const DEPT_SGA_ID = 'Schedule-I-Entry-33-1000000000';
      const initialUsers: Official[] = [
          { id: 'usr_cs', cnic: '42201-1111111-1', roleId: 'ROLE_CS', name: 'Dr. Shahzad Khan', designation: 'Chief Secretary', level: DesignationLevel.SECRETARY, departmentId: DEPT_SGA_ID, status: 'Active', isCadre: true, serviceName: 'PAS' },
          { id: 'usr_sec_services', cnic: '42201-2222222-2', roleId: 'ROLE_SEC_SERVICES', name: 'Mustafa Ahmed', designation: 'Secretary (Services)', level: DesignationLevel.SECRETARY, departmentId: DEPT_SGA_ID, status: 'Active', isCadre: true, serviceName: 'PAS' },
          { id: 'usr_so_admin', cnic: '42201-3333333-3', roleId: 'ROLE_SO', name: 'Zohaib Ali', designation: 'Section Officer (Admin)', level: DesignationLevel.SECTION_OFFICER, departmentId: DEPT_SGA_ID, status: 'Active', wing: 'Admin' }
      ];
      await writeFile('users.json', initialUsers);
  },

  getVisibleUsers: async (viewer: Official): Promise<Official[]> => {
      const allUsers = await DataService.getUsers();
      const isGlobalAdmin = viewer.roleId === 'ROLE_CS' || viewer.roleId === 'ROLE_SEC_SERVICES';
      if (isGlobalAdmin) return allUsers;
      return allUsers.filter(u => u.departmentId === viewer.departmentId);
  },

  getUserById: async (id: string): Promise<Official | undefined> => {
      const users = await readFile<Official>('users.json');
      return users.find(u => u.id === id);
  },

  saveUser: async (user: Official): Promise<void> => {
      const users = await readFile<Official>('users.json');
      const idx = users.findIndex(u => u.id === user.id);
      if (idx >= 0) users[idx] = user; else users.push(user);
      await writeFile('users.json', users);
  },

  getFiles: async () => readFile<FileFolder>('files.json'),
  
  createFile: async (file: FileFolder) => {
      const files = await readFile<FileFolder>('files.json');
      files.push(file);
      await writeFile('files.json', files);
  },

  updateFile: async (file: FileFolder) => {
      const files = await readFile<FileFolder>('files.json');
      const idx = files.findIndex(f => f.id === file.id);
      if (idx >= 0) files[idx] = file;
      await writeFile('files.json', files);
  },

  getAssets: async () => readFile<Asset>('assets.json'),
  
  saveAttachment: async (file: any, content?: string, id?: string) => {
      const attId = id || `att_${Date.now()}`;
      const atts = await readFile<any>('attachments.json');
      atts.push({ id: attId, name: file.name, type: file.type, data: content });
      await writeFile('attachments.json', atts);
      return attId;
  },

  getAttachment: async (id: string): Promise<any | undefined> => {
      const atts = await readFile<any>('attachments.json');
      return atts.find(a => a.id === id);
  },

  archiveFinalPdf: async (fileId: string, html: string) => {
      const archives = await readFile<any>('archives.json');
      archives.push({ fileId, html, timestamp: new Date().toISOString() });
      await writeFile('archives.json', archives);
  },

  getRoles: async (): Promise<SystemRole[]> => readFile<SystemRole>('roles.json'),
  saveRole: async (role: SystemRole): Promise<void> => {
      const roles = await readFile<SystemRole>('roles.json');
      roles.push(role);
      await writeFile('roles.json', roles);
  },

  getStoragePath: () => "MySQL Cloud Database (taxlawspk_goverpjicodev)",

  getDepartments: async (): Promise<Department[]> => {
      let depts = await readFile<Department>('departments.json');
      if (depts.length === 0) {
          try {
              const response = await fetch('./master_departments.json');
              const seedData = await response.json();
              
              const seeded = seedData.map((d: any) => ({
                  id: `Schedule-I-Entry-${d.entry.toString().padStart(2, '0')}-1000000000`,
                  name: d.name,
                  headDesignation: d.head,
                  isActive: true,
                  attachedDepartments: [],
                  wings: [],
                  units: [],
                  projects: [],
                  loans: [],
                  corporateEntities: []
              }));
              
              await writeFile('departments.json', seeded);
              return seeded;
          } catch (err) {
              console.error("Failed to seed departments", err);
              return [];
          }
      }
      return depts;
  },

  saveDepartments: async (depts: Department[]) => writeFile('departments.json', depts)
};
