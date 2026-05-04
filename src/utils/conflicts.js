export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export function doSlotsOverlap(a, b) {
  return a.startHour < b.endHour && b.startHour < a.endHour;
}

export function getConflicts(courses) {
  const conflicts = [];
  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      const a = courses[i];
      const b = courses[j];
      for (const dayA of a.days) {
        for (const dayB of b.days) {
          if (dayA === dayB && doSlotsOverlap(a, b)) {
            conflicts.push({
              a: a.id,
              b: b.id,
              day: dayA,
              label: `${a.name} & ${b.name} overlap on ${dayA}`,
            });
          }
        }
      }
    }
  }
  return conflicts;
}

export function formatHour(h) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h;
  return `${display}:00 ${ampm}`;
}
