# Builds the draft graphical cards (Package 2, Phase 8). Diagrams are generated from data so curves are exact.
import math, json
INK='#1F2B27'; ROSE='#C8505F'; SAGE='#4E8A62'; MUTED='#6B7A73'
W,H=320,200; L,R,T,B=44,300,16,164   # plot box
def svg(tid, title, desc, body, h=H):
    return (f'<figure class="gfig"><svg class="fig" viewBox="0 0 {W} {h}" role="img" aria-labelledby="{tid}-t {tid}-d" xmlns="http://www.w3.org/2000/svg">'
            f'<title id="{tid}-t">{title}</title><desc id="{tid}-d">{desc}</desc>'
            f'<g font-family="inherit" font-size="13" fill="{INK}">{body}</g></svg></figure>')
def axes(xl, yl, x0=L, y0=B):
    return (f'<path d="M{L} {T} V{B} H{R}" fill="none" stroke="{INK}" stroke-width="1.6"/>'
            f'<text x="{(L+R)/2}" y="{B+28}" text-anchor="middle">{xl}</text>'
            f'<text x="14" y="{(T+B)/2}" text-anchor="middle" transform="rotate(-90 14 {(T+B)/2})">{yl}</text>')
def path(pts, color=INK, dash=None, w=2.2):
    d='M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in pts)
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}"{" stroke-dasharray=\"%s\""%dash if dash else ""} stroke-linecap="round" stroke-linejoin="round"/>'
def line(x1,y1,x2,y2,color=MUTED,dash="4 4",w=1.4):
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{color}" stroke-width="{w}"{" stroke-dasharray=\"%s\""%dash if dash else ""}/>'
def text(x,y,s,anchor="middle",color=INK,size=12,weight=400):
    return f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" fill="{color}" font-size="{size}" font-weight="{weight}">{s}</text>'
def mapper(xmin,xmax,ymin,ymax,l=L,r=R,t=T,b=B):
    return lambda x,y:(l+(x-xmin)/(xmax-xmin)*(r-l), b-(y-ymin)/(ymax-ymin)*(b-t))
cards=[]
def card(sec,cid,concept,q,a,fig,fig_side="q",skill="graphical_identification"):
    cards.append({"sec":sec,"id":cid,"concept":concept,"q":(fig+q) if fig_side=="q" else q,"a":a if fig_side=="q" else fig+a,"skill":skill})

# 1 Michaelis-Menten
m=mapper(0,10,0,1.15); Vmax=1; Km=1.6
pts=[m(s, Vmax*s/(Km+s)) for s in [i*0.05 for i in range(0,201)]]
kx,ky=m(Km,0.5)
body=axes('[S]','Reaction rate (v)')+line(L,m(0,1)[1],R,m(0,1)[1])+text(R-2,m(0,1)[1]-5,'V<tspan baseline-shift="sub" font-size="9">max</tspan>','end',MUTED)+\
     line(L,ky,kx,ky)+line(kx,ky,kx,B)+text(L+4,ky-5,'½V<tspan baseline-shift="sub" font-size="9">max</tspan>','start',MUTED,11)+path(pts,ROSE)+text(kx,B+14,'?','middle',ROSE,14,700)
card('bb','1A-G01','1A.kinetics.michaelis-menten',
 '<div>In this Michaelis–Menten plot, what does the substrate concentration marked “?” represent?</div>',
 'K<sub>m</sub>, the substrate concentration at which the reaction rate is half of V<sub>max</sub>. A lower K<sub>m</sub> means higher apparent affinity for the substrate.',
 svg('g1a01','Michaelis–Menten plot','Reaction rate rises with substrate concentration and levels off at Vmax. A dashed line at half of Vmax meets the curve; a dashed line drops from that point to the substrate-concentration axis, marked with a question mark.',body))

