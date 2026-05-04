const STORAGE_KEY = 'infoU_notes_v1';
const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

let state = { courses: [], selectedCourseId: null, expandedNoteId: null, newCourseColor: PRESET_COLORS[0] };

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function init() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
    }
  } catch (e) {}
  if (state.courses.length > 0 && !state.selectedCourseId) {
    state.selectedCourseId = state.courses[0].id;
  }
  renderColorPresets();
  render();
}

function save() {
  const toSave = {
    courses: state.courses,
    selectedCourseId: state.selectedCourseId,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

function getSelectedCourse() {
  return state.courses.find((c) => c.id === state.selectedCourseId);
}

function addCourse(name, color) {
  state.courses.push({ id: crypto.randomUUID(), name, color, notes: [] });
  state.selectedCourseId = state.courses[state.courses.length - 1].id;
  save();
  render();
}

function removeCourse(id) {
  const course = state.courses.find((c) => c.id === id);
  if (!course) return;
  if (course.notes.length > 0) {
    alert('Elimina todos los apuntes del curso antes de eliminarlo.');
    return;
  }
  state.courses = state.courses.filter((c) => c.id !== id);
  if (state.selectedCourseId === id) {
    state.selectedCourseId = state.courses.length > 0 ? state.courses[0].id : null;
  }
  save();
  render();
}

function selectCourse(id) {
  state.selectedCourseId = id;
  state.expandedNoteId = null;
  save();
  render();
}

function addNote(title, content) {
  const course = getSelectedCourse();
  if (!course) return;
  const now = new Date().toISOString();
  course.notes.push({ id: crypto.randomUUID(), title, content, createdAt: now, updatedAt: now });
  save();
  render();
}

function updateNote(noteId, title, content) {
  const course = getSelectedCourse();
  if (!course) return;
  const note = course.notes.find((n) => n.id === noteId);
  if (!note) return;
  note.title = title;
  note.content = content;
  note.updatedAt = new Date().toISOString();
  state.expandedNoteId = null;
  save();
  render();
}

function removeNote(noteId) {
  const course = getSelectedCourse();
  if (!course) return;
  course.notes = course.notes.filter((n) => n.id !== noteId);
  if (state.expandedNoteId === noteId) state.expandedNoteId = null;
  save();
  render();
}

function toggleNote(noteId) {
  state.expandedNoteId = state.expandedNoteId === noteId ? null : noteId;
  render();
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Ahora';
  if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getLastUpdated() {
  let latest = null;
  state.courses.forEach((c) => {
    c.notes.forEach((n) => {
      const d = new Date(n.updatedAt);
      if (!latest || d > latest) latest = d;
    });
  });
  return latest ? formatDate(latest.toISOString()) : null;
}

function getTotalNotes() {
  return state.courses.reduce((sum, c) => sum + c.notes.length, 0);
}

function renderColorPresets() {
  const container = document.getElementById('colorPresets');
  if (!container) return;
  container.innerHTML = PRESET_COLORS.map((c) => `
    <button type="button" data-color="${c}" class="w-7 h-7 rounded-lg border-2 transition-all ${state.newCourseColor === c ? 'border-slate-800 dark:border-white scale-110' : 'border-transparent'}" style="background-color: ${c}"></button>
  `).join('');
  container.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.newCourseColor = btn.dataset.color;
      renderColorPresets();
    });
  });
}

function render() {
  renderPills();
  renderDashboard();
  renderCourseForm();
  renderNotesSection();

  const noCoursesEmpty = document.getElementById('noCoursesEmpty');
  const coursePills = document.getElementById('coursePills');
  const hasCourses = state.courses.length > 0;
  if (noCoursesEmpty) noCoursesEmpty.classList.toggle('hidden', hasCourses);
  if (coursePills) coursePills.style.display = hasCourses ? '' : 'none';
}

