import { db } from "@workspace/db";
import { accountsTable, transactionsTable, budgetsTable } from "@workspace/db/schema";

const accounts = [
  { name: "Chase Checking", type: "checking" as const, balance: "12450.32", currency: "USD", institution: "Chase Bank", isActive: true },
  { name: "Chase Savings", type: "savings" as const, balance: "28750.00", currency: "USD", institution: "Chase Bank", isActive: true },
  { name: "Fidelity Investment", type: "investment" as const, balance: "85200.00", currency: "USD", institution: "Fidelity", isActive: true },
  { name: "Chase Sapphire Card", type: "credit" as const, balance: "-2340.50", currency: "USD", institution: "Chase Bank", isActive: true },
];

function randomBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

const expenseCategories = [
  { category: "Food & Dining", merchants: ["Whole Foods", "Chipotle", "Starbucks", "DoorDash", "Uber Eats", "McDonald's", "Trader Joe's"], range: [8, 120] },
  { category: "Shopping", merchants: ["Amazon", "Target", "Walmart", "Best Buy", "Nordstrom"], range: [15, 350] },
  { category: "Transportation", merchants: ["Uber", "Lyft", "Shell Gas", "Metro Transit", "Parking Plus"], range: [10, 80] },
  { category: "Entertainment", merchants: ["Netflix", "Spotify", "AMC Theaters", "Steam", "Apple Music"], range: [10, 60] },
  { category: "Health & Fitness", merchants: ["CVS Pharmacy", "Planet Fitness", "Walgreens", "Dr. Smith MD"], range: [15, 200] },
  { category: "Utilities", merchants: ["PG&E Electric", "AT&T Internet", "Water District", "Gas Company"], range: [50, 200] },
  { category: "Housing", merchants: ["Rent Payment", "Home Depot", "Furniture Plus", "Property Tax"], range: [100, 2500] },
  { category: "Subscriptions", merchants: ["Adobe Creative", "GitHub Pro", "LinkedIn Premium", "iCloud Storage"], range: [10, 60] },
];

const incomeCategories = [
  { description: "Salary Deposit", merchant: "Acme Corp", range: [7500, 8500] },
  { description: "Freelance Payment", merchant: "Client Project", range: [500, 2000] },
  { description: "Investment Dividend", merchant: "Fidelity", range: [100, 500] },
  { description: "Bonus Payment", merchant: "Acme Corp", range: [1000, 5000] },
];

async function seed() {
  console.log("Seeding database...");

  // Check if already seeded
  const existing = await db.select().from(accountsTable).limit(1);
  if (existing.length > 0) {
    console.log("Database already seeded, skipping...");
    process.exit(0);
  }

  // Create accounts
  const insertedAccounts = await db.insert(accountsTable).values(accounts).returning();
  console.log(`Created ${insertedAccounts.length} accounts`);
  
  const checkingId = insertedAccounts[0].id;

  const transactions = [];
  const now = new Date(2026, 2, 23); // March 23, 2026

  // Generate 12 months of transactions
  for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
    const d = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();

    // Income - salary twice a month
    transactions.push({
      accountId: checkingId,
      amount: randomBetween(7800, 8200).toString(),
      description: "Salary Deposit",
      category: "Income",
      type: "income" as const,
      date: `${year}-${String(month).padStart(2, '0')}-01`,
      merchant: "Acme Corp",
      isRecurring: true,
      aiCategorized: false,
    });
    transactions.push({
      accountId: checkingId,
      amount: randomBetween(7800, 8200).toString(),
      description: "Salary Deposit",
      category: "Income",
      type: "income" as const,
      date: `${year}-${String(month).padStart(2, '0')}-15`,
      merchant: "Acme Corp",
      isRecurring: true,
      aiCategorized: false,
    });

    // Occasional freelance
    if (Math.random() > 0.5) {
      transactions.push({
        accountId: checkingId,
        amount: randomBetween(800, 2500).toString(),
        description: "Freelance Design Project",
        category: "Income",
        type: "income" as const,
        date: `${year}-${String(month).padStart(2, '0')}-${String(Math.floor(Math.random() * 20) + 5).padStart(2, '0')}`,
        merchant: "Freelance Client",
        isRecurring: false,
        aiCategorized: false,
      });
    }

    // Expenses - 15-25 per month
    const numExpenses = Math.floor(Math.random() * 10) + 15;
    for (let i = 0; i < numExpenses; i++) {
      const cat = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
      const merchant = cat.merchants[Math.floor(Math.random() * cat.merchants.length)];
      const day = Math.floor(Math.random() * (daysInMonth - 1)) + 1;
      // Skip future dates for current month
      if (monthOffset === 0 && day > 23) continue;
      
      transactions.push({
        accountId: checkingId,
        amount: randomBetween(cat.range[0], cat.range[1]).toString(),
        description: `${merchant} Purchase`,
        category: cat.category,
        subcategory: undefined,
        type: "expense" as const,
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        merchant,
        isRecurring: false,
        aiCategorized: true,
      });
    }

    // Housing (rent) monthly
    transactions.push({
      accountId: checkingId,
      amount: "2850.00",
      description: "Monthly Rent Payment",
      category: "Housing",
      type: "expense" as const,
      date: `${year}-${String(month).padStart(2, '0')}-01`,
      merchant: "Oakwood Properties",
      isRecurring: true,
      aiCategorized: true,
    });
  }

  await db.insert(transactionsTable).values(transactions);
  console.log(`Created ${transactions.length} transactions`);

  // Create budgets for current month (March 2026)
  const budgetData = [
    { category: "Food & Dining", limit: "800", month: 3, year: 2026, alertThreshold: "75" },
    { category: "Shopping", limit: "600", month: 3, year: 2026, alertThreshold: "80" },
    { category: "Transportation", limit: "300", month: 3, year: 2026, alertThreshold: "80" },
    { category: "Entertainment", limit: "200", month: 3, year: 2026, alertThreshold: "90" },
    { category: "Health & Fitness", limit: "250", month: 3, year: 2026, alertThreshold: "85" },
    { category: "Utilities", limit: "400", month: 3, year: 2026, alertThreshold: "75" },
    { category: "Housing", limit: "3000", month: 3, year: 2026, alertThreshold: "95" },
    { category: "Subscriptions", limit: "150", month: 3, year: 2026, alertThreshold: "90" },
  ];

  await db.insert(budgetsTable).values(budgetData);
  console.log(`Created ${budgetData.length} budgets`);

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
