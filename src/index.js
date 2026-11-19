export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Handle YouTube WebSub Handshake (GET)
    if (request.method === "GET") {
      const challenge = url.searchParams.get("hub.challenge");
      if (challenge) {
        return new Response(challenge, { status: 200 });
      }
      return new Response("IShowSpeed YouTube Bot is active!", { status: 200 });
    }

    // 2. Handle YouTube Live Notifications (POST)
    if (request.method === "POST") {
      const xmlText = await request.text();
      
      // Check if the payload indicates a video/livestream update
      if (xmlText.includes("yt:videoid") || xmlText.includes("http://www.youtube.com/xml/feed/v1.0/entries.xml")) {
        // Send alert to your Discord/Telegram webhook URL
        await fetch(env.DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            content: "🚨 **IShowSpeed might be LIVE on YouTube right now!** Check out the channel." 
          })
        });
      }

      return new Response(null, { status: 204 });
    }

    return new Response("Method not allowed", { status: 405 });
  }
};
