// Custom events for Umami (cookieless). The script is loaded in index.html and
// only counts the live site; if it's blocked or absent (dev, ad blocker),
// this does nothing.
export const track = (name, data) => {
  try { window.umami?.track(name, data) } catch { /* ignore */ }
}
