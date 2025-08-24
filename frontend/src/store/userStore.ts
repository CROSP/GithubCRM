import {useMutation} from "@tanstack/react-query";
import {create} from "zustand";
import {createJSONStorage, persist} from "zustand/middleware";

import userService, {type SignInReq, SignUpReq, UpdateUserProfileReq} from "@/api/services/userService";

import {toast} from "sonner";
import type {UserInfo, UserToken} from "#/entity";
import {StorageEnum} from "#/enum";

type UserStore = {
    userInfo: Partial<UserInfo>;
    userToken: UserToken;

    actions: {
        setUserInfo: (userInfo: UserInfo) => void;
        setUserToken: (token: UserToken) => void;
        clearUserInfoAndToken: () => void;
        logout: () => Promise<void>;
        isAuthenticated: () => boolean;
        updateProfile: (data: UpdateUserProfileReq) => Promise<UserInfo>;
    };
};

const useUserStore = create<UserStore>()(
    persist(
        (set, get) => ({
            userInfo: {},
            userToken: {},
            actions: {
                setUserInfo: (userInfo) => {
                    set({userInfo});
                },
                setUserToken: (userToken) => {
                    set({userToken});
                },
                clearUserInfoAndToken() {
                    set({userInfo: {}, userToken: {}});
                },
                async logout() {
                    try {
                        await userService.logout();
                    } catch (error) {
                        // Even if logout fails, clear local data
                        console.warn('Logout request failed:', error);
                    } finally {
                        // Always clear local data
                        get().actions.clearUserInfoAndToken();
                    }
                },
                isAuthenticated() {
                    return !!get().userToken.accessToken;
                },
                async updateProfile(data: UpdateUserProfileReq) {
                    try {
                        const updatedUser = await userService.updateProfile(data);
                        // Update the userInfo in store with new data
                        set({userInfo: {...get().userInfo, ...updatedUser}});
                        return updatedUser;
                    } catch (error) {
                        console.error('Profile update failed:', error);
                        throw error;
                    }
                },
            },
        }),
        {
            name: "userStore",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                [StorageEnum.UserInfo]: state.userInfo,
                [StorageEnum.UserToken]: state.userToken,
            }),
        },
    ),
);

export const useUserInfo = () => useUserStore((state) => state.userInfo);
export const useUserToken = () => useUserStore((state) => state.userToken);
export const useUserPermissions = () => useUserStore((state) => state.userInfo.permissions || []);
export const useUserRoles = () => useUserStore((state) => state.userInfo.roles || []);
export const useUserActions = () => useUserStore((state) => state.actions);

export const useSignIn = () => {
    const {setUserToken, setUserInfo} = useUserActions();

    const signInMutation = useMutation({
        mutationFn: userService.signin,
    });

    const signIn = async (data: SignInReq) => {
        try {
            const res = await signInMutation.mutateAsync(data);
            const {user, accessToken} = res;
            // Only store accessToken - refreshToken is handled as HTTP-only cookie

            setUserToken({accessToken});
            setUserInfo(user);
        } catch (err) {
            toast.error(err.message, {
                position: "top-center",
            });
            throw err;
        }
    };

    return signIn;
};

export const useSignUp = () => {
    const {setUserToken, setUserInfo} = useUserActions();

    const signUpMutation = useMutation({
        mutationFn: userService.signup,
    });

    const signUp = async (data: SignUpReq) => {
        try {
            const res = await signUpMutation.mutateAsync(data);
            const {user, accessToken} = res;

            // Only store accessToken - refreshToken is handled as HTTP-only cookie
            setUserToken({accessToken});
            setUserInfo(user);

            return res;
        } catch (err) {
            toast.error(err.message, {
                position: "top-center",
            });
            throw err;
        }
    };

    return {
        signUp,
        isLoading: signUpMutation.isPending,
        error: signUpMutation.error,
    };
};

export const useLogout = () => {
    const {logout} = useUserActions();

    const logoutMutation = useMutation({
        mutationFn: logout,
    });

    return {
        logout: logoutMutation.mutateAsync,
        isLoading: logoutMutation.isPending,
    };
};

export const useUpdateProfile = () => {
    const {updateProfile} = useUserActions();

    const updateProfileMutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: () => {
            toast.success("Profile updated successfully!", {
                position: "top-center",
            });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update profile", {
                position: "top-center",
            });
        }
    });

    return {
        updateProfile: updateProfileMutation.mutateAsync,
        isLoading: updateProfileMutation.isPending,
        error: updateProfileMutation.error,
    };
};

export default useUserStore;