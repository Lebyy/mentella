'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner, Chip } from '@nextui-org/react';
import { 
  Heart, 
  Brain, 
  Activity, 
  Wind, 
  User as UserIcon,
  MessageCircle
} from 'lucide-react';

const ASSESSMENT_TYPES = [
  {
    id: 'cardiovascular',
    title: 'Cardiovascular Health',
    description: 'Comprehensive heart health assessment',
    duration: '20-25 minutes',
    icon: Heart,
    color: 'danger' as const,
  },
  {
    id: 'neurological',
    title: 'Neurological Screening',
    description: 'Cognitive and nervous system evaluation',
    duration: '15-20 minutes',
    icon: Brain,
    color: 'secondary' as const,
  },
  {
    id: 'full-health',
    title: 'Full Health Screening',
    description: 'Complete medical examination',
    duration: '45-50 minutes',
    icon: Activity,
    color: 'success' as const,
  },
  {
    id: 'respiratory',
    title: 'Respiratory Function',
    description: 'Lung capacity and breathing assessment',
    duration: '15-20 minutes',
    icon: Wind,
    color: 'primary' as const,
  },
  {
    id: 'psychometric',
    title: 'Psychometric Test',
    description: 'Personality and cognitive ability assessment',
    duration: '30-35 minutes',
    icon: UserIcon,
    color: 'warning' as const,
  },
  {
    id: 'therapy',
    title: 'Mental Health Therapy',
    description: 'Psychological wellbeing and mental health assessment',
    duration: '40-45 minutes',
    icon: MessageCircle,
    color: 'success' as const,
  },
];

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  currentPersona?: string;
  personaHistory?: Array<{ persona: string; timestamp: string }>;
  assessments: string[];
  createdAt: string;
}

