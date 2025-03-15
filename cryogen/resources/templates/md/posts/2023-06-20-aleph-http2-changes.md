{:title "Adding HTTP/2 client support to Aleph"
 :slug "aleph-http2-client"
 :layout :post
 :tags ["Aleph" "HTTP" "HTTP/2" "Clojure"]}

Earlier this year, I received a grant from Clojurists Together to modernize Aleph and bring HTTP/2 support to it. These are some of the interesting tidbits of the journey so far.

## HTTP/2: Now Twice as Hypertextual!

I began with a deep dive into [RFC 9113](https://www.rfc-editor.org/rfc/rfc9113.html) and its predecessors, and absorbed everything I could about the new updates for [HTTP/2](https://web.dev/performance-http2/): streams, frames, flow control, server push, prioritization, connection status, pseudo-headers, etc. Some of the underlying changes are handled invisibly by Netty (Aleph's underlying network lib), like the new binary frames and header compression, but the rest required serious updates to Aleph to get working.

### Streams

HTTP is based on the simple concept of: send a request, wait for a response, repeat. Unfortunately, having to wait for the previous response before getting to send the next request is suboptimal. In theory, [HTTP/1.1 supports pipelining](https://developer.mozilla.org/en-US/docs/Web/HTTP/Connection_management_in_HTTP_1.x#http_pipelining), where you can fire off multiple requests without waiting for their responses, and eventually get the responses back in the same order. In reality, that breaks intermediate caches and proxies, so it's rarely enabled. The general solution is to just open multiple TCP connections to the server. Browsers typically limit it to a maximum of six connections per server, putting a cap on parallelism.

HTTP/2 solves this by assigning each request/response pair to a unique *stream* (not to be confused with Manifold streams), allowing you to tell which frames are related and safely interleave them. Unfortunately, this broke Aleph's deep assumptions about how things worked. 

When you make a request, Aleph returns a Manifold deferred (like a `CompletableFuture`), but under the hood, it transforms the Ring request map, places it on a `requests` Manifold stream, then a Manifold consumption callback pulls requests off the stream, transforms them some more, converts for Netty, and then places them on the Netty pipeline.

Each `put!` on the `requests` stream is followed by its corresponding `take!` from the `responses` stream. This works under the assumptions of HTTP/1 order, but breaks as soon as you have multiple requests in flight with HTTP/2, since an incoming response could be for an out-of-order request.

Fixing this required removing much of the underlying Manifold stream code for HTTP/2 connections.

### HTTP Version Negotiation

Supporting multiple HTTP versions requires changes to how how SSL/TLS is used. With just HTTP/1, you can connect to a web server and start transmitting. But RFC 9113 requires that you use TLS's Application-Layer Protocol Negotiation (ALPN; [RFC 7301](https://datatracker.ietf.org/doc/html/rfc7301)) with secure HTTP/2. 

In essence, the client and server agree on a protocol during the TLS handshake process. This is handy, but it broke Aleph's setup process, since you can no longer set up the Manifold code and Netty pipeline for a TCP connection in advance. 

What about *insecure* HTTP/2? Aleph doesn't support it yet, but the spec allows it if you *know in advance* that the server supports it (i.e., servers you control in your own internal network).

### Lies, Damned Lies, and Specifications

I learned a ton of material from the RFCs and design documents, and then I promptly had to *unlearn* a quarter of it. With evolving specs, there's a real danger in reading outdated information. It's not as simple as ignoring old RFCs, either.

##### Server Push

See, the RFC doesn't always reflect reality. Server push, where the server can initiate "responses" that the client hasn't requested (yet), turned out to be extremely difficult to get right. To truly do it correctly requires understanding the network timings of the connection, low-level control of the OS's TCP/IP buffers, and be able to interrogate the browser's cache. Done badly, it will actually make things *slower*. Chrome [effectively disabled it](https://developer.chrome.com/blog/removing-push/) last year, by turning it off for all new connections, but that's not in the specs.

##### Prioritization

Likewise, prioritization [did not pan out as hoped](https://blog.cloudflare.com/better-http-2-prioritization-for-a-faster-web/). In earlier versions of the HTTP/2 RFCs, they described a system relating streams to each other in a weighted DAG of dependencies. Unfortunately, each browser had different ideas of how to interpret the weights; Safari and Edge effectively ignored prioritization entirely. This led to servers being unable to use it in a general manner. On top of that, browsers already prioritized how they ordered/delayed requests to begin with. In the most recent RFC, prioritization was deprecated; for HTTP/3, they've started promoting a simpler, header-based prioritization system ([RFC 9218](https://www.rfc-editor.org/rfc/rfc9218.html)), which is backwards-compatible, so we hope to backport it when HTTP/3 work begins.

### Next Steps

The client code is under review now, and will be available as an alpha preview soon.

Many thanks to [Clojurists Together](https://www.clojuriststogether.org/) for supporting this work.