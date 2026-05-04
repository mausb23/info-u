const STORAGE_KEY = 'weighted_grade_tracker_v1';

let state = {
  scale: 100,
  courses: [],
  selectedCourseId: null,
  activeTab: 'courses',
  semesterCourses: [],
};

function init() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    state = { ...state, ...parsed, semesterCourses: parsed.semesterCourses || [] };
  }
  updateScaleUI();
  render();
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setScale(base) {
  const oldScale = state.scale;
  if (oldScale === base) return;
  state.scale = base;
  const factor = base > oldScale ? 10 : 1 / 10;
  for (const course of state.courses) {
    for (const a of course.assignments) {
      if (a.grade !== null && a.grade !== undefined) {
        a.grade = Math.round(a.grade * factor * 100) / 100;
      }
      a.weight = Math.round(a.weight * factor * 100) / 100;
    }
  }
  for (const c of state.semesterCourses || []) {
    c.grade = Math.round(c.grade * factor * 100) / 100;
  }
  updateScaleUI();
  save();
  render();
}

function updateScaleUI() {
  const b10 = document.getElementById('base10Btn');
  const b100 = document.getElementById('base100Btn');
  if (!b10 || !b100) return;

  if (state.scale === 10) {
    b10.className = 'px-4 py-1.5 rounded-lg text-sm font-semibold bg-white dark-surface text-indigo-600 shadow-sm';
    b100.className = 'px-4 py-1.5 rounded-lg text-sm font-semibold text-slate-500 dark-text-muted hover:text-slate-700';
  } else {
    b100.className = 'px-4 py-1.5 rounded-lg text-sm font-semibold bg-white dark-surface text-indigo-600 shadow-sm';
    b10.className = 'px-4 py-1.5 rounded-lg text-sm font-semibold text-slate-500 dark-text-muted hover:text-slate-700';
  }
}

function addCourse(name) {
  state.courses.push({
    id: crypto.randomUUID(),
    name,
    assignments: [],
  });
  save();
  render();
}

function removeCourse(id) {
  if (confirm('¿Estás seguro de eliminar este curso y todas sus notas?')) {
    state.courses = state.courses.filter((c) => c.id !== id);
    save();
    render();
  }
}

function addAssignment(courseId) {
  const nameInput = document.getElementById(`asn-name-${courseId}`);
  const gradeInput = document.getElementById(`asn-grade-${courseId}`);
  const weightInput = document.getElementById(`asn-weight-${courseId}`);

  const name = nameInput.value.trim() || 'Tarea';
  const gradeValue = gradeInput.value.trim();
  const weight = parseFloat(weightInput.value);

  if (isNaN(weight) || weight <= 0) return alert('Ingrese un peso válido');
  if (weight > state.scale) return alert(`El peso no puede exceder ${state.scale}`);

  const course = state.courses.find((c) => c.id === courseId);
  if (!course) return;
  const currentWeight = course.assignments.reduce((sum, a) => sum + a.weight, 0);

  if (currentWeight + weight > state.scale) {
    return alert(`El peso total no puede exceder ${state.scale}. Capacidad restante: ${(state.scale - currentWeight).toFixed(1)}`);
  }

  let grade = null;
  if (gradeValue !== '') {
    grade = parseFloat(gradeValue);
    if (isNaN(grade) || grade < 0 || grade > state.scale) {
      return alert(`La nota debe estar entre 0 y ${state.scale}`);
    }
  }

  course.assignments.push({
    id: crypto.randomUUID(),
    name,
    grade,
    weight,
  });

  nameInput.value = '';
  gradeInput.value = '';
  weightInput.value = '';

  save();
  render();
}

function updateGrade(courseId, assignmentId, newGrade) {
  const course = state.courses.find((c) => c.id === courseId);
  if (!course) return;
  const assignment = course.assignments.find((a) => a.id === assignmentId);
  if (!assignment) return;

  if (newGrade === '') {
    assignment.grade = null;
  } else {
    const grade = parseFloat(newGrade);
    if (isNaN(grade) || grade < 0 || grade > state.scale) {
      alert(`La nota debe estar entre 0 y ${state.scale}`);
      render();
      return;
    }
    assignment.grade = grade;
  }

  save();
  render();
}

