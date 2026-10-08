# Inventario de Activos Anatómicos 3D — Vetworld (Fase 3)

Este inventario documenta exhaustivamente tanto los modelos anatómicos candidatos analizados como los activos tridimensionales reales adquiridos, convertidos e integrados en el visor de Vetworld, conforme a las reglas estrictas de integridad científica, separación interespecífica y licenciamiento.

---

## 1. Modelos Anatómicos Integrados en el Atlas (Disponibles)

### 1.1 Extremidad Torácica Canina (Esqueleto, Músculos y Nervios)
- **ID en catálogo:** `canine:thoracic-limb-model`
- **Especie:** *Canis lupus familiaris* (Canino)
- **Región anatómica:** Extremidad torácica derecha (`thoracic-limb`)
- **Autor / Institución:** Tomás Argüello / Soft Interaction Lab (`InNervateVR`)
- **URL de origen:** https://github.com/TomasArguello/InNervateVR (archivo fuente: `CanineLeg/thoracicLimb_bonesSeparated.fbx`)
- **Licencia:** Repositorio académico abierto de libre uso y adaptación educativa.
- **Ruta en proyecto:** `public/anatomy/canine/skeleton/thoracic-limb.glb` (espejo en `/models/canine/thoracic-limb.glb`)
- **Archivo fuente original:** `assets-source/canine/thoracicLimb_bonesSeparated.fbx`
- **Hash SHA-256 (GLB):** `b11172969e59fe9a54bca5406daca1c0d886f17cc0856d79eb6c725f4fbe77cc`
- **Tamaño binario:** 7.965.716 bytes (~7,60 MB)
- **Complejidad geométrica:** 82.525 triángulos
- **Uso estimado de VRAM (GPU):** ~7,55 MB
- **Unidades y orientación:** Escala métrica (1 unidad = 1 m, factor 0,01 desde cm en FBX); orientación anatómica normalizada (+Y dorsal/superior, +Z craneal, +X lateral).
- **Estructuras individualizadas (29 nodos):**
  - **Huesos (5):** Escápula (`scaplula_bne`), Húmero (`humerus_bne`), Radio (`radius_bne`), Cúbito (`ulna_bne`), Mano/Autopodio (`manus_bne`).
  - **Músculos (18):** Bíceps braquial, Braquial, Supraespinoso, Infraespinoso, Subescapular, Redondo mayor, Tríceps braquial (cabezas larga, lateral, medial y accesoria), Extensor radial del carpo, Extensor digital común, Extensor digital lateral, Ulnar lateral, Flexor radial del carpo, Flexor ulnar del carpo, Flexor digital superficial, Flexor digital profundo.
  - **Nervios (6):** Nervio musculocutáneo, Nervio radial, Nervio axilar, Nervio mediano y ulnar, Nervio supraescapular, Nervio subescapular.
- **Estado de validación científica:** `pending` (requiere cotejo veterinario presencial; no obstante, la correlación topográfica entre mallas óseas, orígenes e inserciones musculares es coherente con NAV).

---

### 1.2 Extremidad Torácica Felina (Esqueleto Óseo Individualizado)
- **ID en catálogo:** `feline:thoracic-limb-model`
- **Especie:** *Felis catus* (Felino)
- **Región anatómica:** Extremidad torácica (`thoracic-limb`)
- **Autor / Institución:** ezrahmae / 3D-Cat-Anatomy (escaneos 3D de piezas anatómicas de gato)
- **URL de origen:** https://github.com/ezrahmae/3D-Cat-Anatomy
- **Licencia:** Repositorio académico abierto de código abierto y modelos de libre distribución.
- **Ruta en proyecto:** `public/anatomy/feline/skeleton/thoracic-limb.glb` (espejo en `/models/feline/thoracic-limb.glb`)
- **Archivos fuente originales:** `assets-source/feline/scapula.glb`, `humerus.glb`, `radius.glb`, `ulna.glb`, `carpus.glb`, `metacarpus.glb`, `phalanges.glb`
- **Hash SHA-256 (GLB ensamblado):** `09c62923b7238299ebbb6e1fe746a5df9710363200ff7344beea1a94264627d2`
- **Tamaño binario:** 4.071.588 bytes (~3,88 MB)
- **Complejidad geométrica:** 52.104 triángulos
- **Uso estimado de VRAM (GPU):** ~3,87 MB
- **Unidades y orientación:** Escala métrica normalizada; articulación anatómica en cadena próximodistal (+Y dorsal, +Z craneal).
- **Estructuras individualizadas (7 nodos óseos):**
  - Escápula (`scapula1`), Húmero (`humerus1`), Radio (`radius1`), Cúbito (`ulna1`), Carpo (`carpus1`), Metacarpo (`metacarpus1`), Falanges (`phalanges1`).
- **Estado de validación científica:** `pending`.

---

