import type {BasicStatus} from "./enum";

export interface UserToken {
    accessToken?: string;
}

export interface UserInfo {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    avatar?: string;
    roles?: Role[];
    status?: BasicStatus;
    permissions?: Permission[];
}

export interface CommonOptions {
    status?: BasicStatus;
    desc?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface User extends CommonOptions {
    id: string; // uuid
    username: string;
    password: string;
    email: string;
    phone?: string;
    avatar?: string;
}

export interface Role extends CommonOptions {
    id: string; // uuid
    name: string;
    code: string;
}

export interface Permission extends CommonOptions {
    id: string; // uuid
    name: string;
    code: string; // resource:action  example: "user-management:read"
}


