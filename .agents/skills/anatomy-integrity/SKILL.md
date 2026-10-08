---
name: anatomy-integrity
description: Validar especie, nomenclatura veterinaria, bibliografía, evidencia y permisos al crear o revisar fichas y modelos del Atlas Veterinario 3D.
---

# Integridad anatómica

Consultar `docs/FUENTES_ANATOMICAS.md` y `docs/sources-and-licenses.md` desde la raíz del proyecto; del maestro leer solo la sección 5 si se necesita el contrato de ficha.

1. Comprobar especie, región, estructura, nombre latino y sinónimos mediante referencias veterinarias rastreables. No trasladar anatomía humana, canina o felina entre especies.
2. Incluir origen, inserción, acción, inervación y relaciones únicamente con fuente identificable; registrar lo no comprobado sin completar por inferencia.
3. Distinguir escaneo real, segmentación, reconstrucción revisada y modelo ilustrativo. La apariencia no prueba exactitud.
4. Comprobar autor, licencia/versión, atribución, modificación y redistribución por archivo. Un enlace o índice no basta para admitir publicación.
5. Mantener `reviewStatus=pending` hasta revisión humana cualificada documentada. Indicar «Modelo 3D no disponible» si falta geometría defendible.
6. Entregar cambios, evidencias, vacíos y estado de revisión; actualizar seguimiento sin declarar validación automática.
