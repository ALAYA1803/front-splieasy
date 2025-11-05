import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { SidebarItem } from '../../interfaces/sidebar-item';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  breadcrumbDisplay = '';
  breadcrumbFull = '';
  items: SidebarItem[] = [];

  // Estado del modo oscuro (añadido)
  isDarkMode: boolean = false;

  private routerSubscription!: Subscription;

  constructor(
    private router: Router,
    private sidebarService: SidebarService
  ) {}

  ngOnInit() {
    this.items = this.sidebarService.getMenu();

    const currentUrl = this.router.url;
    this.findLabelForUrl(currentUrl);

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const newUrl = event.urlAfterRedirects;
        this.findLabelForUrl(newUrl);
      });

    // Inicializar preferencia de tema (copiado de NavBar)
    const saved = localStorage.getItem('theme');
    if (saved) {
      this.isDarkMode = saved === 'dark';
    } else if (window.matchMedia) {
      this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyTheme();
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
  }

  private findLabelForUrl(url: string) {
    const path = this.normalizePath(url);
    const match = this.items.find(item => this.normalizePath(item.route) === path);

    if (match) {
      this.breadcrumbFull = match.label;
      this.breadcrumbDisplay = match.label;
    } else {
      this.breadcrumbFull = '';
      this.breadcrumbDisplay = '';
    }
  }

  private normalizePath(url: string): string {
    return url.replace(/^\/+|\/+$/g, '').toLowerCase();
  }

  // Aplica o remueve la clase en el <body> (copiado de NavBar)
  applyTheme() {
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
      if (document.documentElement) document.documentElement.classList.add('dark-theme');
      try { (window as any).applyDarkBgFix && (window as any).applyDarkBgFix(); } catch(e) {}
    } else {
      document.body.classList.remove('dark-theme');
      if (document.documentElement) document.documentElement.classList.remove('dark-theme');
      try { (window as any).revertDarkBgFix && (window as any).revertDarkBgFix(); } catch(e) {}
    }
  }

  // Método ligado al botón del template
  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }
}
