# Reportes financieros

El menú financiero contiene cinco reportes: cobranza por mes facturado, cuentas por cobrar por usuario, integral y cierre, arqueo diario y auxiliar bancario. Los directorios y lecturas siguen en reportes generales.

## Criterios

- Cobranza agrupa por mes de factura. Muestra facturación, pagos vigentes aplicados, saldo y conceptos. Los pagos posteriores al mes también se incluyen: no es un reporte histórico al cierre de ese mes.
- Cartera usa todas las facturas emitidas hasta el fin del mes seleccionado, menos pagos vigentes hasta ese corte. Incluye meses anteriores. Las cuotas de convenios ya facturadas se presentan únicamente en facturas; el convenio muestra su parte no facturada. Las cancelaciones actuales se excluyen. Para reproducir un cierre guardado se usa su instantánea, no una consulta histórica de cartera recalculada.
- Integral usa fechas reales de movimiento para sus saldos. En el anexo mensual, los cobros de facturas se clasifican por el mes facturado para evitar que una jornada realizada en los primeros días del mes siguiente desplace toda la recaudación; convenios e ingresos extraordinarios se clasifican por su fecha real. Los demás anexos resumen egresos por categoría, traspasos por cuenta de destino y cartera por mes facturado. Los reportes auxiliares conservan el detalle por usuario y movimiento. Traspasos caja/banco no suman ingresos ni gastos globales.
- El arqueo compara el efectivo contado de la jornada con los cobros e ingresos en efectivo menos gastos y depósitos a bancos de ese mismo día. Guarda esperado diario, diferencia, observación y responsable en financial_audit_log (cash_count). Es un registro adicional, no un ajuste del saldo. El saldo acumulado aparece solo como referencia. Si cambian movimientos después del conteo el PDF avisa. Un cierre contable impide registrar conteos dentro de ese período.
- La pantalla de arqueo descubre automáticamente las fechas con cobros por año y muestra si cada jornada está pendiente, guardada o requiere actualización. Al elegir una fecha guardada carga su conteo y observación. Las correcciones crean una nueva entrada de auditoría y conservan las anteriores; incluso un arqueo guardado sin cobros aparece en el historial.
- Los cierres nuevos guardan también el detalle de cartera en snapshot_json versión 2. Los cierres anteriores conservan sus instantáneas originales y pueden no disponer de este anexo.

## Despliegue

Estos cambios no añaden columnas ni tablas. Requieren la migración contable previa documentada en ACCOUNTING_DEPLOYMENT.md, incluida financial_audit_log. Desplegar backend y frontend juntos, reiniciar backend y actualizar frontend. Las rutas antiguas de anexos se conservan por compatibilidad, aunque no figuren en el menú.

No se cambiaron fechas ni importes históricos. No se crean cierres oficiales durante las pruebas. Confirmar efectivo y bancos reales antes del primer cierre.

## Verificación

Ejecutar npm test, scripts/check-accounting-reads.js, scripts/check-accounting-pdfs.js y compilación TypeScript. Las pruebas de transacciones y check-receivables.js deben ejecutarse únicamente en la copia restaurada de pruebas: revierten los cambios al finalizar.
