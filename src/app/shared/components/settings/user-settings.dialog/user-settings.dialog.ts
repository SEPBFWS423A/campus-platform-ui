import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { ThemeController, } from '../../../../core/theme/theme-controller';
import { THEME_PALETTE_OPTIONS, ThemeBrightness } from '../../../../core/theme/theme-options';
import {Auth} from '../../../../core/auth/auth';
import { MatIcon } from "@angular/material/icon";
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-settings-dialog',
  templateUrl: './user-settings.dialog.html',
  styleUrls: ['./user-settings.dialog.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogTitle, MatDialogContent, MatIcon, MatDialogActions, MatDialogClose, TranslatePipe, MatRadioGroup, MatRadioButton, MatButton, MatFormFieldModule, MatInputModule, MatSnackBarModule]
})
export class UserSettingsDialog {
  themeController = inject(ThemeController);
  auth = inject(Auth);
  dialogRef = inject(MatDialogRef<UserSettingsDialog>);
  snackBar = inject(MatSnackBar);
  translateService = inject(TranslateService);
  fb = inject(FormBuilder);

  themeOptions = THEME_PALETTE_OPTIONS;
  ThemeBrightness = ThemeBrightness;

  isChangingPassword = false;

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(g: AbstractControl): ValidationErrors | null {
    const newPassword = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  toggleChangePassword() {
    this.isChangingPassword = !this.isChangingPassword;
    if (!this.isChangingPassword) {
      this.passwordForm.reset();
    }
  }

  submitNewPassword() {
    if (this.passwordForm.valid) {
      const { currentPassword, newPassword } = this.passwordForm.value;
      this.auth.changePassword(currentPassword, newPassword);
      this.isChangingPassword = false;
      this.passwordForm.reset();

      this.snackBar.open(
        this.translateService.instant('navigation.profileAndSettings.passwordChangedSuccess'),
        this.translateService.instant('navigation.profileAndSettings.close'),
        { duration: 3000 }
      );
    }
  }

  toggleBrightness() {
    const newBrightness = this.themeController.activeBrightness === ThemeBrightness.light 
      ? ThemeBrightness.dark 
      : ThemeBrightness.light;
    this.themeController.setBrightness(newBrightness);
  }

  logout() {
    this.auth.logout();
    this.dialogRef.close();
  }
}