'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, BarChart3, CalendarDays, Check, ChevronRight, CircleUserRound, Flame, Heart, LayoutDashboard, LockKeyhole, Plus, Settings, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

declare global {
  interface Document { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }
}

const week = [
  { day: 'Пн', value: 36 }, { day: 'Вт', value: 64 }, { day: 'Ср', value: 46 },
  { day: 'Чт', value: 82 }, { day: 'Пт', value: 56 }, { day: 'Сб', value: 92 }, { day: 'Нд', value: 70 },
];

export default function Home() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mood, setMood] = useState(8);
  const [type, setType] = useState('Соло');
  const [saved, setSaved] = useState(false);

  const saveEntry = useCallback((entry?: { mood?: number; type?: string; note?: string }) => {
    const record = { mood: entry?.mood ?? mood, type: entry?.type ?? type, note: entry?.note ?? '', createdAt: new Date().toISOString() };
    localStorage.setItem('metrika-latest-entry', JSON.stringify(record));
    setMood(record.mood); setType(record.type); setSaved(true); setDialogOpen(false);
    window.setTimeout(() => setSaved(false), 2600);
    return record;
  }, [mood, type]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tool = {
      name: 'create_private_activity_entry', title: 'Додати приватний запис',
      description: 'Зберігає новий приватний запис активності та оновлює видимий стан дашборда.',
      inputSchema: { type: 'object', properties: { mood: { type: 'number', minimum: 1, maximum: 10 }, type: { type: 'string', enum: ['Соло', 'З партнером', 'Інше'] }, note: { type: 'string', maxLength: 300 } }, required: ['mood', 'type'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) { const value = input as { mood?: number; type?: string; note?: string }; if (!value || typeof value.mood !== 'number' || value.mood < 1 || value.mood > 10 || !['Соло', 'З партнером', 'Інше'].includes(value.type ?? '')) throw new Error('Некоректні дані запису'); const record = saveEntry(value as { mood: number; type: string; note?: string }); return { status: 'saved', mood: record.mood, type: record.type }; },
    };
    try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined); } catch { /* unsupported preview */ }
    return () => lifecycle.abort();
  }, [saveEntry]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand-mark" aria-label="Metrika"><span className="brand-glyph">M</span><span className="brand-name">metrika</span></div>
          <nav className="nav-list" aria-label="Основна навігація">
            <a className="nav-item active" href="#overview"><LayoutDashboard />Огляд</a>
            <a className="nav-item" href="#activity"><Activity />Активність</a>
            <a className="nav-item" href="#calendar"><CalendarDays />Календар</a>
            <a className="nav-item" href="#insights"><BarChart3 />Аналітика</a>
            <a className="nav-item" href="#goals"><Target />Цілі</a>
          </nav>
          <div className="privacy-card"><LockKeyhole /><div><strong>Тільки для тебе</strong><span>Дані зберігаються приватно</span></div></div>
          <a className="nav-item settings" href="#settings"><Settings />Налаштування</a>
        </aside>

        <section className="workspace" id="overview">
          <header className="topbar">
            <div><p className="eyebrow">Субота, 5 вересня</p><h1>Привіт, Алекс <span>✦</span></h1></div>
            <div className="top-actions"><div className="streak-pill"><Flame /> 7 днів</div><button className="avatar" aria-label="Профіль"><CircleUserRound /></button></div>
          </header>

          <section className="hero-grid">
            <article className="quick-card">
              <div className="quick-copy"><span className="section-kicker">Швидка дія</span><h2>Як минув твій день?</h2><p>Один короткий запис — і твоя картина стає точнішою.</p><Button className="log-button" size="lg" onClick={() => setDialogOpen(true)}>{saved ? <Check /> : <Plus />}{saved ? 'Запис збережено' : 'Додати активність'}</Button></div>
              <div className="orb-wrap" aria-hidden="true"><div className="orb"><Heart /></div><span className="orbit-dot one" /><span className="orbit-dot two" /></div>
            </article>
            <article className="goal-card">
              <div className="card-head"><span className="icon-box"><Target /></span><span>Ціль тижня</span></div>
              <div className="goal-number"><strong>4</strong><span>/ 5</span></div><Progress value={80} className="goal-progress" /><p>Ще один крок до твоєї цілі</p>
            </article>
          </section>

          <section className="stat-grid" aria-label="Статистика">
            <article className="stat-card"><span>Цього місяця</span><strong>18</strong><small className="positive">↗ 12% від серпня</small></article>
            <article className="stat-card"><span>Середній настрій</span><strong>8.4</strong><small>із 10 · чудово</small></article>
            <article className="stat-card"><span>Найкраща серія</span><strong>12 <em>днів</em></strong><small>особистий рекорд</small></article>
          </section>

          <section className="content-grid">
            <article className="chart-card">
              <div className="title-row"><div><span className="section-kicker">Твій ритм</span><h3>Активність за 7 днів</h3></div><button>Тиждень <ChevronRight /></button></div>
              <div className="chart" aria-label="Графік активності за тиждень">{week.map((item, index) => <div className="bar-column" key={item.day}><div className={`bar ${index === 5 ? 'highlight' : ''}`} style={{ height: `${item.value}%` }}><span>{index === 5 ? '3' : ''}</span></div><small>{item.day}</small></div>)}</div>
            </article>
            <article className="insight-card" id="insights"><div className="insight-icon"><Sparkles /></div><span className="section-kicker">Розумний інсайт</span><h3>Твій найкращий час — вечір</h3><p>У дні з активністю після 20:00 ти оцінюєш настрій у середньому на 16% вище.</p><button>Побачити деталі <ChevronRight /></button></article>
          </section>
        </section>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="entry-dialog">
          <DialogHeader><span className="dialog-kicker">Новий запис</span><DialogTitle>Зафіксуй момент</DialogTitle><DialogDescription>Коротко й без зайвого. Усе зберігається лише на цьому пристрої.</DialogDescription></DialogHeader>
          <div className="entry-form">
            <div className="field-block"><label>Тип активності</label><div className="type-options">{['Соло', 'З партнером', 'Інше'].map(item => <button key={item} onClick={() => setType(item)} className={type === item ? 'selected' : ''}>{item}</button>)}</div></div>
            <div className="field-block"><div className="mood-label"><label>Настрій після</label><strong>{mood}/10</strong></div><Slider value={[mood]} min={1} max={10} step={1} onValueChange={(value) => setMood(Array.isArray(value) ? value[0] : value)} /></div>
            <div className="field-block"><label htmlFor="entry-note">Нотатка <span>необов’язково</span></label><Textarea id="entry-note" placeholder="Що хочеш запам’ятати?" maxLength={300} /></div>
            <Button className="save-button" size="lg" onClick={() => saveEntry()}><Check /> Зберегти приватно</Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
