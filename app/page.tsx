'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, BarChart3, CalendarDays, Check, ChevronLeft, ChevronRight, CircleUserRound,
  Clock3, Flame, Heart, History, LayoutDashboard, LockKeyhole, MoreHorizontal, Pause, Play, Plus,
  Copy, Edit3, LocateFixed, MapPin, PersonStanding, RotateCcw, Search, ShieldCheck, Sparkles, Star, Tag, Target, Timer, Trash2, X, Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, CartesianGrid, Cell, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, XAxis, YAxis } from 'recharts';

type View = 'today' | 'history' | 'calendar' | 'goals' | 'insights';
type Entry = { id: string; type: string; mood: number; duration: number; rating: number; orgasms: number; time: string; note: string; tags: string[]; places?: string[]; positions?: string[]; locations?: string[]; createdAt: string };
type Goal = { id: string; title: string; metric: 'sessions' | 'minutes'; target: number; period: 'week' | 'month' };
type Taxonomy = { categories: string[]; tags: string[]; places: string[]; positions: string[]; locations: string[] };
declare global { interface Document { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } } }

const typeOptions = [
  { id: 'Звичайна', icon: Sparkles, hint: 'Без конкретної цілі' },
  { id: 'Edging', icon: Zap, hint: 'Контроль і витримка' },
  { id: 'Швидка', icon: Timer, hint: 'Коротка сесія' },
  { id: 'Чуттєва', icon: Heart, hint: 'Повільно й уважно' },
];
const tagOptions = ['Без екранів', 'Іграшка', 'Перед сном', 'Зняти стрес', 'Фантазія', 'У душі'];
const placeOptions = ['Ліжко', 'Душ', 'Диван', 'Крісло'];
const positionOptions = ['Лежачи', 'Сидячи', 'Стоячи', 'На боці'];
const locationOptions = ['Вдома', 'Готель', 'У подорожі', 'На природі'];
const emptyTaxonomy: Taxonomy = { categories: [], tags: [], places: [], positions: [], locations: [] };

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
  const [places, setPlaces] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [taxonomy, setTaxonomy] = useState<Taxonomy>(emptyTaxonomy);
  const [note, setNote] = useState('');
  const [details, setDetails] = useState(false);
  const [saved, setSaved] = useState(false);
  const [canUndoSave, setCanUndoSave] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<{ entry: Entry; index: number } | null>(null);
  const [showDemoNote, setShowDemoNote] = useState(true);
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('Усвідомлений час для себе');
  const [goalTarget, setGoalTarget] = useState(60);
  const [goals, setGoals] = useState<Goal[]>([
    { id: 'goal-1', title: 'Усвідомлений тиждень', metric: 'minutes', target: 60, period: 'week' },
    { id: 'goal-2', title: 'Тренування контролю', metric: 'sessions', target: 2, period: 'week' },
    { id: 'goal-3', title: 'Фантазія без екранів', metric: 'sessions', target: 4, period: 'month' },
  ]);

  useEffect(() => {
    const stored = localStorage.getItem('metrika-entries');
    setEntries(stored ? JSON.parse(stored) : demoEntries());
    setShowDemoNote(localStorage.getItem('metrika-demo-note') !== 'hidden');
    const storedGoals = localStorage.getItem('metrika-goals');
    if (storedGoals) setGoals(JSON.parse(storedGoals));
    const storedTaxonomy = localStorage.getItem('metrika-taxonomy');
    if (storedTaxonomy) setTaxonomy({...emptyTaxonomy,...JSON.parse(storedTaxonomy)});
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
    const activeDays = new Set(entries.map(item => new Date(item.createdAt).toDateString())); let streak=0; const cursor=new Date(); while(activeDays.has(cursor.toDateString())){streak++;cursor.setDate(cursor.getDate()-1)}
    return { avg: avg.toFixed(1), avgDuration, totalOrgasms, weekCount, streak, eveningShare: entries.length ? Math.round(evening.length / entries.length * 100) : 0 };
  }, [entries]);

  const saveEntry = useCallback((input?: { mood?: number; type?: string; note?: string; tags?: string[]; duration?: number; rating?: number; orgasms?: number }) => {
    const targetId = input ? null : editingId;
    if (targetId) {
      setEntries(current => { const next = current.map(item => item.id === targetId ? { ...item, mood, type, duration, rating, orgasms, note, tags, places, positions, locations } : item); localStorage.setItem('metrika-entries', JSON.stringify(next)); return next; });
      setEditingId(null); setDialogOpen(false); setCanUndoSave(false); setSaved(true); window.setTimeout(() => setSaved(false), 4000);
      return { ...entries.find(item => item.id === targetId)!, mood, type, duration, rating, orgasms, note, tags, places, positions, locations };
    }
    const record: Entry = { id: crypto.randomUUID(), mood: input?.mood ?? mood, type: input?.type ?? type, duration: input?.duration ?? duration, rating: input?.rating ?? rating, orgasms: input?.orgasms ?? orgasms, note: input?.note ?? note, tags: input?.tags ?? tags, places, positions, locations, time: new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(new Date()), createdAt: new Date().toISOString() };
    setEntries(current => { const next = [record, ...current.filter(item => !item.id.startsWith('demo-'))]; localStorage.setItem('metrika-entries', JSON.stringify(next)); return next; });
    setDialogOpen(false); setCanUndoSave(true); setSaved(true); setNote(''); setTags([]); setPlaces([]); setPositions([]); setLocations([]); setDetails(false); window.setTimeout(() => setSaved(false), 4000);
    return record;
  }, [duration, editingId, entries, locations, mood, note, orgasms, places, positions, rating, tags, type]);

  const openNewEntry = () => { setEditingId(null); setMood(8); setType('Звичайна'); setDuration(20); setRating(4); setOrgasms(1); setTags([]); setPlaces([]); setPositions([]); setLocations([]); setNote(''); setDetails(false); setDialogOpen(true); };
  const editEntry = (entry: Entry) => { setEditingId(entry.id); setMood(entry.mood); setType(entry.type); setDuration(entry.duration ?? 20); setRating(entry.rating ?? 4); setOrgasms(entry.orgasms ?? 1); setTags(entry.tags); setPlaces(entry.places??[]); setPositions(entry.positions??[]); setLocations(entry.locations??[]); setNote(entry.note); setDetails(Boolean(entry.note || entry.tags.length || entry.places?.length || entry.positions?.length || entry.locations?.length)); setDialogOpen(true); };
  const updateTaxonomy = (group: keyof Taxonomy, values: string[]) => { const next={...taxonomy,[group]:values}; setTaxonomy(next); localStorage.setItem('metrika-taxonomy',JSON.stringify(next)); };
  const duplicateEntry = (entry: Entry) => { const now = new Date(); const copy: Entry = { ...entry, id: crypto.randomUUID(), createdAt: now.toISOString(), time: new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(now) }; setEntries(current => { const next=[copy,...current.filter(item=>!item.id.startsWith('demo-'))]; localStorage.setItem('metrika-entries',JSON.stringify(next)); return next; }); setCanUndoSave(true); setSaved(true); window.setTimeout(()=>setSaved(false),4000); };
  const deleteEntry = (entry: Entry) => { setEntries(current => { const index=current.findIndex(item=>item.id===entry.id); const next=current.filter(item=>item.id!==entry.id); localStorage.setItem('metrika-entries',JSON.stringify(next)); setDeleted({entry,index}); return next; }); };
  const undoDelete = () => { if (!deleted) return; setEntries(current => { const next=[...current]; next.splice(Math.max(0,deleted.index),0,deleted.entry); localStorage.setItem('metrika-entries',JSON.stringify(next)); return next; }); setDeleted(null); };

  const finishTimer = () => {
    setTimerRunning(false); setTimerOpen(false); setEditingId(null); setDuration(Math.max(1, Math.round(timerSeconds / 60))); setDialogOpen(true);
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
  const addGoal = () => { const next = [...goals, { id: crypto.randomUUID(), title: goalTitle.trim() || 'Нова ціль', metric: 'minutes' as const, target: goalTarget, period: 'week' as const }]; setGoals(next); localStorage.setItem('metrika-goals', JSON.stringify(next)); setGoalOpen(false); };
  const currentDate = new Intl.DateTimeFormat('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="app-shell">
        <aside className="sidebar">
          <button className="brand-mark" onClick={() => nav('today')} aria-label="Metrika, на головну"><span className="brand-glyph">M</span><span className="brand-name">metrika</span></button>
          <nav className="nav-list" aria-label="Основна навігація">
            <button aria-label="Сьогодні" title="Сьогодні" className={`nav-item ${view === 'today' ? 'active' : ''}`} onClick={() => nav('today')}><LayoutDashboard /><span>Сьогодні</span></button>
            <button aria-label="Історія" title="Історія" className={`nav-item ${view === 'history' ? 'active' : ''}`} onClick={() => nav('history')}><History /><span>Історія</span></button>
            <button aria-label="Статистика" title="Статистика" className={`nav-item ${view === 'insights' ? 'active' : ''}`} onClick={() => nav('insights')}><BarChart3 /><span>Статистика</span></button>
            <button aria-label="Календар" title="Календар" className={`nav-item ${view === 'calendar' ? 'active' : ''}`} onClick={() => nav('calendar')}><CalendarDays /><span>Календар</span></button>
            <button aria-label="Цілі" title="Цілі" className={`nav-item ${view === 'goals' ? 'active' : ''}`} onClick={() => nav('goals')}><Target /><span>Цілі</span></button>
          </nav>
          <div className="privacy-card"><LockKeyhole /><div><strong>Приватний простір</strong><span>Записи лишаються на пристрої</span></div></div>
        </aside>

        <section className="workspace">
          <header className="topbar">
            <div><p className="eyebrow">{currentDate}</p><h1>{view === 'today' ? 'Твій простір' : view === 'history' ? 'Історія' : view === 'calendar' ? 'Календар' : view === 'goals' ? 'Твої цілі' : 'Статистика'} <span>✦</span></h1></div>
            <div className="top-actions"><button className="timer-pill" onClick={() => setTimerOpen(true)}><Timer /> Live-таймер</button><div className="streak-pill" title="Поточна серія активних днів"><Flame /> {stats.streak} {stats.streak===1?'день':'днів'}</div><button className="avatar" aria-label="Відкрити статистику профілю" onClick={() => nav('insights')}><CircleUserRound /></button></div>
          </header>

          {showDemoNote && entries.some(item => item.id.startsWith('demo-')) && <div className="demo-note"><Sparkles /><span><strong>Тут є демо-дані,</strong> щоб ти одразу побачив користь. Перший запис замінить їх твоїми.</span><button onClick={() => {setShowDemoNote(false);localStorage.setItem('metrika-demo-note','hidden')}} aria-label="Більше не показувати"><X /></button></div>}

          {view === 'today' && <TodayView entries={entries} stats={stats} ready={ready} openLog={openNewEntry} openTimer={() => setTimerOpen(true)} openInsights={() => nav('insights')} saved={saved} />}
          {view === 'history' && <HistoryView entries={entries} openLog={openNewEntry} onEdit={editEntry} onDuplicate={duplicateEntry} onDelete={deleteEntry} />}
          {view === 'calendar' && <CalendarView entries={entries} openLog={openNewEntry} />}
          {view === 'goals' && <GoalsView entries={entries} goals={goals} openGoal={() => setGoalOpen(true)} />}
          {view === 'insights' && <InsightsView entries={entries} stats={stats} />}
        </section>
      </div>

      {saved && <div className="save-toast" role="status"><span className="toast-check"><Check /></span><div><strong>Запис збережено</strong><small>Статистику вже оновлено</small></div>{canUndoSave && <button onClick={undoLast}><RotateCcw /> Скасувати</button>}</div>}
      {deleted && <div className="save-toast delete-toast" role="status"><span className="toast-check"><Trash2 /></span><div><strong>Запис видалено</strong><small>Його можна повернути</small></div><button onClick={undoDelete}><RotateCcw /> Скасувати</button></div>}

      <Dialog open={dialogOpen} onOpenChange={(open)=>{setDialogOpen(open);if(!open)setEditingId(null)}}>
        <DialogContent className="entry-dialog">
          <DialogHeader><span className="dialog-kicker">{editingId ? 'Редагування запису' : 'Нова соло-сесія · приватно'}</span><DialogTitle>{editingId ? 'Оновити деталі' : 'Як усе пройшло?'}</DialogTitle><DialogDescription>{editingId ? 'Зміни одразу оновлять статистику, календар і цілі.' : 'Короткий запис для чесної статистики. Деталі можна пропустити.'}</DialogDescription></DialogHeader>
          <div className="entry-form">
            <div className="field-block"><label>Основна категорія</label><div className="type-cards">{typeOptions.map(item => <button key={item.id} onClick={() => setType(item.id)} className={type === item.id ? 'selected' : ''}><item.icon /><strong>{item.id}</strong><small>{item.hint}</small>{type === item.id && <Check className="selected-check" />}</button>)}</div><AttributePicker compact label="Власні категорії" hint="одна категорія" icon={Sparkles} options={taxonomy.categories} custom={taxonomy.categories} selected={taxonomy.categories.includes(type)?[type]:[]} onToggle={value=>setType(value)} onAdd={value=>updateTaxonomy('categories',[...taxonomy.categories,value])} onRename={(oldValue,newValue)=>{updateTaxonomy('categories',taxonomy.categories.map(item=>item===oldValue?newValue:item));if(type===oldValue)setType(newValue)}} onRemove={value=>{updateTaxonomy('categories',taxonomy.categories.filter(item=>item!==value));if(type===value)setType('Звичайна')}} /></div>
            <div className="core-fields"><div className="field-block compact-field"><div className="mood-label"><label>Тривалість</label><strong>{duration}<small> хв</small></strong></div><div className="quick-values">{[5,15,25,45].map(value => <button key={value} className={duration === value ? 'selected' : ''} onClick={() => setDuration(value)}>{value}</button>)}</div><Slider value={[duration]} min={1} max={90} step={1} onValueChange={(value) => setDuration(Array.isArray(value) ? value[0] : value)} /></div><div className="field-block compact-field"><div className="mood-label"><label>Оргазми</label><strong>{orgasms}</strong></div><div className="stepper"><button onClick={() => setOrgasms(value => Math.max(0, value - 1))}>−</button><span>{orgasms}</span><button onClick={() => setOrgasms(value => Math.min(20, value + 1))}>+</button></div></div></div>
            <div className="field-block rating-block"><div className="mood-label"><label>Задоволення</label><strong>{rating}<small>/5</small></strong></div><div className="rating-stars">{[1,2,3,4,5].map(value => <button key={value} onClick={() => setRating(value)} aria-label={`${value} з 5`} className={value <= rating ? 'selected' : ''}><Star /></button>)}</div></div>
            <div className="field-block mood-block"><div className="mood-label"><div><label>Як ти почуваєшся після?</label><span>{mood <= 4 ? 'Не дуже' : mood <= 7 ? 'Нормально' : 'Чудово'}</span></div><strong>{mood}<small>/10</small></strong></div><Slider value={[mood]} min={1} max={10} step={1} onValueChange={(value) => setMood(Array.isArray(value) ? value[0] : value)} /><div className="scale-labels"><span>важко</span><span>супер</span></div></div>
            <button className="details-toggle" onClick={() => setDetails(value => !value)}>{details ? <ChevronLeft /> : <Plus />}{details ? 'Сховати деталі' : 'Додати контекст'}<span>необов’язково</span></button>
            {details && <div className="optional-details"><AttributePicker label="Теги" icon={Tag} options={[...tagOptions,...taxonomy.tags]} custom={taxonomy.tags} selected={tags} onToggle={value=>setTags(current=>current.includes(value)?current.filter(item=>item!==value):[...current,value])} onAdd={value=>updateTaxonomy('tags',[...taxonomy.tags,value])} onRename={(oldValue,newValue)=>{updateTaxonomy('tags',taxonomy.tags.map(item=>item===oldValue?newValue:item));setTags(current=>current.map(item=>item===oldValue?newValue:item))}} onRemove={value=>{updateTaxonomy('tags',taxonomy.tags.filter(item=>item!==value));setTags(current=>current.filter(item=>item!==value))}} /><AttributePicker label="Місця" icon={MapPin} hint="конкретне місце" options={[...placeOptions,...taxonomy.places]} custom={taxonomy.places} selected={places} onToggle={value=>setPlaces(current=>current.includes(value)?current.filter(item=>item!==value):[...current,value])} onAdd={value=>updateTaxonomy('places',[...taxonomy.places,value])} onRename={(a,b)=>{updateTaxonomy('places',taxonomy.places.map(x=>x===a?b:x));setPlaces(x=>x.map(v=>v===a?b:v))}} onRemove={value=>{updateTaxonomy('places',taxonomy.places.filter(x=>x!==value));setPlaces(x=>x.filter(v=>v!==value))}} /><AttributePicker label="Пози" icon={PersonStanding} options={[...positionOptions,...taxonomy.positions]} custom={taxonomy.positions} selected={positions} onToggle={value=>setPositions(current=>current.includes(value)?current.filter(item=>item!==value):[...current,value])} onAdd={value=>updateTaxonomy('positions',[...taxonomy.positions,value])} onRename={(a,b)=>{updateTaxonomy('positions',taxonomy.positions.map(x=>x===a?b:x));setPositions(x=>x.map(v=>v===a?b:v))}} onRemove={value=>{updateTaxonomy('positions',taxonomy.positions.filter(x=>x!==value));setPositions(x=>x.filter(v=>v!==value))}} /><AttributePicker label="Локації" icon={LocateFixed} hint="загальний контекст" options={[...locationOptions,...taxonomy.locations]} custom={taxonomy.locations} selected={locations} onToggle={value=>setLocations(current=>current.includes(value)?current.filter(item=>item!==value):[...current,value])} onAdd={value=>updateTaxonomy('locations',[...taxonomy.locations,value])} onRename={(a,b)=>{updateTaxonomy('locations',taxonomy.locations.map(x=>x===a?b:x));setLocations(x=>x.map(v=>v===a?b:v))}} onRemove={value=>{updateTaxonomy('locations',taxonomy.locations.filter(x=>x!==value));setLocations(x=>x.filter(v=>v!==value))}} /><div className="field-block"><label htmlFor="entry-note">Приватна нотатка</label><Textarea id="entry-note" value={note} onChange={event => setNote(event.target.value)} placeholder="Що варто запам’ятати?" maxLength={300} /></div></div>}
            <Button className="save-button" size="lg" onClick={() => saveEntry()}>{editingId ? <Check /> : <LockKeyhole />} {editingId ? 'Зберегти зміни' : 'Зберегти приватно'}</Button>
            <p className="keyboard-hint"><span>N</span> відкриває новий запис із будь-якого екрана</p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={timerOpen} onOpenChange={(open) => { setTimerOpen(open); if (!open) setTimerRunning(false); }}>
        <DialogContent className="timer-dialog" showCloseButton={false}><div className="timer-head"><span><span className="live-dot" /> Live session</span><button onClick={() => { setTimerOpen(false); setTimerRunning(false); }} aria-label="Закрити"><X /></button></div><div className="timer-face"><small>{timerRunning ? 'ФІКСУЄМО ЧАС…' : timerSeconds ? 'НА ПАУЗІ' : 'ГОТОВИЙ, КОЛИ ТИ ГОТОВИЙ'}</small><strong>{String(Math.floor(timerSeconds / 60)).padStart(2,'0')}:{String(timerSeconds % 60).padStart(2,'0')}</strong></div><div className="timer-actions"><button className="reset-timer" onClick={() => setTimerSeconds(0)} disabled={!timerSeconds}><RotateCcw /> Скинути</button><button className="play-timer" onClick={() => setTimerRunning(value => !value)}>{timerRunning ? <Pause /> : <Play />}</button><Button className="finish-timer" onClick={finishTimer} disabled={!timerSeconds}><Check /> Завершити й записати</Button></div><p><LockKeyhole /> Таймер працює лише на твоєму пристрої</p></DialogContent>
      </Dialog>
      <Dialog open={goalOpen} onOpenChange={setGoalOpen}><DialogContent className="goal-dialog"><DialogHeader><span className="dialog-kicker">Нова особиста ціль</span><DialogTitle>Що хочеш дослідити?</DialogTitle><DialogDescription>Ціль має підтримувати цікавість до себе, а не створювати тиск.</DialogDescription></DialogHeader><div className="entry-form"><div className="field-block"><label htmlFor="goal-title">Назва</label><input id="goal-title" className="goal-input" value={goalTitle} onChange={event => setGoalTitle(event.target.value)} /></div><div className="field-block"><div className="mood-label"><label>Хвилин цього тижня</label><strong>{goalTarget}<small> хв</small></strong></div><div className="quick-values">{[30,60,90,120].map(value => <button key={value} className={goalTarget === value ? 'selected' : ''} onClick={() => setGoalTarget(value)}>{value}</button>)}</div></div><Button className="save-button" onClick={addGoal}><Target /> Створити ціль</Button></div></DialogContent></Dialog>
    </main>
  );
}

