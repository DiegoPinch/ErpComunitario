# Despliegue seguro de integridad contable

Estos cambios no envían información al SRI y no modifican el mecanismo de respaldos. La migración es aditiva: conserva las filas actuales y agrega trazabilidad, estados de anulación, cabeceras de cobranza y snapshots históricos.

## Orden obligatorio

1. Restaurar el respaldo reciente en una base de datos de prueba aislada.
2. Ejecutar `scripts/accounting_pre_migration_checks.sql` sobre esa copia y guardar los resultados.
3. Si aparecen duplicados o inconsistencias, no corregirlos automáticamente: revisar cada caso contra comprobantes reales.
4. Ejecutar `scripts/accounting_integrity_migration.sql` sobre la copia.
5. Ejecutar `routines_only.sql` (ubicado directamente en Back) para instalar las rutinas corregidas.
6. Iniciar esta versión del backend contra la copia y realizar las pruebas funcionales indicadas abajo.
7. Ejecutar `scripts/accounting_reconciliation.sql`; las consultas de inconsistencias deben devolver cero filas y cada `hash_ok` debe valer `1`.
8. Comparar Estado de Caja, bancos, facturas pendientes, pagos y convenios con los totales de control anteriores.
9. Solo después de aprobar la copia: programar una ventana corta, detener el backend de producción, generar un respaldo final, repetir los pasos 2 a 7 en producción y desplegar backend/frontend antes de reabrir el acceso.

No se debe desplegar el código nuevo antes de la migración: el backend nuevo utiliza las columnas agregadas. Tampoco se debe ejecutar `migrate_all.js` después, porque contiene definiciones históricas que podrían reemplazar rutinas corregidas.

Como alternativa a los pasos 4 y 5, desde Back ejecutar `node scripts/run-accounting-migration.js --database=NOMBRE_VERIFICADO --apply`. Este comando comprueba el nombre de la base conectada y ejecuta ambos archivos. Requiere haber verificado previamente que el destino sea el autorizado. Para comprobar las consultas contra MySQL: `node scripts/check-accounting-reads.js`.

El bloqueo de operaciones usa `accounting_ledger_lock`, independiente de las directivas: cobrar no exige que ya exista una directiva. Crear un cierre sí requiere seleccionar una directiva activa.

## Pruebas mínimas en la copia

- Cobrar una factura individual en efectivo y confirmar total, recibido y cambio.
- Cobrar dos facturas juntas y confirmar que caja/banco aumente únicamente por la suma de las facturas.
- Cobrar factura y convenio en una sola operación; verificar ambos saldos.
- Intentar cobrar de nuevo una factura pagada; debe rechazarse.
- Repetir exactamente una solicitud con la misma clave de idempotencia; no debe duplicar movimientos.
- Anular un pago con motivo y comprobar que la factura vuelva a pendiente.
- Pagar y anular una cuota de convenio; el saldo debe disminuir y restaurarse exactamente.
- Crear, editar y anular un egreso fuera de períodos cerrados.
- Intentar alterar un movimiento cuya fecha esté cerrada; debe rechazarse.
- Generar un cierre, verificar diferencia físico/sistema y comprobar su hash.

## Restricciones únicas pendientes

El final de la migración muestra posibles lecturas, facturas de agua y períodos duplicados. Las restricciones únicas están comentadas deliberadamente. Se activan únicamente cuando las consultas devuelvan cero filas; de lo contrario, MySQL rechazará la restricción y primero habrá que decidir qué registro real conservar.

La migración DDL de MySQL confirma cada cambio estructural de forma implícita. Si falla a mitad, se corrige la causa y se vuelve a ejecutar: los helpers verifican columnas, índices y llaves ya creados.
