/**
 * Parsea una cadena de fecha YYYY-MM-DD en un objeto Date local.
 * Esto evita el problema de que 'new Date("YYYY-MM-DD")' se interprete como UTC
 * y resulte en el día anterior al convertir a hora local en zonas horarias negativas (Ej: GMT-5).
 */
export function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
}
