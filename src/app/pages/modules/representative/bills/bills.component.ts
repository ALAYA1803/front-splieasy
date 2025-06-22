import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-bills',
  standalone: false,
  templateUrl: './bills.component.html',
  styleUrl: './bills.component.css'
})
export class BillsComponent implements OnInit {
  bills: any[] = [];
  householdId: number = 0;
  loading = true;
  formVisible = false;
  billForm!: FormGroup;

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);

    this.billForm = this.fb.group({
      descripcion: ['', Validators.required],
      monto: [null, [Validators.required, Validators.min(0)]],
      fecha: [new Date().toISOString().substring(0, 10), Validators.required]
    });

    this.http.get<any[]>(`http://localhost:3000/households?representante_id=${currentUser.id}`).subscribe(households => {
      const household = households[0];
      if (household) {
        this.householdId = household.id;
        this.http.get<any[]>(`http://localhost:3000/bills?household_id=${household.id}`).subscribe(bills => {
          this.bills = bills;
          this.loading = false;
        });
      }
    });
  }

  showForm() {
    this.formVisible = true;
    this.billForm.reset({
      descripcion: '',
      monto: null,
      fecha: new Date().toISOString().substring(0, 10)
    });
  }

  submit() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
    const newBill = {
      ...this.billForm.value,
      household_id: this.householdId,
      created_by: currentUser.id
    };

    this.http.post('http://localhost:3000/bills', newBill).subscribe(saved => {
      this.bills.push(saved);
      this.formVisible = false;
    });
  }
}
