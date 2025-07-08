import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BillResponse, CreateBillRequest } from '../../interfaces/bills';
import { User } from '../../../../core/interfaces/auth';
import { BillsService } from '../../services/bills.service';
import { HouseholdService } from '../../services/household.service';

@Component({
  selector: 'app-bills',
  standalone: false,
  templateUrl: './bills.component.html',
  styleUrl: './bills.component.css'
})
export class BillsComponent implements OnInit {
  bills: BillResponse[] = [];
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
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    try {
      const userString = localStorage.getItem('currentUser');
      if (userString) {
        this.currentUser = JSON.parse(userString);
        this.isRepresentante = this.currentUser.roles.includes('ROLE_REPRESENTANTE');
        console.log('Usuario actual:', this.currentUser);
        console.log('Es representante:', this.isRepresentante);
      } else {
        this.errorMessage = 'No se encontró información del usuario';
        this.loading = false;
        return;
      }
    } catch (error) {
      console.error('Error al parsear usuario:', error);
      this.errorMessage = 'Error al cargar información del usuario';
      this.loading = false;
      return;
    }

    this.initializeForm();
    this.loadUserHousehold();
  }

  private initializeForm() {
    this.billForm = this.fb.group({
      descripcion: ['', Validators.required],
      monto: [null, [Validators.required, Validators.min(0)]],
      fecha: [new Date().toISOString().substring(0, 10), Validators.required]
    });
  }

  private loadUserHousehold() {
    console.log('Cargando households para usuario:', this.currentUser.id);

    this.householdService.getHouseholdByRepresentante(this.currentUser.id).subscribe({
      next: (households) => {
        console.log('Households encontrados:', households);
        if (households.length > 0) {
          this.householdId = households[0].id;
          console.log('Household ID seleccionado:', this.householdId);
          this.loadBills();
        } else {
          console.log('No se encontraron households para este usuario');
          this.errorMessage = 'No se encontraron hogares para este usuario';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading households:', error);
        this.errorMessage = 'Error al cargar los hogares: ' + (error.message || 'Error desconocido');
        this.loading = false;
      }
    });
  }

  private loadBills() {
    console.log('Cargando bills para household:', this.householdId);

    this.billsService.getBillsByHousehold(this.householdId).subscribe({
      next: (bills) => {
        console.log('Bills cargadas:', bills);
        this.bills = bills;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bills:', error);
        this.errorMessage = 'Error al cargar las facturas: ' + (error.message || 'Error desconocido');
        this.loading = false;
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
    if (!this.billForm.valid) {
      console.log('Formulario inválido:', this.billForm.errors);
      return;
    }

    if (this.editingBillId) {
      this.updateBill();
    } else {
      this.createBill();
    }
  }

  private createBill() {
    const createBillRequest: CreateBillRequest = {
      householdId: this.householdId,
      descripcion: this.billForm.value.descripcion,
      monto: this.billForm.value.monto,
      fecha: this.billForm.value.fecha
    };

    console.log('Creando bill:', createBillRequest);

    this.billsService.createBill(createBillRequest).subscribe({
      next: (savedBill) => {
        console.log('Bill creada exitosamente:', savedBill);
        this.bills.push(savedBill);
        this.formVisible = false;
        this.billForm.reset();
      },
      error: (error) => {
        console.error('Error creating bill:', error);
        alert('Error al crear la bill: ' + (error.message || 'Error desconocido'));
      }
    });
  }

  private updateBill() {
    if (!this.editingBillId) return;

    const updateRequest = {
      descripcion: this.billForm.value.descripcion,
      monto: this.billForm.value.monto,
      fecha: this.billForm.value.fecha
    };

    this.billsService.updateBill(this.editingBillId, updateRequest).subscribe({
      next: (updatedBill) => {
        console.log('Bill actualizada exitosamente:', updatedBill);
        const index = this.bills.findIndex(bill => bill.id === this.editingBillId);
        if (index !== -1) {
          this.bills[index] = updatedBill;
        }
        this.formVisible = false;
        this.billForm.reset();
        this.editingBillId = null;
      },
      error: (error) => {
        console.error('Error updating bill:', error);
        alert('Error al actualizar la bill: ' + (error.message || 'Error desconocido'));
      }
    });
  }

  editBill(bill: BillResponse) {
    if (!this.isRepresentante) {
      alert('Solo los representantes pueden editar bills');
      return;
    }

    this.editingBillId = bill.id;
    this.billForm.patchValue({
      descripcion: bill.descripcion,
      monto: bill.monto,
      fecha: bill.fecha
    });
    this.formVisible = true;
  }

  deleteBill(billId: number) {
    if (!this.isRepresentante) {
      alert('Solo los representantes pueden eliminar bills');
      return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar esta bill?')) {
      this.billsService.deleteBill(billId).subscribe({
        next: () => {
          console.log('Bill eliminada exitosamente');
          this.bills = this.bills.filter(bill => bill.id !== billId);
        },
        error: (error) => {
          console.error('Error deleting bill:', error);
          alert('Error al eliminar la bill: ' + (error.message || 'Error desconocido'));
        }
      });
    }
  }

  cancelForm() {
    this.formVisible = false;
    this.billForm.reset();
    this.editingBillId = null;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN' // O usa la moneda del household
    }).format(amount);
  }

  // Método para recargar los datos
  reloadData() {
    this.loading = true;
    this.errorMessage = '';
    this.loadUserHousehold();
  }
}
