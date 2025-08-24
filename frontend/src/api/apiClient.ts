import { GLOBAL_CONFIG } from "@/global-config";
import { t } from "@/locales/i18n";
import userStore from "@/store/userStore";
import axios, { type AxiosRequestConfig, type AxiosError, type AxiosResponse } from "axios";
import { toast } from "sonner";

interface BackendResponse<T = unknown> {
	statusCode: number;
	data: T;
	message: string;
	timestamp?: string;
	lang?: string;
}

const axiosInstance = axios.create({
	baseURL: GLOBAL_CONFIG.apiBaseUrl,
	timeout: 50000,
	headers: { "Content-Type": "application/json;charset=utf-8" },
	withCredentials: true, // Enable credentials to include refresh token cookie
});

axiosInstance.interceptors.request.use(
	(config) => {
		// Get the current access token from the store
		const { accessToken } = userStore.getState().userToken;

		// Only add Authorization header if token exists
		if (accessToken) {
			config.headers.Authorization = `Bearer ${accessToken}`;
		}

		return config;
	},
	(error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
	(res: AxiosResponse<BackendResponse<any>>) => {
		// Check for auto-refresh header and update token
		const newAccessToken = res.headers['x-new-access-token'];
		if (newAccessToken) {
			const currentToken = userStore.getState().userToken;
			userStore.getState().actions.setUserToken({
				...currentToken,
				accessToken: newAccessToken
			});
		}

		// Handle DELETE requests that might not return data
		if (res.config.method?.toUpperCase() === 'DELETE' && res.status >= 200 && res.status < 300) {
			// For successful DELETE requests, return success even without data
			return res.data?.data || null;
		}

		if (!res.data) throw new Error(t("sys.api.apiRequestFailed"));

		const { statusCode, data, message } = res.data;

		// Check if HTTP status code indicates success (2xx range)
		if (statusCode >= 200 && statusCode < 300) {
			return data; // Return the data part of the response
		}

		// If not successful, throw error with the message
		throw new Error(message || t("sys.api.apiRequestFailed"));
	},
	(error: AxiosError<any>) => {
		const { response, message } = error || {};

		// Handle different error scenarios
		let errMsg: string;

		if (response?.data?.message) {
			errMsg = response.data.message;
		} else if (response?.statusText) {
			errMsg = response.statusText;
		} else {
			errMsg = message || t("sys.api.errorMessage");
		}

		// Clear user data if unauthorized (refresh token expired/invalid)
		if (response?.status === 401) {
			userStore.getState().actions.clearUserInfoAndToken();
		} else {
			// Only show toast for non-401 errors
			toast.error(errMsg, { position: "top-center" });
		}

		return Promise.reject(error);
	},
);

class APIClient {
	get<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "GET" });
	}
	post<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "POST" });
	}
	put<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "PUT" });
	}
	delete<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "DELETE" });
	}
	request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return axiosInstance.request<any, T>(config);
	}
}

export default new APIClient();