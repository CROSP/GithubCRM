import React from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Loader2} from "lucide-react";

import {Button} from "@/ui/button";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,} from "@/ui/form";
import {Input} from "@/ui/input";

import {useAddRepositoryMutation} from "@/store/repositoryStore";
import githubService from "@/api/services/githubService";

// Form validation schema
const addRepositorySchema = z.object({
    githubPath: z
        .string()
        .min(1, "GitHub path is required")
        .regex(
            /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/,
            "Please enter a valid GitHub path (e.g., facebook/react)"
        ),
});

type AddRepositoryFormData = z.infer<typeof addRepositorySchema>;

interface AddRepositoryFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

const AddRepositoryForm: React.FC<AddRepositoryFormProps> = ({
                                                                 onSuccess,
                                                                 onCancel,
                                                             }) => {
    const addRepositoryMutation = useAddRepositoryMutation();

    const form = useForm<AddRepositoryFormData>({
        resolver: zodResolver(addRepositorySchema),
        defaultValues: {
            githubPath: "",
        },
    });

    const onSubmit = async (data: AddRepositoryFormData) => {
        try {
            await addRepositoryMutation.mutateAsync({
                githubPath: data.githubPath.trim(),
            });
            form.reset();
            onSuccess?.();
        } catch (error) {
            // Error handling is done in the mutation
            console.error("Failed to add repository:", error);
        }
    };

    const isLoading = addRepositoryMutation.isPending;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="githubPath"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>GitHub Repository Path</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g., facebook/react"
                                    {...field}
                                    disabled={isLoading}
                                    onChange={(e) => {
                                        field.onChange(e);
                                        // Clear any server errors when user starts typing
                                        form.clearErrors("githubPath");
                                    }}
                                />
                            </FormControl>
                            <FormDescription>
                                Enter the GitHub repository path in the format "owner/repository".
                                The system will automatically fetch repository information from GitHub.
                            </FormDescription>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                {/* Preview section */}
                {form.watch("githubPath") && githubService.validateGitHubPath(form.watch("githubPath")) && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Repository Preview:
                        </h4>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>
                                <strong>URL:</strong>{" "}
                                <a
                                    href={githubService.generateGitHubUrl(form.watch("githubPath"))}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    {githubService.generateGitHubUrl(form.watch("githubPath"))}
                                </a>
                            </p>
                            {(() => {
                                const parsed = githubService.parseGitHubPath(form.watch("githubPath"));
                                if (parsed) {
                                    return (
                                        <>
                                            <p><strong>Owner:</strong> {parsed.owner}</p>
                                            <p><strong>Repository:</strong> {parsed.repo}</p>
                                        </>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex justify-end gap-3">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                Adding Repository...
                            </>
                        ) : (
                            "Add Repository"
                        )}
                    </Button>
                </div>

                {/* Help text */}
                <div className="text-xs text-gray-500 space-y-1">
                    <p><strong>Note:</strong> After adding a repository:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>The system will fetch repository data from GitHub API in the background</li>
                        <li>You can only manage repositories that you have added</li>
                        <li>Repository data will be synced periodically</li>
                    </ul>
                </div>
            </form>
        </Form>
    );
};

export default AddRepositoryForm;