interface LatestAssessment {
  type: string;
  score: number;
  insights: string;
  recommendations: string[];
  detectedConditions: string[];
  riskLevel: 'low' | 'medium' | 'high';
  completedAt: string;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [latestAssessment, setLatestAssessment] = useState<LatestAssessment | null>(null);
  const [personaUpdated, setPersonaUpdated] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserProfile();
      loadLatestAssessment();
    }
  }, [isLoaded, user]);

  const loadLatestAssessment = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('latestAssessment');
      if (stored) {
        setLatestAssessment(JSON.parse(stored));
        // Clear after loading
        localStorage.removeItem('latestAssessment');
      }
      
      const personaFlag = localStorage.getItem('personaUpdated');
      if (personaFlag === 'true') {
        setPersonaUpdated(true);
        localStorage.removeItem('personaUpdated');
      }
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users?clerkId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = (type: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('assessmentType', type);
      sessionStorage.setItem('assessmentStartTime', new Date().toISOString());
    }
    router.push(`/session?type=${type}`);
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.firstName || profile?.name || 'User'}!
          </h1>
          <p className="text-gray-600">Here's your Mentella health dashboard</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardBody className="text-center p-6">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">
                {profile?.assessments && profile.assessments.length > 0 ? profile.assessments.length : 'Pending'}
              </h3>
              <p className="text-gray-600">Completed Assessments</p>
              {profile?.assessments && profile.assessments.length > 0 ? (
                <Chip color="success" className="mt-3">{profile.assessments.length} Done</Chip>
              ) : (
                <Chip color="warning" className="mt-3">No Assessments</Chip>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center p-6">
              <div className="text-4xl mb-3">👤</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">
                {profile?.currentPersona ? 'Generated' : 'Not Ready'}
              </h3>
              <p className="text-gray-600">Health Persona</p>
              {profile?.currentPersona ? (
                <Chip color="success" className="mt-3">Available</Chip>
              ) : (
                <Chip color="warning" className="mt-3">Complete Assessment</Chip>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Persona Card */}
        {profile?.currentPersona && (
          <Card className="mb-8 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex justify-between items-center w-full">
                <h2 className="text-2xl font-bold">Your Health Persona</h2>
                {personaUpdated && (
                  <Chip color="success" variant="flat" className="text-white animate-pulse">
                    ✨ Just Updated
                  </Chip>
                )}
              </div>
            </CardHeader>
            <CardBody className="p-6">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: profile.currentPersona }}
              />
              
              {profile.personaHistory && profile.personaHistory.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <details className="cursor-pointer group">
                    <summary className="text-sm font-semibold text-gray-600 hover:text-gray-800 flex items-center gap-2">
                      <span className="group-open:rotate-90 transition-transform">▶</span>
                      View Persona History ({profile.personaHistory.length} previous versions)
                    </summary>
                    <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
                      {profile.personaHistory.slice().reverse().map((history: any, idx: number) => (
                        <div key={idx} className="pl-4 border-l-2 border-gray-300 hover:border-blue-500 transition-colors">
                          <div className="text-xs text-gray-500 mb-2 font-semibold">
                            📅 {new Date(history.timestamp).toLocaleString()}
                          </div>
                          <div 
                            className="text-sm text-gray-600 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: history.persona }}
                          />
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Latest Assessment Results */}
        {latestAssessment && (
          <Card className="mb-8 border-2 border-blue-500">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex justify-between items-center w-full">
                <h2 className="text-2xl font-bold">Latest Assessment Results</h2>
                <Chip 
                  color={
                    latestAssessment.riskLevel === 'low' ? 'success' : 
                    latestAssessment.riskLevel === 'medium' ? 'warning' : 
                    'danger'
                  }
                  variant="flat"
                  className="text-white"
                >
                  {latestAssessment.riskLevel.toUpperCase()} RISK
                </Chip>
              </div>
            </CardHeader>
            <CardBody className="p-6">
              {/* Score Section */}
              <div className="mb-6 text-center">
                <div className="inline-block">
                  <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {latestAssessment.score}
                  </div>
                  <div className="text-gray-600 text-sm">Health Score (0-100)</div>
                  <div className="mt-3">
                    <div className="w-64 bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          latestAssessment.score >= 80 ? 'bg-green-500' :
                          latestAssessment.score >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${latestAssessment.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🔍</span> Analysis
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {latestAssessment.insights}
                </p>
              </div>

              {/* Detected Conditions */}
              {latestAssessment.detectedConditions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-2xl">⚠️</span> Detected Concerns
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {latestAssessment.detectedConditions.map((condition, idx) => (
                      <Chip key={idx} color="warning" variant="flat">
                        {condition}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-2xl">💡</span> Recommendations
                </h3>
                <div className="space-y-3">
                  {latestAssessment.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                        {idx + 1}
                      </div>
                      <p className="text-gray-700 flex-1">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assessment Type Badge */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Assessment Type: <strong className="text-gray-800">{ASSESSMENT_TYPES.find(a => a.id === latestAssessment.type)?.title || latestAssessment.type}</strong></span>
                  <span>Completed: {new Date(latestAssessment.completedAt).toLocaleString()}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Assessment Types - Show only if no assessments completed */}
        {(!profile?.assessments || profile.assessments.length === 0) && (
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-2xl font-bold text-gray-800">Available Assessments</h2>
            </CardHeader>
            <CardBody className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {ASSESSMENT_TYPES.map((assessment) => {
                  const Icon = assessment.icon;
                  return (
                    <div
                      key={assessment.id}
                      onClick={() => handleStartAssessment(assessment.id)}
                      className="border border-gray-200 hover:border-gray-400 transition-all cursor-pointer rounded-lg p-4 bg-white"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <Chip size="sm" variant="flat" className="text-xs">
                          {assessment.duration}
                        </Chip>
                      </div>
                      
                      <h3 className="text-base font-semibold text-gray-800 mb-1">
                        {assessment.title}
                      </h3>
                      <p className="text-gray-600 text-xs">
                        {assessment.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
          </CardHeader>
          <CardBody className="p-6">
            <Button
              size="lg"
              color="primary"
              className="bg-gradient-to-r from-blue-600 to-purple-600 w-full"
              onClick={() => router.push('/session?type=therapy')}
            >
              Start New Session
            </Button>
          </CardBody>
        </Card>

        {/* Account Info */}
        <Card className="mt-8">
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-800">Account Information</h2>
          </CardHeader>
          <CardBody className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-semibold">{user?.primaryEmailAddress?.emailAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Member Since:</span>
                <span className="font-semibold">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User ID:</span>
                <span className="font-mono text-sm text-gray-500">{user?.id}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
