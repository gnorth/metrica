'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bell,
  BellRing,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Heart,
  History,
  LayoutDashboard,
  LockKeyhole,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Archive,
  Copy,
  Download,
  Edit3,
  FileKey2,
  FolderCog,
  LocateFixed,
  MapPin,
  Merge,
  PersonStanding,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
  Target,
  Timer,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from 'recharts';

type View =
  | 'today'
  | 'history'
  | 'goals'
  | 'insights'
  | 'settings'
  | 'session'
  | 'taxonomy'
  | 'reminders'
  | 'data'
  | 'timer';
type StatFocus = 'sessions' | 'duration' | 'orgasms' | 'rating';
type Entry = {
  id: string;
  type: string;
  mood: number;
  moodBefore?: number;
  duration: number;
  rating: number;
  orgasms: number;
  time: string;
  note: string;
  tags: string[];
  places?: string[];
  positions?: string[];
  locations?: string[];
  moods?: string[];
  createdAt: string;
};
type GoalMetric = 'sessions' | 'minutes' | 'rating';
type GoalPeriod = 'day' | 'week' | 'fortnight' | 'threeWeeks' | 'month';
type GoalIntent =
  | 'regularity'
  | 'limit'
  | 'time'
  | 'screenFree'
  | 'quality'
  | 'control';
type Goal = {
  id: string;
  title: string;
  metric: GoalMetric;
  target: number;
  period: GoalPeriod;
  rule: 'atLeast' | 'atMost';
  status: 'active' | 'paused' | 'completed';
  category?: string;
  tag?: string;
  createdAt: string;
};
type Taxonomy = {
  categories: string[];
  tags: string[];
  places: string[];
  positions: string[];
  locations: string[];
  moods: string[];
};
type TaxonomyGroup = keyof Taxonomy;
type PrivacyMode = 'full' | 'neutral' | 'hidden';
type ReminderSettings = {
  privacy: PrivacyMode;
  gentle: { enabled: boolean; time: string; days: number[] };
  inactivity: { enabled: boolean; days: number; time: string };
  highActivity: { enabled: boolean; count: number };
  goals: { enabled: boolean; time: string; day: number };
};
type CustomReminder = {
  id: string;
  title: string;
  time: string;
  days: number[];
  date?: string;
  endsAt?: string;
  enabled: boolean;
};
type NativeReminder = {
  id: string;
  title: string;
  body: string;
  publicBody: string;
  time?: string;
  days?: number[];
  triggerAt?: number;
  endsAt?: number;
  enabled: boolean;
};
declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: unknown,
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
  }
  interface Window {
    AndroidNotifications?: {
      isAvailable: () => boolean;
      hasPermission: () => boolean;
      requestPermission: () => void;
      sync: (payload: string) => void;
      cancelAll: () => void;
    };
  }
}

const typeOptions = [
  { id: 'Звичайна', icon: Sparkles, hint: 'Без конкретної цілі' },
  { id: 'Edging', icon: Zap, hint: 'Контроль і витримка' },
  { id: 'Швидка', icon: Timer, hint: 'Коротка сесія' },
  { id: 'Чуттєва', icon: Heart, hint: 'Повільно й уважно' },
];
const defaultTagOptions = [
  'Без екранів',
  'Іграшка',
  'Перед сном',
  'Зняти стрес',
  'Фантазія',
  'У душі',
];
const defaultPlaceOptions = ['Ліжко', 'Душ', 'Диван', 'Крісло'];
const defaultPositionOptions = ['Лежачи', 'Сидячи', 'Стоячи', 'На боці'];
const defaultLocationOptions = ['Вдома', 'Готель', 'У подорожі', 'На природі'];
const defaultMoodOptions = ['🔥 Збуджений', '😌 Розслаблений', '🤯 Стрес / напруга', '🥱 Від нудьги', '⚡ Бадьорий'];
const emptyTaxonomy: Taxonomy = {
  categories: [],
  tags: [],
  places: [],
  positions: [],
  locations: [],
  moods: [],
};
const baseTaxonomy: Taxonomy = {
  categories: typeOptions.map((item) => item.id),
  tags: defaultTagOptions,
  places: defaultPlaceOptions,
  positions: defaultPositionOptions,
  locations: defaultLocationOptions,
  moods: defaultMoodOptions,
};
const defaultReminderSettings: ReminderSettings = {
  privacy: 'neutral',
  gentle: { enabled: false, time: '20:00', days: [5, 6] },
  inactivity: { enabled: false, days: 6, time: '20:00' },
  highActivity: { enabled: false, count: 3 },
  goals: { enabled: false, time: '19:00', day: 1 },
};
const normalizeGoal = (
  goal: Partial<Goal> &
    Pick<Goal, 'id' | 'title' | 'metric' | 'target' | 'period'>,
): Goal => ({
  rule: 'atLeast',
  status: 'active',
  createdAt: new Date().toISOString(),
  ...goal,
});

function demoEntries(): Entry[] {
  const now = Date.now();
  return [
    {
      id: 'demo-1',
      type: 'Швидка',
      moodBefore: 6,
      mood: 8,
      duration: 12,
      rating: 4,
      orgasms: 1,
      time: '21:40',
      note: 'Швидкий заряд бадьорості.',
      tags: ['Перед сном'],
      moods: ['⚡ Бадьорий'],
      createdAt: new Date(now - 86400000).toISOString(),
    },
    {
      id: 'demo-2',
      type: 'Edging',
      moodBefore: 5,
      mood: 9,
      duration: 35,
      rating: 5,
      orgasms: 1,
      time: '22:15',
      note: 'Фокус на витримці та контролі.',
      tags: ['Зняти стрес'],
      moods: ['😌 Розслаблений'],
      createdAt: new Date(now - 3 * 86400000).toISOString(),
    },
    {
      id: 'demo-3',
      type: 'Звичайна',
      moodBefore: 7,
      mood: 7,
      duration: 22,
      rating: 4,
      orgasms: 1,
      time: '19:20',
      note: '',
      tags: ['Фантазія'],
      moods: ['🔥 Збуджений'],
      createdAt: new Date(now - 5 * 86400000).toISOString(),
    },
    {
      id: 'demo-4',
      type: 'Чуттєва',
      moodBefore: 6,
      mood: 8,
      duration: 28,
      rating: 5,
      orgasms: 2,
      time: '23:05',
      note: '',
      tags: ['Без екранів'],
      moods: ['😌 Розслаблений'],
      createdAt: new Date(now - 7 * 86400000).toISOString(),
    },
    {
      id: 'demo-5', type: 'Звичайна', moodBefore: 4, mood: 7, duration: 18,
      rating: 3, orgasms: 1, time: '07:35', note: 'Спокійний початок дня.',
      tags: ['Без екранів'], places: ['Ліжко'], positions: ['Лежачи'], locations: ['Вдома'], moods: ['⚡ Бадьорий'],
      createdAt: new Date(now - 2 * 86400000).toISOString(),
    },
    {
      id: 'demo-6', type: 'Чуттєва', moodBefore: 5, mood: 9, duration: 42,
      rating: 5, orgasms: 2, time: '20:10', note: 'Без поспіху, з увагою до відчуттів.',
      tags: ['Без екранів', 'Перед сном'], places: ['Душ'], positions: ['Стоячи'], locations: ['Вдома'], moods: ['😌 Розслаблений'],
      createdAt: new Date(now - 4 * 86400000).toISOString(),
    },
    {
      id: 'demo-7', type: 'Швидка', moodBefore: 7, mood: 8, duration: 7,
      rating: 4, orgasms: 1, time: '13:05', note: '', tags: ['Зняти стрес'],
      places: ['Крісло'], positions: ['Сидячи'], locations: ['Вдома'], moods: ['🤯 Стрес / напруга'],
      createdAt: new Date(now - 6 * 86400000).toISOString(),
    },
    {
      id: 'demo-8', type: 'Edging', moodBefore: 6, mood: 8, duration: 51,
      rating: 4, orgasms: 1, time: '22:30', note: 'Довша практика контролю.',
      tags: ['Фантазія'], places: ['Ліжко'], positions: ['На боці'], locations: ['Вдома'], moods: ['🔥 Збуджений'],
      createdAt: new Date(now - 10 * 86400000).toISOString(),
    },
    {
      id: 'demo-9', type: 'Звичайна', moodBefore: 3, mood: 7, duration: 25,
      rating: 4, orgasms: 1, time: '18:45', note: 'Допомогло перемкнутися після насиченого дня.',
      tags: ['Зняти стрес'], places: ['Диван'], positions: ['Лежачи'], locations: ['Вдома'], moods: ['🤯 Стрес / напруга'],
      createdAt: new Date(now - 14 * 86400000).toISOString(),
    },
    {
      id: 'demo-10', type: 'Чуттєва', moodBefore: 8, mood: 9, duration: 33,
      rating: 5, orgasms: 1, time: '23:20', note: '', tags: ['Іграшка', 'Перед сном'],
      places: ['Ліжко'], positions: ['На боці'], locations: ['Готель'], moods: ['😌 Розслаблений'],
      createdAt: new Date(now - 18 * 86400000).toISOString(),
    },
    {
      id: 'demo-11', type: 'Швидка', moodBefore: 5, mood: 6, duration: 9,
      rating: 3, orgasms: 1, time: '11:50', note: '', tags: ['У душі'],
      places: ['Душ'], positions: ['Стоячи'], locations: ['Вдома'], moods: ['🥱 Від нудьги'],
      createdAt: new Date(now - 22 * 86400000).toISOString(),
    },
    {
      id: 'demo-12', type: 'Edging', moodBefore: 4, mood: 9, duration: 46,
      rating: 5, orgasms: 2, time: '21:15', note: 'Хороший баланс темпу та контролю.',
      tags: ['Без екранів', 'Фантазія'], places: ['Ліжко'], positions: ['Сидячи'], locations: ['Вдома'], moods: ['🔥 Збуджений'],
      createdAt: new Date(now - 27 * 86400000).toISOString(),
    },
  ];
}

const formatDay = (iso: string) =>
  new Intl.DateTimeFormat('uk-UA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
const pluralUk = (
  count: number,
  one: string,
  few: string,
  many: string,
) => {
  const lastTwo = Math.abs(count) % 100;
  const last = lastTwo % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
};
const bytesToBase64 = (bytes: Uint8Array) =>
  btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
const base64ToBytes = (value: string) =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
async function encryptBackup(value: unknown, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return JSON.stringify({
    format: 'metrika-backup',
    version: 1,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(encrypted)),
  });
}
async function decryptBackup(value: string, password: string) {
  const pack = JSON.parse(value);
  if (pack.format !== 'metrika-backup') throw new Error('Невідомий формат');
  const salt = base64ToBytes(pack.salt),
    iv = base64ToBytes(pack.iv);
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    base64ToBytes(pack.data),
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}
const downloadBlob = (content: string, name: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};

