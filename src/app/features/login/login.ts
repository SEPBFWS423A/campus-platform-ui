import { Component } from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';
import {MatIcon} from '@angular/material/icon';
import {MatFormField, MatHint, MatInput, MatLabel} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {DatePipe} from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [
    TranslatePipe,
    MatIcon,
    MatInput,
    MatFormField,
    MatLabel,
    MatHint,
    MatButton,
    DatePipe
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  standalone: true
})
export class Login {
  currentDate = new Date();
}
