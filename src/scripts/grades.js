const STORAGE_KEY = 'weighted_grade_tracker_v1';

let state = {
  scale: 100,
  courses: [],
};

function init() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    state = JSON.parse(saved);
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
    }
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

  if (isNaN(weight) || weight <= 0) return alert('Ingrese un porcentaje de peso válido');
  if (weight > 100) return alert('El peso no puede exceder 100%');

  const course = state.courses.find((c) => c.id === courseId);
  if (!course) return;
  const currentWeight = course.assignments.reduce((sum, a) => sum + a.weight, 0);

  if (currentWeight + weight > 100) {
    return alert(`El peso total no puede exceder 100%. Capacidad restante: ${100 - currentWeight}%`);
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

function calculateCourse(course) {
  let weightedSum = 0;
  let gradedWeight = 0;
  let totalWeight = 0;

  course.assignments.forEach((a) => {
    totalWeight += a.weight;
    if (a.grade !== null && a.grade !== undefined) {
      weightedSum += a.grade * (a.weight / 100);
      gradedWeight += a.weight;
    }
  });

  return {
    average: weightedSum,
    completedWeight: totalWeight,
    gradedWeight,
    remainingWeight: 100 - totalWeight,
  };
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function render() {
  const container = document.getElementById('coursesList');
  const emptyState = document.getElementById('emptyState');
  if (!container || !emptyState) return;

  if (state.courses.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    updateDashboard(0, 0, 0);
    return;
  }

  emptyState.classList.add('hidden');
  let globalWeightedSum = 0;
  let globalCourseCount = 0;
  let globalWeightSum = 0;

  container.innerHTML = state.courses
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
                const points = hasGrade ? (a.grade * (a.weight / 100)).toFixed(2) : '-';
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
                <span class="text-sm font-bold text-slate-600 dark-text-secondary">${stats.completedWeight}% / 100%</span>
              </div>
            </div>
          </div>
          <button onclick="window.removeCourse('${course.id}')" class="p-2 text-slate-300 hover:text-rose-600 transition-all flex-shrink-0">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>

        <div class="w-full h-1.5 bg-slate-100 dark-progress-bg overflow-hidden">
          <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style="width: ${stats.completedWeight}%"></div>
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
                <span class="text-2xl font-black text-slate-700 dark-text-primary">${stats.remainingWeight}%</span>
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
                    <label class="text-[9px] font-black text-slate-400 dark-text-dim uppercase ml-1">Peso (%) *</label>
                    <input type="number" id="asn-weight-${course.id}" placeholder="%" max="${stats.remainingWeight}" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark-input outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
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
  if (ga) ga.textContent = avg > 0 ? avg.toFixed(2) : 'N/A';
  if (ac) ac.textContent = count.toString();
  if (gw) gw.textContent = `${Math.round(weight)}%`;
}

window.setScale = setScale;
window.addAssignment = addAssignment;
window.updateGrade = updateGrade;
window.removeAssignment = removeAssignment;
window.removeCourse = removeCourse;

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

init();
