import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { GradesService } from './grades.services';
import { StudentGradeOverviewItemResponse } from '../models/grades.models';

describe('GradesService.calculateWeightedAverage', () => {
  let service: GradesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GradesService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(GradesService);
  });

  const mockItem = (grade: number | null, status: string, ects: number | null = null): StudentGradeOverviewItemResponse => ({
    courseSeriesId: 1,
    moduleName: 'Test',
    grade,
    status: status as any,
    ects,
    attemptNumber: 1,
    examDate: '2024-01-01',
    lastUpdatedAt: '2024-01-01',
    assessmentType: null,
    academicTerm: null,
    studyGroupNames: [],
    reviewerComment: null
  });

  it('sollte null zurückgeben, wenn keine Items vorhanden sind', () => {
    expect(service.calculateWeightedAverage([])).toBeNull();
  });

  it('sollte einfachen Durchschnitt ohne ECTS (weight=1) korrekt berechnen', () => {
    const items = [
      mockItem(1.0, 'PASSED'), 
      mockItem(2.0, 'PASSED')  
    ];
    // (1.0 + 2.0) / 2 = 1.5
    expect(service.calculateWeightedAverage(items)).toBe(1.5);
  });

  it('sollte ECTS-gewichteten Durchschnitt korrekt berechnen', () => {
    const items = [
      mockItem(1.0, 'PASSED', 5),  
      mockItem(4.0, 'FAILED', 10)  
    ];
    // (1.0 * 5 + 4.0 * 10) / 15 = 45 / 15 = 3.0
    expect(service.calculateWeightedAverage(items)).toBe(3.0);
  });

  it('sollte NICHT automatisch runden (Rundung erfolgt im Template)', () => {
    const items = [
      mockItem(1.2, 'PASSED', 1),
      mockItem(1.3, 'PASSED', 1)
    ];
    // (1.2 + 1.3) / 2 = 1.25 -> sollte 1.25 zurückgeben (keine Rundung auf 1.3 in der Methode)
    expect(service.calculateWeightedAverage(items)).toBe(1.25);
  });

  it('sollte PENDING-Items einbeziehen (da kein Status-Filter mehr)', () => {
    const items = [
      mockItem(1.0, 'PASSED', 5),
      mockItem(4.0, 'PENDING', 5)
    ];
    // (1.0 * 5 + 4.0 * 5) / 10 = 25 / 10 = 2.5
    expect(service.calculateWeightedAverage(items)).toBe(2.5);
  });

  it('sollte Items mit grade === null ignorieren', () => {
    const items = [
      mockItem(1.0, 'PASSED', 5),
      mockItem(null, 'PASSED', 5)
    ];
    expect(service.calculateWeightedAverage(items)).toBe(1.0);
  });

  it('sollte weight=1 verwenden, wenn ECTS 0 oder null ist', () => {
    const items = [
      mockItem(1.0, 'PASSED', 0),    // weight 1
      mockItem(3.0, 'PASSED', null) // weight 1
    ];
    expect(service.calculateWeightedAverage(items)).toBe(2.0);
  });
});