function renderPills() {
  const container = document.getElementById('coursePills');
  if (!container) return;
  if (state.courses.length === 0) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = state.courses.map((c) => {
    const isSelected = c.id === state.selectedCourseId;
    return `<div class="flex items-center gap-0.5">
      <button data-course-id="${c.id}" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 whitespace-nowrap ${isSelected ? 'border-slate-800 dark:border-white shadow-sm' : 'border-transparent hover:opacity-90'}" style="background-color: ${c.color}18; color: ${c.color}; border-color: ${isSelected ? c.color : 'transparent'}">${escapeHtml(c.name)} <span class="ml-1 opacity-60">${c.notes.length}</span></button>
      <button data-delete-course="${c.id}" class="w-6 h-6 flex items-center justify-center rounded-md text-slate-300 hover:bg-red-100 hover:text-red-500 transition-all flex-shrink-0" title="Eliminar curso"><i class="fas fa-times text-[10px]"></i></button>
    </div>`;
  }).join('');

  container.querySelectorAll('[data-course-id]').forEach((btn) => {
    btn.addEventListener('click', () => selectCourse(btn.dataset.courseId));
  });
  container.querySelectorAll('[data-delete-course]').forEach((btn) => {
    btn.addEventListener('click', () => removeCourse(btn.dataset.deleteCourse));
  });
}

function renderDashboard() {
  const totalCourses = document.getElementById('totalCourses');
  const totalNotes = document.getElementById('totalNotes');
  const lastUpdated = document.getElementById('lastUpdated');
  if (totalCourses) totalCourses.textContent = state.courses.length;
  if (totalNotes) totalNotes.textContent = getTotalNotes();
  const lu = getLastUpdated();
  if (lastUpdated) lastUpdated.textContent = lu || '—';
}

function renderCourseForm() {
  const container = document.getElementById('courseFormContainer');
  const input = document.getElementById('courseNameInput');
  if (!container) return;
  container.classList.add('hidden');
  if (input) input.value = '';
}

function renderNotesSection() {
  const section = document.getElementById('notesSection');
  const course = getSelectedCourse();
  const hasSelection = !!course;

  if (section) section.classList.toggle('hidden', !hasSelection);
  if (!hasSelection || !course) return;

  const notesList = document.getElementById('notesList');
  const notesEmpty = document.getElementById('notesEmpty');
  const searchInput = document.getElementById('searchInput');
  if (!notesList || !notesEmpty) return;

  const query = (searchInput?.value || '').toLowerCase().trim();
  const filtered = query
    ? course.notes.filter((n) => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query))
    : course.notes;

  if (filtered.length === 0) {
    notesList.innerHTML = '';
    notesEmpty.classList.remove('hidden');
    return;
  }

  notesEmpty.classList.add('hidden');
  notesList.innerHTML = filtered.map((n) => {
    const isExpanded = state.expandedNoteId === n.id;
    const preview = n.content.length > 100 ? n.content.slice(0, 100) + '...' : n.content;
    return `<div class="bg-white dark-surface rounded-2xl border border-slate-200/80 dark-border shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <div class="p-4 flex items-start justify-between gap-3 cursor-pointer" data-toggle="${n.id}">
        <div class="min-w-0 flex-1" style="border-left: 3px solid ${course.color}; padding-left: 12px;">
          <h3 class="font-bold text-slate-800 dark-text-primary truncate">${escapeHtml(n.title) || 'Sin título'}</h3>
          ${isExpanded ? '' : `<p class="text-sm text-slate-500 dark-text-muted mt-0.5 line-clamp-2 whitespace-pre-wrap">${escapeHtml(preview)}</p>`}
          <p class="text-[11px] text-slate-400 dark-text-dim mt-1">${formatDate(n.updatedAt)}</p>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0">
          <button data-delete-note="${n.id}" class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:bg-red-100 hover:text-red-500 transition-all" title="Eliminar"><i class="fas fa-trash-alt text-xs"></i></button>
          <i class="fas fa-chevron-${isExpanded ? 'up' : 'down'} text-slate-300 text-xs"></i>
        </div>
      </div>
      ${isExpanded ? `<div class="px-4 pb-4 space-y-3 border-t border-slate-100 dark-border pt-4">
        <div>
          <label class="block text-[10px] font-bold text-slate-400 dark-text-dim uppercase mb-1 ml-1">Título</label>
          <input type="text" id="edit-title-${n.id}" value="${escapeHtml(n.title)}" class="w-full px-4 py-2 rounded-xl border border-slate-200 dark-input focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-semibold">
        </div>
        <div>
          <label class="block text-[10px] font-bold text-slate-400 dark-text-dim uppercase mb-1 ml-1">Contenido</label>
          <textarea id="edit-content-${n.id}" rows="5" class="w-full px-4 py-2 rounded-xl border border-slate-200 dark-input focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm resize-none">${escapeHtml(n.content)}</textarea>
        </div>
        <div class="flex gap-2 justify-end">
          <button data-cancel-edit="${n.id}" class="px-4 py-2 rounded-xl border border-slate-200 dark-border text-sm font-semibold text-slate-500 dark-text-dim hover:bg-slate-50 dark-hover-surface transition-all">Cancelar</button>
          <button data-save-edit="${n.id}" class="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg transition-all text-sm"><i class="fas fa-save mr-1.5"></i>Guardar</button>
        </div>
      </div>` : ''}
    </div>`;
  }).join('');

  notesList.querySelectorAll('[data-toggle]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-delete-note]') || e.target.closest('button[data-save-edit]') || e.target.closest('button[data-cancel-edit]') || e.target.closest('input') || e.target.closest('textarea')) return;
      toggleNote(el.dataset.toggle);
    });
  });

  notesList.querySelectorAll('[data-delete-note]').forEach((btn) => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); removeNote(btn.dataset.deleteNote); });
  });

  notesList.querySelectorAll('[data-save-edit]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const noteId = btn.dataset.saveEdit;
      const title = document.getElementById(`edit-title-${noteId}`)?.value?.trim() || '';
      const content = document.getElementById(`edit-content-${noteId}`)?.value?.trim() || '';
      if (!title && !content) return;
      updateNote(noteId, title, content);
    });
  });

  notesList.querySelectorAll('[data-cancel-edit]').forEach((btn) => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); state.expandedNoteId = null; render(); });
  });
}

