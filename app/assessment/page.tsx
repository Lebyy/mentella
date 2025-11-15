'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AssessmentForm, { AssessmentQuestion } from '@/components/AssessmentForm';
import { Card, CardBody, Button, Input, Spinner } from '@heroui/react';

const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'q1',
    question: 'What brings you to Mentella today?',
    category: 'general',
    type: 'text',
  },
  {
    id: 'q2',
    question: 'How would you rate your overall physical health?',
    category: 'medical',
    type: 'scale',
  },
  {
    id: 'q3',
    question: 'Do you have any chronic medical conditions?',
    category: 'medical',
    type: 'choice',
    options: ['No', 'Yes - Diabetes', 'Yes - Hypertension', 'Yes - Other', 'Prefer not to say'],
  },
  {
    id: 'q4',
    question: 'How would you describe your current mental health?',
    category: 'mental',
    type: 'scale',
  },
  {
    id: 'q5',
    question: 'Have you experienced any of these symptoms recently?',
    category: 'mental',
    type: 'choice',
    options: [
      'Anxiety or excessive worry',
      'Persistent sadness or depression',
      'Difficulty sleeping',
      'Loss of interest in activities',
      'None of the above',
    ],
  },
  {
    id: 'q6',
    question: 'How many hours of sleep do you typically get per night?',
    category: 'lifestyle',
    type: 'choice',
    options: ['Less than 5 hours', '5-6 hours', '7-8 hours', '9+ hours'],
  },
  {
    id: 'q7',
    question: 'How often do you exercise or engage in physical activity?',
    category: 'lifestyle',
    type: 'choice',
    options: ['Daily', '3-5 times per week', '1-2 times per week', 'Rarely or never'],
  },
  {
    id: 'q8',
    question: 'On a scale of 1-10, how would you rate your stress level?',
    category: 'mental',
    type: 'scale',
  },
  {
    id: 'q9',
    question: 'What are your main sources of stress?',
    category: 'mental',
    type: 'text',
  },
  {
    id: 'q10',
    question: 'What are your health and wellness goals?',
    category: 'general',
    type: 'text',
  },
];

export default function AssessmentPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [showUserForm, setShowUserForm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const router = useRouter();

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      setUserId(data.user._id);
      setShowUserForm(false);
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentComplete = async (answers: Array<{ question: string; answer: string; category: string }>) => {
    if (!userId) return;

    setLoading(true);

    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, answers }),
      });

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setCompleted(true);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePersona = async () => {
    if (!userId) return;

    setLoading(true);

    try {
      await fetch('/api/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      router.push('/therapy');
    } catch (error) {
      console.error('Error generating persona:', error);
      alert('Failed to generate persona. Continuing anyway.');
      router.push('/therapy');
    } finally {
      setLoading(false);
    }
  };

  if (showUserForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-16 px-4">
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardBody className="p-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Mentella</h1>
              <p className="text-gray-600 mb-8">Let's start by getting to know you</p>

              <form onSubmit={handleUserSubmit} className="space-y-6">
                <Input
                  type="text"
                  label="Full Name"
                  placeholder="John Doe"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  isRequired
                  variant="bordered"
                  size="lg"
                />

                <Input
                  type="email"
                  label="Email"
                  placeholder="john@example.com"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  isRequired
                  variant="bordered"
                  size="lg"
                />

                <Input
                  type="tel"
                  label="Phone (optional)"
                  placeholder="+1 (555) 000-0000"
                  value={userData.phone}
                  onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                  variant="bordered"
                  size="lg"
                />

                <Button
                  type="submit"
                  isDisabled={loading}
                  color="primary"
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 font-semibold"
                >
                  {loading ? <><Spinner size="sm" color="white" className="mr-2" /> Creating Account...</> : 'Continue to Assessment'}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-lg">
            <CardBody className="p-10 text-center">
              <div className="text-6xl mb-6">✅</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Assessment Complete!</h1>
              <p className="text-gray-600 mb-8">
                Thank you for completing your pre-assessment. Here are your personalized recommendations:
              </p>

              <Card className="bg-blue-50 mb-8">
                <CardBody className="p-6 text-left">
                  <h3 className="font-bold text-gray-800 mb-4">Your Recommendations:</h3>
                  <ul className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-3">•</span>
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>

              <Button
                onClick={handleGeneratePersona}
                isDisabled={loading}
                color="primary"
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 font-semibold"
              >
                {loading ? <><Spinner size="sm" color="white" className="mr-2" /> Generating Profile...</> : 'Continue to Therapy Session'}
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-16">
      <AssessmentForm
        questions={ASSESSMENT_QUESTIONS}
        onComplete={handleAssessmentComplete}
      />
    </div>
  );
}
