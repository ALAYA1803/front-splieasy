import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-members',
  standalone: false,
  templateUrl: './members.component.html',
  styleUrl: './members.component.css'
})
export class MembersComponent implements OnInit {
  members: any[] = [];
  loading = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);

    this.http.get<any[]>(`http://localhost:3000/households?representante_id=${Number(currentUser.id)}`).subscribe(households => {
      const household = households[0];
      console.log('Household:', household);

      if (household) {
        this.http.get<any[]>(`http://localhost:3000/household_members?household_id=${household.id}`).subscribe(memberLinks => {
          const memberIds = memberLinks.map(link => Number(link.user_id));
          console.log('IDs de miembros:', memberIds);

          this.http.get<any[]>(`http://localhost:3000/users`).subscribe(users => {
            this.members = users.filter(user => memberIds.includes(Number(user.id)));
            console.log('Miembros encontrados:', this.members);
            this.loading = false;
          });
        });
      }
    });
  }
}
