import { Component, OnInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormGroupDirective, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { AutoScheduleDialog } from '../auto-schedule-dialog/auto-schedule-dialog';

import { AdminService, CourseSeries, CourseEvent, Room, Module, User, StudyGroup } from '../../admin.service';

@Component({
  selector: 'app-course-series-details',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule, 
    MatNativeDateModule, MatTableModule, MatIconModule, MatDividerModule, 
    MatCardModule, MatSnackBarModule, MatDialogModule, TranslateModule
  ],
  templateUrl: './course-series-details.html',
  styleUrl: './course-series-details.scss'
})
export class CourseSeriesDetails implements OnInit {
  @ViewChild('seriesFormDirective') seriesFormDirective!: FormGroupDirective;
  @ViewChild('eventFormDirective') eventFormDirective!: FormGroupDirective;

  seriesId!: number;
  series = signal<CourseSeries | null>(null);

  // Series Edit Config
  seriesForm!: FormGroup;
  modules = signal<Module[]>([]);
  lecturers: User[] = [];
  allGroups = signal<StudyGroup[]>([]);
  selectedModuleId = signal<number | null>(null);

  // Event Config
  eventColumns: string[] = ['name', 'eventType', 'startTime', 'duration', 'room', 'actions'];
  events = signal<any[]>([]);
  rooms = signal<Room[]>([]);
  availableRoomsPerRow = signal<Record<number, Room[]>>({});
  
  filteredGroups = computed(() => {
    const modId = this.selectedModuleId();
    if (!modId) return [];

    const mod = this.modules().find(m => m.id?.toString() === modId.toString());
    if (!mod) return [];

    return this.allGroups().filter(group => {
      if (mod.specializationId) {
        return group.specializationId?.toString() === mod.specializationId.toString();
      } else {
        return group.courseOfStudyId?.toString() === mod.courseOfStudyId?.toString();
      }
    });
  });

