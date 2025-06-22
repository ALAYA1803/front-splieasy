import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
household: any;
  members: any[] = [];
  bills: any[] = [];
  contributions: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
    const userId = currentUser?.id;

    this.http.get<any[]>(`http://localhost:3000/households?representante_id=${userId}`).subscribe(h => {
      this.household = h[0];

      if (this.household) {
        const hid = this.household.id;
        this.http.get<any[]>(`http://localhost:3000/household_members?household_id=${hid}`).subscribe(m => this.members = m);
        this.http.get<any[]>(`http://localhost:3000/bills?household_id=${hid}`).subscribe(b => this.bills = b);
        this.http.get<any[]>(`http://localhost:3000/contributions?household_id=${hid}`).subscribe(c => this.contributions = c);
      }
    });
  }
}