function TodayView({ entries, stats, ready, openLog, openTimer, openInsights, saved }: { entries: Entry[]; stats: { avg: string; avgDuration: number; totalOrgasms: number; weekCount: number; streak: number; eveningShare: number }; ready: boolean; openLog: () => void; openTimer: () => void; openInsights: () => void; saved: boolean }) {
  const recent = entries.slice(0, 3);
  return <>
    <section className="hero-grid">
      <article className="quick-card"><div className="quick-copy"><span className="section-kicker">Твій сольний ритм</span><h2>{entries.length ? 'Час для себе — без зайвого шуму.' : 'Почни з першої сесії'}</h2><p>Запускай таймер під час сесії або додай готовий запис за кілька секунд.</p><div className="hero-actions"><Button className="log-button" size="lg" onClick={openLog}>{saved ? <Check /> : <Plus />}{saved ? 'Готово' : 'Записати сесію'}<span className="shortcut">N</span></Button><button className="hero-timer" onClick={openTimer}><Timer /> Live-таймер</button></div></div><div className="orb-wrap" aria-hidden="true"><div className="orb"><Heart /></div><span className="orbit-dot one" /><span className="orbit-dot two" /></div></article>
      <article className="pulse-card"><div className="card-head"><span className="icon-box"><Activity /></span><div><span>Пульс тижня</span><small>{stats.weekCount >= 3 ? 'Стабільний ритм' : 'Спокійний ритм'}</small></div></div><div className="week-dots">{[0,1,2,3,4,5,6].map((day) => <span key={day} className={day < Math.min(stats.weekCount, 7) ? 'filled' : ''}>{day < Math.min(stats.weekCount, 7) && <Check />}</span>)}</div><div className="pulse-bottom"><strong>{stats.weekCount}</strong><span>записи<br/>за 7 днів</span></div></article>
    </section>
    <section className="stat-grid four" aria-label="Коротка статистика"><article className="stat-card"><span>Соло-сесій</span><strong>{ready ? entries.length : '—'}</strong><small>зафіксовано приватно</small></article><article className="stat-card"><span>Середній час</span><strong>{stats.avgDuration}<em> хв</em></strong><small>на одну сесію</small></article><article className="stat-card"><span>Оргазмів</span><strong>{stats.totalOrgasms}</strong><small>загалом</small></article><article className="stat-card"><span>Задоволення</span><strong>{stats.avg}<em>/5</em></strong><small>середня оцінка</small></article></section>
    <section className="content-grid">
      <article className="timeline-card"><div className="title-row"><div><span className="section-kicker">Останнє</span><h3>Недавні сесії</h3></div><button onClick={() => document.querySelector<HTMLButtonElement>('.nav-item:nth-child(2)')?.click()}>Вся історія <ChevronRight /></button></div><div className="mini-timeline">{recent.map((item, index) => <div className="timeline-row" key={item.id}><span className={`timeline-dot tone-${Math.min(index + 1, 3)}`}><Heart /></span><div><strong>{item.type}</strong><small>{formatDay(item.createdAt)} · {item.time} · {item.duration ?? 20} хв{item.tags[0] ? ` · ${item.tags[0]}` : ''}</small></div><div className="mood-score">{item.rating ?? 4}<span>/5</span></div></div>)}</div></article>
      <article className="insight-card"><div className="insight-top"><div className="insight-icon"><Sparkles /></div><span>На основі {entries.length} записів</span></div><span className="section-kicker">Помічено для тебе</span><h3>{stats.eveningShare >= 50 ? 'Вечір — твій природний ритм' : 'Твій ритм досить гнучкий'}</h3><p>{stats.eveningShare >= 50 ? `${stats.eveningShare}% активностей трапляються після 20:00. Це патерн, не оцінка.` : 'Час активності змінюється — поки зарано робити сильні висновки.'}</p><button onClick={openInsights}>Розібрати патерн <ChevronRight /></button></article>
    </section>
  </>;
}

