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
  toast.className = 'toast';
  if (error) toast.classList.add('error');
  toast.classList.add('show');

  setTimeout(() => {
    toast.className = 'toast hidden';
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
  el.className = error ? 'error' : 'success';
}

function getBase() {
  return document.getElementById('baseUrl').value;
}

function readFilters() {
  return {
    title: document.getElementById('filterTitle').value.trim(),
    author: document.getElementById('filterAuthor').value,
    language: document.getElementById('filterLanguage').value,
    country: document.getElementById('filterCountry').value,
    pages_min: document.getElementById('filterPagesMin').value,
    pages_max: document.getElementById('filterPagesMax').value,
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
// LOAD SELECT OPTIONS
// ===============================
async function loadSelect(id, endpoint, label) {
  const select = document.getElementById(id);
  select.innerHTML = `<option value="">Todos</option>`;

  try {
    const res = await fetch(`${getBase()}${endpoint}`);
    if (!res.ok) return;

    const data = await res.json();

    const values = data.autores || data.idiomas || data.paises || [];

    values.forEach((v) => {
      if (!v) return;
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error(`Error cargando ${label}`, e);
  }
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
    allBooks = data.Libros || [];
    currentPage = 1;

    renderPage();
    setStatus(`Listo — ${allBooks.length} libros encontrados.`);
  } catch (e) {
    setStatus('Error de conexión con la API', true);
  }
}

function renderPage() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  renderBooks(allBooks.slice(start, end));

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
      País: ${b.country || '—'}<br>
      <button class="del-btn" data-id="${i}">Borrar</button>
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
  try {
    const res = await fetch(`${getBase()}/books/${id}`, {
      method: 'DELETE',
      headers: authHeader(),
    });

    if (!res.ok) {
      showToast('Error al eliminar el libro', true);
      return;
    }

    listBooks();
    showToast('🗑 Libro eliminado con éxito', true);
  } catch {
    showToast('Error de conexión', true);
  }
}

async function addBook() {
  const payload = {
    title: document.getElementById('title').value.trim(),
    author: document.getElementById('author').value || null,
    pages: parseInt(document.getElementById('pages').value) || null,
    language: document.getElementById('language').value || null,
    country: document.getElementById('country').value || null,
  };

  if (!payload.title) {
    showToast('El título es obligatorio', true);
    return;
  }

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
      return;
    }

    document.getElementById('title').value = '';
    document.getElementById('pages').value = '';

    listBooks();
    loadAllSelects();
    showToast('📘 Libro creado con éxito');
  } catch {
    showToast('Error de conexión', true);
  }
}

// ===============================
// INIT
// ===============================
function loadAllSelects() {
  loadSelect('filterAuthor', '/books/authors', 'author');
  loadSelect('filterLanguage', '/books/languages', 'language');
  loadSelect('filterCountry', '/books/countries', 'country');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnList').onclick = listBooks;
  document.getElementById('btnAdd').onclick = addBook;

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

  document.getElementById('prevPage').onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage();
    }
  };

  document.getElementById('nextPage').onclick = () => {
    if (currentPage * PAGE_SIZE < allBooks.length) {
      currentPage++;
      renderPage();
    }
  };

  loadAllSelects();
  listBooks();
});
