# Revisión tras el fallo de tickets

El registro recibido mostraba ER_NO_SUCH_TABLE para payment_collections. La conexión apuntaba a water_system_prod, confirmada por el usuario como una copia local restaurada. Faltaban también todas las columnas de la migración contable. Las verificaciones anteriores de sintaxis no detectaban esta incompatibilidad.

Se aplicaron accounting_integrity_migration.sql y routines_only.sql a esa copia local (MySQL 9.6.0). No se conectó una base de producción distinta. Se verificó que la migración se puede repetir sin errores. La migración mantiene filas existentes y completa snapshots con los valores disponibles actualmente; no reconstruye valores históricos que ya hubieran sido sobrescritos.

Correcciones adicionales:

- Consulta de tickets compatible con esquema anterior, nuevo y parcialmente migrado; mantiene el filtro de anulaciones cuando existe.
- Verificación de estructura al iniciar el backend para detectar una migración pendiente antes de aceptar operaciones.
- Bloqueo transaccional independiente de directivas: la copia no tenía ninguna y los cobros quedaban bloqueados por ese requisito accidental.
- Reporte mensual incluye abonos y otros ingresos y excluye transferencias internas de los egresos globales.
- Cobros de instalación se incluyen en caja/banco del reporte diario.
- Se conserva el rol técnico treasurer durante el inicio de sesión.
- Corrección de la ruta de rutinas y del cálculo de conciliación global en los archivos de despliegue.

Pruebas realizadas:

- 26/26 consultas de modelos ejecutadas contra MySQL sin errores.
- Generación en memoria de ticket, PDF diario y PDF integral (sin guardar datos personales en archivos). Esta comprobación valida generación, no diseño visual.
- 7/7 pruebas automatizadas, incluyendo esquemas anterior y migrado para tickets.
- Prueba transaccional con SQL real: cobro combinado, cambio, idempotencia, rechazo de doble cobro, anulaciones, transferencia interna, anulación de ingresos, cuota facturada, restauración de convenio, cierre, hash y bloqueo de egreso cerrado. ROLLBACK al terminar; no se conservaron registros de prueba. Los contadores AUTO_INCREMENT pueden avanzar durante estas pruebas.
- Controles previos sin duplicados ni pagos huérfanos; conciliación de pagos y totales de factura sin inconsistencias. No había cuentas bancarias ni cierres reales en esta copia; esos casos se ejercitaron con registros temporales dentro de la transacción revertida.

Comandos desde Back:

```
npm test
node scripts/check-accounting-reads.js
node scripts/check-accounting-pdfs.js
node scripts/check-accounting-transactions.js --test-database=NOMBRE_DE_LA_COPIA
```

La prueba transaccional se ejecuta exclusivamente sobre una copia autorizada. Para producción sigue pendiente repetir controles y migración en el destino que se confirme para el despliegue.
