# 🎛️ Music-Mixer-Pro

**Music-Mixer-Pro** es una mesa de mezclas virtual e interactiva para DJ diseñada para ejecutarse en el navegador. La aplicación se conecta en tiempo real a la **API pública de Deezer** para buscar música instantáneamente sin necesidad de configurar cuentas ni tokens de desarrollador. Además, integra el motor **Web Audio API de HTML5** para el procesamiento, filtrado y mezcla de audio real.

---

## ✨ Características Principales

*   **🔍 Buscador de Música Integrado:** Consulta el catálogo global de Deezer sin configuraciones ni claves de acceso (`Client ID` o `.env`).
*   **🔊 Motor de Audio Real:** Carga canciones reales de 30 segundos (`previews`) proporcionadas de forma nativa por la API.
*   **🎚️ Crossfader Interactivo:** Control deslizante horizontal para mezclar y desvanecer el audio de forma fluida entre el Plato A y el Plato B.
*   **🎛️ Ecualizador de 3 Bandas:** Ajustes visuales independientes para frecuencias altas (`HI`), medias (`MID`) y bajas (`LOW`).
*   **🌊 Filtro FX (Low Pass Filter):** Filtro de paso bajo independiente para cada plato que permite crear transiciones profesionales con efectos de tipo "submarino".
*   **🔕 Controles de Rendimiento:** Botones de `PLAY/CUE`, potenciómetros de ganancia (`Trim`), deslizadores verticales de volumen y botones de mute instantáneo (`Corte`).
*   **💿 Vinilos Dinámicos:** Los platos giran físicamente cuando la música se reproduce y absorben dinámicamente la carátula oficial del álbum de la canción cargada.

---

## 📁 Estructura del Proyecto

```text
music-mixer-pro/
├── package.json         # Dependencias y scripts del proyecto
├── server.js            # Servidor local Express (Proxy anti-CORS)
└── public/              # Archivos de la interfaz web (Frontend)
    ├── index.html       # Estructura de la mesa DJ y elementos CSS
    └── script.js        # Motor de sonido (Web Audio API) y lógica de la app
```

---

## 🚀 Requisitos e Instalación

Para ejecutar este proyecto en tu ordenador, necesitas tener instalado **Node.js** (versión 14 o superior).

### Paso 1: Instalar Dependencias
Abre tu terminal de comandos dentro de la carpeta del proyecto y ejecuta el siguiente comando para descargar los módulos necesarios (Express):

```bash
npm install
```

### Paso 2: Iniciar el Servidor Local
Una vez finalizada la instalación, enciende el servidor backend ejecutando:

```bash
npm start
```

Verás un mensaje en la consola indicando que el servidor está corriendo con éxito en `http://localhost:3000`.

---

## 🎚️ Guía de Uso de la Mesa DJ

1.  Abre tu navegador de internet y accede a **`http://localhost:3000`**.
2.  Utiliza la barra de búsqueda inferior para escribir el nombre de un artista o canción (Ej: *Tech House* o *Daft Punk*).
3.  En los resultados, haz clic en **"Cargar A"** o **"Cargar B"** para enviar la pista al vinilo correspondiente.
4.  Pulsa el botón **PLAY / CUE** de cualquiera de los dos lados para arrancar la música.
5.  **Prueba las transiciones:**
    *   Mueve el **Crossfader** central hacia la izquierda o derecha para ver cómo cambia el balance del audio.
    *   Desliza la barra de **Filtro FX (LPF)** de un plato para oscurecer el sonido recortando las frecuencias agudas antes de meter el siguiente tema.

---

## 🛠️ Tecnologías Utilizadas

*   **Backend:** Node.js, Express (utilizado como túnel Proxy seguro para evadir restricciones de dominios cruzados CORS de la API externa).
*   **Frontend:** HTML5, CSS3 moderno (con animaciones Keyframes para los vinilos).
*   **Audio Core:** Web Audio API (Nodos `AudioContext`, `GainNode` y `BiquadFilterNode` para modelar y modular las frecuencias de audio en tiempo real).

---

## 🤖 Créditos de Desarrollo

Este proyecto ha sido desarrollado de forma íntegra utilizando el **Modo IA de Google**. Desde la arquitectura del servidor proxy en Node.js para evadir restricciones de CORS, pasando por el diseño visual de la mesa de mezclas en CSS, hasta la implementación del motor de sonido en tiempo real con la Web Audio API de HTML5. Todo el código ha sido generado, optimizado y empaquetado de manera autónoma por la inteligencia artificial.

---

# 🎛️ Music Mixer Pro - Edición Estática

Aplicación de mezcla DJ creada para funcionar directamente desde el navegador de manera 100% estática, optimizada para **GitHub Pages**.

---

## 🚀 Cómo usar en tu ordenador
Solo haz **doble clic en el archivo index.html** y se abrirá automáticamente en tu navegador listo para buscar música y mezclar sin instalar nada.

---