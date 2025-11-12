import { api } from '../lib/api';
import { LoginReqType, LoginResType, SignupReqType, SignupResType } from '../types/sign';

export const authService = {
  async login(data: LoginReqType): Promise<LoginResType> {
    const response = await api.post<LoginResType>('/auth/login', data);
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  async signup(data: SignupReqType): Promise<SignupResType> {
    const response = await api.post<SignupResType>('/auth/signup', data);
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  logout() {
    localStorage.removeItem('token');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
