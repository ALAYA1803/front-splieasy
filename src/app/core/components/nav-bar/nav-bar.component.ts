import { Component, HostListener, OnInit } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';
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
  imports: [NgFor, NgClass, RouterModule, TranslateModule, LanguageSwitcherComponent],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent implements OnInit {
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

  // Estado del modo oscuro
  isDarkMode: boolean = false;

  constructor() { }

  ngOnInit(): void {
    // Leer preferencia guardada o usar la preferencia del sistema
    const saved = localStorage.getItem('theme');
    if (saved) {
      this.isDarkMode = saved === 'dark';
    } else if (window.matchMedia) {
      this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyTheme();
  }

  // Aplica o remueve la clase en el <body>
  applyTheme() {
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
      if (document.documentElement) document.documentElement.classList.add('dark-theme');
      // Intentar aplicar corrección adicional para fondos claros
      try { (window as any).applyDarkBgFix && (window as any).applyDarkBgFix(); } catch(e) {}
    } else {
      document.body.classList.remove('dark-theme');
      if (document.documentElement) document.documentElement.classList.remove('dark-theme');
      // Revertir corrección adicional si existe
      try { (window as any).revertDarkBgFix && (window as any).revertDarkBgFix(); } catch(e) {}
    }
  }

  // Método ligado al botón del template
  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

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
