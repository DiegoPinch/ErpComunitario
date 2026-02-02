import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-auth',
  imports: [FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  username: string = '';
  password: string = '';

  constructor(private router: Router) { }

  onLogin() {
    // Por ahora redirige directamente al layout
    this.router.navigate(['/layout']);
  }
}
