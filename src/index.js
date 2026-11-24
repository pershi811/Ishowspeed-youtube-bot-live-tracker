export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    console.log(`Incoming request: ${request.method} ${url.pathname}`);

    // 1. Handle YouTube WebSub Verification & Auto-Subscribe Trigger (GET)
    if (request.method === "GET") {
      const challenge = url.searchParams.get("hub.challenge");
      
      // Handle verification challenge from YouTube's hub
      if (challenge) {
        console.log("Handshaking challenge received from YouTube hub:", challenge);
        return new Response(challenge, { status: 200 });
      }

      // If you visit /subscribe in your browser, trigger the subscription request to YouTube
      if (url.pathname === "/subscribe") {
        const channelId = "UCVMhSwStrcffatn0oVnx0Uw"; // IShowSpeed's Channel ID
        const callbackUrl = `${url.origin}/`;
        const hubUrl = "https://pubsubhubbub.appspot.com/subscribe";

        const formData = new URLSearchParams({
          "hub.callback": callbackUrl,
          "hub.topic": `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`,
          "hub.verify": "async",
          "hub.mode": "subscribe",
          "hub.secret": ""
        });

        try {
          const subResponse = await fetch(hubUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData.toString()
          });

          if (subResponse.ok || subResponse.status === 202) {
            console.log("Subscription request sent successfully to YouTube hub.");
            return new Response("Subscription request sent successfully to YouTube's hub!", { status: 200 });
          } else {
            const errText = await subResponse.text();
            console.error(`Failed to subscribe: ${errText}`);
            return new Response(`Failed to subscribe: ${errText}`, { status: 500 });
          }
        } catch (err) {
          console.error(`Error sending subscription: ${err.message}`);
          return new Response(`Error sending subscription: ${err.message}`, { status: 500 });
        }
      }

      return new Response("IShowSpeed YouTube Bot is active!", { status: 200 });
    }

    // 2. Handle YouTube Live Notifications (POST)
    if (request.method === "POST") {
      const xmlText = await request.text();
      console.log("Received POST notification from YouTube:", xmlText);
      
      // Check if the payload indicates a video/livestream update
      if (xmlText.includes("yt:videoid") || xmlText.includes("http://www.youtube.com/xml/feed/v1.0/entries.xml")) {
        console.log("Live stream notification detected! Sending Discord alert...");
        await fetch(env.DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            content: "🚨 **IShowSpeed is LIVE on YouTube right now!** Check out the stream!" 
          })
        });
      }

      return new Response(null, { status: 204 });
    }

    return new Response("Method not allowed", { status: 405 });
  }
};
