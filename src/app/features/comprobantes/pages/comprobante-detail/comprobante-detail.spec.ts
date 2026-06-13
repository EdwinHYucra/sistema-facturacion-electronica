import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { ComprobanteDetail } from './comprobante-detail';

describe('ComprobanteDetail', () => {
  let component: ComprobanteDetail;
  let fixture: ComponentFixture<ComprobanteDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprobanteDetail],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ComprobanteDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
