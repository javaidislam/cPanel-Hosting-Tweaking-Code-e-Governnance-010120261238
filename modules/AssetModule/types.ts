
export type AssetCategory = 
  | 'Vehicle' 
  | 'Furniture' 
  | 'IT' 
  | 'Canal' 
  | 'Barrage' 
  | 'Road' 
  | 'Bridge' 
  | 'SchoolBuilding' 
  | 'HospitalBuilding' 
  | 'OfficeBuilding' 
  | 'ResidentialBuilding';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  departmentId: string;
  location: string;
  acquisitionDate: string;
  value: number;
  condition: 'Good' | 'Fair' | 'Poor' | 'Condemned';
  specifications: Record<string, string | number>; // Flexible attributes
}
