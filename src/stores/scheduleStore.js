import { create } from 'zustand';

const STORAGE_KEY = 'campus_schedule_v2';

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
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
