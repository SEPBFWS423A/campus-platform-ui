import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Absences } from './absences';

describe('Absences', () => {
  let component: Absences;
  let fixture: ComponentFixture<Absences>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Absences]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Absences);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
