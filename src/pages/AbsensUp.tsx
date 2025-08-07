import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AbsensUpRecord {
  id: string;
  created_at: string;
  data: string;
}

const AbsensUp = () => {
  const [records, setRecords] = useState<AbsensUpRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('absensup')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Failed to fetch records');
    }
  };

  const runKeepaliveJob = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('absensup-keepalive', {
        body: { trigger: 'manual' }
      });

      if (error) throw error;

      toast.success('Keepalive job completed successfully');
      setLastRun(new Date().toISOString());
      fetchRecords(); // Refresh the records
    } catch (error) {
      console.error('Error running keepalive job:', error);
      toast.error('Failed to run keepalive job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Supabase Keepalive System
          </h1>
          <p className="text-muted-foreground mb-8">
            Sistem untuk menjaga database Supabase tetap aktif dengan menambah data random setiap hari
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Manual Trigger</CardTitle>
                <CardDescription>
                  Jalankan keepalive job secara manual untuk testing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={runKeepaliveJob} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Running...' : 'Run Keepalive Job'}
                </Button>
                {lastRun && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Last run: {new Date(lastRun).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automatic Schedule</CardTitle>
                <CardDescription>
                  Job akan berjalan otomatis setiap hari jam 2 AM UTC
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>• Menambah 1 data random setiap hari</p>
                  <p>• Menghapus data lama jika lebih dari 10 record</p>
                  <p>• Menjaga database tetap aktif</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Records ({records.length}/10)</CardTitle>
              <CardDescription>
                Data keepalive yang tersimpan dalam database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {records.length === 0 ? (
                  <p className="text-muted-foreground">No records yet</p>
                ) : (
                  records.map((record) => (
                    <div 
                      key={record.id} 
                      className="flex justify-between items-center p-2 bg-muted rounded text-sm"
                    >
                      <span className="font-mono">{record.data}</span>
                      <span className="text-muted-foreground">
                        {new Date(record.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AbsensUp;