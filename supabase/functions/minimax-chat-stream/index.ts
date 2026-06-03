// Edge Function: minimax-chat-stream
// 流式 SSE 版本，透传 MiniMax M2.5 SSE 流到前端
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
  }

  let model: string;
  let messages: unknown[];
  let options: Record<string, unknown> = {};

  try {
    const body = await req.json();
    model = body.model ?? "MiniMax-M2.5";
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("messages 不能为空");
    }
    const { max_completion_tokens, temperature, top_p, tools, tool_choice } = body;
    if (max_completion_tokens !== undefined) options.max_completion_tokens = max_completion_tokens;
    if (temperature !== undefined) options.temperature = temperature;
    if (top_p !== undefined) options.top_p = top_p;
    if (tools !== undefined) options.tools = tools;
    if (tool_choice !== undefined) options.tool_choice = tool_choice;
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "请求参数无效", detail: String(e) }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "服务器配置错误：缺少 API Key" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const upstream = await fetch(
    "https://app-bmlg4r4jrmyp-api-Aa2PqMJnJGwL-gateway.appmiaoda.com/v1/text/chatcompletion_v2",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        stream_options: { include_usage: true },
        ...options,
      }),
    }
  );

  if (!upstream.ok || !upstream.body) {
    return new Response(
      JSON.stringify({ error: "上游错误" }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // 直接透传 SSE 流
  return new Response(upstream.body, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
