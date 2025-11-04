'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Question = any;

interface ViewSwitcherProps {
  pyqView: React.ReactNode;
  topicView: React.ReactNode;
  browserView: React.ReactNode;
}

export function ViewSwitcher({ pyqView, topicView, browserView }: ViewSwitcherProps) {
  const [activeView, setActiveView] = useState<'pyq' | 'topic' | 'browser'>('pyq');

  const renderActiveView = () => {
    switch (activeView) {
      case 'pyq':
        return <div key="pyq">{pyqView}</div>;
      case 'topic':
        return <div key="topic">{topicView}</div>;
      case 'browser':
        return <div key="browser">{browserView}</div>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* View Tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              onClick={() => setActiveView('pyq')}
              variant={activeView === 'pyq' ? 'default' : 'outline'}
            >
              Previous Year Questions
            </Button>
            <Button
              onClick={() => setActiveView('topic')}
              variant={activeView === 'topic' ? 'default' : 'outline'}
            >
              Browse by Topic
            </Button>
            <Button
              onClick={() => setActiveView('browser')}
              variant={activeView === 'browser' ? 'default' : 'outline'}
            >
              All Questions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active View Content */}
      {renderActiveView()}
    </div>
  );
}
