# Consulta pública del socio

Ruta frontend: `/consulta`. API: `POST /api/portal/consulta`, cuerpo `{ "cedula": "..." }`.

Acceso sin login solicitado expresamente por el responsable. La cédula NO acredita identidad: quien la conozca puede ver facturas, pagos, asistencias y deudas asociadas. No presentar este mecanismo como autenticación ni como garantía de cumplimiento legal.

Solo lectura. La API resuelve al socio por coincidencia exacta; no acepta user_id ni invoice_id para seleccionar datos. No devuelve cédula, domicilio, teléfono, notas privadas de asistencia ni listados de socios. Devuelve históricos financieros del socio consultado, incluidos comprobantes anulados identificados como tales.

Medidas iniciales: POST (sin cédula en URL), respuestas no-store/noindex, 20 intentos por IP cada 15 minutos, resultados solo en memoria del navegador y cierre a los 10 minutos. El límite es local al proceso y se reinicia con el servidor; para exposición pública real, HTTPS y limitación compartida en proxy son necesarios. No habilitar trust proxy indiscriminadamente. Evitar registrar cuerpos de estas solicitudes en proxy o monitorización.

Imprimir abre el diálogo del navegador (no usa la impresora del servidor ni crea cobros). Las facturas pendientes no se presentan como recibos pagados. Los importes de multas ya facturados no se suman de nuevo a la deuda.

Sin cambios de esquema, usuarios administrativos ni contraseñas. Antes de exposición pública se recomienda reemplazar la cédula sola por un segundo factor o clave y revisar aviso de privacidad/base jurídica con asesoría competente.
