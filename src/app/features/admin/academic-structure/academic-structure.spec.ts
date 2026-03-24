import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicStructure } from './academic-structure';

describe('AcademicStructure', () => {
  let component: AcademicStructure;
  let fixture: ComponentFixture<AcademicStructure>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcademicStructure]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcademicStructure);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
