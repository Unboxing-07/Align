import { api } from '../lib/api';
import type { WorkflowType } from '../types/workspace';

export type CreateWorkflowRequest = {
  workspaceId: string;
  name: string;
};

export type CreateWorkflowResponse = {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export const workflowService = {
  async createWorkflow(data: CreateWorkflowRequest): Promise<CreateWorkflowResponse> {
    return api.post<CreateWorkflowResponse>('/workflows', data);
  },

  async getWorkflow(id: string): Promise<WorkflowType> {
    return api.get<WorkflowType>(`/workflows/${id}`);
  },

  async updateWorkflow(id: string, name: string): Promise<CreateWorkflowResponse> {
    return api.put<CreateWorkflowResponse>(`/workflows/${id}`, { name });
  },

  async deleteWorkflow(id: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/workflows/${id}`);
  },
};
