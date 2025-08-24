import {useUpdateProfile, useUserInfo} from "@/store/userStore";
import {Button} from "@/ui/button";
import {Card, CardContent, CardFooter} from "@/ui/card";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/ui/form";
import {Input} from "@/ui/input";
import {zodResolver} from "@hookform/resolvers/zod";
import {Loader2} from "lucide-react";
import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";

// Validation schema
const profileFormSchema = z.object({
    firstName: z.string()
        .min(1, "First name is required")
        .min(2, "First name must be at least 2 characters")
        .max(50, "First name must be less than 50 characters"),
    lastName: z.string()
        .min(1, "Last name is required")
        .min(2, "Last name must be at least 2 characters")
        .max(50, "Last name must be less than 50 characters"),
    email: z.string()
        .min(1, "Email is required")
        .email("Please enter a valid email address")
        .max(100, "Email must be less than 100 characters"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileEditTab() {
    const userInfo = useUserInfo();
    const {updateProfile, isLoading} = useUpdateProfile();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            firstName: userInfo.firstName || "",
            lastName: userInfo.lastName || "",
            email: userInfo.email || "",
        },
    });

    // Update form when userInfo changes
    useEffect(() => {
        if (userInfo.firstName || userInfo.lastName || userInfo.email) {
            form.reset({
                firstName: userInfo.firstName || "",
                lastName: userInfo.lastName || "",
                email: userInfo.email || "",
            });
        }
    }, [userInfo, form]);

    const handleSubmit = async (values: ProfileFormValues) => {
        try {
            await updateProfile(values);
            // Success toast is handled in the hook
        } catch (error) {
            // Error toast is handled in the hook
            console.error('Profile update failed:', error);
        }
    };

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
            {/* Profile Form Card */}
            <div className="col-span-1">
                <Card>
                    <CardContent className="pt-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="firstName"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>
                                                    First Name <span className="text-destructive">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter your first name"
                                                        {...field}
                                                        disabled={isLoading}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lastName"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Last Name <span className="text-destructive">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter your last name"
                                                        {...field}
                                                        disabled={isLoading}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>
                                                Email Address <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="Enter your email address"
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            </form>
                        </Form>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={() => form.reset()}
                            disabled={isLoading}
                        >
                            Reset
                        </Button>
                        <Button
                            onClick={form.handleSubmit(handleSubmit)}
                            disabled={isLoading || !form.formState.isDirty}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            {isLoading ? "Updating..." : "Save Changes"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}