function removeAssignment(courseId, assignmentId) {
  const course = state.courses.find((c) => c.id === courseId);
  if (!course) return;
  course.assignments = course.assignments.filter((a) => a.id !== assignmentId);
  save();
  render();
}

function setTab(tab) {
  state.activeTab = tab;
  updateTabUI();
  save();
  render();
}

function updateTabUI() {
  const tabCourses = document.getElementById('tabCourses');
  const tabSemester = document.getElementById('tabSemester');
  if (!tabCourses || !tabSemester) return;

  const active = 'px-5 py-2 rounded-lg text-sm font-bold bg-white dark-surface text-indigo-600 shadow-sm';
  const inactive = 'px-5 py-2 rounded-lg text-sm font-bold text-slate-500 dark-text-muted hover:text-slate-700';
  tabCourses.className = state.activeTab === 'courses' ? active : inactive;
  tabSemester.className = state.activeTab === 'semester' ? active : inactive;
}

function addSemesterCourse(name, grade, credits) {
  state.semesterCourses.push({
    id: crypto.randomUUID(),
    name,
    grade,
    credits,
  });
  save();
  render();
}

function removeSemesterCourse(id) {
  if (confirm('¿Eliminar este curso del promedio?')) {
    state.semesterCourses = state.semesterCourses.filter((c) => c.id !== id);
    save();
    render();
  }
}

function calculateSemesterAverage(courses) {
  if (courses.length === 0) return { average: 0, totalCredits: 0, courseCount: 0 };
  let weightedSum = 0;
  let totalCredits = 0;
  courses.forEach((c) => {
    weightedSum += c.grade * c.credits;
    totalCredits += c.credits;
  });
  return {
    average: totalCredits > 0 ? weightedSum / totalCredits : 0,
    totalCredits,
    courseCount: courses.length,
  };
}

