'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner, Chip } from '@nextui-org/react';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  assessmentCompleted: boolean;
  therapySessionsCount: number;
  persona?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserProfile();
    }
  }, [isLoaded, user]);

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
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardBody className="text-center p-6">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">
                {profile?.assessmentCompleted ? 'Complete' : 'Pending'}
              </h3>
              <p className="text-gray-600">Pre-Assessment</p>
              {profile?.assessmentCompleted ? (
                <Chip color="success" className="mt-3">Completed</Chip>
              ) : (
                <Button
                  size="sm"
                  color="primary"
                  className="mt-3"
                  onClick={() => router.push('/assessment')}
                >
                  Start Now
                </Button>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center p-6">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">
                {profile?.therapySessionsCount || 0}
              </h3>
              <p className="text-gray-600">Therapy Sessions</p>
              <Button
                size="sm"
                color="secondary"
                variant="flat"
                className="mt-3"
                onClick={() => router.push('/therapy')}
              >
                New Session
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center p-6">
              <div className="text-4xl mb-3">👤</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">
                {profile?.persona ? 'Generated' : 'Not Ready'}
              </h3>
              <p className="text-gray-600">Health Persona</p>
              {profile?.persona ? (
                <Chip color="success" className="mt-3">Available</Chip>
              ) : (
                <Chip color="warning" className="mt-3">Complete Assessment</Chip>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Persona Card */}
        {profile?.persona && (
          <Card className="mb-8">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <h2 className="text-2xl font-bold">Your Health Persona</h2>
            </CardHeader>
            <CardBody className="p-6">
              <p className="text-gray-700 whitespace-pre-wrap">{profile.persona}</p>
            </CardBody>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
          </CardHeader>
          <CardBody className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                size="lg"
                color="primary"
                className="bg-gradient-to-r from-blue-600 to-purple-600"
                onClick={() => router.push('/assessment')}
                isDisabled={profile?.assessmentCompleted}
              >
                {profile?.assessmentCompleted ? 'Assessment Completed ✓' : 'Start Pre-Assessment'}
              </Button>
              <Button
                size="lg"
                color="secondary"
                variant="bordered"
                onClick={() => router.push('/therapy')}
              >
                Start Therapy Session
              </Button>
            </div>
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
