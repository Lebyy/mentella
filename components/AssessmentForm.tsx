'use client';

import { useState } from 'react';
import { Button, Card, CardBody, Progress, Chip, Textarea, RadioGroup, Radio, Slider } from '@heroui/react';

export interface AssessmentQuestion {
  id: string;
  question: string;
  category: 'medical' | 'mental' | 'lifestyle' | 'general';
  type: 'text' | 'choice' | 'scale';
  options?: string[];
}

interface AssessmentFormProps {
  questions: AssessmentQuestion[];
  onComplete: (answers: Array<{ question: string; answer: string; category: string }>) => void;
  onCancel?: () => void;
}

export default function AssessmentForm({ questions, onComplete, onCancel }: AssessmentFormProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: answer });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Complete assessment
      const formattedAnswers = questions.map(q => ({
        question: q.question,
        answer: answers[q.id] || '',
        category: q.category,
      }));
      onComplete(formattedAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const canProceed = answers[currentQuestion.id]?.trim().length > 0;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'medical': return 'primary';
      case 'mental': return 'secondary';
      case 'lifestyle': return 'success';
      default: return 'default';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-gray-700">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-sm font-medium text-blue-600">{Math.round(progress)}%</span>
        </div>
        <Progress 
          value={progress} 
          color="primary"
          className="mb-2"
        />
      </div>

      {/* Question Card */}
      <Card className="shadow-lg mb-6">
        <CardBody className="p-8">
          <div className="mb-4">
            <Chip 
              color={getCategoryColor(currentQuestion.category) as any}
              variant="flat"
              className="uppercase font-semibold"
            >
              {currentQuestion.category}
            </Chip>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{currentQuestion.question}</h2>

          {/* Answer Input */}
          {currentQuestion.type === 'text' && (
            <Textarea
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Type your answer here..."
              minRows={4}
              variant="bordered"
              size="lg"
            />
          )}

          {currentQuestion.type === 'choice' && (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={handleAnswer}
            >
              {currentQuestion.options?.map((option) => (
                <Radio 
                  key={option} 
                  value={option}
                  className="mb-2"
                >
                  {option}
                </Radio>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === 'scale' && (
            <div className="space-y-4">
              <Slider
                value={answers[currentQuestion.id] ? [Number(answers[currentQuestion.id])] : [5]}
                onChange={(value) => handleAnswer(String(Array.isArray(value) ? value[0] : value))}
                minValue={1}
                maxValue={10}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                ]}
                className="max-w-full"
                color="primary"
              />
              <div className="text-center">
                <span className="text-3xl font-bold text-blue-600">
                  {answers[currentQuestion.id] || 5}
                </span>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center gap-4">
        <Button
          onClick={onCancel || handlePrevious}
          isDisabled={currentIndex === 0 && !onCancel}
          variant="bordered"
          size="lg"
        >
          {currentIndex === 0 && onCancel ? 'Cancel' : 'Previous'}
        </Button>

        <Button
          onClick={handleNext}
          isDisabled={!canProceed}
          color="primary"
          size="lg"
          className="font-semibold"
        >
          {currentIndex === questions.length - 1 ? 'Complete' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
