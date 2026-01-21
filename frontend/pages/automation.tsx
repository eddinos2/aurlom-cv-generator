import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Clock, Play, RefreshCw } from 'lucide-react';

interface AutomationScenario {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  lastExecuted?: string;
  executionCount: number;
  errorCount: number;
}

interface WebhookEvent {
  id: number;
  source: string;
  event_type: string;
  processed: boolean;
  processing_error?: string;
  created_at: string;
}

export default function AutomationPage() {
  const [scenarios, setScenarios] = useState<AutomationScenario[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  useEffect(() => {
    fetchScenarios();
    fetchWebhookEvents();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await fetch('/api/automation/scenarios');
      const data = await response.json();
      setScenarios(data.data || []);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhookEvents = async () => {
    try {
      const response = await fetch('/api/webhooks/events?limit=50');
      const data = await response.json();
      setWebhookEvents(data.data || []);
    } catch (error) {
      console.error('Error fetching webhook events:', error);
    }
  };

  const testWebhook = async (source: string) => {
    setTestingWebhook(source);
    try {
      const response = await fetch(`/api/webhooks/test/${source}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        alert('Webhook test réussi !');
        fetchWebhookEvents();
      } else {
        alert('Erreur lors du test du webhook');
      }
    } catch (error) {
      alert('Erreur lors du test du webhook');
    } finally {
      setTestingWebhook(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Actif</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Inactif</Badge>;
      case 'error':
        return <Badge className="bg-red-500">Erreur</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Automatisation</h1>

      <Tabs defaultValue="scenarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scenarios">Scénarios</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : (
            <div className="grid gap-4">
              {scenarios.map((scenario) => (
                <Card key={scenario.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{scenario.name}</CardTitle>
                      {getStatusBadge(scenario.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{scenario.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        {scenario.executionCount} exécutions
                      </span>
                      {scenario.errorCount > 0 && (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          {scenario.errorCount} erreurs
                        </span>
                      )}
                      {scenario.lastExecuted && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-4 h-4" />
                          Dernière exécution : {new Date(scenario.lastExecuted).toLocaleString('fr-FR')}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Rafraîchir
                      </Button>
                      <Button size="sm" variant="outline">
                        <Play className="w-4 h-4 mr-2" />
                        Tester
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Webhooks HubSpot</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  URL : <code className="bg-gray-100 px-2 py-1 rounded">{window.location.origin}/api/webhooks/hubspot</code>
                </p>
                <Button
                  onClick={() => testWebhook('hubspot')}
                  disabled={testingWebhook === 'hubspot'}
                >
                  {testingWebhook === 'hubspot' ? 'Test en cours...' : 'Tester le webhook'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhooks Meta</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  URL : <code className="bg-gray-100 px-2 py-1 rounded">{window.location.origin}/api/webhooks/meta</code>
                </p>
                <Button
                  onClick={() => testWebhook('meta')}
                  disabled={testingWebhook === 'meta'}
                >
                  {testingWebhook === 'meta' ? 'Test en cours...' : 'Tester le webhook'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhooks DocuSeal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  URL : <code className="bg-gray-100 px-2 py-1 rounded">{window.location.origin}/api/webhooks/docuseal</code>
                </p>
                <Button
                  onClick={() => testWebhook('docuseal')}
                  disabled={testingWebhook === 'docuseal'}
                >
                  {testingWebhook === 'docuseal' ? 'Test en cours...' : 'Tester le webhook'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="space-y-2">
            {webhookEvents.map((event) => (
              <Card key={event.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{event.source}</span>
                        <Badge variant={event.processed ? 'default' : 'secondary'}>
                          {event.processed ? 'Traité' : 'En attente'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{event.event_type}</p>
                      {event.processing_error && (
                        <p className="text-sm text-red-600 mt-1">{event.processing_error}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(event.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
