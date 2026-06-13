import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SunatCdr } from './sunat-cdr';

describe('SunatCdr', () => {
  let component: SunatCdr;
  let fixture: ComponentFixture<SunatCdr>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SunatCdr],
    }).compileComponents();

    fixture = TestBed.createComponent(SunatCdr);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
