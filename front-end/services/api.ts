import { RepairItem, WatchAnalysis } from '../types';

export interface User {
    phone: string;
    name: string;
    role: 'CUSTOMER' | 'ADMIN';
}

const API_URL = import.meta.env.PROD
    ? 'https://borges-relojoaria-728960761149.us-central1.run.app'
    : 'http://127.0.0.1:8000';

export const api = {
    async getUser(phone: string): Promise<User | null> {
        const response = await fetch(`${API_URL}/users/${phone}`);
        if (response.status === 404) {
            return null;
        }
        if (!response.ok) {
            throw new Error('Failed to fetch user');
        }
        return response.json();
    },

    async createUser(user: User): Promise<User> {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        });
        if (!response.ok) {
            throw new Error('Failed to create user');
        }
        return response.json();
    },

    async getRepairs(phone?: string): Promise<RepairItem[]> {
        const url = phone ? `${API_URL}/repairs?user_phone=${phone}` : `${API_URL}/repairs`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch repairs');
        }
        return response.json();
    },

    async createRepair(repair: RepairItem): Promise<RepairItem> {
        const response = await fetch(`${API_URL}/repairs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(repair),
        });
        if (!response.ok) {
            throw new Error('Failed to create repair');
        }
        return response.json();
    },

    async updateRepair(repair: RepairItem): Promise<RepairItem> {
        const response = await fetch(`${API_URL}/repairs/${repair.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(repair),
        });
        if (!response.ok) {
            throw new Error('Failed to update repair');
        }
        return response.json();
    },

    async analyzeImage(base64Image: string): Promise<WatchAnalysis> {
        const response = await fetch(`${API_URL}/analyze-base64`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: base64Image }),
        });
        if (!response.ok) {
            throw new Error('Failed to analyze image');
        }
        return response.json();
    },

    async getAdminPhone(): Promise<string> {
        const response = await fetch(`${API_URL}/admin-phone`);
        if (!response.ok) {
            throw new Error('Failed to fetch admin phone');
        }
        const data = await response.json();
        return data.phone;
    }
};
