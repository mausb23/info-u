import { DAYS, HOURS } from './conflicts';

const LABEL_W = 80;
const CELL_W = 124;
const ROW_H = 50;
const HEADER_H = 36;
const PAD = 16;
const SCALE = 2;

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function exportScheduleImage(courses) {
  const cols = DAYS.length;
  const rows = HOURS.length;

  const cw = LABEL_W + cols * CELL_W;
  const ch = HEADER_H + rows * ROW_H;
  const tw = cw + PAD * 2;
  const th = ch + PAD * 2;

  const canvas = document.createElement('canvas');
  canvas.width = tw * SCALE;
  canvas.height = th * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, tw, th);

  ctx.translate(PAD, PAD);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, cw, HEADER_H);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, HEADER_H, cw, rows * ROW_H);

  for (let i = 0; i <= rows; i++) {
    const y = HEADER_H + i * ROW_H;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(cw, y + 0.5);
    ctx.stroke();
  }

  for (let i = 0; i <= cols; i++) {
    const x = LABEL_W + i * CELL_W;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, HEADER_H + rows * ROW_H);
    ctx.stroke();
  }

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0.5, 0);
  ctx.lineTo(0.5, HEADER_H + rows * ROW_H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(LABEL_W - 0.5, 0);
  ctx.lineTo(LABEL_W - 0.5, HEADER_H + rows * ROW_H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cw - 0.5, 0);
  ctx.lineTo(cw - 0.5, HEADER_H + rows * ROW_H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, HEADER_H - 0.5);
  ctx.lineTo(cw, HEADER_H - 0.5);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  DAYS.forEach((day, i) => {
    const cx = LABEL_W + i * CELL_W + CELL_W / 2;
    ctx.fillText(day, cx, HEADER_H / 2);
  });

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  HOURS.forEach((hour, i) => {
    const x = LABEL_W / 2;
    const y = HEADER_H + i * ROW_H + ROW_H / 2;
    ctx.fillText(`${pad2(hour)}:00 - ${pad2(hour)}:50`, x, y);
  });

  for (const course of courses) {
    for (const day of course.days) {
      const dayIdx = DAYS.indexOf(day);
      if (dayIdx === -1) continue;
      const x = LABEL_W + dayIdx * CELL_W + 2;
      const y = HEADER_H + (course.startHour - 7) * ROW_H + 2;
      const w = CELL_W - 4;
      const h = (course.endHour - course.startHour + 1) * ROW_H - 4;

      ctx.fillStyle = course.color + '20';
      roundRect(ctx, x, y, w, h, 6);
      ctx.fill();

      ctx.strokeStyle = course.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 8);
      ctx.lineTo(x + 4, y + h - 8);
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const tx = x + 12;
      const ty = y + 6;
      const maxW = w - 18;

      const words = course.name.split(' ');
      let line = '';
      let lineY = ty;
      for (const word of words) {
        const test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line, tx, lineY);
          line = word;
          lineY += 15;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, tx, lineY);
    }
  }

  const link = document.createElement('a');
  link.download = `schedule-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
