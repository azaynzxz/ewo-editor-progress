export async function onRequest(context) {
    const { request, env, waitUntil } = context;
    const url = new URL(request.url);
    
    // Retrieve the URL from the environment variable
    const scriptUrlString = env.APPS_SCRIPT_URL;
    if (!scriptUrlString) {
        return new Response('APPS_SCRIPT_URL not configured', { status: 500 });
    }
    
    const isGet = request.method === 'GET' || request.method === 'HEAD';
    const forceRefresh = url.searchParams.has('_refresh');
    
    // Clean up the URL before passing to Google Apps Script
    if (forceRefresh) {
        url.searchParams.delete('_refresh');
    }
    
    // Cloudflare Edge Cache setup
    const cache = caches.default;
    // The cache key is strictly based on the request URL
    const cacheKey = new Request(url.toString(), request);
    
    // Attempt to serve from Edge Cache
    if (isGet && !forceRefresh) {
        const cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) {
            return cachedResponse;
        }
    }
    
    const scriptUrl = new URL(scriptUrlString);
    
    // Append any query parameters from the original request
    for (const [key, value] of url.searchParams.entries()) {
        scriptUrl.searchParams.append(key, value);
    }
    
    // Forward the request to Google Apps Script
    const init = {
        method: request.method,
        headers: request.headers,
    };
    
    if (!isGet) {
        init.body = await request.text();
    }
    
    // Create new headers without Host/Origin to let fetch set them natively
    const newHeaders = new Headers(init.headers);
    newHeaders.delete('Host');
    newHeaders.delete('Origin');
    newHeaders.delete('Referer');
    init.headers = newHeaders;

    try {
        const response = await fetch(scriptUrl.toString(), init);
        
        const responseHeaders = new Headers(response.headers);
        
        const responseToReturn = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
        
        // Cache successful GET responses for 5 minutes
        if (isGet && responseToReturn.ok) {
            const responseToCache = responseToReturn.clone();
            responseToCache.headers.set('Cache-Control', 's-maxage=300');
            waitUntil(cache.put(cacheKey, responseToCache));
        }
        
        return responseToReturn;
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: 'Proxy fetch failed', message: err.message }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
