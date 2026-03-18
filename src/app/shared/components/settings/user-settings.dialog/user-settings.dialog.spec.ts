import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSettingsDialog } from './user-settings.dialog';

describe('UserSettingsDialog', () => {
  let component: UserSettingsDialog;
  let fixture: ComponentFixture<UserSettingsDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSettingsDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserSettingsDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