function calculateCourse(course) {
  let weightedSum = 0;
  let gradedWeight = 0;
  let totalWeight = 0;

  course.assignments.forEach((a) => {
    totalWeight += a.weight;
    if (a.grade !== null && a.grade !== undefined) {
      weightedSum += a.grade * (a.weight / state.scale);
      gradedWeight += a.weight;
    }
  });

  return {
    average: weightedSum,
    completedWeight: totalWeight,
    gradedWeight,
    remainingWeight: state.scale - totalWeight,
  };
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateCourseSelector() {
  const selector = document.getElementById('courseSelector');
  const select = document.getElementById('courseSelect');
  if (!selector || !select) return;

  const show = state.courses.length >= 2;
  selector.classList.toggle('hidden', !show);

  if (!show) {
    state.selectedCourseId = null;
    return;
  }

  const prev = select.value;
  select.innerHTML = state.courses.map((c) =>
    `<option value="${c.id}" ${c.id === state.selectedCourseId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
  ).join('');

  if (!state.selectedCourseId || !state.courses.some((c) => c.id === state.selectedCourseId)) {
    state.selectedCourseId = state.courses[0].id;
    select.value = state.selectedCourseId;
  }
}

function renderSemester() {
  const container = document.getElementById('semesterList');
  const empty = document.getElementById('semesterEmpty');
  if (!container || !empty) return;

  if (state.semesterCourses.length === 0) {
    container.innerHTML = '';
    empty.classList.remove('hidden');
    updateDashboard(0, 0, 0);
    return;
  }

  empty.classList.add('hidden');
  const stats = calculateSemesterAverage(state.semesterCourses);

  const items = state.semesterCourses.map((c) => `
    <div class="bg-white dark-surface rounded-xl border border-slate-200/80 dark-border p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
      <div class="min-w-0 flex-1">
        <p class="font-bold text-slate-800 dark-text-primary">${escapeHtml(c.name)}</p>
        <p class="text-xs text-slate-400 dark-text-dim mt-0.5">${c.credits} crédito${c.credits !== 1 ? 's' : ''}</p>
      </div>
      <div class="flex items-center gap-4 flex-shrink-0 ml-4">
        <div class="text-right">
          <p class="text-lg font-black text-slate-800 dark-text-primary">${c.grade}</p>
          <p class="text-[10px] text-slate-400 dark-text-dim uppercase">/${state.scale}</p>
        </div>
        <button onclick="window.removeSemesterCourse('${c.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-rose-100 hover:text-rose-600 transition-all">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="bg-white dark-surface rounded-2xl border border-slate-200/80 dark-border shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-slate-800 dark-text-primary">Resumen General</h2>
        <span class="text-xs font-bold text-slate-400 dark-text-dim uppercase">${stats.courseCount} curso${stats.courseCount !== 1 ? 's' : ''}</span>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-slate-50 dark-muted-bg-alpha rounded-xl p-4 text-center">
          <p class="text-xs font-bold text-slate-400 dark-text-dim uppercase mb-1">Promedio</p>
          <p class="text-3xl font-black text-slate-800 dark-text-primary">${stats.average.toFixed(2)}</p>
        </div>
        <div class="bg-slate-50 dark-muted-bg-alpha rounded-xl p-4 text-center">
          <p class="text-xs font-bold text-slate-400 dark-text-dim uppercase mb-1">Créditos</p>
          <p class="text-3xl font-black text-slate-800 dark-text-primary">${stats.totalCredits}</p>
        </div>
        <div class="bg-slate-50 dark-muted-bg-alpha rounded-xl p-4 text-center">
          <p class="text-xs font-bold text-slate-400 dark-text-dim uppercase mb-1">Escala</p>
          <p class="text-3xl font-black text-slate-800 dark-text-primary">${state.scale}</p>
        </div>
      </div>
    </div>
    <div class="space-y-3">${items}</div>
  `;

  updateDashboard(stats.average, stats.courseCount, stats.totalCredits);
}

function render() {
  const coursesSection = document.getElementById('coursesSection');
  const semesterSection = document.getElementById('semesterSection');
  if (!coursesSection || !semesterSection) return;

  updateTabUI();

  if (state.activeTab === 'semester') {
    coursesSection.classList.add('hidden');
    semesterSection.classList.remove('hidden');

    const gradeInput = document.getElementById('semCourseGrade');
    if (gradeInput) gradeInput.max = state.scale;

    renderSemester();
    return;
  }

  coursesSection.classList.remove('hidden');
  semesterSection.classList.add('hidden');

  const container = document.getElementById('coursesList');
  const emptyState = document.getElementById('emptyState');
  if (!container || !emptyState) return;

  if (state.courses.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    updateDashboard(0, 0, 0);
    updateCourseSelector();
    return;
  }

  emptyState.classList.add('hidden');
  updateCourseSelector();

  const displayed = state.selectedCourseId
    ? state.courses.filter((c) => c.id === state.selectedCourseId)
    : state.courses;

  let globalWeightedSum = 0;
  let globalCourseCount = 0;
  let globalWeightSum = 0;

  container.innerHTML = displayed
    .map((course) => {
      const stats = calculateCourse(course);
      globalWeightedSum += stats.average;
      globalCourseCount++;
      globalWeightSum += stats.completedWeight;

      const threshold = state.scale === 10 ? 7 : 70;
      const isPassing = stats.average >= threshold || stats.gradedWeight === 0;
      const statusColor = isPassing ? 'text-emerald-600' : 'text-rose-600';
      const statusBg = isPassing ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100';
      const statusText = isPassing ? 'text-emerald-700' : 'text-rose-700';

      const assignmentsHTML =
        course.assignments.length === 0
              ? `<div class="text-center py-8 bg-slate-50 dark-muted-bg-alpha rounded-2xl border border-dashed border-slate-200 dark-border">
              <p class="text-slate-400 dark-text-dim text-sm italic">Sin tareas agregadas aún</p>
            </div>`
          : course.assignments
              .map((a) => {
                const hasGrade = a.grade !== null && a.grade !== undefined;
                const points = hasGrade ? (a.grade * (a.weight / state.scale)).toFixed(2) : '-';
                return `<div class="flex items-center justify-between p-3 ${hasGrade ? 'bg-slate-50 dark-muted-bg-alpha' : 'bg-amber-50'} hover:bg-slate-100 dark-hover-surface rounded-xl border ${hasGrade ? 'border-slate-200 dark-border' : 'border-amber-200'} transition-all group">
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-slate-700 dark-text-secondary truncate">${escapeHtml(a.name)}</p>
                    <p class="text-[10px] font-bold ${hasGrade ? 'text-slate-400 dark-text-dim' : 'text-amber-500'} uppercase">${hasGrade ? `Nota: ${a.grade} • ` : 'Nota pendiente • '}Peso: ${a.weight}%</p>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0 ml-3">
                    ${!hasGrade
                      ? `<input type="number" placeholder="Nota" min="0" max="${state.scale}" step="0.01" onchange="window.updateGrade('${course.id}', '${a.id}', this.value)" class="w-16 px-2 py-1 text-sm rounded-lg border border-amber-300 dark-input focus:ring-1 focus:ring-amber-400 outline-none">`
                      : `<div class="text-right">
                          <p class="text-sm font-bold text-slate-800 dark-text-secondary">+${points}</p>
                          <p class="text-[10px] text-slate-400 dark-text-dim uppercase">Puntos</p>
                        </div>`}
                    <button onclick="window.removeAssignment('${course.id}', '${a.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-rose-100 hover:text-rose-600 transition-all">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>`;
              })
              .join('');

      return `<div class="bg-white dark-surface rounded-2xl border border-slate-200/80 dark-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div class="p-6 border-b border-slate-100 dark-border flex justify-between items-start gap-4">
          <div class="min-w-0">
            <h2 class="text-xl font-bold text-slate-800 dark-text-primary truncate">${escapeHtml(course.name)}</h2>
            <div class="flex items-center gap-4 mt-2 flex-wrap">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-slate-400 dark-text-dim uppercase">Promedio:</span>
                <span class="text-lg font-bold ${statusColor}">${stats.gradedWeight > 0 ? stats.average.toFixed(2) : 'N/A'}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-slate-400 dark-text-dim uppercase">Peso:</span>
                <span class="text-sm font-bold text-slate-600 dark-text-secondary">${stats.completedWeight} / ${state.scale}</span>
              </div>
            </div>
          </div>
          <button onclick="window.removeCourse('${course.id}')" class="p-2 text-slate-300 hover:text-rose-600 transition-all flex-shrink-0">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>

          <div class="w-full h-1.5 bg-slate-100 dark-progress-bg overflow-hidden">
            <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style="width: ${(stats.completedWeight / state.scale) * 100}%"></div>
          </div>

        <div class="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2">
            <h3 class="text-xs font-bold text-slate-400 dark-text-dim uppercase mb-4 tracking-widest flex items-center">
              <i class="fas fa-list-ul mr-2"></i>Tareas
            </h3>
            <div class="space-y-2">${assignmentsHTML}</div>
          </div>

          <div class="space-y-6">
            <div class="${statusBg} border p-4 rounded-2xl">
              <h4 class="text-xs font-bold text-slate-500 dark-text-muted uppercase mb-2">Peso restante</h4>
              <div class="flex justify-between items-end">
                <span class="text-2xl font-black text-slate-700 dark-text-primary">${stats.remainingWeight}</span>
                <span class="text-[10px] font-bold uppercase ${stats.remainingWeight === 0 ? 'text-slate-400 dark-text-dim' : `${statusText} animate-pulse`}">
                  ${stats.remainingWeight === 0 ? 'Completo' : 'Pendiente'}
                </span>
              </div>
            </div>

            <div class="bg-white dark-surface border border-slate-200 dark-border p-5 rounded-2xl">
              <h4 class="text-xs font-bold text-slate-400 dark-text-dim uppercase mb-4 tracking-widest">Agregar Rápido</h4>
              <div class="space-y-3">
                <input type="text" id="asn-name-${course.id}" placeholder="Nombre de Tarea" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark-input outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="text-[9px] font-black text-slate-400 dark-text-dim uppercase ml-1">Nota (opcional)</label>
                    <input type="number" id="asn-grade-${course.id}" placeholder="--" step="0.01" max="${state.scale}" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark-input outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  </div>
                  <div>
                    <label class="text-[9px] font-black text-slate-400 dark-text-dim uppercase ml-1">Peso *</label>
                    <input type="number" id="asn-weight-${course.id}" placeholder="0-${state.scale}" max="${stats.remainingWeight}" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark-input outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  </div>
                </div>
                <button onclick="window.addAssignment('${course.id}')" class="w-full py-2.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-black transition-all">
                  AGREGAR TAREA
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    })
    .join('');

  const coursesWithGrades = state.courses.filter((c) => {
    const stats = calculateCourse(c);
    return stats.gradedWeight > 0;
  }).length;

  const globalAvg = coursesWithGrades > 0 ? globalWeightedSum / coursesWithGrades : 0;
  updateDashboard(globalAvg, globalCourseCount, globalWeightSum / globalCourseCount || 0);
}

