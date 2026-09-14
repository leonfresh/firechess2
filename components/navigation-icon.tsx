import {
  ScanLine, FileChartColumn, FileCode2, Grid2X2, History, BookOpen,
  Compass, Target, Dumbbell, CalendarDays, Puzzle, Swords, Gamepad2,
  CircleHelp, Castle, Zap, Flame, Crosshair, Flag, MapPin, Timer,
  TriangleAlert, TrendingUp, Clapperboard, Crown, BookA, Trophy,
  Coins, GraduationCap, Video, Newspaper, Info, ListChecks,
  LifeBuoy, MessageSquare, UserRound, CreditCard, FolderOpen,
  Users, Handshake, Gift, LogOut, Ellipsis, LayoutDashboard, type LucideIcon,
} from "lucide-react";
import { navigationGroups } from "./site-navigation";
import s from "./site-navigation.module.css";

type NavigationHref = (typeof navigationGroups)[number]["links"][number][1];
const icons = {
  "/": ScanLine,
  "/report/8c8d499e-1f04-4121-aabc-71a818b98ce6": FileChartColumn,
  "/analyze": FileCode2, "/analysis": Grid2X2, "/review": History,
  "/my-openings": BookOpen, "/openings": Compass,
  "/newtraining": Target, "/train": Dumbbell, "/daily": CalendarDays,
  "/puzzles": Puzzle, "/sparring": Swords, "/play": Gamepad2,
  "/guess": CircleHelp, "/dungeon": Castle, "/chaos": Zap, "/roast": Flame,
  "/tactics": Crosshair, "/endgames": Flag, "/positions": MapPin,
  "/time-controls": Timer, "/mistakes": TriangleAlert, "/improve": TrendingUp,
  "/games": Clapperboard, "/players": Crown, "/glossary": BookA,
  "/leaderboard": Trophy, "/shop": Coins, "/coaches": GraduationCap,
  "/youtubers": Video, "/blog": Newspaper, "/about": Info,
  "/changelog": ListChecks, "/support": LifeBuoy, "/feedback": MessageSquare,
  "/profile": UserRound, "/account": CreditCard, "/dashboard": FolderOpen,
  "/admin/feedback": LifeBuoy, "/admin/users": Users,
  "/admin/affiliates": Handshake, "/admin/gift": Gift, "sign-out": LogOut,
  "/newdashboard": LayoutDashboard, "/newpricing": CreditCard, more: Ellipsis,
} satisfies Record<NavigationHref, LucideIcon> & Record<string, LucideIcon>;

export function NavigationIcon({ href, compact = false }: { href: keyof typeof icons; compact?: boolean }) {
  const Icon = icons[href];
  return <span className={compact ? s.rootIcon : s.itemIcon} aria-hidden="true"><Icon size={16} strokeWidth={1.8} /></span>;
}
