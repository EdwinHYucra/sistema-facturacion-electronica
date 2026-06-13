import { Component, EventEmitter, Output } from '@angular/core';
import { LucideAngularModule, Menu } from 'lucide-angular';

@Component({
  selector: 'app-header',
  imports: [LucideAngularModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  @Output() menuClick = new EventEmitter<void>();

  menuIcon = Menu;
}
