import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmissionsOverview } from './submissions-overview';

describe('SubmissionsOverview', () => {
  let component: SubmissionsOverview;
  let fixture: ComponentFixture<SubmissionsOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmissionsOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubmissionsOverview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
