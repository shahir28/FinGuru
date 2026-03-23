import { useListBudgets, useUpdateBudget } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { formatCurrency } from "@/components/formatters";
import { motion } from "framer-motion";
import { PieChart, Plus, AlertTriangle } from "lucide-react";

export default function Budgets() {
  const { data: budgets, isLoading } = useListBudgets();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Budgets</h1>
            <p className="text-muted-foreground mt-1">Track your spending limits by category</p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Create Budget
          </button>
        </div>

        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="show" 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-card rounded-2xl border border-border/50 animate-pulse" />
            ))
          ) : budgets?.map(budget => {
            const percentage = Math.min(100, (budget.spent / budget.limit) * 100);
            const isOver = percentage >= 100;
            const isNear = percentage >= (budget.alertThreshold || 80) && !isOver;
            
            let colorClass = "bg-primary";
            if (isOver) colorClass = "bg-destructive";
            else if (isNear) colorClass = "bg-warning";

            return (
              <motion.div key={budget.id} variants={itemVariants} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-secondary rounded-xl">
                      <PieChart className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground capitalize">{budget.category}</h3>
                      <p className="text-xs text-muted-foreground">Monthly Limit</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-lg">{formatCurrency(budget.spent)}</p>
                    <p className="text-xs text-muted-foreground">of {formatCurrency(budget.limit)}</p>
                  </div>
                </div>

                <div className="relative h-2 w-full bg-secondary rounded-full overflow-hidden mb-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`absolute top-0 left-0 h-full rounded-full ${colorClass}`} 
                  />
                </div>
                
                <div className="flex justify-between items-center text-xs mt-3">
                  <span className={`font-medium ${isOver ? 'text-destructive' : isNear ? 'text-warning' : 'text-muted-foreground'}`}>
                    {percentage.toFixed(0)}% used
                  </span>
                  
                  {isOver && (
                    <span className="flex items-center text-destructive font-medium bg-destructive/10 px-2 py-0.5 rounded text-[10px]">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Over Budget
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </Layout>
  );
}
