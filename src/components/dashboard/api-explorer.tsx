'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Share2 } from 'lucide-react';

export function ApiExplorer() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFetchData = async () => {
    setIsLoading(true);
    setData(null);
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching API data:', error);
      setData({ error: 'Failed to fetch data.' });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
          API Explorer
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Test Endpoint</CardTitle>
            <CardDescription className="text-xs">GET /api/data</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleFetchData} disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Fetching...' : 'Fetch Data'}
            </Button>
          </CardContent>
        </Card>

        {(isLoading || data) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Response</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : (
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{JSON.stringify(data, null, 2)}</code>
                </pre>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
