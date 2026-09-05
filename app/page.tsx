'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, BarChart3, CalendarDays, Check, ChevronLeft, ChevronRight, CircleUserRound,
  Clock3, Flame, Heart, History, LayoutDashboard, LockKeyhole, MoreHorizontal, Plus,
  RotateCcw, Search, Settings, ShieldCheck, Sparkles, Target, Users, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

type View = 'today' | 'history' | 'insights';
type Entry = { id: string; type: string; mood: number; time: string; note: string; tags: string[]; createdAt: string };
declare global { interface Document { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } } }

const typeOptions = [
  { id: 'Соло', icon: Heart, hint: 'Час із собою' },
  { id: 'З партнером', icon: Users, hint: 'Разом із кимось' },
  { id: 'Інше', icon: Sparkles, hint: 'Свій формат' },
];
const tagOptions = ['Розслаблення', 'Стрес', 'Перед сном', 'Спонтанно'];

function demoEntries(): Entry[] {
  const now = Date.now();
  return [
    { id: 'demo-1', type: 'Соло', mood: 8, time: '21:40', note: '', tags: ['Перед сном'], createdAt: new Date(now - 86400000).toISOString() },
    { id: 'demo-2', type: 'З партнером', mood: 9, time: '22:15', note: '', tags: ['Розслаблення'], createdAt: new Date(now - 3 * 86400000).toISOString() },
    { id: 'demo-3', type: 'Соло', mood: 7, time: '19:20', note: '', tags: ['Стрес'], createdAt: new Date(now - 5 * 86400000).toISOString() },
    { id: 'demo-4', type: 'Соло', mood: 8, time: '23:05', note: '', tags: ['Перед сном'], createdAt: new Date(now - 7 * 86400000).toISOString() },
  ];
}

const formatDay = (iso: string) => new Intl.DateTimeFormat('uk-UA', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso));

