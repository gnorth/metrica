'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, BarChart3, CalendarDays, Check, ChevronLeft, ChevronRight, CircleUserRound,
  Clock3, Flame, Heart, History, LayoutDashboard, LockKeyhole, MoreHorizontal, Pause, Play, Plus,
  RotateCcw, Search, Settings, ShieldCheck, Sparkles, Star, Target, Timer, X, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

type View = 'today' | 'history' | 'insights';
type Entry = { id: string; type: string; mood: number; duration: number; rating: number; orgasms: number; time: string; note: string; tags: string[]; createdAt: string };
declare global { interface Document { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } } }

const typeOptions = [
  { id: 'Звичайна', icon: Sparkles, hint: 'Без конкретної цілі' },
  { id: 'Edging', icon: Zap, hint: 'Контроль і витримка' },
  { id: 'Швидка', icon: Timer, hint: 'Коротка сесія' },
  { id: 'Чуттєва', icon: Heart, hint: 'Повільно й уважно' },
];
const tagOptions = ['Без екранів', 'Іграшка', 'Перед сном', 'Зняти стрес', 'Фантазія', 'У душі'];

function demoEntries(): Entry[] {
  const now = Date.now();
  return [
    { id: 'demo-1', type: 'Швидка', mood: 8, duration: 12, rating: 4, orgasms: 1, time: '21:40', note: 'Швидкий заряд бадьорості.', tags: ['Перед сном'], createdAt: new Date(now - 86400000).toISOString() },
    { id: 'demo-2', type: 'Edging', mood: 9, duration: 35, rating: 5, orgasms: 1, time: '22:15', note: 'Фокус на витримці та контролі.', tags: ['Зняти стрес'], createdAt: new Date(now - 3 * 86400000).toISOString() },
    { id: 'demo-3', type: 'Звичайна', mood: 7, duration: 22, rating: 4, orgasms: 1, time: '19:20', note: '', tags: ['Фантазія'], createdAt: new Date(now - 5 * 86400000).toISOString() },
    { id: 'demo-4', type: 'Чуттєва', mood: 8, duration: 28, rating: 5, orgasms: 2, time: '23:05', note: '', tags: ['Без екранів'], createdAt: new Date(now - 7 * 86400000).toISOString() },
  ];
}

const formatDay = (iso: string) => new Intl.DateTimeFormat('uk-UA', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso));

