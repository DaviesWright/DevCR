import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  Building2,
  TrendingUp,
  Wallet,
  HeartHandshake,
  BarChart3,
  Settings,
  Megaphone,
  Zap,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Modules not yet built get a disabled, roadmap-labeled entry instead of a dead link. */
  comingSoon?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Customers", href: "/customers", icon: UserSquare2 },
  { label: "Projects", href: "/projects", icon: Building2 },
  { label: "Sales", href: "/sales", icon: TrendingUp },
  { label: "Payments", href: "/payments", icon: Wallet },
  { label: "Customer Experience", href: "/cx", icon: HeartHandshake },
  { label: "Marketing", href: "/marketing", icon: Megaphone },
  { label: "Automations", href: "/automations", icon: Zap },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Admin", href: "/admin", icon: Settings },
];

export type QuickAction = { label: string; href: string };

export const QUICK_ACTIONS: QuickAction[] = [
  { label: "New Lead", href: "/leads/new" },
  { label: "Log Call", href: "/leads?action=log-call" },
  { label: "Add Task", href: "/leads?action=add-task" },
];
