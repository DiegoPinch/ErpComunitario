import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AdministrationsService } from '../../../core/services/administrations';

@Component({
  selector: 'app-form-directiva',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './form-directiva.html',
  styleUrls: ['./form-directiva.css']
})
export class FormDirectiva implements OnInit {
  form: FormGroup;
  isEditMode = false;
  adminId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private adminService: AdministrationsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: [''],
      status: ['active', Validators.required]
    });
  }

  ngOnInit(): void {
    this.adminId = this.route.snapshot.params['id'] ? Number(this.route.snapshot.params['id']) : null;
    if (this.adminId) {
      this.isEditMode = true;
      this.adminService.getById(this.adminId).subscribe(data => {
        this.form.patchValue({
          name: data.name,
          start_date: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '',
          end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : '',
          status: data.status
        });
      });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      if (this.isEditMode && this.adminId) {
        this.adminService.update(this.adminId, this.form.value).subscribe(() => {
          this.router.navigate(['/layout/directiva']);
        });
      } else {
        this.adminService.create(this.form.value).subscribe(() => {
          this.router.navigate(['/layout/directiva']);
        });
      }
    }
  }
}
