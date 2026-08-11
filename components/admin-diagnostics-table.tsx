'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

function UserDrilldown({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (data) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/user/${userId}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => { setOpen(true); load(); }}>
        View
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{userName}&apos;s Profile</DialogTitle>
          </DialogHeader>
          {loading && <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>}
          {data && (
            <div className="space-y-6">
              {/* Profile summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-black text-primary">{data.user.profile?.kakshaScore?.toFixed(1) || 0}</div>
                  <div className="text-xs text-muted-foreground">Kaksha Score</div>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-black">{data.user.profile?.xp || 0}</div>
                  <div className="text-xs text-muted-foreground">XP</div>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-black">{data.attempts.length}</div>
                  <div className="text-xs text-muted-foreground">Recent Attempts</div>
                </div>
              </div>

              {/* Strengths / Weaknesses */}
              {data.user.profile && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold text-green-600 mb-2">Strengths</p>
                    <div className="flex flex-wrap gap-1">
                      {(JSON.parse(data.user.profile.strengths || '[]')).map((s: string) => (
                        <Badge key={s} variant="outline" className="text-xs text-green-600 border-green-600/30">{s}</Badge>
                      ))}
                      {JSON.parse(data.user.profile.strengths || '[]').length === 0 && <span className="text-xs text-muted-foreground">None yet</span>}
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold text-red-500 mb-2">Weaknesses</p>
                    <div className="flex flex-wrap gap-1">
                      {(JSON.parse(data.user.profile.weaknesses || '[]')).map((w: string) => (
                        <Badge key={w} variant="outline" className="text-xs text-red-500 border-red-500/30">{w}</Badge>
                      ))}
                      {JSON.parse(data.user.profile.weaknesses || '[]').length === 0 && <span className="text-xs text-muted-foreground">None yet</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent attempts */}
              <div>
                <p className="text-sm font-semibold mb-2">Recent Attempts (last 100)</p>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Section</TableHead>
                        <TableHead>Topic</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.attempts.map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell className="text-xs">{a.question?.section || '—'}</TableCell>
                          <TableCell className="text-xs">{a.question?.subtopic || a.question?.topic || '—'}</TableCell>
                          <TableCell>
                            {a.isCorrect
                              ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                              : <XCircle className="h-4 w-4 text-red-500" />}
                          </TableCell>
                          <TableCell className="text-xs capitalize text-muted-foreground">{a.source}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(a.attemptedAt).toLocaleDateString('en-IN')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Sessions */}
              {data.sessions.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Recent Sessions</p>
                  <div className="space-y-2">
                    {data.sessions.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                        <div>
                          <Badge variant="outline" className="text-xs mr-2">{s.type}</Badge>
                          {s.topic && <span className="text-muted-foreground">{s.topic}</span>}
                          {s.year && <span className="text-muted-foreground"> · CAT {s.year}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {s.completed ? `${s.correct}/${s.totalQuestions} correct` : 'In progress'}
                          {' · '}
                          {new Date(s.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AdminDiagnosticsTable({ diagnostics }: { diagnostics: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnostic Results</CardTitle>
        <p className="text-sm text-muted-foreground">{diagnostics.length} diagnostic sessions completed</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Target Year</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {diagnostics.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <div className="font-medium text-sm">{d.user?.name || '—'}</div>
                  <div className="text-xs text-muted-foreground">{d.user?.email}</div>
                </TableCell>
                <TableCell className="text-sm">{d.user?.profile?.targetExamYear || '—'}</TableCell>
                <TableCell>
                  <span className="font-bold text-primary">{d.correct}/{d.totalQuestions}</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({d.totalQuestions > 0 ? Math.round((d.correct / d.totalQuestions) * 100) : 0}%)
                  </span>
                </TableCell>
                <TableCell>
                  {d.completed
                    ? <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>
                    : <Badge variant="outline" className="text-muted-foreground">Incomplete</Badge>
                  }
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(d.createdAt).toLocaleDateString('en-IN')}
                </TableCell>
                <TableCell>
                  <UserDrilldown userId={d.userId} userName={d.user?.name || d.user?.email || 'User'} />
                </TableCell>
              </TableRow>
            ))}
            {diagnostics.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No diagnostic sessions yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
