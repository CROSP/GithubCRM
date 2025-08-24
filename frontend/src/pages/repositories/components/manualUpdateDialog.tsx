import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/ui/dialog";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useUpdateRepositoryMutation } from "@/store/repositoryStore";
import type { GitHubRepository } from "@/types/github";

interface ManualUpdateDialogProps {
    repository: GitHubRepository | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface UpdateForm {
    stars: number;
    forks: number;
    openIssues: number;
    description: string;
}

const ManualUpdateDialog: React.FC<ManualUpdateDialogProps> = ({
                                                                   repository,
                                                                   open,
                                                                   onOpenChange,
                                                               }) => {
    const [formData, setFormData] = useState<UpdateForm>({
        stars: repository?.stars || 0,
        forks: repository?.forks || 0,
        openIssues: repository?.openIssues || 0,
        description: repository?.description || "",
    });

    const updateRepositoryMutation = useUpdateRepositoryMutation();

    // Update form data when repository changes
    React.useEffect(() => {
        if (repository) {
            setFormData({
                stars: repository.stars,
                forks: repository.forks,
                openIssues: repository.openIssues,
                description: repository.description || "",
            });
        }
    }, [repository]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!repository) return;

        try {
            await updateRepositoryMutation.mutateAsync({
                id: repository.id,
                data: {
                    stars: formData.stars,
                    forks: formData.forks,
                    openIssues: formData.openIssues,
                    description: formData.description || undefined,
                }
            });

            toast.success("Repository updated successfully");
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to update repository");
            console.error("Update error:", error);
        }
    };

    const handleInputChange = (field: keyof UpdateForm, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const hasChanges = repository && (
        formData.stars !== repository.stars ||
        formData.forks !== repository.forks ||
        formData.openIssues !== repository.openIssues ||
        formData.description !== (repository.description || "")
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Repository Manually</DialogTitle>
                    <DialogDescription>
                        Manually update repository statistics and description for{" "}
                        <strong>{repository?.githubPath}</strong>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="stars">Stars</Label>
                            <Input
                                id="stars"
                                type="number"
                                min="0"
                                value={formData.stars}
                                onChange={(e) => handleInputChange('stars', parseInt(e.target.value) || 0)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="forks">Forks</Label>
                            <Input
                                id="forks"
                                type="number"
                                min="0"
                                value={formData.forks}
                                onChange={(e) => handleInputChange('forks', parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="openIssues">Open Issues</Label>
                        <Input
                            id="openIssues"
                            type="number"
                            min="0"
                            value={formData.openIssues}
                            onChange={(e) => handleInputChange('openIssues', parseInt(e.target.value) || 0)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Repository description..."
                            rows={3}
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={updateRepositoryMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!hasChanges || updateRepositoryMutation.isPending}
                        >
                            {updateRepositoryMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Update Repository
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ManualUpdateDialog;