export default function Home() {
  const [view, setView] = useState<View>('today');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ready, setReady] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mood, setMood] = useState(8);
  const [type, setType] = useState('Соло');
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [details, setDetails] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDemoNote, setShowDemoNote] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('metrika-entries');
    setEntries(stored ? JSON.parse(stored) : demoEntries());
    setReady(true);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key.toLowerCase() === 'n' && !dialogOpen && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) setDialogOpen(true); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [dialogOpen]);

  const stats = useMemo(() => {
    const avg = entries.length ? entries.reduce((sum, item) => sum + item.mood, 0) / entries.length : 0;
    const weekCount = entries.filter(item => Date.now() - new Date(item.createdAt).getTime() < 7 * 86400000).length;
    const evening = entries.filter(item => Number(item.time.split(':')[0]) >= 20);
    return { avg: avg.toFixed(1), weekCount, eveningShare: entries.length ? Math.round(evening.length / entries.length * 100) : 0 };
  }, [entries]);

  const saveEntry = useCallback((input?: { mood?: number; type?: string; note?: string; tags?: string[] }) => {
    const record: Entry = { id: crypto.randomUUID(), mood: input?.mood ?? mood, type: input?.type ?? type, note: input?.note ?? note, tags: input?.tags ?? tags, time: new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(new Date()), createdAt: new Date().toISOString() };
    setEntries(current => { const next = [record, ...current.filter(item => !item.id.startsWith('demo-'))]; localStorage.setItem('metrika-entries', JSON.stringify(next)); return next; });
    setDialogOpen(false); setSaved(true); setNote(''); setTags([]); setDetails(false); window.setTimeout(() => setSaved(false), 4000);
    return record;
  }, [mood, note, tags, type]);

  const undoLast = () => {
    setEntries(current => { const next = current.slice(1); localStorage.setItem('metrika-entries', JSON.stringify(next)); return next; }); setSaved(false);
  };

  useEffect(() => {
    const context = document.modelContext; if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tool = { name: 'create_private_activity_entry', title: 'Додати приватний запис', description: 'Створює приватний запис активності та одразу оновлює статистику.', inputSchema: { type: 'object', properties: { mood: { type: 'number', minimum: 1, maximum: 10 }, type: { type: 'string', enum: ['Соло', 'З партнером', 'Інше'] }, note: { type: 'string', maxLength: 300 }, tags: { type: 'array', items: { type: 'string' }, maxItems: 4 } }, required: ['mood', 'type'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute(input: unknown) { const value = input as { mood?: number; type?: string; note?: string; tags?: string[] }; if (!value || typeof value.mood !== 'number' || value.mood < 1 || value.mood > 10 || !['Соло', 'З партнером', 'Інше'].includes(value.type ?? '')) throw new Error('Некоректні дані запису'); const record = saveEntry(value); return { status: 'saved', id: record.id, mood: record.mood, type: record.type }; } };
    try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined); } catch { /* optional browser capability */ }
    return () => lifecycle.abort();
  }, [saveEntry]);

  const nav = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const currentDate = new Intl.DateTimeFormat('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="app-shell">
        <aside className="sidebar">
          <button className="brand-mark" onClick={() => nav('today')} aria-label="Metrika, на головну"><span className="brand-glyph">M</span><span className="brand-name">metrika</span></button>
          <nav className="nav-list" aria-label="Основна навігація">
            <button className={`nav-item ${view === 'today' ? 'active' : ''}`} onClick={() => nav('today')}><LayoutDashboard /><span>Сьогодні</span></button>
            <button className={`nav-item ${view === 'history' ? 'active' : ''}`} onClick={() => nav('history')}><History /><span>Історія</span></button>
            <button className={`nav-item ${view === 'insights' ? 'active' : ''}`} onClick={() => nav('insights')}><BarChart3 /><span>Інсайти</span></button>
            <button className="nav-item" onClick={() => nav('history')}><CalendarDays /><span>Календар</span></button>
            <button className="nav-item" onClick={() => nav('today')}><Target /><span>Цілі</span></button>
          </nav>
          <div className="privacy-card"><LockKeyhole /><div><strong>Приватний простір</strong><span>Записи лишаються на пристрої</span></div></div>
          <button className="nav-item settings"><Settings /><span>Налаштування</span></button>
        </aside>

        <section className="workspace">
          <header className="topbar">
            <div><p className="eyebrow">{currentDate}</p><h1>{view === 'today' ? 'Твій простір' : view === 'history' ? 'Історія' : 'Твої інсайти'} <span>✦</span></h1></div>
            <div className="top-actions"><div className="streak-pill"><Flame /> 7 днів</div><button className="avatar" aria-label="Профіль"><CircleUserRound /></button></div>
          </header>

          {showDemoNote && entries.some(item => item.id.startsWith('demo-')) && <div className="demo-note"><Sparkles /><span><strong>Тут є демо-дані,</strong> щоб ти одразу побачив користь. Перший запис замінить їх твоїми.</span><button onClick={() => setShowDemoNote(false)} aria-label="Закрити"><X /></button></div>}

          {view === 'today' && <TodayView entries={entries} stats={stats} ready={ready} openLog={() => setDialogOpen(true)} saved={saved} />}
          {view === 'history' && <HistoryView entries={entries} openLog={() => setDialogOpen(true)} />}
          {view === 'insights' && <InsightsView entries={entries} stats={stats} />}
        </section>
      </div>

      {saved && <div className="save-toast" role="status"><span className="toast-check"><Check /></span><div><strong>Запис збережено</strong><small>Статистику вже оновлено</small></div><button onClick={undoLast}><RotateCcw /> Скасувати</button></div>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="entry-dialog">
          <DialogHeader><span className="dialog-kicker">Новий запис · ~10 секунд</span><DialogTitle>Зафіксуй момент</DialogTitle><DialogDescription>Без оцінок і зайвих питань. Обери головне — деталі можна пропустити.</DialogDescription></DialogHeader>
          <div className="entry-form">
            <div className="field-block"><label>Що записуємо?</label><div className="type-cards">{typeOptions.map(item => <button key={item.id} onClick={() => setType(item.id)} className={type === item.id ? 'selected' : ''}><item.icon /><strong>{item.id}</strong><small>{item.hint}</small>{type === item.id && <Check className="selected-check" />}</button>)}</div></div>
            <div className="field-block mood-block"><div className="mood-label"><div><label>Як ти почуваєшся після?</label><span>{mood <= 4 ? 'Не дуже' : mood <= 7 ? 'Нормально' : 'Чудово'}</span></div><strong>{mood}<small>/10</small></strong></div><Slider value={[mood]} min={1} max={10} step={1} onValueChange={(value) => setMood(Array.isArray(value) ? value[0] : value)} /><div className="scale-labels"><span>важко</span><span>супер</span></div></div>
            <button className="details-toggle" onClick={() => setDetails(value => !value)}>{details ? <ChevronLeft /> : <Plus />}{details ? 'Сховати деталі' : 'Додати контекст'}<span>необов’язково</span></button>
            {details && <div className="optional-details"><div className="field-block"><label>Контекст</label><div className="tag-options">{tagOptions.map(item => <button key={item} onClick={() => setTags(current => current.includes(item) ? current.filter(tag => tag !== item) : [...current, item])} className={tags.includes(item) ? 'selected' : ''}>{item}</button>)}</div></div><div className="field-block"><label htmlFor="entry-note">Приватна нотатка</label><Textarea id="entry-note" value={note} onChange={event => setNote(event.target.value)} placeholder="Що варто запам’ятати?" maxLength={300} /></div></div>}
            <Button className="save-button" size="lg" onClick={() => saveEntry()}><LockKeyhole /> Зберегти приватно</Button>
            <p className="keyboard-hint"><span>N</span> відкриває новий запис із будь-якого екрана</p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function TodayView({ entries, stats, ready, openLog, saved }: { entries: Entry[]; stats: { avg: string; weekCount: number; eveningShare: number }; ready: boolean; openLog: () => void; saved: boolean }) {
  const recent = entries.slice(0, 3);
  return <>
    <section className="hero-grid">
      <article className="quick-card"><div className="quick-copy"><span className="section-kicker">Найважливіша дія</span><h2>{entries.length ? 'Як минув твій момент?' : 'Почни з першого запису'}</h2><p>Лише головне зараз. За бажанням додаси контекст — без довгих форм.</p><Button className="log-button" size="lg" onClick={openLog}>{saved ? <Check /> : <Plus />}{saved ? 'Готово' : 'Новий запис'}<span className="shortcut">N</span></Button></div><div className="orb-wrap" aria-hidden="true"><div className="orb"><Heart /></div><span className="orbit-dot one" /><span className="orbit-dot two" /></div></article>
      <article className="pulse-card"><div className="card-head"><span className="icon-box"><Activity /></span><div><span>Пульс тижня</span><small>{stats.weekCount >= 3 ? 'Стабільний ритм' : 'Спокійний ритм'}</small></div></div><div className="week-dots">{[0,1,2,3,4,5,6].map((day) => <span key={day} className={day < Math.min(stats.weekCount, 7) ? 'filled' : ''}>{day < Math.min(stats.weekCount, 7) && <Check />}</span>)}</div><div className="pulse-bottom"><strong>{stats.weekCount}</strong><span>записи<br/>за 7 днів</span></div></article>
    </section>
    <section className="stat-grid" aria-label="Коротка статистика"><article className="stat-card"><span>Усього записів</span><strong>{ready ? entries.length : '—'}</strong><small>твоя картина стає точнішою</small></article><article className="stat-card"><span>Середній стан</span><strong>{stats.avg}</strong><small>із 10 · після активності</small></article><article className="stat-card"><span>Вечірній ритм</span><strong>{stats.eveningShare}<em>%</em></strong><small>записів після 20:00</small></article></section>
    <section className="content-grid">
      <article className="timeline-card"><div className="title-row"><div><span className="section-kicker">Останнє</span><h3>Недавня активність</h3></div><button onClick={() => document.querySelector<HTMLButtonElement>('.nav-item:nth-child(2)')?.click()}>Вся історія <ChevronRight /></button></div><div className="mini-timeline">{recent.map((item, index) => <div className="timeline-row" key={item.id}><span className={`timeline-dot tone-${Math.min(index + 1, 3)}`}><Heart /></span><div><strong>{item.type}</strong><small>{formatDay(item.createdAt)} · {item.time}{item.tags[0] ? ` · ${item.tags[0]}` : ''}</small></div><div className="mood-score">{item.mood}<span>/10</span></div></div>)}</div></article>
      <article className="insight-card"><div className="insight-top"><div className="insight-icon"><Sparkles /></div><span>На основі {entries.length} записів</span></div><span className="section-kicker">Помічено для тебе</span><h3>{stats.eveningShare >= 50 ? 'Вечір — твій природний ритм' : 'Твій ритм досить гнучкий'}</h3><p>{stats.eveningShare >= 50 ? `${stats.eveningShare}% активностей трапляються після 20:00. Це патерн, не оцінка.` : 'Час активності змінюється — поки зарано робити сильні висновки.'}</p><button>Розібрати патерн <ChevronRight /></button></article>
    </section>
  </>;
}

function HistoryView({ entries, openLog }: { entries: Entry[]; openLog: () => void }) {
  return <section className="history-surface"><div className="history-toolbar"><div className="search-box"><Search /><input aria-label="Пошук в історії" placeholder="Пошук у нотатках і тегах" /></div><Button onClick={openLog}><Plus /> Новий запис</Button></div><div className="history-list">{entries.map((entry, index) => <article className="history-entry" key={entry.id}><div className="date-tile"><strong>{new Date(entry.createdAt).getDate()}</strong><span>{new Intl.DateTimeFormat('uk-UA', { month: 'short' }).format(new Date(entry.createdAt))}</span></div><div className="history-icon"><Heart /></div><div className="history-copy"><strong>{entry.type}</strong><span><Clock3 /> {entry.time}{entry.tags.map(tag => <em key={tag}>{tag}</em>)}</span>{entry.note && <p>{entry.note}</p>}</div><div className="history-mood"><strong>{entry.mood}</strong><span>стан</span></div><button className="more-button" aria-label="Більше дій"><MoreHorizontal /></button>{index === 0 && <span className="latest-label">останній</span>}</article>)}</div></section>;
}

function InsightsView({ entries, stats }: { entries: Entry[]; stats: { avg: string; weekCount: number; eveningShare: number } }) {
  const bars = [42, 68, 48, 78, 55, 90, Math.max(35, stats.weekCount * 13)];
  return <><section className="insights-lead"><div><span className="section-kicker">Без моралізаторства</span><h2>Патерни, які допомагають<br/>краще розуміти себе.</h2></div><div className="trust-chip"><ShieldCheck /><span><strong>Локальний аналіз</strong>Дані не покидають пристрій</span></div></section><section className="insight-grid"><article className="chart-card wide"><div className="title-row"><div><span className="section-kicker">Останні 7 днів</span><h3>Твоя активність</h3></div><span className="trend-badge">{stats.weekCount} записів</span></div><div className="chart">{bars.map((value,index) => <div className="bar-column" key={index}><div className={`bar ${index === 5 ? 'highlight' : ''}`} style={{height:`${value}%`}}></div><small>{['Пн','Вт','Ср','Чт','Пт','Сб','Нд'][index]}</small></div>)}</div></article><article className="pattern-card coral"><Sparkles /><span>Сильний сигнал</span><h3>{stats.eveningShare}% записів — увечері</h3><p>Схоже, вечір дає тобі більше простору для себе.</p></article><article className="pattern-card dark"><Activity /><span>Самопочуття</span><h3>{stats.avg}/10 у середньому</h3><p>{Number(stats.avg) >= 8 ? 'Після активності ти зазвичай почуваєшся краще.' : 'Додай більше записів, щоб побачити надійний патерн.'}</p></article></section><p className="insight-footnote">Інсайти описують патерни, а не дають медичних висновків. Зараз проаналізовано {entries.length} записів.</p></>;
}
