"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  FileText,
  Truck,
  ArrowRightLeft,
  MapPin,
  BarChart3,
  Settings,
  PanelLeft,
  Users,
  Car,
  Tags,
  type LucideIcon,
} from "lucide-react";
import { getIndustry } from "@/lib/industries";
import { canSeeNav, type NavKey } from "@/lib/permissions";
import type { Role } from "@/lib/auth";
import styles from "./Sidebar.module.css";

type NavItem = { label: string; href: string; icon: LucideIcon; key: NavKey };
type NavGroup = { title: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    title: "Primary",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, key: "dashboard" },
      { label: "Items", href: "/items", icon: Boxes, key: "items" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Transfers", href: "/transfers", icon: ArrowRightLeft, key: "transfers" },
      { label: "Purchase Orders", href: "/purchase-orders", icon: FileText, key: "purchase_orders" },
      { label: "Suppliers", href: "/suppliers", icon: Truck, key: "suppliers" },
      { label: "Employees", href: "/employees", icon: Users, key: "employees" },
      { label: "Transport", href: "/transport", icon: Car, key: "transport" },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { label: "Categories", href: "/categories", icon: Tags, key: "categories" },
      { label: "Locations", href: "/locations", icon: MapPin, key: "locations" },
    ],
  },
  {
    title: "Insights",
    items: [{ label: "Reports", href: "/reports", icon: BarChart3, key: "reports" }],
  },
];

export default function Sidebar({
  industryKey,
  role,
  collapsed,
  onToggle,
}: {
  industryKey: string;
  role: Role;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const industry = getIndustry(industryKey);
  const Ind = industry.Icon;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className={styles.sidebar} data-collapsed={collapsed}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden>SL</span>
          <span className={styles.brandName}>StockLens</span>
        </div>
        <button
          className={styles.collapse}
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft size={18} />
        </button>
      </div>

      <Link href="/onboarding" className={styles.industry} title="Change industry">
        <span className={styles.indIcon}>
          <Ind size={18} />
        </span>
        <span className={styles.indText}>
          <span className={styles.indLabel}>{industry.label}</span>
          <span className={styles.indChange}>Change industry</span>
        </span>
      </Link>

      <nav className={styles.nav}>
        {GROUPS.map((g) => {
          const items = g.items.filter((it) => canSeeNav(role, it.key));
          if (!items.length) return null;
          return (
            <div className={styles.group} key={g.title}>
              <p className={styles.groupTitle}>{g.title}</p>
              {items.map((it) => {
                const Icon = it.icon;
                return (
                  <Link key={it.href} href={it.href} className={styles.item} data-active={isActive(it.href)}>
                    <Icon size={18} />
                    <span className={styles.itemLabel}>{it.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <Link href="/settings" className={styles.item} data-active={isActive("/settings")}>
          <Settings size={18} />
          <span className={styles.itemLabel}>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