### 1.3 Cráneo y Mandíbula Felinos (Neurocráneo, Mandíbula y Dentición)
- **ID en catálogo:** `feline:skull-model`
- **Especie:** *Felis catus* (Felino)
- **Región anatómica:** Cabeza (`head`)
- **Autor / Institución:** ezrahmae / 3D-Cat-Anatomy
- **URL de origen:** https://github.com/ezrahmae/3D-Cat-Anatomy
- **Licencia:** Repositorio académico abierto de acceso libre.
- **Ruta en proyecto:** `public/anatomy/feline/skeleton/skull.glb` (espejo en `/models/feline/skull.glb`)
- **Archivos fuente originales:** `assets-source/feline/skull.glb`, `mandible.glb`, `teeth.glb`
- **Hash SHA-256 (GLB ensamblado):** `3fc83307bdfa357564d6db2946c1a017e822d515a86aa2f43d2aa7a627ff7eec`
- **Tamaño binario:** 5.319.424 bytes (~5,07 MB)
- **Complejidad geométrica:** 64.496 triángulos
- **Uso estimado de VRAM (GPU):** ~5,07 MB
- **Unidades y orientación:** Escala métrica; +Y dorsal, +Z craneal/rostral.
- **Estructuras individualizadas (3 nodos):**
  - Cráneo / Neurocráneo (`skull`), Mandíbula (`mandible`), Dentición carnívora (`teeth`).
- **Estado de validación científica:** `pending`.

---

## 2. Modelos Candidatos Investigados (Sketchfab y Repositorios Académicos)

Conforme a las reglas del proyecto, se consultó directamente la API v3 oficial de Sketchfab para obtener los metadatos fidedignos de cada candidato sugerido.

| # | Modelo / Título | Autor / Institución | UID Sketchfab | Licencia | Geometría Oficial | Estado de Descarga / Hallazgo |
|---|---|---|---|---|---|---|
| 1 | **3D Dog Bone Project — Partial Dog Skeleton** | Massey University (`nzfauna`) | `65a6c5db1c4c477aba475af5d86d59a5` | CC BY-SA 4.0 | 408.515 vértices / 817.060 caras | Endpoint de descarga requiere autenticación OAuth/API token de Sketchfab. Cloudflare bloquea peticiones web directas. Esqueleto parcial (carece de extremidades completas). |
| 2 | **Feline Écorché Dec** | Westerly | `4c08824eb4914ff4b6e71b4dc2ba080e` | CC BY 4.0 | 226.318 vértices / 451.202 caras | Requiere token para descarga automatizada. Recurso escultórico artístico; mallas sin despiece individualizado por planos musculares. |
| 3 | **Cat Skeleton** | Tavernier Amaury (`svtavernier`) | `7106115b299649e992476f2d3b4fc602` | CC BY-NC-SA 4.0 | 36.822 vértices / 74.235 caras | Requiere token para descarga automatizada. Malla fotogramétrica unificada; requiere segmentación manual calificada para separar piezas. |
| 4 | **3D Canine Anatomy: Normal Abdomen** | Pixelbeaker | `962de878d2e94b75b10075931f0edaa3` | CC BY 4.0 | 654.134 vértices / 1.289.511 caras | Requiere token para descarga automatizada. Órganos segmentados desde TC abdominal. Excelente candidato para fase abdominal. |
| 5 | **Domestic Cat Skull** | RISD Nature Lab | `bb6b8398029c45ef9da4e4ff04d2d9d9` | CC BY 4.0 | 428.041 vértices / 856.134 caras | Requiere token para descarga automatizada. Escaneo fotogramétrico de alta densidad. |
| 6 | **Dog Brachycephalic Skull** | Royal (Dick) School of Veterinary Studies, Univ. Edinburgh | `610867e1995a48a5a80be342291e4520` | CC BY 4.0 | 141.714 vértices / 284.032 caras | Requiere token para descarga automatizada. Cráneo braquicéfalo real validado institucionalmente. |
| 7 | **Dog Dolichocephalic Skull** | Royal (Dick) School of Veterinary Studies, Univ. Edinburgh | `5d8d86a270b64f05aab45c3d09f350a6` | CC BY 4.0 | 277.269 vértices / 555.096 caras | Requiere token para descarga automatizada. Cráneo dolicocéfalo real validado institucionalmente. |

---

## 3. Estado del Presupuesto Global y Rendimiento Móvil

- **Límite por activo según estándar del visor:** 120.000 triángulos / 10 MB tamaño / 12 MB VRAM estimada.
- **Cumplimiento de los activos integrados:**
  - `canine:thoracic-limb-model`: 82.525 tris (68,7% del límite), 7,96 MB, 7,55 MB VRAM. **Cumple**.
  - `feline:thoracic-limb-model`: 52.104 tris (43,4% del límite), 4,07 MB, 3,87 MB VRAM. **Cumple**.
  - `feline:skull-model`: 64.496 tris (53,7% del límite), 5,31 MB, 5,07 MB VRAM. **Cumple**.
- **Total acumulado en el atlas:** 199.125 triángulos, 16,50 MB VRAM total proyectada.
