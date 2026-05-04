const STORAGE_KEY = 'weighted_grade_tracker_v1';

function getScale() {
  return state.scales[state.activeTab];
}

let state = {
  scales: { courses: 100, semester: 100 },
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
    if (parsed.scale !== undefined && !parsed.scales) {
      state.scales = { courses: parsed.scale, semester: parsed.scale };
    }
  }
  updateScaleUI();
  render();
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setScale(base) {
  const oldScale = getScale();
  if (oldScale === base) return;
  state.scales[state.activeTab] = base;
  const factor = base > oldScale ? 10 : 1 / 10;
  if (state.activeTab === 'courses') {
    for (const course of state.courses) {
      for (const a of course.assignments) {
        if (a.grade !== null && a.grade !== undefined) {
          a.grade = Math.round(a.grade * factor * 100) / 100;
        }
        a.weight = Math.round(a.weight * factor * 100) / 100;
      }
    }
  } else {
    for (const c of state.semesterCourses || []) {
      c.grade = Math.round(c.grade * factor * 100) / 100;
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

  if (getScale() === 10) {
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
  if (weight > getScale()) return alert(`El peso no puede exceder ${getScale()}`);

  const course = state.courses.find((c) => c.id === courseId);
  if (!course) return;
  const currentWeight = course.assignments.reduce((sum, a) => sum + a.weight, 0);

  if (currentWeight + weight > getScale()) {
    return alert(`El peso total no puede exceder ${getScale()}. Capacidad restante: ${(getScale() - currentWeight).toFixed(1)}`);
  }

  let grade = null;
  if (gradeValue !== '') {
    grade = parseFloat(gradeValue);
    if (isNaN(grade) || grade < 0 || grade > getScale()) {
      return alert(`La nota debe estar entre 0 y ${getScale()}`);
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
    if (isNaN(grade) || grade < 0 || grade > getScale()) {
      alert(`La nota debe estar entre 0 y ${getScale()}`);
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

function gradePreview(courseId, assignmentId, value) {
  const course = state.courses.find((c) => c.id === courseId);
  if (!course) return;

  const span = document.getElementById(`gp-${courseId}-${assignmentId}`);
  if (!span) return;

  if (value === '' || value === null || value === undefined) {
    span.textContent = '—';
    span.className = 'text-[10px] font-bold text-slate-400 dark-text-dim';
    return;
  }

  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed < 0 || parsed > getScale()) {
    span.textContent = '—';
    span.className = 'text-[10px] font-bold text-slate-400 dark-text-dim';
    return;
  }

  const stats = calculateCourseWithHypothetical(course, assignmentId, parsed);
  const info = getStatusInfo(stats.average, getScale(), stats.gradedWeight);

  span.textContent = `${stats.average.toFixed(2)} · ${info.label}`;
  span.className = `text-[10px] font-bold ${info.colorClass}`;
}

function gradeBlur(courseId, assignmentId, value) {
  const course = state.courses.find((c) => c.id === courseId);
  if (!course) return;

  const assignment = course.assignments.find((a) => a.id === assignmentId);
  if (!assignment) return;

  const span = document.getElementById(`gp-${courseId}-${assignmentId}`);
  if (!span) return;

  const saved = assignment.grade !== null && assignment.grade !== undefined ? String(assignment.grade) : '';
  if (saved === (value || '').trim()) {
    if (assignment.grade !== null && assignment.grade !== undefined) {
      const pts = (assignment.grade * (assignment.weight / getScale())).toFixed(2);
      span.textContent = `+${pts}`;
      span.className = 'text-[10px] font-bold text-slate-800 dark-text-secondary';
    } else {
      span.textContent = '—';
      span.className = 'text-[10px] font-bold text-slate-400 dark-text-dim';
    }
  }
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
  const scale = getScale();
  let weightedSum = 0;
  let totalCredits = 0;
  courses.forEach((c) => {
    const base10 = scale === 100 ? c.grade / 10 : c.grade;
    const effective = base10 < 5.0 ? 5.0 : base10;
    const gradeForCalc = scale === 100 ? effective * 10 : effective;
    weightedSum += gradeForCalc * c.credits;
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
      weightedSum += a.grade * (a.weight / getScale());
      gradedWeight += a.weight;
    }
  });

  return {
    average: weightedSum,
    completedWeight: totalWeight,
    gradedWeight,
    remainingWeight: getScale() - totalWeight,
  };
}

function calculateCourseWithHypothetical(course, hypotheticalId, hypotheticalGrade) {
  let weightedSum = 0;
  let gradedWeight = 0;
  let totalWeight = 0;

  course.assignments.forEach((a) => {
    totalWeight += a.weight;
    let effectiveGrade = a.grade;
    if (a.id === hypotheticalId && hypotheticalGrade !== null && hypotheticalGrade !== undefined && hypotheticalGrade !== '') {
      const parsed = parseFloat(hypotheticalGrade);
      if (!isNaN(parsed)) {
        effectiveGrade = parsed;
      }
    }
    if (effectiveGrade !== null && effectiveGrade !== undefined) {
      weightedSum += effectiveGrade * (a.weight / getScale());
      gradedWeight += a.weight;
    }
  });

  return {
    average: weightedSum,
    completedWeight: totalWeight,
    gradedWeight,
    remainingWeight: getScale() - totalWeight,
  };
}

function roundGradeUCR(grade) {
  const base = Math.floor(grade);
  const decimal = grade - base;
  if (decimal < 0.25) return base;
  if (decimal < 0.75) return base + 0.5;
  return base + 1;
}

function getStatusInfo(avg, scale, gradedWeight) {
  if (gradedWeight === 0) {
    return { label: 'Sin notas', colorClass: 'text-slate-400 dark-text-dim', bgClass: 'bg-slate-50 border-slate-200 dark-muted-bg dark-border', textClass: 'text-slate-500 dark-text-dim' };
  }
  const base10 = scale === 100 ? avg / 10 : avg;
  const rounded = roundGradeUCR(base10);
  if (rounded >= 7.0) {
    return { label: 'Aprobado', colorClass: 'text-emerald-600 dark-text-emerald', bgClass: 'bg-emerald-50 border-emerald-100 dark-route-emerald-bg', textClass: 'text-emerald-700 dark-text-primary' };
  }
  if (rounded >= 6.0) {
    return { label: 'Ampliación', colorClass: 'text-amber-600 dark-amber-banner-title', bgClass: 'bg-amber-50 border-amber-200 dark-route-amber-bg', textClass: 'text-amber-700 dark-amber-banner-text' };
  }
  return { label: 'Reprobado', colorClass: 'text-rose-600 dark-text-rose', bgClass: 'bg-rose-50 border-rose-100 dark-route-rose-bg', textClass: 'text-rose-700 dark-text-primary' };
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatGrade(g) {
  return Number(g).toFixed(2);
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
          <p class="text-lg font-black text-slate-800 dark-text-primary">${formatGrade(c.grade)}</p>
          <p class="text-[10px] text-slate-400 dark-text-dim uppercase">/${getScale()}</p>
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
          <p class="text-3xl font-black text-slate-800 dark-text-primary">${getScale()}</p>
        </div>
      </div>
    </div>
    <div class="space-y-3">${items}</div>
    <div class="text-center mt-6 max-w-md mx-auto space-y-2">
      <p class="text-xs text-slate-400 dark-text-dim leading-relaxed">
        <i class="fas fa-info-circle mr-1"></i>
        Este promedio puede variar del cálculo oficial de la universidad. Es solo una referencia.
      </p>
      <p class="text-xs text-slate-400 dark-text-dim leading-relaxed">
        <i class="fas fa-graduation-cap mr-1"></i>
        Según el reglamento de la UCR, calificaciones inferiores a 5.0 se consideran como 5.0 para el cálculo del promedio ponderado.
      </p>
    </div>
  `;

  updateDashboard(stats.average, stats.courseCount, stats.totalCredits);
}

function render() {
  const coursesSection = document.getElementById('coursesSection');
  const semesterSection = document.getElementById('semesterSection');
  if (!coursesSection || !semesterSection) return;

  updateTabUI();
  updateScaleUI();

  if (state.activeTab === 'semester') {
    coursesSection.classList.add('hidden');
    semesterSection.classList.remove('hidden');

    const gradeInput = document.getElementById('semCourseGrade');
    if (gradeInput) gradeInput.max = getScale();

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

      const statusInfo = getStatusInfo(stats.average, getScale(), stats.gradedWeight);

      const assignmentsHTML =
        course.assignments.length === 0
              ? `<div class="text-center py-8 bg-slate-50 dark-muted-bg-alpha rounded-2xl border border-dashed border-slate-200 dark-border">
              <p class="text-slate-400 dark-text-dim text-sm italic">Sin tareas agregadas aún</p>
            </div>`
          : course.assignments
              .map((a) => {
                const hasGrade = a.grade !== null && a.grade !== undefined;
                const points = hasGrade ? (a.grade * (a.weight / getScale())).toFixed(2) : null;
                return `<div class="flex items-center justify-between p-3 bg-slate-50 dark-muted-bg-alpha hover:bg-slate-100 dark-hover-surface rounded-xl border border-slate-200 dark-border transition-all group">
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-slate-700 dark-text-secondary truncate">${escapeHtml(a.name)}</p>
                    <p class="text-[10px] font-bold text-slate-400 dark-text-dim uppercase">Peso: ${a.weight}%</p>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0 ml-3">
                    <div class="flex flex-col items-end gap-0.5">
                      <input type="number" value="${hasGrade ? a.grade : ''}" placeholder="Nota" min="0" max="${getScale()}" step="0.01" oninput="window.gradePreview('${course.id}', '${a.id}', this.value)" onchange="window.updateGrade('${course.id}', '${a.id}', this.value)" onblur="window.gradeBlur('${course.id}', '${a.id}', this.value)" class="w-16 px-2 py-1 text-sm rounded-lg border border-slate-300 dark-input outline-none focus:ring-1 focus:ring-indigo-400">
                      <span id="gp-${course.id}-${a.id}" class="text-[10px] font-bold ${hasGrade ? 'text-slate-800 dark-text-secondary' : 'text-slate-400 dark-text-dim'}">${hasGrade ? `+${points}` : '—'}</span>
                    </div>
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
                <span class="text-lg font-bold ${statusInfo.colorClass}">${stats.gradedWeight > 0 ? stats.average.toFixed(2) : 'N/A'}</span>
                ${stats.gradedWeight > 0 ? `<span class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.bgClass} ${statusInfo.textClass}">${statusInfo.label}</span>` : ''}
              </div>
              ${stats.gradedWeight > 0 ? `<p class="text-[10px] text-slate-400 dark-text-dim mt-0.5 ml-1">Nota oficial: ${roundGradeUCR(getScale() === 100 ? stats.average / 10 : stats.average).toFixed(1)} / 10</p>` : ''}
            </div>
            <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-slate-400 dark-text-dim uppercase">Peso:</span>
                <span class="text-sm font-bold text-slate-600 dark-text-secondary">${stats.completedWeight} / ${getScale()}</span>
              </div>
          </div>
          <button onclick="window.removeCourse('${course.id}')" class="p-2 text-slate-300 hover:text-rose-600 transition-all flex-shrink-0">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>

          <div class="w-full h-1.5 bg-slate-100 dark-progress-bg overflow-hidden">
            <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style="width: ${(stats.completedWeight / getScale()) * 100}%"></div>
          </div>

        <div class="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2">
            <h3 class="text-xs font-bold text-slate-400 dark-text-dim uppercase mb-4 tracking-widest flex items-center">
              <i class="fas fa-list-ul mr-2"></i>Tareas
            </h3>
            <div class="space-y-2">${assignmentsHTML}</div>
          </div>

          <div class="space-y-6">
            <div class="bg-slate-50 dark-muted-bg border border-slate-200 dark-border p-4 rounded-2xl">
              <h4 class="text-xs font-bold text-slate-500 dark-text-muted uppercase mb-2">Peso restante</h4>
              <div class="flex justify-between items-end">
                <span class="text-2xl font-black text-slate-700 dark-text-primary">${stats.remainingWeight}</span>
                <span class="text-[10px] font-bold uppercase ${stats.remainingWeight === 0 ? 'text-slate-400 dark-text-dim' : 'text-amber-500 dark-amber-banner-text animate-pulse'}">
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
                    <input type="number" id="asn-grade-${course.id}" placeholder="--" step="0.01" max="${getScale()}" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark-input outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  </div>
                  <div>
                    <label class="text-[9px] font-black text-slate-400 dark-text-dim uppercase ml-1">Peso *</label>
                    <input type="number" id="asn-weight-${course.id}" placeholder="0-${getScale()}" max="${stats.remainingWeight}" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark-input outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  </div>
                </div>
                <button onclick="window.addAssignment('${course.id}')" class="w-full py-2.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-black transition-all">
                  AGREGAR ASIGNACIÓN
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

  if (state.activeTab === 'semester') {
    if (gw) gw.textContent = `${Math.round(weight)}`;
    if (l1) l1.textContent = 'Promedio de Cursos';
    if (l2) l2.textContent = 'Cursos';
    if (l3) l3.textContent = 'Créditos';
  } else {
    if (gw) gw.textContent = `${Math.round(weight)} / ${getScale()}`;
    if (l1) l1.textContent = 'Promedio Global';
    if (l2) l2.textContent = 'Cursos Activos';
    if (l3) l3.textContent = 'Peso Promedio';
  }
}

window.setScale = setScale;
window.addAssignment = addAssignment;
window.updateGrade = updateGrade;
window.removeAssignment = removeAssignment;
window.gradePreview = gradePreview;
window.gradeBlur = gradeBlur;
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
  if (isNaN(grade) || grade < 0 || grade > getScale()) return alert(`La nota debe estar entre 0 y ${getScale()}`);
  if (isNaN(credits) || credits <= 0) return alert('Ingrese los créditos del curso');
  addSemesterCourse(name, grade, credits);
  nameInput.value = '';
  gradeInput.value = '';
  creditsInput.value = '';
});

init();
