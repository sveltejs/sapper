import{S as e,i as t,s,e as a,k as n,t as r,c as o,p as l,h as c,o as h,q as f,b as i,g as u,u as d,v as m,z as p,n as q,E as v}from"./client.368d57f3.js";function g(e,t,s){const a=e.slice();return a[1]=t[s],a}function E(e){let t,s,p,q,v,g,E,A,y,S,F,Q,T,k=e[1].metadata.question+"",w=e[1].answer+"";return{c(){t=a("article"),s=a("h2"),p=a("span"),v=n(),g=a("a"),E=r(" "),S=n(),F=r(k),Q=n(),T=a("p"),this.h()},l(e){t=o(e,"ARTICLE",{class:!0});var a=l(t);s=o(a,"H2",{class:!0});var n=l(s);p=o(n,"SPAN",{id:!0,class:!0}),l(p).forEach(c),v=h(n),g=o(n,"A",{class:!0,"sapper:prefetch":!0,href:!0,title:!0});var r=l(g);E=f(r," "),r.forEach(c),S=h(n),F=f(n,k),n.forEach(c),Q=h(a),T=o(a,"P",{class:!0}),l(T).forEach(c),a.forEach(c),this.h()},h(){i(p,"id",q=e[1].fragment),i(p,"class","offset-anchor"),i(g,"class","anchor"),i(g,"sapper:prefetch",""),i(g,"href",A="faq#"+e[1].fragment),i(g,"title",y=e[1].question),i(s,"class","svelte-1ty6sog"),i(T,"class","svelte-1ty6sog"),i(t,"class","faq svelte-1ty6sog")},m(e,a){u(e,t,a),d(t,s),d(s,p),d(s,v),d(s,g),d(g,E),d(s,S),d(s,F),d(t,Q),d(t,T),T.innerHTML=w},p(e,t){1&t&&q!==(q=e[1].fragment)&&i(p,"id",q),1&t&&A!==(A="faq#"+e[1].fragment)&&i(g,"href",A),1&t&&y!==(y=e[1].question)&&i(g,"title",y),1&t&&k!==(k=e[1].metadata.question+"")&&m(F,k),1&t&&w!==(w=e[1].answer+"")&&(T.innerHTML=w)},d(e){e&&c(t)}}}function A(e){let t,s,m,A,y,F,Q,T,k,w,M,x,H,j,L=e[0],P=[];for(let t=0;t<L.length;t+=1)P[t]=E(g(e,L,t));return{c(){t=a("meta"),s=a("meta"),m=a("meta"),A=n(),y=a("div"),F=a("h1"),Q=r("Frequently Asked Questions"),T=n();for(let e=0;e<P.length;e+=1)P[e].c();k=n(),w=a("p"),M=r("See also the "),x=a("a"),H=r("Svelte FAQ"),j=r(" for questions relating to Svelte directly."),this.h()},l(e){const a=p('[data-svelte="svelte-192hl6q"]',document.head);t=o(a,"META",{name:!0,content:!0}),s=o(a,"META",{name:!0,content:!0}),m=o(a,"META",{name:!0,content:!0}),a.forEach(c),A=h(e),y=o(e,"DIV",{class:!0});var n=l(y);F=o(n,"H1",{});var r=l(F);Q=f(r,"Frequently Asked Questions"),r.forEach(c),T=h(n);for(let e=0;e<P.length;e+=1)P[e].l(n);k=h(n),w=o(n,"P",{});var i=l(w);M=f(i,"See also the "),x=o(i,"A",{href:!0,rel:!0});var u=l(x);H=f(u,"Svelte FAQ"),u.forEach(c),j=f(i," for questions relating to Svelte directly."),i.forEach(c),n.forEach(c),this.h()},h(){document.title="Frequently Asked Questions Sapper",i(t,"name","twitter:title"),i(t,"content","Sapper FAQ"),i(s,"name","twitter:description"),i(s,"content",S),i(m,"name","Description"),i(m,"content",S),i(x,"href","https://svelte.dev/faq"),i(x,"rel","external"),i(y,"class","faqs stretch svelte-1ty6sog")},m(e,a){d(document.head,t),d(document.head,s),d(document.head,m),u(e,A,a),u(e,y,a),d(y,F),d(F,Q),d(y,T);for(let e=0;e<P.length;e+=1)P[e].m(y,null);d(y,k),d(y,w),d(w,M),d(w,x),d(x,H),d(w,j)},p(e,[t]){if(1&t){let s;for(L=e[0],s=0;s<L.length;s+=1){const a=g(e,L,s);P[s]?P[s].p(a,t):(P[s]=E(a),P[s].c(),P[s].m(y,k))}for(;s<P.length;s+=1)P[s].d(1);P.length=L.length}},i:q,o:q,d(e){c(t),c(s),c(m),e&&c(A),e&&c(y),v(P,e)}}}async function y(){return{faqs:await this.fetch("faq.json").then((e=>e.json()))}}const S="Frequently Asked Questions about Sapper";function F(e,t,s){let{faqs:a}=t;return e.$$set=e=>{"faqs"in e&&s(0,a=e.faqs)},[a]}export default class extends e{constructor(e){super(),t(this,e,F,A,s,{faqs:0})}}export{y as preload};