import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { User, StudyGroup } from '../../../features/admin/admin.service';

@Component({
  selector: 'app-user-profile-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './user-profile-overview.html',
  styleUrl: './user-profile-overview.scss'
})
export class UserProfileOverviewComponent {
  private translate = inject(TranslateService);

  @Input({ required: true }) user!: User;
  @Input() userGroups: StudyGroup[] = [];
  @Input() isEditing = false; // Internal state might be managed by parent, but we might need it

  @Output() startEdit = new EventEmitter<void>();
  @Output() deleteUser = new EventEmitter<User>();
  @Output() removeUserFromGroup = new EventEmitter<{ userId: string, groupId: string }>();

  getProfileDisplayName(u: any) {
    const sal = u.salutation ? this.translate.instant('userManagement.salutations.' + u.salutation.toUpperCase()) : '';
    const title = u.title ? this.translate.instant('userManagement.academicTitles.' + u.title.toUpperCase()) : '';
    const parts = [sal, title, u.firstName, u.lastName].filter(p => !!p);
    return parts.join(' ');
  }

  getRoleColor(role: string): 'primary' | 'accent' | 'warn' | '' {
    switch (role) {
      case 'ADMIN': return 'warn';
      case 'LECTURER': return 'accent';
      case 'STUDENT': return 'primary';
      default: return '';
    }
  }

  getEnabledColor(enabled: boolean): 'primary' | 'warn' | '' {
    return enabled ? '' : 'warn';
  }

  onStartEdit() {
    this.startEdit.emit();
  }

  onDeleteUser() {
    this.deleteUser.emit(this.user);
  }

  onRemoveFromGroup(groupId: string) {
    this.removeUserFromGroup.emit({ userId: this.user.id, groupId });
  }
}
