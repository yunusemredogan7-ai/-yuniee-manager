import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    FlatList,
    Alert,
    Platform,
    Modal,
    KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import {
    todoService,
    Task,
    KanbanStatus,
    TaskScope,
    WIP_LIMIT,
} from '../src/services/todoService';
import { supabase } from '../src/core/supabase/client';
import { AppColors, useAppSettings } from '../src/core/settings/AppSettingsContext';
import { createVisualSystem } from '../src/core/theme/visualSystem';
import { ConfirmDialog, EmptyState, LoadingSkeleton, StatusBadge, WarningCard } from '../src/components/ui';
import { OVERLAY_SCRIM, RADIUS, SPACING, TOUCH, hitSlopFor } from '../src/core/theme/tokens';

/* ═══════════════════════════════════════════
   Date & Urgency helpers
   ═══════════════════════════════════════════ */

function getDaysUntil(dateStr: string): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + 'T00:00:00');
    due.setHours(0, 0, 0, 0);
    return Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

type Urgency = 'overdue' | 'today' | 'soon' | 'upcoming' | 'none';

function getUrgency(task: Task): Urgency {
    if (task.status === 'done' || !task.due_date) return 'none';
    const d = getDaysUntil(task.due_date);
    if (d < 0) return 'overdue';
    if (d === 0) return 'today';
    if (d <= 2) return 'soon';
    return 'upcoming';
}

function getDateLabel(dateStr: string, language: 'en' | 'tr'): string {
    const d = getDaysUntil(dateStr);
    if (language === 'tr') {
        if (d < -1) return `${Math.abs(d)}g gecikti`;
        if (d === -1) return 'Dün';
        if (d === 0) return 'Bugün';
        if (d === 1) return 'Yarın';
        if (d <= 7) return `${d} gün`;
    }
    if (d < -1) return `${Math.abs(d)}d overdue`;
    if (d === -1) return 'Yesterday';
    if (d === 0) return 'Today';
    if (d === 1) return 'Tomorrow';
    if (d <= 7) return `${d} days`;
    const dt = new Date(dateStr + 'T00:00:00');
    return `${dt.getDate()}/${dt.getMonth() + 1}`;
}

const LANE_KEYS: KanbanStatus[] = ['idea', 'todo', 'in_progress', 'waiting', 'done'];

type TodoSpace = { key: TaskScope; title: string };

const SHARED_SPACE: TodoSpace = { key: 'yuniee', title: 'YUNIEE' };
const REALTIME_DEBOUNCE_MS = 350;
const TODO_SCOPE_STORAGE_KEY = 'yuniee.todoScope.v1';
const UNDO_WINDOW_MS = 5000;

function resolveTodoSpaces(user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] | null): TodoSpace[] {
    const metadata = user?.user_metadata || {};
    const identity = [
        user?.email,
        metadata.name,
        metadata.full_name,
    ].filter(Boolean).join(' ').toLowerCase();

    if (identity.includes('irem')) return [SHARED_SPACE, { key: 'irem', title: 'IREM' }];
    if (identity.includes('yemre') || identity.includes('yunus') || identity.includes('emre')) {
        return [SHARED_SPACE, { key: 'yemre', title: 'YEMRE' }];
    }
    return [SHARED_SPACE];
}

/* ═══════════════════════════════════════════
   Component
   ═══════════════════════════════════════════ */

type MoveStep = 'pick' | 'waiting-reason' | 'wip-confirm';
type UndoState = { taskId: number; previousStatus: KanbanStatus; previousWaitingReason: string | null; laneLabel: string };