  currentModule = computed(() => this.modules().find(m => m.id?.toString() === this.series()?.moduleId?.toString()));
  requiredMinutes = computed(() => (this.currentModule()?.requiredTotalHours || 0) * 60);
  totalPlannedMinutes = computed(() => this.events().reduce((sum, e) => sum + (e.durationMinutes || 0), 0));
  isPlanningComplete = computed(() => this.totalPlannedMinutes() >= this.requiredMinutes());
  missingMinutes = computed(() => Math.max(0, this.requiredMinutes() - this.totalPlannedMinutes()));
  missingHours = computed(() => Math.floor(this.missingMinutes() / 60));
  missingMinutesDisplay = computed(() => this.missingMinutes() % 60);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public translateService: TranslateService
  ) {
    this.createForms();
  }

  ngOnInit() {
    this.seriesId = Number(this.route.snapshot.paramMap.get('id'));

    // Load prerequisites
    this.adminService.getModules().subscribe(res => this.modules.set(res));
    this.adminService.getUsers().subscribe(res => this.lecturers = res.filter(u => u.role?.toString() === 'LECTURER'));
    this.adminService.getGroups().subscribe(res => this.allGroups.set(res.map(g => ({ ...g, courseOfStudy: g.courseOfStudyName }))));
    this.adminService.getRooms().subscribe(res => {
      this.rooms.set(res);
    });

    this.loadSeriesAndEvents();
  }

  createForms() {
    this.seriesForm = this.fb.group({
      moduleId: [null, Validators.required],
      assignedLecturerId: [null, Validators.required],
      status: ['PLANNED', Validators.required],
      selectedExamTypeId: [null],
      submissionStartDate: [null],
      submissionDeadline: [null],
      studyGroupIds: [[], [Validators.required, Validators.minLength(1)]]
    });

    this.seriesForm.get('moduleId')?.valueChanges.subscribe(modId => {
      this.selectedModuleId.set(modId);
      const currentLecturerId = this.seriesForm.get('assignedLecturerId')?.value;
      if (currentLecturerId) {
        const stillValid = this.selectedModuleLecturers.some(l => l.id?.toString() === currentLecturerId.toString());
        if (!stillValid) {
          this.seriesForm.get('assignedLecturerId')?.setValue(null);
        }
      }

      const mod = this.modules().find(m => m.id?.toString() === modId?.toString());
      if (mod && mod.preferredExamTypeId) {
        this.seriesForm.get('selectedExamTypeId')?.setValue(Number(mod.preferredExamTypeId));
      } else {
        this.seriesForm.get('selectedExamTypeId')?.setValue(null);
      }

      const selectedGroupIds = this.seriesForm.get('studyGroupIds')?.value as (number | string)[] || [];
      const validGroupIds = this.filteredGroups().map(g => g.id.toString());
      const newSelection = selectedGroupIds.filter(id => validGroupIds.includes(id.toString()));
      this.seriesForm.get('studyGroupIds')?.setValue(newSelection);
    });

  }

  loadSeriesAndEvents() {
    this.adminService.getCourseSeriesById(this.seriesId).subscribe({
      next: (res) => {
        this.series.set(res);
        this.selectedModuleId.set(res.moduleId);
        this.seriesForm.patchValue({
          moduleId: res.moduleId,
          assignedLecturerId: res.assignedLecturerId,
          status: res.status,
          selectedExamTypeId: res.selectedExamTypeId || null,
          submissionStartDate: res.submissionStartDate ? new Date(res.submissionStartDate) : null,
          submissionDeadline: res.submissionDeadline ? new Date(res.submissionDeadline) : null,
          studyGroupIds: res.studyGroups?.map(sg => sg.id) || []
        });
      },
      error: () => this.goBack()
    });

    this.loadEvents();
  }

  loadEvents() {
    this.adminService.getEventsForSeries(this.seriesId).subscribe({
      next: (res) => {
        const parsedEvents = res.map(e => {
          let editDateObj: Date | null = null;
          let eTime = '';
          if (e.startTime) {
            editDateObj = new Date(e.startTime);
            const pad = (n: number) => n.toString().padStart(2, '0');
            eTime = `${pad(editDateObj.getHours())}:${pad(editDateObj.getMinutes())}`;
          }
          let evRoomIds = e.rooms?.map((r: any) => r.id) || [];
          return { ...e, editDate: editDateObj, editTime: eTime, editRoomIds: evRoomIds };
        });

        const sorted = parsedEvents.sort((a, b) => {
          const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
          const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
          return timeA - timeB;
        });
        
        this.events.set(sorted);
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/event-management']);
  }

  get selectedModuleLecturers() {
    const modId = this.selectedModuleId();
    if (!modId) return [];
    const mod = this.modules().find(m => m.id?.toString() === modId?.toString());
    return mod?.lecturers || [];
  }

  get selectedModuleExamTypes() {
    const modId = this.selectedModuleId();
    if (!modId) return [];
    const mod = this.modules().find(m => m.id?.toString() === modId?.toString());
    return mod?.possibleExamTypes || [];
  }

  get showSubmissionDates(): boolean {
    const examTypeId = this.seriesForm.get('selectedExamTypeId')?.value;
    if (!examTypeId) return false;
    
    // Convert to string to ensure comparison works regardless of type
    const examType = this.selectedModuleExamTypes.find(et => et.id?.toString() === examTypeId.toString());
    if (!examType) return false;
    
    // RF = Referat (Presentation), SA = Studienarbeit (Term Paper)
    const type = examType.type?.toUpperCase();
    return type === 'RF' || type === 'SA';
  }

  saveSeries() {
    if (this.seriesForm.valid) {
      this.adminService.updateCourseSeries(this.seriesId, this.seriesForm.value).subscribe({
        next: () => {
          this.translateService.get(['eventManagement.updatedSuccessfully', 'common.close']).subscribe(translations => {
            this.snackBar.open(translations['eventManagement.updatedSuccessfully'], translations['common.close'], { duration: 3000 });
          });
          this.loadSeriesAndEvents();
        },
        error: (err) => {
          const messageKey = err.error?.message || 'eventManagement.failedToUpdate';
          this.snackBar.open(this.translateService.instant(messageKey), this.translateService.instant('common.close'), { duration: 5000 });
        }
      });
    }
  }

  updateEventInline(event: any, field: string, value: any) {
    let combinedStart: string | undefined = undefined;
    if (event.editDate && event.editTime) {
       const d = new Date(event.editDate);
       const pad = (n: number) => n.toString().padStart(2, '0');
       const dateStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
       combinedStart = `${dateStr}T${event.editTime}:00`;
    }

    const request: any = {
      name: event.name,
      eventType: event.eventType,
      roomIds: event.editRoomIds,
      durationMinutes: event.durationMinutes,
      startTime: combinedStart
    };
    
    if (field === 'editRoomIds') {
        request.roomIds = value; 
    }

    this.adminService.updateEvent(event.id, request).subscribe({
      next: () => {
         this.loadEvents();
      },
      error: (err) => {
         this.loadEvents(); // Re-sync UI with server state to perform rollback
         const errorMsg = err.error?.message || 'Failed to update event';
         this.translateService.get([errorMsg, 'common.close']).subscribe(translations => {
            this.snackBar.open(translations[errorMsg] || errorMsg, translations['common.close'], { duration: 5000 });
         });
      }
    });
  }

  loadAvailableRooms(element: any) {
    if (!element.startTime || !element.durationMinutes) {
       this.availableRoomsPerRow.update(prev => ({
         ...prev,
         [element.id]: this.rooms()
       }));
       return;
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const d = new Date(element.startTime);
    // Format to ISO-like string expected by backend if needed, or use existing startTime string if it's already compatible
    // The input type="date" and "time" were combined in my previous step into element.editDate/editTime
    
    // We already have element.startTime as a full ISO string from loadEvents or updateEventInline
    this.adminService.getAvailableRooms(
      element.startTime, 
      element.durationMinutes, 
      element.id,
      this.seriesId,
      element.eventType
    ).subscribe(res => {
      // Ensure currently selected rooms are always in the list
      const merged = [...res];
      const currentRooms = element.rooms || [];
      currentRooms.forEach((r: any) => {
        if (!merged.find(m => m.id === r.id)) {
          merged.push(r);
        }
      });
      
      this.availableRoomsPerRow.update(prev => ({
        ...prev,
        [element.id]: merged
      }));
    });
  }

  fastAddEvent() {
    this.adminService.fastAddEvent(this.seriesId).subscribe({
      next: () => {
         this.translateService.get(['common.success', 'common.close']).subscribe(translations => {
            this.snackBar.open(translations['common.success'], translations['common.close'], { duration: 2000 });
         });
         this.loadEvents();
      },
      error: (err) => {
         const errorMsg = err.error?.message || 'Failed to add event';
         this.translateService.get([errorMsg, 'common.close']).subscribe(translations => {
            this.snackBar.open(translations[errorMsg] || errorMsg, translations['common.close'], { duration: 5000 });
         });
      }
    });
  }

  deleteEvent(id: number) {
    this.translateService.get(['eventManagement.confirmAction', 'eventManagement.confirmDeleteMsg', 'eventManagement.delete', 'eventManagement.cancel', 'eventManagement.deletedSuccessfully', 'common.close']).subscribe(translations => {
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        data: {
          title: translations['eventManagement.confirmAction'],
          message: translations['eventManagement.confirmDeleteMsg'],
          confirmText: translations['eventManagement.delete'],
          cancelText: translations['eventManagement.cancel']
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.adminService.deleteEvent(id).subscribe(() => {
            this.snackBar.open(translations['eventManagement.deletedSuccessfully'], translations['common.close'], { duration: 3000 });
            this.loadEvents();
          });
        }
      });
    });
  }

  getRoomNames(element: CourseEvent): string {
    return element.rooms?.map(r => r.name).join(', ') || '-';
  }

  openAutoScheduleDialog() {
    const dialogRef = this.dialog.open(AutoScheduleDialog, {
      width: '750px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { seriesId: this.seriesId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.autoSchedule(this.seriesId, result).subscribe({
          next: () => {
            this.translateService.get(['common.success', 'common.close']).subscribe(translations => {
              this.snackBar.open(translations['common.success'], translations['common.close'], { duration: 3000 });
            });
            this.loadEvents();
          },
          error: (err) => {
            const errorMsg = err.error?.message || 'Failed to trigger auto-scheduling';
            this.translateService.get([errorMsg, 'common.close']).subscribe(translations => {
              this.snackBar.open(translations[errorMsg] || errorMsg, translations['common.close'], { duration: 5000 });
            });
          }
        });
      }
    });
  }
}
