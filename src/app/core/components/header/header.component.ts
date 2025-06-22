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
}
