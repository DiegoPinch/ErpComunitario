import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function cedulaEcuadorValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const cedula = control.value;

        if (!cedula) {
            return null; // Si está vacío, otro validador (required) se encargará
        }

        if (cedula.length !== 10) {
            return { invalidCedulaLength: true };
        }

        // Verificar si todos los dígitos son iguales
        if (/^(\d)\1+$/.test(cedula)) {
            return { invalidCedulaRepeated: true };
        }

        const digitoRegion = Number(cedula.substring(0, 2));
        if (digitoRegion < 1 || digitoRegion > 24) {
            return { invalidCedulaRegion: true };
        }

        const tercerDigito = Number(cedula.substring(2, 3));
        if (tercerDigito < 0 || tercerDigito > 5) {
            return { invalidCedulaThirdDigit: true };
        }

        const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
        const ultimoDigito = Number(cedula.substring(9, 10));
        let suma = 0;

        for (let i = 0; i < 9; i++) {
            let valor = Number(cedula.substring(i, i + 1)) * coeficientes[i];
            if (valor > 9) {
                valor -= 9;
            }
            suma += valor;
        }

        const decenaSuperior = Math.ceil(suma / 10) * 10;
        let digitoVerificador = decenaSuperior - suma;

        if (digitoVerificador === 10) {
            digitoVerificador = 0;
        }

        if (digitoVerificador !== ultimoDigito) {
            return { invalidCedulaChecksum: true };
        }

        return null;
    };
}
