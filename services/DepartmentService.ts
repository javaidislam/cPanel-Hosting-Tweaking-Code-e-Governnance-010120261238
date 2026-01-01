
import { Department } from '../types/shared';
import { DataService } from './dataService';

export const DepartmentService = {
    getDepartments: async (): Promise<Department[]> => {
        if (!DataService.isMounted()) return [];
        return await DataService.getDepartments();
    },

    getVisibleDepartments: async (user: any): Promise<Department[]> => {
        const depts = await DepartmentService.getDepartments();
        const isGlobalAdmin = user.roleId === 'ROLE_CS' || user.roleId === 'ROLE_SEC_SERVICES';
        if (isGlobalAdmin) return depts;
        return depts.filter(d => d.id === user.departmentId);
    },

    saveDepartment: async (dept: Department): Promise<void> => {
        const depts = await DepartmentService.getDepartments();
        const index = depts.findIndex(d => d.id === dept.id);
        if (index >= 0) depts[index] = dept; else depts.push(dept);
        await DataService.saveDepartments(depts);
    },

    canModifyStructure: (user: any, type: string, deptId: string): boolean => {
        const isGlobalAdmin = user.roleId === 'ROLE_CS' || user.roleId === 'ROLE_SEC_SERVICES';
        if (isGlobalAdmin) return true;
        return user.level === 2 && user.departmentId === deptId;
    },

    bulkImport: async (user: any, data: any[]): Promise<{ success: number; failed: number; errors: string[] }> => {
        let success = 0;
        let failed = 0;
        const errors: string[] = [];
        const isGlobalAdmin = user.roleId === 'ROLE_CS' || user.roleId === 'ROLE_SEC_SERVICES';

        for (const row of data) {
            try {
                if (!isGlobalAdmin && row.ParentId !== user.departmentId) {
                    throw new Error(`Unauthorized to import for ParentId: ${row.ParentId}`);
                }
                // Logical placement for record creation would happen here
                success++;
            } catch (e: any) {
                failed++;
                errors.push(e.message);
            }
        }
        return { success, failed, errors };
    },

    getDepartmentManager: (deptId: string) => {
        return {
            addWing: async (wing: any) => {
                const depts = await DepartmentService.getDepartments();
                const d = depts.find(x => x.id === deptId);
                if (!d) throw new Error("Department not found");
                wing.id = `wing_${Date.now()}`;
                d.wings.push(wing);
                await DepartmentService.saveDepartment(d);
            },
            addUnit: async (unit: any) => {
                const depts = await DepartmentService.getDepartments();
                const d = depts.find(x => x.id === deptId);
                if (!d) throw new Error("Department not found");
                unit.id = `unit_${Date.now()}`;
                d.units.push(unit);
                await DepartmentService.saveDepartment(d);
            },
            addProject: async (project: any) => {
                const depts = await DepartmentService.getDepartments();
                const d = depts.find(x => x.id === deptId);
                if (!d) throw new Error("Department not found");
                project.id = `proj_${Date.now()}`;
                d.projects.push(project);
                await DepartmentService.saveDepartment(d);
            },
            addLoan: async (loan: any) => {
                const depts = await DepartmentService.getDepartments();
                const d = depts.find(x => x.id === deptId);
                if (!d) throw new Error("Department not found");
                loan.id = `loan_${Date.now()}`;
                d.loans.push(loan);
                await DepartmentService.saveDepartment(d);
            },
            addAttachedDepartment: async (attached: any) => {
                const depts = await DepartmentService.getDepartments();
                const d = depts.find(x => x.id === deptId);
                if (!d) throw new Error("Department not found");
                attached.id = `att_dept_${Date.now()}`;
                d.attachedDepartments.push(attached);
                await DepartmentService.saveDepartment(d);
            }
        };
    }
};
