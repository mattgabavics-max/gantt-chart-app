/**
 * Share Link Usage Examples
 * Demonstrates how to integrate share link functionality
 */

import React, { useState } from 'react'
import { ShareModal } from '../components/Share'

// ==================== Example 1: Project Header with Share Button ====================

export const ProjectHeaderWithShare: React.FC<{
  projectId: string
  projectName: string
}> = ({ projectId, projectName }) => {
  const [showShareModal, setShowShareModal] = useState(false)

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{projectName}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Other buttons */}
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Export
            </button>

            {/* Share Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        projectId={projectId}
        projectName={projectName}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  )
}

// ==================== Example 2: Quick Share with Keyboard Shortcut ====================

export const ProjectWithQuickShare: React.FC<{
  projectId: string
  projectName: string
}> = ({ projectId, projectName }) => {
  const [showShareModal, setShowShareModal] = useState(false)

  // Keyboard shortcut: Ctrl+Shift+S / Cmd+Shift+S
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        setShowShareModal(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-700">
          💡 Tip: Press{' '}
          <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">
            Ctrl+Shift+S
          </kbd>{' '}
          to quickly share this project
        </p>
      </div>

      {/* Your project content */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">{projectName}</h2>
        <p className="text-gray-600">Project content goes here...</p>
      </div>

      <ShareModal
        projectId={projectId}
        projectName={projectName}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  )
}

// ==================== Example 3: Share Button in Dropdown Menu ====================

export const ProjectDropdownMenu: React.FC<{
  projectId: string
  projectName: string
}> = ({ projectId, projectName }) => {
  const [showMenu, setShowMenu] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  return (
    <div className="relative">
      {/* Menu Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={() => {
                setShowShareModal(true)
                setShowMenu(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share Project
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Duplicate
            </button>
          </div>
        </>
      )}

      <ShareModal
        projectId={projectId}
        projectName={projectName}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  )
}

// ==================== Example 4: Programmatic Share Link Creation ====================

export const ProgrammaticShareExample: React.FC<{
  projectId: string
}> = ({ projectId }) => {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const createQuickShareLink = async () => {
    setIsCreating(true)
    try {
      // This would use the useCreateShareLink hook in a real implementation
      // For demonstration purposes:
      const mockToken = 'abc123xyz789'
      const url = `${window.location.origin}/share/${mockToken}`
      setShareUrl(url)

      // Auto-copy to clipboard
      await navigator.clipboard.writeText(url)
      alert('Share link copied to clipboard!')
    } catch (error) {
      console.error('Failed to create share link:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Share</h3>
      <p className="text-sm text-gray-600 mb-4">
        Generate a quick share link that expires in 24 hours
      </p>

      <button
        onClick={createQuickShareLink}
        disabled={isCreating}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isCreating ? 'Generating...' : 'Generate Quick Link'}
      </button>

      {shareUrl && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-700 mb-1">Link created and copied!</p>
          <code className="text-xs text-green-800 break-all">{shareUrl}</code>
        </div>
      )}
    </div>
  )
}

// ==================== Example 5: Complete Integration ====================

export const CompleteShareIntegration: React.FC<{
  projectId: string
  projectName: string
}> = ({ projectId, projectName }) => {
  const [showShareModal, setShowShareModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Project Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{projectName}</h1>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded shadow-sm">
                  Timeline
                </button>
                <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
                  Board
                </button>
                <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
                  List
                </button>
              </div>

              {/* Action Buttons */}
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Export
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Project Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-semibold mb-4">Project Overview</h2>
          <p className="text-gray-600">Your project content goes here...</p>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        projectId={projectId}
        projectName={projectName}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  )
}
