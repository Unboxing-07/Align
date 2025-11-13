import { api } from '../lib/api';
import type { WorkspaceType } from '../types/workspace';

export type CreateWorkspaceRequest = {
  name: string;
};

export type CreateWorkspaceResponse = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type AddMemberRequest = {
  email: string;
  role: string;
};

export type WorkspaceMemberResponse = {
  name: string;
  email: string;
  role: string;
};

export const workspaceService = {
  async getWorkspaces(): Promise<WorkspaceType[]> {
    return api.get<WorkspaceType[]>('/workspaces');
  },

  async getWorkspace(id: string): Promise<WorkspaceType> {
    return api.get<WorkspaceType>(`/workspaces/${id}`);
  },

  async createWorkspace(data: CreateWorkspaceRequest): Promise<CreateWorkspaceResponse> {
    return api.post<CreateWorkspaceResponse>('/workspaces', data);
  },

  async deleteWorkspace(id: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/workspaces/${id}`);
  },

  async getMembers(workspaceId: string): Promise<WorkspaceMemberResponse[]> {
    return api.get<WorkspaceMemberResponse[]>(`/workspaces/${workspaceId}/members`);
  },

  async addMember(workspaceId: string, data: AddMemberRequest): Promise<WorkspaceMemberResponse> {
    return api.post<WorkspaceMemberResponse>(`/workspaces/${workspaceId}/members`, data);
  },

  async removeMember(workspaceId: string, userId: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/workspaces/${workspaceId}/members/${userId}`);
  },

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: string
  ): Promise<WorkspaceMemberResponse> {
    return api.put<WorkspaceMemberResponse>(`/workspaces/${workspaceId}/members/${userId}`, { role });
  },
};
