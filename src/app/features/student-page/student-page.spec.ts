import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentPage } from './student-page';

describe('StudentPage', () => {
  let component: StudentPage;
  let fixture: ComponentFixture<StudentPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
