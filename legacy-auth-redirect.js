// Forward both initial and same-page legacy auth links without altering their tokens.
(() => {
 const forward = () => {
  const h = new URLSearchParams(location.hash.slice(1));
  if (['access_token','refresh_token','error','error_description','type'].some(k=>h.has(k)) || new URLSearchParams(location.search).has('code')) location.replace('/login'+location.search+location.hash);
 };
 addEventListener('hashchange', forward);
 forward();
})();
