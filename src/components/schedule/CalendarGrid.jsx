import { useMemo } from 'react';
import { DAYS, HOURS, getConflicts } from '../../utils/conflicts';

const ROW_HEIGHT = 52;

function pad2(n) {
  return String(n).padStart(2, '0');
}

export default function CalendarGrid({ courses, onRemoveCourse }) {
  const conflictSet = useMemo(() => {
    const set = new Set();
    for (let i = 0; i < courses.length; i++) {
      for (let j = i + 1; j < courses.length; j++) {
        const a = courses[i];
        const b = courses[j];
        for (const dayA of a.days) {
          for (const dayB of b.days) {
            if (dayA === dayB && a.startHour < b.endHour && b.startHour < a.endHour) {
              set.add(`${a.id}-${dayA}`);
              set.add(`${b.id}-${dayB}`);
            }
          }
        }
      }
    }
    return set;
  }, [courses]);

  const allConflicts = useMemo(() => getConflicts(courses), [courses]);

  const totalRows = HOURS.length;

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `64px repeat(${DAYS.length}, 1fr)`,
    gridTemplateRows: `auto repeat(${totalRows}, ${ROW_HEIGHT}px)`,
  };

  return (
    <div>
      {/* Conflict banner */}
      {allConflicts.length > 0 && (
        <div class="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2.5">
          <i class="fas fa-exclamation-triangle text-red-400 mt-0.5" />
          <div class="text-xs text-red-700">
            <span class="font-semibold">Conflictos de horario:</span>
            <ul class="list-disc list-inside mt-1 space-y-0.5">
              {allConflicts.slice(0, 5).map((c, i) => (
                <li key={i}>{c.label}</li>
              ))}
              {allConflicts.length > 5 && <li>...y {allConflicts.length - 5} más</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Empty state */}
      {courses.length === 0 && (
        <div class="flex items-center justify-center min-h-[300px] rounded-2xl border-2 border-dashed border-slate-200 dark-border">
          <div class="text-center">
            <i class="fas fa-calendar-plus text-4xl text-slate-300 dark-empty-icon mb-3" />
            <h3 class="text-lg font-semibold text-slate-400 dark-text-dim">Sin cursos agregados</h3>
            <p class="text-sm text-slate-400 dark-text-dim mt-1">Usa el formulario para agregar cursos</p>
          </div>
        </div>
      )}

      {courses.length > 0 && (
        <div class="overflow-x-auto pb-2">
          <div class="min-w-[700px]" style={gridStyle}>
            {/* Header row */}
            <div class="sticky top-0 z-10 bg-white dark-surface border-b-2 border-slate-200 dark-border" style={{ gridRow: 1, gridColumn: `1 / ${DAYS.length + 2}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: `64px repeat(${DAYS.length}, 1fr)` }}>
                <div class="h-10" />
                {DAYS.map((day) => (
                  <div key={day} class="h-10 flex items-center justify-center">
                    <span class="text-xs font-bold text-slate-500 dark-text-dim uppercase tracking-wider">{day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Time labels */}
            {HOURS.map((hour, i) => (
              <div
                key={`label-${hour}`}
                class="border-t border-slate-100 dark-border pr-2 flex items-start justify-end pt-1"
                style={{ gridRow: i + 2, gridColumn: 1 }}
              >
                <span class="text-[11px] font-medium text-slate-400 dark-text-dim leading-none">{pad2(hour)}:00</span>
              </div>
            ))}

            {/* Hour cells grid lines - render as background */}
            {HOURS.map((hour, i) =>
              DAYS.map((day, j) => (
                <div
                  key={`cell-${hour}-${day}`}
                  class="border-t border-l border-slate-50 dark-border"
                  style={{ gridRow: i + 2, gridColumn: j + 2 }}
                />
              ))
            )}

            {/* Course blocks */}
            {courses.map((course) =>
              course.days.map((day) => {
                const dayIdx = DAYS.indexOf(day);
                if (dayIdx === -1) return null;
                const startRow = course.startHour - 7 + 2;
                const endRow = course.endHour - 7 + 2;
                const isConflict = conflictSet.has(`${course.id}-${day}`);

                return (
                  <div
                    key={`${course.id}-${day}`}
                    class={`group relative overflow-hidden rounded-lg px-2.5 py-1.5 border-l-4 transition-shadow hover:shadow-md ${isConflict ? 'ring-2 ring-red-400' : ''}`}
                    style={{
                      gridRow: `${startRow} / ${endRow}`,
                      gridColumn: dayIdx + 2,
                      backgroundColor: course.color + '18',
                      borderLeftColor: course.color,
                    }}
                  >
                    <div class="flex items-start justify-between gap-1 h-full">
                      <div class="min-w-0 flex-1">
                        <p class="text-[12px] font-bold leading-tight truncate text-slate-800 dark-text-primary">
                          {course.name}
                        </p>
                        <p class="text-[10px] text-slate-500 dark-text-muted leading-tight mt-0.5">
                          {pad2(course.startHour)}:00 - {pad2(course.endHour)}:50
                        </p>
                      </div>
                      <button
                        onClick={() => onRemoveCourse(course.id)}
                        class="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded-full bg-white/80 hover:bg-red-100 text-slate-400 hover:text-red-500 flex-shrink-0 mt-0.5"
                        title="Eliminar curso"
                      >
                        <i class="fas fa-times text-[10px]" />
                      </button>
                    </div>
                    {isConflict && (
                      <div class="absolute top-1 right-1">
                        <i class="fas fa-exclamation-circle text-red-500 text-[10px]" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {courses.length > 0 && (
        <div class="flex flex-wrap items-center justify-between mt-4 text-[11px] text-slate-400 dark-text-dim">
          <span><i class="fas fa-info-circle mr-1" />Pasa el cursor para eliminar</span>
          <span>{courses.length} {courses.length !== 1 ? 'cursos' : 'curso'} · {allConflicts.length} {allConflicts.length !== 1 ? 'conflictos' : 'conflicto'}</span>
        </div>
      )}
    </div>
  );
}
