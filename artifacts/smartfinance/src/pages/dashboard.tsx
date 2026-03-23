import { 
  useGetFinancialSummary, 
  useGetSpendingTrends,
  useGetCategoryBreakdown,
  useListTransactions,
  useDetectAnomalies
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { formatCurrency, formatDate } from "@/components/formatters";
import { motion } from "framer-motion";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  TrendingUp, 
  Sparkles,
  AlertCircle,
  CreditCard,
  Plus
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetFinancialSummary();
  const { data: trends } = useGetSpendingTrends({ months: 6 });
  const { data: categories } = useGetCategoryBreakdown({});
  const { data: transactions } = useListTransactions({ limit: 5 });
  const { data: anomalies } = useDetectAnomalies();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (isLoadingSummary) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Welcome back, Alex</h1>
            <p className="text-muted-foreground mt-1">Here is your financial overview for this month.</p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div variants={itemVariants} className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
            </div>
            <h2 className="text-3xl font-display font-bold mt-4">{formatCurrency(summary?.totalBalance || 0)}</h2>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <span className="text-success flex items-center font-medium">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                2.4%
              </span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Monthly Income</p>
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
            </div>
            <h2 className="text-3xl font-display font-bold mt-4">{formatCurrency(summary?.monthlyIncome || 0)}</h2>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <span className={`flex items-center font-medium ${(summary?.changeFromLastMonth?.income || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                {(summary?.changeFromLastMonth?.income || 0) >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {formatCurrency(Math.abs(summary?.changeFromLastMonth?.income || 0))}
              </span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Monthly Expenses</p>
              <div className="p-2 bg-destructive/10 rounded-lg">
                <CreditCard className="w-4 h-4 text-destructive" />
              </div>
            </div>
            <h2 className="text-3xl font-display font-bold mt-4">{formatCurrency(summary?.monthlyExpenses || 0)}</h2>
            <div className="flex items-center gap-1 mt-2 text-sm">
               <span className={`flex items-center font-medium ${(summary?.changeFromLastMonth?.expenses || 0) <= 0 ? 'text-success' : 'text-destructive'}`}>
                {(summary?.changeFromLastMonth?.expenses || 0) >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {formatCurrency(Math.abs(summary?.changeFromLastMonth?.expenses || 0))}
              </span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-gradient-to-br from-accent/20 to-primary/10 border border-accent/30 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-16 h-16 text-accent" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-accent-foreground">AI Insight</p>
                <Sparkles className="w-4 h-4 text-accent" />
              </div>
              <p className="text-sm mt-4 text-foreground/90 leading-relaxed font-medium">
                {summary?.aiInsight || "Your spending in 'Dining' is 20% lower this month. Great job staying on budget!"}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-display font-semibold text-lg mb-6">Spending vs Income</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                    itemStyle={{ fontWeight: 500 }}
                  />
                  <Bar dataKey="income" name="Income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Donut Chart */}
          <motion.div variants={itemVariants} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-display font-semibold text-lg mb-6">Top Categories</h3>
            <div className="h-[200px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="amount"
                  >
                    {categories?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || `hsl(var(--chart-${(index % 5) + 1}))`} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Inner Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-muted-foreground text-xs font-medium">Expenses</span>
                <span className="font-display font-bold text-xl">{formatCurrency(summary?.monthlyExpenses || 0)}</span>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              {categories?.slice(0,3).map(cat => (
                <div key={cat.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-muted-foreground capitalize">{cat.category}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(cat.amount)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg">Recent Transactions</h3>
              <button className="text-sm text-primary hover:text-primary/80 font-medium">View All</button>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/30 text-muted-foreground font-medium border-b border-border/50">
                  <tr>
                    <th className="px-6 py-3">Merchant</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {transactions?.data?.map(tx => (
                    <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
                            {tx.merchant?.charAt(0) || 'T'}
                          </div>
                          {tx.merchant || tx.description}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs capitalize">
                          {tx.category}
                        </span>
                        {tx.aiCategorized && (
                          <Sparkles className="w-3 h-3 inline ml-1 text-accent" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDate(tx.date)}</td>
                      <td className={`px-6 py-4 text-right font-medium ${tx.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!transactions?.data || transactions.data.length === 0) && (
                 <div className="p-8 text-center text-muted-foreground">No recent transactions</div>
              )}
            </div>
          </motion.div>

          {/* Anomalies */}
          <motion.div variants={itemVariants} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="w-5 h-5 text-warning" />
              <h3 className="font-display font-semibold text-lg">Needs Attention</h3>
            </div>
            <div className="space-y-4">
              {anomalies?.map(anomaly => (
                <div key={anomaly.transactionId} className="p-4 rounded-xl border border-warning/20 bg-warning/5">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-foreground text-sm">{anomaly.description}</p>
                    <p className="font-bold text-sm">{formatCurrency(anomaly.amount)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{anomaly.reason}</p>
                </div>
              ))}
              {(!anomalies || anomalies.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Everything looks normal.</p>
              )}
            </div>
          </motion.div>
        </div>

      </motion.div>
    </Layout>
  );
}
