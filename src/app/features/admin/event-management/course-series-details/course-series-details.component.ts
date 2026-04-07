import { Component, OnInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormGroupDirective } from '@angular/forms';
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
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

import { AdminService, CourseSeries, CourseEvent, Room, Module, User, StudyGroup } from '../../admin.service';

@Component({
  selector: 'app-course-series-details',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule, 
    MatNativeDateModule, MatTableModule, MatIconModule, MatDividerModule, 
    MatCardModule, MatSnackBarModule, MatDialogModule, TranslateModule
  ],
  templateUrl: './course-series-details.component.html',
  styleUrl: './course-series-details.component.scss'
})
export class CourseSeriesDetailsComponent implements OnInit {
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
  eventColumns: string[] = ['name', 'eventType', 'startTime', 'room', 'actions'];
  events = signal<CourseEvent[]>([]);
  rooms = signal<Room[]>([]);
  availableRooms = signal<Room[]>([]);
  eventForm!: FormGroup;
  editingEventId: number | null = null;
  
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
    private translateService: TranslateService
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
      this.availableRooms.set(res);
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

    this.eventForm = this.fb.group({
      name: ['', Validators.required],
      eventType: ['LEHRVERANSTALTUNG', Validators.required],
      startDate: [null, Validators.required],
      startTime: ['', Validators.required],
      durationMinutes: [90, [Validators.required, Validators.min(1)]],
      roomId: [null]
    });

    this.setupRoomFiltering();
  }

  setupRoomFiltering() {
    this.eventForm.valueChanges.subscribe(() => {
      this.updateAvailableRooms();
    });
  }

  updateAvailableRooms() {
    const val = this.eventForm.value;
    if (val.startDate && val.startTime && val.durationMinutes) {
      const combined = this.prepareStartTime(val.startDate, val.startTime);
      this.adminService.getAvailableRooms(combined, val.durationMinutes, this.editingEventId || undefined).subscribe({
        next: (res) => {
          this.availableRooms.set(res);
          // If current selection is no longer in the list, clear it
          const currentRoomId = this.eventForm.get('roomId')?.value;
          if (currentRoomId && !res.find(r => r.id === currentRoomId)) {
            this.eventForm.get('roomId')?.setValue(null);
          }
        }
      });
    } else {
      this.availableRooms.set(this.rooms());
    }
  }

  prepareStartTime(date: any, time: string): string | undefined {
    if (!date || !time) return undefined;
    const d = new Date(date);
    const [hh, mm] = time.split(':');
    d.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
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
        // Sort events by startTime, handling potentially missing dates
        const sorted = [...res].sort((a, b) => {
          const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
          const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
          return timeA - timeB;
        });
        this.events.set(sorted);
        if (!this.editingEventId) {
          this.setDefaultEventName();
        }
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
        }
      });
    }
  }

  editEvent(event: CourseEvent) {
    this.editingEventId = event.id;
    let sDate = null;
    let sTime = '';
    
    if (event.startTime) {
      const d = new Date(event.startTime);
      sDate = d;
      const pad = (n: number) => n.toString().padStart(2, '0');
      sTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    this.eventForm.patchValue({
      name: event.name,
      eventType: event.eventType,
      startDate: sDate,
      startTime: sTime,
      durationMinutes: event.durationMinutes,
      roomId: event.roomId || null
    });
    this.updateAvailableRooms();
  }

  cancelEventEdit() {
    this.editingEventId = null;
    if (this.eventFormDirective) {
      this.eventFormDirective.resetForm({
        name: '',
        eventType: 'LEHRVERANSTALTUNG',
        startDate: null,
        startTime: '',
        durationMinutes: 90,
        roomId: null
      });
    } else {
      this.eventForm.reset({
        name: '',
        eventType: 'LEHRVERANSTALTUNG',
        startDate: null,
        startTime: '',
        durationMinutes: 90,
        roomId: null
      });
    }
    this.availableRooms.set(this.rooms());
    this.setDefaultEventName();
  }

  setDefaultEventName() {
    const s = this.series();
    if (s) {
      const nextNum = this.events().length + 1;
      this.eventForm.patchValue({
        name: `${s.moduleName} (${nextNum})`
      });
    }
  }

  saveEvent() {
    if (this.eventForm.valid) {
      const formVal = this.eventForm.value;
      
      let combinedStart: string | undefined = undefined;
      if (formVal.startDate && formVal.startTime) {
        const d = new Date(formVal.startDate);
        const [hh, mm] = formVal.startTime.split(':');
        d.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
        
        const pad = (n: number) => n.toString().padStart(2, '0');
        combinedStart = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
      }

      const request = {
        name: formVal.name,
        eventType: formVal.eventType,
        roomId: formVal.roomId,
        durationMinutes: formVal.durationMinutes,
        startTime: combinedStart
      };

      if (this.editingEventId) {
        this.adminService.updateEvent(this.editingEventId, request).subscribe({
          next: () => {
            this.translateService.get(['eventManagement.updatedSuccessfully', 'common.close']).subscribe(translations => {
              this.snackBar.open(translations['eventManagement.updatedSuccessfully'], translations['common.close'], { duration: 3000 });
            });
            this.cancelEventEdit();
            this.loadEvents();
          },
          error: (err) => {
            const errorMsg = err.error?.message || 'Failed to update event';
            this.translateService.get([errorMsg, 'common.close']).subscribe(translations => {
              this.snackBar.open(translations[errorMsg] || errorMsg, translations['common.close'], { duration: 5000 });
            });
          }
        });
      } else {
        this.adminService.createEvent(this.seriesId, request).subscribe({
          next: () => {
            this.translateService.get(['eventManagement.createdSuccessfully', 'common.close']).subscribe(translations => {
              this.snackBar.open(translations['eventManagement.createdSuccessfully'], translations['common.close'], { duration: 3000 });
            });
            this.cancelEventEdit();
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
    }
  }

  deleteEvent(id: number) {
    this.translateService.get(['eventManagement.confirmAction', 'eventManagement.confirmDeleteMsg', 'eventManagement.delete', 'eventManagement.cancel', 'eventManagement.deletedSuccessfully', 'common.close']).subscribe(translations => {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
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
}
