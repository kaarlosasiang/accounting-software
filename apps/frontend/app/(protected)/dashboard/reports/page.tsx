"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Calculator, PieChart, BarChart3, FileText } from "lucide-react";

// Dummy financial datasets
const profitLossData = [
  { month: "Jan", revenue: 45000, cost: 32000, operatingExpenses: 8000 },
  { month: "Feb", revenue: 52000, cost: 35000, operatingExpenses: 8200 },
  { month: "Mar", revenue: 48000, cost: 33000, operatingExpenses: 7900 },
  { month: "Apr", revenue: 61000, cost: 38000, operatingExpenses: 9000 },
  { month: "May", revenue: 55000, cost: 36000, operatingExpenses: 8500 },
  { month: "Jun", revenue: 67000, cost: 40000, operatingExpenses: 9200 },
];

const balanceSheet = {
  assets: {
    cash: 54000,
    accountsReceivable: 18000,
    inventory: 12500,
    fixedAssets: 86000,
  },
  liabilities: {
    accountsPayable: 14500,
    shortTermDebt: 10000,
    longTermDebt: 42000,
  },
  equity: {
    retainedEarnings: 38000,
    ownerEquity: 58000,
  },
};

const cashFlowData = [
  { period: "Q1", operating: 23500, investing: -6000, financing: 4000 },
  { period: "Q2", operating: 26800, investing: -7200, financing: 3000 },
];

const taxSummary = [
  { quarter: "Q1", taxableIncome: 52000, taxRate: 0.25, paid: 12000 },
  { quarter: "Q2", taxableIncome: 61000, taxRate: 0.25, paid: 0 },
];

// Derived totals
const totalRevenue = profitLossData.reduce((a, m) => a + m.revenue, 0);
const totalCost = profitLossData.reduce((a, m) => a + m.cost, 0);
const totalOpEx = profitLossData.reduce((a, m) => a + m.operatingExpenses, 0);
const grossProfit = totalRevenue - totalCost;
const netProfit = grossProfit - totalOpEx;
const grossMarginPct = (grossProfit / totalRevenue) * 100;
const netMarginPct = (netProfit / totalRevenue) * 100;
const cashPosition = balanceSheet.assets.cash;
const workingCapital =
  balanceSheet.assets.cash +
  balanceSheet.assets.accountsReceivable +
  balanceSheet.assets.inventory -
  (balanceSheet.liabilities.accountsPayable + balanceSheet.liabilities.shortTermDebt);
const unpaidTax = taxSummary.reduce(
  (a, q) => a + (q.taxableIncome * q.taxRate - q.paid),
  0
);

