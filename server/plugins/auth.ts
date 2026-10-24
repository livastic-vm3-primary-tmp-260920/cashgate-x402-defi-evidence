import { createToolkitAuthPlugin } from "@agent-native/toolkit/app/auth/server";

// Public evidence desk is view-only. All scaffold collaboration, settings,
// histories, organizations and user data remain protected by the framework.
// The two explicitly public actions are bounded, read-only and accept no URLs.
export default createToolkitAuthPlugin({
  workspaceAppPublicPaths: ["/", "/home"],
  rootAuth: false,
  marketing: false,
});