function updateDashboard(avg, count, weight) {
  const ga = document.getElementById('globalAverage');
  const ac = document.getElementById('activeCourses');
  const gw = document.getElementById('globalWeight');
  const l1 = document.getElementById('dashboardLabel1');
  const l2 = document.getElementById('dashboardLabel2');
  const l3 = document.getElementById('dashboardLabel3');
  if (ga) ga.textContent = avg > 0 ? avg.toFixed(2) : 'N/A';
  if (ac) ac.textContent = count.toString();
  if (gw) gw.textContent = `${Math.round(weight)} / ${state.scale}`;

  if (state.activeTab === 'semester') {
    if (l1) l1.textContent = 'Promedio de Cursos';
    if (l2) l2.textContent = 'Cursos';
    if (l3) l3.textContent = 'Créditos';
  } else {
    if (l1) l1.textContent = 'Promedio Global';
    if (l2) l2.textContent = 'Cursos Activos';
    if (l3) l3.textContent = 'Peso Promedio';
  }
}

window.setScale = setScale;
window.addAssignment = addAssignment;
window.updateGrade = updateGrade;
window.removeAssignment = removeAssignment;
window.removeCourse = removeCourse;
window.addSemesterCourse = addSemesterCourse;
window.removeSemesterCourse = removeSemesterCourse;

