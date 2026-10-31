/* Accounts record which courses they signed up for (user_metadata.courses, set at sign-up).
   The study app here is MCAT. An account signed up only for Spanish goes to the Spanish page, which is where
   Spanish practice lives for now. Accounts from before courses were recorded have no list and are MCAT. */
(() => {
  'use strict';
  const check = () => {
    if(typeof sbUser === 'undefined' || !sbUser) return;
    const c = sbUser.user_metadata && sbUser.user_metadata.courses;
    if(Array.isArray(c) && c.length && !c.includes('mcat')) location.replace('/spanish');
  };
  const base = render;
  render = function(){ base(); check(); };
  check();
})();
