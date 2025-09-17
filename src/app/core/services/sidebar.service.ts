import { Injectable } from '@angular/core';
import { SidebarItem } from '../interfaces/sidebar-item';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { TranslateService } from '@ngx-translate/core';
import { OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService implements OnDestroy {
  private itemsSubject = new BehaviorSubject<SidebarItem[]>([]);
  items$ = this.itemsSubject.asObservable();

  private lastRole: string | null = null;
  private langSub?: Subscription;

  constructor(
    private authService: AuthService,
    private translate: TranslateService
  ) {
    // Regenera etiquetas al cambiar idioma
    this.langSub = this.translate.onLangChange.subscribe(() => {
      if (this.lastRole) {
        const items = this.buildItems(this.lastRole);
        this.itemsSubject.next(items);
      }
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  generateMenu() {
    const userId = Number(localStorage.getItem('userId'));
    if (!userId) {
      this.itemsSubject.next([]);
      return;
    }

    this.authService.getUserById(userId).subscribe({
      next: (user) => {
        const role = user?.roles?.[0] || '';
        this.lastRole = role;
        const items = this.buildItems(role);
        this.itemsSubject.next(items);
      },
      error: (err) => {
        console.error('Error cargando usuario para generar menú:', err);
        this.itemsSubject.next([]);
      }
    });
  }

  private buildItems(role: string): SidebarItem[] {
    const baseRoute = role === 'ROLE_REPRESENTANTE' ? '/representante' : '/miembro';

    if (role === 'ROLE_REPRESENTANTE') {
      return [
        { label: this.translate.instant('SIDEBAR2.HOME'),          icon: 'pi pi-home',       route: `${baseRoute}/home` },
        { label: this.translate.instant('SIDEBAR2.MEMBERS'),       icon: 'pi pi-users',      route: `${baseRoute}/members` },
        { label: this.translate.instant('SIDEBAR2.BILLS'),         icon: 'pi pi-file',       route: `${baseRoute}/bills` },
        { label: this.translate.instant('SIDEBAR2.CONTRIBUTIONS'), icon: 'pi pi-dollar',     route: `${baseRoute}/contributions` },
        { label: this.translate.instant('SIDEBAR2.SETTINGS'),      icon: 'pi pi-cog',        route: `${baseRoute}/settings` }
      ];
    } else {
      return [
        { label: this.translate.instant('SIDEBAR2.HOME'),          icon: 'pi pi-home',       route: `${baseRoute}/home` },
        { label: this.translate.instant('SIDEBAR2.CONTRIBUTIONS'), icon: 'pi pi-dollar',     route: `${baseRoute}/contributions` },
        { label: this.translate.instant('SIDEBAR2.STATUS'),        icon: 'pi pi-chart-line', route: `${baseRoute}/status` },
        { label: this.translate.instant('SIDEBAR2.SETTINGS'),      icon: 'pi pi-cog',        route: `${baseRoute}/settings` }
      ];
    }
  }

  getMenu(): SidebarItem[] {
    return this.itemsSubject.value;
  }

  clearMenu() {
    this.itemsSubject.next([]);
    this.lastRole = null;
  }
}