export default function DashboardReportsPage() {
  return (
    <div className="flex flex-col gap-8 pb-10">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Dashboard Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              Consolidated financial statements & performance summaries
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="hover:bg-accent/50">
              <Download className="h-4 w-4 mr-2" /> Export All
            </Button>
            <Button size="sm" className="shadow-md hover:shadow-lg transition-all">
              <FileText className="h-4 w-4 mr-2" /> Generate PDF
            </Button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
            <div className="absolute inset-0 bg-linear-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (YTD)</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-2">Gross Margin: {grossMarginPct.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit (YTD)</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{netProfit.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-2">Net Margin: {netMarginPct.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
            <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cash Position</CardTitle>
              <Calculator className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{cashPosition.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-2">Working Capital: ₱{workingCapital.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
            <div className="absolute inset-0 bg-linear-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid Tax</CardTitle>
                <PieChart className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱{unpaidTax.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-2">Across {taxSummary.length} quarters</p>
              </CardContent>
          </Card>
        </div>

        {/* Profit & Loss */}
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <CardTitle>Profit &amp; Loss (YTD)</CardTitle>
            <CardDescription>Operational performance by month</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b">
                    <th className="py-2 text-left font-medium">Month</th>
                    <th className="py-2 text-left font-medium">Revenue</th>
                    <th className="py-2 text-left font-medium">Cost</th>
                    <th className="py-2 text-left font-medium">Gross Profit</th>
                    <th className="py-2 text-left font-medium">OpEx</th>
                    <th className="py-2 text-left font-medium">Net Profit</th>
                    <th className="py-2 text-left font-medium">Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {profitLossData.map((row) => {
                    const gp = row.revenue - row.cost;
                    const np = gp - row.operatingExpenses;
                    return (
                      <tr key={row.month} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-2 font-medium">{row.month}</td>
                        <td className="py-2">₱{row.revenue.toLocaleString()}</td>
                        <td className="py-2 text-red-600">₱{row.cost.toLocaleString()}</td>
                        <td className="py-2 text-green-600">₱{gp.toLocaleString()}</td>
                        <td className="py-2">₱{row.operatingExpenses.toLocaleString()}</td>
                        <td className="py-2 font-semibold">₱{np.toLocaleString()}</td>
                        <td className="py-2">{(np / row.revenue * 100).toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td className="py-2">Total</td>
                    <td className="py-2">₱{totalRevenue.toLocaleString()}</td>
                    <td className="py-2 text-red-600">₱{totalCost.toLocaleString()}</td>
                    <td className="py-2 text-green-600">₱{grossProfit.toLocaleString()}</td>
                    <td className="py-2">₱{totalOpEx.toLocaleString()}</td>
                    <td className="py-2">₱{netProfit.toLocaleString()}</td>
                    <td className="py-2">{netMarginPct.toFixed(1)}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Balance Sheet Snapshot */}
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <CardTitle>Balance Sheet Snapshot</CardTitle>
            <CardDescription>Assets, liabilities & equity overview</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <h4 className="text-sm font-semibold mb-2">Assets</h4>
                <ul className="space-y-1 text-sm">
                  {Object.entries(balanceSheet.assets).map(([k,v]) => (
                    <li key={k} className="flex justify-between"><span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g,' $1')}</span><span className="font-medium">₱{v.toLocaleString()}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Liabilities</h4>
                <ul className="space-y-1 text-sm">
                  {Object.entries(balanceSheet.liabilities).map(([k,v]) => (
                    <li key={k} className="flex justify-between"><span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g,' $1')}</span><span className="font-medium">₱{v.toLocaleString()}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Equity</h4>
                <ul className="space-y-1 text-sm">
                  {Object.entries(balanceSheet.equity).map(([k,v]) => (
                    <li key={k} className="flex justify-between"><span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g,' $1')}</span><span className="font-medium">₱{v.toLocaleString()}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow */}
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <CardTitle>Cash Flow Summary</CardTitle>
            <CardDescription>Quarterly operating, investing & financing flows</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {cashFlowData.map(cf => {
                const net = cf.operating + cf.investing + cf.financing;
                return (
                  <div key={cf.period} className="p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">{cf.period}</h4>
                      <Badge variant={net >= 0 ? 'secondary' : 'outline'} className={net >=0 ? 'text-green-600 bg-green-500/10' : 'text-red-600'}>
                        {net >= 0 ? 'Positive' : 'Negative'}
                      </Badge>
                    </div>
                    <ul className="text-xs space-y-1">
                      <li className="flex justify-between"><span className="text-muted-foreground">Operating</span><span className="font-medium">₱{cf.operating.toLocaleString()}</span></li>
                      <li className="flex justify-between"><span className="text-muted-foreground">Investing</span><span className="font-medium">₱{cf.investing.toLocaleString()}</span></li>
                      <li className="flex justify-between"><span className="text-muted-foreground">Financing</span><span className="font-medium">₱{cf.financing.toLocaleString()}</span></li>
                      <li className="flex justify-between pt-1 border-t mt-1"><span className="text-muted-foreground">Net</span><span className={net>=0? 'text-green-600 font-semibold':'text-red-600 font-semibold'}>₱{net.toLocaleString()}</span></li>
                    </ul>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tax Summary */}
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <CardTitle>Tax Summary</CardTitle>
            <CardDescription>Quarterly tax liabilities & payments</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {taxSummary.map(q => {
                const due = q.taxableIncome * q.taxRate;
                const remaining = due - q.paid;
                return (
                  <div key={q.quarter} className="p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">{q.quarter}</h4>
                      <Badge variant={remaining === 0 ? 'secondary':'outline'} className={remaining===0? 'text-green-600 bg-green-500/10':'text-yellow-600'}>
                        {remaining === 0 ? 'Settled':'Pending'}
                      </Badge>
                    </div>
                    <ul className="text-xs space-y-1">
                      <li className="flex justify-between"><span className="text-muted-foreground">Taxable Income</span><span className="font-medium">₱{q.taxableIncome.toLocaleString()}</span></li>
                      <li className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-medium">{(q.taxRate*100).toFixed(0)}%</span></li>
                      <li className="flex justify-between"><span className="text-muted-foreground">Due</span><span className="font-medium">₱{due.toLocaleString()}</span></li>
                      <li className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-medium">₱{q.paid.toLocaleString()}</span></li>
                      <li className="flex justify-between pt-1 border-t mt-1"><span className="text-muted-foreground">Remaining</span><span className={remaining===0? 'text-green-600 font-semibold':'text-red-600 font-semibold'}>₱{remaining.toLocaleString()}</span></li>
                    </ul>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

      {/* Placeholder for custom builder */}
      {/* <Card className="border-dashed border-border/50">
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
          <CardDescription>
            Drag & drop widgets, filters & export options (coming soon)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground text-sm">
            Interactive builder UI in development. Reach out if you need a specific report sooner.
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
