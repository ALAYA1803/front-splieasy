import { Component, HostListener, ElementRef } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
interface Language {
  code: string;
  name: string;
  flag: string;
}

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.css']
})
export class LanguageSwitcherComponent {
  availableLangs: Language[] = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: 'ᴱᴺ' }
  ];

  public isOpen = false;
  public currentLang: Language;
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  constructor(
    public translate: TranslateService,
    private elementRef: ElementRef
  ) {
    const browserLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.currentLang = this.availableLangs.find(lang => lang.code === browserLang) || this.availableLangs[0];
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  changeLanguage(lang: Language) {
    console.log('Intentando cambiar idioma a:', lang.code);
    this.translate.use(lang.code);
    this.currentLang = lang;
    this.isOpen = false;
  }
}
