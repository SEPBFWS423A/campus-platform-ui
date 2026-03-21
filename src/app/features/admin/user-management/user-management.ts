import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserRole } from '../../../core/models/user-role';
import { AdminService, User } from '../admin.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../../core/services/notification.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    TranslateModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.scss'],
})
export class UserManagement implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  @ViewChild('formDirective') formDirective!: NgForm;

  rawRoles = Object.values(UserRole);
  rawFilterRoles = ['', ...Object.values(UserRole)];

  currentLang = toSignal(this.translate.onLangChange);

  translatedRoles = computed(() => {
    this.currentLang();
    return this.rawRoles.map(role => ({
      value: role,
      label: this.translate.instant('userRole.' + role),
    }));
  });

  translatedFilterRoles = computed(() => {
    this.currentLang();
    return this.rawFilterRoles.map(role => ({
      value: role,
      label: role ? this.translate.instant('userRole.' + role) : this.translate.instant('userManagement.allRoles'),
    }));
  });

  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  editingUser = signal<User | null>(null);
  isLoading = signal(false);

  invitationForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: [this.rawRoles[0], Validators.required],
  });

  filterForm = this.fb.group({
    role: [''],
    search: [''],
  });

  editForm = this.fb.group({
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
  });

  ngOnInit() {
    this.loadUsers();
    this.filterForm.valueChanges.subscribe(() => this.filterUsers());
  }

  loadUsers() {
    this.adminService.getUsers().subscribe(users => {
      this.users.set(users);
      this.filterUsers();
    });
  }

  filterUsers() {
    const { role, search } = this.filterForm.getRawValue();
    const searchTerm = (search || '').toLowerCase();

    this.filteredUsers.set(
      this.users().filter(user => {
        const roleMatch = !role || user.role === role;
        const searchMatch =
          user.email.toLowerCase().includes(searchTerm) ||
          (user.firstname && user.firstname.toLowerCase().includes(searchTerm)) ||
          (user.lastname && user.lastname.toLowerCase().includes(searchTerm));
        return roleMatch && searchMatch;
      })
    );
  }

  sendInvitation() {
    if (this.invitationForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    const { email, role } = this.invitationForm.getRawValue();

    this.adminService.inviteUser(email!, role! as UserRole).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.notificationService.showSuccess('userManagement.invitationSuccess', { email });
        this.formDirective.resetForm({
          role: this.rawRoles[0],
          email: '',
        });
      },
      error: err => {
        this.isLoading.set(false);
        this.notificationService.showError(err.error?.messageKey || 'userManagement.invitationFailure');
      },
    });
  }

  editUser(user: User) {
    this.editingUser.set(user);
    this.editForm.setValue({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
    });
  }

  cancelEdit() {
    this.editingUser.set(null);
  }

  saveUser() {
    if (this.editForm.invalid || !this.editingUser()) {
      return;
    }

    const editedUser = this.editingUser()!;
    const formValue = this.editForm.getRawValue();
    const updatedUser: User = {
      ...editedUser,
      firstname: formValue.firstname!,
      lastname: formValue.lastname!,
      email: formValue.email!,
      role: formValue.role! as UserRole,
    };

    this.adminService.updateUser(editedUser.id, updatedUser).subscribe({
      next: () => {
        this.users.update(users =>
          users.map(u => (u.id === updatedUser.id ? updatedUser : u))
        );
        this.filterUsers();
        this.cancelEdit();
        this.notificationService.showSuccess('userManagement.userUpdateSuccess');
      },
      error: err => {
        this.notificationService.showError(err.error?.messageKey || 'userManagement.userUpdateFailure');
      },
    });
  }

  deleteUser(userToDelete: User) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'userManagement.deleteUserTitle',
        message: 'userManagement.deleteUserMessage',
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.deleteUser(userToDelete.id).subscribe({
          next: () => {
            this.users.update(users => users.filter(user => user.id !== userToDelete.id));
            this.filterUsers();
            this.notificationService.showSuccess('userManagement.userDeleteSuccess');
          },
          error: err => {
            this.notificationService.showError(err.error?.messageKey || 'userManagement.userDeleteFailure');
          },
        });
      }
    });
  }
}
