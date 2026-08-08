export type Gender = 'MALE' | 'FEMALE' | 'UNKNOWN';

export interface Person {
  id?: number;
  firstName: string;
  lastName: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  notes?: string;
  photoUrl?: string;
  gender?: Gender;
  fatherId?: number;
  motherId?: number;
  spouseId?: number;
  parentId?: number;
  sourceReference?: string;
  treeId?: number;
}
