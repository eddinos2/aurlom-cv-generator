import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, FileText, Mail, Phone, MessageSquare, Calendar } from 'lucide-react';

interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  program: string;
  source: string;
  campus: string;
  status: string;
  appointment_date?: string;
  statusHistory: StatusHistory[];
  documents: Document[];
}

interface StatusHistory {
  id: number;
  old_status: string;
  new_status: string;
  changed_by: string;
  change_source: string;
  notes?: string;
  created_at: string;
}

interface Document {
  id: number;
  document_type: string;
  status: string;
  file_url?: string;
  signed_at?: string;
  completed_at?: string;
  created_at: string;
}

export default function StudentJourneyPage() {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCandidate(parseInt(id));
    }
  }, [id]);

  const fetchCandidate = async (candidateId: number) => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}`);
      const data = await response.json();
      if (data.success) {
        setCandidate(data.data);
      }
    } catch (error) {
      console.error('Error fetching candidate:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Nouveau': 'bg-blue-500',
      'Contacté': 'bg-yellow-500',
      'RDV fixé': 'bg-purple-500',
      'Admis': 'bg-green-500',
      'No-show': 'bg-red-500',
      'Contrat en cours': 'bg-orange-500',
      'Contrat signé': 'bg-green-600',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getDocumentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-500',
      'sent': 'bg-blue-500',
      'viewed': 'bg-yellow-500',
      'signed': 'bg-green-500',
      'completed': 'bg-green-600',
      'declined': 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return <div className="container mx-auto p-6">Chargement...</div>;
  }

  if (!candidate) {
    return <div className="container mx-auto p-6">Candidat non trouvé</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {candidate.first_name} {candidate.last_name}
        </h1>
        <p className="text-gray-600">{candidate.email} • {candidate.phone}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Programme</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{candidate.program}</p>
            <p className="text-sm text-gray-600">{candidate.campus}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Statut actuel</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(candidate.status)}>
              {candidate.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Source</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{candidate.source}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des statuts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {candidate.statusHistory && candidate.statusHistory.length > 0 ? (
                  candidate.statusHistory.map((history, index) => (
                    <div key={history.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(history.new_status)}`} />
                        {index < candidate.statusHistory.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-300 mt-1" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getStatusColor(history.new_status)}>
                            {history.new_status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(history.created_at).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Changé par {history.changed_by} via {history.change_source}
                        </p>
                        {history.notes && (
                          <p className="text-sm text-gray-500 mt-1">{history.notes}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Aucun historique disponible</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {candidate.documents && candidate.documents.length > 0 ? (
                  candidate.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{doc.document_type}</p>
                          <p className="text-sm text-gray-600">
                            Créé le {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getDocumentStatusColor(doc.status)}>
                          {doc.status}
                        </Badge>
                        {doc.file_url && (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Voir
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Aucun document disponible</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {candidate.appointment_date && (
                  <div className="flex items-center gap-3 p-3 border rounded">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Rendez-vous programmé</p>
                      <p className="text-sm text-gray-600">
                        {new Date(candidate.appointment_date).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 border rounded">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-gray-600">{candidate.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Téléphone</p>
                    <p className="text-sm text-gray-600">{candidate.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
