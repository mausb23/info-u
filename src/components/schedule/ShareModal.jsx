import { useState, useRef } from 'react';
import { exportScheduleImage } from '../../utils/exportCanvas';

export default function ShareModal({ courses, onClose }) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const shareUrl = useRef(null);
  if (!shareUrl.current) {
    const payload = courses.map((c) => ({
      n: c.name,
      d: c.days,
      s: c.startHour,
      e: c.endHour,
      cl: c.color,
    }));
    const encoded = btoa(JSON.stringify(payload));
    shareUrl.current = `${window.location.origin}${window.location.pathname}?schedule=${encoded}`;
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl.current);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareUrl.current;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadImage = async () => {
    setExporting(true);
    try {
      await exportScheduleImage(courses);
    } catch (err) {
      console.error('Export failed:', err);
    }
    setExporting(false);
  };

  const handleLoadExample = () => {
    const example = [
      { n: 'Calculus I', d: ['Mon', 'Wed', 'Fri'], s: 8, e: 9, cl: '#3b82f6' },
      { n: 'Physics Lab', d: ['Thu'], s: 14, e: 17, cl: '#10b981' },
      { n: 'English Lit', d: ['Tue', 'Thu'], s: 10, e: 11, cl: '#f59e0b' },
      { n: 'Computer Science', d: ['Mon', 'Wed', 'Fri'], s: 10, e: 11, cl: '#ef4444' },
      { n: 'Art History', d: ['Tue', 'Thu'], s: 14, e: 15, cl: '#8b5cf6' },
    ];
    const payload = example.map((c) => ({ n: c.n, d: c.d, s: c.s, e: c.e, cl: c.cl }));
    const encoded = btoa(JSON.stringify(payload));
    const url = `${window.location.origin}${window.location.pathname}?schedule=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        class="bg-white dark-surface rounded-2xl shadow-2xl border border-slate-200 dark-border max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-slate-800 dark-text-primary">
            <i class="fas fa-share-alt mr-2 text-indigo-500" />
            Compartir Horario
          </h2>
          <button onClick={onClose} class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark-hover-surface transition-all">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="space-y-4">
          {courses.length === 0 ? (
            <div class="text-center py-6">
              <i class="fas fa-calendar text-3xl text-slate-300 dark-empty-icon mb-2" />
              <p class="text-sm text-slate-400 dark-text-dim">Agrega cursos primero, luego comparte tu horario.</p>
              <button
                onClick={handleLoadExample}
                class="mt-3 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-semibold hover:bg-indigo-100 transition-all"
              >
                <i class="fas fa-eye mr-1.5" />Cargar ejemplo
              </button>
            </div>
          ) : (
            <>
              <div>
                <p class="text-xs font-medium text-slate-500 dark-text-dim uppercase mb-2">Enlace Compartible</p>
                <div class="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl.current}
                    class="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark-input text-xs font-mono outline-none"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={handleCopyUrl}
                    class={`px-4 py-2 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                      copied
                        ? 'bg-emerald-500 text-white'
                        : 'bg-indigo-500 text-white hover:bg-indigo-600'
                    }`}
                  >
                    <i class={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-1.5`} />
                    {copied ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div class="border-t border-slate-200 dark-border pt-4">
                <p class="text-xs font-medium text-slate-500 dark-text-dim uppercase mb-2">Descargar como Imagen</p>
                <button
                  onClick={handleDownloadImage}
                  disabled={exporting}
                  class="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-60 shadow-lg shadow-indigo-200"
                >
                  <i class={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-download'} mr-2`} />
                  {exporting ? 'Generando...' : 'Descargar PNG del Horario'}
                </button>
              </div>

              <div class="border-t border-slate-200 dark-border pt-3">
                <p class="text-xs text-slate-400 dark-text-dim">
                  {courses.length} {courses.length !== 1 ? 'cursos' : 'curso'} codificados. Quienes reciban el enlace pueden ver tu horario.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
