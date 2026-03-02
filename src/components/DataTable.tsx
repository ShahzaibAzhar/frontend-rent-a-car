import { ReactNode, useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchKeys?: string[];
  filterKey?: string;
  filterOptions?: { label: string; value: string }[];
  filterLabel?: string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns, data, loading, searchPlaceholder = 'Search...', searchKeys = [],
  filterKey, filterOptions, filterLabel = 'Filter', onRowClick, emptyMessage = 'No data found',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    let result = [...data];
    if (search && searchKeys.length) {
      const q = search.toLowerCase();
      result = result.filter(item => searchKeys.some(k => String(item[k] ?? '').toLowerCase().includes(q)));
    }
    if (filter !== 'all' && filterKey) {
      result = result.filter(item => item[filterKey] === filter);
    }
    if (sortKey) {
      result.sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [data, search, searchKeys, filter, filterKey, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {searchKeys.length > 0 && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        )}
        {filterOptions && (
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder={filterLabel} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {filterOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => (
                <TableHead key={col.key} className={col.sortable ? 'cursor-pointer select-none hover:text-foreground' : ''} onClick={() => col.sortable && handleSort(col.key)}>
                  {col.header} {sortKey === col.key && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">{emptyMessage}</TableCell></TableRow>
            ) : (
              filtered.map((item, idx) => (
                <TableRow key={item.id ?? idx} className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''} onClick={() => onRowClick?.(item)}>
                  {columns.map(col => (
                    <TableCell key={col.key}>{col.render ? col.render(item) : String(item[col.key] ?? '')}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} of {data.length} records</p>
    </div>
  );
}
