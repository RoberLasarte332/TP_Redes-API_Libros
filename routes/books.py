from fastapi import APIRouter, Depends, Request, HTTPException, status
from typing import Optional
from pydantic import BaseModel
from utils.data import load_books, save_books
from utils.security import basic_auth

class Book(BaseModel):
    title: str
    author: Optional[str] = None
    pages: Optional[int] = None
    country: Optional[str] = None
    language: Optional[str] = None
    year: Optional[int] = None
    link: Optional[str] = None
    imageLink: Optional[str] = None

# Router para endpoints de libros
router = APIRouter(prefix="/books", tags=["books"])

@router.get("")
def get_books(author: Optional[str] = None, title: Optional[str] = None, language: Optional[str] = None, country: Optional[str] = None, pages_min: Optional[int] = None, pages_max: Optional[int] = None):
    """Busca y filtra libros por autor, título, idioma, país o cantidad de páginas."""
    books = load_books()
    # Filtrar por autor
    if author:
        books = [b for b in books if author.lower() in b.get("author", "").lower()]
    # Filtrar por título (coincidencia parcial)
    if title:
        books = [b for b in books if title.lower() in b.get("title", "").lower()]
    # Filtrar por idioma
    if language:
        books = [b for b in books if language.lower() in b.get("language", "").lower()]
    # Filtrar por país
    if country:
        books = [b for b in books if country.lower() in b.get("country", "").lower()]
    # Filtrar por rango de páginas
    if pages_min is not None:
        books = [b for b in books if b.get("pages", 0) >= pages_min]
    if pages_max is not None:
        books = [b for b in books if b.get("pages", 0) <= pages_max]
    return {"Cantidad": len(books), "Libros": books}

@router.get("/stats")
def get_stats():
    """Muestra estadísticas sobre la colección de libros."""
    books = load_books()
    if not books:
        return {"error": "Ningún libro encontrado"}
    # Función para formatear años (negativos se muestran como A.C.)
    def format_year(year):
        if year < 0:
            return f"{abs(year)} A.C."
        return str(year)
    años = [b.get("year", 0) for b in books]
    año_más_antiguo = min(años)
    año_más_reciente = max(años)
    return {
        "total_libros": len(books),
        "total_paginas": sum(b.get("pages", 0) for b in books),
        "promedio_paginas": sum(b.get("pages", 0) for b in books) / len(books),
        "año_más_antiguo": format_year(año_más_antiguo),
        "año_más_reciente": format_year(año_más_reciente),
        "autores_unicos": len(set(b.get("author", "Unknown") for b in books)),
        "paises_unicos": len(set(b.get("country", "Unknown") for b in books)),
        "idiomas_unicos": len(set(b.get("language", "Unknown") for b in books))
    }

@router.get("/authors")
def get_authors():
    """Lista todos los autores únicos."""
    books = load_books()
    authors = sorted(set(b.get("author", "Unknown") for b in books))
    return {"cantidad": len(authors), "autores": authors}

@router.get("/languages")
def get_languages():
    """Lista todos los idiomas únicos."""
    books = load_books()
    languages = sorted(set(b.get("language", "Unknown") for b in books))
    return {"cantidad": len(languages), "idiomas": languages}

@router.get("/countries")
def get_countries():
    """Lista todos los países únicos."""
    books = load_books()
    countries = sorted(set(b.get("country", "Unknown") for b in books))
    return {"cantidad": len(countries), "paises": countries}

@router.get("/{book_id}")
def get_book(book_id: int):
    """Muestra un libro específico por índice."""
    books = load_books()
    if 0 <= book_id < len(books):
        return books[book_id]
    return {"error": f"El libro con ID {book_id} no existe. Pruebe con un índice entre 0 y {len(books) - 1}."}

@router.post("")
def add_book(book: Book, username: str = Depends(basic_auth)):
    """Añade un libro nuevo (validado por Pydantic). Requiere Basic Auth y está sujeto a rate limit."""
    books = load_books()
    book_dict = book.dict()
    books.append(book_dict)
    save_books(books)
    return {"message": "Libro agregado", "book": book_dict}

@router.delete("/{book_id}")
def delete_book(book_id: int, username: str = Depends(basic_auth)):
    """Elimina un libro por índice. Requiere Basic Auth y está sujeto a limitación."""
    books = load_books()
    if 0 <= book_id < len(books):
        removed = books.pop(book_id)
        save_books(books)
        return {"message": "Libro eliminado", "book": removed}
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"El libro con ID {book_id} no existe.")