'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface FeedbackFormProps {
  orderId: string
  existingFeedback?: {
    timestamp: string
    rating: number
    comment: string
  } | null
}

export default function FeedbackForm({ orderId, existingFeedback: initialFeedback }: FeedbackFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({
    rating: 5,
    comment: '',
  })
  const [submittedFeedback, setSubmittedFeedback] = useState(initialFeedback)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          ...feedback,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      setSubmittedFeedback({
        timestamp: new Date().toISOString(),
        rating: feedback.rating,
        comment: feedback.comment,
      })

      toast.success('Thank you for your feedback!', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#667538',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
      })

      setFeedback({ rating: 5, comment: '' })
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback. Please try again.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submittedFeedback) {
    return (
      <div className="mt-8 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#667538]/10 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#667538]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Your Feedback</h2>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-gray-700">Rating</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-[#667538] font-medium">{submittedFeedback.rating}/5</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-3xl ${
                    star <= submittedFeedback.rating ? 'text-yellow-400' : 'text-gray-200'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {submittedFeedback.comment && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium text-gray-700">Your Comment</span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-[#667538] font-medium">Personal Note</span>
              </div>
              <p className="text-gray-600 leading-relaxed">{submittedFeedback.comment}</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Submitted on {new Date(submittedFeedback.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#667538]/10 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#667538]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">Customer Feedback</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-gray-700">Rating</span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-[#667538] font-medium">How was your experience?</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFeedback({ ...feedback, rating: star })}
                className={`text-3xl transition-colors duration-200 ${
                  star <= feedback.rating ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-200 hover:text-gray-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-gray-700">Comments</span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-[#667538] font-medium">Share your thoughts</span>
          </div>
          <textarea
            id="comment"
            rows={4}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#97c28d] focus:border-[#97c28d] transition-colors duration-200"
            value={feedback.comment}
            onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
            placeholder="Share your experience with us..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#667538] hover:bg-[#525f2d] text-white py-3 px-4 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#97c28d] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Submitting...</span>
            </div>
          ) : (
            'Submit Feedback'
          )}
        </button>
      </form>
    </div>
  )
} 