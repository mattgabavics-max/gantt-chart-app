/**
 * Test Polyfills
 * These polyfills must be loaded BEFORE any other test setup
 * to ensure MSW and other dependencies can use them during module initialization
 */

// Import fetch polyfill FIRST
import 'whatwg-fetch'
import { TextEncoder, TextDecoder } from 'util'
import { TransformStream, WritableStream, ReadableStream } from 'stream/web'

// Polyfill for Response, Request, Headers (provided by whatwg-fetch)
if (typeof global.Response === 'undefined') {
  global.Response = Response as any
}
if (typeof global.Request === 'undefined') {
  global.Request = Request as any
}
if (typeof global.Headers === 'undefined') {
  global.Headers = Headers as any
}

// Polyfill for TextEncoder/TextDecoder (required by MSW)
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder as any
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as any
}

// Polyfill for Web Streams API (required by MSW)
if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = TransformStream as any
}
if (typeof global.WritableStream === 'undefined') {
  global.WritableStream = WritableStream as any
}
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = ReadableStream as any
}

// Polyfill for BroadcastChannel (required by MSW)
if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    name: string
    constructor(name: string) {
      this.name = name
    }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
      return true
    }
  } as any
}