# 2/3 Lineweaver-Burk
def lb(tid, inhib):
    m=mapper(-1.2,2.2,0,4.2)
    ox,oy=m(0,0)
    body=f'<path d="M{L} {B} H{R}" stroke="{INK}" stroke-width="1.4"/><path d="M{ox:.1f} {T} V{B}" stroke="{INK}" stroke-width="1.6"/>'
    body+=text(R-2,B+16,'1/[S]','end')+text(ox+6,T+10,'1/v','start')
    # no inhibitor: 1/v = (Km/Vmax)(1/S) + 1/Vmax, Km=1, Vmax=1 -> slope 1, intercept 1
    def ln(slope,ic,color,dash=None):
        xs=-ic/slope; x1=max(-1.2,xs); x2=2.2
        return path([m(x1,slope*x1+ic),m(x2,slope*x2+ic)],color,dash)
    body+=ln(1,1,INK)
    if inhib=='comp': body+=ln(1.8,1,ROSE,'7 5')  # same y-int, x-int -1/1.8
    else: body+=ln(1.6,1.6,ROSE,'7 5')           # same x-int -1, y-int 1.6
    lx,ly=R-118,B-40
    body+=f'<line x1="{lx}" y1="{ly}" x2="{lx+22}" y2="{ly}" stroke="{INK}" stroke-width="2.2"/>'+text(lx+28,ly+4,'No inhibitor','start',INK,11)
    body+=f'<line x1="{lx}" y1="{ly+16}" x2="{lx+22}" y2="{ly+16}" stroke="{ROSE}" stroke-width="2.2" stroke-dasharray="7 5"/>'+text(lx+28,ly+20,'With inhibitor','start',INK,11)
    desc=('Two straight lines on a double-reciprocal plot (1/v against 1/[S]). The inhibited line is steeper; both lines cross the 1/v axis at the same point, and the inhibited line crosses the 1/[S] axis closer to the origin.' if inhib=='comp'
          else 'Two straight lines on a double-reciprocal plot (1/v against 1/[S]). The inhibited line is steeper and crosses the 1/v axis higher; both lines meet at the same point on the 1/[S] axis.')
    return svg(tid,'Lineweaver–Burk plot',desc,body)
card('bb','1A-G02','1A.inhibition-types','<div>This Lineweaver–Burk plot shows an enzyme with and without an inhibitor. What type of inhibition is it?</div>',
 'Competitive inhibition. The lines share the same y-intercept (1/V<sub>max</sub>), so V<sub>max</sub> is unchanged; the inhibited line’s x-intercept (−1/K<sub>m</sub>) is closer to zero, so apparent K<sub>m</sub> increases.', lb('g1a02','comp'))
card('bb','1A-G03','1A.inhibition-types','<div>This Lineweaver–Burk plot shows an enzyme with and without an inhibitor. What type of inhibition is it?</div>',
 'Noncompetitive inhibition. The lines share the same x-intercept (−1/K<sub>m</sub>), so K<sub>m</sub> is unchanged; the inhibited line’s higher y-intercept (1/V<sub>max</sub>) means V<sub>max</sub> decreases.', lb('g1a03','non'))

# 4 Titration curve weak acid + strong base (Ka=1e-5 style, analytic-ish shape)
m=mapper(0,2,0,14)
def ph(v):  # v in units of equivalence volume
    if v<=0.001: return 3.0
    if v<1: return 5+math.log10(v/(1-v))   # pKa 5 buffer region
    if v<1.0001: return 8.8
    excess=v-1; return min(12.6, 14+math.log10(max(1e-9,excess*0.1/(1+v))))
vs=[i/400 for i in range(0,801)]
pts=[]
for v in vs:
    p=ph(v)
    if 0.98<v<1.02: p=5+math.log10(0.98/0.02)+(v-0.98)/0.04*(14+math.log10(0.02*0.1/2.02)-(5+math.log10(0.98/0.02)))
    pts.append(m(v,max(3,min(12.6,p))))
hx,hy=m(0.5,5)
body=axes('Volume of strong base added','pH')+path(pts,ROSE)+line(hx,hy,hx,B)+line(L,hy,hx,hy)+f'<circle cx="{hx:.1f}" cy="{hy:.1f}" r="5" fill="{INK}"/>'+\
     text(hx,B+14,'½ V<tspan baseline-shift="sub" font-size="9">eq</tspan>','middle',MUTED,11)+text(m(1,0)[0],B+14,'V<tspan baseline-shift="sub" font-size="9">eq</tspan>','middle',MUTED,11)+line(m(1,0)[0],B,m(1,0)[0],m(1,8.8)[1])+text(L-4,m(0,7)[1]+4,'7','end',MUTED,11)
card('cp','5A-G01','5A.interpretation-of-the-titration-curves','<div>On this titration curve of a weak acid with a strong base, what is true at the marked point (half the volume needed to reach equivalence)?</div>',
 'pH = pK<sub>a</sub> of the acid. Half of the acid has been converted to its conjugate base, so [HA] = [A<sup>−</sup>] and, by Henderson–Hasselbalch, pH = pK<sub>a</sub>. (The equivalence point itself is above pH 7.)',
 svg('g5a01','Titration curve','pH starts low, rises slowly through a flat buffer region, then jumps steeply near the equivalence volume and levels off high. A point is marked on the flat region at half the equivalence volume; the equivalence point lies above pH 7.',body))

