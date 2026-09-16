import {
  generateProtectedResourceMetadata,
  getPublicOrigin,
  metadataCorsOptionsRequestHandler,
} from "mcp-handler";
import { getClerkIssuer, MCP_SCOPES } from "@/lib/oauth";

// Tells an MCP client where to get a token for /mcp, per RFC 9728. Clients
// find it through the WWW-Authenticate header on our 401.
export function GET(request: Request) {
  // `resource` has to match the URL the user typed into their client exactly,
  // path included — Claude and ChatGPT both reject a mismatch.
  const metadata = generateProtectedResourceMetadata({
    authServerUrls: [getClerkIssuer()],
    resourceUrl: `${getPublicOrigin(request)}/mcp`,
    additionalMetadata: { scopes_supported: MCP_SCOPES },
  });

  return Response.json(metadata, {
    headers: {
      "Cache-Control": "max-age=3600",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

export const OPTIONS = metadataCorsOptionsRequestHandler();