document.getElementById('courseForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('newCourseName');
  const name = input.value.trim();
  if (name) {
    addCourse(name);
    input.value = '';
  }
});

document.getElementById('base10Btn')?.addEventListener('click', () => setScale(10));
document.getElementById('base100Btn')?.addEventListener('click', () => setScale(100));

document.getElementById('courseSelect')?.addEventListener('change', (e) => {
  state.selectedCourseId = e.target.value;
  save();
  render();
});

document.getElementById('tabCourses')?.addEventListener('click', () => setTab('courses'));
document.getElementById('tabSemester')?.addEventListener('click', () => setTab('semester'));

document.getElementById('semesterForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const nameInput = document.getElementById('semCourseName');
  const gradeInput = document.getElementById('semCourseGrade');
  const creditsInput = document.getElementById('semCourseCredits');
  const name = nameInput.value.trim();
  const grade = parseFloat(gradeInput.value);
  const credits = parseFloat(creditsInput.value);
  if (!name) return alert('Ingrese el nombre del curso');
  if (isNaN(grade) || grade < 0 || grade > state.scale) return alert(`La nota debe estar entre 0 y ${state.scale}`);
  if (isNaN(credits) || credits <= 0) return alert('Ingrese los créditos del curso');
  addSemesterCourse(name, grade, credits);
  nameInput.value = '';
  gradeInput.value = '';
  creditsInput.value = '';
});

init();
