import { Suspense, lazy } from "react";
import { Outlet } from "react-router";
import type { RouteObject } from "react-router";
import {Loader} from "lucide-react";

const LoginPage = lazy(() => import("@/pages/sys/login"));
const authCustom: RouteObject[] = [
	{
		path: "login",
		element: <LoginPage />,
	},
];

export const authRoutes: RouteObject[] = [
	{
		path: "auth",
		element: (
			<Suspense fallback={<Loader />}>
				<Outlet />
			</Suspense>
		),
		children: [...authCustom],
	},
];
