import { useGetFinancialSummary, useGetAIAnalysis } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { Sparkles, Brain, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

export default function Insights() {
  const { data: summary } = useGetFinancialSummary();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const generateAnalysis = useGetAIAnalysis();

  useEffect(() => {
    generateAnalysis.mutateAsync({ data: { question: "Provide a comprehensive financial health review." } })
      .then(res => {
        setAnalysis(res);
        setLoading(false);
      });
  }, []);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-accent" />
            AI Insights
          </h1>
          <p className="text-muted-foreground mt-1">Deep analysis of your financial health powered by AI.</p>
        </div>

        {/* AI Health Score Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-card via-card to-accent/10 border border-accent/20 shadow-xl"
        >
          <div className="absolute right-0 top-0 w-64 h-64 bg-accent/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-full border-8 border-accent/20 flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="56" fill="none" stroke="hsl(var(--accent))" strokeWidth="8" strokeDasharray="351" strokeDashoffset={351 - (351 * (analysis?.score || 85)) / 100} className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="text-center">
                <span className="text-4xl font-display font-bold text-foreground">{analysis?.score || 85}</span>
                <span className="block text-xs text-muted-foreground">Score</span>
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">Financial Health is Good</h2>
              <p className="text-muted-foreground leading-relaxed">
                {summary?.aiInsight || "Your saving rate is optimal, but there are opportunities to optimize your dining and entertainment expenses."}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg">AI Observations</h3>
            </div>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
                <div className="h-4 bg-muted rounded w-4/6"></div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-sm text-foreground/80 leading-relaxed">
                <p>{analysis?.analysis || "Based on your recent transactions, your core spending is highly stable. However, recurring subscriptions have increased by 15% over the last quarter."}</p>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-success/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-success" />
              </div>
              <h3 className="font-display font-semibold text-lg">Actionable Recommendations</h3>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                 <div className="h-12 bg-muted rounded animate-pulse w-full"></div>
              ) : (
                analysis?.recommendations?.map((rec: string, i: number) => (
                  <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors">
                    <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground">{rec}</p>
                  </div>
                )) || (
                  <>
                    <div className="flex gap-3 items-start p-3 rounded-xl bg-muted/20 border border-border/50">
                      <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-foreground">Cancel unused streaming services saving ~$45/mo.</p>
                    </div>
                    <div className="flex gap-3 items-start p-3 rounded-xl bg-muted/20 border border-border/50">
                      <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-foreground">Move excess checking funds to high-yield savings.</p>
                    </div>
                  </>
                )
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
