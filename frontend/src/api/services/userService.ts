import apiClient from "../apiClient";

import type {UserInfo, UserToken} from "#/entity";

export interface SignInReq {
    email: string;
    password: string;
}

export interface SignUpReq extends SignInReq {
    firstName: string;
    lastName: string;
}

export interface UpdateUserProfileReq {
    firstName?: string;
    lastName?: string;
    email?: string;
}

export type SignInRes = UserToken & { user: UserInfo };

export enum UserApi {
    SignIn = "/auth/login",
    SignUp = "/auth/register",
    Logout = "/auth/logout",
    User = "/user",
    UpdateProfile = "/profile",
}

const signin = (data: SignInReq) => apiClient.post<SignInRes>({url: UserApi.SignIn, data});
const signup = (data: SignUpReq) => apiClient.post<SignInRes>({url: UserApi.SignUp, data});
const logout = () => apiClient.post({url: UserApi.Logout});
const findById = (id: string) => apiClient.get<UserInfo[]>({url: `${UserApi.User}/${id}`});
const updateProfile = (data: UpdateUserProfileReq) => apiClient.put<UserInfo>({url: UserApi.UpdateProfile, data});

export default {
    signin,
    signup,
    logout,
    findById,
    updateProfile,
};