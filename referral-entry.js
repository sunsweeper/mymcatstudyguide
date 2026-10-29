/* Runs before the URL is tidied: remember that this visit arrived on the referral link (see referral.js). */
try { if(location.pathname.replace(/\/$/, "") === "/referral"){ window.__referralEntry = true; sessionStorage.setItem("tabi-referral", "1"); } } catch(e){}
