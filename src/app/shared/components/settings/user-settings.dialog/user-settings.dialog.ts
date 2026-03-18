import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { ThemeController } from '../../../../core/theme/theme-controller';
import { THEME_PALETTE_OPTIONS, ThemeBrightness } from '../../../../core/theme/theme-options';
import { Auth } from '../../../../core/auth/auth';
import { MatIcon } from "@angular/material/icon";
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { Router } from '@angular/router';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-user-settings-dialog',
  templateUrl: './user-settings.dialog.html',
  styleUrls: ['./user-settings.dialog.scss'],
  imports: [CommonModule, MatDialogTitle, MatDialogContent, MatIcon, MatDialogActions, MatDialogClose, TranslatePipe, MatRadioGroup, MatRadioButton, MatButton, FormsModule]
})
export class UserSettingsDialog {
  themeController = inject(ThemeController);
  auth = inject(Auth);
  dialogRef = inject(MatDialogRef<UserSettingsDialog>);
  translateService = inject(TranslateService);
  router = inject(Router);

  themeOptions = THEME_PALETTE_OPTIONS;
  ThemeBrightness = ThemeBrightness;

  navigateToChangePassword() {
    this.router.navigate(['/common/change-password']);
    this.dialogRef.close();
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
