import { useState, useEffect } from 'react';
import { useScheduleStore } from '../../stores/scheduleStore';
import CourseForm from './CourseForm';
import CalendarGrid from './CalendarGrid';
import ShareModal from './ShareModal';

export default function ScheduleBuilder() {
  const courses = useScheduleStore((s) => s.courses);
  const addCourse = useScheduleStore((s) => s.addCourse);
  const removeCourse = useScheduleStore((s) => s.removeCourse);
  const clearAll = useScheduleStore((s) => s.clearAll);

  const [showShare, setShowShare] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load schedule from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('schedule');
    if (encoded) {
      try {
        const raw = JSON.parse(atob(encoded));
        if (Array.isArray(raw)) {
          const store = useScheduleStore.getState();
          raw.forEach((item) => {
            store.addCourse({
              name: item.n || item.name,
              days: item.d || item.days,
              startHour: item.s || item.startHour,
              endHour: item.e || item.endHour,
              color: item.cl || item.color || '#3b82f6',
            });
          });
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch {}
    }
  }, []);

  const handleClear = () => {
    clearAll();
    setShowClearConfirm(false);
  };

  return (
    <div>
      {/* Header stats */}
      {courses.length > 0 && (
        <div class="flex flex-wrap items-center gap-3 mb-5">
          <div class="bg-white dark-surface px-4 py-2 rounded-xl border border-slate-200/80 dark-border shadow-sm text-sm">
            <span class="text-slate-400 dark-text-dim"><i class="fas fa-book mr-1.5" />Cursos: <strong class="text-slate-700 dark-text-primary">{courses.length}</strong></span>
            <span class="mx-2 text-slate-200 dark-border">|</span>
            <span class="text-slate-400 dark-text-dim"><i class="fas fa-clock mr-1.5" />Horas: <strong class="text-slate-700 dark-text-primary">{courses.reduce((s, c) => s + (c.endHour - c.startHour + 1), 0)}</strong></span>
          </div>

          <div class="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setShowShare(true)}
              class="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl text-sm hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg"
            >
              <i class="fas fa-share-alt mr-1.5" />
              Compartir
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              class="px-3 py-2 rounded-xl border border-slate-200 dark-border text-slate-500 dark-text-dim text-sm hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
              title="Eliminar todos"
            >
              <i class="fas fa-trash-alt" />
            </button>
          </div>
        </div>
      )}

      {/* Course Form */}
      <CourseForm onAdd={addCourse} />

      {/* Calendar */}
      <div id="scheduleCalendar" class="bg-white dark-surface rounded-2xl border border-slate-200/80 dark-border shadow-sm p-4 sm:p-6">
        <CalendarGrid courses={courses} onRemoveCourse={removeCourse} />
      </div>

      {/* Share Modal */}
      {showShare && (
        <ShareModal courses={courses} onClose={() => setShowShare(false)} />
      )}

      {/* Clear confirmation */}
      {showClearConfirm && (
        <div
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            class="bg-white dark-surface rounded-2xl shadow-2xl border border-slate-200 dark-border max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="text-center">
              <div class="w-14 h-14 bg-red-100 dark-muted-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-trash-alt text-red-500 text-xl" />
              </div>
              <h2 class="text-lg font-bold text-slate-800 dark-text-primary mb-2">¿Eliminar todos los cursos?</h2>
              <p class="text-sm text-slate-500 dark-text-muted mb-6">Esto eliminará todos los cursos de tu horario. No se puede deshacer.</p>
              <div class="flex gap-3 justify-center">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  class="px-5 py-2.5 rounded-xl border border-slate-200 dark-border text-sm font-semibold text-slate-600 dark-text-secondary hover:bg-slate-50 dark-hover-surface transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClear}
                  class="px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all shadow-lg"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
