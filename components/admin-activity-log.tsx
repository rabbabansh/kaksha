'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function AdminActivityLog() {
  const [data, setData] = useState<{ total: number; page: number; limit: number; attempts: any[] } | null>(null);
  const [page, setPage] = useState(1);
  const [userFilter, setUserFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (userFilter) params.set('user', userFilter);
      if (resultFilter !== 'all') params.set('result', resultFilter);
      const res = await window.fetch(`/api/admin/activity?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [page, userFilter, resultFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="flex gap-2 flex-1">
            <Input
              placeholder="Filter by name or email..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="max-w-xs"
              onKeyDown={(e) => { if (e.key === 'Enter') { setUserFilter(inputValue); setPage(1); } }}
            />
            <Button variant="outline" size="sm" onClick={() => { setUserFilter(inputValue); setPage(1); }}>
              Search
            </Button>
            {(userFilter || resultFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setUserFilter(''); setInputValue(''); setResultFilter('all'); setPage(1); }}>
                Clear
              </Button>
            )}
          </div>
          <Select value={resultFilter} onValueChange={(v) => { setResultFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All results</SelectItem>
              <SelectItem value="correct">Correct only</SelectItem>
              <SelectItem value="incorrect">Incorrect only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Loading...</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Subtopic</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.attempts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{a.user?.name || '—'}</div>
                      <div className="text-xs text-muted-foreground">{a.user?.email}</div>
                    </TableCell>
                    <TableCell className="text-sm">{a.question?.section || '—'}</TableCell>
                    <TableCell className="text-sm">{a.question?.topic || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.question?.subtopic || '—'}</TableCell>
                    <TableCell className="text-xs capitalize text-muted-foreground">{a.source}</TableCell>
                    <TableCell>
                      {a.isCorrect
                        ? <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> Correct</span>
                        : <span className="flex items-center gap-1 text-red-500 text-sm font-medium"><XCircle className="h-3.5 w-3.5" /> Wrong</span>
                      }
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(a.attemptedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.attempts.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No activity found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {data?.total ? `${data.total.toLocaleString()} total attempts` : ''}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
