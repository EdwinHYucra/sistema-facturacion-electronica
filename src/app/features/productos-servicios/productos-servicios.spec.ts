import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductosServicios } from './productos-servicios';

describe('ProductosServicios', () => {
  let component: ProductosServicios;
  let fixture: ComponentFixture<ProductosServicios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosServicios],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductosServicios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
