import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
    Modal,
    KeyboardAvoidingView,
    PanResponder,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    todoService,
    Task,
    KanbanStatus,
    WIP_LIMIT,
} from '../src/services/todoService';
import { supabase } from '../src/core/supabase/client';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';



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

const URGENCY_STYLES: Record<Urgency, { dot: string; text: string; label: string }> = {
    overdue: { dot: '#d95f5f', text: '#c94f4f', label: 'OVERDUE' },
    today: { dot: '#d89216', text: '#b45309', label: 'TODAY' },
    soon: { dot: '#d9822b', text: '#c2410c', label: 'SOON' },
    upcoming: { dot: '#94a3b8', text: '#64748b', label: '' },
    none: { dot: '', text: '', label: '' },
};

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

function getStatusLabel(status: KanbanStatus): string {
    return LANE_ORDER.find(c => c.key === status)?.title || 'TO DO';
}

function getLanePillTitle(title: string): string {
    return title === 'IN PROGRESS' ? 'IN\nPROGRESS' : title;
}

const LANE_ORDER: { key: KanbanStatus; title: string }[] = [
    { key: 'idea', title: 'IDEAS' },
    { key: 'todo', title: 'TO DO' },
    { key: 'in_progress', title: 'IN PROGRESS' },
    { key: 'waiting', title: 'WAITING' },
    { key: 'done', title: 'DONE!' },
];

/* ═══════════════════════════════════════════
   Column config
   ═══════════════════════════════════════════ */

const COL_CONFIG: Record<KanbanStatus, {
    accent: string; bg: string; headerBg: string; marker: string; border: string; shadow: string;
}> = {
    idea: { accent: '#6f56b7', bg: '#f7f3ff', headerBg: '#eee7ff', marker: 'I', border: '#ded2fb', shadow: '#6f56b7' },
    todo: { accent: '#3d63ad', bg: '#f1f6ff', headerBg: '#e2edff', marker: 'T', border: '#cbdcfb', shadow: '#3d63ad' },
    in_progress: { accent: '#a86110', bg: '#fff4e6', headerBg: '#ffe4bf', marker: 'P', border: '#f3c78d', shadow: '#a86110' },
    waiting: { accent: '#586273', bg: '#f0f4f8', headerBg: '#e2e8f0', marker: 'W', border: '#cbd5e1', shadow: '#586273' },
    done: { accent: '#397d5d', bg: '#edf9f1', headerBg: '#d8f1df', marker: 'D', border: '#b8dfc4', shadow: '#397d5d' },
};

const DARK_COL_CONFIG: typeof COL_CONFIG = {
    idea: { accent: '#b8a4ff', bg: '#211c33', headerBg: '#2c2542', marker: 'I', border: '#4a3e72', shadow: '#000' },
    todo: { accent: '#8fb3ff', bg: '#182338', headerBg: '#202d49', marker: 'T', border: '#34466b', shadow: '#000' },
    in_progress: { accent: '#efba73', bg: '#2f2418', headerBg: '#3b2c1a', marker: 'P', border: '#6f4e26', shadow: '#000' },
    waiting: { accent: '#aeb8c7', bg: '#1b222c', headerBg: '#242c38', marker: 'W', border: '#3a4655', shadow: '#000' },
    done: { accent: '#8fd6aa', bg: '#17291f', headerBg: '#1e3428', marker: 'D', border: '#335f44', shadow: '#000' },
};

/* ═══════════════════════════════════════════
   Component
   ═══════════════════════════════════════════ */

