import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LecturerHome } from './lecturer-home';

describe('LecturerHome', () => {
  let component: LecturerHome;
  let fixture: ComponentFixture<LecturerHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LecturerHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LecturerHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
