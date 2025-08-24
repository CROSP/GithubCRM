import type { RouteObject } from "react-router";
import { Navigate } from "react-router";
import { Component } from "./utils";

export function getMenuDashboardRoutes(): RouteObject[] {
    return [
        // Dashboard route - now includes statistics
        {
            path: "dashboard",
            element: Component("/pages/dashboard"),
        },

        // Main GitHub CRM Routes
        {
            path: "repositories",
            element: Component("/pages/repositories"),
        },

        { path: "user/profile", element: Component("/pages/user/profile") },

        // Error Pages - Keep for proper error handling
        {
            path: "error",
            children: [
                { index: true, element: <Navigate to="403" replace /> },
                { path: "403", element: Component("/pages/sys/error/Page403") },
                { path: "404", element: Component("/pages/sys/error/Page404") },
                { path: "500", element: Component("/pages/sys/error/Page500") },
            ],
        },

        // Default redirect to dashboard
        {
            index: true,
            element: <Navigate to="dashboard" replace />,
        },
    ];
}