export default function ToDo() {
    const { colors, language, themeMode } = useAppSettings();
    const styles = useMemo(() => makeStyles(colors, themeMode), [colors, themeMode]);
    const columnConfig = themeMode === 'dark' ? DARK_COL_CONFIG : COL_CONFIG;
    const copy = language === 'tr' ? {
        error: 'Hata',
        warning: 'Uyarı',
        tasksLoadFailed: 'Görevler yüklenemedi',
        taskAddFailed: 'Görev eklenemedi',
        titleRequired: 'Başlık gerekli',
        taskCreateFailed: 'Görev oluşturulamadı',
        taskUpdateFailed: 'Görev güncellenemedi',
        taskMoveFailed: 'Görev taşınamadı',
        taskDeleteFailed: 'Görev silinemedi',
        wipLimit: 'WIP Limiti',
        wipFull: `"IN PROGRESS" en fazla ${WIP_LIMIT} görev alabilir.`,
        wipFullMove: `"IN PROGRESS" en fazla ${WIP_LIMIT} görev alabilir.\nÖnce bir görevi bitirin veya taşıyın.`,
        waitingReason: 'Bekleme Sebebi',
        waitingReasonPrompt: 'Bu görevin neyi beklediğini ekleyin.',
        deleteTask: 'Görevi Sil',
        deleteAction: 'Sil',
        addTo: 'Ekle',
        editTask: 'Görevi Düzenle',
        chooseDate: 'Tarih seç',
        areYouSure: 'Emin misiniz?',
        move: 'Taşı',
        moveTitle: 'Taşı',
        waitingFor: 'BEKLENEN',
        tapToEdit: 'Düzenlemek için dokun',
        quickAdd: 'Hızlı görev ekle...',
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
        overdue: 'GECİKMİŞ',
        overdueShort: 'gecikmiş',
        today: 'BUGÜN',
        soon: 'YAKIN',
        createAction: 'OLUŞTUR',
        saveAction: 'KAYDET',
        current: 'Mevcut',
    } : {
        error: 'Error',
        warning: 'Warning',
        tasksLoadFailed: 'Tasks could not be loaded',
        taskAddFailed: 'Task could not be added',
        titleRequired: 'Title is required',
        taskCreateFailed: 'Task could not be created',
        taskUpdateFailed: 'Task could not be updated',
        taskMoveFailed: 'Task could not be moved',
        taskDeleteFailed: 'Task could not be deleted',
        wipLimit: 'WIP Limit',
        wipFull: `"IN PROGRESS" can hold up to ${WIP_LIMIT} tasks.`,
        wipFullMove: `"IN PROGRESS" can hold up to ${WIP_LIMIT} tasks.\nFinish or move a task first.`,
        waitingReason: 'Waiting Reason',
        waitingReasonPrompt: 'Add what this task is waiting for.',
        deleteTask: 'Delete Task',
        deleteAction: 'Delete',
        addTo: 'Add to',
        editTask: 'Edit Task',
        chooseDate: 'Choose date',
        areYouSure: 'Are you sure?',
        move: 'Move',
        moveTitle: 'Move',
        waitingFor: 'WAITING FOR',
        tapToEdit: 'Tap to edit',
        quickAdd: 'Quick add a task...',
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
        overdue: 'OVERDUE',
        overdueShort: 'overdue',
        today: 'TODAY',
        soon: 'SOON',
        createAction: 'CREATE',
        saveAction: 'SAVE',
        current: 'Current',
    };
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeLane, setActiveLane] = useState<KanbanStatus>('todo');

    // Quick add
    const [quickTitle, setQuickTitle] = useState('');
    const [quickTarget, setQuickTarget] = useState<KanbanStatus>('todo');
    const [adding, setAdding] = useState(false);

    // Edit/Create modal
    const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
    const [editTask, setEditTask] = useState<Task | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formStatus, setFormStatus] = useState<KanbanStatus>('todo');
    const [formDueDate, setFormDueDate] = useState<Date | null>(null);
    const [formWaitReason, setFormWaitReason] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Move modal
    const [moveTask, setMoveTask] = useState<Task | null>(null);
    const [moveWaitReason, setMoveWaitReason] = useState('');

    /* ─── Data ─── */

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        const { data, error } = await todoService.getTasks();
        if (error) Alert.alert(copy.error, copy.tasksLoadFailed);
        else if (data) setTasks(data);
        setLoading(false);
    }, [copy.error, copy.tasksLoadFailed]);

    const refreshTasksQuietly = useCallback(async () => {
        const { data } = await todoService.getTasks();
        if (data) setTasks(data);
    }, []);

    useEffect(() => {
        fetchTasks();
        const ch = supabase.channel('tasks-kanban-rt')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchTasks())
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [fetchTasks]);

    /* ─── Grouped tasks ─── */

    const grouped = useMemo(() => {
        const g: Record<KanbanStatus, Task[]> = {
            idea: [], todo: [], in_progress: [], waiting: [], done: [],
        };
        tasks.forEach(t => {
            const col = g[t.status] ? t.status : 'todo';
            g[col].push(t);
        });
        // Sort each column: by urgency weight then date
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

    const overdueTotal = useMemo(() =>
        tasks.filter(t => t.status !== 'done' && t.due_date && getDaysUntil(t.due_date) < 0).length
    , [tasks]);

    const activeLaneIndex = useMemo(() =>
        Math.max(0, LANE_ORDER.findIndex(col => col.key === activeLane))
    , [activeLane]);

    function selectLane(status: KanbanStatus) {
        setActiveLane(status);
    }

    const moveLane = useCallback((delta: number) => {
        const nextIndex = Math.max(0, Math.min(LANE_ORDER.length - 1, activeLaneIndex + delta));
        setActiveLane(LANE_ORDER[nextIndex].key);
    }, [activeLaneIndex]);

    const lanePanResponder = useMemo(() => PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
            Math.abs(gesture.dx) > 28 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4,
        onPanResponderRelease: (_, gesture) => {
            if (gesture.dx <= -45) moveLane(1);
            if (gesture.dx >= 45) moveLane(-1);
        },
    }), [moveLane]);

    /* ─── Quick Add ─── */

    async function handleQuickAdd() {
        const title = quickTitle.trim();
        if (!title) return;
        setAdding(true);
        const { data, error } = await todoService.addTask(title, quickTarget);
        if (error) Alert.alert(copy.error, copy.taskAddFailed);
        else {
            if (data) setTasks(prev => [data, ...prev]);
            setQuickTitle('');
            refreshTasksQuietly();
        }
        setAdding(false);
    }

    /* ─── Create / Edit modal ─── */

    function openCreateModal(targetStatus: KanbanStatus = 'todo') {
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
        const title = formTitle.trim();
        if (!title) { Alert.alert(copy.warning, copy.titleRequired); return; }

        // WIP check
        if (formStatus === 'in_progress') {
            const current = grouped.in_progress.length;
            const isAlreadyInProgress = editTask?.status === 'in_progress';
            if (!isAlreadyInProgress && current >= WIP_LIMIT) {
                Alert.alert(copy.wipLimit, copy.wipFullMove);
                return;
            }
        }

        const dateStr = formDueDate ? formDueDate.toISOString().split('T')[0] : null;

        if (modalMode === 'create') {
            const { data, error } = await todoService.addTask(title, formStatus, {
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
            });
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
    }

    /* ─── Move modal ─── */

    function openMoveModal(task: Task) {
        setMoveTask(task);
        setMoveWaitReason('');
    }

    async function handleMove(newStatus: KanbanStatus) {
        if (!moveTask) return;

        // WIP check
        if (newStatus === 'in_progress' && moveTask.status !== 'in_progress') {
            if (grouped.in_progress.length >= WIP_LIMIT) {
                Alert.alert(copy.wipLimit, copy.wipFull);
                return;
            }
        }

        if (newStatus === 'waiting' && !moveWaitReason.trim()) {
            Alert.alert(copy.waitingReason, copy.waitingReasonPrompt);
            return;
        }

        const { error } = await todoService.moveTask(
            moveTask.id,
            newStatus,
            newStatus === 'waiting' ? moveWaitReason.trim() : undefined
        );
        if (error) Alert.alert(copy.error, copy.taskMoveFailed);
        else {
            setTasks(prev => prev.map(t => (
                t.id === moveTask.id
                    ? {
                        ...t,
                        status: newStatus,
                        completed: newStatus === 'done',
                        waiting_reason: newStatus === 'waiting' ? moveWaitReason.trim() : null,
                    }
                    : t
            )));
            refreshTasksQuietly();
        }
        setMoveTask(null);
    }

    /* ─── Delete ─── */

    function handleDelete(id: number) {
        Alert.alert(copy.deleteTask, copy.areYouSure, [
            { text: copy.cancel, style: 'cancel' },
            {
                text: copy.deleteAction, style: 'destructive', onPress: async () => {
                    const { error } = await todoService.deleteTask(id);
                    if (error) Alert.alert(copy.error, copy.taskDeleteFailed);
                    else {
                        setTasks(prev => prev.filter(t => t.id !== id));
                        refreshTasksQuietly();
                    }
                },
            },
        ]);
    }

    /* ═══════════════════════════════════════════
       Render helpers
       ═══════════════════════════════════════════ */

    function renderCard(task: Task) {
        const urg = getUrgency(task);
        const urgStyle = URGENCY_STYLES[urg];
        const isDone = task.status === 'done';
        const isWaiting = task.status === 'waiting';
        const isUrgent = urg === 'overdue' || urg === 'today' || urg === 'soon';

        return (
            <TouchableOpacity
                key={task.id}
                style={[
                    styles.card,
                    isUrgent && !isDone && styles.cardUrgent,
                    isDone && styles.cardDone,
                    isWaiting && styles.cardWaiting,
                ]}
                onPress={() => openEditModal(task)}
                onLongPress={() => openMoveModal(task)}
                activeOpacity={0.7}
            >
                <View style={styles.cardTopRow}>
                    <Text style={[styles.cardTitle, isDone && styles.cardTitleDone]} numberOfLines={2}>
                        {task.title}
                    </Text>
                    <TouchableOpacity
                        style={styles.moveBtn}
                        onPress={() => openMoveModal(task)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Text style={styles.moveBtnText}>{copy.move}</Text>
                    </TouchableOpacity>
                </View>

                {/* Description preview */}
                {task.description && !isDone ? (
                    <Text style={styles.cardDesc} numberOfLines={1}>{task.description}</Text>
                ) : null}

                {/* Waiting reason */}
                {isWaiting && task.waiting_reason ? (
                    <View style={styles.waitingBox}>
                    <Text style={styles.waitingLabel}>{copy.waitingFor}</Text>
                        <Text style={styles.waitingText}>{task.waiting_reason}</Text>
                    </View>
                ) : null}

                {/* Bottom meta row */}
                <View style={styles.cardMeta}>
                    {/* Date + urgency */}
                    {task.due_date && !isDone ? (
                        <View style={styles.dateBadge}>
                            {urgStyle.dot ? <View style={[styles.urgDot, { backgroundColor: urgStyle.dot }]} /> : null}
                            <Text style={[styles.dateLabel, { color: urgStyle.text || '#64748b' }]}>
                                {getDateLabel(task.due_date, language)}
                            </Text>
                            {urgStyle.label ? (
                                <Text style={[styles.urgLabel, { color: urgStyle.dot }]}>{
                                    urg === 'overdue' ? copy.overdue :
                                    urg === 'today' ? copy.today :
                                    urg === 'soon' ? copy.soon :
                                    urgStyle.label
                                }</Text>
                            ) : null}
                        </View>
                    ) : null}

                    {task.due_date && isDone ? (
                        <Text style={styles.dateDone}>{getDateLabel(task.due_date, language)}</Text>
                    ) : null}

                    <Text style={styles.editHint}>{copy.tapToEdit}</Text>
                </View>
            </TouchableOpacity>
        );
    }

    function renderLaneSelector() {
        return (
            <View style={styles.laneSelector}>
                {LANE_ORDER.map(colData => {
                    const cfg = columnConfig[colData.key];
                    const isActive = activeLane === colData.key;
                    const count = grouped[colData.key].length;
                    return (
                        <TouchableOpacity
                            key={colData.key}
                            style={[
                                styles.lanePill,
                                { borderColor: cfg.border, backgroundColor: cfg.headerBg },
                                isActive && styles.lanePillActive,
                                isActive && { backgroundColor: cfg.accent, borderColor: cfg.accent },
                            ]}
                            onPress={() => selectLane(colData.key)}
                            activeOpacity={0.8}
                        >
                            {colData.key === 'in_progress' ? (
                                <View style={styles.lanePillLabelStack}>
                                    <Text style={[styles.lanePillText, styles.lanePillTextTiny, isActive && styles.lanePillTextActive]}>IN</Text>
                                    <Text style={[styles.lanePillText, styles.lanePillTextLong, isActive && styles.lanePillTextActive]}>PROGRESS</Text>
                                </View>
                            ) : (
                                <Text
                                    style={[
                                        styles.lanePillText,
                                        isActive && styles.lanePillTextActive,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {getLanePillTitle(colData.title)}
                                </Text>
                            )}
                            <Text
                                style={[
                                    styles.lanePillCount,
                                    { backgroundColor: cfg.bg, color: cfg.accent },
                                    isActive && styles.lanePillCountActive,
                                ]}
                            >
                                {count}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    }

    function renderColumn(status: KanbanStatus) {
        const col = columnConfig[status];
        const colData = LANE_ORDER.find(c => c.key === status)!;
        const items = grouped[status];
        const count = items.length;
        const isWip = status === 'in_progress';
        const isWaiting = status === 'waiting';
        const isDone = status === 'done';

        return (
            <View key={status} style={styles.lanePage}>
                <View
                    style={[
                        styles.column,
                        {
                            backgroundColor: col.bg,
                            borderColor: col.border,
                            shadowColor: col.shadow,
                        },
                        status === 'idea' && styles.columnLight,
                        isWip && styles.columnActive,
                        isWaiting && styles.columnBlocked,
                        isDone && styles.columnDone,
                    ]}
                >
                    {/* Column header */}
                    <View style={[styles.colHeader, { backgroundColor: col.headerBg }]}>
                        <View style={styles.colHeaderTop}>
                            <View style={[styles.colMarker, { backgroundColor: col.accent }]}>
                                <Text style={styles.colMarkerText}>{col.marker}</Text>
                            </View>
                            <View style={styles.colTitleWrap}>
                                <Text style={[styles.colTitle, { color: col.accent }]}>{colData.title}</Text>
                            </View>
                            <View style={styles.countBadge}>
                                <Text style={[styles.countText, { color: col.accent }]}>{count}</Text>
                            </View>
                            {isWip && (
                                <Text style={styles.wipBadge}>{grouped.in_progress.length}/{WIP_LIMIT}</Text>
                            )}
                        </View>
                    </View>

                    <ScrollView
                        style={styles.laneTaskScroll}
                        contentContainerStyle={styles.laneTaskContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Cards */}
                        {items.length === 0 ? (
                            <View style={styles.emptyCol}>
                            <Text style={styles.emptyColText}>{
                                status === 'idea' ? copy.ideasEmpty :
                                status === 'todo' ? copy.todoEmpty :
                                status === 'in_progress' ? copy.progressEmpty :
                                status === 'waiting' ? copy.waitingEmpty :
                                copy.doneEmpty
                            }</Text>
                            </View>
                        ) : (
                            items.map(renderCard)
                        )}

                        {/* Add button per column */}
                        <TouchableOpacity
                            style={[styles.addColBtn, { borderColor: col.accent + '40' }]}
                            onPress={() => openCreateModal(status)}
                        >
                            <Text style={[styles.addColBtnText, { color: col.accent }]}>{copy.addTo} {getStatusLabel(status)}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        );
    }

    /* ═══════════════════════════════════════════
       Main render
       ═══════════════════════════════════════════ */

    if (loading && tasks.length === 0) {
        return (
            <View style={styles.container}>
                <ActivityIndicator style={styles.loader} size="large" color="#3d63ad" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* ── Quick Add Bar ── */}
            <View style={styles.quickPanel}>
                <View style={styles.quickBar}>
                    <TextInput
                        style={styles.quickInput}
                        placeholder={copy.quickAdd}
                        value={quickTitle}
                        onChangeText={setQuickTitle}
                        onSubmitEditing={handleQuickAdd}
                        placeholderTextColor="#9ca3af"
                    />
                    <TouchableOpacity
                        style={[styles.quickAddBtn, adding && styles.quickAddBtnDisabled]}
                        onPress={handleQuickAdd}
                        disabled={adding}
                    >
                        {adding ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.quickAddBtnText}>+</Text>}
                    </TouchableOpacity>
                </View>
                <View style={styles.quickOptionsRow}>
                    <View style={styles.quickTargets}>
                        {(['idea', 'todo'] as KanbanStatus[]).map(s => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.quickTargetBtn, quickTarget === s && { backgroundColor: columnConfig[s].accent, borderColor: columnConfig[s].accent }]}
                                onPress={() => setQuickTarget(s)}
                            >
                                <Text style={[styles.quickTargetText, quickTarget === s && styles.quickTargetTextActive]}>
                                    {s === 'idea' ? 'IDEAS' : 'TO DO'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={styles.newBtn} onPress={() => openCreateModal('todo')}>
                        <Text style={styles.newBtnText}>{copy.newTask}</Text>
                    </TouchableOpacity>
                </View>
                {overdueTotal > 0 && (
                    <View style={styles.alertBadge}>
                        <Text style={styles.alertBadgeText}>{overdueTotal} {copy.overdueShort}</Text>
                    </View>
                )}
            </View>

            {renderLaneSelector()}

            {/* ── Kanban board ── */}
            <View style={styles.boardScroll} {...lanePanResponder.panHandlers}>
                {renderColumn(activeLane)}
            </View>

            {/* ═══ CREATE / EDIT MODAL ═══ */}
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
                                placeholderTextColor="#9ca3af"
                                autoFocus={modalMode === 'create'}
                            />

                            {/* Description */}
                            <Text style={styles.fLabel}>{copy.note}</Text>
                            <TextInput
                                style={[styles.fInput, styles.fTextArea]}
                                value={formDesc}
                                onChangeText={setFormDesc}
                                placeholder={copy.notePlaceholder}
                                placeholderTextColor="#9ca3af"
                                multiline
                            />

                            {/* Status */}
                            <Text style={styles.fLabel}>{copy.lane}</Text>
                            <View style={styles.statusRow}>
                                {LANE_ORDER.map(col => {
                                    const cfg = columnConfig[col.key];
                                    const sel = formStatus === col.key;
                                    return (
                                        <TouchableOpacity
                                            key={col.key}
                                            style={[styles.statusPill, sel && { backgroundColor: cfg.accent }]}
                                            onPress={() => setFormStatus(col.key)}
                                        >
                                            <Text style={[styles.statusPillText, sel && styles.statusPillTextSel]}>
                                                {col.title}
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
                                        placeholderTextColor="#9ca3af"
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
                                    <TouchableOpacity onPress={() => setFormDueDate(null)}>
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
                                    {modalMode === 'create' ? copy.createAction : copy.saveAction}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalMode(null)}>
                                <Text style={styles.cancelBtnText}>{copy.cancel}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ═══ MOVE MODAL ═══ */}
            <Modal visible={!!moveTask} transparent animationType="slide" onRequestClose={() => setMoveTask(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.moveBox}>
                        <Text style={styles.moveTitle}>{copy.moveTitle}: {moveTask?.title}</Text>
                        <Text style={styles.moveSubtitle}>{copy.chooseLane}</Text>

                        {LANE_ORDER.map(col => {
                            const cfg = columnConfig[col.key];
                            const isCurrent = moveTask?.status === col.key;
                            const isWip = col.key === 'in_progress' && !isCurrent && grouped.in_progress.length >= WIP_LIMIT;

                            return (
                                <View key={col.key}>
                                    <TouchableOpacity
                                        style={[
                                            styles.moveOption,
                                            isCurrent && styles.moveOptionCurrent,
                                            isWip && styles.moveOptionDisabled,
                                        ]}
                                        onPress={() => {
                                            if (isCurrent) return;
                                            if (isWip) {
                                                Alert.alert(copy.wipLimit, `${copy.wipFull} (${WIP_LIMIT}/${WIP_LIMIT})`);
                                                return;
                                            }
                                            if (col.key === 'waiting' && !moveWaitReason.trim()) {
                                                // Don't move yet, show reason input
                                                return;
                                            }
                                            handleMove(col.key);
                                        }}
                                        disabled={isCurrent}
                                    >
                                        <View style={[styles.moveOptionMarker, { backgroundColor: cfg.accent }]}>
                                            <Text style={styles.moveOptionMarkerText}>{cfg.marker}</Text>
                                        </View>
                                        <Text style={[styles.moveOptionText, isCurrent && styles.moveOptionTextCurrent]}>
                                            {col.title} {isCurrent ? `(${copy.current})` : ''} {isWip ? `(${WIP_LIMIT}/${WIP_LIMIT})` : ''}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Waiting reason inline input */}
                                    {col.key === 'waiting' && moveTask?.status !== 'waiting' && (
                                        <View style={styles.waitReasonRow}>
                                            <TextInput
                                                style={styles.waitReasonInput}
                                                value={moveWaitReason}
                                                onChangeText={setMoveWaitReason}
                                                placeholder={copy.waitingPlaceholder}
                                                placeholderTextColor="#94a3b8"
                                            />
                                            {moveWaitReason.trim() ? (
                                                <TouchableOpacity
                                                    style={styles.waitReasonSend}
                                                    onPress={() => handleMove('waiting')}
                                                >
                                                    <Text style={styles.waitReasonSendText}>→</Text>
                                                </TouchableOpacity>
                                            ) : null}
                                        </View>
                                    )}
                                </View>
                            );
                        })}

                        <TouchableOpacity style={styles.moveCancelBtn} onPress={() => setMoveTask(null)}>
                            <Text style={styles.moveCancelText}>{copy.cancel}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

/* ═══════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════ */

function makeStyles(colors: ReturnType<typeof useAppSettings>['colors'], themeMode: 'light' | 'dark') {
return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    loader: { marginTop: 60 },

    alertBadge: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: themeMode === 'dark' ? '#322818' : '#fff7ed', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: themeMode === 'dark' ? '#6f4e26' : '#fed7aa' },
    alertBadgeText: { fontSize: 12, fontWeight: '800', color: colors.warning },
    newBtn: { backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 11, borderWidth: 1, borderColor: colors.border },
    newBtnText: { color: colors.text, fontSize: 13, fontWeight: '800' },

    // ── Quick add ──
    quickPanel: {
        marginHorizontal: 16,
        marginTop: 14,
        marginBottom: 12,
        padding: 13,
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: themeMode === 'dark' ? '#34466b' : '#dbe8ff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
    },
    quickBar: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        padding: 0,
    },
    quickInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: colors.text, backgroundColor: colors.surfaceMuted, borderRadius: 9, borderWidth: 1, borderColor: colors.border },
    quickOptionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 11 },
    quickTargets: { flexDirection: 'row', gap: 7 },
    quickTargetBtn: { minWidth: 66, height: 36, borderRadius: 11, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 },
    quickTargetText: { fontSize: 11, letterSpacing: 0.3, fontWeight: '800', color: colors.subtext },
    quickTargetTextActive: { color: '#fff' },
    quickAddBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#3d63ad', alignItems: 'center', justifyContent: 'center' },
    quickAddBtnDisabled: { opacity: 0.5 },
    quickAddBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },

    // ── Lane selector ──
    laneSelector: {
        flexDirection: 'row',
        gap: 5,
        paddingHorizontal: 16,
        marginBottom: 13,
    },
    lanePill: {
        flex: 1,
        minHeight: 62,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
        paddingVertical: 8,
    },
    lanePillActive: {
        shadowColor: '#111827',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.16,
        shadowRadius: 7,
        elevation: 4,
    },
    lanePillText: {
        fontSize: 10.5,
        lineHeight: 13,
        fontWeight: '900',
        color: colors.subtext,
        textAlign: 'center',
        letterSpacing: 0.35,
    },
    lanePillLabelStack: { alignItems: 'center', justifyContent: 'center', minHeight: 28 },
    lanePillTextTiny: { fontSize: 9, lineHeight: 10, letterSpacing: 0.7 },
    lanePillTextLong: { fontSize: 9.5, lineHeight: 11, letterSpacing: 0.15 },
    lanePillTextActive: { color: '#fff' },
    lanePillCount: {
        marginTop: 5,
        minWidth: 24,
        height: 20,
        borderRadius: 10,
        overflow: 'hidden',
        textAlign: 'center',
        fontSize: 12,
        lineHeight: 20,
        fontWeight: '900',
        color: colors.subtext,
    },
    lanePillCountActive: { color: '#fff', backgroundColor: 'rgba(255,255,255,0.22)' },

    // ── Column ──
    lanePage: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
    column: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 3,
    },
    columnLight: {},
    columnActive: { shadowOpacity: 0.12 },
    columnBlocked: {},
    columnDone: {},
    colHeader: { paddingHorizontal: 14, paddingTop: 13, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(17, 24, 39, 0.05)' },
    colHeaderTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    colMarker: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    colMarkerText: { color: '#fff', fontSize: 11, fontWeight: '800' },
    colTitleWrap: { flex: 1 },
    colTitle: { fontSize: 14, fontWeight: '800' },
    countBadge: { minWidth: 25, height: 25, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, backgroundColor: 'rgba(255,255,255,0.78)', borderWidth: 1, borderColor: 'rgba(17, 24, 39, 0.08)' },
    countText: { fontSize: 12, fontWeight: '800' },
    wipBadge: { fontSize: 10, fontWeight: '800', color: colors.warning, backgroundColor: themeMode === 'dark' ? '#322818' : '#fff7ed', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: themeMode === 'dark' ? '#6f4e26' : '#fed7aa' },
    laneTaskScroll: { flex: 1 },
    laneTaskContent: { paddingTop: 12, paddingBottom: 12 },

    // ── Card ──
    card: {
        backgroundColor: themeMode === 'dark' ? 'rgba(24,27,34,0.94)' : 'rgba(255,255,255,0.92)', borderRadius: 11, padding: 13, marginHorizontal: 11, marginBottom: 9,
        borderWidth: 1, borderColor: themeMode === 'dark' ? 'rgba(167,175,189,0.2)' : 'rgba(148, 163, 184, 0.22)',
        shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1,
    },
    cardUrgent: { borderLeftWidth: 5, borderLeftColor: colors.warning, backgroundColor: themeMode === 'dark' ? '#332719' : '#fff8f1', borderColor: themeMode === 'dark' ? '#6f4e26' : '#f0c48f' },
    cardDone: { backgroundColor: themeMode === 'dark' ? '#18261e' : '#f3fbf6', borderColor: themeMode === 'dark' ? '#335f44' : '#bde8cc', opacity: 0.9 },
    cardWaiting: { backgroundColor: themeMode === 'dark' ? '#1d242d' : '#f4f6f8', borderColor: themeMode === 'dark' ? '#3a4655' : '#c8d0db', borderStyle: 'dashed' },
    cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
    cardTitle: { flex: 1, fontSize: 14.5, fontWeight: '700', color: colors.text, lineHeight: 20 },
    cardTitleDone: { textDecorationLine: 'line-through', color: colors.subtext, fontWeight: '400' },
    cardDesc: { fontSize: 12, color: colors.subtext, lineHeight: 16, marginBottom: 6 },
    waitingBox: { backgroundColor: 'rgba(226, 232, 240, 0.75)', padding: 9, borderRadius: 9, marginBottom: 7, borderLeftWidth: 2, borderLeftColor: '#5f6878' },
    waitingLabel: { fontSize: 10, color: colors.subtext, fontWeight: '800', marginBottom: 2 },
    waitingText: { fontSize: 12, color: colors.text, fontWeight: '500', lineHeight: 16 },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 },

    // Date / urgency
    dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceMuted, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: colors.border },
    urgDot: { width: 6, height: 6, borderRadius: 3 },
    dateLabel: { fontSize: 11, fontWeight: '700' },
    urgLabel: { fontSize: 10, fontWeight: '800', marginLeft: 2 },
    dateDone: { fontSize: 10, color: colors.subtext },

    // Card actions
    moveBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
    moveBtnText: { fontSize: 10, fontWeight: '700', color: colors.subtext },
    editHint: { marginLeft: 'auto', fontSize: 10, color: colors.subtext, fontWeight: '600' },

    // Empty column
    emptyCol: { paddingVertical: 18, paddingHorizontal: 14, alignItems: 'center' },
    emptyColText: { fontSize: 12, color: colors.subtext, fontWeight: '500' },

    // Add button per column
    addColBtn: { margin: 11, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', backgroundColor: themeMode === 'dark' ? 'rgba(24,27,34,0.55)' : 'rgba(255,255,255,0.55)' },
    addColBtnText: { fontSize: 12, fontWeight: '700' },

    // ── Board scroll ──
    boardScroll: { flex: 1 },

    // ── Create/Edit Modal ──
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBox: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 30, maxHeight: '92%' },
    modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 14 },

    fLabel: { fontSize: 11, fontWeight: '700', color: colors.subtext, letterSpacing: 1, marginBottom: 5, marginTop: 10 },
    fInput: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 4, color: colors.text },
    fTextArea: { minHeight: 60, textAlignVertical: 'top' },

    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
    statusPillText: { fontSize: 11, fontWeight: '600', color: colors.subtext },
    statusPillTextSel: { color: '#fff' },

    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
    dateChip: { backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    dateChipText: { fontSize: 13, color: colors.subtext, fontWeight: '500' },
    clearText: { fontSize: 13, color: colors.danger, fontWeight: '600' },

    pickerWrap: { backgroundColor: colors.surfaceMuted, borderRadius: 10, overflow: 'hidden', marginBottom: 6, borderWidth: 1, borderColor: colors.border },
    pickerDone: { alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
    pickerDoneText: { fontSize: 15, fontWeight: '700', color: colors.primary },

    deleteRow: { marginTop: 14, paddingVertical: 12, alignItems: 'center', backgroundColor: themeMode === 'dark' ? '#352026' : '#fef2f2', borderRadius: 10, borderWidth: 1, borderColor: themeMode === 'dark' ? '#6f3038' : '#fecaca' },
    deleteRowText: { fontSize: 14, fontWeight: '600', color: colors.danger },

    modalActions: { paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
    saveBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
    cancelBtn: { marginTop: 8, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 10 },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.text },

    // ── Move Modal ──
    moveBox: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 30 },
    moveTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
    moveSubtitle: { fontSize: 13, color: colors.subtext, marginBottom: 16 },
    moveOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
    moveOptionCurrent: { backgroundColor: colors.surfaceMuted, borderRadius: 8, paddingHorizontal: 10 },
    moveOptionDisabled: { opacity: 0.4 },
    moveOptionMarker: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    moveOptionMarkerText: { color: '#fff', fontSize: 11, fontWeight: '800' },
    moveOptionText: { fontSize: 15, color: colors.text, fontWeight: '500' },
    moveOptionTextCurrent: { fontWeight: '700', color: colors.primary },
    waitReasonRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingBottom: 10 },
    waitReasonInput: { flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, borderRadius: 8, padding: 10, fontSize: 13, color: colors.text },
    waitReasonSend: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#94a3b8', alignItems: 'center', justifyContent: 'center' },
    waitReasonSendText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    moveCancelBtn: { marginTop: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 10 },
    moveCancelText: { fontSize: 15, fontWeight: '600', color: colors.text },
});
}