# 5 Phase diagram (water-like)
m=mapper(0,10,0,10)
tp=m(3.2,3.0)
body=axes('Temperature','Pressure')
body+=path([m(0.4,0.3),m(1.6,1.0),m(2.6,2.0),(tp[0],tp[1])],INK)            # sublimation
body+=path([(tp[0],tp[1]),m(5.5,5.0),m(7.8,7.3),m(8.6,8.0)],INK)             # vaporization to critical
body+=path([(tp[0],tp[1]),m(2.7,9.6)],INK)                                    # fusion, negative slope (water)
body+=f'<circle cx="{tp[0]:.1f}" cy="{tp[1]:.1f}" r="5" fill="{ROSE}"/>'+text(tp[0]+10,tp[1]+16,'X','start',ROSE,13,700)
body+=f'<circle cx="{m(8.6,8.0)[0]:.1f}" cy="{m(8.6,8.0)[1]:.1f}" r="3.5" fill="{INK}"/>'
body+=text(*m(1.3,6.5),'Solid')+text(*m(5.0,7.4),'Liquid')+text(*m(6.8,2.2),'Gas')
card('cp','5E-G01','5E.phase-diagram-pressure-and-temperature','<div>On this phase diagram (water), what does point X represent?</div>',
 'The triple point: the one temperature and pressure at which solid, liquid and gas coexist in equilibrium. (For water the solid–liquid line slopes slightly backward, because ice is less dense than liquid water.)',
 svg('g5e01','Phase diagram of water','Pressure against temperature with solid, liquid and gas regions. Three boundary lines meet at a point marked X. The solid–liquid line tilts slightly to the left as pressure rises; the liquid–gas line ends at a critical point.',body))

# pedigree helpers
def male(x,y,aff): return f'<rect x="{x-10}" y="{y-10}" width="20" height="20" fill="{INK if aff else "#FFFFFF"}" stroke="{INK}" stroke-width="1.8"/>'
def female(x,y,aff): return f'<circle cx="{x}" cy="{y}" r="10.5" fill="{INK if aff else "#FFFFFF"}" stroke="{INK}" stroke-width="1.8"/>'
def mate(x1,x2,y): return f'<line x1="{x1+10}" y1="{y}" x2="{x2-10}" y2="{y}" stroke="{INK}" stroke-width="1.6"/>'
def sibs(xmid,y1,y2,xs):
    mid=(y1+y2)/2
    s=f'<line x1="{xmid}" y1="{y1}" x2="{xmid}" y2="{mid}" stroke="{INK}" stroke-width="1.6"/><line x1="{min(xs)}" y1="{mid}" x2="{max(xs)}" y2="{mid}" stroke="{INK}" stroke-width="1.6"/>'
    for x in xs: s+=f'<line x1="{x}" y1="{mid}" x2="{x}" y2="{y2-11}" stroke="{INK}" stroke-width="1.6"/>'
    return s
def legend(y):
    return male(30,y,True)+text(46,y+4,'affected','start',MUTED,11)+male(120,y,False)+text(136,y+4,'unaffected','start',MUTED,11)+text(230,y+4,'□ male  ○ female','start',MUTED,11)
# 6 autosomal recessive
body=text(18,44,'I','start',MUTED)+text(18,124,'II','start',MUTED)
body+=male(130,40,False)+female(190,40,False)+mate(130,190,40)+sibs(160,40,120,[130,190])+male(130,120,False)+female(190,120,True)+legend(178)
card('bb','1C-G01','1C.recessiveness','<div>Two unaffected parents have an affected daughter. Which mode of inheritance does this pedigree indicate?</div>',
 'Autosomal recessive. Both parents must be carriers (heterozygous). It can’t be dominant, because neither parent is affected, and it can’t be X-linked recessive, because an affected daughter would need an affected father.',
 svg('g1c01','Pedigree, two generations','Generation one: an unaffected father and an unaffected mother. Generation two: an unaffected son and an affected daughter.',body,200))
# 7 X-linked recessive
body=text(14,34,'I','start',MUTED)+text(14,96,'II','start',MUTED)+text(14,158,'III','start',MUTED)
body+=male(110,30,True)+female(170,30,False)+mate(110,170,30)+sibs(140,30,92,[140])
body+=female(140,92,False)+male(200,92,False)+mate(140,200,92)+sibs(170,92,154,[110,170,230])
body+=male(110,154,True)+male(170,154,False)+female(230,154,False)
card('bb','1C-G02','1C.tetrad.sex-linked-characteristics','<div>Which mode of inheritance best fits this pedigree?</div>',
 'X-linked recessive. Only males are affected, and the trait passes from an affected grandfather through his unaffected daughter (a carrier) to one of her sons. Fathers don’t pass X-linked traits to sons.',
 svg('g1c02','Pedigree, three generations','Generation one: an affected father and an unaffected mother. Generation two: their unaffected daughter and her unaffected husband. Generation three: an affected son, an unaffected son and an unaffected daughter.',body,180)+'<p class="gkey">■ affected · □ male · ○ female</p>')

