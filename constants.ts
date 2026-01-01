
import { DesignationLevel, Official } from './types/shared';
import { DesignationService } from './services/DesignationService';
import { DataService } from './services/dataService.ts';

/**
 * DYNAMIC SYSTEM CONSTANTS
 * 
 * This module avoids hard-coding by resolving values from the application services
 * during initialization. This ensures consistency with the database/localStorage state.
 */

// 1. Resolve level-to-functional-label mapping from DesignationService
const levelMetadata = await DesignationService.getLevelMetadata();

// 2. Resolve the seeded users from DataService
const allUsers = await DataService.getUsers();

// --- AUTHORITATIVE EXPORTS ---

/**
 * Functional metadata for each Designation Level.
 * Dynamically resolved from the Designation dataset.
 */
export const DESIGNATION_LEVEL_METADATA = levelMetadata;

/**
 * The standard 'Current User' for mock/prototype entry points.
 * Dynamically located in the current User dataset.
 */
export const CURRENT_USER: Official = allUsers.find(u => u.id === 'usr_sec_ga') || allUsers[0];

/**
 * A dynamically calculated 'Superior' official.
 * Logic: Finds an official with a lower numerical designation level (higher seniority).
 */
export const MOCK_SUPERIOR: Official = allUsers.find(u => u.level < (CURRENT_USER?.level || 8)) || allUsers[0];

/**
 * Full dynamic set of Provinicial Designations.
 */
export const ALL_DESIGNATIONS = await DesignationService.getDesignations();
