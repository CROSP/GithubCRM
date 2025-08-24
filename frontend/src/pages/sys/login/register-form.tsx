import {GLOBAL_CONFIG} from "@/global-config";
import {useSignUp} from "@/store/userStore";
import {Button} from "@/ui/button";
import {Form, FormControl, FormField, FormItem, FormMessage} from "@/ui/form";
import {Input} from "@/ui/input";
import {useForm} from "react-hook-form";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router";
import {toast} from "sonner";
import {ReturnButton} from "./components/ReturnButton";
import {LoginStateEnum, useLoginStateContext} from "./providers/login-provider";

function RegisterForm() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {loginState, backToLogin} = useLoginStateContext();
    const {signUp, isLoading} = useSignUp();

    const form = useForm({
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onFinish = async (values: any) => {
        const {confirmPassword, ...signUpData} = values;

        try {
            const response = await signUp(signUpData);

            // Show success message
            toast.success(t("sys.login.registerSuccessTitle") || "Registration successful!", {
                description: t("sys.login.registerSuccessDesc") || `Welcome ${response.user.firstName}!`,
                closeButton: true,
            });

            // Navigate to main page
            navigate(GLOBAL_CONFIG.defaultRoute, {replace: true});

        } catch (error) {
            console.error("Registration failed:", error);
        }
    };

    if (loginState !== LoginStateEnum.REGISTER) return null;

    // @ts-ignore
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onFinish)} className="space-y-4">
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">{t("sys.login.signUpFormTitle")}</h1>
                </div>

                <FormField
                    control={form.control}
                    name="firstName"
                    rules={{required: t("sys.login.accountPlaceholder")}}
                    render={({field}) => (
                        <FormItem>
                            <FormControl>
                                <Input placeholder={t("sys.login.firstName")} {...field} />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="lastName"
                    rules={{required: t("sys.login.accountPlaceholder")}}
                    render={({field}) => (
                        <FormItem>
                            <FormControl>
                                <Input placeholder={t("sys.login.lastName")} {...field} />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    rules={{
                        required: t("sys.login.emaildPlaceholder"),
                        pattern: {
                            value: /\S+@\S+\.\S+/,
                            message: "Please enter a valid email address"
                        }
                    }}
                    render={({field}) => (
                        <FormItem>
                            <FormControl>
                                <Input type="email" placeholder={t("sys.login.email")} {...field} />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    rules={{
                        required: t("sys.login.passwordPlaceholder"),
                        minLength: {
                            value: 6,
                            message: "Password must be at least 6 characters"
                        }
                    }}
                    render={({field}) => (
                        <FormItem>
                            <FormControl>
                                <Input type="password" placeholder={t("sys.login.password")} {...field} />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="confirmPassword"
                    rules={{
                        required: t("sys.login.confirmPasswordPlaceholder"),
                        validate: (value) =>
                            value === form.getValues('password') || t("sys.login.diffPwd")
                    }}
                    render={({field}) => (
                        <FormItem>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder={t("sys.login.confirmPassword")}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    className="w-full"
                    loading={isLoading}
                    disabled={isLoading}
                >
                    {isLoading ? "Creating Account..." : t("sys.login.registerButton")}
                </Button>

                <ReturnButton onClick={backToLogin}/>
            </form>
        </Form>
    );
}

export default RegisterForm;