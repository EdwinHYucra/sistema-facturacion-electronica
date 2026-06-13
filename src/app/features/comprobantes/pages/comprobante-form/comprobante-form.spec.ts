import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { ComprobanteForm } from './comprobante-form';

describe('ComprobanteForm', () => {
  let component: ComprobanteForm;
  let fixture: ComponentFixture<ComprobanteForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprobanteForm],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ComprobanteForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
