import { GLOBAL_CONFIG } from "@/global-config";
import DashboardLayout from "@/layouts/dashboard";
import LoginAuthGuard from "@/routes/components/login-auth-guard";
import { Navigate, type RouteObject } from "react-router";
import { getMenuDashboardRoutes } from "./dashboard-menu-routes.tsx";

const getRoutes = (): RouteObject[] => {
	return getMenuDashboardRoutes();
};

export const dashboardRoutes: RouteObject[] = [
	{
		element: (
			<LoginAuthGuard>
				<DashboardLayout />
			</LoginAuthGuard>
		),
		children: [{ index: true, element: <Navigate to={GLOBAL_CONFIG.defaultRoute} replace /> }, ...getRoutes()],
	},
];