// Event listeners
document.getElementById('addCourseBtn')?.addEventListener('click', () => {
  const container = document.getElementById('courseFormContainer');
  if (!container) return;
  container.classList.toggle('hidden');
  document.getElementById('courseNameInput')?.focus();
});

document.getElementById('cancelCourseBtn')?.addEventListener('click', () => renderCourseForm());

document.getElementById('saveCourseBtn')?.addEventListener('click', () => {
  const input = document.getElementById('courseNameInput');
  const name = input?.value?.trim();
  if (!name) return;
  addCourse(name, state.newCourseColor);
  state.newCourseColor = PRESET_COLORS[0];
});

document.getElementById('newNoteBtn')?.addEventListener('click', () => {
  const form = document.getElementById('newNoteForm');
  const btn = document.getElementById('newNoteBtn');
  if (!form) return;
  form.classList.remove('hidden');
  if (btn) btn.classList.add('hidden');
  document.getElementById('newNoteTitle')?.focus();
});

document.getElementById('cancelNewNoteBtn')?.addEventListener('click', () => {
  const form = document.getElementById('newNoteForm');
  const btn = document.getElementById('newNoteBtn');
  if (form) form.classList.add('hidden');
  if (btn) btn.classList.remove('hidden');
  const titleInput = document.getElementById('newNoteTitle');
  const contentInput = document.getElementById('newNoteContent');
  if (titleInput) titleInput.value = '';
  if (contentInput) contentInput.value = '';
});

document.getElementById('saveNewNoteBtn')?.addEventListener('click', () => {
  const title = document.getElementById('newNoteTitle')?.value?.trim() || '';
  const content = document.getElementById('newNoteContent')?.value?.trim() || '';
  if (!title && !content) return;
  addNote(title, content);
  const form = document.getElementById('newNoteForm');
  const btn = document.getElementById('newNoteBtn');
  if (form) form.classList.add('hidden');
  if (btn) btn.classList.remove('hidden');
  const titleInput = document.getElementById('newNoteTitle');
  const contentInput = document.getElementById('newNoteContent');
  if (titleInput) titleInput.value = '';
  if (contentInput) contentInput.value = '';
});

document.getElementById('searchInput')?.addEventListener('input', () => {
  state.expandedNoteId = null;
  render();
});

init();
