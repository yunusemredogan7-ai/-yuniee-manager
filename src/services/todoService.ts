import { supabase } from '../core/supabase/client';

/* ─── Types ─── */

export type KanbanStatus = 'idea' | 'todo' | 'in_progress' | 'waiting' | 'done';
export type TaskLabel = 'mekan' | 'personel' | 'teklif' | 'yuniee' | 'finans' | 'ai' | 'kisisel' | 'saglik';

export type Task = {
    id: number;
    title: string;
    description: string | null;
    completed: boolean;
    status: KanbanStatus;
    due_date: string | null;
    label: TaskLabel | null;
    waiting_reason: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string | null;
};

type RawTask = {
    id: number;
    title: string;
    completed?: boolean | null;
    status?: KanbanStatus | null;
    description?: string | null;
    due_date?: string | null;
    label?: TaskLabel | null;
    waiting_reason?: string | null;
    sort_order?: number | null;
    created_at: string;
    updated_at?: string | null;
};

export const KANBAN_COLUMNS: { key: KanbanStatus; title: string }[] = [
    { key: 'idea', title: 'IDEAS' },
    { key: 'todo', title: 'TO DO' },
    { key: 'in_progress', title: 'IN PROGRESS' },
    { key: 'waiting', title: 'WAITING' },
    { key: 'done', title: 'DONE!' },
];

export const LABELS: { key: TaskLabel; display: string; color: string }[] = [
    { key: 'mekan', display: 'Mekan', color: '#8b5cf6' },
    { key: 'personel', display: 'Personel', color: '#0ea5e9' },
    { key: 'teklif', display: 'Teklif', color: '#f59e0b' },
    { key: 'yuniee', display: 'YUNIEE', color: '#ec4899' },
    { key: 'finans', display: 'Finans', color: '#10b981' },
    { key: 'ai', display: 'AI', color: '#6366f1' },
    { key: 'kisisel', display: 'Kişisel', color: '#f97316' },
    { key: 'saglik', display: 'Sağlık', color: '#14b8a6' },
];

export const WIP_LIMIT = 3;

/* ─── Service ─── */

function normalizeTask(row: RawTask): Task {
    const completed = Boolean(row.completed);
    return {
        id: row.id,
        title: row.title,
        description: row.description ?? null,
        completed,
        status: row.status ?? (completed ? 'done' : 'todo'),
        due_date: row.due_date ?? null,
        label: row.label ?? null,
        waiting_reason: row.waiting_reason ?? null,
        sort_order: row.sort_order ?? 0,
        created_at: row.created_at,
        updated_at: row.updated_at ?? null,
    };
}

function isMissingColumnError(error: unknown): boolean {
    return Boolean(
        error &&
        typeof error === 'object' &&
        'code' in error &&
        ((error as { code?: string }).code === '42703' || (error as { code?: string }).code === 'PGRST204')
    );
}

function legacyTaskPayload(payload: Record<string, unknown>) {
    const legacy: Record<string, unknown> = {};
    for (const key of ['title', 'completed', 'due_date']) {
        if (key in payload) legacy[key] = payload[key];
    }
    return legacy;
}

export const todoService = {
    async getTasks(): Promise<{ data: Task[] | null; error: unknown }> {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error || !data) return { data: null, error };

        const normalized = (data as RawTask[])
            .map(normalizeTask)
            .sort((a, b) => {
                if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

        return { data: normalized, error: null };
    },

    async addTask(
        title: string,
        status: KanbanStatus = 'todo',
        opts?: {
            due_date?: string | null;
            label?: TaskLabel | null;
            description?: string | null;
            waiting_reason?: string | null;
        }
    ): Promise<{ data: Task | null; error: unknown }> {
        const completed = status === 'done';
        const payload = {
            title,
            status,
            completed,
            due_date: opts?.due_date || null,
            label: opts?.label || null,
            description: opts?.description || null,
            waiting_reason: opts?.waiting_reason || null,
            sort_order: 0,
        };

        let { data, error } = await supabase
            .from('tasks')
            .insert([payload])
            .select()
            .single();

        if (isMissingColumnError(error)) {
            const fallback = await supabase
                .from('tasks')
                .insert([legacyTaskPayload(payload)])
                .select()
                .single();
            data = fallback.data;
            error = fallback.error;
        }

        return { data: data ? normalizeTask(data as RawTask) : null, error };
    },

    async updateTask(
        id: number,
        updates: Partial<Pick<Task, 'title' | 'description' | 'due_date' | 'label' | 'waiting_reason' | 'status' | 'sort_order' | 'completed'>>
    ): Promise<{ success: boolean; error: unknown }> {
        // If status is being set to done, also set completed = true
        const payload: Record<string, unknown> = { ...updates };
        if (updates.status === 'done') payload.completed = true;
        else if (updates.status) payload.completed = false;

        let { error } = await supabase
            .from('tasks')
            .update(payload)
            .eq('id', id);

        if (isMissingColumnError(error)) {
            const fallback = await supabase
                .from('tasks')
                .update(legacyTaskPayload(payload))
                .eq('id', id);
            error = fallback.error;
        }

        return { success: !error, error };
    },

    async moveTask(id: number, newStatus: KanbanStatus, waitingReason?: string): Promise<{ success: boolean; error: unknown }> {
        const completed = newStatus === 'done';
        const payload: Record<string, unknown> = {
            status: newStatus,
            completed,
        };
        if (newStatus === 'waiting' && waitingReason) {
            payload.waiting_reason = waitingReason;
        }
        if (newStatus !== 'waiting') {
            payload.waiting_reason = null;
        }

        let { error } = await supabase
            .from('tasks')
            .update(payload)
            .eq('id', id);

        if (isMissingColumnError(error)) {
            const fallback = await supabase
                .from('tasks')
                .update(legacyTaskPayload(payload))
                .eq('id', id);
            error = fallback.error;
        }

        return { success: !error, error };
    },

    async deleteTask(id: number): Promise<{ success: boolean; error: unknown }> {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        return { success: !error, error };
    },

    // Legacy compatibility
    async toggleTask(id: number, completed: boolean): Promise<{ success: boolean; error: unknown }> {
        const status: KanbanStatus = completed ? 'done' : 'todo';
        return this.moveTask(id, status);
    },
};
