import { Injectable } from '@angular/core';
import { SidebarItem } from '../interfaces/sidebar-item';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private itemsSubject = new BehaviorSubject<SidebarItem[]>([]);
  items$ = this.itemsSubject.asObservable();

  constructor() {
    this.generateMenu();
  }

  /**
   * Llama esto después del login y también en logout si deseas limpiar el menú.
   */
  generateMenu() {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');

    if (!user || !user.role) {
      this.itemsSubject.next([]);
      return;
    }

    const role = user.role;
    const baseRoute = role === 'REPRESENTANTE' ? '/representante' : '/miembro';

    let items: SidebarItem[] = [];

    if (role === 'REPRESENTANTE') {
      items = [
        { label: 'Home', icon: 'pi pi-home', route: `${baseRoute}/home` },
        { label: 'Miembros', icon: 'pi pi-users', route: `${baseRoute}/members` },
        { label: 'Cuentas', icon: 'pi pi-file', route: `${baseRoute}/bills` },
        { label: 'Contribuciones', icon: 'pi pi-dollar', route: `${baseRoute}/contributions` },
        { label: 'Ajustes', icon: 'pi pi-cog', route: `${baseRoute}/settings` }
      ];
    } else {
      items = [
        { label: 'Home', icon: 'pi pi-home', route: `${baseRoute}/home` },
        { label: 'Contribuciones', icon: 'pi pi-dollar', route: `${baseRoute}/contributions` },
        { label: 'Estado', icon: 'pi pi-chart-line', route: `${baseRoute}/status` },
        { label: 'Ajustes', icon: 'pi pi-cog', route: `${baseRoute}/settings` }
      ];
    }

    this.itemsSubject.next(items);
  }

  /**
   * Devuelve los ítems actuales del menú.
   */
  getMenu(): SidebarItem[] {
    return this.itemsSubject.value;
  }

  /**
   * Limpia el menú al hacer logout.
   */
  clearMenu() {
    this.itemsSubject.next([]);
  }
}
