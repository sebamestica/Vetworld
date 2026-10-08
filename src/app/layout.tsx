import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'Atlas Veterinario 3D · Estación de estudio', description: 'Catálogo canino y felino con fichas anatómicas, procedencia científica y visor interactivo.' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
