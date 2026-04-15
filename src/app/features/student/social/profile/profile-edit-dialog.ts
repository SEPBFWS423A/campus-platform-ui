import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { PublicProfileResponse } from '../social.service';

@Component({
  selector: 'app-profile-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule
  ],
  templateUrl: './profile-edit-dialog.html',
  styleUrl: './profile-edit-dialog.scss'
})
export class ProfileEditDialog implements OnInit {
  profileForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProfileEditDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { profile: PublicProfileResponse }
  ) {
    this.profileForm = this.fb.group({
      bio: [data.profile.bio || ''],
      interests: [data.profile.interests || ''],
      hobbies: [data.profile.hobbies || ''],
      skills: [data.profile.skills || '']
    });
  }

  ngOnInit(): void {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.dialogRef.close(this.profileForm.value);
    }
  }
}