# 8 O2-Hb dissociation, right shift (Hill, n=2.7, P50 26.6 vs 34)
m=mapper(0,100,0,100)
hill=lambda p,p50: 100*p**2.7/(p50**2.7+p**2.7)
a1=[m(p,hill(p,26.6)) for p in range(0,101)]; a2=[m(p,hill(p,36)) for p in range(0,101)]
body=axes('P<tspan baseline-shift="sub" font-size="9">O2</tspan> (mm Hg)','% Hb saturation')+path(a1,INK)+path(a2,ROSE,'7 5')
lx,ly=L+120,B-40
body+=f'<line x1="{lx}" y1="{ly}" x2="{lx+22}" y2="{ly}" stroke="{INK}" stroke-width="2.2"/>'+text(lx+28,ly+4,'Normal','start',INK,11)
body+=f'<line x1="{lx}" y1="{ly+16}" x2="{lx+22}" y2="{ly+16}" stroke="{ROSE}" stroke-width="2.2" stroke-dasharray="7 5"/>'+text(lx+28,ly+20,'Shifted','start',INK,11)
card('bb','3B-G01','3B.oxygen-transport-by-blood.hemoglobin-hematocrit','<div>The dashed oxygen–hemoglobin dissociation curve is shifted to the right of the normal curve. Name conditions that cause this shift.</div>',
 'Higher CO<sub>2</sub>, higher H<sup>+</sup> (lower pH), higher temperature, or more 2,3-BPG. A right shift means lower O<sub>2</sub> affinity, so hemoglobin releases more O<sub>2</sub> to active tissues (the Bohr effect).',
 svg('g3b01','Oxygen–hemoglobin dissociation curves','Two S-shaped curves of hemoglobin saturation against oxygen partial pressure. The dashed curve lies to the right of the solid normal curve, reaching any given saturation at a higher oxygen pressure.',body))

# 9 energy diagram with catalyst
m=mapper(0,10,0,10)
def hump(peak):
    # flat reactants, one smooth peak, flat (lower) products: base steps down smoothly after the peak
    out=[]
    for i in range(0,201):
        x=i/20
        base=3+4/(1+math.exp((x-6.0)*2.2))
        bump=(peak-7)*math.exp(-((x-4.8)/1.05)**2)
        out.append(m(x,base+bump))
    return out
body=axes('Reaction progress','Energy')+path(hump(10.4),INK)+path(hump(8.4),ROSE,'7 5')
body+=text(*m(1,7.6),'Reactants','middle',INK,11)+text(*m(9,3.6),'Products','middle',INK,11)
lx,ly=L+150,T+10
body+=f'<line x1="{lx}" y1="{ly}" x2="{lx+22}" y2="{ly}" stroke="{INK}" stroke-width="2.2"/>'+text(lx+28,ly+4,'Uncatalyzed','start',INK,11)
body+=f'<line x1="{lx}" y1="{ly+16}" x2="{lx+22}" y2="{ly+16}" stroke="{ROSE}" stroke-width="2.2" stroke-dasharray="7 5"/>'+text(lx+28,ly+20,'Catalyzed','start',INK,11)
card('bb','1A-G04','1A.reduction-of-activation-energy','<div>This energy diagram shows the same reaction with and without a catalyst. What does the catalyst change, and what does it leave unchanged?</div>',
 'It lowers the activation energy (the height of the peak above the reactants), so the reaction goes faster. It doesn’t change ΔG (the energy difference between reactants and products) or the position of equilibrium.',
 svg('g1a04','Reaction energy diagram','Energy against reaction progress. Reactants start at a higher energy than products. The solid uncatalyzed curve has a tall peak; the dashed catalyzed curve has a lower peak; both start and end at the same energies.',body))

# 10 Yerkes-Dodson
m=mapper(0,10,0,10)
yd=[m(x/20, 1+8*math.exp(-((x/20-5)/2.2)**2)) for x in range(0,201)]
body=axes('Arousal','Performance')+path(yd,ROSE)
card('ps','7A-G01','7A.factors-that-influence-motivation.arousal','<div>This graph shows performance against arousal. What relationship does it illustrate?</div>',
 'The Yerkes–Dodson law: performance is best at a moderate level of arousal and falls off when arousal is too low or too high. For difficult tasks the peak comes at a lower level of arousal.',
 svg('g7a01','Performance against arousal','An inverted U: performance is low at low arousal, highest at moderate arousal, and low again at high arousal.',body))

