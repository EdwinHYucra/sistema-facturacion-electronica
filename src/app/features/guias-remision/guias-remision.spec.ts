import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuiasRemision } from './guias-remision';

describe('GuiasRemision', () => {
  let component: GuiasRemision;
  let fixture: ComponentFixture<GuiasRemision>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuiasRemision],
    }).compileComponents();

    fixture = TestBed.createComponent(GuiasRemision);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
