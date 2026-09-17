# Multas y asistencia: despliegue seguro

La fecha del evento y el mes de facturación son independientes. Es obligatorio elegir el mes al crear una reunión. Los eventos existentes conservan su `additional_concepts.application_month`; no se trasladan multas ni se recalculan importes históricos con la migración.

Al crear o editar una reunión sin asistencia, solo se admite el mes actual o el anterior (hora de Ecuador). El anterior queda bloqueado si alguna factura de agua tiene estado pagado o pagos/abonos vigentes; los cierres también bloquean la selección. El selector obtiene estas opciones del servidor y el servidor revalida al guardar. Las reuniones con asistencia muestran el mes deshabilitado y conservan sus restricciones por factura al corregir asistencia.

## Operación

1. Crear evento, elegir mes de factura y tarifa.
2. Registrar asistencia; revisar el resumen y confirmar con motivo.
3. Una factura pagada, con cualquier pago vigente, anulada o de período cerrado bloquea los cambios de ese socio (aunque todavía no tenga multa).
4. Para corregir un período abierto ya cobrado, anular todos los pagos mediante el flujo existente de Facturas, no eliminar ni cancelar la factura. Cuando quede pendiente y sin cobros vigentes, pulsar «Actualizar bloqueos» en asistencia, corregir con motivo y volver a cobrar el importe correcto. La anulación registra la reversión; no representa por sí sola una devolución física de dinero.
5. Un error bloquea toda la solicitud: no se guardan filas parcialmente. Se conserva auditoría de antes/después. Eventos con asistencia no admiten eliminación ni cambios de mes, fecha o tarifa.

## Base de datos

No añade tablas ni columnas ni elimina datos. Sustituye `sp_update_invoice_total` para rechazar cambios de total en facturas protegidas. El servidor también comprueba las restricciones antes de modificar asistencia o conceptos, dentro de una transacción con el mismo bloqueo que los cobros.

Con respaldo y aplicación detenida durante el despliegue, ejecutar desde Back contra la base previamente verificada:

```powershell
node scripts/run-accounting-migration.js --database=NOMBRE_VERIFICADO --apply --attendance-only
```

Requiere la migración contable anterior (pagos con estado, snapshots, auditoría y cierres). El despliegue contable completo aplica esta protección al final. Desplegar frontend y backend juntos: el cuerpo de la API de asistencia ahora contiene `records`, `application_month` y `reason`.

Prueba únicamente sobre copia restaurada:

```powershell
node scripts/check-attendance-safety.js --test-database=NOMBRE_COPIA
```

La prueba usa transacción externa y savepoints; revierte todos sus registros. Los IDs autoincrementales consumidos pueden dejar huecos, sin afectar importes ni registros existentes.
