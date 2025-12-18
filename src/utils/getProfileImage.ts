export function getProfileImage(photoURL?: string | null, displayName?: string | null): string {
  const name = (displayName?.trim() || "Hi").replace(/\s+/g, "+");
  const fallback = `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff&bold=true&size=256`;

  if (!photoURL) return fallback;
  if (photoURL.includes("googleusercontent.com") || photoURL.includes("ggpht.com")) {
    return photoURL.replace(/=s\d+-c/g, "=s256-c");
  }
  return photoURL;
}