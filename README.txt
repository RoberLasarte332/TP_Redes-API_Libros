Proyecto: API de Libros Clásicos
=================================

Resumen rápido
--------------
- Servidor: FastAPI (`main.py`) con endpoints para listar, filtrar, agregar y borrar libros.
- Persistencia: `books.json` (archivo JSON usado como almacenamiento en este prototipo).
- Seguridad: autenticación básica (env: `API_USER`/`API_PASS`) y limitador de requests en memoria (`RATE_LIMIT_RPS`).
- Frontend de prueba: `web_client.html` (interfaz estática para pruebas).

Recomendaciones y pasos de despliegue
------------------------------------
1) Dependencias y entorno
   - Crear y usar un virtualenv local (no versionar `.venv`):
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\python -m pip install --upgrade pip
     .\.venv\Scripts\python -m pip install fastapi uvicorn pydantic
     .\.venv\Scripts\python -m pip freeze > requirements.txt
     ```

2) Configuración por variables de entorno
   - Variables relevantes:
     - `HOST` (ej. `0.0.0.0`) — host donde bindear el servidor
     - `PORT` (ej. `8000`) — puerto del servidor
     - `API_USER`, `API_PASS` — credenciales para endpoints protegidos
     - `RATE_LIMIT_RPS` — requests por segundo por IP (dev: 5)
     - `ALLOWED_ORIGINS` — orígenes CORS (coma-separados), ej: `http://mi-front:5500`

3) Arrancar en desarrollo
   - Ejecutar con autoreload (dev):
     ```powershell
     .\.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
     ```

4) Arrancar en LAN / probar desde otro host (dev)
   - En la máquina servidor:
     ```powershell
     $env:HOST = "0.0.0.0"
     $env:PORT = "8000"
     $env:ALLOWED_ORIGINS = "http://192.168.1.42:5500"  # origen del frontend
     .\.venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000
     ```
   - Abrir el frontend de prueba en la otra máquina (ejecutar `python -m http.server 5500` en la carpeta con `web_client.html`) y establecer `API Base URL` a `http://<IP_SERVIDOR>:8000`.

4.a) Paso a paso (comandos PowerShell) — Host servidor y Host cliente
   - Supongamos:
     - Máquina SERVIDOR (donde corre la API) tiene IP `192.168.1.10`
     - Máquina CLIENTE (donde se abre el navegador y sirve la UI estática) tiene IP `192.168.1.42`

   - En la MÁQUINA SERVIDOR (PowerShell):
     ```powershell
     # 1) Entrar al directorio del proyecto
     cd C:\Users\Rober\OneDrive\Escritorio\TP_Redes

     # 2) Configurar variables de entorno para permitir el origen del frontend
     $env:ALLOWED_ORIGINS = "http://192.168.1.42:5500"

     # (Opcional) ajustar credenciales y rate limit
     $env:API_USER = "admin"
     $env:API_PASS = "password"
     $env:RATE_LIMIT_RPS = "10"

     # 3) Iniciar el servidor enlazando todas las interfaces (accesible desde la LAN)
     .\.venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000
     ```

   - En la MÁQUINA CLIENTE (PowerShell):
     ```powershell
     # 1) Entrar al directorio donde está web_client.html
     cd C:\ruta\a\la\carpeta\con\web_client

     # 2) Servir la carpeta local en el puerto 5500
     .\python -m http.server 5500

     # 3) Abrir en el navegador:
     #    http://192.168.1.42:5500/web_client.html
     # (en la UI poner API Base URL: http://192.168.1.10:8000)
     ```

   - Verificaciones útiles:
     ```powershell
     # Desde la MÁQUINA CLIENTE (no usa CORS y comprueba conectividad):
     Invoke-WebRequest -Uri "http://192.168.1.10:8000/books" -UseBasicParsing

     # En la MÁQUINA SERVIDOR: comprobar que uvicorn está corriendo en 0.0.0.0:8000
     netstat -ano | Select-String ":8000"
     ```

5) Seguridad y firewall
   - Abrir el puerto en el firewall si expones en la LAN/Internet (Windows Defender Firewall o reglas del host cloud).

6) Notas sobre limitador y consistencia
   - El limitador actual es en memoria y por IP: funciona en un único proceso. Si levantas la app con varios workers o múltiples instancias, el contador no será compartido.
   - Para entornos con múltiples procesos/instancias, usar Redis/central store para rate limiting.

Fin del README.
