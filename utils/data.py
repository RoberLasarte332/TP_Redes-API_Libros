import json
from pathlib import Path

BOOKS_FILE = Path("books.json")

def load_books():
    """Carga la lista de libros desde un archivo JSON."""
    try:
        with open(BOOKS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return []
    
def save_books(data):
    """Guarda los datos de libros en el archivo JSON."""
    # Escribe con indentación para mejor legibilidad
    with open(BOOKS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