export default function Home() {
  const [view, setView] = useState<View>('today');
  const [previousView, setPreviousView] = useState<View>('today');
  const [statFocus, setStatFocus] = useState<StatFocus | null>(null);
  const [categoryFocus, setCategoryFocus] = useState<string | null>(null);
  const [insightsMode, setInsightsMode] = useState<'analytics' | 'calendar'>('analytics');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ready, setReady] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [mood, setMood] = useState(8);
  const [moodBefore, setMoodBefore] = useState(6);
  const [type, setType] = useState('Звичайна');
  const [duration, setDuration] = useState(20);
  const [rating, setRating] = useState(4);
  const [orgasms, setOrgasms] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const [places, setPlaces] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [taxonomy, setTaxonomy] = useState<Taxonomy>(emptyTaxonomy);
  const [archivedTaxonomy, setArchivedTaxonomy] =
    useState<Taxonomy>(emptyTaxonomy);
  const [note, setNote] = useState('');
  const [details, setDetails] = useState(false);
  const [saved, setSaved] = useState(false);
  const [canUndoSave, setCanUndoSave] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<{
    entry: Entry;
    index: number;
  } | null>(null);
  const [deletedGoal, setDeletedGoal] = useState<{
    goal: Goal;
    index: number;
  } | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [showDemoNote, setShowDemoNote] = useState(true);
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalEditingId, setGoalEditingId] = useState<string | null>(null);
  const [goalAdvanced, setGoalAdvanced] = useState(false);
  const [goalTitle, setGoalTitle] = useState('Усвідомлений час для себе');
  const [goalTarget, setGoalTarget] = useState(60);
  const [goalMetric, setGoalMetric] = useState<GoalMetric>('minutes');
  const [goalPeriod, setGoalPeriod] = useState<GoalPeriod>('week');
  const [goalRule, setGoalRule] = useState<'atLeast' | 'atMost'>('atLeast');
  const [goalIntent, setGoalIntent] = useState<GoalIntent>('regularity');
  const [goalCategory, setGoalCategory] = useState('');
  const [goalTag, setGoalTag] = useState('');
  const [goals, setGoals] = useState<Goal[]>([
    normalizeGoal({
      id: 'goal-1',
      title: 'Усвідомлений тиждень',
      metric: 'minutes',
      target: 60,
      period: 'week',
    }),
    normalizeGoal({
      id: 'goal-2',
      title: 'Тренування контролю',
      metric: 'sessions',
      target: 2,
      period: 'week',
      category: 'Edging',
    }),
    normalizeGoal({
      id: 'goal-3',
      title: 'Фантазія без екранів',
      metric: 'sessions',
      target: 4,
      period: 'month',
      tag: 'Без екранів',
    }),
  ]);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(
    defaultReminderSettings,
  );
  const [customReminders, setCustomReminders] = useState<CustomReminder[]>([]);
  const [notificationPermission, setNotificationPermission] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('metrika-entries');
    const demos = demoEntries();
    if (stored) {
      const current = JSON.parse(stored) as Entry[];
      const shouldExpandDemo = current.some((entry) => entry.id.startsWith('demo-')) &&
        localStorage.getItem('metrika-demo-set') !== 'expanded-v2-moods';
      const next = shouldExpandDemo
        ? [
            ...current.map((entry) => {
              const demo = demos.find((item) => item.id === entry.id);
              return demo ? { ...demo, ...entry, moods: entry.moods ?? demo.moods } : entry;
            }),
            ...demos.filter((demo) => !current.some((entry) => entry.id === demo.id)),
          ]
        : current;
      if (shouldExpandDemo) {
        localStorage.setItem('metrika-entries', JSON.stringify(next));
        localStorage.setItem('metrika-demo-set', 'expanded-v2-moods');
      }
      setEntries(next);
    } else {
      setEntries(demos);
      localStorage.setItem('metrika-demo-set', 'expanded-v2-moods');
    }
    setShowDemoNote(localStorage.getItem('metrika-demo-note') !== 'hidden');
    const storedGoals = localStorage.getItem('metrika-goals');
    if (storedGoals) setGoals(JSON.parse(storedGoals).map(normalizeGoal));
    const storedTaxonomy = localStorage.getItem('metrika-taxonomy');
    if (storedTaxonomy)
      setTaxonomy({ ...emptyTaxonomy, ...JSON.parse(storedTaxonomy) });
    const storedArchived = localStorage.getItem('metrika-taxonomy-archived');
    if (storedArchived)
      setArchivedTaxonomy({ ...emptyTaxonomy, ...JSON.parse(storedArchived) });
    const storedReminderSettings = localStorage.getItem('metrika-reminder-settings');
    if (storedReminderSettings)
      setReminderSettings({
        ...defaultReminderSettings,
        ...JSON.parse(storedReminderSettings),
      });
    const storedCustomReminders = localStorage.getItem('metrika-custom-reminders');
    if (storedCustomReminders) setCustomReminders(JSON.parse(storedCustomReminders));
    setNotificationPermission(Boolean(window.AndroidNotifications?.hasPermission()));
    setReady(true);
  }, []);

  useEffect(() => {
    const handlePermission = () =>
      setNotificationPermission(Boolean(window.AndroidNotifications?.hasPermission()));
    window.addEventListener('metrika-notification-permission', handlePermission);
    return () =>
      window.removeEventListener('metrika-notification-permission', handlePermission);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(
      'metrika-reminder-settings',
      JSON.stringify(reminderSettings),
    );
    localStorage.setItem(
      'metrika-custom-reminders',
      JSON.stringify(customReminders),
    );
    const bridge = window.AndroidNotifications;
    if (!bridge?.isAvailable()) return;
    const realEntries = entries.filter((entry) => !entry.id.startsWith('demo-'));
    const now = Date.now();
    const today = new Date().toDateString();
    const todayCount = realEntries.filter(
      (entry) => new Date(entry.createdAt).toDateString() === today,
    ).length;
    const latest = realEntries
      .map((entry) => new Date(entry.createdAt).getTime())
      .sort((a, b) => b - a)[0];
    const privacyBody = (full: string) =>
      reminderSettings.privacy === 'full'
        ? full
        : reminderSettings.privacy === 'hidden'
          ? 'Відкрий застосунок, коли буде зручно.'
          : 'Час зазирнути у свій приватний простір.';
    const native: NativeReminder[] = [];
    if (reminderSettings.gentle.enabled)
      native.push({
        id: 'smart-gentle',
        title: 'Час для себе',
        body: 'Якщо є бажання — обери комфортний темп без поспіху й очікувань.',
        publicBody: privacyBody('М’яке нагадування про час для себе.'),
        time: reminderSettings.gentle.time,
        days: reminderSettings.gentle.days,
        enabled: true,
      });
    if (reminderSettings.inactivity.enabled) {
      const threshold = reminderSettings.inactivity.days * 86400000;
      let target = new Date((latest ?? now) + threshold);
      const [hour, minute] = reminderSettings.inactivity.time.split(':').map(Number);
      target.setHours(hour, minute, 0, 0);
      if (target.getTime() <= now) {
        target = new Date(now);
        target.setHours(hour, minute, 0, 0);
        if (target.getTime() <= now) target.setDate(target.getDate() + 1);
      }
      native.push({
        id: 'smart-inactivity',
        title: 'Давно не було записів',
        body: `${reminderSettings.inactivity.days} днів без сесії. Якщо хочеться зняти напругу — прислухайся до тіла. Нічого надолужувати не потрібно.`,
        publicBody: privacyBody('Делікатне нагадування після паузи.'),
        triggerAt: target.getTime(),
        enabled: true,
      });
    }
    if (
      reminderSettings.highActivity.enabled &&
      todayCount >= reminderSettings.highActivity.count
    )
      native.push({
        id: `smart-rest-${today}`,
        title: 'Час перевірити самопочуття',
        body: `${todayCount} ${pluralUk(todayCount, 'сесія', 'сесії', 'сесій')} сьогодні. Зроби паузу, випий води й перевір, чи тілу комфортно.`,
        publicBody: privacyBody('Час зробити паузу й перевірити самопочуття.'),
        triggerAt: now + 20 * 60000,
        enabled: true,
      });
    if (reminderSettings.goals.enabled && goals.some((goal) => goal.status === 'active'))
      native.push({
        id: 'smart-goals',
        title: 'Твоя ціль чекає без тиску',
        body: 'Переглянь прогрес і виріши, чи ціль досі відповідає твоєму наміру.',
        publicBody: privacyBody('Нагадування переглянути особисту ціль.'),
        time: reminderSettings.goals.time,
        days: [reminderSettings.goals.day],
        enabled: true,
      });
    customReminders.forEach((reminder) => {
      const triggerAt = reminder.date
        ? new Date(`${reminder.date}T${reminder.time}:00`).getTime()
        : undefined;
      native.push({
        id: reminder.id,
        title: 'Твоє нагадування',
        body: reminder.title,
        publicBody: privacyBody(reminder.title),
        time: reminder.time,
        days: reminder.date ? undefined : reminder.days,
        triggerAt,
        endsAt: reminder.endsAt
          ? new Date(`${reminder.endsAt}T23:59:59`).getTime()
          : undefined,
        enabled: reminder.enabled,
      });
    });
    bridge.sync(JSON.stringify(native));
  }, [customReminders, entries, goals, notificationPermission, ready, reminderSettings]);

  useEffect(() => {
    if (window.location.protocol === 'file:' || !('serviceWorker' in navigator)) return;
    const handleUpdate = () => {
      if (sessionStorage.getItem('metrika-sw-refreshed') === 'v3') return;
      sessionStorage.setItem('metrika-sw-refreshed', 'v3');
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleUpdate);
    void navigator.serviceWorker.register('/sw.js').then((registration) => registration.update()).catch(() => undefined);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', handleUpdate);
  }, []);

  useEffect(() => {
    let focusTimer: number | undefined;
    const revealFocusedField = () => {
      const active = document.activeElement;
      if (
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLInputElement &&
          ['text', 'search', 'email', 'number'].includes(active.type))
      ) {
        active.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    };
    const handleFocus = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
      window.clearTimeout(focusTimer);
      focusTimer = window.setTimeout(revealFocusedField, 320);
    };
    document.addEventListener('focusin', handleFocus);
    window.visualViewport?.addEventListener('resize', revealFocusedField);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('focusin', handleFocus);
      window.visualViewport?.removeEventListener('resize', revealFocusedField);
    };
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(
      () => setTimerSeconds((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const stats = useMemo(() => {
    const avg = entries.length
      ? entries.reduce((sum, item) => sum + (item.rating ?? 4), 0) /
        entries.length
      : 0;
    const avgDuration = entries.length
      ? Math.round(
          entries.reduce((sum, item) => sum + (item.duration ?? 20), 0) /
            entries.length,
        )
      : 0;
    const totalOrgasms = entries.reduce(
      (sum, item) => sum + (item.orgasms ?? 1),
      0,
    );
    const weekCount = entries.filter(
      (item) => Date.now() - new Date(item.createdAt).getTime() < 7 * 86400000,
    ).length;
    const evening = entries.filter(
      (item) => Number(item.time.split(':')[0]) >= 20,
    );
    const activeDays = new Set(
      entries.map((item) => new Date(item.createdAt).toDateString()),
    );
    let streak = 0;
    const cursor = new Date();
    while (activeDays.has(cursor.toDateString())) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return {
      avg: avg.toFixed(1),
      avgDuration,
      totalOrgasms,
      weekCount,
      streak,
      eveningShare: entries.length
        ? Math.round((evening.length / entries.length) * 100)
        : 0,
    };
  }, [entries]);

  const saveEntry = useCallback(
    (input?: {
      mood?: number;
      type?: string;
      note?: string;
      tags?: string[];
      duration?: number;
      rating?: number;
      orgasms?: number;
    }) => {
      const targetId = input ? null : editingId;
      if (targetId) {
        setEntries((current) => {
          const next = current.map((item) =>
            item.id === targetId
              ? {
                  ...item,
                  moodBefore,
                  mood,
                  type,
                  duration,
                  rating,
                  orgasms,
                  note,
                  tags,
                  places,
                  positions,
                  locations,
                  moods,
                }
              : item,
          );
          localStorage.setItem('metrika-entries', JSON.stringify(next));
          return next;
        });
        setEditingId(null);
        setDialogOpen(false);
        setCanUndoSave(false);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 4000);
        return {
          ...entries.find((item) => item.id === targetId)!,
          moodBefore,
          mood,
          type,
          duration,
          rating,
          orgasms,
          note,
          tags,
          places,
          positions,
          locations,
          moods,
        };
      }
      const record: Entry = {
        id: crypto.randomUUID(),
        moodBefore,
        mood: input?.mood ?? mood,
        type: input?.type ?? type,
        duration: input?.duration ?? duration,
        rating: input?.rating ?? rating,
        orgasms: input?.orgasms ?? orgasms,
        note: input?.note ?? note,
        tags: input?.tags ?? tags,
        places,
        positions,
        locations,
        moods,
        time: new Intl.DateTimeFormat('uk-UA', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date()),
        createdAt: new Date().toISOString(),
      };
      setEntries((current) => {
        const next = [
          record,
          ...current.filter((item) => !item.id.startsWith('demo-')),
        ];
        localStorage.setItem('metrika-entries', JSON.stringify(next));
        return next;
      });
      setDialogOpen(false);
      setCanUndoSave(true);
      setSaved(true);
      setNote('');
      setTags([]);
      setPlaces([]);
      setPositions([]);
      setLocations([]);
      setMoods([]);
      setDetails(false);
      window.setTimeout(() => setSaved(false), 4000);
      return record;
    },
    [
      duration,
      editingId,
      entries,
      locations,
      moods,
      mood,
      moodBefore,
      note,
      orgasms,
      places,
      positions,
      rating,
      tags,
      type,
    ],
  );

  const openNewEntry = () => {
    setEditingId(null);
    setMoodBefore(5);
    setMood(5);
    setType('Звичайна');
    setDuration(20);
    setRating(4);
    setOrgasms(1);
    setTags([]);
    setPlaces([]);
    setPositions([]);
    setLocations([]);
    setMoods([]);
    setNote('');
    setDetails(false);
    setDialogOpen(true);
  };
  const editEntry = (entry: Entry) => {
    setEditingId(entry.id);
    setMoodBefore(entry.moodBefore ?? entry.mood);
    setMood(entry.mood);
    setType(entry.type);
    setDuration(entry.duration ?? 20);
    setRating(entry.rating ?? 4);
    setOrgasms(entry.orgasms ?? 1);
    setTags(entry.tags);
    setPlaces(entry.places ?? []);
    setPositions(entry.positions ?? []);
    setLocations(entry.locations ?? []);
    setMoods(entry.moods ?? []);
    setNote(entry.note);
    setDetails(
      Boolean(
        entry.note ||
        entry.tags.length ||
        entry.places?.length ||
        entry.positions?.length ||
        entry.locations?.length ||
        entry.moods?.length,
      ),
    );
    setDialogOpen(true);
  };
  const updateTaxonomy = (group: keyof Taxonomy, values: string[]) => {
    const next = { ...taxonomy, [group]: values };
    setTaxonomy(next);
    localStorage.setItem('metrika-taxonomy', JSON.stringify(next));
  };
  const updateArchivedTaxonomy = (group: TaxonomyGroup, values: string[]) => {
    const next = { ...archivedTaxonomy, [group]: values };
    setArchivedTaxonomy(next);
    localStorage.setItem('metrika-taxonomy-archived', JSON.stringify(next));
  };
  const replaceTaxonomyValue = (
    group: TaxonomyGroup,
    oldValue: string,
    newValue: string,
  ) => {
    const clean = newValue.trim();
    if (!clean || clean === oldValue) return;
    setEntries((current) => {
      const next = current.map((entry) =>
        group === 'categories'
          ? { ...entry, type: entry.type === oldValue ? clean : entry.type }
          : {
              ...entry,
              [group]: [
                ...new Set(
                  (entry[group] ?? []).map((value) =>
                    value === oldValue ? clean : value,
                  ),
                ),
              ],
            },
      );
      localStorage.setItem('metrika-entries', JSON.stringify(next));
      return next;
    });
    const customs = [
      ...new Set(
        taxonomy[group].map((value) => (value === oldValue ? clean : value)),
      ),
    ];
    if (!baseTaxonomy[group].includes(clean) && !customs.includes(clean))
      customs.push(clean);
    updateTaxonomy(group, customs);
    if (baseTaxonomy[group].includes(oldValue))
      updateArchivedTaxonomy(group, [
        ...new Set([...archivedTaxonomy[group], oldValue]),
      ]);
  };
  const archiveTaxonomyValue = (group: TaxonomyGroup, value: string) => {
    updateArchivedTaxonomy(group, [
      ...new Set([...archivedTaxonomy[group], value]),
    ]);
    if (taxonomy[group].includes(value))
      updateTaxonomy(
        group,
        taxonomy[group].filter((item) => item !== value),
      );
  };
  const restoreTaxonomyValue = (group: TaxonomyGroup, value: string) => {
    updateArchivedTaxonomy(
      group,
      archivedTaxonomy[group].filter((item) => item !== value),
    );
    if (
      !baseTaxonomy[group].includes(value) &&
      !taxonomy[group].includes(value)
    )
      updateTaxonomy(group, [...taxonomy[group], value]);
  };
  const openSession = (entry: Entry) => {
    setSelectedEntryId(entry.id);
    setPreviousView(view);
    setView('session');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const duplicateEntry = (entry: Entry) => {
    const now = new Date();
    const copy: Entry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: now.toISOString(),
      time: new Intl.DateTimeFormat('uk-UA', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(now),
    };
    setEntries((current) => {
      const next = [
        copy,
        ...current.filter((item) => !item.id.startsWith('demo-')),
      ];
      localStorage.setItem('metrika-entries', JSON.stringify(next));
      return next;
    });
    setCanUndoSave(true);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 4000);
  };
  const deleteEntry = (entry: Entry) => {
    setEntries((current) => {
      const index = current.findIndex((item) => item.id === entry.id);
      const next = current.filter((item) => item.id !== entry.id);
      localStorage.setItem('metrika-entries', JSON.stringify(next));
      setDeleted({ entry, index });
      return next;
    });
  };
  const undoDelete = () => {
    if (!deleted) return;
    setEntries((current) => {
      const next = [...current];
      next.splice(Math.max(0, deleted.index), 0, deleted.entry);
      localStorage.setItem('metrika-entries', JSON.stringify(next));
      return next;
    });
    setDeleted(null);
  };
  const restoreData = (data: {
    entries: Entry[];
    goals?: Goal[];
    taxonomy?: Taxonomy;
    archived?: Taxonomy;
    reminderSettings?: ReminderSettings;
    customReminders?: CustomReminder[];
  }) => {
    setEntries(data.entries);
    localStorage.setItem('metrika-entries', JSON.stringify(data.entries));
    if (data.goals) {
      setGoals(data.goals);
      localStorage.setItem('metrika-goals', JSON.stringify(data.goals));
    }
    if (data.taxonomy) {
      setTaxonomy({ ...emptyTaxonomy, ...data.taxonomy });
      localStorage.setItem('metrika-taxonomy', JSON.stringify(data.taxonomy));
    }
    if (data.archived) {
      setArchivedTaxonomy({ ...emptyTaxonomy, ...data.archived });
      localStorage.setItem(
        'metrika-taxonomy-archived',
        JSON.stringify(data.archived),
      );
    }
    if (data.reminderSettings) setReminderSettings(data.reminderSettings);
    if (data.customReminders) setCustomReminders(data.customReminders);
  };

  const finishTimer = () => {
    setTimerRunning(false);
    setView('today');
    setEditingId(null);
    setDuration(Math.max(1, Math.round(timerSeconds / 60)));
    setDialogOpen(true);
  };

  const undoLast = () => {
    setEntries((current) => {
      const next = current.slice(1);
      localStorage.setItem('metrika-entries', JSON.stringify(next));
      return next;
    });
    setSaved(false);
  };

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tool = {
      name: 'create_private_solo_session',
      title: 'Додати соло-сесію',
      description:
        'Створює приватний запис соло-сесії та одразу оновлює статистику.',
      inputSchema: {
        type: 'object',
        properties: {
          mood: { type: 'number', minimum: 1, maximum: 10 },
          type: {
            type: 'string',
            enum: ['Звичайна', 'Edging', 'Швидка', 'Чуттєва'],
          },
          duration: { type: 'number', minimum: 1, maximum: 360 },
          rating: { type: 'number', minimum: 1, maximum: 5 },
          orgasms: { type: 'number', minimum: 0, maximum: 20 },
          note: { type: 'string', maxLength: 300 },
          tags: { type: 'array', items: { type: 'string' }, maxItems: 6 },
        },
        required: ['mood', 'type', 'duration', 'rating'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const value = input as {
          mood?: number;
          type?: string;
          duration?: number;
          rating?: number;
          orgasms?: number;
          note?: string;
          tags?: string[];
        };
        if (
          !value ||
          typeof value.mood !== 'number' ||
          value.mood < 1 ||
          value.mood > 10 ||
          !['Звичайна', 'Edging', 'Швидка', 'Чуттєва'].includes(
            value.type ?? '',
          ) ||
          !value.duration ||
          !value.rating
        )
          throw new Error('Некоректні дані сесії');
        const record = saveEntry(value);
        return {
          status: 'saved',
          id: record.id,
          duration: record.duration,
          rating: record.rating,
          type: record.type,
        };
      },
    };
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => undefined);
    } catch {
      /* optional browser capability */
    }
    return () => lifecycle.abort();
  }, [saveEntry]);

  const nav = (next: View) => {
    if (next !== view) setPreviousView(view);
    if (next === 'insights') setInsightsMode('analytics');
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goBack = () => nav(previousView === view ? 'today' : previousView);

  useEffect(() => {
    const nativeWindow = window as Window & {
      metrikaHandleBack?: () => boolean;
    };
    nativeWindow.metrikaHandleBack = () => {
      if (dialogOpen) {
        setDialogOpen(false);
        setEditingId(null);
        return true;
      }
      if (goalOpen) {
        setGoalOpen(false);
        setGoalEditingId(null);
        return true;
      }
      if (view === 'today') return false;
      if (view === 'timer') setTimerRunning(false);
      if (view === 'insights') {
        setStatFocus(null);
        setCategoryFocus(null);
      }
      goBack();
      return true;
    };
    return () => {
      delete nativeWindow.metrikaHandleBack;
    };
  }, [dialogOpen, goalOpen, previousView, view]);

  const openStat = (metric: StatFocus) => {
    setCategoryFocus(null);
    setStatFocus(metric);
    setInsightsMode('analytics');
    setPreviousView(view);
    setView('insights');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openCategoryStat = (category: string) => {
    setStatFocus(null);
    setCategoryFocus(category);
    setInsightsMode('analytics');
    setPreviousView(view);
    setView('insights');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const persistGoals = (next: Goal[]) => {
    setGoals(next);
    localStorage.setItem('metrika-goals', JSON.stringify(next));
  };
  const openGoalForm = (goal?: Goal) => {
    const intent: GoalIntent =
      goal?.tag === 'Без екранів'
        ? 'screenFree'
        : goal?.metric === 'rating'
          ? 'quality'
          : goal?.category === 'Edging'
            ? 'control'
            : goal?.metric === 'minutes'
              ? 'time'
              : goal?.rule === 'atMost'
                ? 'limit'
                : 'regularity';
    setGoalEditingId(goal?.id ?? null);
    setGoalTitle(goal?.title ?? '');
    setGoalMetric(goal?.metric ?? 'sessions');
    setGoalTarget(goal?.target ?? 2);
    setGoalPeriod(goal?.period ?? 'week');
    setGoalRule(goal?.rule ?? 'atLeast');
    setGoalIntent(intent);
    setGoalCategory(goal?.category ?? '');
    setGoalTag(goal?.tag ?? '');
    setGoalAdvanced(Boolean(goal?.category || goal?.tag));
    setGoalOpen(true);
    window.scrollTo({ top: 0 });
  };
  const closeGoalForm = () => {
    setGoalOpen(false);
    setGoalEditingId(null);
    setGoalAdvanced(false);
  };
  const saveGoal = () => {
    const record: Goal = {
      id: goalEditingId ?? crypto.randomUUID(),
      title: goalTitle.trim() || 'Моя ціль',
      metric: goalMetric,
      target: goalTarget,
      period: goalPeriod,
      rule: goalRule,
      status: goalEditingId
        ? (goals.find((item) => item.id === goalEditingId)?.status ?? 'active')
        : 'active',
      category: goalCategory || undefined,
      tag: goalTag || undefined,
      createdAt: goalEditingId
        ? (goals.find((item) => item.id === goalEditingId)?.createdAt ??
          new Date().toISOString())
        : new Date().toISOString(),
    };
    persistGoals(
      goalEditingId
        ? goals.map((item) => (item.id === goalEditingId ? record : item))
        : [record, ...goals],
    );
    closeGoalForm();
  };
  const updateGoal = (id: string, patch: Partial<Goal>) =>
    persistGoals(
      goals.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  const deleteGoal = (id: string) => {
    const index = goals.findIndex((item) => item.id === id);
    const goal = goals[index];
    if (!goal) return;
    persistGoals(goals.filter((item) => item.id !== id));
    setDeletedGoal({ goal, index });
  };
  const undoDeleteGoal = () => {
    if (!deletedGoal) return;
    const next = [...goals];
    next.splice(Math.max(0, deletedGoal.index), 0, deletedGoal.goal);
    persistGoals(next);
    setDeletedGoal(null);
  };
  const currentDate = new Intl.DateTimeFormat('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const tagOptions = defaultTagOptions.filter(
    (item) => !archivedTaxonomy.tags.includes(item),
  );
  const placeOptions = defaultPlaceOptions.filter(
    (item) => !archivedTaxonomy.places.includes(item),
  );
  const positionOptions = defaultPositionOptions.filter(
    (item) => !archivedTaxonomy.positions.includes(item),
  );
  const locationOptions = defaultLocationOptions.filter(
    (item) => !archivedTaxonomy.locations.includes(item),
  );
  const chooseGoalIntent = (intent: GoalIntent) => {
    setGoalIntent(intent);
    setGoalCategory(intent === 'control' ? 'Edging' : '');
    if (intent === 'time') {
      setGoalMetric('minutes');
      setGoalRule('atLeast');
      setGoalTarget(60);
      if (goalTag === 'Без екранів') setGoalTag('');
    } else if (intent === 'quality') {
      setGoalMetric('rating');
      setGoalRule('atLeast');
      setGoalTarget(4);
      if (goalTag === 'Без екранів') setGoalTag('');
    } else {
      setGoalMetric('sessions');
      setGoalRule(intent === 'limit' ? 'atMost' : 'atLeast');
      setGoalTarget(intent === 'limit' ? 3 : 2);
      if (intent === 'screenFree') setGoalTag('Без екранів');
      else if (goalTag === 'Без екранів') setGoalTag('');
    }
  };
  const sessionTargets: Record<GoalPeriod, number[]> = {
    day: [1, 2, 3, 4, 5, 7],
    week: [1, 2, 3, 5, 7, 14],
    fortnight: [2, 4, 7, 10, 14, 28],
    threeWeeks: [3, 6, 10, 14, 21, 42],
    month: [4, 8, 12, 20, 30, 60],
  };
  const minuteTargets: Record<GoalPeriod, number[]> = {
    day: [10, 20, 30, 45, 60, 90],
    week: [30, 60, 90, 120, 180, 300],
    fortnight: [60, 120, 180, 240, 360, 600],
    threeWeeks: [90, 180, 270, 360, 540, 900],
    month: [120, 240, 360, 600, 900, 1200],
  };
  const goalTargetConfig =
    goalMetric === 'rating'
      ? {
          label: 'Яка середня оцінка?',
          hint: 'Середнє задоволення від усіх відповідних сесій',
          unit: '/5',
          values: [2.5, 3, 3.5, 4, 4.5, 5],
        }
      : goalMetric === 'minutes'
        ? {
            label: 'Скільки часу?',
            hint: 'Сумарна тривалість усіх відповідних сесій',
            unit: 'хв',
            values: minuteTargets[goalPeriod],
          }
        : {
            label:
              goalRule === 'atMost'
                ? 'Яка максимальна кількість?'
                : 'Скільки сесій?',
            hint:
              goalRule === 'atMost'
                ? 'Не перевищувати цю кількість'
                : 'Кількість відповідних сесій',
            unit: 'сес.',
        values: sessionTargets[goalPeriod],
      };
  useEffect(() => {
    if (!goalTargetConfig.values.includes(goalTarget)) setGoalTarget(goalTargetConfig.values[0]);
  }, [goalMetric, goalPeriod, goalRule]);
  const periodLabels: Record<GoalPeriod, string> = {
    day: 'дня',
    week: 'тижня',
    fortnight: '2 тижні',
    threeWeeks: '3 тижні',
    month: 'місяця',
  };
  const goalSentence =
    goalIntent === 'time'
      ? `Я хочу приділяти собі ${goalTarget} хв протягом ${periodLabels[goalPeriod]}.`
      : goalIntent === 'quality'
        ? `Я хочу мати середнє задоволення щонайменше ${goalTarget}/5 протягом ${periodLabels[goalPeriod]}.`
        : goalIntent === 'control'
          ? `Я хочу провести щонайменше ${goalTarget} Edging-сес. протягом ${periodLabels[goalPeriod]}.`
          : goalIntent === 'limit'
            ? `Я хочу проводити не більше ${goalTarget} сес. протягом ${periodLabels[goalPeriod]}.`
            : goalIntent === 'screenFree'
              ? `Я хочу мати щонайменше ${goalTarget} сес. без екранів протягом ${periodLabels[goalPeriod]}.`
              : `Я хочу мати щонайменше ${goalTarget} сес. протягом ${periodLabels[goalPeriod]}.`;
  const goalPresets: { title: string; summary: string; icon: LucideIcon; intent: GoalIntent; metric: GoalMetric; target: number; period: GoalPeriod; rule: 'atLeast' | 'atMost'; category?: string; tag?: string }[] = [
    { title: 'Мій стабільний ритм', summary: '3 сесії на тиждень', icon: Flame, intent: 'regularity', metric: 'sessions', target: 3, period: 'week', rule: 'atLeast' },
    { title: 'Час для себе', summary: '60 хвилин на тиждень', icon: Clock3, intent: 'time', metric: 'minutes', target: 60, period: 'week', rule: 'atLeast' },
    { title: 'Тиждень без екранів', summary: '3 сесії без екранів', icon: Sparkles, intent: 'screenFree', metric: 'sessions', target: 3, period: 'week', rule: 'atLeast', tag: 'Без екранів' },
    { title: 'Тренування контролю', summary: '4 Edging-сесії за місяць', icon: Zap, intent: 'control', metric: 'sessions', target: 4, period: 'month', rule: 'atLeast', category: 'Edging' },
    { title: 'Більше задоволення', summary: 'Середня оцінка 4/5', icon: Star, intent: 'quality', metric: 'rating', target: 4, period: 'month', rule: 'atLeast' },
  ];
  const applyGoalPreset = (preset: (typeof goalPresets)[number]) => {
    setGoalTitle(preset.title); setGoalIntent(preset.intent); setGoalMetric(preset.metric); setGoalTarget(preset.target); setGoalPeriod(preset.period); setGoalRule(preset.rule); setGoalCategory(preset.category ?? ''); setGoalTag(preset.tag ?? '');
  };

  if (view === 'timer')
    return (
      <TimerScreen
        seconds={timerSeconds}
        running={timerRunning}
        onToggle={() => setTimerRunning((value) => !value)}
        onReset={() => setTimerSeconds(0)}
        onFinish={finishTimer}
        onBack={() => {
          setTimerRunning(false);
          goBack();
        }}
      />
    );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className={`app-shell ${dialogOpen || goalOpen ? 'entry-active' : ''}`}>
        <aside className="sidebar">
          <button
            className="brand-mark"
            onClick={() => nav('today')}
            aria-label="Metrika, на головну"
          >
            <span className="brand-glyph">M</span>
            <span className="brand-name">metrika</span>
          </button>
          <nav className="nav-list" aria-label="Основна навігація">
            <button
              aria-label="Сьогодні"
              title="Сьогодні"
              className={`nav-item ${view === 'today' ? 'active' : ''}`}
              onClick={() => nav('today')}
            >
              <LayoutDashboard />
              <span>Сьогодні</span>
            </button>
            <button
              aria-label="Історія"
              title="Історія"
              className={`nav-item ${view === 'history' ? 'active' : ''}`}
              onClick={() => nav('history')}
            >
              <History />
              <span>Історія</span>
            </button>
            <button
              aria-label="Статистика"
              title="Статистика"
              className={`nav-item ${view === 'insights' ? 'active' : ''}`}
              onClick={() => nav('insights')}
            >
              <BarChart3 />
              <span>Статистика</span>
            </button>
            <button
              aria-label="Цілі"
              title="Цілі"
              className={`nav-item ${view === 'goals' ? 'active' : ''}`}
              onClick={() => nav('goals')}
            >
              <Target />
              <span>Цілі</span>
            </button>
            <button
              aria-label="Налаштування"
              title="Налаштування"
              className={`nav-item ${(['settings', 'taxonomy', 'reminders', 'data'] as View[]).includes(view) ? 'active' : ''}`}
              onClick={() => nav('settings')}
            >
              <Settings />
              <span>Налашт.</span>
            </button>
          </nav>
          <button className="privacy-card" onClick={() => nav('settings')}>
            <Settings />
            <div>
              <strong>Налаштування</strong>
              <span>Параметри, приватність</span>
            </div>
          </button>
        </aside>

        <section className="workspace">
          <header
            className={`topbar ${(['session', 'settings', 'taxonomy', 'reminders', 'data'] as View[]).includes(view) ? 'secondary' : ''}`}
          >
            <div className="topbar-title">
              {(['session', 'settings', 'taxonomy', 'reminders', 'data'] as View[]).includes(view) && (
                <button
                  className="mobile-back"
                  onClick={goBack}
                  aria-label="Повернутися назад"
                >
                  <ArrowLeft />
                </button>
              )}
              <div>
                <p className="eyebrow">{currentDate}</p>
                <h1>
                  {view === 'today'
                    ? 'Твій простір'
                    : view === 'history'
                      ? 'Історія'
                      : view === 'goals'
                        ? 'Твої цілі'
                        : view === 'session'
                          ? 'Сесія'
                          : view === 'settings'
                            ? 'Налаштування'
                            : view === 'taxonomy'
                              ? 'Параметри сесії'
                              : view === 'reminders'
                                ? 'Нагадування'
                                : view === 'data'
                                  ? 'Захист даних'
                                  : 'Статистика'}{' '}
                  <span>✦</span>
                </h1>
              </div>
            </div>
            <div className="top-actions">
              <button className="timer-pill" onClick={() => nav('timer')}>
                <Timer /> Live-таймер
              </button>
              <div className="streak-pill" title="Поточна серія активних днів">
                <Flame /> {stats.streak} {stats.streak === 1 ? 'день' : 'днів'}
              </div>
              <button
                className={`avatar ${(['settings', 'taxonomy', 'reminders', 'data'] as View[]).includes(view) ? 'active' : ''}`}
                aria-label="Відкрити налаштування"
                title="Налаштування"
                onClick={() => nav('settings')}
              >
                <Settings />
              </button>
            </div>
          </header>

          {showDemoNote &&
            entries.some((item) => item.id.startsWith('demo-')) && (
              <div className="demo-note">
                <Sparkles />
                <span>
                  <strong>Тут є демо-дані,</strong> щоб ти одразу побачив
                  користь. Перший запис замінить їх твоїми.
                </span>
                <button
                  onClick={() => {
                    setShowDemoNote(false);
                    localStorage.setItem('metrika-demo-note', 'hidden');
                  }}
                  aria-label="Більше не показувати"
                >
                  <X />
                </button>
              </div>
            )}

          {view === 'today' && (
            <TodayView
              entries={entries}
              stats={stats}
              ready={ready}
              openLog={openNewEntry}
              openTimer={() => nav('timer')}
              openInsights={() => nav('insights')}
              openStat={openStat}
              openCategoryStat={openCategoryStat}
              openSession={openSession}
              editEntry={editEntry}
              saved={saved}
            />
          )}
          {view === 'history' && (
            <HistoryView
              entries={entries}
              openLog={openNewEntry}
              onOpen={openSession}
              onEdit={editEntry}
              onDuplicate={duplicateEntry}
              onDelete={deleteEntry}
            />
          )}
          {view === 'goals' && (
            <GoalsView
              entries={entries}
              goals={goals}
              openGoal={() => openGoalForm()}
              onEdit={openGoalForm}
              onUpdate={updateGoal}
              onDelete={deleteGoal}
            />
          )}
          {view === 'insights' && (
            <>
              <div className="stats-view-tabs" role="tablist" aria-label="Режим статистики">
                <button className={insightsMode === 'analytics' ? 'active' : ''} onClick={() => setInsightsMode('analytics')}><BarChart3 /> Аналітика</button>
                <button className={insightsMode === 'calendar' ? 'active' : ''} onClick={() => setInsightsMode('calendar')}><CalendarDays /> Календар</button>
              </div>
              {insightsMode === 'analytics' ? (
                <InsightsView
                  entries={entries}
                  focus={statFocus}
                  onFocus={setStatFocus}
                  categoryFocus={categoryFocus}
                  onCategoryFocus={setCategoryFocus}
                />
              ) : (
                <CalendarView entries={entries} openLog={openNewEntry} onOpen={openSession} />
              )}
            </>
          )}
          {view === 'settings' && (
            <SettingsView
              taxonomy={taxonomy}
              smartCount={[reminderSettings.gentle.enabled, reminderSettings.inactivity.enabled, reminderSettings.highActivity.enabled, reminderSettings.goals.enabled].filter(Boolean).length}
              customCount={customReminders.filter((item) => item.enabled).length}
              onOpen={nav}
            />
          )}
          {view === 'taxonomy' && (
            <TaxonomyView
              entries={entries}
              taxonomy={taxonomy}
              archived={archivedTaxonomy}
              onAdd={(group, value) =>
                updateTaxonomy(group, [...taxonomy[group], value])
              }
              onRename={replaceTaxonomyValue}
              onMerge={replaceTaxonomyValue}
              onArchive={archiveTaxonomyValue}
              onRestore={restoreTaxonomyValue}
            />
          )}
          {view === 'reminders' && (
            <RemindersView
              settings={reminderSettings}
              custom={customReminders}
              nativeAvailable={
                typeof window !== 'undefined' && Boolean(window.AndroidNotifications)
              }
              permissionGranted={notificationPermission}
              onRequestPermission={() =>
                window.AndroidNotifications?.requestPermission()
              }
              onSettingsChange={setReminderSettings}
              onCustomChange={setCustomReminders}
            />
          )}
          {view === 'data' && (
            <DataView
              entries={entries}
              goals={goals}
              taxonomy={taxonomy}
              archived={archivedTaxonomy}
              reminderSettings={reminderSettings}
              customReminders={customReminders}
              onRestore={restoreData}
            />
          )}
          {view === 'session' &&
            selectedEntryId &&
            entries.find((item) => item.id === selectedEntryId) && (
              <SessionView
                entry={entries.find((item) => item.id === selectedEntryId)!}
                onBack={goBack}
                onEdit={editEntry}
                onDuplicate={duplicateEntry}
                onDelete={(entry) => {
                  deleteEntry(entry);
                  setSelectedEntryId(null);
                  goBack();
                }}
              />
            )}
        </section>
      </div>

      {saved && (
        <div className="save-toast" role="status">
          <span className="toast-check">
            <Check />
          </span>
          <div>
            <strong>Запис збережено</strong>
            <small>Статистику вже оновлено</small>
          </div>
          {canUndoSave && (
            <button onClick={undoLast}>
              <RotateCcw /> Скасувати
            </button>
          )}
        </div>
      )}
      {deleted && (
        <div className="save-toast delete-toast" role="status">
          <span className="toast-check">
            <Trash2 />
          </span>
          <div>
            <strong>Запис видалено</strong>
            <small>Його можна повернути</small>
          </div>
          <button onClick={undoDelete}>
            <RotateCcw /> Скасувати
          </button>
        </div>
      )}
      {deletedGoal && (
        <div className="save-toast delete-toast" role="status">
          <span className="toast-check">
            <Trash2 />
          </span>
          <div>
            <strong>Ціль видалено</strong>
            <small>«{deletedGoal.goal.title}» можна повернути</small>
          </div>
          <button onClick={undoDeleteGoal}>
            <RotateCcw /> Скасувати
          </button>
        </div>
      )}

      {dialogOpen && (
        <section className="entry-page" aria-label={editingId ? 'Редагування запису' : 'Новий запис'}>
          <button
            className="entry-page-back"
            onClick={() => {
              setDialogOpen(false);
              setEditingId(null);
            }}
            aria-label="Повернутися назад"
          >
            <ArrowLeft />
            <span>Назад</span>
          </button>
          <header className="entry-page-header">
            <span className="dialog-kicker">
              {editingId ? 'Редагування запису' : 'Нова соло-сесія · приватно'}
            </span>
            <h2>
              {editingId ? 'Оновити деталі' : 'Як усе пройшло?'}
            </h2>
            <p>
              {editingId
                ? 'Зміни одразу оновлять статистику, календар і цілі.'
                : 'Короткий запис для чесної статистики. Деталі можна пропустити.'}
            </p>
          </header>
          <div className="entry-form">
            <div className="entry-section-title">
              <span>1</span>
              <div><strong>Тип і стан</strong><small>Два швидкі вибори для основного контексту</small></div>
            </div>
            <div className="field-block">
              <label>Основна категорія</label>
              <div className="type-cards">
                {[
                  ...typeOptions,
                  ...taxonomy.categories.map((id) => ({ id, icon: Sparkles, hint: 'Власна категорія' })),
                ]
                  .filter((item) => !archivedTaxonomy.categories.includes(item.id))
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setType(item.id)}
                      className={type === item.id ? 'selected' : ''}
                    >
                      <item.icon />
                      <strong>{item.id}</strong>
                      <small>{item.hint}</small>
                      {type === item.id && <Check className="selected-check" />}
                    </button>
                  ))}
              </div>
            </div>
            <AttributePicker
              label="Настрій"
              hint="обери один стан"
              icon={Heart}
              options={[...defaultMoodOptions, ...taxonomy.moods].filter((item) => !archivedTaxonomy.moods.includes(item))}
              custom={taxonomy.moods}
              selected={moods}
              editable={false}
              onToggle={(value) =>
                setMoods((current) => current.includes(value) ? [] : [value])
              }
              onAdd={() => undefined}
              onRename={() => undefined}
              onRemove={() => undefined}
            />
            <div className="entry-section-title">
              <span>2</span>
              <div><strong>Результат</strong><small>Тривалість, кульмінації та особиста оцінка</small></div>
            </div>
            <div className="core-fields">
              <div className="field-block compact-field">
                <div className="mood-label">
                  <label>Тривалість</label>
                  <strong>
                    {duration}
                    <small> хв</small>
                  </strong>
                </div>
                <div className="quick-values">
                  {[5, 15, 25, 45].map((value) => (
                    <button
                      key={value}
                      className={duration === value ? 'selected' : ''}
                      onClick={() => setDuration(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <Slider
                  value={[duration]}
                  min={1}
                  max={90}
                  step={1}
                  onValueChange={(value) =>
                    setDuration(Array.isArray(value) ? value[0] : value)
                  }
                />
              </div>
              <div className="field-block compact-field">
                <div className="mood-label">
                  <label>Оргазми</label>
                  <strong>{orgasms}</strong>
                </div>
                <div className="stepper">
                  <button
                    onClick={() =>
                      setOrgasms((value) => Math.max(0, value - 1))
                    }
                  >
                    −
                  </button>
                  <span>{orgasms}</span>
                  <button
                    onClick={() =>
                      setOrgasms((value) => Math.min(20, value + 1))
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <div className="field-block rating-block">
              <div className="mood-label">
                <label>Задоволення</label>
                <strong>
                  {rating}
                  <small>/5</small>
                </strong>
              </div>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setRating(value)}
                    aria-label={`${value} з 5`}
                    className={value <= rating ? 'selected' : ''}
                  >
                    <Star />
                  </button>
                ))}
              </div>
            </div>
            <button
              className="details-toggle"
              onClick={() => setDetails((value) => !value)}
            >
              {details ? <ChevronLeft /> : <Plus />}
              {details ? '3 · Сховати контекст' : '3 · Додати контекст'}
              <span>необов’язково</span>
            </button>
            {details && (
              <div className="optional-details">
                <AttributePicker
                  label="Теги"
                  icon={Tag}
                  options={[...tagOptions, ...taxonomy.tags].filter((item) => !archivedTaxonomy.tags.includes(item))}
                  custom={taxonomy.tags}
                  selected={tags}
                  editable={false}
                  onToggle={(value) =>
                    setTags((current) =>
                      current.includes(value)
                        ? current.filter((item) => item !== value)
                        : [...current, value],
                    )
                  }
                  onAdd={(value) =>
                    updateTaxonomy('tags', [...taxonomy.tags, value])
                  }
                  onRename={(oldValue, newValue) => {
                    updateTaxonomy(
                      'tags',
                      taxonomy.tags.map((item) =>
                        item === oldValue ? newValue : item,
                      ),
                    );
                    setTags((current) =>
                      current.map((item) =>
                        item === oldValue ? newValue : item,
                      ),
                    );
                  }}
                  onRemove={(value) => {
                    updateTaxonomy(
                      'tags',
                      taxonomy.tags.filter((item) => item !== value),
                    );
                    setTags((current) =>
                      current.filter((item) => item !== value),
                    );
                  }}
                />
                <AttributePicker
                  label="Місця"
                  icon={MapPin}
                  hint="конкретне місце"
                  options={[...placeOptions, ...taxonomy.places].filter((item) => !archivedTaxonomy.places.includes(item))}
                  custom={taxonomy.places}
                  selected={places}
                  editable={false}
                  onToggle={(value) =>
                    setPlaces((current) =>
                      current.includes(value)
                        ? current.filter((item) => item !== value)
                        : [...current, value],
                    )
                  }
                  onAdd={(value) =>
                    updateTaxonomy('places', [...taxonomy.places, value])
                  }
                  onRename={(a, b) => {
                    updateTaxonomy(
                      'places',
                      taxonomy.places.map((x) => (x === a ? b : x)),
                    );
                    setPlaces((x) => x.map((v) => (v === a ? b : v)));
                  }}
                  onRemove={(value) => {
                    updateTaxonomy(
                      'places',
                      taxonomy.places.filter((x) => x !== value),
                    );
                    setPlaces((x) => x.filter((v) => v !== value));
                  }}
                />
                <AttributePicker
                  label="Пози"
                  icon={PersonStanding}
                  options={[...positionOptions, ...taxonomy.positions].filter((item) => !archivedTaxonomy.positions.includes(item))}
                  custom={taxonomy.positions}
                  selected={positions}
                  editable={false}
                  onToggle={(value) =>
                    setPositions((current) =>
                      current.includes(value)
                        ? current.filter((item) => item !== value)
                        : [...current, value],
                    )
                  }
                  onAdd={(value) =>
                    updateTaxonomy('positions', [...taxonomy.positions, value])
                  }
                  onRename={(a, b) => {
                    updateTaxonomy(
                      'positions',
                      taxonomy.positions.map((x) => (x === a ? b : x)),
                    );
                    setPositions((x) => x.map((v) => (v === a ? b : v)));
                  }}
                  onRemove={(value) => {
                    updateTaxonomy(
                      'positions',
                      taxonomy.positions.filter((x) => x !== value),
                    );
                    setPositions((x) => x.filter((v) => v !== value));
                  }}
                />
                <AttributePicker
                  label="Локації"
                  icon={LocateFixed}
                  hint="загальний контекст"
                  options={[...locationOptions, ...taxonomy.locations].filter((item) => !archivedTaxonomy.locations.includes(item))}
                  custom={taxonomy.locations}
                  selected={locations}
                  editable={false}
                  onToggle={(value) =>
                    setLocations((current) =>
                      current.includes(value)
                        ? current.filter((item) => item !== value)
                        : [...current, value],
                    )
                  }
                  onAdd={(value) =>
                    updateTaxonomy('locations', [...taxonomy.locations, value])
                  }
                  onRename={(a, b) => {
                    updateTaxonomy(
                      'locations',
                      taxonomy.locations.map((x) => (x === a ? b : x)),
                    );
                    setLocations((x) => x.map((v) => (v === a ? b : v)));
                  }}
                  onRemove={(value) => {
                    updateTaxonomy(
                      'locations',
                      taxonomy.locations.filter((x) => x !== value),
                    );
                    setLocations((x) => x.filter((v) => v !== value));
                  }}
                />
                <div className="field-block">
                  <label htmlFor="entry-note">Приватна нотатка</label>
                  <Textarea
                    id="entry-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Що варто запам’ятати?"
                    maxLength={300}
                  />
                </div>
              </div>
            )}
            <button
              type="button"
              className="entry-parameters-link"
              onClick={() => {
                setDialogOpen(false);
                setEditingId(null);
                nav('taxonomy');
              }}
            >
              <FolderCog />
              Керувати параметрами сесії
              <ChevronRight />
            </button>
            <Button
              className="save-button"
              size="lg"
              onClick={() => saveEntry()}
            >
              {editingId ? <Check /> : <LockKeyhole />}{' '}
              {editingId ? 'Зберегти зміни' : 'Зберегти приватно'}
            </Button>
          </div>
        </section>
      )}
      {goalOpen && (
        <section
          className="goal-page"
          aria-label={goalEditingId ? 'Редагування цілі' : 'Нова особиста ціль'}
        >
          <button
            className="goal-page-back"
            onClick={closeGoalForm}
            aria-label="Повернутися до цілей"
          >
            <ArrowLeft />
            <span>До цілей</span>
          </button>
          <header className="goal-page-header">
            <span className="dialog-kicker">
              {goalEditingId ? 'Редагування цілі' : 'Нова особиста ціль'}
            </span>
            <h2>
              {goalEditingId ? 'Налаштуй свою ціль' : 'Що ти хочеш змінити?'}
            </h2>
            <p>
              Обери найближчий намір — решту Metrika налаштує зрозуміло.
            </p>
          </header>
          <div className="goal-page-surface">
            <div className="goal-form">
            {!goalEditingId && <section className="goal-presets"><div><span>Популярні шаблони</span><small>Обери готовий варіант — усе можна змінити нижче</small></div><div>{goalPresets.map(preset => <button type="button" key={preset.title} onClick={() => applyGoalPreset(preset)}><preset.icon/><span><strong>{preset.title}</strong><small>{preset.summary}</small></span><ChevronRight/></button>)}</div></section>}
            <fieldset className="goal-intent-selector">
              <legend>1. Обери свій намір</legend>
              <div>
                <button
                  type="button"
                  className={goalIntent === 'regularity' ? 'selected' : ''}
                  onClick={() => chooseGoalIntent('regularity')}
                >
                  <Flame />
                  <span>
                    <strong>Підтримувати ритм</strong>
                    <small>Регулярна практика</small>
                  </span>
                </button>
                <button
                  type="button"
                  className={goalIntent === 'limit' ? 'selected' : ''}
                  onClick={() => chooseGoalIntent('limit')}
                >
                  <ShieldCheck />
                  <span>
                    <strong>Робити це рідше</strong>
                    <small>Комфортна межа</small>
                  </span>
                </button>
                <button
                  type="button"
                  className={goalIntent === 'time' ? 'selected' : ''}
                  onClick={() => chooseGoalIntent('time')}
                >
                  <Clock3 />
                  <span>
                    <strong>Приділяти собі час</strong>
                    <small>Сума хвилин</small>
                  </span>
                </button>
                <button
                  type="button"
                  className={goalIntent === 'screenFree' ? 'selected' : ''}
                  onClick={() => chooseGoalIntent('screenFree')}
                >
                  <Sparkles />
                  <span>
                    <strong>Менше екранів</strong>
                    <small>Сесії без екранів</small>
                  </span>
                </button>
                <button
                  type="button"
                  className={goalIntent === 'quality' ? 'selected' : ''}
                  onClick={() => chooseGoalIntent('quality')}
                >
                  <Star />
                  <span>
                    <strong>Більше задоволення</strong>
                    <small>Середня оцінка сесій</small>
                  </span>
                </button>
                <button
                  type="button"
                  className={goalIntent === 'control' ? 'selected' : ''}
                  onClick={() => chooseGoalIntent('control')}
                >
                  <Zap />
                  <span>
                    <strong>Тренувати контроль</strong>
                    <small>Регулярні Edging-сесії</small>
                  </span>
                </button>
              </div>
            </fieldset>
            <fieldset className="goal-target-selector">
              <legend>2. {goalTargetConfig.label}</legend>
              <div>
                {goalTargetConfig.values.map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={goalTarget === value ? 'selected' : ''}
                    aria-pressed={goalTarget === value}
                    onClick={() => setGoalTarget(value)}
                  >
                    <strong>{value}</strong>
                    <span>{goalTargetConfig.unit}</span>
                  </button>
                ))}
              </div>
              <p>{goalTargetConfig.hint}</p>
            </fieldset>
            <fieldset className="goal-period-selector">
              <legend>3. За який період?</legend>
              <div>
                {(
                  [
                    ['day', 'День'],
                    ['week', 'Тиждень'],
                    ['fortnight', '2 тижні'],
                    ['threeWeeks', '3 тижні'],
                    ['month', 'Місяць'],
                  ] as [GoalPeriod, string][]
                ).map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={goalPeriod === value ? 'selected' : ''}
                    aria-pressed={goalPeriod === value}
                    onClick={() => setGoalPeriod(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="goal-sentence">
              <Check />
              <div>
                <span>Твоя ціль звучить так</span>
                <strong>{goalSentence}</strong>
              </div>
            </div>
            <label>
              Назва цілі
              <input
                className="goal-input"
                value={goalTitle}
                onChange={(event) => setGoalTitle(event.target.value)}
                placeholder="Наприклад, Мій комфортний ритм"
                required
                aria-invalid={!goalTitle.trim()}
                aria-describedby="goal-title-help"
              />
              <small id="goal-title-help" className={goalTitle.trim() ? '' : 'goal-field-error'}>
                {goalTitle.trim()
                  ? 'Цю назву буде видно у списку цілей.'
                  : 'Додай назву, щоб створити ціль.'}
              </small>
            </label>
            {goalIntent !== 'screenFree' && goalIntent !== 'control' && (
              <section className="goal-advanced-section">
                <button
                  type="button"
                  className="goal-advanced-toggle"
                  onClick={() => setGoalAdvanced((value) => !value)}
                  aria-expanded={goalAdvanced}
                >
                  <span>
                    <SlidersHorizontal />
                    <strong>Уточнити ціль</strong>
                    <small>
                      {goalCategory || goalTag
                        ? [goalCategory, goalTag].filter(Boolean).join(' · ')
                        : 'Необов’язково: категорія або тег'}
                    </small>
                  </span>
                  <ChevronRight />
                </button>
                {goalAdvanced && (
                  <div className="goal-filter-box">
                    <div>
                      <strong>Які записи враховувати?</strong>
                      <span>Залиш «усі», якщо ціль стосується будь-яких сесій.</span>
                    </div>
                    <div className="goal-form-grid">
                      <label>
                        Категорія
                        <select
                          value={goalCategory}
                          onChange={(event) => setGoalCategory(event.target.value)}
                        >
                          <option value="">Усі категорії</option>
                          {[
                            ...new Set([
                              ...typeOptions.map((item) => item.id),
                              ...taxonomy.categories,
                            ]),
                          ].map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Тег
                        <select
                          value={goalTag}
                          onChange={(event) => setGoalTag(event.target.value)}
                        >
                          <option value="">Будь-який тег</option>
                          {[
                            ...new Set([...defaultTagOptions, ...taxonomy.tags]),
                          ].map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                )}
              </section>
            )}
            <div className="goal-dialog-actions">
              <button onClick={closeGoalForm}>Скасувати</button>
              <div className="goal-submit-wrap">
                <Button
                  className="save-button"
                  onClick={saveGoal}
                  disabled={!goalTitle.trim()}
                >
                  <Target />
                  {goalEditingId ? 'Зберегти зміни' : 'Створити ціль'}
                </Button>
                {!goalTitle.trim() && <small role="status">Спочатку введи назву цілі</small>}
              </div>
            </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function TimerScreen({
  seconds,
  running,
  onToggle,
  onReset,
  onFinish,
  onBack,
}: {
  seconds: number;
  running: boolean;
  onToggle: () => void;
  onReset: () => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  return (
    <main className="timer-screen">
      <div className="timer-stage">
        <header className="timer-head">
          <button onClick={onBack} aria-label="Повернутися на головну">
            <ArrowLeft />
          </button>
          <span>
            <span className="live-dot" />
            Live-таймер
          </span>
          <span className="timer-private">
            <LockKeyhole />
            Приватно
          </span>
        </header>
        <section className="timer-face">
          <small>
            {running
              ? 'СЕСІЯ ТРИВАЄ'
              : seconds
                ? 'ТАЙМЕР НА ПАУЗІ'
                : 'ГОТОВИЙ ДО СТАРТУ'}
          </small>
          <strong aria-live="off">
            {String(Math.floor(seconds / 60)).padStart(2, '0')}:
            {String(seconds % 60).padStart(2, '0')}
          </strong>
          <span>
            {running
              ? 'Можеш зосередитися на собі — час зафіксуємо.'
              : seconds
                ? 'Продовж або заверши й створи запис.'
                : 'Запусти, коли будеш готовий.'}
          </span>
        </section>
        <section className="timer-actions">
          <button className="reset-timer" onClick={onReset} disabled={!seconds}>
            <RotateCcw />
            Скинути
          </button>
          <button
            className="play-timer"
            onClick={onToggle}
            aria-label={
              running ? 'Поставити таймер на паузу' : 'Запустити таймер'
            }
          >
            {running ? <Pause /> : <Play />}
            <span>{running ? 'Пауза' : 'Старт'}</span>
          </button>
          <Button
            className="finish-timer"
            onClick={onFinish}
            disabled={!seconds}
          >
            <Check />
            Завершити й записати
          </Button>
        </section>
        <p className="timer-privacy">
          <LockKeyhole />
          Увесь відлік залишається тільки на цьому пристрої
        </p>
      </div>
    </main>
  );
}

function TodayView({
  entries,
  stats,
  ready,
  openLog,
  openTimer,
  openInsights,
  openStat,
  openCategoryStat,
  openSession,
  editEntry,
  saved,
}: {
  entries: Entry[];
  stats: {
    avg: string;
    avgDuration: number;
    totalOrgasms: number;
    weekCount: number;
    streak: number;
    eveningShare: number;
  };
  ready: boolean;
  openLog: () => void;
  openTimer: () => void;
  openInsights: () => void;
  openStat: (metric: StatFocus) => void;
  openCategoryStat: (category: string) => void;
  openSession: (entry: Entry) => void;
  editEntry: (entry: Entry) => void;
  saved: boolean;
}) {
  const orderedEntries = [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const recent = orderedEntries.slice(0, 3);
  const [coachIndex, setCoachIndex] = useState(0);
  const [coachTouchStart, setCoachTouchStart] = useState<number | null>(null);
  const [categoryRange, setCategoryRange] = useState<7 | 30>(30);
  useEffect(() => localStorage.removeItem('metrika-coach-hidden'), []);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayCount = entries.filter(entry => new Date(entry.createdAt).getTime() >= todayStart.getTime()).length;
  const latestStamp = entries.length ? Math.max(...entries.map(entry => new Date(entry.createdAt).getTime())) : Date.now();
  const daysSince = entries.length ? Math.max(0, Math.floor((todayStart.getTime() - latestStamp) / 86400000)) : 0;
  const recentWindow = orderedEntries.slice(0, 10);
  const categoryLeaders = Array.from(recentWindow.reduce((result, entry) => {
    result.set(entry.type, (result.get(entry.type) ?? 0) + 1);
    return result;
  }, new Map<string, number>())).sort((a, b) => b[1] - a[1]);
  const dominantCategory = categoryLeaders[0];
  const currentWeekCount = entries.filter((entry) => {
    const age = Date.now() - new Date(entry.createdAt).getTime();
    return age >= 0 && age < 7 * 86400000;
  }).length;
  const previousWeekCount = entries.filter((entry) => {
    const age = Date.now() - new Date(entry.createdAt).getTime();
    return age >= 7 * 86400000 && age < 14 * 86400000;
  }).length;
  const recentThree = orderedEntries.slice(0, 3);
  const previousThree = orderedEntries.slice(3, 6);
  const average = (items: Entry[], getValue: (entry: Entry) => number) => items.length ? items.reduce((sum, entry) => sum + getValue(entry), 0) / items.length : 0;
  const ratingShift = recentThree.length >= 3 && previousThree.length >= 3 ? average(recentThree, (entry) => entry.rating) - average(previousThree, (entry) => entry.rating) : 0;
  const moodGain = recentWindow.length ? average(recentWindow, (entry) => entry.mood - (entry.moodBefore ?? entry.mood)) : 0;
  const previousDurationAverage = orderedEntries.length > 1 ? average(orderedEntries.slice(1, 6), (entry) => entry.duration) : 0;
  const durationSpike = orderedEntries[0] && previousDurationAverage > 0 ? orderedEntries[0].duration / previousDurationAverage : 0;
  const todaySessionWord = todayCount % 10 === 1 && todayCount % 100 !== 11 ? 'сесія' : [2, 3, 4].includes(todayCount % 10) && ![12, 13, 14].includes(todayCount % 100) ? 'сесії' : 'сесій';
  const primaryCoach = todayCount >= 3
    ? { tone: 'rest', icon: ShieldCheck, eyebrow: 'Висока активність сьогодні', title: `${todayCount} ${todaySessionWord} за день! Ого, дай тілу відпочити.`, text: 'Зроби паузу, випий води й перевір, чи немає подразнення або втоми. Наступна сесія нікуди не поспішає.', action: 'Подивитися день', onAction: openInsights, secondary: 'Вся історія', onSecondary: openInsights }
    : daysSince >= 6
      ? { tone: 'return', icon: Heart, eyebrow: 'Тривала пауза', title: `${daysSince} днів без жодної сесії. Хочеш зняти напругу?`, text: 'Якщо так — обери комфортний темп і не став собі цілей. Якщо бажання немає, нічого надолужувати не потрібно.', action: 'Запустити таймер', onAction: openTimer, secondary: 'Додати вручну', onSecondary: openLog }
      : currentWeekCount >= Math.max(4, previousWeekCount * 2)
        ? { tone: 'rest', icon: Activity, eyebrow: 'Різкий ріст активності', title: `Цього тижня сесій значно більше: ${currentWeekCount} проти ${previousWeekCount}.`, text: 'Перевір самопочуття: якщо це спосіб упоратися зі стресом або нудьгою, коротка пауза чи прогулянка можуть дати більше ясності.', action: 'Подивитися динаміку', onAction: () => openStat('sessions'), secondary: 'Вся статистика', onSecondary: openInsights }
        : dominantCategory && dominantCategory[1] >= 3 && dominantCategory[1] / Math.max(recentWindow.length, 1) >= .5
          ? { tone: 'pattern', icon: Zap, eyebrow: 'Домінує одна категорія', title: `${dominantCategory[0]} — твій головний сценарій?`, text: `${dominantCategory[1]} із ${recentWindow.length} останніх сесій належать до цієї категорії. Перевір її зв’язок із тривалістю, задоволенням і настроєм.`, action: 'Розібрати патерн', onAction: () => openCategoryStat(dominantCategory[0]), secondary: 'Вся статистика', onSecondary: openInsights }
          : { tone: 'steady', icon: Sparkles, eyebrow: 'Фокус на відчуттях', title: todayCount ? 'Сьогодні вже є запис — прислухайся до тіла.' : 'Обери те, після чого тобі справді краще.', text: todayCount ? 'Не потрібно покращувати цифри. Відпочинок, комфорт і відсутність подразнення — теж хороший результат.' : 'Якщо захочеться часу для себе, почни без поспіху й зверни увагу на настрій до та після.', action: todayCount ? 'Подивитися баланс' : 'Live-таймер', onAction: todayCount ? openInsights : openTimer, secondary: todayCount ? 'Відкрити історію' : 'Додати вручну', onSecondary: todayCount ? openInsights : openLog };
  const bestRecent = recentWindow.find((entry) => entry.rating >= 5);
  const contextualCoach = ratingShift <= -.8
    ? { tone: 'rest', icon: ShieldCheck, eyebrow: 'Задоволення знизилось', title: `Останні оцінки впали на ${Math.abs(ratingShift).toFixed(1)} бала.`, text: 'Не намагайся компенсувати це частотою. Спробуй змінити темп, прибрати відволікання або дати собі паузу.', action: 'Статистика оцінок', onAction: () => openStat('rating'), secondary: 'Подивитися баланс', onSecondary: openInsights }
    : ratingShift >= .8
      ? { tone: 'quality', icon: Star, eyebrow: 'Позитивний зсув', title: `Задоволення зросло на ${ratingShift.toFixed(1)} бала.`, text: 'Подивись, що змінилося в останніх сесіях: категорія, місце, тривалість або відсутність екранів можуть бути підказкою.', action: 'Дослідити зміни', onAction: () => openStat('rating'), secondary: 'Вся статистика', onSecondary: openInsights }
      : moodGain <= -.5
        ? { tone: 'rest', icon: Heart, eyebrow: 'Настрій після погіршується', title: 'Останнім часом сесії не дають полегшення', text: 'Спробуй зробити паузу й перевірити, що тобі насправді потрібно зараз: сон, рух, спілкування чи зниження стресу.', action: 'Подивитися баланс', onAction: openInsights, secondary: 'Вся статистика', onSecondary: openInsights }
        : moodGain >= 1
      ? { tone: 'quality', icon: Heart, eyebrow: 'Помітна зміна настрою', title: 'Після сесій тобі зазвичай легше', text: `За останні ${recentWindow.length} записів настрій зростав у середньому на ${moodGain.toFixed(1)} бала. Подивись, які умови повторюються.`, action: 'Подивитися баланс', onAction: openInsights, secondary: 'Вся статистика', onSecondary: openInsights }
          : durationSpike >= 1.6
            ? { tone: 'pattern', icon: Timer, eyebrow: 'Стрибок тривалості', title: `Остання сесія тривала ${orderedEntries[0].duration} хв — помітно довше звичного.`, text: 'Згадай, чи довший час справді покращив досвід. Якщо ні — комфорт важливіший за тривалість.', action: 'Динаміка часу', onAction: () => openStat('duration'), secondary: 'Відкрити сесію', onSecondary: () => openSession(orderedEntries[0]) }
            : bestRecent
              ? { tone: 'quality', icon: Star, eyebrow: 'Вдалий досвід', title: 'Відтвори умови, а не цифру', text: `Сесія «${bestRecent.type}» отримала 5/5. Зверни увагу на її контекст і настрій — це корисніше, ніж намагатися повторити результат силоміць.`, action: 'Відкрити сесію', onAction: () => openSession(bestRecent), secondary: 'Статистика оцінок', onSecondary: () => openStat('rating') }
              : { tone: 'quality', icon: Heart, eyebrow: 'М’який орієнтир', title: 'Комфорт — теж прогрес', text: 'Сьогодні спробуй прибрати поспіх і відволікання. Зупинися, якщо тілу некомфортно, навіть якщо планував інакше.', action: 'Запустити таймер', onAction: openTimer, secondary: 'Додати запис', onSecondary: openLog };
  const coaches = [primaryCoach, contextualCoach];
  const coach = coaches[coachIndex % coaches.length];
  const CoachIcon = coach.icon;
  const categoryEntries = entries.filter(
    (entry) => Date.now() - new Date(entry.createdAt).getTime() <= categoryRange * 86400000,
  );
  const categoryPalette = ['#ff6746', '#e0ef62', '#7558c9', '#f2ad31'];
  const categoryCounts = Array.from(
    categoryEntries.reduce((result, entry) => {
      result.set(entry.type, (result.get(entry.type) ?? 0) + 1);
      return result;
    }, new Map<string, number>()),
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const visibleCategories = categoryCounts.slice(0, 3);
  const hiddenCategoryCount = categoryCounts.slice(3).reduce((sum, item) => sum + item.count, 0);
  return (
    <>
      <section className="hero-grid">
        <article className="quick-card">
          <div className="quick-copy">
            <span className="section-kicker">Твій сольний ритм</span>
            <h2>
              {entries.length
                ? 'Час для себе — без зайвого шуму.'
                : 'Почни з першої сесії'}
            </h2>
            <p>
              Запускай таймер під час сесії або додай готовий запис за кілька
              секунд.
            </p>
            <div className="hero-actions">
              <Button className="log-button" size="lg" onClick={openLog}>
                {saved ? <Check /> : <Plus />}
                {saved ? 'Готово' : 'Записати сесію'}
                <span className="shortcut">N</span>
              </Button>
              <button className="hero-timer" onClick={openTimer}>
                <Timer /> Live-таймер
              </button>
            </div>
          </div>
          <div className="orb-wrap" aria-hidden="true">
            <div className="orb">
              <Heart />
            </div>
            <span className="orbit-dot one" />
            <span className="orbit-dot two" />
          </div>
        </article>
        <article className="pulse-card">
          <div className="card-head">
            <span className="icon-box">
              <Activity />
            </span>
            <div>
              <span>Пульс тижня</span>
              <small>
                {stats.weekCount >= 3 ? 'Стабільний ритм' : 'Спокійний ритм'}
              </small>
            </div>
          </div>
          <div className="week-dots">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <span
                key={day}
                className={day < Math.min(stats.weekCount, 7) ? 'filled' : ''}
              >
                {day < Math.min(stats.weekCount, 7) && <Check />}
              </span>
            ))}
          </div>
          <div className="pulse-bottom">
            <strong>{stats.weekCount}</strong>
            <span className="pulse-label">
              <span>
                {stats.weekCount % 10 === 1 && stats.weekCount % 100 !== 11
                  ? 'запис'
                  : [2, 3, 4].includes(stats.weekCount % 10) &&
                      ![12, 13, 14].includes(stats.weekCount % 100)
                    ? 'записи'
                    : 'записів'}
              </span>
              <small>за 7 днів</small>
            </span>
          </div>
        </article>
      </section>
      {ready && <section className={`adaptive-coach ${coach.tone}`} aria-live="polite" onTouchStart={(event) => setCoachTouchStart(event.touches[0].clientX)} onTouchEnd={(event) => { if (coachTouchStart === null) return; const distance = event.changedTouches[0].clientX - coachTouchStart; if (Math.abs(distance) > 45) setCoachIndex((value) => (value + (distance < 0 ? 1 : coaches.length - 1)) % coaches.length); setCoachTouchStart(null); }}><span className="coach-icon"><CoachIcon/></span><div className="coach-copy"><div className="coach-meta"><span>{coach.eyebrow}</span><div className="coach-pagination"><button onClick={() => setCoachIndex((value) => (value + coaches.length - 1) % coaches.length)} aria-label="Попередня порада"><ChevronLeft/></button><span>Порада {coachIndex + 1}/{coaches.length}</span><button onClick={() => setCoachIndex((value) => (value + 1) % coaches.length)} aria-label="Наступна порада"><ChevronRight/></button></div></div><h3>{coach.title}</h3><p>{coach.text}</p><div className="coach-actions"><button className="coach-action" onClick={coach.onAction}>{coach.action}<ChevronRight/></button><button className="coach-secondary" onClick={coach.onSecondary}>{coach.secondary}</button></div></div></section>}
      <section className="stat-grid four" aria-label="Коротка статистика">
        <button className="stat-card" onClick={() => openStat('sessions')}>
          <span>Соло-сесій</span>
          <strong>{ready ? entries.length : '—'}</strong>
          <small>зафіксовано приватно</small>
          <span className="stat-card-link">
            Дивитися динаміку <ChevronRight />
          </span>
        </button>
        <button className="stat-card" onClick={() => openStat('duration')}>
          <span>Середній час</span>
          <strong>
            {stats.avgDuration}
            <em> хв</em>
          </strong>
          <small>на одну сесію</small>
          <span className="stat-card-link">
            Дивитися динаміку <ChevronRight />
          </span>
        </button>
        <button className="stat-card" onClick={() => openStat('orgasms')}>
          <span>Оргазмів</span>
          <strong>{stats.totalOrgasms}</strong>
          <small>загалом</small>
          <span className="stat-card-link">
            Дивитися динаміку <ChevronRight />
          </span>
        </button>
        <button className="stat-card" onClick={() => openStat('rating')}>
          <span>Задоволення</span>
          <strong>
            {stats.avg}
            <em>/5</em>
          </strong>
          <small>середня оцінка</small>
          <span className="stat-card-link">
            Дивитися динаміку <ChevronRight />
          </span>
        </button>
      </section>
      <section className="category-distribution" aria-label="Розподіл сесій за категоріями">
        <div className="category-distribution-head">
          <div><span className="section-kicker">Твій стиль</span><h3>Розподіл за категоріями</h3></div>
          <div className="category-range" aria-label="Період розподілу">
            {([7, 30] as const).map((value) => <button key={value} className={categoryRange === value ? 'active' : ''} onClick={() => setCategoryRange(value)}>{value} днів</button>)}
          </div>
        </div>
        {categoryEntries.length ? <>
          <div className="category-segments" aria-hidden="true">
            {visibleCategories.map((item, index) => <span key={item.name} style={{ width: `${(item.count / categoryEntries.length) * 100}%`, background: categoryPalette[index] }} />)}
            {hiddenCategoryCount > 0 && <span style={{ width: `${(hiddenCategoryCount / categoryEntries.length) * 100}%`, background: '#cfd2ca' }} />}
          </div>
          <div className="category-list">
            {visibleCategories.map((item, index) => {
              const share = Math.round((item.count / categoryEntries.length) * 100);
              return <button key={item.name} onClick={() => openCategoryStat(item.name)}><span className="category-color" style={{ background: categoryPalette[index] }} /><strong>{item.name}</strong><span>{share}%</span><em>{item.count} {pluralUk(item.count, 'сесія', 'сесії', 'сесій')}</em><ChevronRight /></button>;
            })}
          </div>
          <div className="category-distribution-foot"><span>{categoryEntries.length < 5 ? `Поки лише ${categoryEntries.length} ${categoryEntries.length === 1 ? 'запис' : 'записи'} — розподіл ще може сильно змінитися.` : `На основі ${categoryEntries.length} записів за обраний період.`}</span><button onClick={openInsights}>Уся статистика <ChevronRight /></button></div>
        </> : <div className="category-empty"><Sparkles /><div><strong>Ще немає даних за цей період</strong><span>Після першого запису тут з’явиться твій розподіл.</span></div><button onClick={openLog}>Додати запис</button></div>}
      </section>
      <section className="content-grid">
        <article className="timeline-card">
          <div className="title-row">
            <div>
              <span className="section-kicker">Останнє</span>
              <h3>Недавні сесії</h3>
            </div>
            <button
              onClick={() =>
                document
                  .querySelector<HTMLButtonElement>('.nav-item:nth-child(2)')
                  ?.click()
              }
            >
              Вся історія <ChevronRight />
            </button>
          </div>
          <div className="mini-timeline">
            {recent.map((item, index) => (
              <div className="timeline-row" key={item.id}>
                <span className={`timeline-dot tone-${Math.min(index + 1, 3)}`}>
                  <Heart />
                </span>
                <button
                  className="timeline-open"
                  onClick={() => openSession(item)}
                >
                  <strong>{item.type}</strong>
                  <small>
                    {formatDay(item.createdAt)} · {item.time} ·{' '}
                    {item.duration ?? 20} хв
                    {item.tags[0] ? ` · ${item.tags[0]}` : ''}
                  </small>
                </button>
                <div className="mood-score">
                  {item.rating ?? 4}
                  <span>/5</span>
                </div>
                <button
                  className="timeline-edit"
                  onClick={() => editEntry(item)}
                  aria-label={`Редагувати ${item.type}`}
                  title="Редагувати"
                >
                  <Edit3 />
                </button>
              </div>
            ))}
          </div>
        </article>
        <article className="insight-card">
          <div className="insight-top">
            <div className="insight-icon">
              <Sparkles />
            </div>
            <span>На основі {entries.length} записів</span>
          </div>
          <span className="section-kicker">Помічено для тебе</span>
          <h3>
            {stats.eveningShare >= 50
              ? 'Вечір — твій природний ритм'
              : 'Твій ритм досить гнучкий'}
          </h3>
          <p>
            {stats.eveningShare >= 50
              ? `${stats.eveningShare}% активностей трапляються після 20:00. Це патерн, не оцінка.`
              : 'Час активності змінюється — поки зарано робити сильні висновки.'}
          </p>
          <button onClick={openInsights}>
            Розібрати патерн <ChevronRight />
          </button>
        </article>
      </section>
    </>
  );
}

function AttributePicker({
  label,
  hint,
  icon: Icon,
  options,
  custom,
  selected,
  onToggle,
  onAdd,
  onRename,
  onRemove,
  compact = false,
  editable = true,
}: {
  label: string;
  hint?: string;
  icon: LucideIcon;
  options: string[];
  custom: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onAdd: (value: string) => void;
  onRename: (oldValue: string, newValue: string) => void;
  onRemove: (value: string) => void;
  compact?: boolean;
  editable?: boolean;
}) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const unique = [...new Set(options)];
  const add = () => {
    const value = draft.trim();
    if (
      !value ||
      unique.some(
        (item) =>
          item.toLocaleLowerCase('uk-UA') === value.toLocaleLowerCase('uk-UA'),
      )
    )
      return;
    onAdd(value);
    setDraft('');
  };
  const rename = () => {
    const value = editValue.trim();
    if (
      !editing ||
      !value ||
      unique.some(
        (item) =>
          item !== editing &&
          item.toLocaleLowerCase('uk-UA') === value.toLocaleLowerCase('uk-UA'),
      )
    )
      return;
    onRename(editing, value);
    setEditing(null);
    setEditValue('');
  };
  return (
    <section className={`attribute-picker ${compact ? 'compact' : ''}`}>
      <div className="attribute-head">
        <span>
          <Icon />
          {label}
        </span>
        <small>{hint ?? 'можна вибрати кілька'}</small>
      </div>
      <div className="attribute-options">
        {unique.map((item) => (
          <div
            className={`attribute-chip ${selected.includes(item) ? 'selected' : ''}`}
            key={item}
          >
            <button
              type="button"
              onClick={() => onToggle(item)}
              aria-pressed={selected.includes(item)}
            >
              {selected.includes(item) && <Check />}
              {item}
            </button>
            {editable && custom.includes(item) && (
              <button
                type="button"
                className="edit-choice"
                aria-label={`Редагувати ${item}`}
                onClick={() => {
                  setEditing(item);
                  setEditValue(item);
                }}
              >
                <Edit3 />
              </button>
            )}
          </div>
        ))}
      </div>
      {editable && editing && (
        <div className="attribute-editor">
          <input
            autoFocus
            value={editValue}
            onChange={(event) => setEditValue(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && rename()}
            aria-label={`Нова назва для ${editing}`}
          />
          <button type="button" onClick={rename}>
            <Check />
            Зберегти
          </button>
          <button
            type="button"
            className="delete-choice"
            onClick={() => {
              onRemove(editing);
              setEditing(null);
            }}
          >
            <Trash2 />
            Видалити
          </button>
        </div>
      )}
      {editable && <div className="attribute-add">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && add()}
          placeholder={`Додати: ${label.toLocaleLowerCase('uk-UA')}`}
          maxLength={28}
        />
        <button type="button" onClick={add} disabled={!draft.trim()}>
          <Plus />
          Додати
        </button>
      </div>}
    </section>
  );
}

function HistoryView({
  entries,
  openLog,
  onOpen,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  entries: Entry[];
  openLog: () => void;
  onOpen: (entry: Entry) => void;
  onEdit: (entry: Entry) => void;
  onDuplicate: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Усі');
  const [menu, setMenu] = useState<string | null>(null);
  const filters = [
    { label: 'Усі', value: 'Усі' },
    ...[...new Set(entries.map((entry) => entry.type))].map((value) => ({
      label: value,
      value,
    })),
  ];
  const normalizedQuery = query.trim().toLocaleLowerCase('uk-UA');
  const filtered = entries.filter(
    (entry) =>
      (filter === 'Усі' || entry.type === filter) &&
      (!normalizedQuery ||
        `${entry.type} ${entry.note} ${entry.tags.join(' ')} ${(entry.moods ?? []).join(' ')} ${(entry.places ?? []).join(' ')} ${(entry.locations ?? []).join(' ')} ${(entry.positions ?? []).join(' ')}`
          .toLocaleLowerCase('uk-UA')
          .includes(normalizedQuery)),
  );
  return (
    <section className="history-surface">
      <div className="history-toolbar">
        <div className="search-box">
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Пошук в історії"
            placeholder="Пошук у нотатках і тегах"
          />
        </div>
        <div className="history-filters">
          {filters.map((item) => (
            <button
              type="button"
              onClick={() => {
                setFilter(item.value);
                setMenu(null);
              }}
              aria-pressed={filter === item.value}
              className={filter === item.value ? 'active' : ''}
              key={item.value}
            >
              {item.label}
              <span>
                {item.value === 'Усі'
                  ? entries.length
                  : entries.filter((entry) => entry.type === item.value).length}
              </span>
            </button>
          ))}
        </div>
        <Button onClick={openLog}>
          <Plus /> Нова сесія
        </Button>
      </div>
      <div className="history-result">
        <span>
          {filter === 'Усі'
            ? 'Усі записи'
            : filters.find((item) => item.value === filter)?.label}
        </span>
        <strong>
          {filtered.length} {filtered.length === 1 ? 'запис' : 'записів'}
        </strong>
      </div>
      <div className="history-list">
        {filtered.map((entry, index) => (
          <article className="history-entry" key={entry.id}>
            <div className="date-tile">
              <strong>{new Date(entry.createdAt).getDate()}</strong>
              <span>
                {new Intl.DateTimeFormat('uk-UA', { month: 'short' }).format(
                  new Date(entry.createdAt),
                )}
              </span>
            </div>
            <div className="history-icon">
              <Heart />
            </div>
            <button
              className="history-copy history-open"
              onClick={() => onOpen(entry)}
            >
              <strong>
                {entry.type}
                {index === 0 && (
                  <span className="latest-inline">Остання</span>
                )}{' '}
                <em className="duration-chip">{entry.duration ?? 20} хв</em>
              </strong>
              <span>
                <Clock3 /> {entry.time}
                {entry.tags.map((tag) => (
                  <em key={tag}>#{tag.toLowerCase().replaceAll(' ', '_')}</em>
                ))}
              </span>
              {entry.note && <p>«{entry.note}»</p>}
            </button>
            <div className="session-meta">
              <span>
                <Zap /> {entry.orgasms ?? 1}
              </span>
              <span>
                <Star /> {entry.rating ?? 4}
              </span>
            </div>
            <button
              className="more-button"
              onClick={() => setMenu(menu === entry.id ? null : entry.id)}
              aria-label="Більше дій"
            >
              <MoreHorizontal />
            </button>
            {menu === entry.id && (
              <div className="entry-actions">
                <button
                  onClick={() => {
                    onEdit(entry);
                    setMenu(null);
                  }}
                >
                  <Edit3 />
                  Редагувати
                </button>
                <button
                  onClick={() => {
                    onDuplicate(entry);
                    setMenu(null);
                  }}
                >
                  <Copy />
                  Дублювати
                </button>
                <button
                  className="danger"
                  onClick={() => {
                    onDelete(entry);
                    setMenu(null);
                  }}
                >
                  <Trash2 />
                  Видалити
                </button>
              </div>
            )}
          </article>
        ))}
        {!filtered.length && (
          <div className="history-empty">
            <Search />
            <strong>Нічого не знайдено</strong>
            <span>Спробуй змінити пошук або фільтр.</span>
          </div>
        )}
      </div>
    </section>
  );
}

function RemindersView({
  settings,
  custom,
  nativeAvailable,
  permissionGranted,
  onRequestPermission,
  onSettingsChange,
  onCustomChange,
}: {
  settings: ReminderSettings;
  custom: CustomReminder[];
  nativeAvailable: boolean;
  permissionGranted: boolean;
  onRequestPermission: () => void;
  onSettingsChange: (settings: ReminderSettings) => void;
  onCustomChange: (items: CustomReminder[]) => void;
}) {
  const [section, setSection] = useState<'smart' | 'custom'>('smart');
  const [editing, setEditing] = useState<CustomReminder | null>(null);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('20:00');
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [date, setDate] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [repeat, setRepeat] = useState(true);
  const dayOptions = [
    { value: 1, label: 'Пн' },
    { value: 2, label: 'Вт' },
    { value: 3, label: 'Ср' },
    { value: 4, label: 'Чт' },
    { value: 5, label: 'Пт' },
    { value: 6, label: 'Сб' },
    { value: 0, label: 'Нд' },
  ];
  const activeSmart = [
    settings.gentle.enabled,
    settings.inactivity.enabled,
    settings.highActivity.enabled,
    settings.goals.enabled,
  ].filter(Boolean).length;
  const openEditor = (item?: CustomReminder) => {
    setEditing(
      item ?? {
        id: crypto.randomUUID(),
        title: '',
        time: '20:00',
        days: [1, 3, 5],
        enabled: true,
      },
    );
    setTitle(item?.title ?? 'Час зробити паузу й прислухатися до себе');
    setTime(item?.time ?? '20:00');
    setDays(item?.days ?? [1, 3, 5]);
    setDate(item?.date ?? '');
    setEndsAt(item?.endsAt ?? '');
    setRepeat(!item?.date);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const saveCustom = () => {
    if (!editing || !title.trim() || (repeat ? !days.length : !date)) return;
    const record: CustomReminder = {
      ...editing,
      title: title.trim(),
      time,
      days: repeat ? days : [],
      date: repeat ? undefined : date,
      endsAt: repeat && endsAt ? endsAt : undefined,
      enabled: true,
    };
    onCustomChange(
      custom.some((item) => item.id === record.id)
        ? custom.map((item) => (item.id === record.id ? record : item))
        : [record, ...custom],
    );
    setEditing(null);
  };
  if (editing)
    return (
      <section className="reminders-page reminder-editor-page">
        <button className="inline-page-back" onClick={() => setEditing(null)}>
          <ArrowLeft /> Назад до нагадувань
        </button>
        <div className="reminders-lead">
          <div>
            <span className="section-kicker">Моє нагадування</span>
            <h2>{custom.some((item) => item.id === editing.id) ? 'Редагувати' : 'Нове нагадування'}</h2>
            <p>Твій текст і розклад зберігаються лише на цьому пристрої.</p>
          </div>
        </div>
        <div className="reminder-editor-surface">
          <label className="reminder-field">
            Що нагадати?
            <textarea value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} />
            <small>{title.length}/140 · На заблокованому екрані діє вибраний режим приватності.</small>
          </label>
          <div className="reminder-form-grid">
            <label className="reminder-field">
              Час
              <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </label>
            <label className="reminder-field">
              Повторення
              <select value={repeat ? 'repeat' : 'once'} onChange={(event) => setRepeat(event.target.value === 'repeat')}>
                <option value="repeat">За днями тижня</option>
                <option value="once">Один раз</option>
              </select>
            </label>
          </div>
          {repeat ? (
            <>
              <div className="reminder-field">
                <span>Дні тижня</span>
                <div className="reminder-days">
                  {dayOptions.map((day) => (
                    <button key={day.value} className={days.includes(day.value) ? 'active' : ''} onClick={() => setDays((current) => current.includes(day.value) ? current.filter((value) => value !== day.value) : [...current, day.value])}>
                      {day.label}
                    </button>
                  ))}
                </div>
                {!days.length && <small className="field-error">Обери хоча б один день.</small>}
              </div>
              <label className="reminder-field">
                Завершити повторення <small>Необов’язково</small>
                <input type="date" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
              </label>
            </>
          ) : (
            <label className="reminder-field">
              Дата
              <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setDate(event.target.value)} />
              {!date && <small className="field-error">Обери дату нагадування.</small>}
            </label>
          )}
          <div className="reminder-editor-actions">
            <button onClick={() => setEditing(null)}>Скасувати</button>
            <Button onClick={saveCustom} disabled={!title.trim() || (repeat ? !days.length : !date)}>
              <Check /> Зберегти нагадування
            </Button>
          </div>
        </div>
      </section>
    );
  const smartCards = [
    {
      key: 'gentle' as const,
      icon: Heart,
      title: 'Делікатний час для себе',
      text: 'Спокійне нагадування у вибрані дні — без тиску й вимог.',
      meta: `${settings.gentle.time} · ${settings.gentle.days.length} дн. на тиждень`,
    },
    {
      key: 'inactivity' as const,
      icon: CalendarDays,
      title: 'Після тривалої паузи',
      text: 'Спрацює лише коли справді давно не було жодного запису.',
      meta: `${settings.inactivity.days} днів · о ${settings.inactivity.time}`,
    },
    {
      key: 'highActivity' as const,
      icon: Activity,
      title: 'Перевірка самопочуття',
      text: 'Після пікової активності нагадає зробити паузу й прислухатися до тіла.',
      meta: `Після ${settings.highActivity.count} сесій за день`,
    },
    {
      key: 'goals' as const,
      icon: Target,
      title: 'Незавершена ціль',
      text: 'Раз на тиждень запропонує переглянути активну ціль, а не наздоганяти її.',
      meta: `${dayOptions.find((day) => day.value === settings.goals.day)?.label} · ${settings.goals.time}`,
    },
  ];
  const updateSmart = <K extends keyof Omit<ReminderSettings, 'privacy'>>(
    key: K,
    patch: Partial<ReminderSettings[K]>,
  ) => onSettingsChange({ ...settings, [key]: { ...settings[key], ...patch } });
  return (
    <section className="reminders-page">
      <div className="reminders-lead">
        <div>
          <span className="section-kicker">Локально й приватно</span>
          <h2>Нагадування, які поважають твій ритм</h2>
          <p>Розумні сигнали реагують на записи. Власні — працюють за твоїм розкладом.</p>
        </div>
        <div className="reminder-summary"><BellRing /><strong>{activeSmart + custom.filter((item) => item.enabled).length}</strong><span>активних</span></div>
      </div>
      {!nativeAvailable ? (
        <div className="notification-access web"><Bell /><div><strong>Налаштування збережуться</strong><span>Справжні системні сповіщення працюватимуть в Android-застосунку.</span></div></div>
      ) : !permissionGranted ? (
        <div className="notification-access"><BellRing /><div><strong>Дозволь Metrika показувати сповіщення</strong><span>Без дозволу розклад збережеться, але Android нічого не покаже.</span></div><Button onClick={onRequestPermission}>Увімкнути</Button></div>
      ) : (
        <div className="notification-access granted"><Check /><div><strong>Сповіщення дозволені</strong><span>Усе планується локально на телефоні.</span></div></div>
      )}
      <div className="reminder-tabs" role="tablist">
        <button className={section === 'smart' ? 'active' : ''} onClick={() => setSection('smart')}>Розумні <span>{activeSmart}</span></button>
        <button className={section === 'custom' ? 'active' : ''} onClick={() => setSection('custom')}>Мої нагадування <span>{custom.length}</span></button>
      </div>
      {section === 'smart' ? (
        <div className="smart-reminders-grid">
          {smartCards.map((card) => {
            const Icon = card.icon;
            const value = settings[card.key];
            return (
              <article className={`smart-reminder-card ${value.enabled ? 'enabled' : ''}`} key={card.key}>
                <div className="smart-reminder-head"><span><Icon /></span><label className="reminder-switch"><input type="checkbox" checked={value.enabled} onChange={(event) => updateSmart(card.key, { enabled: event.target.checked })} /><i /></label></div>
                <h3>{card.title}</h3><p>{card.text}</p><strong className="reminder-meta">{card.meta}</strong>
                {card.key === 'gentle' && <div className="smart-controls"><input aria-label="Час делікатного нагадування" type="time" value={settings.gentle.time} onChange={(event) => updateSmart('gentle', { time: event.target.value })} /><div className="mini-days">{dayOptions.map((day) => <button key={day.value} className={settings.gentle.days.includes(day.value) ? 'active' : ''} onClick={() => updateSmart('gentle', { days: settings.gentle.days.includes(day.value) ? settings.gentle.days.filter((value) => value !== day.value) : [...settings.gentle.days, day.value] })}>{day.label[0]}</button>)}</div></div>}
                {card.key === 'inactivity' && <div className="smart-controls two"><label>Пауза<select value={settings.inactivity.days} onChange={(event) => updateSmart('inactivity', { days: Number(event.target.value) })}>{[3, 5, 6, 7, 14, 30].map((value) => <option key={value} value={value}>{value} днів</option>)}</select></label><label>Час<input type="time" value={settings.inactivity.time} onChange={(event) => updateSmart('inactivity', { time: event.target.value })} /></label></div>}
                {card.key === 'highActivity' && <div className="smart-controls"><label>Вважати піком<select value={settings.highActivity.count} onChange={(event) => updateSmart('highActivity', { count: Number(event.target.value) })}>{[2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} сесії</option>)}</select></label></div>}
                {card.key === 'goals' && <div className="smart-controls two"><label>День<select value={settings.goals.day} onChange={(event) => updateSmart('goals', { day: Number(event.target.value) })}>{dayOptions.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}</select></label><label>Час<input type="time" value={settings.goals.time} onChange={(event) => updateSmart('goals', { time: event.target.value })} /></label></div>}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="custom-reminders-surface">
          <div className="custom-reminders-head"><div><h3>Твій власний розклад</h3><p>Одноразові або повторювані нагадування з власним текстом.</p></div><Button onClick={() => openEditor()}><Plus /> Створити</Button></div>
          {custom.length ? <div className="custom-reminder-list">{custom.map((item) => <article key={item.id}><span className="custom-reminder-time">{item.time}</span><div><strong>{item.title}</strong><small>{item.date ? new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).format(new Date(`${item.date}T12:00:00`)) : item.days.map((value) => dayOptions.find((day) => day.value === value)?.label).join(' · ')}</small></div><label className="reminder-switch"><input type="checkbox" checked={item.enabled} onChange={(event) => onCustomChange(custom.map((current) => current.id === item.id ? { ...current, enabled: event.target.checked } : current))} /><i /></label><button className="reminder-icon-button" onClick={() => openEditor(item)} aria-label={`Редагувати: ${item.title}`}><Edit3 /></button><button className="reminder-icon-button danger" onClick={() => onCustomChange(custom.filter((current) => current.id !== item.id))} aria-label={`Видалити: ${item.title}`}><Trash2 /></button></article>)}</div> : <div className="reminder-empty"><Bell /><strong>Ще немає власних нагадувань</strong><span>Створи перше — наприклад, для вечірньої паузи або особистого ритуалу.</span><button onClick={() => openEditor()}>Створити нагадування</button></div>}
        </div>
      )}
      <section className="privacy-reminder-card"><div><LockKeyhole /><span><strong>Текст на заблокованому екрані</strong><small>Зміст самого нагадування завжди залишається в застосунку.</small></span></div><div className="privacy-options">{([{ value: 'full', label: 'Повний' }, { value: 'neutral', label: 'Нейтральний' }, { value: 'hidden', label: 'Прихований' }] as const).map((option) => <button key={option.value} className={settings.privacy === option.value ? 'active' : ''} onClick={() => onSettingsChange({ ...settings, privacy: option.value })}>{option.label}</button>)}</div></section>
    </section>
  );
}

function DataView({
  entries,
  goals,
  taxonomy,
  archived,
  reminderSettings,
  customReminders,
  onRestore,
}: {
  entries: Entry[];
  goals: Goal[];
  taxonomy: Taxonomy;
  archived: Taxonomy;
  reminderSettings: ReminderSettings;
  customReminders: CustomReminder[];
  onRestore: (data: {
    entries: Entry[];
    goals?: Goal[];
    taxonomy?: Taxonomy;
    archived?: Taxonomy;
    reminderSettings?: ReminderSettings;
    customReminders?: CustomReminder[];
  }) => void;
}) {
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState<{
    entries: Entry[];
    goals?: Goal[];
    taxonomy?: Taxonomy;
    archived?: Taxonomy;
    reminderSettings?: ReminderSettings;
    customReminders?: CustomReminder[];
  } | null>(null);
  const [status, setStatus] = useState('');
  const [pendingSource, setPendingSource] = useState<'backup' | 'csv'>('backup');
  const exportEncrypted = async () => {
    if (password.length < 6) {
      setStatus('Пароль має містити щонайменше 6 символів.');
      return;
    }
    const content = await encryptBackup(
      {
        entries,
        goals,
        taxonomy,
        archived,
        reminderSettings,
        customReminders,
        exportedAt: new Date().toISOString(),
      },
      password,
    );
    downloadBlob(
      content,
      `metrika-backup-${new Date().toISOString().slice(0, 10)}.metrika`,
      'application/octet-stream',
    );
    setStatus('Зашифрований бекап створено.');
  };
  const exportCsv = () => {
    const esc = (value: unknown) =>
      `"${String(value ?? '').replaceAll('"', '""')}"`;
    const head = [
      'ID',
      'Дата',
      'Час',
      'Категорія',
      'Тривалість',
      'Оцінка',
      'Настрій',
      'Оргазми',
      'Теги',
      'Місця',
      'Пози',
      'Локації',
      'Нотатка',
    ];
    const rows = entries.map((item) =>
      [
        item.id,
        item.createdAt.slice(0, 10),
        item.time,
        item.type,
        item.duration,
        item.rating,
        (item.moods ?? []).join('; '),
        item.orgasms,
        item.tags.join('; '),
        (item.places ?? []).join('; '),
        (item.positions ?? []).join('; '),
        (item.locations ?? []).join('; '),
        item.note,
      ]
        .map(esc)
        .join(','),
    );
    downloadBlob(
      '\ufeff' + [head.map(esc).join(','), ...rows].join('\n'),
      `metrika-${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8',
    );
  };
  const readFile = async (file: File) => {
    try {
      if (!password) {
        setStatus('Введи пароль від бекапу.');
        return;
      }
      const data = await decryptBackup(await file.text(), password);
      if (!Array.isArray(data.entries)) throw new Error('Некоректні дані');
      setPendingSource('backup');
      setPending(data);
      setStatus('');
    } catch {
      setPending(null);
      setStatus('Не вдалося відкрити файл. Перевір пароль і сам бекап.');
    }
  };
  const readCsvFile = async (file: File) => {
    try {
      const text = (await file.text()).replace(/^\ufeff/, '');
      const rows: string[][] = [];
      let row: string[] = [], cell = '', quoted = false;
      for (let index = 0; index < text.length; index++) {
        const char = text[index];
        if (char === '"') {
          if (quoted && text[index + 1] === '"') { cell += '"'; index++; }
          else quoted = !quoted;
        } else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
        else if ((char === '\n' || char === '\r') && !quoted) {
          if (char === '\r' && text[index + 1] === '\n') index++;
          row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = '';
        } else cell += char;
      }
      row.push(cell); if (row.some(Boolean)) rows.push(row);
      const headers = rows.shift()?.map((value) => value.trim()) ?? [];
      const column = (values: string[], name: string) => values[headers.indexOf(name)] ?? '';
      if (!headers.includes('Дата') || !headers.includes('Категорія')) throw new Error('Некоректний CSV');
      const splitList = (value: string) => value.split(';').map((item) => item.trim()).filter(Boolean);
      const imported = rows.map((values): Entry => {
        const date = column(values, 'Дата');
        const time = column(values, 'Час') || '12:00';
        const number = (name: string, fallback: number) => Number(column(values, name)) || fallback;
        return {
          id: column(values, 'ID') || crypto.randomUUID(),
          createdAt: new Date(`${date}T${time}:00`).toISOString(),
          time,
          type: column(values, 'Категорія'),
          duration: number('Тривалість', 20),
          rating: number('Оцінка', 4),
          moodBefore: 5,
          mood: 5,
          moods: splitList(column(values, 'Настрій')),
          orgasms: Number(column(values, 'Оргазми')) || 0,
          tags: splitList(column(values, 'Теги')),
          places: splitList(column(values, 'Місця')),
          positions: splitList(column(values, 'Пози')),
          locations: splitList(column(values, 'Локації')),
          note: column(values, 'Нотатка'),
        };
      });
      if (!imported.length) throw new Error('Порожній CSV');
      setPendingSource('csv');
      setPending({ entries: imported });
      setStatus('');
    } catch {
      setPending(null);
      setStatus('Не вдалося прочитати CSV. Використай файл, експортований із Metrika.');
    }
  };
  const conflicts = pending
    ? pending.entries.filter((item) =>
        entries.some((current) => current.id === item.id),
      ).length
    : 0;
  const statusTone = /успішно|створено/i.test(status) ? 'success' : 'error';
  return (
    <section className="data-page">
      <div className="data-hero">
        <div>
          <span className="section-kicker">Локально й під твоїм контролем</span>
          <h2>Твої дані належать тобі</h2>
          <p>
            Створи захищену копію для перенесення між пристроями або CSV для
            власного аналізу.
          </p>
        </div>
        <FileKey2 />
      </div>
      <div className="data-grid">
        <article className="data-card primary">
          <span className="data-icon">
            <ShieldCheck />
          </span>
          <div>
            <span className="section-kicker">Рекомендовано</span>
            <h3>Зашифрований бекап</h3>
            <p>
              Усі сесії, цілі, нагадування та словник. Файл відкриється лише з твоїм паролем.
            </p>
          </div>
          <label>
            Пароль для файлу
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (status) setStatus('');
              }}
              placeholder="Мінімум 6 символів"
              autoComplete="new-password"
              aria-describedby="backup-password-help"
            />
            <small id="backup-password-help">
              Не зберігається в застосунку. Він знадобиться для відновлення.
            </small>
          </label>
          <Button onClick={exportEncrypted}>
            <Download />
            Завантажити бекап
          </Button>
        </article>
        <article className="data-card">
          <span className="data-icon coral">
            <Upload />
          </span>
          <div>
            <span className="section-kicker">Відновлення</span>
            <h3>Імпортувати копію</h3>
            <p>
              Спочатку покажемо вміст і конфлікти. Нічого не зміниться без
              підтвердження.
            </p>
          </div>
          <label className="file-drop">
            <Upload />
            <strong>Обрати файл .metrika</strong>
            <span>Використай пароль із поля вище</span>
            <input
              type="file"
              accept=".metrika,application/octet-stream"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void readFile(file);
              }}
            />
          </label>
        </article>
        <article className="data-card compact">
          <span className="data-icon lime">
            <Download />
          </span>
          <div>
            <h3>CSV: таблиця сесій</h3>
            <p>Експорт для Excel/Sheets або імпорт назад у Metrika.</p>
          </div>
          <div className="csv-actions">
            <button onClick={exportCsv}><Download /> Експорт</button>
            <label><Upload /> Імпорт<input type="file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void readCsvFile(file); event.target.value = ''; }} /></label>
          </div>
        </article>
        <article className="data-card compact privacy-fact">
          <LockKeyhole />
          <div>
            <h3>Без відправлення в хмару</h3>
            <p>
              Шифрування та підготовка файлів відбуваються прямо у браузері.
            </p>
          </div>
        </article>
      </div>
      {status && (
        <div className={`data-status ${statusTone}`} role="status" aria-live="polite">
          {statusTone === 'success' ? <Check /> : <ShieldCheck />}
          <span>{status}</span>
        </div>
      )}
      {pending && (
        <div className="import-preview">
          <div>
            <span className="section-kicker">Попередній перегляд</span>
            <h3>{pendingSource === 'csv' ? 'CSV готовий до імпорту' : 'Готово до відновлення'}</h3>
          </div>
          <div className="import-numbers">
            <span>
              <strong>{pending.entries.length}</strong>сесій у файлі
            </span>
            <span>
              <strong>{conflicts}</strong>збігів
            </span>
            <span>
              <strong>{Math.max(0, pending.entries.length - conflicts)}</strong>
              нових
            </span>
          </div>
          <p>
            {pendingSource === 'csv' ? 'Записи з однаковим ID буде оновлено даними з CSV. Цілі та власні списки не зміняться.' : 'Збіги з однаковим ID буде оновлено даними з бекапу. Інші записи залишаться.'}
          </p>
          <div>
            <button onClick={() => setPending(null)}>Скасувати</button>
            <Button
              onClick={() => {
                const merged = [
                  ...pending.entries,
                  ...entries.filter(
                    (item) =>
                      !pending.entries.some((next) => next.id === item.id),
                  ),
                ];
                onRestore({ ...pending, entries: merged });
                setPending(null);
                setStatus('Дані успішно відновлено.');
              }}
            >
              <Check />
              Підтвердити імпорт
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function SettingsView({
  taxonomy,
  smartCount,
  customCount,
  onOpen,
}: {
  taxonomy: Taxonomy;
  smartCount: number;
  customCount: number;
  onOpen: (view: View) => void;
}) {
  const parameterCount = (Object.keys(taxonomy) as TaxonomyGroup[]).reduce(
    (total, group) =>
      total + new Set([...baseTaxonomy[group], ...taxonomy[group]]).size,
    0,
  );
  const reminderCount = smartCount + customCount;
  const cards: {
    view: View;
    icon: LucideIcon;
    kicker: string;
    title: string;
    description: string;
    meta: string;
  }[] = [
    {
      view: 'taxonomy',
      icon: FolderCog,
      kicker: 'Запис сесії',
      title: 'Параметри сесії',
      description:
        'Категорії, настрої, теги, місця, локації та пози, які використовуються в усьому додатку.',
      meta: `${parameterCount} значень`,
    },
    {
      view: 'reminders',
      icon: BellRing,
      kicker: 'Твій ритм',
      title: 'Нагадування',
      description:
        'Розумні підказки та власні нагадування у зручний для тебе час.',
      meta: reminderCount
        ? `${reminderCount} активн${reminderCount === 1 ? 'е' : 'их'}`
        : 'Усі вимкнені',
    },
    {
      view: 'data',
      icon: LockKeyhole,
      kicker: 'Лише на пристрої',
      title: 'Захист даних',
      description:
        'Зашифрований бекап, імпорт і експорт записів без передавання даних назовні.',
      meta: 'Приватно й офлайн',
    },
  ];

  return (
    <section className="settings-page">
      <div className="settings-intro">
        <span className="section-kicker">Усе в одному місці</span>
        <h2>Налаштуй Metrika під себе</h2>
        <p>
          Керуй тим, що бачиш під час запису, коли отримуєш нагадування і як
          зберігаються твої дані.
        </p>
      </div>
      <div className="settings-grid">
        {cards.map((card) => (
          <button
            className="settings-card"
            key={card.view}
            onClick={() => onOpen(card.view)}
          >
            <span className="settings-card-icon">
              <card.icon />
            </span>
            <span className="settings-card-copy">
              <small>{card.kicker}</small>
              <strong>{card.title}</strong>
              <span>{card.description}</span>
            </span>
            <span className="settings-card-footer">
              <em>{card.meta}</em>
              <ChevronRight />
            </span>
          </button>
        ))}
      </div>
      <div className="settings-privacy-note">
        <ShieldCheck />
        <span>
          Налаштування й особисті записи зберігаються локально на цьому
          пристрої.
        </span>
      </div>
    </section>
  );
}

function TaxonomyView({
  entries,
  taxonomy,
  archived,
  onAdd,
  onRename,
  onMerge,
  onArchive,
  onRestore,
}: {
  entries: Entry[];
  taxonomy: Taxonomy;
  archived: Taxonomy;
  onAdd: (group: TaxonomyGroup, value: string) => void;
  onRename: (group: TaxonomyGroup, oldValue: string, newValue: string) => void;
  onMerge: (group: TaxonomyGroup, oldValue: string, newValue: string) => void;
  onArchive: (group: TaxonomyGroup, value: string) => void;
  onRestore: (group: TaxonomyGroup, value: string) => void;
}) {
  const groups: {
    id: TaxonomyGroup;
    label: string;
    hint: string;
    icon: LucideIcon;
  }[] = [
    {
      id: 'categories',
      label: 'Категорії',
      hint: 'Основний тип сесії',
      icon: Sparkles,
    },
    {
      id: 'moods',
      label: 'Настрій',
      hint: 'Словесний опис стану',
      icon: Heart,
    },
    { id: 'tags', label: 'Теги', hint: 'Контекст і наміри', icon: Tag },
    { id: 'places', label: 'Місця', hint: 'Конкретне місце', icon: MapPin },
    {
      id: 'locations',
      label: 'Локації',
      hint: 'Загальне оточення',
      icon: LocateFixed,
    },
    {
      id: 'positions',
      label: 'Пози',
      hint: 'Положення тіла',
      icon: PersonStanding,
    },
  ];
  const [group, setGroup] = useState<TaxonomyGroup>('categories');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [merging, setMerging] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const spec = groups.find((item) => item.id === group)!;
  const all = [...new Set([...baseTaxonomy[group], ...taxonomy[group]])];
  const active = all.filter((value) => !archived[group].includes(value));
  const visible = (showArchived ? archived[group] : active).filter((value) =>
    value.toLowerCase().includes(query.toLowerCase()),
  );
  const count = (value: string) =>
    entries.filter((entry) =>
      group === 'categories'
        ? entry.type === value
        : (entry[group] ?? []).includes(value),
    ).length;
  const add = () => {
    const value = draft.trim();
    if (
      !value ||
      all.some((item) => item.toLowerCase() === value.toLowerCase())
    )
      return;
    onAdd(group, value);
    setDraft('');
  };
  return (
    <section className="taxonomy-page">
      <div className="taxonomy-intro">
        <div>
          <span className="section-kicker">Порядок без зайвих зусиль</span>
          <h2>Конструктор сесії</h2>
          <p>
            Налаштуй категорії, настрій і контекст один раз — ці значення
            використовуватимуться у нових записах, деталях і статистиці.
          </p>
        </div>
        <div className="taxonomy-total">
          <FolderCog />
          <strong>{active.length}</strong>
          <span>активних значень</span>
        </div>
      </div>
      <div className="taxonomy-tabs" role="tablist">
        {groups.map((item) => (
          <button
            role="tab"
            aria-selected={group === item.id}
            className={group === item.id ? 'active' : ''}
            onClick={() => {
              setGroup(item.id);
              setEditing(null);
              setMerging(null);
            }}
            key={item.id}
          >
            <item.icon />
            <span>
              {item.label}
              <small>
                {
                  [
                    ...new Set([
                      ...baseTaxonomy[item.id],
                      ...taxonomy[item.id],
                    ]),
                  ].filter((value) => !archived[item.id].includes(value)).length
                }
              </small>
            </span>
          </button>
        ))}
      </div>
      <div className="taxonomy-surface">
        <div className="taxonomy-toolbar">
          <div>
            <span className="taxonomy-group-icon">
              <spec.icon />
            </span>
            <span>
              <strong>{spec.label}</strong>
              <small>{spec.hint}</small>
            </span>
          </div>
          <div className="taxonomy-tools">
            <label className="taxonomy-search">
              <Search />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Знайти…"
              />
            </label>
            <button
              className={showArchived ? 'active' : ''}
              onClick={() => setShowArchived((value) => !value)}
            >
              <Archive />
              {showArchived ? 'Активні' : 'Архів'}
              <span>{archived[group].length}</span>
            </button>
          </div>
        </div>
        {!showArchived && (
          <div className="taxonomy-add">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') add();
              }}
              placeholder={`Нова ${spec.label.toLowerCase().slice(0, -1)}…`}
              maxLength={40}
            />
            <Button onClick={add} disabled={!draft.trim()}>
              <Plus />
              Додати
            </Button>
          </div>
        )}
        <div className="taxonomy-list">
          {visible.map((value) => {
            const usage = count(value);
            return (
              <article
                key={value}
                className={editing === value || merging === value ? 'open' : ''}
              >
                {editing === value ? (
                  <div className="taxonomy-inline">
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(event) => setEditValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          onRename(group, value, editValue);
                          setEditing(null);
                        }
                        if (event.key === 'Escape') setEditing(null);
                      }}
                    />
                    <button
                      className="confirm"
                      aria-label={`Зберегти назву «${value}»`}
                      title="Зберегти назву"
                      onClick={() => {
                        onRename(group, value, editValue);
                        setEditing(null);
                      }}
                    >
                      <Check />
                      Зберегти
                    </button>
                    <button onClick={() => setEditing(null)} aria-label="Скасувати редагування" title="Скасувати">
                      <X />
                    </button>
                  </div>
                ) : merging === value ? (
                  <div className="taxonomy-inline merge-inline">
                    <span>
                      <Merge />
                      Об’єднати «{value}» з
                    </span>
                    <select
                      defaultValue=""
                      onChange={(event) => {
                        if (event.target.value) {
                          onMerge(group, value, event.target.value);
                          setMerging(null);
                        }
                      }}
                    >
                      <option value="" disabled>
                        Обери значення
                      </option>
                      {active
                        .filter((item) => item !== value)
                        .map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                    </select>
                    <button onClick={() => setMerging(null)} aria-label="Скасувати об’єднання" title="Скасувати">
                      <X />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="taxonomy-name">
                      <span>{value.slice(0, 1).toUpperCase()}</span>
                      <div>
                        <strong>{value}</strong>
                        <small>
                          {usage} {usage === 1 ? 'використання' : 'використань'}
                        </small>
                      </div>
                    </div>
                    <div className="taxonomy-actions">
                      {showArchived ? (
                        <button
                          className="restore"
                          onClick={() => onRestore(group, value)}
                          aria-label={`Відновити «${value}»`}
                          title="Відновити"
                        >
                          <RotateCcw />
                          Відновити
                        </button>
                      ) : (
                        <>
                          <button
                            aria-label={`Перейменувати «${value}»`}
                            title="Перейменувати"
                            onClick={() => {
                              setEditing(value);
                              setEditValue(value);
                            }}
                          >
                            <Edit3 />
                            <span>Назва</span>
                          </button>
                          <button
                            disabled={active.length < 2}
                            onClick={() => setMerging(value)}
                            aria-label={`Об’єднати «${value}» з іншим значенням`}
                            title="Об’єднати"
                          >
                            <Merge />
                            <span>Об’єднати</span>
                          </button>
                          <button onClick={() => onArchive(group, value)} aria-label={`Перемістити «${value}» в архів`} title="В архів">
                            <Archive />
                            <span>В архів</span>
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </article>
            );
          })}
          {!visible.length && (
            <div className="taxonomy-empty">
              <Archive />
              <strong>
                {showArchived ? 'Архів порожній' : 'Нічого не знайдено'}
              </strong>
              <span>
                {showArchived
                  ? 'Приховані значення з’являться тут.'
                  : 'Спробуй інший запит або створи нове значення.'}
              </span>
            </div>
          )}
        </div>
      </div>
      <aside className="taxonomy-note">
        <ShieldCheck />
        <div>
          <strong>Архів — це безпечно</strong>
          <span>
            Значення зникне з форми нової сесії, але залишиться у попередніх
            записах і статистиці. Його завжди можна відновити.
          </span>
        </div>
      </aside>
    </section>
  );
}

function SessionView({
  entry,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  entry: Entry;
  onBack: () => void;
  onEdit: (entry: Entry) => void;
  onDuplicate: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}) {
  const groups = [
    { label: 'Настрій', icon: Heart, values: entry.moods ?? [] },
    { label: 'Теги', icon: Tag, values: entry.tags },
    { label: 'Місця', icon: MapPin, values: entry.places ?? [] },
    { label: 'Пози', icon: PersonStanding, values: entry.positions ?? [] },
    { label: 'Локації', icon: LocateFixed, values: entry.locations ?? [] },
  ];
  return (
    <section className="session-page">
      <button className="session-back" onClick={onBack}>
        <ArrowLeft />
        До історії
      </button>
      <div className="session-page-head">
        <div>
          <span className="section-kicker">
            {new Intl.DateTimeFormat('uk-UA', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(new Date(entry.createdAt))}{' '}
            · {entry.time}
          </span>
          <h2>{entry.type}</h2>
          <p>
            Повний запис сесії. Тут можна перевірити деталі й виправити будь-яку
            помилку.
          </p>
        </div>
        <div className="session-actions">
          <Button onClick={() => onEdit(entry)}>
            <Edit3 />
            Редагувати
          </Button>
          <button onClick={() => onDuplicate(entry)}>
            <Copy />
            Дублювати
          </button>
          <button className="danger" onClick={() => onDelete(entry)}>
            <Trash2 />
            Видалити
          </button>
        </div>
      </div>
      <div className="session-metrics">
        <article>
          <div className="session-metric-head"><Clock3 /><span>Тривалість</span></div>
          <strong>{entry.duration} хв</strong>
        </article>
        <article>
          <div className="session-metric-head"><Star /><span>Задоволення</span></div>
          <strong>{entry.rating}/5</strong>
        </article>
        <article className="session-metric-mood">
          <div className="session-metric-head"><Heart /><span>Настрій</span></div>
          <strong>{entry.moods?.[0] ?? 'Не вказано'}</strong>
        </article>
        <article>
          <div className="session-metric-head"><Zap /><span>Оргазми</span></div>
          <strong>{entry.orgasms}</strong>
        </article>
      </div>
      <div className="session-detail-grid">
        {groups.map((group) => (
          <article key={group.label}>
            <div className="session-detail-title">
              <group.icon />
              <span>{group.label}</span>
            </div>
            {group.values.length ? (
              <div className="session-detail-chips">
                {group.values.map((value) => (
                  <span key={value}>{value}</span>
                ))}
              </div>
            ) : (
              <p>Не вказано</p>
            )}
          </article>
        ))}
      </div>
      <article className="session-note">
        <span className="section-kicker">Приватна нотатка</span>
        {entry.note ? (
          <p>«{entry.note}»</p>
        ) : (
          <p className="muted">Нотатку не додано.</p>
        )}
      </article>
      <div className="session-edit-callout">
        <div>
          <strong>Помітив неточність?</strong>
          <span>
            Усі поля можна змінити. Статистика та календар оновляться
            автоматично.
          </span>
        </div>
        <Button onClick={() => onEdit(entry)}>
          <Edit3 />
          Виправити запис
        </Button>
      </div>
    </section>
  );
}

function CalendarView({
  entries,
  openLog,
  onOpen,
}: {
  entries: Entry[];
  openLog: () => void;
  onOpen: (entry: Entry) => void;
}) {
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const month = new Date(
    today.getFullYear(),
    today.getMonth() + monthOffset,
    1,
  );
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysCount = new Date(year, monthIndex + 1, 0).getDate();
  const leading = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const dayEntries = (day: number) =>
    entries.filter((item) => {
      const date = new Date(item.createdAt);
      return (
        date.getFullYear() === year &&
        date.getMonth() === monthIndex &&
        date.getDate() === day
      );
    });
  const selectedEntries = dayEntries(selectedDay);
  return (
    <section className="calendar-layout">
      <article className="calendar-card">
        <div className="calendar-head">
          <button
            onClick={() => {
              setMonthOffset((value) => value - 1);
              setSelectedDay(1);
            }}
            aria-label="Попередній місяць"
          >
            <ChevronLeft />
          </button>
          <div>
            <span className="section-kicker">{year}</span>
            <h2>
              {new Intl.DateTimeFormat('uk-UA', { month: 'long' }).format(
                month,
              )}
            </h2>
          </div>
          <button
            onClick={() => {
              setMonthOffset((value) => value + 1);
              setSelectedDay(1);
            }}
            aria-label="Наступний місяць"
          >
            <ChevronRight />
          </button>
        </div>
        <div className="weekdays">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="month-grid">
          {Array.from({ length: leading }, (_, index) => (
            <span className="empty-day" key={`empty-${index}`} />
          ))}
          {Array.from({ length: daysCount }, (_, index) => {
            const day = index + 1;
            const sessions = dayEntries(day);
            const isToday =
              day === today.getDate() &&
              monthIndex === today.getMonth() &&
              year === today.getFullYear();
            return (
              <button
                key={day}
                className={`${selectedDay === day ? 'selected' : ''} ${isToday ? 'today' : ''} ${sessions.length ? 'has-session' : ''}`}
                onClick={() => setSelectedDay(day)}
                aria-label={`${day} число${sessions.length ? `, ${sessions.length} ${pluralUk(sessions.length, 'сесія', 'сесії', 'сесій')}` : ', без сесій'}`}
              >
                <span>{day}</span>
                {sessions.length > 0 && (
                  <div className="session-marks">
                    {sessions.slice(0, 3).map((item) => (
                      <i
                        key={item.id}
                        className={`mark-${item.type.toLowerCase()}`}
                      />
                    ))}
                    <b>{sessions.length}</b>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div className="calendar-legend">
          <span>
            <i className="mark-edging" /> Edging
          </span>
          <span>
            <i className="mark-швидка" /> Швидка
          </span>
          <span>
            <i className="mark-чуттєва" /> Чуттєва
          </span>
          <span>
            <i className="mark-звичайна" /> Звичайна
          </span>
        </div>
      </article>
      <aside className="day-panel">
        <div>
          <span className="section-kicker">Обраний день</span>
          <h3>
            {selectedDay}{' '}
            {new Intl.DateTimeFormat('uk-UA', { month: 'long' }).format(month)}
          </h3>
        </div>
        {selectedEntries.length ? (
          <div className="day-sessions">
            {selectedEntries.map((item) => (
              <button onClick={() => onOpen(item)} key={item.id}>
                <div className="history-icon">
                  <Heart />
                </div>
                <div>
                  <strong>{item.type}</strong>
                  <span>
                    {item.time} · {item.duration ?? 20} хв
                  </span>
                </div>
                <div className="mood-score">
                  {item.rating ?? 4}
                  <span>/5</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-day-state">
            <CalendarDays />
            <strong>Сесій не було</strong>
            <span>Порожній день — це теж частина твого природного ритму.</span>
          </div>
        )}
        <Button onClick={openLog}>
          <Plus /> Додати нову сесію
        </Button>
      </aside>
    </section>
  );
}

function GoalsView({
  entries,
  goals,
  openGoal,
  onEdit,
  onUpdate,
  onDelete,
}: {
  entries: Entry[];
  goals: Goal[];
  openGoal: () => void;
  onEdit: (goal: Goal) => void;
  onUpdate: (id: string, patch: Partial<Goal>) => void;
  onDelete: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const now = Date.now();
  const periodInfo: Record<GoalPeriod, { days: number; label: string }> = {
    day: { days: 1, label: 'день' },
    week: { days: 7, label: 'тиждень' },
    fortnight: { days: 14, label: '2 тижні' },
    threeWeeks: { days: 21, label: '3 тижні' },
    month: { days: 30, label: 'місяць' },
  };
  const calculate = (goal: Goal, previous = false) => {
    const days = periodInfo[goal.period].days,
      start = now - (previous ? days * 2 : days) * 86400000,
      end = now - (previous ? days : 0) * 86400000;
    const source = entries.filter((item) => {
      const stamp = new Date(item.createdAt).getTime();
      return (
        stamp >= start &&
        stamp < end &&
        (!goal.category || item.type === goal.category) &&
        (!goal.tag || item.tags.includes(goal.tag))
      );
    });
    const value =
      goal.metric === 'minutes'
        ? source.reduce((sum, item) => sum + (item.duration ?? 20), 0)
        : goal.metric === 'rating'
          ? source.length
            ? source.reduce((sum, item) => sum + (item.rating ?? 4), 0) /
              source.length
            : 0
          : source.length;
    return {
      source,
      value: goal.metric === 'rating' ? Number(value.toFixed(1)) : value,
    };
  };
  const selected = goals.find((item) => item.id === selectedId) ?? null;
  const active = goals.filter((item) => item.status === 'active').length,
    completed = goals.filter((item) => item.status === 'completed').length,
    paused = goals.filter((item) => item.status === 'paused').length;
  const unit = (goal: Goal) =>
    goal.metric === 'minutes'
      ? 'хв'
      : goal.metric === 'rating'
        ? '/ 5'
        : 'сесій';
  const statusFor = (goal: Goal, value: number) => {
    if (goal.status === 'paused') return { tone: 'paused', label: 'На паузі' };
    if (goal.status === 'completed')
      return { tone: 'done', label: 'Завершено' };
    const reached =
      goal.rule === 'atLeast' ? value >= goal.target : value <= goal.target;
    return reached
      ? {
          tone: 'good',
          label: goal.rule === 'atLeast' ? 'Досягнуто' : 'У межах',
        }
      : {
          tone: 'attention',
          label: goal.rule === 'atMost' ? 'Ліміт перевищено' : 'У процесі',
        };
  };
  return (
    <section className="goals-page">
      <section className="goals-lead">
        <div>
          <span className="section-kicker">Наміри замість тиску</span>
          <h2>Цілі, які працюють разом із твоїм ритмом.</h2>
          <p>
            Обери бажану зміну, кількість і період. Ми самі порахуємо прогрес та
            покажемо контекст.
          </p>
        </div>
        <Button onClick={openGoal}>
          <Plus />
          Створити ціль
        </Button>
      </section>
      <div className="goal-overview">
        <article>
          <Target />
          <span>
            <strong>{active}</strong>активні
          </span>
        </article>
        <article>
          <Check />
          <span>
            <strong>{completed}</strong>завершені
          </span>
        </article>
        <article>
          <Pause />
          <span>
            <strong>{paused}</strong>на паузі
          </span>
        </article>
        <p>
          <ShieldCheck />
          Прогрес — це інформація, а не оцінка тебе.
        </p>
      </div>
      <div className="goals-workspace">
        <section className="goals-grid">
          {goals.map((goal, index) => {
            const { value } = calculate(goal),
              display = goal.metric === 'rating' ? value.toFixed(1) : value;
            const raw = Math.round((value / goal.target) * 100),
              progress = Math.min(100, raw),
              state = statusFor(goal, value);
            return (
              <article
                className={`goal-card-large ${state.tone} ${selectedId === goal.id ? 'selected' : ''}`}
                key={goal.id}
              >
                <button
                  className="goal-card-main"
                  onClick={() =>
                    setSelectedId(selectedId === goal.id ? null : goal.id)
                  }
                >
                  <div className="goal-card-top">
                    <span className={`goal-symbol tone-${index % 3}`}>
                      <Target />
                    </span>
                    <div>
                      <span>
                        {goal.rule === 'atLeast' ? 'Щонайменше' : 'Не частіше'}{' '}
                        · {periodInfo[goal.period].label}
                      </span>
                      <h3>{goal.title}</h3>
                    </div>
                    <span className={`goal-status ${state.tone}`}>
                      {state.label}
                    </span>
                  </div>
                  <div className="goal-big-number">
                    <strong>{display}</strong>
                    <span>
                      {goal.rule === 'atLeast' ? '/' : 'із ліміту'}{' '}
                      {goal.target} {unit(goal)}
                    </span>
                  </div>
                  <div className="goal-line">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <div className="goal-card-bottom">
                    <span>
                      {goal.category || goal.tag ? (
                        <>
                          <Tag />
                          {[goal.category, goal.tag]
                            .filter(Boolean)
                            .join(' · ')}
                        </>
                      ) : goal.metric === 'rating' ? (
                        'Середнє за записами'
                      ) : (
                        'Усі сесії'
                      )}
                    </span>
                    <span>
                      {raw}% {goal.rule === 'atLeast' ? 'цілі' : 'ліміту'}
                    </span>
                  </div>
                </button>
                <button
                  className="goal-more"
                  onClick={() => setMenuId(menuId === goal.id ? null : goal.id)}
                  aria-label="Дії з ціллю"
                >
                  <MoreHorizontal />
                </button>
                {menuId === goal.id && (
                  <div className="goal-menu">
                    <button
                      onClick={() => {
                        onEdit(goal);
                        setMenuId(null);
                      }}
                    >
                      <Edit3 />
                      Редагувати
                    </button>
                    <button
                      onClick={() => {
                        onUpdate(goal.id, {
                          status:
                            goal.status === 'paused' ? 'active' : 'paused',
                        });
                        setMenuId(null);
                      }}
                    >
                      {goal.status === 'paused' ? <Play /> : <Pause />}
                      {goal.status === 'paused'
                        ? 'Продовжити'
                        : 'Поставити на паузу'}
                    </button>
                    <button
                      onClick={() => {
                        onUpdate(goal.id, { status: 'completed' });
                        setMenuId(null);
                      }}
                    >
                      <Check />
                      Завершити
                    </button>
                    <button
                      className="danger"
                      onClick={() => onDelete(goal.id)}
                    >
                      <Trash2 />
                      Видалити
                    </button>
                  </div>
                )}
              </article>
            );
          })}
          <button className="new-goal-card" onClick={openGoal}>
            <span>
              <Plus />
            </span>
            <strong>Нова особиста ціль</strong>
            <small>Створи власний орієнтир</small>
          </button>
        </section>
        {selected &&
          (() => {
            const current = calculate(selected),
              previous = calculate(selected, true),
              delta = current.value - previous.value,
              state = statusFor(selected, current.value);
            return (
              <section className="goal-detail">
                <div className="goal-detail-head">
                  <div>
                    <span className="section-kicker">Деталі цілі</span>
                    <h3>{selected.title}</h3>
                    <p>
                      {selected.rule === 'atLeast'
                        ? 'Прагнемо щонайменше'
                        : 'Тримаємо не більше'}{' '}
                      {selected.target} {unit(selected)} за{' '}
                      {periodInfo[selected.period].label}.
                    </p>
                  </div>
                  <div>
                    <span className={`goal-status ${state.tone}`}>
                      {state.label}
                    </span>
                    <button onClick={() => onEdit(selected)}>
                      <Edit3 />
                      Редагувати
                    </button>
                  </div>
                </div>
                <div className="goal-detail-kpis">
                  <article>
                    <span>Поточне значення</span>
                    <strong>
                      {selected.metric === 'rating'
                        ? current.value.toFixed(1)
                        : current.value}
                      <small> {unit(selected)}</small>
                    </strong>
                  </article>
                  <article>
                    <span>Попередній період</span>
                    <strong>
                      {selected.metric === 'rating'
                        ? previous.value.toFixed(1)
                        : previous.value}
                      <small> {unit(selected)}</small>
                    </strong>
                  </article>
                  <article>
                    <span>Зміна</span>
                    <strong className={delta >= 0 ? 'up' : 'down'}>
                      {delta > 0 ? '+' : ''}
                      {selected.metric === 'rating' ? delta.toFixed(1) : delta}
                      <small> {unit(selected)}</small>
                    </strong>
                  </article>
                </div>
                <div className="goal-linked">
                  <div>
                    <span className="section-kicker">Пов’язані записи</span>
                    <strong>{current.source.length} за поточний період</strong>
                  </div>
                  {current.source.length ? (
                    <div>
                      {current.source.slice(0, 5).map((item) => (
                        <article key={item.id}>
                          <span className="goal-linked-icon">
                            <Heart />
                          </span>
                          <div>
                            <strong>{item.type}</strong>
                            <small>
                              {formatDay(item.createdAt)} · {item.duration} хв
                              {item.tags.length
                                ? ` · ${item.tags.join(', ')}`
                                : ''}
                            </small>
                          </div>
                          <b>{item.rating}/5</b>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p>
                      Щойно з’явиться відповідна сесія, вона автоматично
                      потрапить сюди.
                    </p>
                  )}
                </div>
              </section>
            );
          })()}
      </div>
    </section>
  );
}

function InsightsView({
  entries,
  focus,
  onFocus,
  categoryFocus,
  onCategoryFocus,
}: {
  entries: Entry[];
  focus: StatFocus | null;
  onFocus: (focus: StatFocus | null) => void;
  categoryFocus: string | null;
  onCategoryFocus: (category: string | null) => void;
}) {
  const [range, setRange] = useState(30);
  const [showMoreInsights, setShowMoreInsights] = useState(false);
  const rangeOptions = [
    { value: 7, label: 'Тиждень' },
    { value: 30, label: 'Місяць' },
    { value: 90, label: '3 місяці' },
    { value: 365, label: 'Рік' },
  ];
  const [heatMetric, setHeatMetric] = useState<'count' | 'rating'>(
    'count',
  );
  const periodEntries = entries.filter(
    (item) =>
      Date.now() - new Date(item.createdAt).getTime() <= range * 86400000,
  );
  const scoped = categoryFocus ? periodEntries.filter((item) => item.type === categoryFocus) : periodEntries;
  const hasReliableSample = scoped.length >= 5;
  const totalMinutes = scoped.reduce(
    (sum, item) => sum + (item.duration ?? 20),
    0,
  );
  const avgDuration = scoped.length
    ? Math.round(totalMinutes / scoped.length)
    : 0;
  const avgRating = scoped.length
    ? (
        scoped.reduce((sum, item) => sum + (item.rating ?? 4), 0) /
        scoped.length
      ).toFixed(1)
    : '0.0';
  const totalOrgasms = scoped.reduce(
    (sum, item) => sum + (item.orgasms ?? 1),
    0,
  );
  const seriesBuckets = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (range <= 30) {
      return Array.from({ length: range }, (_, index) => {
        const start = new Date(today);
        start.setDate(start.getDate() - (range - 1 - index));
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return { start, end };
      });
    }
    if (range <= 90) {
      return Array.from({ length: 13 }, (_, index) => {
        const end = new Date(today);
        end.setDate(end.getDate() - (12 - index) * 7 + 1);
        const start = new Date(end);
        start.setDate(start.getDate() - 7);
        return { start, end };
      });
    }
    return Array.from({ length: 12 }, (_, index) => {
      const start = new Date(today.getFullYear(), today.getMonth() - (11 - index), 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      return { start, end };
    });
  })();
  const series = seriesBuckets.map(({ start, end }) => {
    const matches = scoped.filter((item) => {
      const createdAt = new Date(item.createdAt).getTime();
      return createdAt >= start.getTime() && createdAt < end.getTime();
    });
    return {
      day:
        range >= 365
          ? new Intl.DateTimeFormat('uk-UA', { month: 'short' }).format(start)
          : new Intl.DateTimeFormat('uk-UA', {
              day: 'numeric',
              month: range > 30 ? 'short' : undefined,
            }).format(start),
      sessions: matches.length,
      minutes: matches.reduce((sum, item) => sum + (item.duration ?? 20), 0),
      duration: matches.length
        ? Math.round(
            matches.reduce((sum, item) => sum + item.duration, 0) /
              matches.length,
          )
        : 0,
      orgasms: matches.reduce((sum, item) => sum + item.orgasms, 0),
      rating: matches.length
        ? Number(
            (
              matches.reduce((sum, item) => sum + item.rating, 0) /
              matches.length
            ).toFixed(1),
          )
        : 0,
    };
  });
  const categoryNames = Array.from(new Set(periodEntries.map((item) => item.type)));
  const categoryColors = ['#91a83b', '#8f5bd7', '#f2ad31', '#ff6746'];
  const categoryData = categoryNames
    .map((name, index) => ({
      name,
      value: periodEntries.filter((item) => item.type === name).length,
      color: categoryColors[index % categoryColors.length],
    }))
    .filter((item) => item.value);
  const dayParts = [
    { name: 'Ніч', range: '00–06', start: 0, end: 6 },
    { name: 'Ранок', range: '06–12', start: 6, end: 12 },
    { name: 'День', range: '12–18', start: 12, end: 18 },
    { name: 'Вечір', range: '18–24', start: 18, end: 24 },
  ];
  const timeData = dayParts.map((part) => {
    const matches = scoped.filter((item) => {
      const hour = Number(item.time.split(':')[0]);
      return hour >= part.start && hour < part.end;
    });
    return {
      ...part,
      value: matches.length,
      share: Math.round((matches.length / Math.max(scoped.length, 1)) * 100),
      avgRating: matches.length
        ? matches.reduce((sum, item) => sum + (item.rating ?? 4), 0) /
          matches.length
        : 0,
      avgDuration: matches.length
        ? Math.round(
            matches.reduce((sum, item) => sum + (item.duration ?? 20), 0) /
              matches.length,
          )
        : 0,
      orgasms: matches.reduce((sum, item) => sum + (item.orgasms ?? 0), 0),
    };
  });
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const matches = scoped.filter(
      (item) => Number(item.time.split(':')[0]) === hour,
    );
    return {
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      count: matches.length,
      avgRating: matches.length
        ? matches.reduce((sum, item) => sum + (item.rating ?? 4), 0) /
          matches.length
        : 0,
    };
  });
  const peakHour = hourlyData.reduce((best, item) =>
    item.count > best.count ? item : best,
  );
  const dominantDayPart = [...timeData].sort(
    (a, b) => b.value - a.value || b.avgRating - a.avgRating,
  )[0];
  const ratingData = [5, 4, 3, 2, 1].map((rating) => ({
    rating: `${rating} ★`,
    value: scoped.filter((item) => (item.rating ?? 4) === rating).length,
  }));
  const radarData = [
    { axis: 'Частота', value: Math.min(100, scoped.length * 14) },
    { axis: 'Тривалість', value: Math.min(100, avgDuration * 2.2) },
    { axis: 'Оцінка', value: Number(avgRating) * 20 },
    { axis: 'Оргазми', value: Math.min(100, totalOrgasms * 14) },
    {
      axis: 'Без екранів',
      value: Math.min(
        100,
        scoped.filter((item) => item.tags.includes('Без екранів')).length * 25,
      ),
    },
  ];
  const heatDays = Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    return {
      date,
      count: entries.filter(
        (item) =>
          new Date(item.createdAt).toDateString() === date.toDateString(),
      ).length,
    };
  });
  const activeDays = heatDays.filter((item) => item.count).length;
  const best = [...scoped].sort((a, b) => (b.rating ?? 4) - (a.rating ?? 4))[0];
  const summarizeContext = (
    readValues: (entry: Entry) => string[] | undefined,
  ) => {
    const values = new Map<string, { count: number; ratingTotal: number }>();
    scoped.forEach((entry) => {
      [...new Set(readValues(entry) ?? [])].forEach((value) => {
        if (!value) return;
        const current = values.get(value) ?? { count: 0, ratingTotal: 0 };
        values.set(value, {
          count: current.count + 1,
          ratingTotal: current.ratingTotal + (entry.rating ?? 4),
        });
      });
    });
    return [...values.entries()]
      .map(([label, value]) => ({
        label,
        count: value.count,
        share: Math.round((value.count / Math.max(scoped.length, 1)) * 100),
        rating: value.ratingTotal / value.count,
      }))
      .sort((a, b) => b.count - a.count || b.rating - a.rating)
      .slice(0, 5);
  };
  const contextGroups = [
    { label: 'Настрій', title: 'Твій стан', icon: Heart, items: summarizeContext((entry) => entry.moods) },
    { label: 'Місця', title: 'Де саме', icon: MapPin, items: summarizeContext((entry) => entry.places) },
    { label: 'Локації', title: 'Загальний контекст', icon: LocateFixed, items: summarizeContext((entry) => entry.locations) },
    { label: 'Пози', title: 'Що обираєш', icon: PersonStanding, items: summarizeContext((entry) => entry.positions) },
    { label: 'Теги', title: 'Що супроводжує', icon: Tag, items: summarizeContext((entry) => entry.tags) },
  ];
  const heatRows = ['00–06', '06–12', '12–18', '18–24'];
  const heatCols = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
  const heatValues = heatRows.flatMap((_, period) =>
    heatCols.map((__, day) => {
      const matches = scoped.filter((item) => {
        const date = new Date(item.createdAt),
          hour = Number(item.time.split(':')[0]);
        return (
          (date.getDay() + 6) % 7 === day &&
          Math.min(3, Math.floor(hour / 6)) === period
        );
      });
      const value =
        heatMetric === 'count'
          ? matches.length
          : matches.reduce((sum, item) => sum + item.rating, 0) /
            Math.max(1, matches.length);
      return { matches, value };
    }),
  );
  const heatMax = Math.max(
    ...heatValues.map((item) => Math.abs(item.value)),
    1,
  );
  const durationBands = [
    { label: 'до 10 хв', min: 0, max: 10 },
    { label: '11–20 хв', min: 11, max: 20 },
    { label: '21–35 хв', min: 21, max: 35 },
    { label: '36+ хв', min: 36, max: 999 },
  ].map((band) => {
    const matches = scoped.filter(
      (item) => item.duration >= band.min && item.duration <= band.max,
    );
    return {
      ...band,
      count: matches.length,
      avg: matches.length
        ? matches.reduce((sum, item) => sum + item.rating, 0) / matches.length
        : 0,
    };
  });
  const factorMap = new Map<
    string,
    { label: string; sum: number; count: number; example: Entry }
  >();
  scoped.forEach((item) => {
    const values = [
      item.type,
      ...item.tags,
      ...(item.places ?? []),
      ...(item.positions ?? []),
      ...(item.locations ?? []),
      ...(item.moods ?? []),
    ];
    values.forEach((label) => {
      const old = factorMap.get(label) ?? {
        label,
        sum: 0,
        count: 0,
        example: item,
      };
      factorMap.set(label, {
        ...old,
        sum: old.sum + item.rating,
        count: old.count + 1,
        example: item,
      });
    });
  });
  const formula = [...factorMap.values()]
    .map((item) => ({ ...item, avg: item.sum / item.count }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count)
    .slice(0, 3);
  const previousScoped = entries.filter((item) => {
    const age = Date.now() - new Date(item.createdAt).getTime();
    return age > range * 86400000 && age <= range * 2 * 86400000;
  });
  const metricValue = (metric: StatFocus, items: Entry[]) =>
    metric === 'sessions'
      ? items.length
      : metric === 'duration'
        ? items.length
          ? items.reduce((sum, item) => sum + item.duration, 0) / items.length
          : 0
        : metric === 'orgasms'
          ? items.reduce((sum, item) => sum + item.orgasms, 0)
          : items.length
            ? items.reduce((sum, item) => sum + item.rating, 0) / items.length
            : 0;
  const dayPartMetricValue = (metric: StatFocus, part: (typeof timeData)[number]) =>
    metric === 'sessions'
      ? part.value
      : metric === 'duration'
        ? part.avgDuration
        : metric === 'orgasms'
          ? part.orgasms
          : part.avgRating;
  const focusMeta: Record<
    StatFocus,
    {
      title: string;
      kicker: string;
      unit: string;
      description: string;
      color: string;
    }
  > = {
    sessions: {
      title: 'Як змінюється частота',
      kicker: 'Соло-сесії',
      unit: 'сес.',
      description: 'Кількість записаних сесій за обраний період.',
      color: '#ff6746',
    },
    duration: {
      title: 'Твоя середня тривалість',
      kicker: 'Середній час',
      unit: 'хв',
      description: 'Середня тривалість однієї сесії, а не сума всього часу.',
      color: '#91a83b',
    },
    orgasms: {
      title: 'Динаміка оргазмів',
      kicker: 'Оргазми',
      unit: '',
      description:
        'Загальна кількість та її співвідношення до кількості сесій.',
      color: '#8f5bd7',
    },
    rating: {
      title: 'Як змінюється задоволення',
      kicker: 'Задоволення',
      unit: '/5',
      description:
        'Середня оцінка записаних сесій. Це спостереження, а не ціль.',
      color: '#f2ad31',
    },
  };
  return (
    <>
      <section className="stats-hero">
        <div>
          <span className="section-kicker">Твій сольний профіль</span>
          <h2>Детальна статистика</h2>
          <p>
            Патерни, які допомагають краще розуміти себе — без оцінок і
            моралізаторства.
          </p>
        </div>
        <div className="range-switch" aria-label="Період статистики">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setRange(option.value)}
              className={range === option.value ? 'active' : ''}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
      {categoryFocus && <section className="category-focus-banner" aria-live="polite"><div><span>Фільтр</span><strong>{categoryFocus}</strong><small>{scoped.length} {pluralUk(scoped.length, 'сесія', 'сесії', 'сесій')} за {range} днів</small></div><button onClick={() => onCategoryFocus(null)}><X /><span>Скинути фільтр</span></button></section>}
      <section className="stats-kpis">
        <article>
          <span>
            <Activity />
            Сесії
          </span>
          <strong>{scoped.length}</strong>
          <small>за обраний період</small>
        </article>
        <article>
          <span>
            <Clock3 />
            Усього часу
          </span>
          <strong>
            {totalMinutes >= 60 && <>{Math.floor(totalMinutes / 60)}<em>&nbsp;г</em>{' '}</>}
            {totalMinutes % 60}<em>&nbsp;хв</em>
          </strong>
          <small>сер. {avgDuration} хв / сесія</small>
        </article>
        <article>
          <span>
            <Zap />
            Оргазми
          </span>
          <strong>{totalOrgasms}</strong>
          <small>
            {scoped.length ? (totalOrgasms / scoped.length).toFixed(1) : 0} на
            сесію
          </small>
        </article>
        <article>
          <span>
            <Star />
            Задоволення
          </span>
          <strong>
            {avgRating}
            <em>/5</em>
          </strong>
          <small>середня оцінка</small>
        </article>
        <article>
          <span>
            <Flame />
            Серія
          </span>
          <strong>
            2<em> дні</em>
          </strong>
          <small>найкраща — 4 дні</small>
        </article>
      </section>
      <section className="records-row records-row-summary">
        <article>
          <span className="record-icon">
            <Clock3 />
          </span>
          <div>
            <small>Найдовша сесія</small>
            <strong>
              {Math.max(...scoped.map((item) => item.duration ?? 20), 0)} хв
            </strong>
          </div>
        </article>
        <article>
          <span className="record-icon coral">
            <Star />
          </span>
          <div>
            <small>Найкраща оцінка</small>
            <strong>
              {best?.rating ?? 0}/5 · {best?.type ?? '—'}
            </strong>
          </div>
        </article>
        <article>
          <span className="record-icon lime">
            <Zap />
          </span>
          <div>
            <small>Найчастіший тег</small>
            <strong>
              {scoped.flatMap((item) => item.tags)[0] ?? 'Ще немає'}
            </strong>
          </div>
        </article>
      </section>
      {focus &&
        (() => {
          const meta = focusMeta[focus],
            current = metricValue(focus, scoped),
            previous = metricValue(focus, previousScoped),
            delta = current - previous,
            focusSeries = series.map((item) => ({
              day: item.day,
              value: item[focus],
            }));
          return (
            <section className="metric-drilldown">
              <div className="metric-drilldown-head">
                <div>
                  <span className="section-kicker">{meta.kicker}</span>
                  <h3>{meta.title}</h3>
                  <p>{meta.description}</p>
                </div>
                <button
                  onClick={() => onFocus(null)}
                  aria-label="Закрити детальну статистику"
                >
                  <X />
                </button>
              </div>
              <div className="metric-drilldown-body">
                <div className="metric-primary">
                  <span>За {range} днів</span>
                  <strong>
                    {focus === 'duration' || focus === 'rating'
                      ? current.toFixed(1)
                      : current}
                    <small>{meta.unit}</small>
                  </strong>
                  <p className={delta >= 0 ? 'up' : 'down'}>
                    {delta >= 0 ? '↑' : '↓'}{' '}
                    {Math.abs(delta).toFixed(
                      focus === 'duration' || focus === 'rating' ? 1 : 0,
                    )}{' '}
                    {meta.unit} до попереднього періоду
                  </p>
                </div>
                <ChartContainer
                  config={{ value: { label: meta.kicker, color: meta.color } }}
                  className="metric-focus-chart"
                >
                  <AreaChart
                    data={focusSeries}
                    margin={{ left: -25, right: 8, top: 12, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="focusFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={meta.color}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={meta.color}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#e7e7df" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      fontSize={10}
                    />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={meta.color}
                      strokeWidth={3}
                      fill="url(#focusFill)"
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
              <div className="metric-time-context">
                <div className="metric-time-context-head">
                  <span><Clock3 /> За часом доби</span>
                  <small>той самий показник у різні періоди дня</small>
                </div>
                <div className="metric-time-context-grid">
                  {timeData.map((part) => {
                    const value = dayPartMetricValue(focus, part);
                    return (
                      <div key={part.name} className={part.name === dominantDayPart.name ? 'active' : ''}>
                        <span>{part.name}<small>{part.range}</small></span>
                        <strong>
                          {focus === 'rating' ? value.toFixed(1) : value}
                          <small>{meta.unit}</small>
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })()}
      <section className="stats-grid-main">
        <article className="analytics-card trend-card">
          <div className="analytics-head">
            <div>
              <span className="section-kicker">Динаміка</span>
              <h3>Сесії та тривалість</h3>
            </div>
            <div className="chart-key">
              <span>
                <i className="lime" />
                хвилини
              </span>
              <span>
                <i className="coral" />
                сесії
              </span>
            </div>
          </div>
          <ChartContainer
            config={{
              minutes: { label: 'Хвилини', color: '#9db52e' },
              sessions: { label: 'Сесії', color: '#ff6746' },
            }}
            className="trend-chart"
          >
            <AreaChart
              data={series}
              margin={{ left: -22, right: 8, top: 16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="minutesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9db52e" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#9db52e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e7e7df" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                fontSize={9}
              />
              <YAxis axisLine={false} tickLine={false} fontSize={9} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="#82961e"
                strokeWidth={2.5}
                fill="url(#minutesFill)"
              />
              <Bar
                dataKey="sessions"
                fill="#ff6746"
                radius={[5, 5, 0, 0]}
                barSize={9}
              />
            </AreaChart>
          </ChartContainer>
        </article>
        <article className="analytics-card radar-card balance-card">
          <div className="analytics-head">
            <div>
              <span className="section-kicker">Баланс</span>
              <h3>Профіль звички</h3>
            </div>
            <span className="trend-badge">5 вимірів</span>
          </div>
          {hasReliableSample ? (
            <ChartContainer
              config={{ value: { label: 'Баланс', color: '#ff6746' } }}
              className="radar-chart"
            >
              <RadarChart data={radarData} outerRadius="68%">
                <PolarGrid stroke="#dfe0d8" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fontSize: 9, fill: '#6f7773' }}
                />
                <Radar
                  dataKey="value"
                  stroke="#ff6746"
                  fill="#ff6746"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ChartContainer>
          ) : (
            <div className="data-confidence-state">
              <ShieldCheck />
              <strong>Профіль ще формується</strong>
              <span>
                Є {scoped.length} із 5 потрібних записів. До цього моменту не
                робимо сильних висновків із випадкових збігів.
              </span>
              <i><b style={{ width: `${Math.min(100, scoped.length * 20)}%` }} /></i>
            </div>
          )}
        </article>
        <article className="analytics-card rhythm-card">
          <div className="rhythm-heading">
            <div>
              <span className="section-kicker">
                <CalendarDays />
                Ритм активності · 30 днів
              </span>
              <h3>Твоя жива послідовність</h3>
            </div>
            <div className="rhythm-summary">
              <span className="streak-count">
                <Flame />2 дні поспіль
              </span>
              <strong>
                {activeDays}
                <small> / 30 днів</small>
              </strong>
            </div>
          </div>
          <div className="rhythm-strip">
            {heatDays.map((item, index) => (
              <span
                key={index}
                className={item.count ? `level-${Math.min(item.count, 3)}` : ''}
                title={`${item.date.toLocaleDateString('uk-UA')}: ${item.count} сес.`}
              >
                <b>{item.date.getDate()}</b>
              </span>
            ))}
          </div>
          <p className="rhythm-caption">
            Заповнений день означає хоча б одну сесію. Власні межі та наміри
            налаштовуються на екрані «Цілі».
          </p>
        </article>
      </section>
      <section className="stats-grid-secondary">
        <article className="analytics-card category-style-card">
          <div className="analytics-head">
            <div>
              <span className="section-kicker">Категорії</span>
              <h3>Твій стиль</h3>
              {categoryFocus && <small>«{categoryFocus}» виділено серед усіх сесій</small>}
            </div>
          </div>
          <div className="donut-wrap">
            <ChartContainer
              config={{ value: { label: 'Сесії', color: '#ff6746' } }}
              className="donut-chart"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={3}
                >
                  {categoryData.map((item) => (
                    <Cell key={item.name} fill={item.color} opacity={categoryFocus && item.name !== categoryFocus ? .28 : 1} stroke={item.name === categoryFocus ? '#192421' : 'transparent'} strokeWidth={item.name === categoryFocus ? 2 : 0} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="donut-center">
              <strong>{periodEntries.length}</strong>
              <span>сесій</span>
            </div>
            <div className="donut-legend">
              {categoryData.map((item) => (
                <div key={item.name} className={item.name === categoryFocus ? 'active' : ''}>
                  <span>
                    <i style={{ background: item.color }} />
                    {item.name}
                  </span>
                  <strong>
                    {Math.round(
                      (item.value / Math.max(periodEntries.length, 1)) * 100,
                    )}
                    %
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </article>
        <article className="analytics-card day-cycle-card">
          <div className="analytics-head">
            <div>
              <span className="section-kicker">Добовий ритм</span>
              <h3>Коли виникає активність</h3>
            </div>
            {scoped.length > 0 && <span className="trend-badge">пік · {peakHour.label}</span>}
          </div>
          <p className="module-period">Дані за вибрані {range} днів</p>
          <div className="day-cycle-content">
            <div className="day-cycle-chart" aria-label="Розподіл активності протягом доби">
              {hourlyData.map((item) => (
                <div key={item.hour} title={`${item.label}: ${item.count} ${pluralUk(item.count, 'сесія', 'сесії', 'сесій')}`}>
                  <i
                    style={{
                      height: `${Math.max(
                        item.count ? 18 : 5,
                        (item.count / Math.max(...hourlyData.map((hour) => hour.count), 1)) * 100,
                      )}%`,
                    }}
                  />
                  {[0, 6, 12, 18, 23].includes(item.hour) && (
                    <small>{item.hour === 23 ? '24' : String(item.hour).padStart(2, '0')}</small>
                  )}
                </div>
              ))}
            </div>
            <div className="day-part-grid">
              {timeData.map((item) => (
                <div key={item.name} className={item.name === dominantDayPart.name && item.value ? 'active' : ''}>
                  <div>
                    <span>{item.name}</span>
                    <small>{item.range}</small>
                  </div>
                  <strong>{item.share}%</strong>
                  <small>{item.value === 1 ? '1 сесія' : `${item.value} сесій`} · {item.value ? `Ø ${item.avgDuration} хв · ${item.avgRating.toFixed(1)}/5` : 'немає даних'}</small>
                </div>
              ))}
            </div>
          </div>
          <div className="micro-insight">
            <Sparkles />
            <span>
              <strong>
                {scoped.length
                  ? `${hasReliableSample ? dominantDayPart.name : 'Ранній сигнал'} — ${hasReliableSample ? 'найчастіший період' : dominantDayPart.name.toLowerCase()}`
                  : 'Твій добовий патерн ще формується'}
              </strong>
              {scoped.length
                ? `${dominantDayPart.value} ${pluralUk(dominantDayPart.value, 'сесія', 'сесії', 'сесій')}, середня оцінка ${dominantDayPart.avgRating.toFixed(1)}/5. ${hasReliableSample ? 'Це тенденція' : 'Поки даних замало для висновку'} за вибрані ${range} днів.`
                : 'Після першого запису тут з’явиться розподіл за часом доби.'}
            </span>
          </div>
        </article>
        <article className="analytics-card rating-distribution-card">
          <div className="analytics-head">
            <div>
              <span className="section-kicker">Якість</span>
              <h3>Розподіл оцінок</h3>
            </div>
            <strong className="avg-badge">Ø {avgRating}</strong>
          </div>
          <div className="rating-bars">
            {ratingData.map((item) => (
              <div key={item.rating}>
                <span>{item.rating}</span>
                <div>
                  <i
                    style={{
                      width: `${(item.value / Math.max(...ratingData.map((x) => x.value), 1)) * 100}%`,
                    }}
                  />
                </div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
      <section className="context-analysis-section">
        <div className="context-analysis-head">
          <div>
            <span className="section-kicker">Контекст сесій</span>
            <h3>Що впливає на твій досвід</h3>
          </div>
          <p>Частота показує звичний вибір, а оцінка — як ти оцінив ці сесії.</p>
        </div>
        <div className="context-analysis-grid">
          {contextGroups.map((group) => {
            const ContextIcon = group.icon;
            const maximum = Math.max(...group.items.map((item) => item.count), 1);
            return (
              <article className="context-analysis-card" key={group.label}>
                <div className="context-card-head">
                  <span><ContextIcon /></span>
                  <div>
                    <small>{group.label}</small>
                    <strong>{group.title}</strong>
                  </div>
                </div>
                {group.items.length ? (
                  <div className="context-ranking">
                    {group.items.slice(0, 3).map((item) => (
                      <div key={item.label}>
                        <div className="context-ranking-copy">
                          <strong>{item.label}</strong>
                          <span>{item.count} {item.count === 1 ? 'сесія' : item.count < 5 ? 'сесії' : 'сесій'} · {item.share}%</span>
                        </div>
                        <div className="context-ranking-score">
                          <i><b style={{ width: `${(item.count / maximum) * 100}%` }} /></i>
                          <strong>{item.rating.toFixed(1)}<small>/5</small></strong>
                        </div>
                      </div>
                    ))}
                    {group.items.length > 3 && (
                      <details className="context-ranking-more">
                        <summary>
                          Показати ще {group.items.length - 3}
                          <ChevronRight />
                        </summary>
                        <div>
                          {group.items.slice(3).map((item) => (
                            <div className="context-ranking-extra" key={item.label}>
                              <div className="context-ranking-copy">
                                <strong>{item.label}</strong>
                                <span>{item.count} {item.count === 1 ? 'сесія' : item.count < 5 ? 'сесії' : 'сесій'} · {item.share}%</span>
                              </div>
                              <div className="context-ranking-score">
                                <i><b style={{ width: `${(item.count / maximum) * 100}%` }} /></i>
                                <strong>{item.rating.toFixed(1)}<small>/5</small></strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ) : (
                  <div className="context-empty">Ще немає даних за цей період</div>
                )}
              </article>
            );
          })}
        </div>
      </section>
      <button
        className="insights-disclosure"
        onClick={() => setShowMoreInsights((value) => !value)}
        aria-expanded={showMoreInsights}
      >
        <span>
          <Sparkles />
          <strong>{showMoreInsights ? 'Сховати деталі' : 'Показати більше деталей'}</strong>
          <small>Золоті години, тривалість, формула та настрій</small>
        </span>
        <ChevronRight />
      </button>
      {showMoreInsights && (
      <div className="advanced-insights">
      <section className="deep-insights-grid">
        <article className="analytics-card golden-card">
          <div className="analytics-head">
            <div>
              <span className="section-kicker">Золоті години</span>
              <h3>Коли тобі найкраще</h3>
            </div>
            <div className="metric-switch">
              {(
                [
                  ['count', 'Частота'],
                  ['rating', 'Оцінка'],
                ] as const
              ).map((item) => (
                <button
                  className={heatMetric === item[0] ? 'active' : ''}
                  onClick={() => setHeatMetric(item[0])}
                  key={item[0]}
                >
                  {item[1]}
                </button>
              ))}
            </div>
          </div>
          <div className="golden-heatmap">
            <span />
            {heatCols.map((day) => (
              <b key={day}>{day}</b>
            ))}
            {heatRows.map((row, period) => (
              <div className="golden-row" key={row}>
                <span>{row}</span>
                {heatCols.map((day, col) => {
                  const cell = heatValues[period * 7 + col];
                  return (
                    <i
                      key={day}
                      style={
                        {
                          '--heat': Math.abs(cell.value) / heatMax,
                        } as React.CSSProperties
                      }
                      title={`${day}, ${row}: ${cell.matches.length} сес.`}
                    >
                      {cell.matches.length ? (
                        <em>
                          {heatMetric === 'count'
                            ? cell.matches.length
                            : cell.value.toFixed(1)}
                        </em>
                      ) : null}
                    </i>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="sample-note">
            <ShieldCheck />
            {scoped.length < 8
              ? 'Потрібно більше записів для надійного патерну.'
              : 'Комірки розраховано за вибраний період.'}
          </p>
        </article>
        <article className="analytics-card duration-card">
          <div className="analytics-head">
            <div>
              <span className="section-kicker">Тривалість × задоволення</span>
              <h3>Твій комфортний діапазон</h3>
            </div>
          </div>
          <div className="duration-bands">
            {durationBands.map((item) => (
              <div key={item.label}>
                <span>
                  {item.label}
                  <small>
                    {item.count === 0
                      ? 'Немає даних'
                      : `${item.count} ${item.count === 1 ? 'сесія' : item.count < 5 ? 'сесії' : 'сесій'}`}
                  </small>
                </span>
                <div>
                  <i style={{ width: `${(item.avg / 5) * 100}%` }} />
                </div>
                <strong>{item.count ? item.avg.toFixed(1) : '—'}</strong>
              </div>
            ))}
          </div>
          <p className="sample-note">
            <ShieldCheck />
            Висновок стає надійнішим від 5 сесій у діапазоні.
          </p>
        </article>
      </section>
      <section className={`formula-card ${hasReliableSample ? '' : 'formula-card-waiting'}`}>
        <div className="formula-copy">
          <span className="section-kicker">Персональна формула</span>
          <h3>Що найчастіше пов’язане з кращими сесіями</h3>
          <p>
            Це спостереження, а не правило. Metrika показує вибірку, щоб не
            перебільшувати випадкові збіги.
          </p>
        </div>
        <div className="formula-list">
          {hasReliableSample && formula.length ? (
            formula.map((item, index) => (
              <article key={item.label}>
                <span>{index + 1}</span>
                <div className="formula-result">
                  <div className="formula-result-head">
                    <strong>{item.label}</strong>
                    <em
                      className={
                        item.count >= 5 ? 'strong' : item.count >= 3 ? 'medium' : ''
                      }
                    >
                      {item.count >= 5
                        ? 'висока'
                        : item.count >= 3
                          ? 'середня'
                          : 'ранній сигнал'}
                    </em>
                  </div>
                  <small>
                    {item.avg.toFixed(1)}/5 · {item.count}{' '}
                    {pluralUk(item.count, 'сесія', 'сесії', 'сесій')}
                  </small>
                </div>
              </article>
            ))
          ) : (
            <div className="formula-waiting">
              <ShieldCheck />
              <strong>Ще рано називати це формулою</strong>
              <span>Потрібно щонайменше 5 записів із контекстом. Зараз є {scoped.length}.</span>
            </div>
          )}
        </div>
      </section>
      <section className="analytics-card mood-shift mood-summary-section">
        <div>
          <span className="section-kicker">Настрій</span>
          <h3>Найчастіший стан</h3>
        </div>
        {contextGroups[0].items[0] ? (
          <div className="mood-shift-summary">
            <strong>{contextGroups[0].items[0].label}</strong>
            <span>
              {contextGroups[0].items[0].count}{' '}
              {contextGroups[0].items[0].count === 1
                ? 'сесія'
                : contextGroups[0].items[0].count < 5
                  ? 'сесії'
                  : 'сесій'}
              <i />
              середня оцінка {contextGroups[0].items[0].rating.toFixed(1)}/5
            </span>
          </div>
        ) : (
          <p>Обери настрій у новому записі, щоб побачити патерн.</p>
        )}
      </section>
      </div>
      )}
      <p className="insight-footnote">
        <ShieldCheck /> Усі розрахунки виконуються локально. Статистика не є
        медичною рекомендацією.
      </p>
    </>
  );
}
