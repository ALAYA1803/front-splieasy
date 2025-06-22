import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-memb-settings',
  standalone: false,
  templateUrl: './memb-settings.component.html',
  styleUrl: './memb-settings.component.css'
})
export class MembSettingsComponent implements OnInit {
  userId!: number;
  settings: any = {
    language: 'es',
    dark_mode: false,
    notifications_enabled: true
  };
  settingsId!: number;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('currentUser')!);
    this.userId = +user.id;

    this.http.get<any[]>(`http://localhost:3000/settings?user_id=${this.userId}`).subscribe(res => {
      if (res.length > 0) {
        this.settings = { ...res[0] };
        this.settingsId = res[0].id;
      }
    });
  }

  save(): void {
    this.http.patch(`http://localhost:3000/settings/${this.settingsId}`, this.settings).subscribe(() => {
      alert('Preferencias actualizadas correctamente.');
    });
  }
}