# 11 normal distribution ±1 SD
m=mapper(-3.6,3.6,0,0.44)
nd=lambda x: math.exp(-x*x/2)/math.sqrt(2*math.pi)
area=[m(-1,0)]+[m(x/50,nd(x/50)) for x in range(-50,51)]+[m(1,0)]
d='M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in area)+' Z'
body=f'<path d="M{L} {B} H{R}" stroke="{INK}" stroke-width="1.6"/>'+f'<path d="{d}" fill="{ROSE}" fill-opacity=".35"/>'+path([m(x/50,nd(x/50)) for x in range(-180,181)],INK)
for k,lab in [(-2,'−2σ'),(-1,'−1σ'),(0,'μ'),(1,'+1σ'),(2,'+2σ')]:
    x,_=m(k,0); body+=line(x,B,x,B+5,INK,None,1.4)+text(x,B+18,lab,'middle',INK,11)
card('rs','S4-G01','S4.measures-of-central-tendency-and-dispersion','<div>In a normal distribution, about what percentage of values fall in the shaded region (within one standard deviation of the mean)?</div>',
 'About 68%. About 95% fall within two standard deviations and about 99.7% within three (the 68–95–99.7 rule).',
 svg('gs401','Normal distribution','A symmetric bell curve centered on the mean, with tick marks at one and two standard deviations either side. The region from minus one to plus one standard deviation is shaded.',body))

# 12 right-skewed distribution (gamma-like)
m=mapper(0,10,0,0.42)
g=lambda x: (x**1.6)*math.exp(-x/1.1)/ (1.1**2.6*math.gamma(2.6)) if x>0 else 0
pts=[m(x/20,g(x/20)) for x in range(0,201)]
body=f'<path d="M{L} {B} H{R}" stroke="{INK}" stroke-width="1.6"/>'+path(pts,ROSE)+text((L+R)/2,B+24,'Value','middle',INK,12)
card('rs','S4-G02','S4.measures-of-central-tendency-and-dispersion','<div>This distribution has a long tail to the right. How do its mean and median compare?</div>',
 'It is positively (right) skewed, so the mean is greater than the median: the few large values in the tail pull the mean toward them. (Mode &lt; median &lt; mean.)',
 svg('gs402','Skewed distribution','A distribution that rises steeply on the left to a peak and then trails off in a long tail to the right.',body))

# 13 scatter negative correlation (deterministic jitter)
m=mapper(0,10,0,10); import random; rnd=random.Random(4)
pts=[]
for i in range(26):
    x=0.6+i*0.35; y=9-0.75*x+rnd.uniform(-1.2,1.2); pts.append(m(x,max(0.5,min(9.6,y))))
body=axes('X','Y')+''.join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.6" fill="{ROSE}"/>' for x,y in pts)
card('rs','S4-G03','S4.correlation-versus-causation-drawing-inferences-from-results','<div>What does this scatterplot suggest about the relationship between X and Y?</div>',
 'A negative correlation (r between 0 and −1; fairly strong here): as X increases, Y tends to decrease. On its own, a correlation doesn’t show that X causes the change in Y.',
 svg('gs403','Scatterplot','Points that trend downward from upper left to lower right, with moderate scatter around the trend.',body))

out=[[c['sec'],c['q'],c['a'],c['id'],c['concept']] for c in cards]
open('graphic_cards.json','w').write(json.dumps(out,ensure_ascii=False))
meta=[{"card_id":c['id'],"mcat_section":{"bb":"BB","cp":"CP","ps":"PS","rs":"SIRS"}[c['sec']],"content_category":c['id'].split('-')[0],"primary_concept_id":c['concept'],
       "retrieval_format":["graphical_identification" if 'Pedigree' not in c['q'] else "diagram_interpretation"],"cognitive_skill":"application" if c['id'] in ('1C-G01','1C-G02','S4-G03','5A-G01') else "conceptual_understanding",
       "related_text_concept":"same concept as existing text cards; counts once toward concept evidence","content_version":"graphics-draft-1","review_status":"draft_pending_owner_review",
       "classified_by":"AI-authored draft; diagrams generated from equations; needs owner/content-expert review before publication"} for c in cards]
open('graphic_meta.json','w').write(json.dumps({"metadata_version":"graphics-draft-1","published":[],"cards":meta},indent=1,ensure_ascii=False))
print(len(cards),'cards')
