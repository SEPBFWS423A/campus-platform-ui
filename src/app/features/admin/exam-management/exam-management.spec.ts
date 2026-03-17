import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamManagement } from './exam-management';

describe('ExamManagement', () => {
  let component: ExamManagement;
  let fixture: ComponentFixture<ExamManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
