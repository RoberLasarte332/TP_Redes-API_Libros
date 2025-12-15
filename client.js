// ===============================
// CONFIG + STATE
// ===============================
let allBooks = [];
let currentPage = 1;
const PAGE_SIZE = 10;

// ===============================
// TOAST (CARTEL)
// ===============================
function showToast(message, error = false) {
  const toast = document.getElementById('toast');

  toast.textContent = message;
  toast.className = 'toast show';
  if (error) toast.classList.add('error');

  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// ===============================
// HELPERS
// ===============================
function authHeader() {
  const user = document.getElementById('user').value;
  const pass = document.getElementById('pass').value;
  return { Authorization: 'Basic ' + btoa(user + ':' + pass) };
}

function setStatus(msg, error = false) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.style.color = error ? 'darkred' : 'darkgreen';
}

function getBase() {
  return document.getElementById('baseUrl').value;
}

function readFilters() {
  return {
    title: document.getElementById('filterTitle').value.trim(),
    author: document.getElementById('filterAuthor').value.trim(),
    language: document.getElementById('filterLanguage').value.trim(),
    country: document.getElementById('filterCountry').value.trim(),
    pages_min: document.getElementById('filterPagesMin').value.trim(),
    pages_max: document.getElementById('filterPagesMax').value.trim(),
  };
}

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const k in params) {
    if (params[k]) q.append(k, params[k]);
  }
  return q.toString();
}

// ===============================
// LIST + PAGINATION
// ===============================
async function listBooks() {
  setStatus('Cargando...');
  const base = getBase();
  const filters = buildQuery(readFilters());
  const url = filters ? `${base}/books?${filters}` : `${base}/books`;

  try {
    const res = await fetch(url);
    if (!res.ok) return setStatus('Error al listar libros', true);

    const data = await res.json();
    allBooks = Array.isArray(data) ? data : data.Libros || [];
    currentPage = 1;

    renderPage();
    setStatus(`Listo — ${allBooks.length} libros encontrados.`);
  } catch (e) {
    console.error(e);
    setStatus('Error de conexión con la API', true);
  }
}

function renderPage() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageBooks = allBooks.slice(start, end);

  renderBooks(pageBooks);

  const totalPages = Math.max(1, Math.ceil(allBooks.length / PAGE_SIZE));
  document.getElementById(
    'pageInfo'
  ).textContent = `Página ${currentPage} de ${totalPages}`;

  document.getElementById('prevPage').disabled = currentPage === 1;
  document.getElementById('nextPage').disabled = currentPage === totalPages;
}

function renderBooks(books) {
  const container = document.getElementById('books');
  container.innerHTML = '';

  if (books.length === 0) {
    container.textContent = 'No hay libros para mostrar.';
    return;
  }

  books.forEach((b, i) => {
    const div = document.createElement('div');
    div.className = 'book';
    div.innerHTML = `
      <strong>${b.title}</strong> — ${b.author || '—'}<br>
      Páginas: ${b.pages || '—'} — Idioma: ${b.language || '—'}<br>
      <button class="del-btn" data-id="${b.id ?? i}">Borrar</button>
    `;
    container.appendChild(div);
  });

  document.querySelectorAll('.del-btn').forEach((btn) => {
    btn.onclick = () => deleteBook(btn.dataset.id);
  });
}

// ===============================
// CRUD
// ===============================
async function deleteBook(id) {
  const url = `${getBase()}/books/${id}`;
  setStatus('Eliminando libro...');

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: authHeader(),
    });

    if (!res.ok) {
      showToast('Error al eliminar el libro', true);
      return setStatus('Error al borrar el libro', true);
    }

    listBooks();
    setStatus('Libro eliminado correctamente.');
    showToast('🗑 Libro eliminado con éxito', true);
  } catch (e) {
    setStatus('Error de conexión con la API', true);
    showToast('Error de conexión', true);
  }
}

async function addBook() {
  const payload = {
    title: document.getElementById('title').value.trim(),
    author: document.getElementById('author').value.trim() || null,
    pages: parseInt(document.getElementById('pages').value) || null,
    language: document.getElementById('language').value.trim() || null,
  };

  if (!payload.title) {
    showToast('El título es obligatorio', true);
    return setStatus('El título es obligatorio', true);
  }

  setStatus('Agregando libro...');

  try {
    const res = await fetch(`${getBase()}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      showToast('Error al crear el libro', true);
      return setStatus('Error al agregar el libro', true);
    }

    document.getElementById('title').value = '';
    document.getElementById('author').value = '';
    document.getElementById('pages').value = '';
    document.getElementById('language').value = '';

    listBooks();
    setStatus('Libro agregado correctamente.');
    showToast('📘 Libro creado con éxito');
  } catch (e) {
    setStatus('Error de conexión con la API', true);
    showToast('Error de conexión', true);
  }
}

// ===============================
// EVENTS
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnList').onclick = listBooks;

  document.getElementById('btnClearFilters').onclick = () => {
    [
      'filterTitle',
      'filterAuthor',
      'filterLanguage',
      'filterCountry',
      'filterPagesMin',
      'filterPagesMax',
    ].forEach((id) => (document.getElementById(id).value = ''));
    listBooks();
  };

  document.getElementById('btnAdd').onclick = addBook;

  document.getElementById('prevPage').onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage();
    }
  };

  document.getElementById('nextPage').onclick = () => {
    const totalPages = Math.ceil(allBooks.length / PAGE_SIZE);
    if (currentPage < totalPages) {
      currentPage++;
      renderPage();
    }
  };

  listBooks();
});
