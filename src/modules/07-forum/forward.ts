
export async function forwardRequest(
    request: Request,
    options: { target: string; stripPrefix: string },
): Promise<Response> {
    const incomingUrl = new URL(request.url)

    const path = incomingUrl.pathname.startsWith(options.stripPrefix)
        ? incomingUrl.pathname.slice(options.stripPrefix.length)
        : incomingUrl.pathname

    const targetUrl = new URL(
        `${path}${incomingUrl.search}`,
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

    const responseHeaders = new Headers(response.headers)
    responseHeaders.delete('transfer-encoding')
    responseHeaders.delete('content-encoding')
    responseHeaders.delete('content-length')

    return new Response(await response.arrayBuffer(), {
        status: response.status,
        headers: responseHeaders,
    })
}
