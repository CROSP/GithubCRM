import {Icon} from "@/components/icon";
import {useUserInfo} from "@/store/userStore.ts";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/ui/card.tsx";
import {faker} from "@faker-js/faker";

export default function ProfileTab() {
    const {firstName, lastName, email, roles} = useUserInfo();
    const AboutItems = [
        {
            icon: <Icon icon="fa-solid:user" size={18}/>,
            label: "Full Name",
            val: `${firstName} ${lastName}`,
        },
        {
            icon: <Icon icon="eos-icons:role-binding" size={18}/>,
            label: "Role",
            val: roles?.map(value => value.name).join(","),
        },
        {
            icon: <Icon icon="ic:baseline-email" size={18}/>,
            label: "Email",
            val: email,
        },
    ];


    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>About</CardTitle>
                        <CardDescription>{faker.lorem.paragraph()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4">
                            {AboutItems.map((item) => (
                                <div className="flex" key={item.label}>
                                    <div className="mr-2">{item.icon}</div>
                                    <div className="mr-2">{item.label}:</div>
                                    <div className="opacity-50">{item.val}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
