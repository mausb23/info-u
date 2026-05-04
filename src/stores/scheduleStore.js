import { create } from 'zustand';

const STORAGE_KEY = 'infoU_schedule_v2';

const DAY_MAP = {
  Mon: 'Lun', Tue: 'Mar', Wed: 'Mié', Thu: 'Jue',
  Fri: 'Vie', Sat: 'Sáb', Sun: 'Dom',
};

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      let migrated = false;
      const courses = parsed.map((c) => {
        if (!c.days || !Array.isArray(c.days)) return c;
        const newDays = c.days.map((d) => DAY_MAP[d] || d);
        if (newDays.some((d, i) => d !== c.days[i])) migrated = true;
        return migrated ? { ...c, days: newDays } : c;
      });
      if (migrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
      return courses;
    }
  } catch {}
  return [];
}

function save(courses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  } catch {}
}

export const useScheduleStore = create((set, get) => ({
  courses: load(),

  addCourse: (course) => {
    const newCourse = {
      ...course,
      id: crypto.randomUUID(),
    };
    const next = [...get().courses, newCourse];
    save(next);
    set({ courses: next });
  },

  removeCourse: (id) => {
    const next = get().courses.filter((c) => c.id !== id);
    save(next);
    set({ courses: next });
  },

  clearAll: () => {
    save([]);
    set({ courses: [] });
  },
}));
