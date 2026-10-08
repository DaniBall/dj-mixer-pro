# 🎛️ Music-Mixer-Pro

Mesa de mezclas para el navegador con dos platos, previews de Deezer y procesamiento de audio mediante Web Audio API. La interfaz de `public/` se publica directamente en GitHub Pages, sin compilación ni servidor Node.js en producción.

<a id="indice"></a>
## Índice [↑](#indice)

- [Funcionamiento y características](#funcionamiento)
- [Estructura del proyecto](#estructura)
- [Publicación en GitHub Pages](#github-pages)
- [Uso en local](#uso-local)
- [Guía de uso](#guia)
- [Dependencias y limitaciones](#limitaciones)
- [Comprobaciones](#comprobaciones)
- [Créditos](#creditos)

[Volver al índice](#indice)

<a id="funcionamiento"></a>
## Funcionamiento y características [↑](#indice)

El navegador carga `index.html` y `script.js`, consulta el catálogo mediante AllOrigins y reproduce los previews directamente desde las URLs que devuelve Deezer. La búsqueda no utiliza `/api/search` ni necesita claves de API configuradas en el proyecto.

- **Dos platos:** carga de previews en A y B, reproducción, pausa y mute.
- **Crossfader:** balance entre los volúmenes de los dos platos.
- **Filtros de paso bajo:** control independiente de frecuencia por plato.
- **Vinilos animados:** carátula del álbum y giro durante la reproducción.
- **Buscador:** hasta cinco resultados con preview HTTPS válido; validación de errores y tiempo máximo de espera de 15 segundos.
- **Controles HI/MID/LOW:** actualmente son elementos visuales; no están conectados a nodos de ecualización.

[Volver al índice](#indice)

<a id="estructura"></a>
## Estructura del proyecto [↑](#indice)

```text
music-mixer-pro/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml # Publicación de public/ desde master o ejecución manual
├── package.json            # Dependencia Express y comando npm start para uso local
├── package-lock.json       # Versiones de dependencias del servidor local
├── server.js               # Servidor Express local y endpoint /api/search
├── README.md
└── public/
    ├── index.html          # Interfaz, estilos y referencia relativa a script.js
    └── script.js           # Motor Web Audio, búsqueda y resultados
```

GitHub Pages recibe exclusivamente el contenido de `public/`. El archivo `server.js` se conserva para ejecutar la interfaz en local.

[Volver al índice](#indice)

<a id="github-pages"></a>
## Publicación en GitHub Pages [↑](#indice)

1. Sube los cambios del proyecto a la rama `master` del repositorio de GitHub.
2. Abre **Settings → Pages → Build and deployment**.
3. Selecciona **GitHub Actions** en **Source**.
4. En **Actions**, abre **Deploy GitHub Pages**. Si el primer intento se ejecutó antes de activar Pages, vuelve a ejecutarlo con **Run workflow** sobre `master`.
5. Espera a que termine el job `deploy` y abre el enlace del entorno `github-pages`.

Con el repositorio `DaniBall/dj-mixer-pro`, la dirección esperada, sin dominio personalizado, es:

<https://daniball.github.io/dj-mixer-pro/>

El workflow se ejecuta automáticamente en los siguientes pushes a `master` y también permite ejecución manual. Comprueba la sintaxis de `public/script.js`, configura Pages, sube `public/` como artefacto y lo despliega. No necesita `npm install` ni un paso de compilación.

La interfaz utiliza una referencia relativa a `script.js`, compatible con la subruta `/dj-mixer-pro/`. Si cambias la rama de publicación, actualiza `on.push.branches` en `.github/workflows/deploy-pages.yml`.

Referencia: [workflows personalizados de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

[Volver al índice](#indice)

<a id="uso-local"></a>
## Uso en local [↑](#indice)

Para servir la misma interfaz mediante el servidor Express incluido, instala Node.js y npm y ejecuta desde la raíz del repositorio:

```bash
npm ci
npm start
```

Abre <http://localhost:3000>. El navegador seguirá consultando AllOrigins, igual que la versión de Pages; el endpoint local `/api/search` existe en `server.js`, pero la interfaz actual no lo utiliza.

También puedes servir `public/` con un servidor de archivos estáticos. No se necesita un archivo `.env` para esta configuración. Abrir `public/index.html` directamente no es la ruta de verificación recomendada: utiliza HTTP en local o HTTPS en Pages.

[Volver al índice](#indice)

<a id="guia"></a>
## Guía de uso [↑](#indice)

1. Abre la URL publicada en Pages o la interfaz local.
2. Escribe un artista o una canción y pulsa **Buscar** o **Enter**.
3. Pulsa **Cargar A** o **Cargar B** en un resultado para asignar su preview a un plato.
4. Pulsa **PLAY/CUE** para reproducir o pausar ese plato.
5. Ajusta su volumen y filtro, utiliza **MUTE** para silenciarlo y mueve el **CROSSFADER** para mezclar ambos platos.

Los resultados se crean con texto y eventos DOM, de modo que los títulos y artistas no se interpretan como HTML ni se insertan en código `onclick`.

[Volver al índice](#indice)

<a id="limitaciones"></a>
## Dependencias y limitaciones [↑](#indice)

- **Servicios externos:** la búsqueda depende de Deezer y del proxy público AllOrigins. Una caída, bloqueo, límite de peticiones o respuesta incompatible puede impedir buscar, aunque Pages sirva correctamente la interfaz.
- **Contrato de búsqueda:** se consulta `https://api.deezer.com/search?q=...` mediante `https://api.allorigins.win/get?url=...`. AllOrigins devuelve el cuerpo remoto como texto en `contents`; se comprueban tanto el HTTP del proxy como `status.http_code` y los posibles errores de Deezer.
- **Previews:** son fragmentos del catálogo, habitualmente de unos 30 segundos, y su disponibilidad puede variar. Los resultados sin URL de preview HTTPS válida se omiten.
- **Audio entre dominios:** el proveedor del preview debe permitir CORS para que Web Audio procese el sonido. El proxy del buscador no modifica los permisos de los archivos de audio.
- **Navegador:** se requiere Web Audio API y reproducción habilitada mediante interacción del usuario. La compatibilidad y disponibilidad reales deben comprobarse en el navegador utilizado.
- **Ecualización:** los deslizadores HI/MID/LOW no modifican el audio en la implementación actual.
- **Alojamiento:** GitHub Pages sirve la interfaz estática; no ejecuta el servidor Express ni aloja el endpoint `/api/search`.

Referencia del proxy: [AllOrigins](https://github.com/gnuns/allOrigins).

[Volver al índice](#indice)

<a id="comprobaciones"></a>
## Comprobaciones [↑](#indice)

Puedes comprobar la sintaxis y los espacios de los cambios sin iniciar servicios:

```bash
node --check public/script.js
git diff --check
```

El workflow también comprueba la sintaxis antes de publicar. Estas comprobaciones no acreditan el funcionamiento real de Deezer, AllOrigins ni la reproducción del audio.

Tras el despliegue, comprueba en el navegador que carga la interfaz bajo la subruta del repositorio, que una búsqueda devuelve resultados y que puedes cargar y reproducir un preview en cada plato. Si la búsqueda muestra un error, revisa las peticiones del navegador para distinguir la carga del sitio de la disponibilidad de los proveedores.

[Volver al índice](#indice)

<a id="creditos"></a>
## Créditos [↑](#indice)

El README original atribuye el desarrollo inicial al Modo IA de Google. La configuración actual incorpora publicación estática mediante GitHub Actions y la adaptación del buscador para ese alojamiento.

[Volver al índice](#indice)
