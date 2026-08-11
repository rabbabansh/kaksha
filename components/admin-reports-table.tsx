/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuestionDisplay } from '@/components/question-display';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function AdminReportsTable({ reports }: { reports: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reported Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reporter</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Custom Details</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Question</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{report.user?.name || report.user?.email || 'Unknown'}</TableCell>
                <TableCell className="font-semibold">{report.reason}</TableCell>
                <TableCell className="max-w-[200px] truncate">{report.details || '-'}</TableCell>
                <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">View Question</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      {report.question ? (
                        <QuestionDisplay 
                          question={report.question}
                          allQuestionsInContext={[]}
                          isTestMode={false}
                        />
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">Question data not found.</div>
                      )}
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
            {reports.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No reports found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
