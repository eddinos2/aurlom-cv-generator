import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Download, Upload, Settings, BarChart3 } from 'lucide-react';

interface SyncStatus {
  sync_type: string;
  direction: string;
  status: string;
  count: number;
}

interface FieldMapping {
  id: number;
  source_system: string;
  target_system: string;
  source_field: string;
  target_field: string;
  is_active: boolean;
}

export default function DataPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchSyncStatus();
    fetchFieldMappings();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/sync/status');
      const data = await response.json();
      setSyncStatus(data.data || []);
    } catch (error) {
      console.error('Error fetching sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFieldMappings = async () => {
    try {
      const response = await fetch('/api/data/field-mappings');
      const data = await response.json();
      setFieldMappings(data.data || []);
    } catch (error) {
      console.error('Error fetching field mappings:', error);
    }
  };

  const triggerSync = async (direction: 'hubspot_to_db' | 'db_to_hubspot') => {
    setSyncing(true);
    try {
      const response = await fetch(`/api/sync/${direction}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        alert(`Synchronisation réussie : ${data.synced} éléments synchronisés`);
        fetchSyncStatus();
      } else {
        alert('Erreur lors de la synchronisation');
      }
    } catch (error) {
      alert('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const exportData = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/data/export?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admiss-flow-export.${format}`;
      a.click();
    } catch (error) {
      alert('Erreur lors de l\'export');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Données</h1>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="sync">Synchronisation</TabsTrigger>
          <TabsTrigger value="mappings">Mappings</TabsTrigger>
          <TabsTrigger value="export">Export/Import</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Synchronisations réussies (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {syncStatus
                    .filter((s) => s.status === 'success')
                    .reduce((sum, s) => sum + s.count, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Erreurs (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {syncStatus
                    .filter((s) => s.status === 'error')
                    .reduce((sum, s) => sum + s.count, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Mappings actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {fieldMappings.filter((m) => m.is_active).length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques de synchronisation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {syncStatus.map((status, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`} />
                      <span className="text-sm">
                        {status.sync_type} ({status.direction})
                      </span>
                    </div>
                    <Badge>{status.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronisation manuelle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded">
                <div>
                  <h3 className="font-medium">HubSpot → Base de données</h3>
                  <p className="text-sm text-gray-600">
                    Synchroniser les contacts HubSpot vers la base de données
                  </p>
                </div>
                <Button
                  onClick={() => triggerSync('hubspot_to_db')}
                  disabled={syncing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  Synchroniser
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded">
                <div>
                  <h3 className="font-medium">Base de données → HubSpot</h3>
                  <p className="text-sm text-gray-600">
                    Synchroniser les candidats vers HubSpot
                  </p>
                </div>
                <Button
                  onClick={() => triggerSync('db_to_hubspot')}
                  disabled={syncing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  Synchroniser
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Mappings de champs</CardTitle>
                <Button size="sm" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {fieldMappings.map((mapping) => (
                  <div
                    key={mapping.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div>
                      <span className="font-medium">{mapping.source_system}</span>
                      {' → '}
                      <span className="font-medium">{mapping.target_system}</span>
                      <div className="text-sm text-gray-600">
                        {mapping.source_field} → {mapping.target_field}
                      </div>
                    </div>
                    <Badge variant={mapping.is_active ? 'default' : 'secondary'}>
                      {mapping.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export/Import de données</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={() => exportData('csv')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter CSV
                </Button>
                <Button onClick={() => exportData('json')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter JSON
                </Button>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Importer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
