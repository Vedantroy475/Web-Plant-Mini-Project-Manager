import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/api';

export interface Project {
  _id: string;
  title: string;
  description: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  items: Project[];
  loading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchProjects = createAsyncThunk<Project[], void, { rejectValue: string }>(
  'projects/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/projects');
      return data;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const createProject = createAsyncThunk<
  Project,
  { title: string; description?: string },
  { rejectValue: string }
>('projects/create', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/projects', payload);
    return data;
  } catch (err) {
    return rejectWithValue((err as Error).message);
  }
});

export const updateProject = createAsyncThunk<
  Project,
  { id: string; title: string; description?: string },
  { rejectValue: string }
>('projects/update', async ({ id, title, description }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/projects/${id}`, { title, description });
    return data;
  } catch (err) {
    return rejectWithValue((err as Error).message);
  }
});

export const deleteProject = createAsyncThunk<string, string, { rejectValue: string }>(
  'projects/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/projects/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearProjectError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<Project[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load projects';
      })

      // Create
      .addCase(createProject.fulfilled, (state, action: PayloadAction<Project>) => {
        state.items.unshift(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.error = action.payload || 'Failed to create project';
      })

      // Update
      .addCase(updateProject.fulfilled, (state, action: PayloadAction<Project>) => {
        const index = state.items.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update project';
      })

      // Delete
      .addCase(deleteProject.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((p) => p._id !== action.payload);
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete project';
      });
  },
});

export const { clearProjectError } = projectSlice.actions;
export default projectSlice.reducer;