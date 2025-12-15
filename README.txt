Proyecto: API de Libros Clásicos
================================

Descripción:
------------
Esta API está diseñada para gestionar una colección de libros clásicos. 
Permite a los usuarios realizar diversas operaciones, como buscar y filtrar libros, obtener estadísticas sobre la colección, y más. 
Los endpoints de la API están protegidos por autenticación básica en algunas acciones, como agregar o eliminar libros.

Archivos:
---------
- requirements.txt: Contiene todas las dependencias para poder descargarlas en el entorno virtual facilmente.
- main.py: Archivo principal de la aplicación. Inicializa la API con FastAPI, configura el middleware CORS, aplica un limitador de 
      solicitudes por IP, registra las rutas de libros y define el endpoint raíz (/) con información general de la API.
      También permite ejecutar el servidor con Uvicorn usando variables de entorno para host y puerto.
- books.json: Archivo de datos que contiene la colección de libros utilizada por la API.
      Almacena la información de cada libro (título, autor, país, idioma, año, páginas, enlaces e imagen) y funciona como fuente de 
      datos persistente para las operaciones de lectura, filtrado, creación y eliminación de libros.
- books.py: Este archivo define los endpoints de la API de libros utilizando FastAPI. 
      Incluye rutas para listar, buscar, agregar, eliminar libros, y obtener estadísticas sobre la colección. Los filtros de búsqueda 
      permiten buscar libros por título, autor, idioma, país y número de páginas. También proporciona funcionalidades para obtener una lista 
      de autores, idiomas y países únicos. La adición y eliminación de libros requieren autenticación básica (Basic Auth) y están protegidas 
      por un sistema de limitación de solicitudes (rate limiting). Los datos de los libros se gestionan cargándolos y guardándolos desde/hacia 
      archivos locales.
- data.py: Contiene funciones para cargar y guardar la lista de libros en books.json. 
      La función load_books lee el archivo books.json y retorna su contenido, o una lista vacía si el archivo no existe.
- security.py: Gestiona la autenticación básica HTTP y el control de velocidad (rate limiting) en la API. 
      La función basic_auth valida las credenciales de usuario y contraseña utilizando variables de entorno. 
      La función rate_limiter implementa un contador simple de solicitudes por IP, limitando las peticiones a una cantidad configurada por 
      segundo, y lanza un error HTTP 429 si se excede este límite.
- web_client.html: Crea una interfaz web para interactuar con la API de Libros. 
      Permite configurar la URL base de la API y las credenciales de usuario, listar libros con filtros (como título, autor, idioma, etc.), 
      y agregar nuevos libros a la base de datos.
- web_client.css: Define el estilo visual para la interfaz web de la API de Libros.
- client.js: Este archivo JavaScript actúa como el cliente web para interactuar con la API de Libros. 
      Permite listar, agregar y eliminar libros mediante solicitudes HTTP. Maneja la paginación de los resultados y los filtros de búsqueda 
      como título, autor, idioma, país y número de páginas. También incluye un sistema de notificaciones (toast) para mostrar mensajes de 
      éxito o error.
- requests_client.py: Este archivo contiene un cliente CLI basado en requests que interactúa con la API de Libros desarrollada con FastAPI. 
      Permite realizar varias acciones sobre la API, como listar libros, obtener detalles de un libro, agregar o eliminar libros, y obtener 
      estadísticas sobre la biblioteca.
- .gitignore: Especifica qué archivos y directorios deben ser ignorados por Git al realizar un seguimiento del proyecto.

Recomendaciones y pasos de despliegue:
--------------------------------------
1) Levantar la API:
   - Crear y usar un virtualenv local:
     ```
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     python -m pip install --upgrade pip
     pip install -r requirements.txt
     ```
   - Si se quiere usar en el mismo dispositivo:
     ```
     .\.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
     ```
   - Si se quiere usar en una LAN Servidor/Cliente:
     ```
     $env:ALLOWED_ORIGINS = "http://IP_CLIENTE:5500"
     .\.venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000
     ```

2) Levantar el servidor web:
   - Crear y usar un virtualenv local:
     ```
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     python -m pip install --upgrade pip
     pip install -r requirements.txt
     ```
   - Si se quiere usar en el mismo dispositivo:
     ```
     python -m http.server 5500 --bind 127.0.0.1
     ```
   - Si se quiere usar en una LAN Servidor/Cliente:
     ```
     python -m http.server 5500
     ```

3) Abrir en el navegador:
   - Si se quiere usar en el mismo dispositivo:
     ```
     http://127.0.0.1:5500/web_client.html
     ```
   - Si se quiere usar en una LAN Servidor/Cliente:
     ```
     http://IP_CLIENTE:5500/web_client.html
     ```

4) Seguridad y firewall:
   - Es posible que al intentar usarlo en una LAN Servidor/Cliente no funcione por el firewall. Desactivelo para usarlo.

Cliente Python `requests`
-------------------------
- Ejemplos de uso para un mismo dispositivo:
  ```
  python requests_client.py --base http://127.0.0.1:8000 list
  python requests_client.py --base http://127.0.0.1:8000 list --author "Jane Austen"
  python requests_client.py --base http://127.0.0.1:8000 get 2
  python requests_client.py --base http://127.0.0.1:8000 stats
  python requests_client.py --base http://127.0.0.1:8000 authors
  python requests_client.py --base http://127.0.0.1:8000 --user admin --pass password add --title "Mi libro" --author "Yo" --pages 123
  python requests_client.py --base http://127.0.0.1:8000 --user admin --pass password delete 100
  ```


Fin del README.