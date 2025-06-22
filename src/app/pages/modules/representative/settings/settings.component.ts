import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})

export class SettingsComponent implements OnInit {
  form!: FormGroup;
  userId!: number;
  settingId!: number;

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('currentUser')!);
    this.userId = user.id;

    this.http.get<any[]>(`http://localhost:3000/settings?user_id=${this.userId}`).subscribe(settings => {
      const setting = settings[0];

      this.settingId = setting?.id;

      this.form = this.fb.group({
        language: [setting?.language || 'es'],
        dark_mode: [setting?.dark_mode || false],
        notifications_enabled: [setting?.notifications_enabled || false]
      });
    });
  }

  save() {
    const settings = this.form.value;

    if (this.settingId) {
      this.http.put(`http://localhost:3000/settings/${this.settingId}`, {
        ...settings,
        user_id: this.userId
      }).subscribe(() => alert('Configuración actualizada'));
    } else {
      this.http.post(`http://localhost:3000/settings`, {
        ...settings,
        user_id: this.userId
      }).subscribe(() => alert('Configuración guardada'));
    }
  }
}
