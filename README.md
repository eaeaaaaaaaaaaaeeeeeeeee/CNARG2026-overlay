# 🏆 CNARG 4K 2026 - Official Stream Overlay

Overlay oficial desarrollado para la Copa Nacional Argentina (CNARG) 2026. Este sistema se conecta de manera nativa con **TOSU** y **OBS Studio**.

## 🚀 Instalación y Uso

1. **Ubicación de archivos:**
   Esta carpeta (`CNARG2026`) debe ser copiada dentro de los archivos estáticos de **TOSU**. Por lo general en: `tosu/static/CNARG2026`.
   
2. **Fuentes (Tipografías):**
   Asegurate de instalar en tu computadora las fuentes ubicadas en la carpeta `/assets/fonts/` (`ClashDisplay-Medium.otf` y todas las de la familia `Hikasami`).

3. **Configuración en OBS Studio:**
   Agregá "Orígenes de Navegador" (Browser Sources) referenciando los enlaces provenientes de TOSU en las dimensiones **1920x1080**.
   - **Mappool:** `http://localhost:24050/CNARG2026/CNARG_MAPPOOL/index.html`
   - **Match:** `http://localhost:24050/CNARG2026/CNARG_MATCH/index.html`
   - **Jugadores:** `http://localhost:24050/CNARG2026/CNARG_PLAYERINTRO/index.html`
   - **Calendario (Schedule):** `http://localhost:24050/CNARG2026/CNARG_SCHEDULE/index.html`
   - **Ganador:** `http://localhost:24050/CNARG2026/CNARG_WINNER/index.html`

## 🔒 Seguridad y Configuración

Los "secrets" (API Keys de Supabase, accesos al WebSocket) han sido extraídos. El archivo `.env` está oculto. Vos podés configurar las variables renombrando `.env.example` a `.env` (si usás un servidor backend), o utilizar directamente el archivo pre-armado `config.json`.

**Edita el archivo `config.json` para conectar todo:**

```json
{
    "stage_id": "tu_ID_de_etapa_de_Supabase",
    "obs_ws_url": "ws://localhost:4455",
    "obs_ws_pwd": "TU_CONTRASEÑA_OBS",
    "supabase_url": "https://xxxxx.supabase.co",
    "supabase_key": "YOUR_SUPABASE_ANON_KEY"
}
```
## 🎥 OBS Auto-Switcher

Este parche incluye un archivo lógico `obs-logic.js` que cambia de manera totalmente automática de la escena "Match" a la escena "Mappool" interpretando los estados del juego a través del Socket IPC de TOSU. 
Para que esto funcione correctamente en tu PC:
1. Andá a Herramientas -> "Ajustes de WebSocket" dentro de OBS Studio.
2. Anotá la contraseña y configurala en tu `config.json`.
3. Tus escenas en OBS deben llamarse textualmente `"MATCH"` y `"MAPPOOL"`. Si se llaman distinto, modificalo en la cabecera de `src/js/obs-logic.js`.
