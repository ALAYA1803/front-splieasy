import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BillResponse, CreateBillRequest } from '../../interfaces/bills';
import { User } from '../../../../core/interfaces/auth';
import { BillsService } from '../../services/bills.service';
import { HouseholdService } from '../../services/household.service';
import { AuthService } from '../../../../core/services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-bills',
  standalone: false,
  templateUrl: './bills.component.html',
  styleUrls: ['./bills.component.css']
})
export class BillsComponent implements OnInit {
  bills: (BillResponse & { createdByName?: string })[] = [];
  householdId: number = 0;
  loading = true;
  formVisible = false;
  billForm!: FormGroup;
  currentUser!: User;
  isRepresentante = false;
  errorMessage = '';
  editingBillId: number | null = null;

  constructor(
    private billsService: BillsService,
    private householdService: HouseholdService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const userString = localStorage.getItem('currentUser');
    if (userString) {
      this.currentUser = JSON.parse(userString);
      this.isRepresentante = this.currentUser.roles.includes('ROLE_REPRESENTANTE');
    } else {
      this.errorMessage = 'No se encontró información del usuario';
      this.loading = false;
      return;
    }
    this.initializeForm();
    this.loadUserHousehold();
  }

  private initializeForm() {
    this.billForm = this.fb.group({
      description: ['', Validators.required],
      monto: [null, [Validators.required, Validators.min(0.01)]],
      fecha: [new Date().toISOString().substring(0, 10), Validators.required]
    });
  }

  private loadUserHousehold() {
    this.householdService.getHouseholdByRepresentante(this.currentUser.id).subscribe({
      next: (households) => {
        if (households && households.length > 0) {
          this.householdId = households[0].id;
          this.loadBillsAndUsers();
        } else {
          this.errorMessage = 'Como representante, aún no has creado un hogar.';
          this.loading = false;
        }
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar la información del hogar.';
        this.loading = false;
      }
    });
  }

  private loadBillsAndUsers() {
    this.loading = true;
    forkJoin({
      bills: this.billsService.getBillsByHousehold(this.householdId),
      users: this.authService.getAllUsers()
    }).subscribe({
      next: ({ bills, users }) => {
        this.bills = bills.map(bill => {
          const creator = users.find(user => user.id === bill.createdBy);
          return {
            ...bill,
            createdByName: creator ? creator.username : 'Usuario desconocido'
          };
        });
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar los datos.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  showForm() {
    if (!this.isRepresentante) {
      alert('Solo los representantes pueden crear bills');
      return;
    }

    this.editingBillId = null;
    this.formVisible = true;
    this.billForm.reset({
      descripcion: '',
      monto: null,
      fecha: new Date().toISOString().substring(0, 10)
    });
  }

  submit() {
    if (!this.billForm.valid) return;

    if (this.editingBillId) {
      this.updateBill();
    } else {
      this.createBill();
    }
  }

  private createBill() {
    const request: CreateBillRequest = {
      householdId: this.householdId,
      description: this.billForm.value.description,
      monto: this.billForm.value.monto,
      fecha: this.billForm.value.fecha,
      createdBy: this.currentUser.id
    };

    this.billsService.createBill(request).subscribe({
      next: () => {
        this.formVisible = false;
        this.loadBillsAndUsers();
      },
      error: (error) => console.error('Error creating bill:', error)
    });
  }

  private updateBill() {
    if (!this.editingBillId) return;
    const request: CreateBillRequest = {
      householdId: this.householdId,
      createdBy: this.currentUser.id,
      description: this.billForm.value.description,
      monto: this.billForm.value.monto,
      fecha: this.billForm.value.fecha
    };

    this.billsService.updateBill(this.editingBillId, request).subscribe({
      next: (updatedBill) => {
        this.formVisible = false;
        this.editingBillId = null;
        this.loadBillsAndUsers();
      },
      error: (error) => {
        console.error('Error updating bill:', error);
        alert('Error al actualizar la factura.');
      }
    });
  }

  editBill(bill: BillResponse) {
    this.editingBillId = bill.id;
    this.formVisible = true;
    this.billForm.patchValue({
      description: bill.description,
      monto: bill.monto,
      fecha: bill.fecha
    });
  }

  deleteBill(billId: number) {
    this.billsService.deleteBill(billId).subscribe({
      next: () => {
        this.bills = this.bills.filter(b => b.id !== billId);
      },
      error: (error) => console.error('Error deleting bill:', error)
    });
  }

  cancelForm() {
    this.formVisible = false;
    this.billForm.reset();
    this.editingBillId = null;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  }

  reloadData() {
    this.loading = true;
    this.errorMessage = '';
    this.loadUserHousehold();
  }
}
