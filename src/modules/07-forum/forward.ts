
export async function forwardRequest(
    request: Request,
    options: { target: string; stripPrefix: string },
): Promise<Response> {
    console.log('PROXY FUNCTION CALLED:', request.url)
    const incomingUrl = new URL(request.url)
    const prefix = options.stripPrefix
    const path = incomingUrl.pathname.startsWith(prefix)
        ? incomingUrl.pathname.slice(prefix.length)
        : incomingUrl.pathname

    const targetUrl = new URL(
        `/api/discussionboards${incomingUrl.search}`,
        options.target,
    )

    const headers = new Headers(request.headers)
    headers.delete('host')

    const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body:
            request.method === 'GET' || request.method === 'HEAD'
                ? undefined
                : await request.arrayBuffer(),
        redirect: 'manual',
    })
    console.log('C# API response status:', response.status)

    const responseBody = await response.arrayBuffer()

    return new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    })
}


