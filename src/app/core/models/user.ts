import { UserRole } from './user-role';

export interface User {
  id: number;
  salutation?: string;
  title?: string;
  firstname: string;
  lastname: string;
  email: string;
  role: UserRole;
  enabled: boolean;
  theme?: string;
  brightness?: string;
}