export default function ToDo() {
    const navigation = useNavigation<any>();
    const { colors, language, themeMode } = useAppSettings();
    const styles = useMemo(() => makeStyles(colors, themeMode), [colors, themeMode]);
    const copy = language === 'tr' ? {
        error: 'Hata',
        warning: 'Uyarı',
        tasksLoadFailed: 'Görevler yüklenemedi',
        titleRequired: 'Başlık gerekli',
        taskCreateFailed: 'Görev oluşturulamadı',
        taskUpdateFailed: 'Görev güncellenemedi',
        taskMoveFailed: 'Görev taşınamadı',
        taskDeleteFailed: 'Görev silinemedi',
        wipLimit: 'WIP Limiti',
        wipFull: `"Devam Ediyor" en fazla ${WIP_LIMIT} görev alabilir.`,
        wipFullMove: `"Devam Ediyor" en fazla ${WIP_LIMIT} görev alabilir.\nÖnce bir görevi bitirin veya taşıyın.`,
        waitingReason: 'Bekleme Sebebi',
        waitingReasonPrompt: 'Bu görevin neyi beklediğini ekleyin.',
        deleteTask: 'Görevi Sil',
        deleteAction: 'Sil',
        editTask: 'Görevi Düzenle',
        chooseDate: 'Tarih seç',
        areYouSure: 'Emin misiniz?',
        move: 'Taşı',
        addTask: 'Görev ekle',
        undo: 'Geri al',
        movedTo: (lane: string) => `${lane} kulvarına taşındı`,
        confirmMove: 'Taşımayı onayla',
        moveAnyway: 'Yine de taşı',
        back: 'Geri',
        newTask: 'Yeni görev',
        title: 'BAŞLIK',
        titlePlaceholder: 'Ne yapılması gerekiyor?',
        note: 'NOT (opsiyonel)',
        notePlaceholder: 'Detay, link, not...',
        lane: 'KULVAR',
        waitingReasonLabel: 'BEKLEME SEBEBİ',
        waitingPlaceholder: 'Bu neyi bekliyor?',
        date: 'TARİH (opsiyonel)',
        clear: 'Temizle',
        done: 'Tamam',
        cancel: 'İptal',
        chooseLane: 'Hedef kulvarı seçin.',
        ideasEmpty: 'Yeni fikirler burada bekleyebilir.',
        todoEmpty: 'Sırada görev yok.',
        progressEmpty: 'Şu an aktif iş yok.',
        waitingEmpty: 'Bekleyen görev yok.',
        doneEmpty: 'Tamamlanan görevler burada kalır.',
        createAction: 'OLUŞTUR',
        saveAction: 'KAYDET',
        saving: 'Kaydediliyor...',
        laneNames: {
            idea: 'Fikirler',
            todo: 'Yapılacak',
            in_progress: 'Devam Ediyor',
            waiting: 'Bekliyor',
            done: 'Bitti',
        } as Record<KanbanStatus, string>,
    } : {
        error: 'Error',
        warning: 'Warning',
        tasksLoadFailed: 'Tasks could not be loaded',
        titleRequired: 'Title is required',
        taskCreateFailed: 'Task could not be created',
        taskUpdateFailed: 'Task could not be updated',
        taskMoveFailed: 'Task could not be moved',
        taskDeleteFailed: 'Task could not be deleted',
        wipLimit: 'WIP Limit',
        wipFull: `"In progress" can hold up to ${WIP_LIMIT} tasks.`,
        wipFullMove: `"In progress" can hold up to ${WIP_LIMIT} tasks.\nFinish or move a task first.`,
        waitingReason: 'Waiting Reason',
        waitingReasonPrompt: 'Add what this task is waiting for.',
        deleteTask: 'Delete Task',
        deleteAction: 'Delete',
        editTask: 'Edit Task',
        chooseDate: 'Choose date',
        areYouSure: 'Are you sure?',
        move: 'Move',
        addTask: 'Add task',
        undo: 'Undo',
        movedTo: (lane: string) => `Moved to ${lane}`,
        confirmMove: 'Confirm move',
        moveAnyway: 'Move anyway',
        back: 'Back',
        newTask: 'New task',
        title: 'TITLE',
        titlePlaceholder: 'What needs to be done?',
        note: 'NOTE (optional)',
        notePlaceholder: 'Details, link, note...',
        lane: 'LANE',
        waitingReasonLabel: 'WAITING REASON',
        waitingPlaceholder: 'What is this waiting for?',
        date: 'DATE (optional)',
        clear: 'Clear',
        done: 'Done',
        cancel: 'Cancel',
        chooseLane: 'Choose the destination lane.',
        ideasEmpty: 'New ideas can wait here.',
        todoEmpty: 'No tasks queued yet.',
        progressEmpty: 'No active work right now.',
        waitingEmpty: 'No blocked tasks.',
        doneEmpty: 'Completed tasks stay here.',
        createAction: 'CREATE',
        saveAction: 'SAVE',
        saving: 'Saving...',
        laneNames: {
            idea: 'Ideas',
            todo: 'To do',
            in_progress: 'In progress',
            waiting: 'Waiting',
            done: 'Done',
        } as Record<KanbanStatus, string>,
    };
    const emptyLaneCopy: Record<KanbanStatus, string> = {
        idea: copy.ideasEmpty,
        todo: copy.todoEmpty,
        in_progress: copy.progressEmpty,
        waiting: copy.waitingEmpty,
        done: copy.doneEmpty,
    };

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingTask, setSavingTask] = useState(false);
    const [activeLane, setActiveLane] = useState<KanbanStatus>('todo');
    const [spaces, setSpaces] = useState<TodoSpace[]>([SHARED_SPACE]);
    const [activeSpace, setActiveSpace] = useState<TaskScope>('yuniee');
    const fetchingRef = useRef(false);
    const activeSpaceRef = useRef<TaskScope>('yuniee');
    const tasksByScopeRef = useRef<Partial<Record<TaskScope, Task[]>>>({});
    const realtimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fetchingScopeRef = useRef<TaskScope | null>(null);

    // Create/Edit modal — unchanged from before, only the lane-label source
    // (LANE_KEYS/copy.laneNames instead of the old hardcoded English list)
    // and the entry points that open it are new.
    const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
    const [editTask, setEditTask] = useState<Task | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formStatus, setFormStatus] = useState<KanbanStatus>('todo');
    const [formDueDate, setFormDueDate] = useState<Date | null>(null);
    const [formWaitReason, setFormWaitReason] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Move sheet
    const [moveTask, setMoveTask] = useState<Task | null>(null);
    const [moveStep, setMoveStep] = useState<MoveStep>('pick');
    const [moveWaitReason, setMoveWaitReason] = useState('');
    const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);

    // Undo
    const [undo, setUndo] = useState<UndoState | null>(null);
    const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current); }, []);

    /* ─── Data ─── */

    useEffect(() => {
        let alive = true;
        Promise.all([
            supabase.auth.getUser(),
            AsyncStorage.getItem(TODO_SCOPE_STORAGE_KEY),
        ]).then(([{ data }, storedScope]) => {
            if (!alive) return;
            const allowedSpaces = resolveTodoSpaces(data.user);
            setSpaces(allowedSpaces);
            const candidate = storedScope as TaskScope | null;
            const resolved = candidate && allowedSpaces.some(space => space.key === candidate)
                ? candidate
                : allowedSpaces[0].key;
            setActiveSpace(resolved);
        });
        return () => { alive = false; };
    }, []);

    // Scope selection persists between sessions.
    function selectSpace(key: TaskScope) {
        setActiveSpace(key);
        AsyncStorage.setItem(TODO_SCOPE_STORAGE_KEY, key).catch(() => undefined);
    }

    const fetchTasks = useCallback(async (showLoader = true) => {
        if (fetchingRef.current && fetchingScopeRef.current === activeSpace) return;
        fetchingRef.current = true;
        fetchingScopeRef.current = activeSpace;
        if (showLoader) setLoading(true);
        try {
            const { data, error } = await todoService.getTasks(activeSpace);
            if (error) Alert.alert(copy.error, copy.tasksLoadFailed);
            else if (data) {
                tasksByScopeRef.current[activeSpace] = data;
                if (activeSpaceRef.current === activeSpace) setTasks(data);
            }
        } finally {
            if (fetchingScopeRef.current === activeSpace) {
                setLoading(false);
                fetchingRef.current = false;
                fetchingScopeRef.current = null;
            }
        }
    }, [activeSpace, copy.error, copy.tasksLoadFailed]);

    const refreshTasksQuietly = useCallback(async () => {
        const { data } = await todoService.getTasks(activeSpace);
        if (data) {
            tasksByScopeRef.current[activeSpace] = data;
            if (activeSpaceRef.current === activeSpace) setTasks(data);
        }
    }, [activeSpace]);

    useEffect(() => {
        activeSpaceRef.current = activeSpace;
        const cachedTasks = tasksByScopeRef.current[activeSpace];
        setTasks(cachedTasks || []);
        fetchTasks(!cachedTasks);
        const ch = supabase.channel(`tasks-kanban-rt-${activeSpace}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `task_scope=eq.${activeSpace}` }, () => {
                if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
                realtimeTimerRef.current = setTimeout(() => {
                    realtimeTimerRef.current = null;
                    refreshTasksQuietly();
                }, REALTIME_DEBOUNCE_MS);
            })
            .subscribe();
        return () => {
            if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
            supabase.removeChannel(ch);
        };
    }, [activeSpace, fetchTasks, refreshTasksQuietly]);

    useEffect(() => {
        tasksByScopeRef.current[activeSpace] = tasks;
    }, [activeSpace, tasks]);

    /* ─── Grouped tasks ─── */

    const grouped = useMemo(() => {
        const g: Record<KanbanStatus, Task[]> = {
            idea: [], todo: [], in_progress: [], waiting: [], done: [],
        };
        tasks.forEach(t => {
            const col = g[t.status] ? t.status : 'todo';
            g[col].push(t);
        });
        Object.values(g).forEach(arr =>
            arr.sort((a, b) => {
                if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
                if (a.due_date) return -1;
                if (b.due_date) return 1;
                return 0;
            })
        );
        return g;
    }, [tasks]);

    const laneTasks = grouped[activeLane];

    function spaceLabel(scope: TaskScope): string {
        return spaces.find(s => s.key === scope)?.title || SHARED_SPACE.title;
    }

    /* ─── Header: title (native) + scope filter (headerRight) ─── */

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitleAlign: 'left',
            headerRight: spaces.length > 1 ? () => (
                <View style={styles.headerScopeRow}>
                    {spaces.map(space => {
                        const selected = activeSpace === space.key;
                        return (
                            <TouchableOpacity
                                key={space.key}
                                style={[styles.headerScopePill, selected && styles.headerScopePillActive]}
                                onPress={() => selectSpace(space.key)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.headerScopePillText, selected && styles.headerScopePillTextActive]} numberOfLines={1}>
                                    {space.title}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ) : undefined,
        });
    }, [navigation, spaces, activeSpace, styles]);

    /* ─── Create / Edit modal ─── */

    function openCreateModal(targetStatus: KanbanStatus) {
        setModalMode('create');
        setEditTask(null);
        setFormTitle('');
        setFormDesc('');
        setFormStatus(targetStatus);
        setFormDueDate(null);
        setFormWaitReason('');
        setShowDatePicker(false);
    }

    function openEditModal(task: Task) {
        setModalMode('edit');
        setEditTask(task);
        setFormTitle(task.title);
        setFormDesc(task.description || '');
        setFormStatus(task.status);
        setFormDueDate(task.due_date ? new Date(task.due_date + 'T00:00:00') : null);
        setFormWaitReason(task.waiting_reason || '');
        setShowDatePicker(false);
    }

    async function handleSaveModal() {
        if (savingTask) return;
        const title = formTitle.trim();
        if (!title) { Alert.alert(copy.warning, copy.titleRequired); return; }

        // WIP check — unchanged: the create/edit screen keeps its original
        // blocking behavior. Only the move sheet gets the explicit-override flow.
        if (formStatus === 'in_progress') {
            const current = grouped.in_progress.length;
            const isAlreadyInProgress = editTask?.status === 'in_progress';
            if (!isAlreadyInProgress && current >= WIP_LIMIT) {
                Alert.alert(copy.wipLimit, copy.wipFullMove);
                return;
            }
        }

        const dateStr = formDueDate ? formDueDate.toISOString().split('T')[0] : null;
        setSavingTask(true);

        if (modalMode === 'create') {
            const { data, error } = await todoService.addTask(title, formStatus, activeSpace, {
                due_date: dateStr,
                description: formDesc.trim() || null,
                waiting_reason: formStatus === 'waiting' ? (formWaitReason.trim() || null) : null,
            });
            if (error) Alert.alert(copy.error, copy.taskCreateFailed);
            else {
                if (data) setTasks(prev => [data, ...prev]);
                refreshTasksQuietly();
            }
        } else if (modalMode === 'edit' && editTask) {
            const updates: Partial<Task> = {
                title,
                description: formDesc.trim() || null,
                due_date: dateStr,
                status: formStatus,
                completed: formStatus === 'done',
                waiting_reason: formStatus === 'waiting' ? (formWaitReason.trim() || null) : null,
            };
            const { error } = await todoService.updateTask(editTask.id, {
                ...updates,
            }, activeSpace);
            if (error) Alert.alert(copy.error, copy.taskUpdateFailed);
            else {
                setTasks(prev => prev.map(t => (
                    t.id === editTask.id ? { ...t, ...updates } : t
                )));
                refreshTasksQuietly();
            }
        }

        setModalMode(null);
        setEditTask(null);
        setSavingTask(false);
    }

    /* ─── Move sheet ─── */

    function openMoveSheet(task: Task) {
        setMoveTask(task);
        setMoveStep('pick');
        setMoveWaitReason('');
    }

    function closeMoveSheet() {
        setMoveTask(null);
        setMoveStep('pick');
        setMoveWaitReason('');
    }

    function pickLane(key: KanbanStatus) {
        if (key === 'waiting') {
            setMoveStep('waiting-reason');
            return;
        }
        if (key === 'in_progress' && grouped.in_progress.length >= WIP_LIMIT) {
            setMoveStep('wip-confirm');
            return;
        }
        commitMove(key);
    }

    function showUndo(taskId: number, previousStatus: KanbanStatus, previousWaitingReason: string | null, newStatus: KanbanStatus) {
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        setUndo({ taskId, previousStatus, previousWaitingReason, laneLabel: copy.laneNames[newStatus] });
        undoTimerRef.current = setTimeout(() => setUndo(null), UNDO_WINDOW_MS);
    }

    async function commitMove(newStatus: KanbanStatus) {
        if (!moveTask) return;
        const task = moveTask;
        const previousStatus = task.status;
        const previousWaitingReason = task.waiting_reason ?? null;
        const reason = newStatus === 'waiting' ? moveWaitReason.trim() : undefined;

        closeMoveSheet();

        const { error } = await todoService.moveTask(task.id, newStatus, reason, activeSpace);
        if (error) { Alert.alert(copy.error, copy.taskMoveFailed); return; }
        setTasks(prev => prev.map(t => (
            t.id === task.id
                ? { ...t, status: newStatus, completed: newStatus === 'done', waiting_reason: newStatus === 'waiting' ? (reason || null) : null }
                : t
        )));
        refreshTasksQuietly();
        showUndo(task.id, previousStatus, previousWaitingReason, newStatus);
    }

    async function handleUndo() {
        if (!undo) return;
        const { taskId, previousStatus, previousWaitingReason } = undo;
        setUndo(null);
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

        const { error } = await todoService.moveTask(taskId, previousStatus, previousWaitingReason || undefined, activeSpace);
        if (error) { Alert.alert(copy.error, copy.taskMoveFailed); return; }
        setTasks(prev => prev.map(t => (
            t.id === taskId
                ? { ...t, status: previousStatus, completed: previousStatus === 'done', waiting_reason: previousStatus === 'waiting' ? previousWaitingReason : null }
                : t
        )));
        refreshTasksQuietly();
    }

    /* ─── Delete ─── */

    function handleDelete(id: number) {
        setDeleteTaskId(id);
    }

    async function confirmDeleteTask() {
        if (!deleteTaskId) return;
        const id = deleteTaskId;
        setDeleteTaskId(null);
        const { error } = await todoService.deleteTask(id, activeSpace);
        if (error) Alert.alert(copy.error, copy.taskDeleteFailed);
        else {
            setTasks(prev => prev.filter(t => t.id !== id));
            refreshTasksQuietly();
        }
    }

    /* ═══════════════════════════════════════════
       Render helpers
       ═══════════════════════════════════════════ */

    function renderChip(task: Task) {
        const urg = getUrgency(task);
        if (task.due_date) {
            if (urg === 'overdue') return <StatusBadge label={getDateLabel(task.due_date, language)} tone="danger" />;
            // "Within 2 days" = due today or within the next 2 days.
            if (urg === 'today' || urg === 'soon') return <StatusBadge label={getDateLabel(task.due_date, language)} tone="warning" />;
            return <Text style={styles.cardChipPlain}>{getDateLabel(task.due_date, language)}</Text>;
        }
        return <Text style={styles.cardChipPlain}>{spaceLabel(task.task_scope)}</Text>;
    }

    function renderCard({ item: task }: { item: Task }) {
        return (
            <View style={styles.card}>
                <TouchableOpacity
                    style={styles.cardBody}
                    onPress={() => openEditModal(task)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.cardTitle} numberOfLines={2}>{task.title}</Text>
                    {renderChip(task)}
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.cardChevron}
                    onPress={() => openMoveSheet(task)}
                    accessibilityRole="button"
                    accessibilityLabel={copy.move}
                    hitSlop={hitSlopFor(32)}
                >
                    <Icon name="chevron-forward" size={20} color={colors.text.muted} />
                </TouchableOpacity>
            </View>
        );
    }

    /* ═══════════════════════════════════════════
       Main render
       ═══════════════════════════════════════════ */

    const otherLanes = moveTask ? LANE_KEYS.filter(key => key !== moveTask.status) : [];
    const wipCount = grouped.in_progress.length;

    return (
        <View style={styles.container}>
            {/* ── Lane selector: single scrollable row, exactly one selected ── */}
            <ScrollView
                horizontal
                style={styles.laneSelectorScroll}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.laneSelector}
            >
                {LANE_KEYS.map(key => {
                    const isActive = activeLane === key;
                    return (
                        <TouchableOpacity
                            key={key}
                            style={[styles.lanePill, isActive ? styles.lanePillActive : styles.lanePillInactive]}
                            onPress={() => setActiveLane(key)}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[styles.lanePillText, isActive ? styles.lanePillTextActive : styles.lanePillTextInactive]}
                                numberOfLines={1}
                            >
                                {copy.laneNames[key]} · {grouped[key].length}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* ── Task list: the selected lane only, standard vertical scroll ── */}
            <FlatList
                style={styles.list}
                data={laneTasks}
                keyExtractor={task => String(task.id)}
                renderItem={renderCard}
                contentContainerStyle={laneTasks.length === 0 ? styles.listContentEmpty : styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    loading && laneTasks.length === 0 ? (
                        <LoadingSkeleton rows={4} style={styles.laneLoading} />
                    ) : (
                        <EmptyState
                            icon="+"
                            title={copy.laneNames[activeLane]}
                            description={emptyLaneCopy[activeLane]}
                            actionLabel={copy.addTask}
                            onAction={() => openCreateModal(activeLane)}
                        />
                    )
                }
            />

            {/* ── Undo affordance ── */}
            {undo ? (
                <View style={styles.undoBar}>
                    <Text style={styles.undoText} numberOfLines={1}>{copy.movedTo(undo.laneLabel)}</Text>
                    <TouchableOpacity onPress={handleUndo} hitSlop={hitSlopFor(28)}>
                        <Text style={styles.undoAction}>{copy.undo}</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {/* ── Bottom: Add task, full width ──
                No manual safe-area inset here: this screen renders inside the
                bottom tab bar's content area, which already sits above the
                tab bar — the tab bar itself (see App.tsx) is what owns the
                home-indicator inset. Adding useSafeAreaInsets() here on top
                of that would double-pad. */}
            <View style={styles.addTaskBar}>
                <TouchableOpacity style={styles.addTaskBtn} onPress={() => openCreateModal(activeLane)}>
                    <Text style={styles.addTaskBtnText}>{copy.addTask}</Text>
                </TouchableOpacity>
            </View>

            {/* ═══ CREATE / EDIT MODAL — unchanged behavior ═══ */}
            <Modal visible={modalMode !== null} transparent animationType="slide" onRequestClose={() => setModalMode(null)}>
                <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.modalBox}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>
                                {modalMode === 'create' ? copy.newTask : copy.editTask}
                            </Text>

                            {/* Title */}
                            <Text style={styles.fLabel}>{copy.title}</Text>
                            <TextInput
                                style={styles.fInput}
                                value={formTitle}
                                onChangeText={setFormTitle}
                                placeholder={copy.titlePlaceholder}
                                placeholderTextColor={colors.text.secondary}
                                autoFocus={modalMode === 'create'}
                            />

                            {/* Description */}
                            <Text style={styles.fLabel}>{copy.note}</Text>
                            <TextInput
                                style={[styles.fInput, styles.fTextArea]}
                                value={formDesc}
                                onChangeText={setFormDesc}
                                placeholder={copy.notePlaceholder}
                                placeholderTextColor={colors.text.secondary}
                                multiline
                            />

                            {/* Status */}
                            <Text style={styles.fLabel}>{copy.lane}</Text>
                            <View style={styles.statusRow}>
                                {LANE_KEYS.map(key => {
                                    const sel = formStatus === key;
                                    return (
                                        <TouchableOpacity
                                            key={key}
                                            style={[styles.statusPill, sel && styles.statusPillActive]}
                                            onPress={() => setFormStatus(key)}
                                        >
                                            <Text style={[styles.statusPillText, sel && styles.statusPillTextSel]}>
                                                {copy.laneNames[key]}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Waiting reason */}
                            {formStatus === 'waiting' && (
                                <>
                                    <Text style={styles.fLabel}>{copy.waitingReasonLabel}</Text>
                                    <TextInput
                                        style={styles.fInput}
                                        value={formWaitReason}
                                        onChangeText={setFormWaitReason}
                                        placeholder={copy.waitingPlaceholder}
                                        placeholderTextColor={colors.text.secondary}
                                    />
                                </>
                            )}

                            {/* Due date */}
                            <Text style={styles.fLabel}>{copy.date}</Text>
                            <View style={styles.dateRow}>
                                <TouchableOpacity style={styles.dateChip} onPress={() => setShowDatePicker(true)}>
                                    <Text style={styles.dateChipText}>
                                        {formDueDate ? new Date(formDueDate.toISOString().split('T')[0] + 'T00:00:00').toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : copy.chooseDate}
                                    </Text>
                                </TouchableOpacity>
                                {formDueDate && (
                                    <TouchableOpacity onPress={() => setFormDueDate(null)} hitSlop={hitSlopFor(20)}>
                                        <Text style={styles.clearText}>{copy.clear}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {showDatePicker && (
                                <View style={styles.pickerWrap}>
                                    <DateTimePicker
                                        value={formDueDate || new Date()}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                        onChange={(_, date) => {
                                            if (Platform.OS !== 'ios') setShowDatePicker(false);
                                            if (date) setFormDueDate(date);
                                        }}
                                    />
                                    {Platform.OS === 'ios' && (
                                        <TouchableOpacity style={styles.pickerDone} onPress={() => setShowDatePicker(false)}>
                                            <Text style={styles.pickerDoneText}>{copy.done}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}

                            {/* Delete (edit mode only) */}
                            {modalMode === 'edit' && editTask && (
                                <TouchableOpacity
                                    style={styles.deleteRow}
                                    onPress={() => { setModalMode(null); handleDelete(editTask.id); }}
                                >
                                    <Text style={styles.deleteRowText}>{copy.deleteTask}</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>

                        {/* Actions */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveModal}>
                                <Text style={styles.saveBtnText}>
                                    {savingTask ? copy.saving : modalMode === 'create' ? copy.createAction : copy.saveAction}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalMode(null)}>
                                <Text style={styles.cancelBtnText}>{copy.cancel}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ═══ MOVE SHEET — no drag-and-drop, just tap the arrow ═══ */}
            <Modal visible={!!moveTask} transparent animationType="slide" onRequestClose={closeMoveSheet}>
                <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.moveSheet}>
                        <Text style={styles.moveSheetTaskTitle} numberOfLines={1}>{moveTask?.title}</Text>

                        {moveStep === 'pick' && (
                            <>
                                <Text style={styles.moveSheetSubtitle}>{copy.chooseLane}</Text>
                                {otherLanes.map(key => {
                                    const isWipFull = key === 'in_progress' && wipCount >= WIP_LIMIT;
                                    return (
                                        <TouchableOpacity
                                            key={key}
                                            style={styles.moveOption}
                                            onPress={() => pickLane(key)}
                                        >
                                            <Text style={styles.moveOptionText}>{copy.laneNames[key]}</Text>
                                            {isWipFull ? (
                                                <Text style={styles.moveOptionHint}>{wipCount}/{WIP_LIMIT}</Text>
                                            ) : null}
                                        </TouchableOpacity>
                                    );
                                })}
                                <TouchableOpacity style={styles.moveCancelBtn} onPress={closeMoveSheet}>
                                    <Text style={styles.moveCancelText}>{copy.cancel}</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {moveStep === 'waiting-reason' && (
                            <>
                                <Text style={styles.fLabel}>{copy.waitingReasonLabel}</Text>
                                <Text style={styles.moveSheetSubtitle}>{copy.waitingReasonPrompt}</Text>
                                <TextInput
                                    style={styles.fInput}
                                    value={moveWaitReason}
                                    onChangeText={setMoveWaitReason}
                                    placeholder={copy.waitingPlaceholder}
                                    placeholderTextColor={colors.text.secondary}
                                    autoFocus
                                />
                                <View style={styles.moveSheetActions}>
                                    <TouchableOpacity style={styles.moveBackBtn} onPress={() => setMoveStep('pick')}>
                                        <Text style={styles.moveBackText}>{copy.back}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.moveConfirmBtn, !moveWaitReason.trim() && styles.moveConfirmBtnDisabled]}
                                        onPress={() => commitMove('waiting')}
                                        disabled={!moveWaitReason.trim()}
                                    >
                                        <Text style={styles.moveConfirmText}>{copy.confirmMove}</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {moveStep === 'wip-confirm' && (
                            <>
                                {/* Shows the limit clearly and requires an explicit confirm —
                                    it does not silently block; the owner can override their own tool. */}
                                <WarningCard
                                    title={copy.wipLimit}
                                    description={`${copy.wipFull} (${wipCount}/${WIP_LIMIT})`}
                                    tone="warning"
                                    style={styles.moveWipWarning}
                                />
                                <View style={styles.moveSheetActions}>
                                    <TouchableOpacity style={styles.moveBackBtn} onPress={() => setMoveStep('pick')}>
                                        <Text style={styles.moveBackText}>{copy.back}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.moveConfirmBtn} onPress={() => commitMove('in_progress')}>
                                        <Text style={styles.moveConfirmText}>{copy.moveAnyway}</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <ConfirmDialog
                visible={deleteTaskId !== null}
                title={copy.deleteTask}
                message={copy.areYouSure}
                confirmLabel={copy.deleteAction}
                cancelLabel={copy.cancel}
                destructive
                onConfirm={confirmDeleteTask}
                onCancel={() => setDeleteTaskId(null)}
            />
        </View>
    );
}

/* ═══════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════ */

function makeStyles(colors: AppColors, themeMode: 'light' | 'dark') {
const v = createVisualSystem(colors, themeMode);
return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg.page },

    // ── Header (native headerRight) ──
    headerScopeRow: { flexDirection: 'row', gap: SPACING.xs, marginRight: SPACING.md },
    // Adjacent pills with a small gap: hitSlop would overlap, so the tap
    // target is met by minHeight instead (fills the header's own height).
    headerScopePill: {
        minHeight: TOUCH.minSize,
        justifyContent: 'center',
        paddingHorizontal: SPACING.sm,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    headerScopePillActive: {
        backgroundColor: colors.text.primary,
        borderColor: colors.text.primary,
    },
    headerScopePillText: {
        ...v.type.caption,
        color: colors.text.muted,
    },
    headerScopePillTextActive: {
        color: colors.bg.surface,
        fontWeight: '700',
    },

    // ── Lane selector ──
    // A horizontal ScrollView stretches to fill its parent by default; this
    // pins it to its content height so it doesn't eat the list's space.
    laneSelectorScroll: {
        flexGrow: 0,
        flexShrink: 0,
    },
    laneSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
    },
    lanePill: {
        minHeight: TOUCH.minSize,
        justifyContent: 'center',
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.pill,
    },
    lanePillActive: {
        backgroundColor: colors.text.primary,
    },
    lanePillInactive: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    lanePillText: {
        ...v.type.label,
        fontWeight: '600',
    },
    lanePillTextActive: {
        color: colors.bg.surface,
    },
    lanePillTextInactive: {
        color: colors.text.muted,
    },

    // ── Task list ──
    list: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xs,
        paddingBottom: SPACING.lg,
    },
    listContentEmpty: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.lg,
    },
    laneLoading: { marginTop: SPACING.sm },

    // ── Card — title, one chip, chevron. Nothing else. ──
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        ...v.cardCompact,
        marginBottom: SPACING.sm,
    },
    cardBody: {
        flex: 1,
        gap: SPACING.xs,
    },
    cardTitle: {
        ...v.type.body,
        color: colors.text.primary,
    },
    cardChipPlain: {
        ...v.type.caption,
        color: colors.text.muted,
    },
    cardChevron: {
        width: TOUCH.minSize,
        height: TOUCH.minSize,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: -SPACING.sm,
    },

    // ── Undo bar ──
    undoBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.sm,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.sm,
        backgroundColor: colors.text.primary,
    },
    undoText: {
        ...v.type.label,
        color: colors.bg.surface,
        flex: 1,
        marginRight: SPACING.md,
    },
    undoAction: {
        ...v.type.label,
        fontWeight: '700',
        color: colors.bg.surface,
        textDecorationLine: 'underline',
    },

    // ── Bottom add-task bar ──
    addTaskBar: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xs,
        paddingBottom: SPACING.lg,
    },
    addTaskBtn: {
        ...v.primaryButton,
        backgroundColor: colors.text.primary,
    },
    addTaskBtnText: {
        ...v.type.heading,
        color: colors.bg.surface,
    },

    // ── Create/Edit Modal ──
    modalOverlay: { flex: 1, backgroundColor: OVERLAY_SCRIM, justifyContent: 'flex-end' },
    modalBox: { backgroundColor: colors.bg.surface, borderTopLeftRadius: RADIUS.md, borderTopRightRadius: RADIUS.md, padding: SPACING.lg, paddingBottom: SPACING.xxl - SPACING.xs, maxHeight: '92%' },
    modalTitle: { ...v.type.title, color: colors.text.primary, marginBottom: SPACING.md },

    fLabel: { ...v.type.caption, fontWeight: '700', color: colors.text.secondary, letterSpacing: 1, marginBottom: SPACING.xs, marginTop: SPACING.sm },
    fInput: { ...v.input, marginBottom: SPACING.xs },
    fTextArea: { minHeight: 60, textAlignVertical: 'top' },

    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.xs },
    // Wrapping row with a small gap: hitSlop would overlap, so the tap target is met by minHeight instead.
    statusPill: { minHeight: TOUCH.minSize, justifyContent: 'center', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, backgroundColor: colors.bg.raised, borderWidth: 1, borderColor: colors.border.default },
    statusPillActive: { backgroundColor: colors.accent.bg, borderColor: colors.accent.bg },
    statusPillText: { ...v.type.caption, color: colors.text.secondary },
    statusPillTextSel: { color: colors.accent.fg },

    dateRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
    dateChip: { backgroundColor: colors.bg.raised, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: colors.border.default },
    dateChipText: { ...v.type.label, color: colors.text.secondary },
    clearText: { ...v.type.label, color: colors.status.danger.fg },

    pickerWrap: { backgroundColor: colors.bg.raised, borderRadius: RADIUS.sm, overflow: 'hidden', marginBottom: SPACING.xs, borderWidth: 1, borderColor: colors.border.default },
    pickerDone: { alignItems: 'center', paddingVertical: SPACING.sm, borderTopWidth: 1, borderTopColor: colors.border.default },
    pickerDoneText: { ...v.type.heading, color: colors.accent.bg },

    // A genuine danger-tinted zone (destructive action).
    deleteRow: { marginTop: SPACING.md, paddingVertical: SPACING.sm, alignItems: 'center', backgroundColor: colors.status.danger.bg, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: colors.status.danger.fg },
    deleteRowText: { ...v.type.body, fontWeight: '600', color: colors.status.danger.fg },

    modalActions: { paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: colors.border.default },
    saveBtn: { backgroundColor: colors.accent.bg, paddingVertical: SPACING.md, borderRadius: RADIUS.sm, alignItems: 'center', minHeight: TOUCH.minSize, justifyContent: 'center' },
    saveBtnText: { color: colors.accent.fg, ...v.type.heading },
    cancelBtn: { marginTop: SPACING.sm, paddingVertical: SPACING.sm, alignItems: 'center', backgroundColor: colors.bg.raised, borderRadius: RADIUS.sm, minHeight: TOUCH.minSize, justifyContent: 'center' },
    cancelBtnText: { ...v.type.label, color: colors.text.primary },

    // ── Move sheet ──
    moveSheet: { backgroundColor: colors.bg.surface, borderTopLeftRadius: RADIUS.md, borderTopRightRadius: RADIUS.md, padding: SPACING.lg, paddingBottom: SPACING.xxl - SPACING.xs },
    moveSheetTaskTitle: { ...v.type.heading, color: colors.text.primary, marginBottom: SPACING.xs },
    moveSheetSubtitle: { ...v.type.body, color: colors.text.secondary, marginBottom: SPACING.lg },
    moveOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.border.default, minHeight: TOUCH.minSize },
    moveOptionText: { ...v.type.heading, color: colors.text.primary, fontWeight: '400' },
    moveOptionHint: { ...v.type.label, color: colors.status.warning.fg, fontWeight: '700' },
    moveCancelBtn: { marginTop: SPACING.lg, paddingVertical: SPACING.md, alignItems: 'center', backgroundColor: colors.bg.raised, borderRadius: RADIUS.sm, minHeight: TOUCH.minSize, justifyContent: 'center' },
    moveCancelText: { ...v.type.label, color: colors.text.primary },
    moveSheetActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg },
    moveBackBtn: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center', backgroundColor: colors.bg.raised, borderRadius: RADIUS.sm, minHeight: TOUCH.minSize, justifyContent: 'center' },
    moveBackText: { ...v.type.label, color: colors.text.primary },
    moveConfirmBtn: { flex: 2, paddingVertical: SPACING.md, alignItems: 'center', backgroundColor: colors.accent.bg, borderRadius: RADIUS.sm, minHeight: TOUCH.minSize, justifyContent: 'center' },
    moveConfirmBtnDisabled: { opacity: 0.5 },
    moveConfirmText: { ...v.type.label, fontWeight: '700', color: colors.accent.fg },
    moveWipWarning: { marginTop: SPACING.xs },
});
}
