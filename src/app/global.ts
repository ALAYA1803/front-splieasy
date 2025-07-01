// src/environments/global.ts

export const sistema: number = 7;

export const version: string = `Versión 1.0.0`;
export const titulo: string = `SplitEasy`;
export const tituloVersion: string = `v(1.0.0)`;

export const anio: number = new Date().getFullYear();

// ⏰ Tiempo de inactividad para alarmas (en milisegundos)
export const tiempoInactividadAlarma: number = 8 * 60 * 60 * 1000;

// 📄 (Opcional) URL de microservicio de reportes si usas uno separado
export const baseUrlReportes: string = 'http://localhost:3000/api';
