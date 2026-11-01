---
name: veterinary-terminology-nav
description: Elegir nombres latinos, sinónimos ES/EN, IDs estables y términos de dirección veterinarios citando la Nomina Anatomica Veterinaria 6.ª local para fichas, búsqueda y UI del atlas.
---

# Terminología veterinaria (NAV 6.ª)

Activar al nombrar estructuras, añadir sinónimos, revisar etiquetas de dirección o vistas, o citar NAV en `fieldEvidence`. La evidencia por campo se rige por [scientific-field-evidence](../scientific-field-evidence/SKILL.md); especie y bibliografía, por [anatomy-integrity](../anatomy-integrity/SKILL.md).

## Fuente local

- Copia de trabajo: `workbench/references/nav6.txt` (texto extraído) y `nav6.pdf`. `workbench/` está en `.gitignore`: no versionar, no copiar a `public/`, no citar la ruta en localizadores. La licencia de redistribución del PDF no está comprobada (`sources.json`, id `nav-6th-edition`).
- El texto marca cada página con `PDF PAGE N`; la línea siguiente indica capítulo (`NOMINA ANATOMICA VETERINARIA (2017) OSTEOLOGIA`) y la de subrayado termina con la página impresa (p. ej. `PDF PAGE 36` → p. 18). Citar capítulo + página impresa + término, como hace el catálogo: `OSTEOLOGIA, p.18; Skeleton brachii, Humerus`.

```bash
f=workbench/references/nav6.txt
grep -n "^Humerus" "$f"                                    # localizar término
grep -n "PDF PAGE" "$f" | awk -F: '$1<2753' | tail -1      # página PDF anterior a la línea hallada
sed -n '2655,2660p' "$f"                                   # leer cabecera y página impresa
grep -n "(fe)\|(ca)" "$f" | head                           # términos restringidos por especie
```

- Abreviaturas de especie de NAV: `(ca)` *Canis familiaris*, `(fe)` *Felis catus* (introducción, lista de especies). Un término marcado solo `(ca)` (p. ej. `Foramen supratrochleare (ca)`) no se usa en fichas felinas, y al revés. Ausencia de marca no prueba presencia en la especie: confirmarla con bibliografía de esa especie.
- Respetar la grafía NAV y su nota sobre diptongos ae/oe; no castellanizar el `canonicalLatinName`.

## Nombres y sinónimos

- `canonicalLatinName`: término NAV exacto (`Humerus`, `Os femoris`, `Musculus biceps brachii`).
- `spanishName`: traducción editorial; si se cita NAV, el `claim` dice «Traducción editorial al español», no que NAV la contenga.
- `aliases`: variantes ES/EN, sin tilde, ortografías y términos históricos o clínicos con fuente (ejemplo real: `feline:humerus` → `["humerus", "humero"]`). Sin duplicados (el validador lo comprueba). La búsqueda (`catalogService.search`) puntúa sobre latín, español y `aliases`, por lo que el alias es el lugar del sinónimo.
- Un sinónimo histórico de una obra antigua (Reighard/Jennings 1901) se marca como tal y se coteja con NAV.

## IDs estables

- Formato `especie:slug`, minúsculas, cifras y guiones (`idSchema`: `^[a-z0-9][a-z0-9:-]*$`). Especies actuales: `canine`, `feline`.
- Slug en inglés corto y estable (`feline:scapula`, `canine:biceps-origin-tendon`); no cambiar un ID publicado, porque lo referencian `relations.json`, `sources.json`, `models.json`, mappings y pruebas.
- El inventario de referencia usa IDs propios (`feline:reference:<región>:<lado>:<hueso>`); no confundirlos con fichas.

## Términos de dirección (NAV, «Hints for the User», p. xi; TERMINI SITUM ET DIRECTIONEM)

| Término | Uso veterinario |
|---|---|
| craneal / caudal | cuello, tronco y miembros proximales al carpo y tarso |
| rostral | en la cabeza, junto con caudal, dorsal y ventral |
| dorsal / ventral | tronco y cabeza; en mano y pie, dorsal es la cara opuesta a palmar/plantar |
| palmar / plantar | cara posterior de la mano (carpo y distal) / del pie (tarso y distal) |
| proximal / distal | en los miembros, hacia/desde la unión con el tronco |
| medial / lateral | todo el cuerpo |
| axial / abaxial | respecto del eje funcional del miembro, p. ej. caras de los dedos |

- No usar anterior/posterior/superior/inferior salvo donde NAV los reserva (globo ocular, párpados, labios, oído interno).
- Etiquetas de UI («Craneal», vistas) siguen esta convención; no traducirlas desde anatomía humana.

## Entrega

Indicar términos verificados con su capítulo/página, términos no hallados en NAV y la fuente alternativa usada, o dejarlos pendientes. No inventar correspondencias ES/EN.
