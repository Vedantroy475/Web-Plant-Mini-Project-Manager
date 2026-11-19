import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/api';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type StatusFilter = 'all' | TaskStatus;
export type SortOrder = 'asc' | 'desc';

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string | null;
  project: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskState {
  items: Task[];
  statusFilter: StatusFilter;
  sortBy: 'dueDate' | 'createdAt';
  sortOrder: SortOrder;
  loading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  items: [],
  statusFilter: 'all',
  sortBy: 'dueDate',
  sortOrder: 'asc',
  loading: false,
  error: null,
};

export const fetchTasks = createAsyncThunk<
  Task[],
  { projectId: string; status?: StatusFilter; sortBy?: string; order?: SortOrder },
  { rejectValue: string }
>('tasks/fetchByProject', async ({ projectId, status, sortBy, order }, { rejectWithValue }) => {
  try {
    const params: Record<string, string> = {};
    if (status && status !== 'all') params.status = status;
    if (sortBy) params.sortBy = sortBy;
    if (order) params.order = order;

    const { data } = await api.get(`/projects/${projectId}/tasks`, { params });
    return data;
  } catch (err) {
    return rejectWithValue((err as Error).message);
  }
});

export const createTask = createAsyncThunk<
  Task,
  {
    projectId: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    dueDate?: string | null;
  },
  { rejectValue: string }
>('tasks/create', async ({ projectId, ...payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/projects/${projectId}/tasks`, payload);
    return data;
  } catch (err) {
    return rejectWithValue((err as Error).message);
  }
});

export const updateTask = createAsyncThunk<
  Task,
  {
    id: string;
    title?: string;
    description?: string;
    status?: TaskStatus;
    dueDate?: string | null;
  },
  { rejectValue: string }
>('tasks/update', async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/tasks/${id}`, payload);
    return data;
  } catch (err) {
    return rejectWithValue((err as Error).message);
  }
});

export const deleteTask = createAsyncThunk<string, string, { rejectValue: string }>(
  'tasks/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/tasks/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setStatusFilter: (state, action: PayloadAction<StatusFilter>) => {
      state.statusFilter = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<SortOrder>) => {
      state.sortOrder = action.payload;
    },
    setSortBy: (state, action: PayloadAction<'dueDate' | 'createdAt'>) => {
      state.sortBy = action.payload;
    },
    resetTaskFilters: (state) => {
      state.statusFilter = 'all';
      state.sortBy = 'dueDate';
      state.sortOrder = 'asc';
    },
    clearTaskError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load tasks';
      })

      // Create Task
      .addCase(createTask.fulfilled, (state, action: PayloadAction<Task>) => {
        // Respect active status filter if one is applied
        if (state.statusFilter === 'all' || state.statusFilter === action.payload.status) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(createTask.rejected, (state, action) => {
        state.error = action.payload || 'Failed to create task';
      })

      // Update Task
      .addCase(updateTask.fulfilled, (state, action: PayloadAction<Task>) => {
        const index = state.items.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          // If filtered by status and task moved to a different status, remove from current filtered list
          if (state.statusFilter !== 'all' && state.statusFilter !== action.payload.status) {
            state.items.splice(index, 1);
          } else {
            state.items[index] = action.payload;
          }
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update task';
      })

      // Delete Task
      .addCase(deleteTask.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((t) => t._id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete task';
      });
  },
});

export const {
  setStatusFilter,
  setSortOrder,
  setSortBy,
  resetTaskFilters,
  clearTaskError,
} = taskSlice.actions;

export default taskSlice.reducer;