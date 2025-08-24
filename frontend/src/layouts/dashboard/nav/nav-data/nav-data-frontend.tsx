import {Icon} from "@/components/icon";
import type {NavProps} from "@/components/nav";

export const menuNavData: NavProps["data"] = [
	{
		name: "GitHub CRM",
		items: [
			{
				title: "Dashboard",
				path: "/dashboard",
				icon: <Icon icon="solar:home-bold-duotone" size="24" />,
			},
			{
				title: "Repositories",
				path: "/repositories",
				icon: <Icon icon="solar:database-bold-duotone" size="24" />,
			},
		],
	},
	{
		name: "Account",
		items: [
			// User management
			{
				title: "User",
				path: "/user",
				icon: <Icon icon="solar:user-bold-duotone" size="24" />,
				children: [
					{
						title: "Profile",
						path: "/user/profile",
					},
				],
			},
		],
	}
];