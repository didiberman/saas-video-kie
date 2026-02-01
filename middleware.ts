import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const host = request.headers.get('host') || ''

    // If user accesses the old domain, redirect to valid new domain
    if (host.includes('saas.didiberman.com')) {
        const newUrl = new URL(request.url)
        newUrl.host = 'vibeflow.video'
        newUrl.protocol = 'https'
        newUrl.port = '' // Force remove port 8080 (Cloud Run internal port)

        // Preserve path and search params
        return NextResponse.redirect(newUrl, {
            status: 301 // Permanent redirect
        })
    }

    return NextResponse.next()
}

export const config = {
    matcher: '/:path*',
}
