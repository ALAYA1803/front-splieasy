import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarItem } from '../../interfaces/sidebar-item';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  items: SidebarItem[] = [];

  constructor(
    private router: Router,
    private sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    this.items = this.sidebarService.getMenu();
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }

  logout() {
  localStorage.removeItem('currentUser');
  this.router.navigate(['/autenticacion/login']);
}
}
