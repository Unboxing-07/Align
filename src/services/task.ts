import { api } from '../lib/api';
import { TaskType, TaskStatusType } from '../types/task';

export type CreateTaskRequest = {
  title: string;
  description: string;
  assigneeId: string;
  input?: string;
  output?: string;
  deadline: string;
  status?: TaskStatusType;
};

export type UpdateTaskRequest = {
  title?: string;
  description?: string;
  assigneeId?: string;
  input?: string;
  output?: string;
  deadline?: string;
  status?: TaskStatusType;
};

export const taskService = {
  async getTasks(workspaceId: string, status?: TaskStatusType): Promise<TaskType[]> {
    const query = status ? `?status=${status}` : '';
    return api.get<TaskType[]>(`/workspaces/${workspaceId}/tasks${query}`);
  },

  async getTask(taskId: string): Promise<TaskType> {
    return api.get<TaskType>(`/tasks/detail/${taskId}`);
  },

  async createTask(workspaceId: string, data: CreateTaskRequest): Promise<TaskType> {
    return api.post<TaskType>(`/workspaces/${workspaceId}/tasks`, data);
  },

  async updateTask(taskId: string, data: UpdateTaskRequest): Promise<TaskType> {
    return api.put<TaskType>(`/tasks/detail/${taskId}`, data);
  },

  async deleteTask(taskId: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/tasks/detail/${taskId}`);
  },
};
