'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFinTrackStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/types';
import TransactionForm from './TransactionForm';

type SortKey = 'date' | 'description' | 'category' | 'amount' | 'type';
type SortDir = 'asc' | 'desc';

const ITEMS_PER_PAGE = 12;

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  return (
    <span className="inline-flex ml-1">
      {sortKey === col ? (
        sortDir === 'asc' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
      ) : (
        <ChevronUp className="size-3.5 opacity-30" />
      )}
    </span>
  );
}

export default function Transactions() {
  const { transactions, settings, removeTransaction } = useFinTrackStore();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Unique months for filter
  const uniqueMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((t) => {
      if (t.date) months.add(t.date.slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // All categories
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((t) => cats.add(t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  // Filtered and sorted
  const filtered = useMemo(() => {
    let result = [...transactions];

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((t) =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.category === categoryFilter);
    }

    if (monthFilter !== 'all') {
      result = result.filter((t) => t.date.startsWith(monthFilter));
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'date': cmp = a.date.localeCompare(b.date); break;
        case 'description': cmp = a.description.localeCompare(b.description); break;
        case 'category': cmp = a.category.localeCompare(b.category); break;
        case 'amount': cmp = a.amount - b.amount; break;
        case 'type': cmp = a.type.localeCompare(b.type); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [transactions, debouncedSearch, typeFilter, categoryFilter, monthFilter, sortKey, sortDir]);

  // Paginate (clamped to valid range, reset via handlers)
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const handleEdit = (txn: Transaction) => {
    setEditingTxn(txn);
    setShowForm(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      removeTransaction(deleteId);
      toast.success('Transaction deleted.');
      setDeleteId(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setMonthFilter('all');
    setPage(1);
  };

  const handleTypeFilterChange = (val: string) => {
    setTypeFilter(val);
    setPage(1);
  };

  const handleCategoryFilterChange = (val: string) => {
    setCategoryFilter(val);
    setPage(1);
  };

  const handleMonthFilterChange = (val: string) => {
    setMonthFilter(val);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const hasFilters = debouncedSearch || typeFilter !== 'all' || categoryFilter !== 'all' || monthFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button onClick={() => { setEditingTxn(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="size-4" />
          New Transaction
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {allCategories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={monthFilter} onValueChange={handleMonthFilterChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {uniqueMonths.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('date')}>
                Date <SortIcon col="date" sortKey={sortKey} sortDir={sortDir} />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('description')}>
                Description <SortIcon col="description" sortKey={sortKey} sortDir={sortDir} />
              </TableHead>
              <TableHead className="cursor-pointer select-none hidden md:table-cell" onClick={() => handleSort('category')}>
                Category <SortIcon col="category" sortKey={sortKey} sortDir={sortDir} />
              </TableHead>
              <TableHead className="cursor-pointer select-none hidden sm:table-cell" onClick={() => handleSort('type')}>
                Type <SortIcon col="type" sortKey={sortKey} sortDir={sortDir} />
              </TableHead>
              <TableHead className="cursor-pointer select-none text-right" onClick={() => handleSort('amount')}>
                Amount <SortIcon col="amount" sortKey={sortKey} sortDir={sortDir} />
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  {transactions.length === 0
                    ? 'No transactions yet. Add your first one!'
                    : 'No transactions match your filters.'}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="text-sm">
                    {formatDate(txn.date, settings.dateFormat)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{txn.description}</p>
                      {txn.notes && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{txn.notes}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className="text-xs">{txn.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        txn.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      )}
                    >
                      {txn.type === 'income' ? 'Income' : 'Expense'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      'text-sm font-semibold',
                      txn.type === 'income' ? 'text-emerald-500' : 'text-red-500'
                    )}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount, settings.currency)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => handleEdit(txn)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 text-red-500 hover:text-red-600" onClick={() => setDeleteId(txn.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Transaction Form Dialog */}
      <TransactionForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingTxn(null);
        }}
        editingTransaction={editingTxn}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
