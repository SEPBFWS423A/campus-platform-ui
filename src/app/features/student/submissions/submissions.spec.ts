import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Submissions } from './submissions';

describe('Submissions', () => {
  let component: Submissions;
  let fixture: ComponentFixture<Submissions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Submissions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Submissions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
