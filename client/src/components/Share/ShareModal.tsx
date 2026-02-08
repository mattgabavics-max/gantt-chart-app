/**
 * ShareModal Component
 * Modal for creating and managing project share links
 */

import React, { useState } from 'react'
import {
  useShareLinks,
  useCreateShareLink,
  useRevokeShareLink,
} from '../../hooks'
import type { ShareLink } from '../../types/api'

// ==================== Types ====================

interface ShareModalProps {
  projectId: string
  projectName: string
  isOpen: boolean
  onClose: () => void
}

type ExpirationOption = '24h' | '7d' | '30d' | 'never'

const EXPIRATION_OPTIONS: Array<{
  value: ExpirationOption
  label: string
  days: number | null
}> = [
  { value: '24h', label: '24 hours', days: 1 },
  { value: '7d', label: '7 days', days: 7 },
  { value: '30d', label: '30 days', days: 30 },
  { value: 'never', label: 'Never expires', days: null },
]

// ==================== Component ====================

export const ShareModal: React.FC<ShareModalProps> = ({
  projectId,
  projectName,
  isOpen,
  onClose,
}) => {
  // State
  const [accessType, setAccessType] = useState<'readonly' | 'editable'>('readonly')
  const [expiration, setExpiration] = useState<ExpirationOption>('7d')
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)

  // Queries
  const {
    data: shareLinksData,
    isLoading: isLoadingLinks,
    error: loadError,
  } = useShareLinks(projectId, undefined, {
    enabled: isOpen,
  })

  // Mutations
  const createShareLink = useCreateShareLink({
    onSuccess: () => {
      // Reset form
      setAccessType('readonly')
      setExpiration('7d')
    },
  })

  const revokeShareLink = useRevokeShareLink()

  // Handlers
  const handleCreateLink = () => {
    const expirationDays = EXPIRATION_OPTIONS.find(
      (opt) => opt.value === expiration
    )?.days

    createShareLink.mutate({
      projectId,
      accessType,
      expirationDays: expirationDays ?? undefined,
    })
  }

  const handleCopyLink = async (shareLink: ShareLink) => {
    const url = `${window.location.origin}/share/${shareLink.token}`

    try {
      await navigator.clipboard.writeText(url)
      setCopiedLinkId(shareLink.id)

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedLinkId(null)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const handleRevokeLink = (shareLinkId: string) => {
    if (confirm('Are you sure you want to revoke this share link?')) {
      revokeShareLink.mutate({ projectId, shareLinkId })
    }
  }

  const formatExpirationDate = (expiresAt: Date | null) => {
    if (!expiresAt) return 'Never'
    return new Date(expiresAt).toLocaleDateString()
  }

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Share Project
              </h2>
              <p className="text-sm text-gray-600 mt-1">{projectName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {/* Create New Link Section */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Create New Share Link
              </h3>

              {/* Access Type Toggle */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Access Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAccessType('readonly')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                      accessType === 'readonly'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span className="font-medium">View Only</span>
                    </div>
                    <p className="text-xs mt-1">Can view but not edit</p>
                  </button>

                  <button
                    onClick={() => setAccessType('editable')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                      accessType === 'editable'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      <span className="font-medium">Can Edit</span>
                    </div>
                    <p className="text-xs mt-1">Can view and edit</p>
                  </button>
                </div>
              </div>

              {/* Expiration Options */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Expiration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {EXPIRATION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setExpiration(option.value)}
                      className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        expiration === option.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Link Button */}
              <button
                onClick={handleCreateLink}
                disabled={createShareLink.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                {createShareLink.isPending ? 'Generating...' : 'Generate Share Link'}
              </button>

              {createShareLink.isError && (
                <p className="mt-2 text-sm text-red-600">
                  Failed to create share link. Please try again.
                </p>
              )}
            </div>

            {/* Existing Links Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Active Share Links
              </h3>

              {isLoadingLinks ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : loadError ? (
                <div className="text-center py-8 text-red-600">
                  Failed to load share links
                </div>
              ) : shareLinksData?.data.shareLinks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No share links created yet
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {shareLinksData?.data.shareLinks.map((link) => (
                    <div
                      key={link.id}
                      className={`p-4 rounded-lg border ${
                        isExpired(link.expiresAt)
                          ? 'border-red-200 bg-red-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                link.accessType === 'readonly'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {link.accessType === 'readonly'
                                ? 'View Only'
                                : 'Can Edit'}
                            </span>
                            {isExpired(link.expiresAt) && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                                Expired
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">
                            Created {new Date(link.createdAt).toLocaleDateString()} by{' '}
                            {link.createdBy.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            Expires: {formatExpirationDate(link.expiresAt)}
                          </p>
                          <p className="text-xs text-gray-600">
                            Accessed {link.accessCount} times
                            {link.lastAccessedAt &&
                              ` (last: ${new Date(
                                link.lastAccessedAt
                              ).toLocaleDateString()})`}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopyLink(link)}
                            disabled={isExpired(link.expiresAt)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                              copiedLinkId === link.id
                                ? 'bg-green-100 text-green-700'
                                : isExpired(link.expiresAt)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {copiedLinkId === link.id ? (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Copied!
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                                Copy
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleRevokeLink(link.id)}
                            disabled={revokeShareLink.isPending}
                            className="px-3 py-1.5 rounded text-sm font-medium text-red-600 bg-white border border-red-300 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>

                      {/* Link Preview (truncated) */}
                      <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                        <code className="text-xs text-gray-600 break-all">
                          {window.location.origin}/share/{link.token}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
