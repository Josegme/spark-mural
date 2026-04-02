

## Diagnóstico: Error ZIP del Asistente — Es MEMORIA, no RLS

### Lo que confirmé

1. **La edge function SÍ se ejecuta correctamente para el asistente.** Los logs muestran:
   - Token recibido: `smGWuX3d...`
   - 74 archivos descargados exitosamente en 15 batches
   - `Downloads complete: 74 ok, 0 failed`
   - **Crash: `Memory limit exceeded`** al generar el ZIP

2. **NO es un problema de RLS.** Las políticas de `contenido` ya incluyen acceso por tenant:
   ```
   evento_id IN (SELECT e.id FROM eventos e 
     WHERE e.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
   ```
   El asistente puede ver el evento, el token `qr_descarga_token`, y el contenido. La edge function usa `SERVICE_ROLE_KEY` y bypasea RLS de todas formas.

3. **El problema es que 74 archivos (71 fotos + 3 videos) superan el límite de ~150MB de memoria de Deno Edge Functions.** Todos los archivos se acumulan como ArrayBuffers dentro del objeto JSZip en memoria antes de generar el ZIP.

### Por qué el fix anterior de "batches de 5" no resolvió
El batching solo controla cuántos archivos se descargan *simultáneamente*. Pero cada archivo descargado se guarda en memoria dentro de `JSZip`. Al terminar los 15 batches, los 74 archivos están todos en RAM → crash.

### Fix propuesto

**Archivo:** `supabase/functions/download-album-zip/index.ts`

**Estrategia: Limitar resolución y tamaño de archivos en memoria**

1. **Reducir tamaño de imágenes antes de agregarlas al ZIP.** No podemos procesar imágenes en Deno fácilmente, pero sí podemos usar los thumbnails de Supabase Storage (`/render/image`) con un ancho máximo de 1920px en vez de las fotos originales a máxima resolución. Esto reduce dramáticamente el uso de memoria.

2. **Excluir videos del ZIP por defecto** (o limitar a los primeros 3 videos si son cortos). Los videos son los que más memoria consumen. Agregar un parámetro `include_videos` al request.

3. **Alternativa más robusta: generar el ZIP en Supabase Storage** en vez de en memoria. Usar un approach de streaming donde cada archivo se escribe al ZIP y se sube a Storage, luego devolver una URL firmada de descarga. Sin embargo, JSZip no soporta streaming nativo en Deno.

4. **Solución pragmática inmediata:** Descargar los archivos ya comprimidos/reducidos usando `transform` de Supabase Storage para imágenes (máximo 1920px ancho, calidad 80%), y para videos descargar solo si el total es ≤ 5. Esto mantiene el approach actual pero reduce el footprint de memoria de ~150MB+ a ~30-50MB.

### Cambios concretos

**`supabase/functions/download-album-zip/index.ts`:**
- En `downloadFile()`: para archivos de tipo foto, usar la URL de transformación de Supabase Storage (`/render/image/public/contenido-eventos/{path}?width=1920&quality=80`) en vez de la imagen original completa
- Agregar un límite: si hay más de 100 archivos, procesar solo los primeros 100
- Para videos: si el total de videos es > 5, excluirlos del ZIP y agregar una nota en el README
- Reducir el batch size a 3 para dar más tiempo al GC entre batches

### Archivos tocados
Solo `supabase/functions/download-album-zip/index.ts`

### Riesgo
Bajo. El cambio solo afecta la calidad/tamaño de las fotos en el ZIP (1920px sigue siendo alta calidad) y agrega un límite sensato para eventos con muchos archivos.

