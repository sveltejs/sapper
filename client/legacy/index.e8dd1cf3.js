import{F as t,_ as e,a as n,b as a,c as r,i as s,d as o,S as c,s as f,f as i,r as u,t as l,g as h,w as v,p,v as d,x as m,h as q,l as g,z as y,A,E,n as S,o as F,L as w}from"./client.512ca113.js";import{_ as x}from"./asyncToGenerator.5229e80b.js";function Q(t){var e=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(t){return!1}}();return function(){var r,s=n(t);if(e){var o=n(this).constructor;r=Reflect.construct(s,arguments,o)}else r=s.apply(this,arguments);return a(this,r)}}function T(t,e,n){var a=t.slice();return a[1]=e[n],a}function R(t){var e,n,a,r,s,o,c,f,E,S,F,w,x,Q=t[1].metadata.question+"",T=t[1].answer+"";return{c:function(){e=i("article"),n=i("h2"),a=i("span"),s=u(),o=i("a"),c=l(" "),S=u(),F=l(Q),w=u(),x=i("p"),this.h()},l:function(t){e=h(t,"ARTICLE",{class:!0});var r=v(e);n=h(r,"H2",{class:!0});var f=v(n);a=h(f,"SPAN",{id:!0,class:!0}),v(a).forEach(p),s=d(f),o=h(f,"A",{class:!0,"sapper:prefetch":!0,href:!0,title:!0});var i=v(o);c=m(i," "),i.forEach(p),S=d(f),F=m(f,Q),f.forEach(p),w=d(r),x=h(r,"P",{class:!0}),v(x).forEach(p),r.forEach(p),this.h()},h:function(){q(a,"id",r=t[1].fragment),q(a,"class","offset-anchor"),q(o,"class","anchor"),q(o,"sapper:prefetch",""),q(o,"href",f="faq#"+t[1].fragment),q(o,"title",E=t[1].question),q(n,"class","svelte-1ty6sog"),q(x,"class","svelte-1ty6sog"),q(e,"class","faq svelte-1ty6sog")},m:function(t,r){g(t,e,r),y(e,n),y(n,a),y(n,s),y(n,o),y(o,c),y(n,S),y(n,F),y(e,w),y(e,x),x.innerHTML=T},p:function(t,e){1&e&&r!==(r=t[1].fragment)&&q(a,"id",r),1&e&&f!==(f="faq#"+t[1].fragment)&&q(o,"href",f),1&e&&E!==(E=t[1].question)&&q(o,"title",E),1&e&&Q!==(Q=t[1].metadata.question+"")&&A(F,Q),1&e&&T!==(T=t[1].answer+"")&&(x.innerHTML=T)},d:function(t){t&&p(e)}}}function k(t){for(var e,n,a,r,s,o,c,f,A,x,Q,k,M,b,D=t[0],H=[],L=0;L<D.length;L+=1)H[L]=R(T(t,D,L));return{c:function(){e=i("meta"),n=i("meta"),a=i("meta"),r=u(),s=i("div"),o=i("h1"),c=l("Frequently Asked Questions"),f=u();for(var t=0;t<H.length;t+=1)H[t].c();A=u(),x=i("p"),Q=l("See also the "),k=i("a"),M=l("Svelte FAQ"),b=l(" for questions relating to Svelte directly."),this.h()},l:function(t){var i=E('[data-svelte="svelte-192hl6q"]',document.head);e=h(i,"META",{name:!0,content:!0}),n=h(i,"META",{name:!0,content:!0}),a=h(i,"META",{name:!0,content:!0}),i.forEach(p),r=d(t),s=h(t,"DIV",{class:!0});var u=v(s);o=h(u,"H1",{});var l=v(o);c=m(l,"Frequently Asked Questions"),l.forEach(p),f=d(u);for(var q=0;q<H.length;q+=1)H[q].l(u);A=d(u),x=h(u,"P",{});var g=v(x);Q=m(g,"See also the "),k=h(g,"A",{href:!0,rel:!0});var y=v(k);M=m(y,"Svelte FAQ"),y.forEach(p),b=m(g," for questions relating to Svelte directly."),g.forEach(p),u.forEach(p),this.h()},h:function(){document.title="Frequently Asked Questions Sapper",q(e,"name","twitter:title"),q(e,"content","Sapper FAQ"),q(n,"name","twitter:description"),q(n,"content",j),q(a,"name","Description"),q(a,"content",j),q(k,"href","https://svelte.dev/faq"),q(k,"rel","external"),q(s,"class","faqs stretch svelte-1ty6sog")},m:function(t,i){y(document.head,e),y(document.head,n),y(document.head,a),g(t,r,i),g(t,s,i),y(s,o),y(o,c),y(s,f);for(var u=0;u<H.length;u+=1)H[u].m(s,null);y(s,A),y(s,x),y(x,Q),y(x,k),y(k,M),y(x,b)},p:function(t,e){var n=S(e,1)[0];if(1&n){var a;for(D=t[0],a=0;a<D.length;a+=1){var r=T(t,D,a);H[a]?H[a].p(r,n):(H[a]=R(r),H[a].c(),H[a].m(s,A))}for(;a<H.length;a+=1)H[a].d(1);H.length=D.length}},i:F,o:F,d:function(t){p(e),p(n),p(a),t&&p(r),t&&p(s),w(H,t)}}}function M(){return b.apply(this,arguments)}function b(){return(b=x(t.mark((function e(){var n;return t.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,this.fetch("faq.json").then((function(t){return t.json()}));case 2:return n=t.sent,t.abrupt("return",{faqs:n});case 4:case"end":return t.stop()}}),e,this)})))).apply(this,arguments)}var j="Frequently Asked Questions about Sapper";function D(t,e,n){var a=e.faqs;return t.$$set=function(t){"faqs"in t&&n(0,a=t.faqs)},[a]}var H=function(t){e(a,c);var n=Q(a);function a(t){var e;return r(this,a),e=n.call(this),s(o(e),t,D,k,f,{faqs:0}),e}return a}();export default H;export{M as preload};