export default function Home() {
  const [view, setView] = useState<View>('today');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ready, setReady] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [mood, setMood] = useState(8);
  const [type, setType] = useState('Звичайна');
  const [duration, setDuration] = useState(20);
  const [rating, setRating] = useState(4);
  const [orgasms, setOrgasms] = useState(1);
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

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => setTimerSeconds(value => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const stats = useMemo(() => {
    const avg = entries.length ? entries.reduce((sum, item) => sum + (item.rating ?? 4), 0) / entries.length : 0;
    const avgDuration = entries.length ? Math.round(entries.reduce((sum, item) => sum + (item.duration ?? 20), 0) / entries.length) : 0;
    const totalOrgasms = entries.reduce((sum, item) => sum + (item.orgasms ?? 1), 0);
    const weekCount = entries.filter(item => Date.now() - new Date(item.createdAt).getTime() < 7 * 86400000).length;
    const evening = entries.filter(item => Number(item.time.split(':')[0]) >= 20);
    return { avg: avg.toFixed(1), avgDuration, totalOrgasms, weekCount, eveningShare: entries.length ? Math.round(evening.length / entries.length * 100) : 0 };
  }, [entries]);

  const saveEntry = useCallback((input?: { mood?: number; type?: string; note?: string; tags?: string[]; duration?: number; rating?: number; orgasms?: number }) => {
    const record: Entry = { id: crypto.randomUUID(), mood: input?.mood ?? mood, type: input?.type ?? type, duration: input?.duration ?? duration, rating: input?.rating ?? rating, orgasms: input?.orgasms ?? orgasms, note: input?.note ?? note, tags: input?.tags ?? tags, time: new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(new Date()), createdAt: new Date().toISOString() };
    setEntries(current => { const next = [record, ...current.filter(item => !item.id.startsWith('demo-'))]; localStorage.setItem('metrika-entries', JSON.stringify(next)); return next; });
    setDialogOpen(false); setSaved(true); setNote(''); setTags([]); setDetails(false); window.setTimeout(() => setSaved(false), 4000);
    return record;
  }, [duration, mood, note, orgasms, rating, tags, type]);

  const finishTimer = () => {
    setTimerRunning(false); setTimerOpen(false); setDuration(Math.max(1, Math.round(timerSeconds / 60))); setDialogOpen(true);
  };

  const undoLast = () => {
    setEntries(current => { const next = current.slice(1); localStorage.setItem('metrika-entries', JSON.stringify(next)); return next; }); setSaved(false);
  };

  useEffect(() => {
    const context = document.modelContext; if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tool = { name: 'create_private_solo_session', title: 'Додати соло-сесію', description: 'Створює приватний запис соло-сесії та одразу оновлює статистику.', inputSchema: { type: 'object', properties: { mood: { type: 'number', minimum: 1, maximum: 10 }, type: { type: 'string', enum: ['Звичайна', 'Edging', 'Швидка', 'Чуттєва'] }, duration: { type: 'number', minimum: 1, maximum: 360 }, rating: { type: 'number', minimum: 1, maximum: 5 }, orgasms: { type: 'number', minimum: 0, maximum: 20 }, note: { type: 'string', maxLength: 300 }, tags: { type: 'array', items: { type: 'string' }, maxItems: 6 } }, required: ['mood', 'type', 'duration', 'rating'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute(input: unknown) { const value = input as { mood?: number; type?: string; duration?: number; rating?: number; orgasms?: number; note?: string; tags?: string[] }; if (!value || typeof value.mood !== 'number' || value.mood < 1 || value.mood > 10 || !['Звичайна', 'Edging', 'Швидка', 'Чуттєва'].includes(value.type ?? '') || !value.duration || !value.rating) throw new Error('Некоректні дані сесії'); const record = saveEntry(value); return { status: 'saved', id: record.id, duration: record.duration, rating: record.rating, type: record.type }; } };
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
            <button className="nav-item" onClick={() => nav('insights')}><Target /><span>Цілі</span></button>
          </nav>
          <div className="privacy-card"><LockKeyhole /><div><strong>Приватний простір</strong><span>Записи лишаються на пристрої</span></div></div>
          <button className="nav-item settings"><Settings /><span>Налаштування</span></button>
        </aside>

        <section className="workspace">
          <header className="topbar">
            <div><p className="eyebrow">{currentDate}</p><h1>{view === 'today' ? 'Твій простір' : view === 'history' ? 'Історія' : 'Твої інсайти'} <span>✦</span></h1></div>
            <div className="top-actions"><button className="timer-pill" onClick={() => setTimerOpen(true)}><Timer /> Live-таймер</button><div className="streak-pill"><Flame /> 7 днів</div><button className="avatar" aria-label="Профіль" onClick={() => nav('insights')}><CircleUserRound /></button></div>
          </header>

          {showDemoNote && entries.some(item => item.id.startsWith('demo-')) && <div className="demo-note"><Sparkles /><span><strong>Тут є демо-дані,</strong> щоб ти одразу побачив користь. Перший запис замінить їх твоїми.</span><button onClick={() => setShowDemoNote(false)} aria-label="Закрити"><X /></button></div>}

          {view === 'today' && <TodayView entries={entries} stats={stats} ready={ready} openLog={() => setDialogOpen(true)} openTimer={() => setTimerOpen(true)} saved={saved} />}
          {view === 'history' && <HistoryView entries={entries} openLog={() => setDialogOpen(true)} />}
          {view === 'insights' && <InsightsView entries={entries} stats={stats} />}
        </section>
      </div>

      {saved && <div className="save-toast" role="status"><span className="toast-check"><Check /></span><div><strong>Запис збережено</strong><small>Статистику вже оновлено</small></div><button onClick={undoLast}><RotateCcw /> Скасувати</button></div>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="entry-dialog">
          <DialogHeader><span className="dialog-kicker">Нова соло-сесія · приватно</span><DialogTitle>Як усе пройшло?</DialogTitle><DialogDescription>Короткий запис для чесної статистики. Деталі можна пропустити.</DialogDescription></DialogHeader>
          <div className="entry-form">
            <div className="field-block"><label>Що записуємо?</label><div className="type-cards">{typeOptions.map(item => <button key={item.id} onClick={() => setType(item.id)} className={type === item.id ? 'selected' : ''}><item.icon /><strong>{item.id}</strong><small>{item.hint}</small>{type === item.id && <Check className="selected-check" />}</button>)}</div></div>
            <div className="core-fields"><div className="field-block compact-field"><div className="mood-label"><label>Тривалість</label><strong>{duration}<small> хв</small></strong></div><div className="quick-values">{[5,15,25,45].map(value => <button key={value} className={duration === value ? 'selected' : ''} onClick={() => setDuration(value)}>{value}</button>)}</div><Slider value={[duration]} min={1} max={90} step={1} onValueChange={(value) => setDuration(Array.isArray(value) ? value[0] : value)} /></div><div className="field-block compact-field"><div className="mood-label"><label>Оргазми</label><strong>{orgasms}</strong></div><div className="stepper"><button onClick={() => setOrgasms(value => Math.max(0, value - 1))}>−</button><span>{orgasms}</span><button onClick={() => setOrgasms(value => Math.min(20, value + 1))}>+</button></div></div></div>
            <div className="field-block rating-block"><div className="mood-label"><label>Задоволення</label><strong>{rating}<small>/5</small></strong></div><div className="rating-stars">{[1,2,3,4,5].map(value => <button key={value} onClick={() => setRating(value)} aria-label={`${value} з 5`} className={value <= rating ? 'selected' : ''}><Star /></button>)}</div></div>
            <div className="field-block mood-block"><div className="mood-label"><div><label>Як ти почуваєшся після?</label><span>{mood <= 4 ? 'Не дуже' : mood <= 7 ? 'Нормально' : 'Чудово'}</span></div><strong>{mood}<small>/10</small></strong></div><Slider value={[mood]} min={1} max={10} step={1} onValueChange={(value) => setMood(Array.isArray(value) ? value[0] : value)} /><div className="scale-labels"><span>важко</span><span>супер</span></div></div>
            <button className="details-toggle" onClick={() => setDetails(value => !value)}>{details ? <ChevronLeft /> : <Plus />}{details ? 'Сховати деталі' : 'Додати контекст'}<span>необов’язково</span></button>
            {details && <div className="optional-details"><div className="field-block"><label>Контекст</label><div className="tag-options">{tagOptions.map(item => <button key={item} onClick={() => setTags(current => current.includes(item) ? current.filter(tag => tag !== item) : [...current, item])} className={tags.includes(item) ? 'selected' : ''}>{item}</button>)}</div></div><div className="field-block"><label htmlFor="entry-note">Приватна нотатка</label><Textarea id="entry-note" value={note} onChange={event => setNote(event.target.value)} placeholder="Що варто запам’ятати?" maxLength={300} /></div></div>}
            <Button className="save-button" size="lg" onClick={() => saveEntry()}><LockKeyhole /> Зберегти приватно</Button>
            <p className="keyboard-hint"><span>N</span> відкриває новий запис із будь-якого екрана</p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={timerOpen} onOpenChange={(open) => { setTimerOpen(open); if (!open) setTimerRunning(false); }}>
        <DialogContent className="timer-dialog" showCloseButton={false}><div className="timer-head"><span><span className="live-dot" /> Live session</span><button onClick={() => { setTimerOpen(false); setTimerRunning(false); }} aria-label="Закрити"><X /></button></div><div className="timer-face"><small>{timerRunning ? 'ФІКСУЄМО ЧАС…' : timerSeconds ? 'НА ПАУЗІ' : 'ГОТОВИЙ, КОЛИ ТИ ГОТОВИЙ'}</small><strong>{String(Math.floor(timerSeconds / 60)).padStart(2,'0')}:{String(timerSeconds % 60).padStart(2,'0')}</strong></div><div className="timer-actions"><button className="reset-timer" onClick={() => setTimerSeconds(0)} disabled={!timerSeconds}><RotateCcw /> Скинути</button><button className="play-timer" onClick={() => setTimerRunning(value => !value)}>{timerRunning ? <Pause /> : <Play />}</button><Button className="finish-timer" onClick={finishTimer} disabled={!timerSeconds}><Check /> Завершити й записати</Button></div><p><LockKeyhole /> Таймер працює лише на твоєму пристрої</p></DialogContent>
      </Dialog>
    </main>
  );
}

function TodayView({ entries, stats, ready, openLog, openTimer, saved }: { entries: Entry[]; stats: { avg: string; avgDuration: number; totalOrgasms: number; weekCount: number; eveningShare: number }; ready: boolean; openLog: () => void; openTimer: () => void; saved: boolean }) {
  const recent = entries.slice(0, 3);
  return <>
    <section className="hero-grid">
      <article className="quick-card"><div className="quick-copy"><span className="section-kicker">Твій сольний ритм</span><h2>{entries.length ? 'Час для себе — без зайвого шуму.' : 'Почни з першої сесії'}</h2><p>Запускай таймер під час сесії або додай готовий запис за кілька секунд.</p><div className="hero-actions"><Button className="log-button" size="lg" onClick={openLog}>{saved ? <Check /> : <Plus />}{saved ? 'Готово' : 'Записати сесію'}<span className="shortcut">N</span></Button><button className="hero-timer" onClick={openTimer}><Timer /> Live-таймер</button></div></div><div className="orb-wrap" aria-hidden="true"><div className="orb"><Heart /></div><span className="orbit-dot one" /><span className="orbit-dot two" /></div></article>
      <article className="pulse-card"><div className="card-head"><span className="icon-box"><Activity /></span><div><span>Пульс тижня</span><small>{stats.weekCount >= 3 ? 'Стабільний ритм' : 'Спокійний ритм'}</small></div></div><div className="week-dots">{[0,1,2,3,4,5,6].map((day) => <span key={day} className={day < Math.min(stats.weekCount, 7) ? 'filled' : ''}>{day < Math.min(stats.weekCount, 7) && <Check />}</span>)}</div><div className="pulse-bottom"><strong>{stats.weekCount}</strong><span>записи<br/>за 7 днів</span></div></article>
    </section>
    <section className="stat-grid four" aria-label="Коротка статистика"><article className="stat-card"><span>Соло-сесій</span><strong>{ready ? entries.length : '—'}</strong><small>зафіксовано приватно</small></article><article className="stat-card"><span>Середній час</span><strong>{stats.avgDuration}<em> хв</em></strong><small>на одну сесію</small></article><article className="stat-card"><span>Оргазмів</span><strong>{stats.totalOrgasms}</strong><small>загалом</small></article><article className="stat-card"><span>Задоволення</span><strong>{stats.avg}<em>/5</em></strong><small>середня оцінка</small></article></section>
    <section className="content-grid">
      <article className="timeline-card"><div className="title-row"><div><span className="section-kicker">Останнє</span><h3>Недавні сесії</h3></div><button onClick={() => document.querySelector<HTMLButtonElement>('.nav-item:nth-child(2)')?.click()}>Вся історія <ChevronRight /></button></div><div className="mini-timeline">{recent.map((item, index) => <div className="timeline-row" key={item.id}><span className={`timeline-dot tone-${Math.min(index + 1, 3)}`}><Heart /></span><div><strong>{item.type}</strong><small>{formatDay(item.createdAt)} · {item.time} · {item.duration ?? 20} хв{item.tags[0] ? ` · ${item.tags[0]}` : ''}</small></div><div className="mood-score">{item.rating ?? 4}<span>/5</span></div></div>)}</div></article>
      <article className="insight-card"><div className="insight-top"><div className="insight-icon"><Sparkles /></div><span>На основі {entries.length} записів</span></div><span className="section-kicker">Помічено для тебе</span><h3>{stats.eveningShare >= 50 ? 'Вечір — твій природний ритм' : 'Твій ритм досить гнучкий'}</h3><p>{stats.eveningShare >= 50 ? `${stats.eveningShare}% активностей трапляються після 20:00. Це патерн, не оцінка.` : 'Час активності змінюється — поки зарано робити сильні висновки.'}</p><button>Розібрати патерн <ChevronRight /></button></article>
    </section>
  </>;
}

function HistoryView({ entries, openLog }: { entries: Entry[]; openLog: () => void }) {
  return <section className="history-surface"><div className="history-toolbar"><div className="search-box"><Search /><input aria-label="Пошук в історії" placeholder="Пошук у нотатках і тегах" /></div><div className="history-filters">{['Усі','Edging','Швидкі','Чуттєві'].map((item,index) => <button className={index === 0 ? 'active' : ''} key={item}>{item}</button>)}</div><Button onClick={openLog}><Plus /> Нова сесія</Button></div><div className="history-list">{entries.map((entry, index) => <article className="history-entry" key={entry.id}><div className="date-tile"><strong>{new Date(entry.createdAt).getDate()}</strong><span>{new Intl.DateTimeFormat('uk-UA', { month: 'short' }).format(new Date(entry.createdAt))}</span></div><div className="history-icon"><Heart /></div><div className="history-copy"><strong>{entry.type} <em className="duration-chip">{entry.duration ?? 20} хв</em></strong><span><Clock3 /> {entry.time}{entry.tags.map(tag => <em key={tag}>#{tag.toLowerCase().replaceAll(' ','_')}</em>)}</span>{entry.note && <p>«{entry.note}»</p>}</div><div className="session-meta"><span><Zap /> {entry.orgasms ?? 1}</span><span><Star /> {entry.rating ?? 4}</span></div><button className="more-button" aria-label="Більше дій"><MoreHorizontal /></button>{index === 0 && <span className="latest-label">остання</span>}</article>)}</div></section>;
}

function InsightsView({ entries, stats }: { entries: Entry[]; stats: { avg: string; avgDuration: number; totalOrgasms: number; weekCount: number; eveningShare: number } }) {
  const bars = [42, 68, 48, 78, 55, 90, Math.max(35, stats.weekCount * 13)];
  return <><section className="insights-lead"><div><span className="section-kicker">Твій сольний профіль</span><h2>Не просто цифри.<br/>Твоя особиста картина.</h2></div><div className="trust-chip"><ShieldCheck /><span><strong>Локальний аналіз</strong>Дані не покидають пристрій</span></div></section><section className="profile-strip"><div><span>Рівень 2</span><strong>85 <small>/ 300 XP</small></strong></div><div className="xp-track"><span style={{width:'28%'}} /></div><p>Ще 215 XP до нового рівня</p></section><section className="insight-grid"><article className="chart-card wide"><div className="title-row"><div><span className="section-kicker">Останні 7 днів</span><h3>Тривалість сесій</h3></div><span className="trend-badge">сер. {stats.avgDuration} хв</span></div><div className="chart">{bars.map((value,index) => <div className="bar-column" key={index}><div className={`bar ${index === 5 ? 'highlight' : ''}`} style={{height:`${value}%`}}></div><small>{['Пн','Вт','Ср','Чт','Пт','Сб','Нд'][index]}</small></div>)}</div></article><article className="pattern-card coral"><Sparkles /><span>Час доби</span><h3>{stats.eveningShare}% сесій — увечері</h3><p>Вечір найчастіше дає тобі простір для себе.</p></article><article className="pattern-card dark"><Star /><span>Задоволення</span><h3>{stats.avg}/5 у середньому</h3><p>{Number(stats.avg) >= 4 ? 'Твій середній досвід стабільно позитивний.' : 'Додай більше сесій, щоб побачити надійний патерн.'}</p></article></section><section className="goals-section"><div className="title-row"><div><span className="section-kicker">Особисті цілі</span><h3>М’який прогрес, без тиску</h3></div><button><Plus /> Створити ціль</button></div><div className="goal-row"><Target /><div><strong>Усвідомлений тиждень</strong><span>60 хв часу для себе</span></div><div className="goal-progress"><span style={{width:`${Math.min(100, stats.avgDuration * stats.weekCount / .6)}%`}} /></div><strong>{stats.avgDuration * stats.weekCount} / 60 хв</strong></div></section><p className="insight-footnote">Інсайти описують патерни, а не дають медичних висновків. Зараз проаналізовано {entries.length} сесій.</p></>;
}
