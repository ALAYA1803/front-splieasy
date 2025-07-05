import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SidebarItem } from '../../interfaces/sidebar-item';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  items: SidebarItem[] = [];
  user: any;
  loggingOut = false;

  private menuSubscription!: Subscription;

  constructor(
    private router: Router,
    private sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    const currentUserString = localStorage.getItem('currentUser');
    if (currentUserString) {
      this.user = JSON.parse(currentUserString);
    }
    this.menuSubscription = this.sidebarService.items$.subscribe(menuItems => {
      this.items = menuItems;
    });
  }

  ngOnDestroy(): void {
    if (this.menuSubscription) {
      this.menuSubscription.unsubscribe();
    }
  }
  trackByRoute(index: number, item: SidebarItem): string {
    return item.route;
  }
  openSettings(): void {
    if (!this.user || !this.user.role) {
      console.error('No se pudo determinar el rol del usuario para navegar a ajustes.');
      return;
    }

    const baseRoute = this.user.role === 'REPRESENTANTE' ? '/representante' : '/miembro';
    const settingsRoute = `${baseRoute}/settings`;

    this.router.navigate([settingsRoute]);
  }

  logout(): void {
    this.loggingOut = true;
    setTimeout(() => {
      localStorage.removeItem('currentUser');
      this.sidebarService.clearMenu();
      this.router.navigate(['/autenticacion/login']);
      this.loggingOut = false;
    }, 1500);
  }
}
