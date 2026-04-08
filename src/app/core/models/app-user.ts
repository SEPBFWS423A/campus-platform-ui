import { UserRole } from './user-role';
import { Salutation } from './salutation';
import { AcademicTitle } from './academic-title';

export interface AppUser {
  id: number;
  salutation?: Salutation;
  title?: AcademicTitle;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  enabled: boolean;
  theme?: string;
  brightness?: string;
  language?: string;
}
