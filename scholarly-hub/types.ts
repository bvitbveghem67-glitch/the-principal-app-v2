
export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
  NONE = 'NONE'
}

export type ResourceType = 'PDF' | 'VIDEO' | 'ANNOUNCEMENT' | 'TIMETABLE';

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  description: string;
  url?: string;
  createdAt: number;
}

export interface SchoolClass {
  id: string;
  name: string;
  teacher: string;
  resources: Resource[];
}

export interface School {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  studentPassword: string;
  adminPassword: string;
  classes: SchoolClass[];
}
