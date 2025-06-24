import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getExpenses, addExpense, getCategories } from "@/utils/periodManager";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  note: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  plannedAmount: number;
}

export const DailyLog = () => {
  const { user } = useAuth();
  const uid = user?.uid;
  const { currency } = useCurrency();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  // Load data from Firestore
  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    Promise.all([
      getExpenses(uid),
      getCategories(uid)
    ])
      .then(([expenses, categories]) => {
        setExpenses(expenses);
        setCategories(categories);
        setLoading(false);
      })
      .catch((err) => {
        setError(t('dailyLog.failed_to_load_data'));
        setLoading(false);
      });
  }, [uid, t]);

  const handleAddExpense = async () => {
    if (!selectedCategory || !amount) {
      toast({
        title: t('dailyLog.select_category_and_amount'),
        variant: "destructive",
      });
      return;
    }
    if (!uid) return;
    const newExpense = {
      date,
      category: selectedCategory,
      amount: parseFloat(amount),
      note: note.trim(),
    };
    try {
      await addExpense(uid, newExpense);
      setExpenses([{ id: "pending", ...newExpense }, ...expenses]); // Optimistic update
      setSelectedCategory("");
      setAmount("");
      setNote("");
      toast({
        title: t('dailyLog.expense_logged'),
        description: t('dailyLog.spent_on', { currency, amount, selectedCategory }),
      });
      // Reload from Firestore to get real id
      const updated = await getExpenses(uid);
      setExpenses(updated);
    } catch (err) {
      toast({
        title: t('dailyLog.failed_to_add_expense'),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-8">{t('loading')}</div>;
  }
  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  const todaysExpenses = expenses.filter(expense => expense.date === date);
  const todaysTotal = todaysExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      {/* Quick Add Form */}
      <Card className="border-blue-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            ✍️ {t('dailyLog.log_today_expense')}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {t('dailyLog.quick_and_easy')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-auto"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder={t('dailyLog.select_category_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">{currency}</span>
            <Input
              type="number"
              placeholder={t('dailyLog.amount_placeholder')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-8 text-lg"
              step="0.01"
            />
          </div>

          <Textarea
            placeholder={t('dailyLog.note_placeholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="resize-none"
            rows={2}
          />

          <Button onClick={handleAddExpense} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <PlusCircle size={16} className="mr-2" />
            {t('dailyLog.add_expense')}
          </Button>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-gray-700">
            📅 {t('dailyLog.todays_expenses')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">{t('dailyLog.total_spent_today')}</span>
            <span className="text-xl font-bold text-blue-600">{currency}{todaysTotal.toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            {todaysExpenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t('dailyLog.no_expenses_logged')}</p>
            ) : (
              todaysExpenses.map((expense) => (
                <div key={expense.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{expense.category}</div>
                    {expense.note && (
                      <div className="text-sm text-gray-600 mt-1">{expense.note}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-800">{currency}{expense.amount.toFixed(2)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
