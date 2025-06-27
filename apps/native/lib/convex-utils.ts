export const generateConvexApiUrl = (relativePath: string) => {
  const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
  
  if (!convexUrl) {
    throw new Error('EXPO_PUBLIC_CONVEX_URL environment variable is not defined');
  }
  
  // Remove the trailing slash if present and convert .cloud to .site for HTTP actions
  let baseUrl = convexUrl.endsWith('/') ? convexUrl.slice(0, -1) : convexUrl;
  
  // Convex HTTP actions are served from .site domain, not .cloud
  if (baseUrl.includes('.convex.cloud')) {
    baseUrl = baseUrl.replace('.convex.cloud', '.convex.site');
  }
  
  // Ensure path starts with /
  const apiPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  
  const finalUrl = `${baseUrl}${apiPath}`;
  
  return finalUrl;
}; 