function AttributePicker({label,hint,icon:Icon,options,custom,selected,onToggle,onAdd,onRename,onRemove,compact=false}:{label:string;hint?:string;icon:LucideIcon;options:string[];custom:string[];selected:string[];onToggle:(value:string)=>void;onAdd:(value:string)=>void;onRename:(oldValue:string,newValue:string)=>void;onRemove:(value:string)=>void;compact?:boolean}){
  const [draft,setDraft]=useState(''); const [editing,setEditing]=useState<string|null>(null); const [editValue,setEditValue]=useState('');
  const unique=[...new Set(options)];
  const add=()=>{const value=draft.trim();if(!value||unique.some(item=>item.toLocaleLowerCase('uk-UA')===value.toLocaleLowerCase('uk-UA')))return;onAdd(value);setDraft('')};
  const rename=()=>{const value=editValue.trim();if(!editing||!value||unique.some(item=>item!==editing&&item.toLocaleLowerCase('uk-UA')===value.toLocaleLowerCase('uk-UA')))return;onRename(editing,value);setEditing(null);setEditValue('')};
  return <section className={`attribute-picker ${compact?'compact':''}`}><div className="attribute-head"><span><Icon/>{label}</span><small>{hint??'можна вибрати кілька'}</small></div><div className="attribute-options">{unique.map(item=><div className={`attribute-chip ${selected.includes(item)?'selected':''}`} key={item}><button type="button" onClick={()=>onToggle(item)} aria-pressed={selected.includes(item)}>{selected.includes(item)&&<Check/>}{item}</button>{custom.includes(item)&&<button type="button" className="edit-choice" aria-label={`Редагувати ${item}`} onClick={()=>{setEditing(item);setEditValue(item)}}><Edit3/></button>}</div>)}</div>{editing&&<div className="attribute-editor"><input autoFocus value={editValue} onChange={event=>setEditValue(event.target.value)} onKeyDown={event=>event.key==='Enter'&&rename()} aria-label={`Нова назва для ${editing}`}/><button type="button" onClick={rename}><Check/>Зберегти</button><button type="button" className="delete-choice" onClick={()=>{onRemove(editing);setEditing(null)}}><Trash2/>Видалити</button></div>}<div className="attribute-add"><input value={draft} onChange={event=>setDraft(event.target.value)} onKeyDown={event=>event.key==='Enter'&&add()} placeholder={`Додати: ${label.toLocaleLowerCase('uk-UA')}`} maxLength={28}/><button type="button" onClick={add} disabled={!draft.trim()}><Plus/>Додати</button></div></section>
}

