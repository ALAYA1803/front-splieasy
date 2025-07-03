import { Component, HostListener } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

interface NavLink {
  label: string;
  fragment: string;
}

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [NgFor, RouterModule, TranslateModule, LanguageSwitcherComponent],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent {
  navLinks: NavLink[] = [
    { label: 'NAV.HOME', fragment: 'hero' },
    { label: 'NAV.ABOUT', fragment: 'about' },
    { label: 'NAV.SERVICES', fragment: 'services' },
    { label: 'NAV.HOW_IT_WORKS', fragment: 'howdoesitwork' },
    { label: 'NAV.PRICES', fragment: 'prices' },
    { label: 'NAV.REVIEWS', fragment: 'reviews' },
    { label: 'NAV.CONTACT', fragment: 'contactus' }
  ];
  activeFragment: string = 'hero';
  constructor() { }
  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    let currentFragment = 'hero';
    for (const link of this.navLinks) {
      const element = document.getElementById(link.fragment);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
          currentFragment = link.fragment;
          break;
        }
      }
    }
    this.activeFragment = currentFragment;
  }
}
