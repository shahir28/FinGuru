import { useState } from "react";
import { useListTransactions, useDeleteTransaction, useBulkCategorizeTransactions } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { formatCurrency, formatDate } from "@/components/formatters";
import { motion } from "framer-motion";
import { Search, Filter, Plus, Trash2, Edit2, Sparkles, Loader2 } from "lucide-react";

export default function Transactions() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useListTransactions({ page, limit: 15 });
  const deleteMutation = useDeleteTransaction();
  const bulkCategorize = useBulkCategorizeTransactions();

  const handleDelete = async (id: number) => {
    if (confirm("Delete this transaction?")) {
      await deleteMutation.mutateAsync({ id });
      refetch();
    }
  };

  const handleBulkCategorize = async () => {
    await bulkCategorize.mutateAsync();
    refetch();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground mt-1">Manage and track your spending</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBulkCategorize}
              disabled={bulkCategorize.isPending}
              className="px-4 py-2 rounded-xl bg-accent/10 text-accent font-medium flex items-center gap-2 hover:bg-accent/20 transition-colors border border-accent/20 disabled:opacity-50"
            >
              {bulkCategorize.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI Categorize
            </button>
            <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button className="px-4 py-2 border border-border rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-muted transition-colors whitespace-nowrap w-full sm:w-auto justify-center">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Table */}
        <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 text-muted-foreground font-medium border-b border-border/50">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
                ) : data?.data?.map((tx, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={tx.id} 
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      <div className="flex flex-col">
                        <span>{tx.merchant || tx.description}</span>
                        {tx.notes && <span className="text-xs text-muted-foreground font-normal">{tx.notes}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs capitalize border border-border/50">
                        {tx.category}
                      </span>
                      {tx.aiCategorized && (
                        <Sparkles className="w-3 h-3 inline ml-2 text-accent" title="AI Categorized" />
                      )}
                    </td>
                    <td className={`px-6 py-4 text-right font-medium whitespace-nowrap ${tx.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-primary/10 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="p-4 border-t border-border/50 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing page {data.page} of {data.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
