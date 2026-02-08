/**
 * Mock Service Worker Server
 * Mocks API calls for testing
 */

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Setup server with handlers
export const server = setupServer(...handlers)
