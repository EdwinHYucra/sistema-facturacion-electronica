import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';

@Component({
  selector: 'app-layout-admin',
  imports: [RouterOutlet, Sidebar, Header],
  templateUrl: './layout-admin.html',
  styleUrl: './layout-admin.css'
})
export class LayoutAdmin {
  sidebarOpen = false;

  abrirMenu(): void {
    this.sidebarOpen = true;
  }

  cerrarMenu(): void {
    this.sidebarOpen = false;
  }
}
