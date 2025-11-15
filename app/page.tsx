'use client';

import Link from 'next/link';
import { Button, Card, CardBody } from '@nextui-org/react';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, router]);

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          Mentella
        </h1>
        <div className="flex gap-3 items-center">
          {isLoaded && (
            isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="bordered" color="primary">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button color="primary" className="bg-gradient-to-r from-blue-600 to-purple-600">
                    Get Started
                  </Button>
                </SignUpButton>
              </>
            )
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6">
            Mentella
          </h1>
          <p className="text-2xl text-gray-700 mb-4 font-semibold">
            Your AI Video Medical Assistant
          </p>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Experience compassionate healthcare with our AI-powered avatar. Get pre-assessments, 
            mental therapy support, and personalized care - all through natural conversation.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center mb-16">
            {isSignedIn ? (
              <>
                <Button
                  as={Link}
                  href="/dashboard"
                  color="primary"
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
                >
                  Go to Dashboard
                </Button>
                <Button
                  as={Link}
                  href="/therapy"
                  variant="bordered"
                  color="secondary"
                  size="lg"
                  className="font-semibold"
                >
                  Start Therapy Session
                </Button>
              </>
            ) : (
              <>
                <SignUpButton mode="modal">
                  <Button
                    color="primary"
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
                  >
                    Get Started Free
                  </Button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <Button
                    variant="bordered"
                    color="secondary"
                    size="lg"
                    className="font-semibold"
                  >
                    Sign In
                  </Button>
                </SignInButton>
              </>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <Card className="hover:shadow-xl transition-shadow">
              <CardBody className="text-center p-8">
                <div className="text-5xl mb-4">🩺</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Pre-Assessment</h3>
                <p className="text-gray-600">
                  Comprehensive health evaluation with AI-powered insights and personalized recommendations.
                </p>
              </CardBody>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardBody className="text-center p-8">
                <div className="text-5xl mb-4">💭</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Mental Therapy</h3>
                <p className="text-gray-600">
                  Professional therapy support through natural conversations with our empathetic AI avatar.
                </p>
              </CardBody>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardBody className="text-center p-8">
                <div className="text-5xl mb-4">👤</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Persona Generation</h3>
                <p className="text-gray-600">
                  AI-generated comprehensive profile to help healthcare providers understand you better.
                </p>
              </CardBody>
            </Card>
          </div>

          {/* How It Works */}
          <Card className="mt-16">
            <CardBody className="p-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">How It Works</h2>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mb-3">
                    1
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Sign Up</h4>
                  <p className="text-sm text-gray-600">Create your account and provide basic information</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xl mb-3">
                    2
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Assessment</h4>
                  <p className="text-sm text-gray-600">Complete our comprehensive pre-assessment</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xl mb-3">
                    3
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Therapy</h4>
                  <p className="text-sm text-gray-600">Talk with our AI avatar for mental health support</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl mb-3">
                    4
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Persona</h4>
                  <p className="text-sm text-gray-600">Get your AI-generated health persona</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