function HistoryView({ entries, openLog, onEdit, onDuplicate, onDelete }: { entries: Entry[]; openLog: () => void; onEdit: (entry: Entry) => void; onDuplicate: (entry: Entry) => void; onDelete: (entry: Entry) => void }) {
  const [query,setQuery]=useState(''); const [filter,setFilter]=useState('Усі'); const [menu,setMenu]=useState<string|null>(null);
  const filters=[{label:'Усі',value:'Усі'},{label:'Edging',value:'Edging'},{label:'Швидкі',value:'Швидка'},{label:'Чуттєві',value:'Чуттєва'},{label:'Звичайні',value:'Звичайна'}];
  const normalizedQuery=query.trim().toLocaleLowerCase('uk-UA');
  const filtered=entries.filter(entry => (filter==='Усі'||entry.type===filter) && (!normalizedQuery||`${entry.type} ${entry.note} ${entry.tags.join(' ')}`.toLocaleLowerCase('uk-UA').includes(normalizedQuery)));
  return <section className="history-surface"><div className="history-toolbar"><div className="search-box"><Search /><input value={query} onChange={event=>setQuery(event.target.value)} aria-label="Пошук в історії" placeholder="Пошук у нотатках і тегах" /></div><div className="history-filters">{filters.map(item => <button type="button" onClick={()=>{setFilter(item.value);setMenu(null)}} aria-pressed={filter===item.value} className={filter===item.value?'active':''} key={item.value}>{item.label}<span>{item.value==='Усі'?entries.length:entries.filter(entry=>entry.type===item.value).length}</span></button>)}</div><Button onClick={openLog}><Plus /> Нова сесія</Button></div><div className="history-result"><span>{filter==='Усі'?'Усі записи':filters.find(item=>item.value===filter)?.label}</span><strong>{filtered.length} {filtered.length===1?'запис':'записів'}</strong></div><div className="history-list">{filtered.map((entry, index) => <article className="history-entry" key={entry.id}><div className="date-tile"><strong>{new Date(entry.createdAt).getDate()}</strong><span>{new Intl.DateTimeFormat('uk-UA', { month: 'short' }).format(new Date(entry.createdAt))}</span></div><div className="history-icon"><Heart /></div><button className="history-copy history-open" onClick={()=>onEdit(entry)}><strong>{entry.type} <em className="duration-chip">{entry.duration ?? 20} хв</em></strong><span><Clock3 /> {entry.time}{entry.tags.map(tag => <em key={tag}>#{tag.toLowerCase().replaceAll(' ','_')}</em>)}</span>{entry.note && <p>«{entry.note}»</p>}</button><div className="session-meta"><span><Zap /> {entry.orgasms ?? 1}</span><span><Star /> {entry.rating ?? 4}</span></div><button className="more-button" onClick={()=>setMenu(menu===entry.id?null:entry.id)} aria-label="Більше дій"><MoreHorizontal /></button>{menu===entry.id&&<div className="entry-actions"><button onClick={()=>{onEdit(entry);setMenu(null)}}><Edit3/>Редагувати</button><button onClick={()=>{onDuplicate(entry);setMenu(null)}}><Copy/>Дублювати</button><button className="danger" onClick={()=>{onDelete(entry);setMenu(null)}}><Trash2/>Видалити</button></div>}{index === 0 && <span className="latest-label">остання</span>}</article>)}{!filtered.length&&<div className="history-empty"><Search/><strong>Нічого не знайдено</strong><span>Спробуй змінити пошук або фільтр.</span></div>}</div></section>;
}

function CalendarView({ entries, openLog }: { entries: Entry[]; openLog: () => void }) {
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const month = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = month.getFullYear(); const monthIndex = month.getMonth();
  const daysCount = new Date(year, monthIndex + 1, 0).getDate();
  const leading = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const dayEntries = (day: number) => entries.filter(item => { const date = new Date(item.createdAt); return date.getFullYear() === year && date.getMonth() === monthIndex && date.getDate() === day; });
  const selectedEntries = dayEntries(selectedDay);
  return <section className="calendar-layout"><article className="calendar-card"><div className="calendar-head"><button onClick={() => { setMonthOffset(value => value - 1); setSelectedDay(1); }} aria-label="Попередній місяць"><ChevronLeft /></button><div><span className="section-kicker">{year}</span><h2>{new Intl.DateTimeFormat('uk-UA', { month: 'long' }).format(month)}</h2></div><button onClick={() => { setMonthOffset(value => value + 1); setSelectedDay(1); }} aria-label="Наступний місяць"><ChevronRight /></button></div><div className="weekdays">{['Пн','Вт','Ср','Чт','Пт','Сб','Нд'].map(day => <span key={day}>{day}</span>)}</div><div className="month-grid">{Array.from({length:leading},(_,index) => <span className="empty-day" key={`empty-${index}`} />)}{Array.from({length:daysCount},(_,index) => { const day = index + 1; const sessions = dayEntries(day); const isToday = day === today.getDate() && monthIndex === today.getMonth() && year === today.getFullYear(); return <button key={day} className={`${selectedDay === day ? 'selected' : ''} ${isToday ? 'today' : ''} ${sessions.length ? 'has-session' : ''}`} onClick={() => setSelectedDay(day)}><span>{day}</span>{sessions.length > 0 && <div className="session-marks">{sessions.slice(0,3).map(item => <i key={item.id} className={`mark-${item.type.toLowerCase()}`} />)}</div>}</button>;})}</div><div className="calendar-legend"><span><i className="mark-edging" /> Edging</span><span><i className="mark-швидка" /> Швидка</span><span><i className="mark-чуттєва" /> Чуттєва</span><span><i className="mark-звичайна" /> Звичайна</span></div></article><aside className="day-panel"><div><span className="section-kicker">Обраний день</span><h3>{selectedDay} {new Intl.DateTimeFormat('uk-UA',{month:'long'}).format(month)}</h3></div>{selectedEntries.length ? <div className="day-sessions">{selectedEntries.map(item => <article key={item.id}><div className="history-icon"><Heart /></div><div><strong>{item.type}</strong><span>{item.time} · {item.duration ?? 20} хв</span></div><div className="mood-score">{item.rating ?? 4}<span>/5</span></div></article>)}</div> : <div className="empty-day-state"><CalendarDays /><strong>Сесій не було</strong><span>Порожній день — це теж частина твого природного ритму.</span></div>}<Button onClick={openLog}><Plus /> Додати сесію цього дня</Button></aside></section>;
}

function GoalsView({ entries, goals, openGoal }: { entries: Entry[]; goals: Goal[]; openGoal: () => void }) {
  const weekEntries = entries.filter(item => Date.now() - new Date(item.createdAt).getTime() < 7 * 86400000);
  const monthEntries = entries.filter(item => Date.now() - new Date(item.createdAt).getTime() < 30 * 86400000);
  return <><section className="goals-lead"><div><span className="section-kicker">Без гонитви за цифрами</span><h2>Цілі, які підтримують<br/>твій ритм.</h2><p>Відстежуй цікаві для себе патерни. Жодна ціль не є обов’язковою.</p></div><Button onClick={openGoal}><Plus /> Створити ціль</Button></section><section className="goals-grid">{goals.map((goal,index) => { const source = goal.period === 'week' ? weekEntries : monthEntries; const value = goal.metric === 'minutes' ? source.reduce((sum,item) => sum + (item.duration ?? 20),0) : source.length; const progress = Math.min(100,Math.round(value / goal.target * 100)); return <article className={`goal-card-large ${progress >= 100 ? 'complete' : ''}`} key={goal.id}><div className="goal-card-top"><span className={`goal-symbol tone-${index % 3}`}><Target /></span><div><span>{goal.period === 'week' ? 'Тиждень' : 'Місяць'}</span><h3>{goal.title}</h3></div></div><div className="goal-big-number"><strong>{value}</strong><span>/ {goal.target} {goal.metric === 'minutes' ? 'хв' : 'сесій'}</span></div><div className="goal-line"><span style={{width:`${progress}%`}} /></div><div className="goal-card-bottom"><span>{progress >= 100 ? <><Check /> Досягнуто</> : `${progress}% виконано`}</span><span>{goal.period === 'week' ? '2 дні залишилось' : '26 днів залишилось'}</span></div></article>;})}<button className="new-goal-card" onClick={openGoal}><span><Plus /></span><strong>Нова особиста ціль</strong><small>Створи власний орієнтир</small></button></section></>;
}

function InsightsView({ entries, stats }: { entries: Entry[]; stats: { avg: string; avgDuration: number; totalOrgasms: number; weekCount: number; eveningShare: number } }) {
  const [range, setRange] = useState(30);
  const scoped = entries.filter(item => Date.now() - new Date(item.createdAt).getTime() <= range * 86400000);
  const totalMinutes = scoped.reduce((sum,item) => sum + (item.duration ?? 20),0);
  const avgDuration = scoped.length ? Math.round(totalMinutes / scoped.length) : 0;
  const avgRating = scoped.length ? (scoped.reduce((sum,item) => sum + (item.rating ?? 4),0) / scoped.length).toFixed(1) : '0.0';
  const totalOrgasms = scoped.reduce((sum,item) => sum + (item.orgasms ?? 1),0);
  const series = Array.from({length:Math.min(range,14)},(_,index) => { const date = new Date(); date.setDate(date.getDate() - (Math.min(range,14) - 1 - index)); const matches = scoped.filter(item => new Date(item.createdAt).toDateString() === date.toDateString()); return { day: new Intl.DateTimeFormat('uk-UA',{day:'numeric',month:'short'}).format(date), sessions: matches.length, minutes: matches.reduce((sum,item) => sum + (item.duration ?? 20),0) }; });
  const categoryNames = ['Звичайна','Edging','Швидка','Чуттєва'];
  const categoryColors = ['#91a83b','#8f5bd7','#f2ad31','#ff6746'];
  const categoryData = categoryNames.map((name,index) => ({ name, value: scoped.filter(item => item.type === name).length, color: categoryColors[index] })).filter(item => item.value);
  const timeData = [{name:'Ніч',value:0},{name:'Ранок',value:0},{name:'День',value:0},{name:'Вечір',value:0}];
  scoped.forEach(item => { const hour=Number(item.time.split(':')[0]); const index=hour<6?0:hour<12?1:hour<18?2:3; timeData[index].value++; });
  const ratingData = [5,4,3,2,1].map(rating => ({rating:`${rating} ★`,value:scoped.filter(item => (item.rating ?? 4) === rating).length}));
  const radarData = [{axis:'Частота',value:Math.min(100,scoped.length*14)},{axis:'Тривалість',value:Math.min(100,avgDuration*2.2)},{axis:'Оцінка',value:Number(avgRating)*20},{axis:'Оргазми',value:Math.min(100,totalOrgasms*14)},{axis:'Без екранів',value:Math.min(100,scoped.filter(item=>item.tags.includes('Без екранів')).length*25)}];
  const heatDays = Array.from({length:30},(_,index) => { const date=new Date(); date.setDate(date.getDate()-(29-index)); return {date, count:entries.filter(item=>new Date(item.createdAt).toDateString()===date.toDateString()).length}; });
  const activeDays = heatDays.filter(item=>item.count).length;
  const screenFreeCount = scoped.filter(item=>item.tags.includes('Без екранів')).length;
  const edgingCount = scoped.filter(item=>item.type==='Edging').length;
  const best = [...scoped].sort((a,b)=>(b.rating??4)-(a.rating??4))[0];
  return <>
    <section className="stats-hero"><div><span className="section-kicker">Твій сольний профіль</span><h2>Детальна статистика</h2><p>Патерни, які допомагають краще розуміти себе — без оцінок і моралізаторства.</p></div><div className="range-switch" aria-label="Період статистики">{[7,30,90].map(value=><button key={value} onClick={()=>setRange(value)} className={range===value?'active':''}>{value} днів</button>)}</div></section>
    <section className="stats-kpis"><article><span><Activity/>Сесії</span><strong>{scoped.length}</strong><small>за обраний період</small></article><article><span><Clock3/>Усього часу</span><strong>{Math.floor(totalMinutes/60)}<em>г</em> {totalMinutes%60}<em>хв</em></strong><small>сер. {avgDuration} хв / сесія</small></article><article><span><Zap/>Оргазми</span><strong>{totalOrgasms}</strong><small>{scoped.length ? (totalOrgasms/scoped.length).toFixed(1) : 0} на сесію</small></article><article><span><Star/>Задоволення</span><strong>{avgRating}<em>/5</em></strong><small>середня оцінка</small></article><article><span><Flame/>Серія</span><strong>2<em> дні</em></strong><small>найкраща — 4 дні</small></article></section>
    <section className="stats-grid-main"><article className="analytics-card trend-card"><div className="analytics-head"><div><span className="section-kicker">Динаміка</span><h3>Сесії та тривалість</h3></div><div className="chart-key"><span><i className="lime"/>хвилини</span><span><i className="coral"/>сесії</span></div></div><ChartContainer config={{minutes:{label:'Хвилини',color:'#9db52e'},sessions:{label:'Сесії',color:'#ff6746'}}} className="trend-chart"><AreaChart data={series} margin={{left:-22,right:8,top:16,bottom:0}}><defs><linearGradient id="minutesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#9db52e" stopOpacity={.28}/><stop offset="95%" stopColor="#9db52e" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#e7e7df"/><XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={9}/><YAxis axisLine={false} tickLine={false} fontSize={9}/><ChartTooltip content={<ChartTooltipContent/>}/><Area type="monotone" dataKey="minutes" stroke="#82961e" strokeWidth={2.5} fill="url(#minutesFill)"/><Bar dataKey="sessions" fill="#ff6746" radius={[5,5,0,0]} barSize={9}/></AreaChart></ChartContainer></article>
    <article className="analytics-card rhythm-card"><div className="rhythm-heading"><div><span className="section-kicker"><CalendarDays/>Ритм активності · 30 днів</span><h3>Твоя жива послідовність</h3></div><div className="rhythm-summary"><span className="streak-count"><Flame/>2 дні поспіль</span><strong>{activeDays}<small> / 30 днів</small></strong></div></div><div className="rhythm-strip">{heatDays.map((item,index)=><span key={index} className={item.count?`level-${Math.min(item.count,3)}`:''} title={`${item.date.toLocaleDateString('uk-UA')}: ${item.count} сес.`}><b>{item.date.getDate()}</b></span>)}</div><div className="rhythm-goals"><div><span><Target/>Усвідомлений час</span><strong>{Math.min(totalMinutes,60)}<small> / 60 хв</small></strong><i><b style={{width:`${Math.min(100,totalMinutes/60*100)}%`}}/></i></div><div><span><Zap/>Практика контролю</span><strong>{edgingCount}<small> / 2 сесії</small></strong><i><b style={{width:`${Math.min(100,edgingCount/2*100)}%`}}/></i></div><div><span><ShieldCheck/>Без екранів</span><strong>{screenFreeCount}<small> / 3 сесії</small></strong><i><b style={{width:`${Math.min(100,screenFreeCount/3*100)}%`}}/></i></div></div></article></section>
    <section className="stats-grid-secondary"><article className="analytics-card"><div className="analytics-head"><div><span className="section-kicker">Категорії</span><h3>Твій стиль</h3></div></div><div className="donut-wrap"><ChartContainer config={{value:{label:'Сесії',color:'#ff6746'}}} className="donut-chart"><PieChart><ChartTooltip content={<ChartTooltipContent hideLabel/>}/><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={76} paddingAngle={4}>{categoryData.map(item=><Cell key={item.name} fill={item.color}/>)}</Pie></PieChart></ChartContainer><div className="donut-center"><strong>{scoped.length}</strong><span>сесій</span></div><div className="donut-legend">{categoryData.map(item=><div key={item.name}><span><i style={{background:item.color}}/>{item.name}</span><strong>{Math.round(item.value/Math.max(scoped.length,1)*100)}%</strong></div>)}</div></div></article>
    <article className="analytics-card"><div className="analytics-head"><div><span className="section-kicker">Коли</span><h3>Час доби</h3></div></div><div className="h-bars">{timeData.map(item=><div key={item.name}><span>{item.name}</span><div><i style={{width:`${item.value/Math.max(...timeData.map(x=>x.value),1)*100}%`}}/></div><strong>{item.value}</strong></div>)}</div><div className="micro-insight"><Sparkles/><span><strong>{timeData.sort((a,b)=>b.value-a.value)[0].name} — твій головний період</strong>Саме тоді трапляється найбільше сесій.</span></div></article>
    <article className="analytics-card"><div className="analytics-head"><div><span className="section-kicker">Якість</span><h3>Розподіл оцінок</h3></div><strong className="avg-badge">Ø {avgRating}</strong></div><div className="rating-bars">{ratingData.map(item=><div key={item.rating}><span>{item.rating}</span><div><i style={{width:`${item.value/Math.max(...ratingData.map(x=>x.value),1)*100}%`}}/></div><strong>{item.value}</strong></div>)}</div></article>
    <article className="analytics-card radar-card"><div className="analytics-head"><div><span className="section-kicker">Баланс</span><h3>Профіль звички</h3></div><span className="trend-badge">5 вимірів</span></div><ChartContainer config={{value:{label:'Баланс',color:'#ff6746'}}} className="radar-chart"><RadarChart data={radarData} outerRadius="68%"><PolarGrid stroke="#dfe0d8"/><PolarAngleAxis dataKey="axis" tick={{fontSize:9,fill:'#6f7773'}}/><Radar dataKey="value" stroke="#ff6746" fill="#ff6746" fillOpacity={.2} strokeWidth={2}/></RadarChart></ChartContainer></article></section>
    <section className="records-row"><article><span className="record-icon"><Clock3/></span><div><small>Найдовша сесія</small><strong>{Math.max(...scoped.map(item=>item.duration??20),0)} хв</strong></div></article><article><span className="record-icon coral"><Star/></span><div><small>Найкраща оцінка</small><strong>{best?.rating??0}/5 · {best?.type??'—'}</strong></div></article><article><span className="record-icon lime"><Zap/></span><div><small>Найчастіший тег</small><strong>{scoped.flatMap(item=>item.tags)[0]??'Ще немає'}</strong></div></article></section>
    <p className="insight-footnote"><ShieldCheck/> Усі розрахунки виконуються локально. Статистика не є медичною рекомендацією.</p>
  </>;
}
