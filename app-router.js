/* Screen URLs only. The existing application owns authentication and study state. */
(() => {
  if (!/^https?:$/.test(location.protocol)) return;
  const base=document.createElement('base');base.href='/';document.head.prepend(base);
  const screens = {welcome:'/dashboard',bm:'/bookmarks',notes:'/notes',weakdash:'/weaknesses',account:'/account',owner:'/owner-dashboard',mcatdate:'/test-date',import:'/import-progress',gpreview:'/graphics-preview'};
  const auth = {login:'/login',signup:'/signup',forgot:'/forgot-password',reset:'/reset-password',sent:'/check-email',check:'/verify-email'};
  const topics = {bb:'bio-biochem',cp:'chem-phys',ps:'psych-soc',cars:'cars',all:'all-topics',weak:'weakest-topics',focus:'focused-review',mine:'my-cards'};
  const stages = {intro:'/start',cards:'',ask:'/missed-cards',rfIntro:'/reinforcement/start',rf:'/reinforcement',rfDone:'/reinforcement/complete',done:'/complete'};
  const clean = path => path.replace(/\/$/,'') || '/';
  function decode(path){
    path = clean(path);
    for(const [view,url] of Object.entries(auth)) if(path===url) return {auth:view};
    for(const [screen,url] of Object.entries(screens)) if(path===url) return {mode:screen};
    for(const [topic,slug] of Object.entries(topics)) for(const [screen,suffix] of Object.entries(stages)) if(path===`/study/${slug}${suffix}`) return {mode:screen,filter:topic};
    return null;
  }
  const initial = clean(location.pathname);
  const next = new URLSearchParams(location.search).get('next');
  let pending = decode(initial)?.mode ? initial : next && decode(next)?.mode ? next : null;
  let applying = false, first = true;
  function write(path,replace){
    if(location.pathname+location.search===path) return;
    // Auth fragments stay in the browser until Supabase has consumed them.
    if(location.hash) return;
    history[replace?'replaceState':'pushState']({mcat:true},'',path);
  }
  function sync(){
    if(applying || (mode==='auth' && authView==='loading')) return;
    let path;
    if(mode==='auth') path=(auth[authView]||auth.login)+(pending?'?next='+encodeURIComponent(pending):'');
    else path=screens[mode] || (topics[filter] && stages[mode]!==undefined ? `/study/${topics[filter]}${stages[mode]}` : null);
    if(!path) return;
    write(path,first);first=false;
  }
  function apply(path){
    const route=decode(path);
    applying=true;
    try{
      if(AUTH_ON && !sbUser){
        if(route?.mode) pending=clean(path);
        mode='auth';authView=route?.auth || 'login';
        // A reset form is only entered through an actual recovery session.
        if(authView==='reset') authView='forgot';
        render();
      }else if(route?.auth || !route){ mode='welcome';render(); }
      else if(route.filter){
        filter=route.filter;
        if(route.mode==='intro'){pick(filter);}
        else if(SESSION_MODES.includes(route.mode)){
          // Resume the saved phase, never manufacture a new reinforcement phase.
          if(openSession(filter)) start(false);else pick(filter);
        }else if(route.mode==='done' && lastSummary?.topic===filter){show('done');}
        else pick(filter);
      }else if(route.mode==='owner'){
        if(profile?.is_admin){openSide('owner');loadOwner();}else show('welcome');
      }else if(route.mode==='account'){openAccount();}
      else if(route.mode==='mcatdate'){openDate();}
      else if(route.mode==='import' && !pendingImport){show('welcome');}
      else if(route.mode==='gpreview'){show('gpreview');}
      else if(route.mode==='welcome'){show('welcome');}
      else openSide(route.mode);
    }finally{applying=false;first=true;sync();}
  }
  function enter(){const destination=pending||'/dashboard';pending=null;apply(destination);}
  function authViewForPath(){const view=decode(location.pathname)?.auth;return ['signup','forgot','sent','check'].includes(view)?view:'login';}
  addEventListener('popstate',()=>{
    const target=location.pathname;
    // Use the application's existing note-save/discard confirmation before leaving a card.
    leaveCard(()=>{if(SESSION_MODES.includes(mode)){flushTime();persistPlace();}apply(target);});
  });
  window.MCATRoutes={sync,enter,authViewForPath};
})();
