import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Downloads } from './downloads';

describe('Downloads', () => {
  let component: Downloads;
  let fixture: ComponentFixture<Downloads>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Downloads]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Downloads);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
