import { useState } from 'react';
import { DAYS, HOURS } from '../../utils/conflicts';

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
];

export default function CourseForm({ onAdd }) {
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(9);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [customColor, setCustomColor] = useState(false);

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const validEndHours = HOURS.filter((h) => h >= startHour);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (selectedDays.length === 0) return;
    onAdd({
      name: name.trim(),
      days: selectedDays,
      startHour,
      endHour,
      color,
    });
    setName('');
    setSelectedDays([]);
    setStartHour(8);
    setEndHour(9);
    setColor(PRESET_COLORS[0]);
    setCustomColor(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      class="bg-white dark-surface rounded-2xl border border-slate-200/80 dark-border shadow-sm p-5 mb-6"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
        {/* Course Name */}
        <div class="sm:col-span-2 lg:col-span-3">
          <label class="block text-xs font-bold text-slate-400 dark-text-dim uppercase mb-1 ml-1">Nombre del Curso</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Cálculo I"
            required
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark-input focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
          />
        </div>

        {/* Days */}
        <div class="sm:col-span-3 lg:col-span-4">
          <label class="block text-xs font-bold text-slate-400 dark-text-dim uppercase mb-1.5 ml-1">Días</label>
          <div class="flex flex-wrap gap-1.5">
            {DAYS.map((day) => (
              <label
                key={day}
                class={`cursor-pointer px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  selectedDays.includes(day)
                    ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-100 dark-muted-bg text-slate-500 dark-text-dim border-transparent hover:bg-slate-200 dark-hover-surface'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedDays.includes(day)}
                  onChange={() => toggleDay(day)}
                  class="hidden"
                />
                {day}
              </label>
            ))}
          </div>
        </div>

        {/* Start Hour */}
        <div class="lg:col-span-1">
          <label class="block text-xs font-bold text-slate-400 dark-text-dim uppercase mb-1 ml-1">De</label>
          <select
            value={startHour}
            onChange={(e) => {
              const val = Number(e.target.value);
              setStartHour(val);
              if (endHour < val) setEndHour(val);
            }}
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark-input focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm appearance-none cursor-pointer"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
            ))}
          </select>
        </div>

        {/* End Hour */}
        <div class="lg:col-span-1">
          <label class="block text-xs font-bold text-slate-400 dark-text-dim uppercase mb-1 ml-1">A</label>
          <select
            value={endHour}
            onChange={(e) => setEndHour(Number(e.target.value))}
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark-input focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm appearance-none cursor-pointer"
          >
            {validEndHours.map((h) => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}:50</option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div class="lg:col-span-2">
          <label class="block text-xs font-bold text-slate-400 dark-text-dim uppercase mb-1.5 ml-1">Color</label>
          <div class="flex items-center gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setColor(c); setCustomColor(false); }}
                class={`w-7 h-7 rounded-lg border-2 transition-all ${
                  color === c && !customColor ? 'border-slate-800 dark:border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <div class="relative">
              <button
                type="button"
                onClick={() => setCustomColor(true)}
                class={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                  customColor ? 'border-slate-800 dark:border-white scale-110 bg-slate-200' : 'border-transparent bg-slate-100 dark-muted-bg text-slate-400'
                }`}
              >
                <i class="fas fa-palette" />
              </button>
              {customColor && (
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  class="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-8 h-8 p-0 border-0 cursor-pointer rounded-lg shadow-lg"
                />
              )}
            </div>
          </div>
        </div>

        {/* Add Button */}
        <div class="lg:col-span-1">
          <button
            type="submit"
            disabled={!name.trim() || selectedDays.length === 0}
            class="w-full px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg text-sm flex items-center justify-center gap-1.5"
          >
            <i class="fas fa-plus" />
            Agregar
          </button>
        </div>
      </div>
    </form>
  );
}
