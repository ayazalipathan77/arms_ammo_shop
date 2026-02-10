import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

// Helper to get CSRF token from cookies
export const getCsrfToken = (): string | null => {
    const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
    return match ? match[2] : null;
};

// Helper to make API requests with CSRF token
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const csrfToken = getCsrfToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
        ...options.headers,
    };
    return fetch(url, { ...options, headers });
};
