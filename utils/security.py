from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import os
import secrets
import time
import threading

security = HTTPBasic()

# Credenciales de variables de entorno (sobrescribe en tu shell)
API_USER = os.environ.get("API_USER", "admin")
API_PASS = os.environ.get("API_PASS", "password")

# Límite de velocidad: solicitudes por segundo por IP (configurable via env)
RATE_LIMIT_RPS = int(os.environ.get("RATE_LIMIT_RPS", "5"))

# Contador simple en memoria por IP. Bueno para desarrollo; no para producción multi-proceso.
_lock = threading.Lock()
_requests = {}  # ip -> {"ts": segundo_int, "count": int}

def basic_auth(credentials: HTTPBasicCredentials = Depends(security)) -> str:
    """Verifica credenciales HTTP Basic; retorna el nombre de usuario si es exitoso."""
    valid_user = secrets.compare_digest(credentials.username, API_USER)
    valid_pass = secrets.compare_digest(credentials.password, API_PASS)
    if not (valid_user and valid_pass):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de autenticación inválidas",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

def rate_limiter(request: Request):
    """Limitador simple de solicitudes por segundo por IP.
    Lanza HTTPException 429 cuando se excede el límite.
    """
    ip = request.client.host if request.client else "desconocida"
    now = int(time.time())
    with _lock:
        entry = _requests.get(ip)
        if not entry or entry.get("ts") != now:
            # ventana de nuevo segundo
            _requests[ip] = {"ts": now, "count": 1}
            count = 1
        else:
            entry["count"] += 1
            count = entry["count"]
    if count > RATE_LIMIT_RPS:
        raise HTTPException(status_code=429, detail="Demasiadas solicitudes")
    return True