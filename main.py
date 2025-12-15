from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes.books import router as books_router
from utils.security import rate_limiter
from starlette.middleware.base import BaseHTTPMiddleware
import os

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        # Permitir que preflight del navegador pase sin contar hacia el límite de velocidad
        if request.method == "OPTIONS":
            return await call_next(request)
        try:
            # rate_limiter lanza HTTPException cuando se excede el límite
            rate_limiter(request)
        except HTTPException as e:
            return JSONResponse(status_code=e.status_code, content={"detail": e.detail})
        return await call_next(request)

app = FastAPI(
    title="API de Libros Clásicos",
    description="API para buscar y filtrar libros clásicos",
    version="1.0.0"
)

# Incluir routers
# Middleware CORS: maneja preflight (OPTIONS) del navegador antes del limitador
# Permite configurar orígenes permitidos mediante variable ALLOWED_ORIGINS (separados por coma)
_env_origins = os.environ.get("ALLOWED_ORIGINS")
if _env_origins:
    origins = [o.strip() for o in _env_origins.split(",") if o.strip()]
else:
    origins = [
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Añadir middleware global de limitación de velocidad (se aplica a todas las solicitudes)
app.add_middleware(RateLimitMiddleware)
app.include_router(books_router)

@app.get("/")
def read_root():
    """Bienvenido al endpoint con información de la API."""
    return {
        "message": "Bienvenido a la API de Libros Clásicos",
        "endpoints": [
            "GET / - Muestra este mensaje",
            "GET /books - Buscar todos los libros",
            "GET /books?author=Name - Filtrar libros por autor",
            "GET /books?title=Title - Buscar libros por título",
            "GET /books?language=English - Filtrar por idioma",
            "GET /books?country=Spain - Filtrar por país",
            "GET /books?pages_min=200&pages_max=500 - Filtrar por rango de páginas",
            "GET /books/{id} - Buscar un libro específico por índice",
            "GET /books/stats - Estadísticas de la colección",
            "GET /books/authors - Listar todos los autores",
            "GET /books/languages - Listar todos los idiomas",
            "GET /books/countries - Listar todos los países",
            "POST /books - Agregar un libro (Basic Auth, protegido)",
            "DELETE /books/{id} - Eliminar un libro por índice (Basic Auth, protegido)",
            "GET /docs - Documentación de la API (Swagger UI)",
            "Nota: endpoints POST/DELETE requieren Basic Auth; existe limitación de requests por IP (RATE_LIMIT_RPS env var)"
        ]
    }

# (Middleware CORS movido arriba para asegurar que preflight se maneja antes de limitación)
if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)