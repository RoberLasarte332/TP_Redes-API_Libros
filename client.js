function authHeader() {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;
  return { Authorization: "Basic " + btoa(user + ":" + pass) };
}

function setStatus(msg, error = false) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.style.color = error ? "darkred" : "darkgreen";
}

function getBase() {
  return document.getElementById("baseUrl").value;
}

function readFilters() {
  return {
    title: document.getElementById("filterTitle").value.trim(),
    author: document.getElementById("filterAuthor").value.trim(),
    language: document.getElementById("filterLanguage").value.trim(),
    country: document.getElementById("filterCountry").value.trim(),
    pages_min: document.getElementById("filterPagesMin").value.trim(),
    pages_max: document.getElementById("filterPagesMax").value.trim(),
  };
}

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const k in params) {
    if (params[k]) q.append(k, params[k]);
  }
  return q.toString();
}

async function listBooks() {
  setStatus("Cargando...");
  const base = getBase();
  const filters = buildQuery(readFilters());
  const url = filters ? `${base}/books?${filters}` : `${base}/books`;

  try {
    const res = await fetch(url);
    if (!res.ok) return setStatus("Error al listar", true);

    const data = await res.json();
    const books = Array.isArray(data) ? data : (data.Libros || []);
    renderBooks(books);
    setStatus(`Listo — ${books.length} libros.`);
  } catch (e) {
    console.error(e);
    setStatus("Error de conexión", true);
  }
}

function renderBooks(books) {
  const container = document.getElementById("books");
  container.innerHTML = "";

  if (books.length === 0) {
    container.textContent = "No hay libros.";
    return;
  }

  books.forEach((b, i) => {
    const div = document.createElement("div");
    div.className = "book";
    div.innerHTML = `
      <strong>${b.title}</strong> — ${b.author || "—"}<br>
      Páginas: ${b.pages || "—"} — Idioma: ${b.language || "—"}<br>
      <button class="del-btn" data-index="${i}">Borrar</button>
    `;
    container.appendChild(div);
  });

  document.querySelectorAll(".del-btn").forEach(btn => {
    btn.onclick = () => deleteBook(btn.dataset.index);
  });
}

async function deleteBook(index) {
  const url = `${getBase()}/books/${index}`;
  setStatus("Eliminando...");

  try {
    const res = await fetch(url, { method: "DELETE", headers: authHeader() });
    if (!res.ok) return setStatus("Error al borrar", true);

    listBooks();
    setStatus("Libro eliminado.");
  } catch (e) {
    setStatus("Error de conexión", true);
  }
}

async function addBook() {
  const payload = {
    title: document.getElementById("title").value.trim(),
    author: document.getElementById("author").value.trim() || null,
    pages: parseInt(document.getElementById("pages").value) || null,
    language: document.getElementById("language").value.trim() || null,
  };

  if (!payload.title) return setStatus("El título es obligatorio", true);

  setStatus("Agregando...");

  try {
    const res = await fetch(`${getBase()}/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return setStatus("Error al agregar", true);
    listBooks();
    setStatus("Libro agregado.");
  } catch (e) {
    setStatus("Error de conexión", true);
  }
}

// EVENTS
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnList").onclick = listBooks;
  document.getElementById("btnClearFilters").onclick = () => {
    ["filterTitle","filterAuthor","filterLanguage","filterCountry","filterPagesMin","filterPagesMax"]
      .forEach(id => document.getElementById(id).value = "");
    listBooks();
  };
  document.getElementById("btnAdd").onclick = addBook;

  listBooks();
});
