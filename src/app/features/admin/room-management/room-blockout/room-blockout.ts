import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { AdminService, Room, RoomBlockout, BlockoutReason, BlockoutPriority, BlockoutConflictResult } from '../../admin.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BlockoutConflictDialog } from './blockout-conflict.dialog';

@Component({
  selector: 'app-room-blockout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatChipsModule,
    MatDatepickerModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './room-blockout.html',
  styleUrl: './room-blockout.scss'
})
export class RoomBlockoutComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  rooms = input<Room[]>([]);
  blockouts = signal<RoomBlockout[]>([]);
  
  displayedColumns = ['room', 'time', 'reason', 'priority', 'sla', 'status', 'actions'];

  createForm = this.fb.group({
    roomId: [null as number | null, Validators.required],
    startTime: [null as string | null, Validators.required],
    endTime: [null as string | null, Validators.required],
    reason: ['WARTUNG' as BlockoutReason, Validators.required],
    priority: ['MEDIUM' as BlockoutPriority, Validators.required],
    notes: ['']
  });

  reasons: BlockoutReason[] = ['WARTUNG', 'REINIGUNG', 'BAUARBEITEN', 'VERANSTALTUNG', 'STOERUNG', 'SONSTIGES'];
  priorities: BlockoutPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  ngOnInit() {
    this.loadBlockouts();
  }

  loadBlockouts() {
    this.adminService.getBlockouts().subscribe(data => {
      this.blockouts.set(data);
    });
  }

  onCreateBlockout() {
    if (this.createForm.invalid) return;

    const val = this.createForm.getRawValue();
    if (!val.roomId || !val.startTime || !val.endTime) return;

    this.adminService.checkBlockoutConflicts(val.roomId, val.startTime, val.endTime).subscribe(result => {
      if (result.affectedEvents.length > 0 || result.overlappingBlockouts.length > 0) {
        const dialogRef = this.dialog.open(BlockoutConflictDialog, {
          width: '500px',
          data: result
        });

        dialogRef.afterClosed().subscribe(confirm => {
          if (confirm) this.performCreate();
        });
      } else {
        this.performCreate();
      }
    });
  }

  private performCreate() {
    this.adminService.createBlockout(this.createForm.value as any).subscribe({
      next: () => {
        this.snackBar.open('Sperrung erfolgreich angelegt', 'OK', { duration: 3000 });
        this.loadBlockouts();
        this.createForm.reset({
          reason: 'WARTUNG',
          priority: 'MEDIUM'
        });
      },
      error: (err) => {
        this.snackBar.open('Fehler beim Anlegen der Sperrung', 'Schließen', { duration: 5000 });
      }
    });
  }

  onResolveBlockout(id: number) {
    this.adminService.resolveBlockout(id).subscribe(() => {
      this.snackBar.open('Sperrung aufgehoben', 'OK', { duration: 3000 });
      this.loadBlockouts();
    });
  }

  onDeleteBlockout(id: number) {
    if (confirm('Sperrung wirklich löschen?')) {
      this.adminService.deleteBlockout(id).subscribe(() => {
        this.snackBar.open('Sperrung gelöscht', 'OK', { duration: 3000 });
        this.loadBlockouts();
      });
    }
  }

  getPriorityColor(p: BlockoutPriority): string {
    switch (p) {
      case 'CRITICAL': return 'warn';
      case 'HIGH':     return 'accent';
      case 'MEDIUM':   return 'primary';
      case 'LOW':      return '';
      default:         return '';
    }
  }

  slaStatus(blockout: RoomBlockout): 'OK' | 'GEFAEHRDET' | 'VERLETZT' {
    const slaMinutes = { LOW: 10080, MEDIUM: 4320, HIGH: 1440, CRITICAL: 240 };
    const limit = slaMinutes[blockout.priority];
    const elapsed = (Date.now() - new Date(blockout.createdAt).getTime()) / 60000;
    if (blockout.active === false) return 'OK';
    if (elapsed > limit) return 'VERLETZT';
    if (elapsed > limit * 0.8) return 'GEFAEHRDET';
    return 'OK';
  }
}
