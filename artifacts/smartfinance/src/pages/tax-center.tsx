import { useState } from "react";
import { useGetTaxSummary } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { formatCurrency } from "@/components/formatters";
import { motion } from "framer-motion";
import { Download, Landmark, FileText, CheckCircle2 } from "lucide-react";

export default function TaxCenter() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: taxData, isLoading } = useGetTaxSummary({ year });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Tax Center</h1>
            <p className="text-muted-foreground mt-1">Estimate liability and track deductibles</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-card border border-border rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-primary transition-colors"
            >
              {[year, year-1, year-2].map(y => (
                <option key={y} value={y}>{y} Tax Year</option>
              ))}
            </select>
            <button className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-medium flex items-center gap-2 hover:bg-secondary/80 transition-colors border border-border/50">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {isLoading ? (
           <div className="h-64 bg-card rounded-2xl animate-pulse" />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 text-muted-foreground mb-4">
                  <Landmark className="w-5 h-5 text-primary" />
                  <span className="font-medium">Total Income</span>
                </div>
                <h2 className="text-3xl font-display font-bold text-foreground">{formatCurrency(taxData?.totalIncome || 0)}</h2>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 text-muted-foreground mb-4">
                  <FileText className="w-5 h-5 text-success" />
                  <span className="font-medium">Deductible Expenses</span>
                </div>
                <h2 className="text-3xl font-display font-bold text-success">{formatCurrency(taxData?.deductibleExpenses || 0)}</h2>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-card to-primary/5 border border-primary/20 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 text-primary mb-4">
                  <Landmark className="w-5 h-5" />
                  <span className="font-medium">Est. Tax Liability</span>
                </div>
                <h2 className="text-3xl font-display font-bold text-foreground">{formatCurrency(taxData?.estimatedTax || 0)}</h2>
                <p className="text-xs text-muted-foreground mt-2">Based on standard brackets</p>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border/50">
                <h3 className="font-display font-semibold text-lg">Deductible Categories</h3>
              </div>
              <div className="p-0">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/30 text-muted-foreground font-medium border-b border-border/50">
                    <tr>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {taxData?.categories?.map((cat, i) => (
                      <tr key={i} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground capitalize">{cat.category}</td>
                        <td className="px-6 py-4">
                          {cat.isDeductible ? (
                            <span className="inline-flex items-center text-success text-xs font-medium bg-success/10 px-2 py-1 rounded">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Deductible
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">Standard</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(cat.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </Layout>
  );
}
