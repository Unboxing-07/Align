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

export type UpdateWorkflowNodesRequest = {
  nodes?: any[];
  edges?: any[];
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

  async updateWorkflowNodes(id: string, data: UpdateWorkflowNodesRequest): Promise<WorkflowType> {
    return api.put<WorkflowType>(`/workflows/${id}`, data);
  },

  async deleteWorkflow(id: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/workflows/${id}`);
  },
};
