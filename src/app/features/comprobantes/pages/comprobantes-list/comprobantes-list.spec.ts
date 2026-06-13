import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { ComprobantesList } from './comprobantes-list';

describe('ComprobantesList', () => {
  let component: ComprobantesList;
  let fixture: ComponentFixture<ComprobantesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprobantesList],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ComprobantesList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
