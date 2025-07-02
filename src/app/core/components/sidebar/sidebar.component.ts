import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarItem } from '../../interfaces/sidebar-item';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Output() onNavigate = new EventEmitter<void>();
  items: SidebarItem[] = [];
  user: any;

  constructor(
    private router: Router,
    private sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    this.items = this.sidebarService.getMenu();

    const currentUserString = localStorage.getItem('currentUser');
    if (currentUserString) {
      this.user = JSON.parse(currentUserString);
    }
  }


  logout() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/autenticacion/login']);
  }
}
