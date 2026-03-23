import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  Landmark, 
  Sparkles, 
  MessageSquare,
  LogOut,
  Bell
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/budgets", label: "Budgets", icon: PieChart },
  { href: "/tax-center", label: "Tax Center", icon: Landmark },
  { href: "/insights", label: "AI Insights", icon: Sparkles },
  { href: "/ai-advisor", label: "AI Advisor", icon: MessageSquare },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-border bg-card flex flex-col hidden md:flex z-10 relative">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-display font-bold text-xl text-foreground tracking-wide">
            SmartFinance <span className="text-primary">AI</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-primary/10 text-primary font-medium shadow-sm border border-primary/20' 
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }
              `}>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
            <Avatar className="w-10 h-10 border border-border">
              <AvatarImage src="https://i.pravatar.cc/150?u=alex" />
              <AvatarFallback>AS</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">Alex Smith</p>
              <p className="text-xs text-muted-foreground truncate">Pro Member</p>
            </div>
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 z-10 sticky top-0">
          <div className="md:hidden">
            <h1 className="font-display font-bold text-lg">SmartFinance AI</h1>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive border-2 border-background" />
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
