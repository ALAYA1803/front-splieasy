import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  isSidebarOpen = true;
  isSidebarOpenMobile = false;
  isMobile = false;

  ngOnInit(): void {


    const windowWidth = window.innerWidth;

    if (windowWidth < 768) {
      this.isSidebarOpen = false;
      this.isSidebarOpenMobile = false;
      this.isMobile = true;
    } else {
      this.isSidebarOpen = true;
      this.isSidebarOpenMobile = false;
      this.isMobile = false;
    }
  }

  toggleSidebar() {
    if (window.innerWidth < 768) {
      this.isSidebarOpenMobile = !this.isSidebarOpenMobile;
    } else {
      this.isSidebarOpen = !this.isSidebarOpen;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth >= 768) {
      this.isSidebarOpen = true; // Desktop: sidebar visible
      this.isSidebarOpenMobile = false; // Asegura que el drawer esté cerrado
      this.isMobile = false;
    } else {
      this.isSidebarOpen = false;
      this.isMobile = true;
    }
  }
}
