/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$2=globalThis,e$2=t$2.ShadowRoot&&(void 0===t$2.ShadyCSS||t$2.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s$2=Symbol(),o$4=new WeakMap;let n$3 = class n{constructor(t,e,o){if(this._$cssResult$=true,o!==s$2)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e;}get styleSheet(){let t=this.o;const s=this.t;if(e$2&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=o$4.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&o$4.set(s,t));}return t}toString(){return this.cssText}};const r$4=t=>new n$3("string"==typeof t?t:t+"",void 0,s$2),i$3=(t,...e)=>{const o=1===t.length?t[0]:e.reduce((e,s,o)=>e+(t=>{if(true===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[o+1],t[0]);return new n$3(o,t,s$2)},S$1=(s,o)=>{if(e$2)s.adoptedStyleSheets=o.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const e of o){const o=document.createElement("style"),n=t$2.litNonce;void 0!==n&&o.setAttribute("nonce",n),o.textContent=e.cssText,s.appendChild(o);}},c$2=e$2?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return r$4(e)})(t):t;

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:i$2,defineProperty:e$1,getOwnPropertyDescriptor:h$1,getOwnPropertyNames:r$3,getOwnPropertySymbols:o$3,getPrototypeOf:n$2}=Object,a$1=globalThis,c$1=a$1.trustedTypes,l$1=c$1?c$1.emptyScript:"",p$1=a$1.reactiveElementPolyfillSupport,d$1=(t,s)=>t,u$1={toAttribute(t,s){switch(s){case Boolean:t=t?l$1:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t);}return t},fromAttribute(t,s){let i=t;switch(s){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t);}catch(t){i=null;}}return i}},f$1=(t,s)=>!i$2(t,s),b$1={attribute:true,type:String,converter:u$1,reflect:false,useDefault:false,hasChanged:f$1};Symbol.metadata??=Symbol("metadata"),a$1.litPropertyMetadata??=new WeakMap;let y$1 = class y extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t);}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=b$1){if(s.state&&(s.attribute=false),this._$Ei(),this.prototype.hasOwnProperty(t)&&((s=Object.create(s)).wrapped=true),this.elementProperties.set(t,s),!s.noAccessor){const i=Symbol(),h=this.getPropertyDescriptor(t,i,s);void 0!==h&&e$1(this.prototype,t,h);}}static getPropertyDescriptor(t,s,i){const{get:e,set:r}=h$1(this.prototype,t)??{get(){return this[s]},set(t){this[s]=t;}};return {get:e,set(s){const h=e?.call(this);r?.call(this,s),this.requestUpdate(t,h,i);},configurable:true,enumerable:true}}static getPropertyOptions(t){return this.elementProperties.get(t)??b$1}static _$Ei(){if(this.hasOwnProperty(d$1("elementProperties")))return;const t=n$2(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties);}static finalize(){if(this.hasOwnProperty(d$1("finalized")))return;if(this.finalized=true,this._$Ei(),this.hasOwnProperty(d$1("properties"))){const t=this.properties,s=[...r$3(t),...o$3(t)];for(const i of s)this.createProperty(i,t[i]);}const t=this[Symbol.metadata];if(null!==t){const s=litPropertyMetadata.get(t);if(void 0!==s)for(const[t,i]of s)this.elementProperties.set(t,i);}this._$Eh=new Map;for(const[t,s]of this.elementProperties){const i=this._$Eu(t,s);void 0!==i&&this._$Eh.set(i,t);}this.elementStyles=this.finalizeStyles(this.styles);}static finalizeStyles(s){const i=[];if(Array.isArray(s)){const e=new Set(s.flat(1/0).reverse());for(const s of e)i.unshift(c$2(s));}else void 0!==s&&i.push(c$2(s));return i}static _$Eu(t,s){const i=s.attribute;return  false===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=false,this.hasUpdated=false,this._$Em=null,this._$Ev();}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this));}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.();}removeController(t){this._$EO?.delete(t);}_$E_(){const t=new Map,s=this.constructor.elementProperties;for(const i of s.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t);}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return S$1(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(true),this._$EO?.forEach(t=>t.hostConnected?.());}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.());}attributeChangedCallback(t,s,i){this._$AK(t,i);}_$ET(t,s){const i=this.constructor.elementProperties.get(t),e=this.constructor._$Eu(t,i);if(void 0!==e&&true===i.reflect){const h=(void 0!==i.converter?.toAttribute?i.converter:u$1).toAttribute(s,i.type);this._$Em=t,null==h?this.removeAttribute(e):this.setAttribute(e,h),this._$Em=null;}}_$AK(t,s){const i=this.constructor,e=i._$Eh.get(t);if(void 0!==e&&this._$Em!==e){const t=i.getPropertyOptions(e),h="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:u$1;this._$Em=e;const r=h.fromAttribute(s,t.type);this[e]=r??this._$Ej?.get(e)??r,this._$Em=null;}}requestUpdate(t,s,i,e=false,h){if(void 0!==t){const r=this.constructor;if(false===e&&(h=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??f$1)(h,s)||i.useDefault&&i.reflect&&h===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,s,i);} false===this.isUpdatePending&&(this._$ES=this._$EP());}C(t,s,{useDefault:i,reflect:e,wrapped:h},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??s??this[t]),true!==h||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(s=void 0),this._$AL.set(t,s)),true===e&&this._$Em!==t&&(this._$Eq??=new Set).add(t));}async _$EP(){this.isUpdatePending=true;try{await this._$ES;}catch(t){Promise.reject(t);}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,s]of this._$Ep)this[t]=s;this._$Ep=void 0;}const t=this.constructor.elementProperties;if(t.size>0)for(const[s,i]of t){const{wrapped:t}=i,e=this[s];true!==t||this._$AL.has(s)||void 0===e||this.C(s,void 0,i,e);}}let t=false;const s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(s)):this._$EM();}catch(s){throw t=false,this._$EM(),s}t&&this._$AE(s);}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=true,this.firstUpdated(t)),this.updated(t);}_$EM(){this._$AL=new Map,this.isUpdatePending=false;}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return  true}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM();}updated(t){}firstUpdated(t){}};y$1.elementStyles=[],y$1.shadowRootOptions={mode:"open"},y$1[d$1("elementProperties")]=new Map,y$1[d$1("finalized")]=new Map,p$1?.({ReactiveElement:y$1}),(a$1.reactiveElementVersions??=[]).push("2.1.2");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$1=globalThis,i$1=t=>t,s$1=t$1.trustedTypes,e=s$1?s$1.createPolicy("lit-html",{createHTML:t=>t}):void 0,h="$lit$",o$2=`lit$${Math.random().toFixed(9).slice(2)}$`,n$1="?"+o$2,r$2=`<${n$1}>`,l=document,c=()=>l.createComment(""),a=t=>null===t||"object"!=typeof t&&"function"!=typeof t,u=Array.isArray,d=t=>u(t)||"function"==typeof t?.[Symbol.iterator],f="[ \t\n\f\r]",v=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,_=/-->/g,m=/>/g,p=RegExp(`>|${f}(?:([^\\s"'>=/]+)(${f}*=${f}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),g=/'/g,$=/"/g,y=/^(?:script|style|textarea|title)$/i,x=t=>(i,...s)=>({_$litType$:t,strings:i,values:s}),b=x(1),E=Symbol.for("lit-noChange"),A=Symbol.for("lit-nothing"),C=new WeakMap,P=l.createTreeWalker(l,129);function V(t,i){if(!u(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==e?e.createHTML(i):i}const N=(t,i)=>{const s=t.length-1,e=[];let n,l=2===i?"<svg>":3===i?"<math>":"",c=v;for(let i=0;i<s;i++){const s=t[i];let a,u,d=-1,f=0;for(;f<s.length&&(c.lastIndex=f,u=c.exec(s),null!==u);)f=c.lastIndex,c===v?"!--"===u[1]?c=_:void 0!==u[1]?c=m:void 0!==u[2]?(y.test(u[2])&&(n=RegExp("</"+u[2],"g")),c=p):void 0!==u[3]&&(c=p):c===p?">"===u[0]?(c=n??v,d=-1):void 0===u[1]?d=-2:(d=c.lastIndex-u[2].length,a=u[1],c=void 0===u[3]?p:'"'===u[3]?$:g):c===$||c===g?c=p:c===_||c===m?c=v:(c=p,n=void 0);const x=c===p&&t[i+1].startsWith("/>")?" ":"";l+=c===v?s+r$2:d>=0?(e.push(a),s.slice(0,d)+h+s.slice(d)+o$2+x):s+o$2+(-2===d?i:x);}return [V(t,l+(t[s]||"<?>")+(2===i?"</svg>":3===i?"</math>":"")),e]};class S{constructor({strings:t,_$litType$:i},e){let r;this.parts=[];let l=0,a=0;const u=t.length-1,d=this.parts,[f,v]=N(t,i);if(this.el=S.createElement(f,e),P.currentNode=this.el.content,2===i||3===i){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes);}for(;null!==(r=P.nextNode())&&d.length<u;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(h)){const i=v[a++],s=r.getAttribute(t).split(o$2),e=/([.?@])?(.*)/.exec(i);d.push({type:1,index:l,name:e[2],strings:s,ctor:"."===e[1]?I:"?"===e[1]?L:"@"===e[1]?z:H}),r.removeAttribute(t);}else t.startsWith(o$2)&&(d.push({type:6,index:l}),r.removeAttribute(t));if(y.test(r.tagName)){const t=r.textContent.split(o$2),i=t.length-1;if(i>0){r.textContent=s$1?s$1.emptyScript:"";for(let s=0;s<i;s++)r.append(t[s],c()),P.nextNode(),d.push({type:2,index:++l});r.append(t[i],c());}}}else if(8===r.nodeType)if(r.data===n$1)d.push({type:2,index:l});else {let t=-1;for(;-1!==(t=r.data.indexOf(o$2,t+1));)d.push({type:7,index:l}),t+=o$2.length-1;}l++;}}static createElement(t,i){const s=l.createElement("template");return s.innerHTML=t,s}}function M(t,i,s=t,e){if(i===E)return i;let h=void 0!==e?s._$Co?.[e]:s._$Cl;const o=a(i)?void 0:i._$litDirective$;return h?.constructor!==o&&(h?._$AO?.(false),void 0===o?h=void 0:(h=new o(t),h._$AT(t,s,e)),void 0!==e?(s._$Co??=[])[e]=h:s._$Cl=h),void 0!==h&&(i=M(t,h._$AS(t,i.values),h,e)),i}class R{constructor(t,i){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=i;}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:i},parts:s}=this._$AD,e=(t?.creationScope??l).importNode(i,true);P.currentNode=e;let h=P.nextNode(),o=0,n=0,r=s[0];for(;void 0!==r;){if(o===r.index){let i;2===r.type?i=new k(h,h.nextSibling,this,t):1===r.type?i=new r.ctor(h,r.name,r.strings,this,t):6===r.type&&(i=new Z(h,this,t)),this._$AV.push(i),r=s[++n];}o!==r?.index&&(h=P.nextNode(),o++);}return P.currentNode=l,e}p(t){let i=0;for(const s of this._$AV) void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++;}}class k{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,i,s,e){this.type=2,this._$AH=A,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=e,this._$Cv=e?.isConnected??true;}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===t?.nodeType&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=M(this,t,i),a(t)?t===A||null==t||""===t?(this._$AH!==A&&this._$AR(),this._$AH=A):t!==this._$AH&&t!==E&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):d(t)?this.k(t):this._(t);}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t));}_(t){this._$AH!==A&&a(this._$AH)?this._$AA.nextSibling.data=t:this.T(l.createTextNode(t)),this._$AH=t;}$(t){const{values:i,_$litType$:s}=t,e="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=S.createElement(V(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===e)this._$AH.p(i);else {const t=new R(e,this),s=t.u(this.options);t.p(i),this.T(s),this._$AH=t;}}_$AC(t){let i=C.get(t.strings);return void 0===i&&C.set(t.strings,i=new S(t)),i}k(t){u(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,e=0;for(const h of t)e===i.length?i.push(s=new k(this.O(c()),this.O(c()),this,this.options)):s=i[e],s._$AI(h),e++;e<i.length&&(this._$AR(s&&s._$AB.nextSibling,e),i.length=e);}_$AR(t=this._$AA.nextSibling,s){for(this._$AP?.(false,true,s);t!==this._$AB;){const s=i$1(t).nextSibling;i$1(t).remove(),t=s;}}setConnected(t){ void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t));}}class H{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,i,s,e,h){this.type=1,this._$AH=A,this._$AN=void 0,this.element=t,this.name=i,this._$AM=e,this.options=h,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=A;}_$AI(t,i=this,s,e){const h=this.strings;let o=false;if(void 0===h)t=M(this,t,i,0),o=!a(t)||t!==this._$AH&&t!==E,o&&(this._$AH=t);else {const e=t;let n,r;for(t=h[0],n=0;n<h.length-1;n++)r=M(this,e[s+n],i,n),r===E&&(r=this._$AH[n]),o||=!a(r)||r!==this._$AH[n],r===A?t=A:t!==A&&(t+=(r??"")+h[n+1]),this._$AH[n]=r;}o&&!e&&this.j(t);}j(t){t===A?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"");}}class I extends H{constructor(){super(...arguments),this.type=3;}j(t){this.element[this.name]=t===A?void 0:t;}}class L extends H{constructor(){super(...arguments),this.type=4;}j(t){this.element.toggleAttribute(this.name,!!t&&t!==A);}}class z extends H{constructor(t,i,s,e,h){super(t,i,s,e,h),this.type=5;}_$AI(t,i=this){if((t=M(this,t,i,0)??A)===E)return;const s=this._$AH,e=t===A&&s!==A||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,h=t!==A&&(s===A||e);e&&this.element.removeEventListener(this.name,this,s),h&&this.element.addEventListener(this.name,this,t),this._$AH=t;}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t);}}class Z{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s;}get _$AU(){return this._$AM._$AU}_$AI(t){M(this,t);}}const B=t$1.litHtmlPolyfillSupport;B?.(S,k),(t$1.litHtmlVersions??=[]).push("3.3.3");const D=(t,i,s)=>{const e=s?.renderBefore??i;let h=e._$litPart$;if(void 0===h){const t=s?.renderBefore??null;e._$litPart$=h=new k(i.insertBefore(c(),t),t,void 0,s??{});}return h._$AI(t),h};

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const s=globalThis;class i extends y$1{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0;}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const r=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=D(r,this.renderRoot,this.renderOptions);}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(true);}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(false);}render(){return E}}i._$litElement$=true,i["finalized"]=true,s.litElementHydrateSupport?.({LitElement:i});const o$1=s.litElementPolyfillSupport;o$1?.({LitElement:i});(s.litElementVersions??=[]).push("4.2.2");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=t=>(e,o)=>{ void 0!==o?o.addInitializer(()=>{customElements.define(t,e);}):customElements.define(t,e);};

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const o={attribute:true,type:String,converter:u$1,reflect:false,hasChanged:f$1},r$1=(t=o,e,r)=>{const{kind:n,metadata:i}=r;let s=globalThis.litPropertyMetadata.get(i);if(void 0===s&&globalThis.litPropertyMetadata.set(i,s=new Map),"setter"===n&&((t=Object.create(t)).wrapped=true),s.set(r.name,t),"accessor"===n){const{name:o}=r;return {set(r){const n=e.get.call(this);e.set.call(this,r),this.requestUpdate(o,n,t,true,r);},init(e){return void 0!==e&&this.C(o,void 0,t,e),e}}}if("setter"===n){const{name:o}=r;return function(r){const n=this[o];e.call(this,r),this.requestUpdate(o,n,t,true,r);}}throw Error("Unsupported decorator location: "+n)};function n(t){return (e,o)=>"object"==typeof o?r$1(t,e,o):((t,e,o)=>{const r=e.hasOwnProperty(o);return e.constructor.createProperty(o,t),r?Object.getOwnPropertyDescriptor(e,o):void 0})(t,e,o)}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function r(r){return n({...r,state:true,attribute:false})}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Vendored from widget-canvas-ha src/editor/ha-loader.ts +
 * src/util/actions.ts loadHelpers (verbatim).
 *
 * HA lazy-loads its editor components (ha-form, selectors,
 * ha-yaml-editor) with the editor dialogs. Custom cards can force that
 * chunk in by instantiating a built-in card's config editor — the
 * standard boilerplate-card trick. Failed attempts are NOT cached so a
 * slow chunk load can retry.
 */
let helpersPromise = null;
function loadHelpers() {
    if (!helpersPromise) {
        helpersPromise = window.loadCardHelpers
            ? window.loadCardHelpers()
            : Promise.resolve(null);
    }
    return helpersPromise;
}
let formPromise = null;
function ensureHaForm() {
    if (customElements.get("ha-form"))
        return Promise.resolve(true);
    if (!formPromise) {
        formPromise = (async () => {
            try {
                const helpers = await loadHelpers();
                const card = helpers?.createCardElement?.({ type: "entities", entities: [] });
                await card?.constructor?.getConfigElement?.();
            }
            catch {
                /* best effort */
            }
            // whenDefined never rejects — race it against a timeout
            const defined = await Promise.race([
                customElements.whenDefined("ha-form").then(() => true),
                new Promise((r) => setTimeout(() => r(false), 2000)),
            ]);
            const ok = defined && !!customElements.get("ha-form");
            if (!ok)
                formPromise = null; // retry on next call
            return ok;
        })();
    }
    return formPromise;
}
let yamlPromise = null;
/**
 * ha-yaml-editor parses YAML internally and fires value-changed with
 * {value, isValid}. Not guaranteed loadable outside the editor dialogs;
 * callers must handle false (fall back to a textarea).
 */
function ensureYamlEditor() {
    if (customElements.get("ha-yaml-editor"))
        return Promise.resolve(true);
    if (!yamlPromise) {
        yamlPromise = (async () => {
            try {
                const helpers = await loadHelpers();
                // conditional-card editor pulls hui-card-element-editor → ha-yaml-editor
                const card = helpers?.createCardElement?.({
                    type: "conditional",
                    conditions: [],
                    card: { type: "entities", entities: [] },
                });
                await card?.constructor?.getConfigElement?.();
            }
            catch {
                /* best effort */
            }
            if (customElements.get("ha-yaml-editor"))
                return true;
            await new Promise((r) => setTimeout(r, 300));
            const ok = !!customElements.get("ha-yaml-editor");
            if (!ok)
                yamlPromise = null; // retry on next call
            return ok;
        })();
    }
    return yamlPromise;
}

const DISPLAY_MODES = [
    { value: "assisted", label: "Assisted — press a button, pick the event" },
    { value: "replica", label: "Replica — tap / double-tap / hold like the physical remote" },
    { value: "all", label: "All visible — every event of every button" },
];
const LAYOUT_KINDS = [
    { value: "grid", label: "Grid — buttons arranged like the remote" },
    { value: "canvas", label: "Canvas — free-drag tiles (legacy)" },
];
const ASSISTED_TRIGGERS = [
    { value: "auto", label: "Auto — slide with a finger, tap with a mouse" },
    { value: "tap", label: "Tap opens, tap again closes; tap an option" },
    { value: "press", label: "Long-press opens; slide to an option and lift" },
];
const CHIPS_LAYOUTS = [
    { value: "vertical", label: "Vertical list" },
    { value: "horizontal", label: "Wrapped row — chips flow like tags" },
    { value: "compact", label: "Compact icons — one row, name on hover / long-press" },
    { value: "spines", label: "Spines — one row, names rotated 90°" },
    { value: "grid", label: "Two-column grid" },
];
function displayOf(config) {
    // "normal" was the pre-release name of replica — keep old dashboards working
    const raw = config?.display;
    const value = raw === "normal" ? "replica" : raw;
    return DISPLAY_MODES.some((m) => m.value === value) ? value : "assisted";
}
function layoutOf(config) {
    return config?.layout === "canvas" ? "canvas" : "grid";
}
function assistedTriggerOf(config) {
    const value = config?.assisted_trigger;
    return value === "press" || value === "tap" ? value : "auto";
}
function chipsLayoutOf(config) {
    const value = config?.chips_layout;
    return CHIPS_LAYOUTS.some((c) => c.value === value) ? value : "vertical";
}
/** "#rrggbb" → [r, g, b] for HA's color_rgb selector; anything else → undefined. */
function hexToRgb(value) {
    if (typeof value !== "string")
        return undefined;
    const m = /^#([0-9a-f]{6})$/i.exec(value.trim());
    if (!m)
        return undefined;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(rgb) {
    if (!Array.isArray(rgb) || rgb.length !== 3)
        return undefined;
    const hex = rgb.map((c) => Math.max(0, Math.min(255, Number(c) | 0)).toString(16).padStart(2, "0"));
    return `#${hex.join("")}`;
}
/** Editor sentinel for "no entry_id — use the only remote". */
const AUTO_REMOTE = "__auto__";
const COLOR_KEYS = ["button_color", "accent_color", "text_color"];
const DEFAULT_PICKER_COLOR = "#3f51b5";
/** What the editor form shows for a config (defaults filled in). */
function editorValue(config) {
    return {
        entry_id: config.entry_id || AUTO_REMOTE,
        title: config.title ?? "",
        show_title: config.show_title !== false,
        layout: layoutOf(config),
        display: displayOf(config),
        assisted_trigger: assistedTriggerOf(config),
        chips_layout: chipsLayoutOf(config),
        button_color_set: !!config.button_color,
        accent_color_set: !!config.accent_color,
        text_color_set: !!config.text_color,
        button_color: hexToRgb(config.button_color) ?? [63, 81, 181],
        accent_color: hexToRgb(config.accent_color) ?? [63, 81, 181],
        text_color: hexToRgb(config.text_color) ?? [255, 255, 255],
        button_opacity: config.button_opacity ?? 1,
    };
}
/**
 * Fold an ha-form value back into the card config: defaults are dropped
 * (so YAML stays minimal), strings are trimmed, keys the editor doesn't
 * own (HA's grid_options, visibility, …) are preserved untouched.
 */
function applyEditorValue(config, value) {
    const next = { ...config, type: config.type };
    const set = (key, v, isDefault) => {
        if (v === undefined || v === "" || isDefault)
            delete next[key];
        else
            next[key] = v;
    };
    set("entry_id", value.entry_id, value.entry_id === AUTO_REMOTE);
    // Not trimmed while typing (a trailing space would vanish under the
    // cursor); whitespace-only counts as empty.
    set("title", value.title, typeof value.title === "string" && !value.title.trim());
    set("show_title", value.show_title, value.show_title !== false);
    set("layout", value.layout, value.layout !== "canvas");
    set("display", value.display, value.display === "assisted");
    set("assisted_trigger", value.assisted_trigger, value.assisted_trigger === "auto");
    set("chips_layout", value.chips_layout, value.chips_layout === "vertical");
    for (const key of COLOR_KEYS) {
        if (!value[`${key}_set`]) {
            delete next[key];
            continue;
        }
        const picked = rgbToHex(value[key]);
        const existing = typeof next[key] === "string" ? next[key] : undefined;
        // A YAML-only value (theme var, rgba()) can't be shown by the picker,
        // which then holds the seed default — an untouched picker must not
        // overwrite it. Switch just turned on: seed so the field shows.
        if (existing && !hexToRgb(existing) && (!picked || picked === DEFAULT_PICKER_COLOR)) {
            continue;
        }
        next[key] = picked ?? existing ?? DEFAULT_PICKER_COLOR;
    }
    const opacity = value.button_opacity;
    set("button_opacity", opacity, typeof opacity !== "number" || opacity >= 1);
    return next;
}
/**
 * Trim free-text fields; empty ones are dropped. Run when a field loses
 * focus (typing keeps spaces, see applyEditorValue). Returns the same
 * object when nothing changes so callers can skip re-emitting.
 */
function trimConfigStrings(config) {
    let changed = false;
    const next = { ...config };
    for (const key of ["title", ...COLOR_KEYS]) {
        const v = next[key];
        if (typeof v !== "string")
            continue;
        const trimmed = v.trim();
        if (trimmed === v)
            continue;
        changed = true;
        if (trimmed)
            next[key] = trimmed;
        else
            delete next[key];
    }
    return changed ? next : config;
}
/**
 * Inline CSS custom properties for the grid element. Unset values fall
 * through to theme variables (--remote-mapper-*) and then HA defaults.
 */
function styleVarsOf(config) {
    const vars = [];
    const color = (name, value) => {
        if (typeof value === "string" && value.trim())
            vars.push(`${name}:${value.trim()}`);
    };
    color("--rm-button-bg", config?.button_color);
    color("--rm-accent", config?.accent_color);
    color("--rm-text", config?.text_color);
    const opacity = config?.button_opacity;
    if (typeof opacity === "number" && opacity > 0 && opacity < 1) {
        vars.push(`--rm-opacity:${opacity}`);
    }
    return vars.join(";");
}

const LABELS = {
    entry_id: "Remote",
    title: "Title",
    show_title: "Show title",
    layout: "Layout",
    display: "Display mode",
    assisted_trigger: "Popover opens on",
    chips_layout: "Event chips",
    button_color: "Button color",
    accent_color: "Accent color",
    text_color: "Text color",
    button_opacity: "Button opacity",
};
const HELPERS = {
    title: "Empty = the remote's name.",
    button_color: "Pad background. Turn the switch off to use the theme.",
    accent_color: "Borders, assigned marks, flashes. Off = theme primary color.",
    text_color: "Off = theme text color.",
    button_opacity: "Pad background only; text stays readable.",
};
const dropdown = (options) => ({ select: { mode: "dropdown", options } });
let RemoteMapperCardEditor = class RemoteMapperCardEditor extends i {
    constructor() {
        super(...arguments);
        this._formOk = false;
        this._fetching = false;
        this._changed = (e) => {
            e.stopPropagation();
            this._emit(applyEditorValue(this._config, e.detail.value));
        };
        /** Leaving a text field (or clicking Save, which blurs it) trims it. */
        this._trimOnBlur = () => {
            const next = trimConfigStrings(this._config);
            if (next !== this._config)
                this._emit(next);
        };
    }
    setConfig(config) {
        this._config = config;
    }
    connectedCallback() {
        super.connectedCallback();
        void ensureHaForm().then((ok) => {
            this._formOk = ok;
        });
    }
    willUpdate() {
        if (this.hass && !this._remotes && !this._fetching) {
            this._fetching = true;
            void this.hass
                .callWS({ type: "remote_mapper/list_remotes" })
                .then((res) => {
                this._remotes = res.remotes;
            })
                .catch(() => {
                this._remotes = [];
            });
        }
    }
    render() {
        const config = this._config;
        if (!config)
            return A;
        if (!this._formOk) {
            return b `<p class="hint">Loading editor components…</p>`;
        }
        const display = displayOf(config);
        const schema = [
            {
                name: "entry_id",
                selector: dropdown([
                    { value: AUTO_REMOTE, label: "Auto (the only remote)" },
                    ...(this._remotes ?? []).map((r) => ({ value: r.entry_id, label: r.title })),
                ]),
            },
            { name: "title", selector: { text: {} } },
            { name: "show_title", selector: { boolean: {} } },
            { name: "layout", selector: dropdown(LAYOUT_KINDS) },
            { name: "display", selector: dropdown(DISPLAY_MODES) },
        ];
        if (display === "assisted") {
            schema.push({ name: "assisted_trigger", selector: dropdown(ASSISTED_TRIGGERS) });
        }
        if (display === "all") {
            schema.push({ name: "chips_layout", selector: dropdown(CHIPS_LAYOUTS) });
        }
        // Native color picker (HA color_rgb selector) behind an on/off switch so
        // "use the theme" stays expressible; YAML may still hold any CSS color.
        for (const key of COLOR_KEYS) {
            schema.push({ name: `${key}_set`, selector: { boolean: {} } });
            if (config[key])
                schema.push({ name: key, selector: { color_rgb: {} } });
        }
        schema.push({
            name: "button_opacity",
            selector: { number: { min: 0.1, max: 1, step: 0.05, mode: "slider" } },
        });
        const data = editorValue(config);
        return b `
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${schema}
        .computeLabel=${(s) => s.name.endsWith("_set")
            ? `Custom ${LABELS[s.name.slice(0, -4)].toLowerCase()}`
            : (LABELS[s.name] ?? s.name)}
        .computeHelper=${(s) => s.name === "display" && layoutOf(config) === "canvas"
            ? "Ignored for the canvas layout (every tile is already visible)."
            : (HELPERS[s.name] ?? "")}
        @value-changed=${this._changed}
        @focusout=${this._trimOnBlur}
      ></ha-form>
    `;
    }
    _emit(next) {
        this._config = next;
        this.dispatchEvent(new CustomEvent("config-changed", {
            detail: { config: next },
            bubbles: true,
            composed: true,
        }));
    }
};
RemoteMapperCardEditor.styles = i$3 `
    .hint {
      font-size: var(--ha-font-size-m, 14px);
      color: var(--secondary-text-color);
    }
  `;
__decorate([
    n({ attribute: false })
], RemoteMapperCardEditor.prototype, "hass", void 0);
__decorate([
    r()
], RemoteMapperCardEditor.prototype, "_config", void 0);
__decorate([
    r()
], RemoteMapperCardEditor.prototype, "_remotes", void 0);
__decorate([
    r()
], RemoteMapperCardEditor.prototype, "_formOk", void 0);
RemoteMapperCardEditor = __decorate([
    t("remote-mapper-card-editor")
], RemoteMapperCardEditor);

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Grid model — server-derived buttons × stored cell positions.
 *
 * Pure functions only; the card and the grid element own the state. The
 * stored layout carries positions + optional label overrides, nothing
 * else (plan 04 §1.2): the button ↔ action grouping is always derived
 * server-side, so newly discovered actions land on the right button
 * without a layout change.
 */
const GRID_SCHEMA_VERSION = 1;
/** Mirrors GRID_MAX in websocket.py. */
const GRID_MAX = 12;
const KIND_ICON = {
    single: "1",
    double: "2",
    triple: "3",
    hold: "⧗",
    release: "↥",
    other: "•",
};
const KIND_TITLE = {
    single: "single press",
    double: "double press",
    triple: "triple press",
    hold: "hold",
    release: "release",
    other: "other",
};
const key = (row, col) => `${row},${col}`;
/** Default shape for N buttons: 2 columns up to 6 (2×2, 2×3), √N beyond. */
function autoDims(n) {
    if (n <= 1)
        return { rows: 1, cols: 1 };
    const cols = n <= 6 ? 2 : Math.min(GRID_MAX, Math.ceil(Math.sqrt(n)));
    return { rows: Math.ceil(n / cols), cols };
}
/**
 * Stored layout (possibly absent, stale or out of range) + the current
 * button list → a complete layout: every button placed exactly once,
 * inside rows×cols. Unplaced buttons fill free cells in reading order,
 * growing rows when the grid is full. Label overrides survive re-flow.
 */
function normalizeGrid(stored, buttons) {
    const dims = stored && stored.rows > 0 && stored.cols > 0
        ? { rows: stored.rows, cols: stored.cols }
        : autoDims(buttons.length);
    const cols = Math.min(GRID_MAX, dims.cols);
    let rows = Math.min(GRID_MAX, dims.rows);
    const out = {};
    const taken = new Set();
    const unplaced = [];
    for (const b of buttons) {
        const pos = stored?.buttons?.[b.id];
        const label = pos?.label?.trim() ? { label: pos.label.trim() } : {};
        const inRange = pos &&
            Number.isInteger(pos.row) &&
            Number.isInteger(pos.col) &&
            pos.row >= 0 &&
            pos.col >= 0 &&
            pos.row < rows &&
            pos.col < cols;
        if (inRange && !taken.has(key(pos.row, pos.col))) {
            out[b.id] = { row: pos.row, col: pos.col, ...label };
            taken.add(key(pos.row, pos.col));
        }
        else {
            unplaced.push({ id: b.id, ...label });
        }
    }
    let cursor = 0;
    for (const b of unplaced) {
        for (;;) {
            const row = Math.floor(cursor / cols);
            const col = cursor % cols;
            cursor++;
            if (row >= rows)
                rows = row + 1;
            if (!taken.has(key(row, col))) {
                out[b.id] = { row, col, ...(b.label ? { label: b.label } : {}) };
                taken.add(key(row, col));
                break;
            }
        }
    }
    return { schema_version: GRID_SCHEMA_VERSION, rows, cols, buttons: out };
}
/** Change the shape; in-range buttons stay put, the rest re-flow. */
function resizeGrid(layout, rows, cols, buttons) {
    return normalizeGrid({ ...layout, rows, cols }, buttons);
}
/** "row,col" → button id. */
function cellMap(layout) {
    const map = new Map();
    for (const [id, pos] of Object.entries(layout.buttons)) {
        map.set(key(pos.row, pos.col), id);
    }
    return map;
}
/** Move the button at `from` to `to`, swapping with any occupant. */
function swapCells(layout, from, to) {
    if (from.row === to.row && from.col === to.col)
        return layout;
    const map = cellMap(layout);
    const a = map.get(key(from.row, from.col));
    if (!a)
        return layout;
    const b = map.get(key(to.row, to.col));
    const buttons = { ...layout.buttons };
    buttons[a] = { ...buttons[a], row: to.row, col: to.col };
    if (b)
        buttons[b] = { ...buttons[b], row: from.row, col: from.col };
    return { ...layout, buttons };
}
function setButtonLabel(layout, id, label) {
    const pos = layout.buttons[id];
    if (!pos)
        return layout;
    const { label: _old, ...rest } = pos;
    // kept as typed while editing (trailing space must survive the cursor);
    // trimLabels() runs before save
    return {
        ...layout,
        buttons: {
            ...layout.buttons,
            [id]: label.trim() ? { ...rest, label } : rest,
        },
    };
}
/** Trim label overrides (before persisting). */
function trimLabels(layout) {
    const buttons = {};
    for (const [id, pos] of Object.entries(layout.buttons)) {
        const { label, ...rest } = pos;
        const trimmed = label?.trim();
        buttons[id] = trimmed ? { ...rest, label: trimmed } : rest;
    }
    return { ...layout, buttons };
}
function buttonLabel(button, layout) {
    return layout.buttons[button.id]?.label || button.label;
}
/** First action of a kind, in the server's canonical order. */
function actionOfKind(button, kind) {
    return button.actions.find((a) => a.kind === kind);
}

const BASE_VISIBLE = 5;
let RemoteMapperGridPicker = class RemoteMapperGridPicker extends i {
    constructor() {
        super(...arguments);
        /** Current shape — highlighted when nothing is hovered. */
        this.rows = 1;
        this.cols = 1;
        /** Button count: picking fewer cells is allowed, the card grows rows. */
        this.minCells = 1;
    }
    render() {
        const sel = this._hover ?? { r: this.rows - 1, c: this.cols - 1 };
        const visRows = Math.min(GRID_MAX, Math.max(BASE_VISIBLE, sel.r + 2, this.rows + 1));
        const visCols = Math.min(GRID_MAX, Math.max(BASE_VISIBLE, sel.c + 2, this.cols + 1));
        const cells = [];
        for (let r = 0; r < visRows; r++) {
            for (let c = 0; c < visCols; c++) {
                cells.push(b `
          <div
            class="cell ${r <= sel.r && c <= sel.c ? "on" : ""}"
            @pointerenter=${() => {
                    this._hover = { r, c };
                }}
            @pointerdown=${() => {
                    this._hover = { r, c };
                }}
            @click=${() => this._pick(r + 1, c + 1)}
          ></div>
        `);
            }
        }
        const picked = (sel.r + 1) * (sel.c + 1);
        return b `
      <div
        class="matrix"
        style="grid-template-columns: repeat(${visCols}, var(--ha-space-7, 28px))"
        @pointerleave=${() => {
            this._hover = undefined;
        }}
      >
        ${cells}
      </div>
      <div class="caption">
        ${sel.r + 1} rows × ${sel.c + 1} cols
        ${picked < this.minCells
            ? b `<span class="warn">· grows to fit ${this.minCells} buttons</span>`
            : ""}
      </div>
    `;
    }
    _pick(rows, cols) {
        this._hover = undefined;
        this.dispatchEvent(new CustomEvent("grid-picked", {
            detail: { rows, cols },
            bubbles: true,
            composed: true,
        }));
    }
};
RemoteMapperGridPicker.styles = i$3 `
    :host {
      display: block;
      user-select: none;
      touch-action: manipulation;
    }
    .matrix {
      display: grid;
      gap: var(--ha-space-1, 4px);
    }
    .cell {
      width: var(--ha-space-7, 28px);
      height: var(--ha-space-7, 28px);
      box-sizing: border-box;
      border: 1px solid var(--divider-color, #666);
      border-radius: var(--ha-border-radius-sm, 4px);
      background: var(--card-background-color, transparent);
      cursor: pointer;
    }
    .cell.on {
      background: var(--primary-color);
      border-color: var(--primary-color);
      opacity: 0.85;
    }
    .caption {
      margin-top: var(--ha-space-2, 8px);
      font-size: var(--ha-font-size-m, 14px);
      color: var(--secondary-text-color);
    }
    .warn {
      color: var(--warning-color, #ffa600);
    }
  `;
__decorate([
    n({ type: Number })
], RemoteMapperGridPicker.prototype, "rows", void 0);
__decorate([
    n({ type: Number })
], RemoteMapperGridPicker.prototype, "cols", void 0);
__decorate([
    n({ type: Number })
], RemoteMapperGridPicker.prototype, "minCells", void 0);
__decorate([
    r()
], RemoteMapperGridPicker.prototype, "_hover", void 0);
RemoteMapperGridPicker = __decorate([
    t("remote-mapper-grid-picker")
], RemoteMapperGridPicker);

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Tap recognizer for the "replica" display mode: dashboard gestures on a
 * button cell map 1:1 to the physical remote's events (tap → single,
 * double-tap → double, triple → triple, hold → hold, lift after hold →
 * release).
 *
 * Capability-aware: the multi-tap wait only applies when the button has a
 * double/triple action, so single-only buttons fire on lift. Movement past
 * a small tolerance (or a pointercancel from the browser taking over for a
 * scroll) aborts the gesture.
 */
const DEFAULTS = { holdMs: 500, multiMs: 280, moveTolerance: 10 };
class TapRecognizer {
    constructor(_emit, opts = {}) {
        this._emit = _emit;
        this._taps = 0;
        this._caps = { double: false, triple: false, hold: false };
        this._held = false;
        this._down = false;
        this._startX = 0;
        this._startY = 0;
        this._opts = { ...DEFAULTS, ...opts };
    }
    /** True while a multi-tap window is open (cell can show "…"). */
    get pending() {
        return this._multiTimer !== undefined;
    }
    down(e, caps) {
        if (this._down)
            return;
        this._down = true;
        this._held = false;
        this._caps = caps;
        this._startX = e.clientX;
        this._startY = e.clientY;
        // a new press inside the window continues the tap sequence
        if (this._multiTimer !== undefined) {
            clearTimeout(this._multiTimer);
            this._multiTimer = undefined;
        }
        if (caps.hold) {
            this._holdTimer = setTimeout(() => {
                this._holdTimer = undefined;
                this._held = true;
                this._taps = 0;
                this._emit("hold");
            }, this._opts.holdMs);
        }
    }
    move(e) {
        if (!this._down)
            return;
        const dx = e.clientX - this._startX;
        const dy = e.clientY - this._startY;
        if (dx * dx + dy * dy > this._opts.moveTolerance ** 2)
            this.cancel();
    }
    up() {
        if (!this._down)
            return;
        this._down = false;
        this._clearHold();
        if (this._held) {
            this._held = false;
            this._emit("release");
            return;
        }
        this._taps++;
        const { double, triple } = this._caps;
        if (this._taps >= 3 || (this._taps === 2 && !triple) || (this._taps === 1 && !double && !triple)) {
            this._flush();
            return;
        }
        this._multiTimer = setTimeout(() => {
            this._multiTimer = undefined;
            this._flush();
        }, this._opts.multiMs);
    }
    /** Abort without emitting (scroll, pointercancel, element teardown). */
    cancel() {
        this._down = false;
        this._held = false;
        this._taps = 0;
        this._clearHold();
        if (this._multiTimer !== undefined) {
            clearTimeout(this._multiTimer);
            this._multiTimer = undefined;
        }
    }
    _flush() {
        const taps = this._taps;
        this._taps = 0;
        if (taps >= 3)
            this._emit("triple");
        else if (taps === 2)
            this._emit("double");
        else if (taps === 1)
            this._emit("single");
    }
    _clearHold() {
        if (this._holdTimer !== undefined) {
            clearTimeout(this._holdTimer);
            this._holdTimer = undefined;
        }
    }
}
const TIP_GAP = 6;
const TIP_MARGIN = 8;
/**
 * Anchor a tooltip under `rect` like a native title bubble: it hangs off
 * the button's edge that is nearer the viewport edge, so it never runs
 * off-screen (header icons live at the right, so they open leftwards).
 */
function tipAnchor(text, rect, viewportWidth) {
    const top = rect.bottom + TIP_GAP;
    const center = (rect.left + rect.right) / 2;
    return center > viewportWidth / 2
        ? { text, top, right: Math.max(TIP_MARGIN, viewportWidth - rect.right) }
        : { text, top, left: Math.max(TIP_MARGIN, rect.left) };
}

const DRAG_THRESHOLD = 8;
/** Press mode: hold this long before the fan opens (a quicker tap toggles). */
const PRESS_OPEN_MS = 400;
/** Arc radius for assisted options, in % of the cell's width/height. */
const ARC_RADIUS = 34;
/**
 * Pinterest-style fan: angles (degrees clockwise from "up") for n options.
 * Up to four fan across the top half; more go all the way around.
 */
function arcAngles(n) {
    if (n <= 1)
        return [0];
    if (n <= 4) {
        const span = n === 2 ? 70 : n === 3 ? 120 : 165;
        return Array.from({ length: n }, (_, i) => -span / 2 + (i * span) / (n - 1));
    }
    return Array.from({ length: n }, (_, i) => (i * 360) / n);
}
let RemoteMapperGrid = class RemoteMapperGrid extends i {
    constructor() {
        super(...arguments);
        this.buttons = [];
        this.slots = {};
        this.display = "assisted";
        this.editing = false;
        /** assisted: auto (per pointer type), tap (toggle) or press (hold, slide, lift). */
        this.assistedTrigger = "auto";
        /** all: arrangement of a button's event chips. */
        this.chipsLayout = "vertical";
        this._chipTipShown = false;
        /** Trigger resolved at pointerdown (auto → by pointerType), used at pointerup. */
        this._pressMode = "tap";
        /** True while a long-press fan is open under a still-down finger. */
        this._pressActive = false;
        this._touchMoveBlocker = (e) => {
            // Once the fan is open under the finger, the slide must not scroll the page.
            if (this._pressActive && e.cancelable)
                e.preventDefault();
        };
        this._recognizers = new Map();
        this._chipPressEnd = () => {
            if (this._chipTipTimer !== undefined) {
                clearTimeout(this._chipTipTimer);
                this._chipTipTimer = undefined;
            }
        };
    }
    connectedCallback() {
        super.connectedCallback();
        this.addEventListener("touchmove", this._touchMoveBlocker, { passive: false });
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener("touchmove", this._touchMoveBlocker);
        this._clearPressTimer();
        for (const rec of this._recognizers.values())
            rec.cancel();
    }
    _clearPressTimer() {
        if (this._pressTimer !== undefined) {
            clearTimeout(this._pressTimer);
            this._pressTimer = undefined;
        }
    }
    willUpdate(changed) {
        if (changed.has("editing") || changed.has("display")) {
            this._popover = undefined;
            this._drag = undefined;
            this._dropTarget = undefined;
            for (const rec of this._recognizers.values())
                rec.cancel();
        }
    }
    // ── events out ────────────────────────────────────────────────────
    _emit(type, detail) {
        this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
    }
    _run(actionId) {
        const slot = this.slots[actionId];
        if (slot?.assigned && !slot.archived)
            this._emit("run-action", { actionId });
    }
    // ── compact chips: long-press tooltip ─────────────────────────────
    _chipPressStart(e, actionId) {
        if (this.chipsLayout !== "compact" || e.pointerType === "mouse")
            return;
        this._chipPressEnd();
        this._chipTipShown = false;
        this._chipTipTimer = setTimeout(() => {
            this._chipTipTimer = undefined;
            this._chipTipShown = true;
            const slot = this.slots[actionId];
            const kind = this.buttons
                .flatMap((b) => b.actions)
                .find((a) => a.action_id === actionId);
            const text = `${kind ? KIND_TITLE[kind.kind] : actionId}: ${slot?.summary ?? "unassigned"}`;
            this._chipTip = { action: actionId, text };
            setTimeout(() => {
                if (this._chipTip?.action === actionId)
                    this._chipTip = undefined;
            }, 1800);
        }, 450);
    }
    // ── replica mode gestures ─────────────────────────────────────────
    _recognizer(button) {
        let rec = this._recognizers.get(button.id);
        if (!rec) {
            rec = new TapRecognizer((g) => this._onGesture(button.id, g));
            this._recognizers.set(button.id, rec);
        }
        return rec;
    }
    _live(button, kind) {
        const action = actionOfKind(button, kind);
        const slot = action ? this.slots[action.action_id] : undefined;
        return slot?.assigned && !slot.archived ? action.action_id : undefined;
    }
    _caps(button) {
        return {
            double: !!this._live(button, "double"),
            triple: !!this._live(button, "triple"),
            hold: !!this._live(button, "hold"),
        };
    }
    _onGesture(buttonId, gesture) {
        const button = this.buttons.find((b) => b.id === buttonId);
        if (!button)
            return;
        const actionId = this._live(button, gesture);
        if (actionId)
            this._emit("run-action", { actionId });
    }
    // ── pointer plumbing ──────────────────────────────────────────────
    _elementAt(x, y) {
        return this.shadowRoot?.elementFromPoint(x, y) ?? null;
    }
    _cellKeyAt(x, y) {
        const cell = this._elementAt(x, y)?.closest(".cell");
        return cell?.dataset.row !== undefined
            ? `${cell.dataset.row},${cell.dataset.col}`
            : undefined;
    }
    _onCellDown(e, button, row, col) {
        if (e.pointerType === "mouse" && e.button !== 0)
            return;
        const el = e.currentTarget;
        if (this.editing) {
            el.setPointerCapture(e.pointerId);
            const chip = e.target.closest?.(".chip");
            this._drag = {
                id: button.id,
                row,
                col,
                startX: e.clientX,
                startY: e.clientY,
                x: e.clientX,
                y: e.clientY,
                moved: false,
                fromChip: chip?.dataset.action,
            };
            return;
        }
        if (this.display === "replica") {
            el.setPointerCapture(e.pointerId);
            this._recognizer(button).down(e, this._caps(button));
        }
        else if (this.display === "assisted") {
            el.setPointerCapture(e.pointerId);
            // auto: a finger gets Pinterest press-slide-lift, a mouse/pen gets tap
            this._pressMode =
                this.assistedTrigger === "auto"
                    ? e.pointerType === "touch"
                        ? "press"
                        : "tap"
                    : this.assistedTrigger;
            // press mode: a long press opens the fan under the finger (slide,
            // lift); releasing earlier counts as a tap and toggles it instead
            this._pressActive = false;
            this._clearPressTimer();
            if (this._pressMode === "press") {
                this._pressTimer = setTimeout(() => {
                    this._pressTimer = undefined;
                    this._pressActive = true;
                    this._popover = button.id;
                }, PRESS_OPEN_MS);
            }
        }
        // "all": chips handle their own clicks
    }
    _optAt(x, y) {
        const opt = this._elementAt(x, y)?.closest(".opt");
        return opt?.dataset.action;
    }
    _onCellMove(e, button) {
        const drag = this._drag;
        if (drag) {
            if (!drag.moved) {
                const dx = e.clientX - drag.startX;
                const dy = e.clientY - drag.startY;
                if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD)
                    return;
            }
            this._drag = { ...drag, moved: true, x: e.clientX, y: e.clientY };
            this._dropTarget = this._cellKeyAt(e.clientX, e.clientY);
            return;
        }
        if (this.editing)
            return;
        if (this.display === "replica") {
            this._recognizers.get(button.id)?.move(e);
        }
        else if (this.display === "assisted" && this._popover === button.id) {
            const over = this._optAt(e.clientX, e.clientY);
            if (over !== this._hoverOpt)
                this._hoverOpt = over;
        }
    }
    _onCellUp(e, button) {
        const drag = this._drag;
        if (drag) {
            const target = this._dropTarget;
            this._drag = undefined;
            this._dropTarget = undefined;
            if (drag.moved) {
                if (target && this.layout) {
                    const [row, col] = target.split(",").map(Number);
                    const next = swapCells(this.layout, drag, { row, col });
                    if (next !== this.layout)
                        this._emit("layout-changed", { layout: next });
                }
            }
            else if (drag.fromChip) {
                this._emit("edit-action", { actionId: drag.fromChip });
            }
            else {
                this._emit("open-button", { buttonId: drag.id });
            }
            return;
        }
        if (this.display === "replica") {
            this._recognizers.get(button.id)?.up();
            return;
        }
        if (this.display === "assisted") {
            const picked = this._popover === button.id
                ? this._optAt(e.clientX, e.clientY)
                : undefined;
            this._hoverOpt = undefined;
            const wasPress = this._pressActive;
            this._pressActive = false;
            this._clearPressTimer();
            if (picked) {
                // lifted (or tapped) on an option
                this._popover = undefined;
                this._run(picked);
            }
            else if (wasPress) {
                // Pinterest: lifting anywhere else dismisses
                this._popover = undefined;
            }
            else {
                // tap (or a press released early): toggle this button's fan
                this._popover = this._popover === button.id ? undefined : button.id;
            }
        }
    }
    _onCellCancel(button) {
        this._drag = undefined;
        this._dropTarget = undefined;
        this._hoverOpt = undefined;
        this._pressActive = false;
        this._clearPressTimer();
        this._recognizers.get(button.id)?.cancel();
    }
    // ── render ────────────────────────────────────────────────────────
    render() {
        const layout = this.layout;
        if (!layout)
            return A;
        const map = cellMap(layout);
        const byId = new Map(this.buttons.map((b) => [b.id, b]));
        const cells = [];
        for (let r = 0; r < layout.rows; r++) {
            for (let c = 0; c < layout.cols; c++) {
                const id = map.get(`${r},${c}`);
                const button = id ? byId.get(id) : undefined;
                cells.push(button ? this._renderButton(button, layout, r, c) : this._renderEmpty(r, c));
            }
        }
        const drag = this._drag;
        const dragButton = drag?.moved ? byId.get(drag.id) : undefined;
        return b `
      ${this._popover
            ? b `<div
            class="backdrop"
            @pointerdown=${() => {
                this._popover = undefined;
            }}
          ></div>`
            : A}
      <div
        class="grid ${this.display} ${this.editing ? "editing" : ""}"
        style="grid-template-columns: repeat(${layout.cols}, minmax(0, 1fr))"
      >
        ${cells}
      </div>
      ${dragButton && drag
            ? b `<div class="ghost" style="left:${drag.x}px;top:${drag.y}px">
            ${buttonLabel(dragButton, layout)}
          </div>`
            : A}
    `;
    }
    _renderEmpty(row, col) {
        const key = `${row},${col}`;
        return b `<div
      class="cell empty ${this._dropTarget === key ? "drop" : ""}"
      data-row=${row}
      data-col=${col}
    ></div>`;
    }
    _renderButton(button, layout, row, col) {
        const key = `${row},${col}`;
        const flashing = this.flash && button.actions.some((a) => a.action_id === this.flash);
        const error = button.actions
            .map((a) => this.slots[a.action_id]?.error)
            .find((e) => !!e);
        const classes = [
            "cell",
            "btn",
            this._drag?.id === button.id && this._drag.moved ? "dragging" : "",
            this._dropTarget === key ? "drop" : "",
            this._popover === button.id ? "active" : "",
            flashing && this.display !== "all" ? "flash" : "",
        ].join(" ");
        return b `
      <div
        class=${classes}
        data-row=${row}
        data-col=${col}
        data-button=${button.id}
        @pointerdown=${(e) => this._onCellDown(e, button, row, col)}
        @pointermove=${(e) => this._onCellMove(e, button)}
        @pointerup=${(e) => this._onCellUp(e, button)}
        @pointercancel=${() => this._onCellCancel(button)}
        @contextmenu=${(e) => {
            if (this.display === "assisted" || this.editing)
                e.preventDefault();
        }}
      >
        <span class="label">${buttonLabel(button, layout)}</span>
        ${this.display === "all"
            ? this._renderChips(button)
            : this._renderCompact(button)}
        ${this._chipTip && button.actions.some((a) => a.action_id === this._chipTip.action)
            ? b `<div class="chip-tip">${this._chipTip.text}</div>`
            : A}
        ${error
            ? b `<span class="badge err" title=${error}>!</span>`
            : A}
        ${this._popover === button.id ? this._renderPopover(button) : A}
      </div>
    `;
    }
    _renderCompact(button) {
        const live = button.actions.filter((a) => this.slots[a.action_id]?.assigned);
        const primary = live[0];
        return b `
      <span class="summary"
        >${primary ? this.slots[primary.action_id].summary : "unassigned"}</span
      >
      <span class="kinds">
        ${button.actions.map((a) => {
            const slot = this.slots[a.action_id];
            const on = slot?.assigned && !slot.archived;
            return b `<span
            class="kind ${on ? "on" : ""} ${this.flash === a.action_id ? "flash" : ""}"
            title="${a.event} (${KIND_TITLE[a.kind]}): ${slot?.summary ?? "unassigned"}"
            >${KIND_ICON[a.kind]}</span
          >`;
        })}
      </span>
    `;
    }
    _renderChips(button) {
        return b `
      <div class="chips ${this.chipsLayout}">
        ${button.actions.map((a) => {
            const slot = this.slots[a.action_id];
            const classes = [
                "chip",
                slot?.assigned ? "on" : "",
                slot?.archived ? "archived" : "",
                this.flash === a.action_id ? "flash" : "",
            ].join(" ");
            return b `
            <button
              class=${classes}
              data-action=${a.action_id}
              title="${a.event} (${KIND_TITLE[a.kind]}): ${slot?.summary ?? "unassigned"}"
              @pointerdown=${(e) => this._chipPressStart(e, a.action_id)}
              @pointerup=${this._chipPressEnd}
              @pointercancel=${this._chipPressEnd}
              @contextmenu=${(e) => {
                if (this._chipTip)
                    e.preventDefault();
            }}
              @click=${(e) => {
                if (this._chipTipShown) {
                    // long press was "what is this?", not a command
                    e.stopPropagation();
                    this._chipTipShown = false;
                    return;
                }
                if (this.editing)
                    return;
                e.stopPropagation();
                this._run(a.action_id);
            }}
            >
              <span class="icon">${KIND_ICON[a.kind]}</span>
              <span class="text">${slot?.summary ?? "unassigned"}</span>
              ${slot?.error ? b `<span class="err" title=${slot.error}>!</span>` : A}
              ${slot?.stale ? b `<span class="stale" title="Source no longer reports this action">stale</span>` : A}
            </button>
          `;
        })}
      </div>
    `;
    }
    _renderPopover(button) {
        const angles = arcAngles(button.actions.length);
        const hovered = this._hoverOpt
            ? button.actions.find((a) => a.action_id === this._hoverOpt)
            : undefined;
        const status = hovered
            ? `${KIND_TITLE[hovered.kind]}: ${this.slots[hovered.action_id]?.summary ?? "unassigned"}`
            : this._pressActive
                ? "slide to an event, lift to run"
                : "tap an event";
        return b `
      <div class="popover">
        <div class="opt-status">${status}</div>
        ${button.actions.map((a, i) => {
            const slot = this.slots[a.action_id];
            const on = slot?.assigned && !slot.archived;
            const hover = this._hoverOpt === a.action_id ? "hover" : "";
            const rad = (angles[i] * Math.PI) / 180;
            const x = 50 + Math.sin(rad) * ARC_RADIUS;
            const y = 50 - Math.cos(rad) * ARC_RADIUS;
            return b `
            <div
              class="opt ${on ? "on" : ""} ${hover}"
              style="--i:${i};left:${x.toFixed(1)}%;top:${y.toFixed(1)}%"
              data-action=${a.action_id}
            >
              <span class="circle" title="${a.event} (${KIND_TITLE[a.kind]})"
                >${KIND_ICON[a.kind]}</span
              >
            </div>
          `;
        })}
      </div>
    `;
    }
};
RemoteMapperGrid.styles = i$3 `
    :host {
      display: block;
      position: relative;
      --rm-bg: var(--rm-button-bg, var(--remote-mapper-button-color, var(--ha-card-background, var(--card-background-color, #1c1c1c))));
      --rm-alpha: calc(var(--rm-opacity, var(--remote-mapper-button-opacity, 1)) * 100%);
      --rm-fg: var(--rm-text, var(--remote-mapper-text-color, var(--primary-text-color)));
      --rm-ac: var(--rm-accent, var(--remote-mapper-accent-color, var(--primary-color)));
      --rm-line: var(--remote-mapper-border-color, var(--divider-color, #444));
      --rm-on-accent: var(--text-primary-color, #fff);
    }
    .grid {
      display: grid;
      gap: var(--ha-space-2, 8px);
      padding: 0 var(--ha-space-4, 16px) var(--ha-space-4, 16px);
    }
    .cell {
      position: relative;
      box-sizing: border-box;
      min-width: 0;
      border-radius: var(--ha-border-radius-lg, 12px);
    }
    .grid.replica .cell,
    .grid.assisted .cell {
      aspect-ratio: 1.15;
    }
    .cell.btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--ha-space-1, 4px);
      padding: var(--ha-space-2, 8px);
      /* opacity applies to the pad only — text and accent marks stay solid */
      border: 1px solid color-mix(in srgb, var(--rm-line) var(--rm-alpha), transparent);
      background: color-mix(in srgb, var(--rm-bg) var(--rm-alpha), transparent);
      color: var(--rm-fg);
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      touch-action: manipulation;
      transition: background-color 120ms ease, transform 120ms ease;
    }
    .grid.all .cell.btn {
      justify-content: flex-start;
      min-height: var(--ha-space-20, 80px);
    }
    .grid.editing .cell.btn {
      touch-action: none;
      cursor: grab;
    }
    .cell.empty {
      border: 1px dashed transparent;
    }
    .grid.editing .cell.empty {
      border-color: var(--rm-line);
    }
    .cell.dragging {
      opacity: 0.35;
    }
    .cell.drop {
      outline: 2px dashed var(--rm-ac);
      outline-offset: 2px;
    }
    .cell.flash {
      background: var(--rm-ac);
      color: var(--rm-on-accent);
    }
    .cell.active {
      z-index: 9;
      border-color: var(--rm-ac);
    }
    .label {
      font-size: var(--ha-font-size-l, 16px);
      font-weight: var(--ha-font-weight-medium, 500);
      line-height: var(--ha-line-height-condensed, 1.2);
      letter-spacing: 0.1px;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .summary {
      font-size: var(--ha-font-size-m, 14px);
      line-height: var(--ha-line-height-condensed, 1.2);
      color: var(--secondary-text-color);
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .cell.flash .summary {
      color: inherit;
    }
    .kinds {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--ha-space-1, 4px);
      margin-top: var(--ha-space-1, 4px);
    }
    .kind {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--ha-space-6, 24px);
      height: var(--ha-space-6, 24px);
      border-radius: var(--ha-border-radius-circle, 50%);
      border: 1px solid var(--rm-line);
      font-size: var(--ha-font-size-s, 12px);
      font-weight: var(--ha-font-weight-medium, 500);
      opacity: 0.35;
    }
    .kind.on {
      opacity: 1;
      border-color: var(--rm-ac);
      color: var(--rm-ac);
    }
    /* While the pad flashes accent: siblings become faint rings, the
       mark that fired inverts (pad-colored disc, accent digit) and pulses */
    .cell.flash .kind.on {
      color: inherit;
      border-color: currentColor;
      opacity: 0.5;
    }
    .cell.flash .kind.flash {
      background: var(--rm-bg);
      border-color: var(--rm-bg);
      color: var(--rm-ac);
      opacity: 1;
      animation: rm-pulse 400ms ease-out;
    }
    .kind.flash {
      background: var(--rm-ac);
      color: var(--rm-on-accent);
    }
    .badge {
      position: absolute;
      top: var(--ha-space-1, 4px);
      right: var(--ha-space-2, 8px);
      font-size: var(--ha-font-size-s, 12px);
    }
    .err {
      color: var(--error-color, #db4437);
      font-weight: var(--ha-font-weight-bold, 700);
    }
    .stale {
      color: var(--warning-color, #ffa600);
      font-size: var(--ha-font-size-xs, 10px);
    }
    .chips {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-1, 4px);
      width: 100%;
    }
    /* Wrapped row: natural width, flow like tags, never wider than the pad */
    .chips.horizontal {
      flex-direction: row;
      flex-wrap: wrap;
    }
    .chips.horizontal .chip {
      flex: 0 1 auto;
      width: auto;
      max-width: 100%;
    }
    /* Compact: icons only, one row */
    .chips.compact {
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
    }
    .chips.compact .chip {
      width: var(--ha-space-10, 40px);
      justify-content: center;
      padding: var(--ha-space-1, 4px);
    }
    .chips.compact .chip .text,
    .chips.compact .chip .stale {
      display: none;
    }
    .chips.compact .chip .icon {
      width: auto;
      font-size: var(--ha-font-size-l, 16px);
    }
    /* Spines: one row, names read bottom-to-top */
    .chips.spines {
      flex-direction: row;
      justify-content: center;
      align-items: stretch;
      height: 150px;
    }
    .chips.spines .chip {
      flex: 1 1 0;
      width: auto;
      min-width: var(--ha-space-8, 32px);
      max-width: var(--ha-space-11, 44px);
      height: 100%;
      flex-direction: column-reverse;
      justify-content: flex-start;
      padding: var(--ha-space-2, 8px) 0;
    }
    .chips.spines .chip .text {
      flex: 1;
      min-height: 0;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      text-align: left;
    }
    .chips.spines .chip .icon {
      width: auto;
    }
    .chips.grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .chips.grid .chip {
      width: auto;
    }
    .chip-tip {
      position: absolute;
      left: var(--ha-space-2, 8px);
      right: var(--ha-space-2, 8px);
      bottom: var(--ha-space-2, 8px);
      z-index: 5;
      padding: var(--ha-space-1, 4px) var(--ha-space-2, 8px);
      border-radius: var(--ha-border-radius-md, 8px);
      background: var(--secondary-background-color, rgba(127, 127, 127, 0.25));
      color: var(--primary-text-color);
      font-size: var(--ha-font-size-s, 12px);
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      pointer-events: none;
    }
    .chip {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      width: 100%;
      min-width: 0;
      overflow: hidden;
      -webkit-touch-callout: none;
      user-select: none;
      min-height: var(--ha-space-8, 32px);
      box-sizing: border-box;
      padding: var(--ha-space-1, 4px) var(--ha-space-2, 8px);
      border: 1px solid var(--rm-line);
      border-radius: var(--ha-border-radius-md, 8px);
      background: none;
      color: inherit;
      font: inherit;
      font-size: var(--ha-font-size-m, 14px);
      line-height: var(--ha-line-height-condensed, 1.2);
      text-align: left;
      cursor: pointer;
      opacity: 0.5;
    }
    .chip.on {
      opacity: 1;
      border-color: var(--rm-ac);
    }
    .chip.archived {
      border-style: dashed;
      opacity: 0.35;
    }
    .chip.flash {
      background: var(--rm-ac);
      color: var(--rm-on-accent);
      animation: rm-pulse 400ms ease-out;
    }
    .chip .icon {
      flex: none;
      width: var(--ha-space-5, 20px);
      text-align: center;
      font-weight: var(--ha-font-weight-medium, 500);
      color: var(--rm-ac);
    }
    .chip.flash .icon {
      color: inherit;
    }
    .chip .text {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 8;
    }
    /* Assisted: options fan out INSIDE the pressed cell (Pinterest) */
    .cell.active .label,
    .cell.active .summary,
    .cell.active .kinds {
      visibility: hidden;
    }
    .cell.active {
      -webkit-touch-callout: none;
    }
    .opt-status {
      position: absolute;
      left: var(--ha-space-2, 8px);
      right: var(--ha-space-2, 8px);
      bottom: var(--ha-space-2, 8px);
      font-size: var(--ha-font-size-s, 12px);
      line-height: var(--ha-line-height-condensed, 1.2);
      color: var(--secondary-text-color);
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      pointer-events: none;
    }
    .popover {
      position: absolute;
      inset: 0;
      z-index: 10;
      border-radius: inherit;
      animation: rm-fade 120ms ease-out;
    }
    .opt {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      width: min(var(--ha-space-12, 48px), 30%);
      transform: translate(-50%, -50%);
      cursor: pointer;
      opacity: 0.45;
      /* backwards: hidden during the stagger delay, natural opacity after */
      animation: rm-pop 240ms cubic-bezier(0.2, 0.8, 0.2, 1.25) backwards;
      animation-delay: calc(var(--i, 0) * 40ms);
    }
    .opt.on {
      opacity: 1;
    }
    .circle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      max-width: var(--ha-space-12, 48px);
      aspect-ratio: 1;
      border-radius: var(--ha-border-radius-circle, 50%);
      border: 2px solid var(--rm-ac);
      background: var(--card-background-color, #222);
      box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0, 0, 0, 0.4));
      font-size: var(--ha-font-size-l, 16px);
      font-weight: var(--ha-font-weight-medium, 500);
      pointer-events: none;
      transition: transform 100ms ease, background-color 100ms ease;
    }
    .opt.hover .circle {
      transform: scale(1.2);
      background: var(--rm-ac);
      color: var(--rm-on-accent);
    }
    .ghost {
      position: fixed;
      z-index: 50;
      pointer-events: none;
      transform: translate(-50%, -50%);
      padding: var(--ha-space-2, 8px) var(--ha-space-3, 12px);
      border-radius: var(--ha-border-radius-md, 8px);
      background: var(--rm-ac);
      color: var(--rm-on-accent);
      font-size: var(--ha-font-size-m, 14px);
      font-weight: var(--ha-font-weight-medium, 500);
      opacity: 0.9;
    }
    @keyframes rm-pop {
      from {
        transform: translate(-50%, -50%) scale(0.3);
        opacity: 0;
      }
      to {
        transform: translate(-50%, -50%) scale(1);
      }
    }
    @keyframes rm-pulse {
      0% {
        transform: scale(1);
      }
      40% {
        transform: scale(1.3);
      }
      100% {
        transform: scale(1);
      }
    }
    @keyframes rm-fade {
      from {
        opacity: 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .popover,
      .opt,
      .circle,
      .cell.btn {
        animation: none;
        transition: none;
      }
    }
  `;
__decorate([
    n({ attribute: false })
], RemoteMapperGrid.prototype, "buttons", void 0);
__decorate([
    n({ attribute: false })
], RemoteMapperGrid.prototype, "layout", void 0);
__decorate([
    n({ attribute: false })
], RemoteMapperGrid.prototype, "slots", void 0);
__decorate([
    n()
], RemoteMapperGrid.prototype, "display", void 0);
__decorate([
    n({ type: Boolean })
], RemoteMapperGrid.prototype, "editing", void 0);
__decorate([
    n()
], RemoteMapperGrid.prototype, "flash", void 0);
__decorate([
    n()
], RemoteMapperGrid.prototype, "assistedTrigger", void 0);
__decorate([
    n()
], RemoteMapperGrid.prototype, "chipsLayout", void 0);
__decorate([
    r()
], RemoteMapperGrid.prototype, "_popover", void 0);
__decorate([
    r()
], RemoteMapperGrid.prototype, "_hoverOpt", void 0);
__decorate([
    r()
], RemoteMapperGrid.prototype, "_chipTip", void 0);
__decorate([
    r()
], RemoteMapperGrid.prototype, "_drag", void 0);
__decorate([
    r()
], RemoteMapperGrid.prototype, "_dropTarget", void 0);
RemoteMapperGrid = __decorate([
    t("remote-mapper-grid")
], RemoteMapperGrid);

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Vendored from widget-canvas-ha src/model/migrate.ts — the snap/cell
 * helpers only (normalizeConfig stays upstream; our layout is
 * server-generated and already normalized).
 */
const DEFAULT_CELL = 10;
function snapSize(v, cell) {
    return Math.max(cell, Math.round(v / cell) * cell);
}
function snapPos(v, cell) {
    return Math.round(v / cell) * cell;
}
/** Resolve a CellSize (number or {x,y}) into per-axis cell sizes. */
function cellsOf(grid) {
    const c = grid.cell;
    if (typeof c === "number" && Number.isFinite(c))
        return { x: c, y: c };
    const o = (c ?? {});
    const x = typeof o.x === "number" && Number.isFinite(o.x) ? o.x : DEFAULT_CELL;
    const y = typeof o.y === "number" && Number.isFinite(o.y) ? o.y : DEFAULT_CELL;
    return { x, y };
}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Vendored from widget-canvas-ha src/model/zorder.ts (verbatim).
 * All ops return a NEW widget array with z re-normalized to 1..n
 * preserving relative order (DDC-proven semantics).
 */
function sortedByZ(widgets) {
    return widgets
        .map((w, i) => ({ w, i }))
        .sort((a, b) => (a.w.z ?? 0) - (b.w.z ?? 0) || a.i - b.i)
        .map((x) => x.w);
}
function renumber(ordered, all) {
    const zById = new Map();
    ordered.forEach((w, i) => zById.set(w.id, i + 1));
    return all.map((w) => ({ ...w, z: zById.get(w.id) ?? w.z ?? 1 }));
}
function normalizeZ(widgets) {
    return renumber(sortedByZ(widgets), widgets);
}
function applyZOp(widgets, id, op) {
    const order = sortedByZ(widgets);
    const idx = order.findIndex((w) => w.id === id);
    if (idx === -1)
        return normalizeZ(widgets);
    const moved = order.splice(idx, 1)[0];
    switch (op) {
        case "forward":
            order.splice(Math.min(idx + 1, order.length), 0, moved);
            break;
        case "backward":
            order.splice(Math.max(idx - 1, 0), 0, moved);
            break;
        case "front":
            order.push(moved);
            break;
        case "back":
            order.unshift(moved);
            break;
    }
    return renumber(order, widgets);
}
function maxZ(widgets) {
    return widgets.reduce((m, w) => Math.max(m, w.z ?? 0), 0);
}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Vendored from widget-canvas-ha src/editor/session.ts (verbatim).
 *
 * Module-level edit-session registry keyed by canvas id. Saving Lovelace
 * config rebuilds EVERY card in the view — the element is destroyed and
 * recreated mid-edit whenever any card saves. Keeping working state here
 * (the module instance survives; only elements are recreated) lets a
 * recreated instance re-attach and resume the edit session seamlessly.
 */
const sessions = new Map();
function getSession(canvasId) {
    return canvasId ? sessions.get(canvasId) : undefined;
}
function createSession(canvasId, widgets) {
    const session = {
        canvasId,
        active: true,
        working: widgets,
        original: widgets.map((w) => ({ ...w })),
        selectedId: null,
        undoStack: [],
        dpadMode: "fine",
    };
    sessions.set(canvasId, session);
    return session;
}
function endSession(canvasId) {
    if (canvasId)
        sessions.delete(canvasId);
}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Vendored from widget-canvas-ha src/util/hash.ts + src/util/uuid.ts
 * (verbatim; see types.ts header for why vendored).
 */
/** Deterministic JSON stringify (sorted object keys, stable across key order). */
function stableStringify(value) {
    return JSON.stringify(sortValue(value));
}
function sortValue(value) {
    if (Array.isArray(value))
        return value.map(sortValue);
    if (value && typeof value === "object") {
        const out = {};
        for (const key of Object.keys(value).sort()) {
            const v = value[key];
            if (v !== undefined)
                out[key] = sortValue(v);
        }
        return out;
    }
    return value;
}
function deepClone(value) {
    if (value === undefined || value === null)
        return value;
    return JSON.parse(JSON.stringify(value));
}
function deepEqual(a, b) {
    return stableStringify(a) === stableStringify(b);
}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Vendored from widget-canvas-ha src/editor/edit-controller.ts.
 * Adapted for Remote Mapper: slot tiles are fixed by hardware, so the
 * add / duplicate / delete mutations are removed; everything else
 * (drag/resize with direct-DOM writes, snap, undo, D-pad, keyboard,
 * session resume) is upstream behavior.
 */
const LONG_PRESS_MS = 800;
const LONG_PRESS_DRIFT_PX = 18;
const DPAD_REPEAT_DELAY_MS = 350;
const DPAD_REPEAT_MS = 70;
const UNDO_CAP = 25;
class EditController {
    constructor(host) {
        this.session = null;
        this.drag = null;
        this.lpStart = null;
        this.keydownBound = (ev) => this.onKeyDown(ev);
        this.host = host;
    }
    // ── state accessors ────────────────────────────────────────────────
    get active() {
        return this.session?.active ?? false;
    }
    get working() {
        return this.session?.working ?? [];
    }
    get selectedId() {
        return this.session?.selectedId ?? null;
    }
    get selected() {
        const id = this.selectedId;
        return id ? this.working.find((w) => w.id === id) : undefined;
    }
    get dpadMode() {
        return this.session?.dpadMode ?? "fine";
    }
    get dpadSteps() {
        if (this.dpadMode === "fine")
            return { x: 1, y: 1 };
        const cfg = this.host.config();
        return cfg ? cellsOf(cfg.grid) : { x: 1, y: 1 };
    }
    get dirty() {
        return !!this.session && !deepEqual(this.session.working, this.session.original);
    }
    get canUndo() {
        return (this.session?.undoStack.length ?? 0) > 0;
    }
    get dragging() {
        return this.drag !== null;
    }
    // ── lifecycle ──────────────────────────────────────────────────────
    /** Re-attach to a session that survived a view rebuild. */
    tryResume() {
        const cfg = this.host.config();
        const session = getSession(cfg?.canvas_id);
        if (session?.active) {
            this.session = session;
            window.addEventListener("keydown", this.keydownBound);
            return true;
        }
        return false;
    }
    enter() {
        if (this.session?.active)
            return;
        const cfg = this.host.config();
        if (!cfg?.canvas_id)
            return;
        this.session = createSession(cfg.canvas_id, deepClone(cfg.widgets));
        window.addEventListener("keydown", this.keydownBound);
        this.host.requestUpdate();
    }
    /** Done: persist working state. */
    async done() {
        const session = this.session;
        if (!session)
            return;
        const widgets = normalizeZ(session.working);
        this.teardown();
        const ok = await this.host.saveWorking(widgets);
        if (!ok) {
            const cfg = this.host.config();
            this.session = createSession(session.canvasId, widgets);
            this.session.original = deepClone(cfg?.widgets ?? []);
            window.addEventListener("keydown", this.keydownBound);
        }
        this.host.requestUpdate();
    }
    /** Cancel: discard working state, revert to last saved layout. */
    cancel() {
        if (!this.session)
            return;
        if (this.dirty && !window.confirm("Discard layout changes?"))
            return;
        this.teardown();
        this.host.requestUpdate();
    }
    detach() {
        // element is going away; keep the session in the registry for resume
        window.removeEventListener("keydown", this.keydownBound);
        this.clearDpadRepeat();
        this.cancelLongPress();
        this.session = null;
    }
    teardown() {
        window.removeEventListener("keydown", this.keydownBound);
        this.clearDpadRepeat();
        this.cancelLongPress();
        endSession(this.session?.canvasId);
        this.session = null;
        this.drag = null;
    }
    // ── mutations ──────────────────────────────────────────────────────
    pushUndo() {
        const s = this.session;
        if (!s)
            return;
        s.undoStack.push(deepClone(s.working));
        if (s.undoStack.length > UNDO_CAP)
            s.undoStack.shift();
    }
    undo() {
        const s = this.session;
        if (!s)
            return;
        const prev = s.undoStack.pop();
        if (!prev)
            return;
        s.working = prev;
        if (s.selectedId && !prev.some((w) => w.id === s.selectedId))
            s.selectedId = null;
        this.host.requestUpdate();
    }
    select(id) {
        const s = this.session;
        if (!s)
            return;
        s.selectedId = id;
        this.host.requestUpdate();
    }
    updateWidget(id, patch, opts) {
        const s = this.session;
        if (!s)
            return;
        if (opts?.undo !== false)
            this.pushUndo();
        s.working = s.working.map((w) => w.id === id ? { ...w, ...patch } : w);
        this.host.requestUpdate();
    }
    zOp(op) {
        const s = this.session;
        if (!s?.selectedId)
            return;
        this.pushUndo();
        s.working = applyZOp(s.working, s.selectedId, op);
        this.host.requestUpdate();
    }
    /** Ensure tiles exist for every action id (probe may grow the set). */
    ensureTiles(make, ids) {
        const s = this.session;
        if (!s)
            return;
        const have = new Set(s.working.map((w) => w.id));
        const missing = ids.filter((id) => !have.has(id));
        if (!missing.length)
            return;
        this.pushUndo();
        const added = missing.map((id, i) => ({
            ...make(id, i),
            z: maxZ(s.working) + 1 + i,
        }));
        s.working = [...s.working, ...added];
        this.host.requestUpdate();
    }
    toggleDpadStep() {
        const s = this.session;
        if (!s)
            return;
        s.dpadMode = s.dpadMode === "fine" ? "cell" : "fine";
        this.host.requestUpdate();
    }
    /** Raw position + clamp; NO grid snapping — the D-pad exists for precision. */
    nudge(dx, dy) {
        const s = this.session;
        const cfg = this.host.config();
        const sel = this.selected;
        if (!s || !cfg || !sel)
            return;
        const nx = clamp(sel.x + dx, 0, Math.max(0, cfg.design_size.width - sel.w));
        const ny = clamp(sel.y + dy, 0, Math.max(0, cfg.design_size.height - sel.h));
        if (nx === sel.x && ny === sel.y)
            return;
        this.updateWidget(sel.id, { x: round2(nx), y: round2(ny) }, { undo: false });
    }
    /** One undo entry per D-pad press-burst, not per repeat tick. */
    dpadPress(dx, dy) {
        if (!this.session)
            return;
        this.pushUndo();
        const tick = () => {
            const steps = this.dpadSteps;
            this.nudge(dx * steps.x, dy * steps.y);
        };
        tick();
        this.clearDpadRepeat();
        this.dpadTimer = window.setTimeout(() => {
            this.dpadInterval = window.setInterval(tick, DPAD_REPEAT_MS);
        }, DPAD_REPEAT_DELAY_MS);
    }
    dpadRelease() {
        this.clearDpadRepeat();
    }
    clearDpadRepeat() {
        if (this.dpadTimer !== undefined)
            clearTimeout(this.dpadTimer);
        if (this.dpadInterval !== undefined)
            clearInterval(this.dpadInterval);
        this.dpadTimer = this.dpadInterval = undefined;
    }
    // ── keyboard ───────────────────────────────────────────────────────
    onKeyDown(ev) {
        if (!this.session?.active)
            return;
        if (isTypingTarget(ev))
            return;
        switch (ev.key) {
            case "Escape":
                ev.preventDefault();
                this.cancel();
                return;
            case "z":
                if (ev.ctrlKey || ev.metaKey) {
                    ev.preventDefault();
                    this.undo();
                }
                return;
        }
        const arrows = {
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
        };
        const dir = arrows[ev.key];
        if (dir && this.selectedId) {
            ev.preventDefault();
            const steps = this.dpadSteps;
            const mult = ev.shiftKey ? 5 : 1;
            if (!ev.repeat)
                this.pushUndo();
            this.nudge(dir[0] * steps.x * mult, dir[1] * steps.y * mult);
        }
    }
    // ── pointer: move / resize ─────────────────────────────────────────
    onSlotPointerDown(ev, widgetId) {
        const s = this.session;
        if (!s || this.drag || ev.button > 0)
            return;
        ev.preventDefault();
        ev.stopPropagation();
        if (s.selectedId !== widgetId)
            this.select(widgetId);
        const orig = this.working.find((w) => w.id === widgetId);
        if (!orig)
            return;
        this.startDrag(ev, {
            kind: "move",
            pointerId: ev.pointerId,
            widgetId,
            startClientX: ev.clientX,
            startClientY: ev.clientY,
            orig: { ...orig },
            moved: false,
            next: { x: orig.x, y: orig.y, w: orig.w, h: orig.h },
        });
    }
    onHandlePointerDown(ev, widgetId, corner) {
        if (!this.session || this.drag || ev.button > 0)
            return;
        ev.preventDefault();
        ev.stopPropagation();
        const orig = this.working.find((w) => w.id === widgetId);
        if (!orig)
            return;
        this.startDrag(ev, {
            kind: "resize",
            pointerId: ev.pointerId,
            widgetId,
            startClientX: ev.clientX,
            startClientY: ev.clientY,
            orig: { ...orig },
            corner,
            moved: false,
            next: { x: orig.x, y: orig.y, w: orig.w, h: orig.h },
        });
    }
    startDrag(ev, drag) {
        this.drag = drag;
        const target = ev.currentTarget;
        try {
            target.setPointerCapture(ev.pointerId);
        }
        catch {
            /* detached */
        }
        const onMove = (e) => this.onDragMove(e);
        const onEnd = (e) => {
            if (e.pointerId !== drag.pointerId)
                return;
            target.removeEventListener("pointermove", onMove);
            target.removeEventListener("pointerup", onEnd);
            target.removeEventListener("pointercancel", onCancel);
            this.finishDrag(false);
        };
        const onCancel = (e) => {
            if (e.pointerId !== drag.pointerId)
                return;
            target.removeEventListener("pointermove", onMove);
            target.removeEventListener("pointerup", onEnd);
            target.removeEventListener("pointercancel", onCancel);
            this.finishDrag(true);
        };
        target.addEventListener("pointermove", onMove);
        target.addEventListener("pointerup", onEnd);
        target.addEventListener("pointercancel", onCancel);
    }
    onDragMove(ev) {
        const d = this.drag;
        const cfg = this.host.config();
        if (!d || !cfg || ev.pointerId !== d.pointerId)
            return;
        const scale = this.host.scale() || 1;
        // clientX/Y are visual-space px — divide by scale for canvas units
        const dx = (ev.clientX - d.startClientX) / scale;
        const dy = (ev.clientY - d.startClientY) / scale;
        if (!d.moved && Math.hypot(dx * scale, dy * scale) < 3)
            return;
        d.moved = true;
        const design = cfg.design_size;
        const cells = cellsOf(cfg.grid);
        if (d.kind === "move") {
            d.next.x = clamp(d.orig.x + dx, 0, Math.max(0, design.width - d.orig.w));
            d.next.y = clamp(d.orig.y + dy, 0, Math.max(0, design.height - d.orig.h));
        }
        else {
            const c = d.corner;
            const wholeCellsX = (v) => Math.max(cells.x, Math.floor(v / cells.x) * cells.x);
            const wholeCellsY = (v) => Math.max(cells.y, Math.floor(v / cells.y) * cells.y);
            let { x, y, w, h } = d.orig;
            if (c === "se" || c === "ne")
                w = d.orig.w + dx;
            if (c === "sw" || c === "nw")
                w = d.orig.w - dx;
            if (c === "se" || c === "sw")
                h = d.orig.h + dy;
            if (c === "ne" || c === "nw")
                h = d.orig.h - dy;
            // sizes snap live to the internal grid (phone-widget model)
            w = clamp(snapSize(w, cells.x), cells.x, design.width);
            h = clamp(snapSize(h, cells.y), cells.y, design.height);
            if (c === "sw" || c === "nw") {
                const right = d.orig.x + d.orig.w;
                if (w > right)
                    w = wholeCellsX(right);
                x = round2(right - w);
            }
            else if (x + w > design.width) {
                w = wholeCellsX(design.width - x);
            }
            if (c === "ne" || c === "nw") {
                const bottom = d.orig.y + d.orig.h;
                if (h > bottom)
                    h = wholeCellsY(bottom);
                y = round2(bottom - h);
            }
            else if (y + h > design.height) {
                h = wholeCellsY(design.height - y);
            }
            d.next = { x, y, w, h };
        }
        // direct-DOM application during drag — no Lit re-render churn (DDC-proven)
        const slot = this.host.slotEl(d.widgetId);
        if (slot) {
            slot.style.transform = `translate3d(${d.next.x}px, ${d.next.y}px, 0)`;
            if (d.kind === "resize") {
                slot.style.width = `${d.next.w}px`;
                slot.style.height = `${d.next.h}px`;
            }
        }
        this.updateBadgeText(d.next);
    }
    finishDrag(canceled) {
        const d = this.drag;
        const cfg = this.host.config();
        this.drag = null;
        if (!d || !cfg)
            return;
        if (canceled || !d.moved) {
            // Lit memoizes unchanged style expressions and won't undo our direct
            // DOM writes — restore the slot explicitly.
            this.syncSlotStyle(d.widgetId, d.orig);
            this.host.requestUpdate();
            return;
        }
        let { x, y } = d.next;
        if (d.kind === "move" && cfg.grid.snap_position) {
            const cells = cellsOf(cfg.grid);
            x = clamp(snapPos(x, cells.x), 0, Math.max(0, cfg.design_size.width - d.next.w));
            y = clamp(snapPos(y, cells.y), 0, Math.max(0, cfg.design_size.height - d.next.h));
        }
        const final = { x: round2(x), y: round2(y), w: d.next.w, h: d.next.h };
        // if committed values equal the pre-drag state (snap-back), Lit skips
        // the attribute write and the raw drag offset would stick
        this.syncSlotStyle(d.widgetId, final);
        this.updateBadgeText(final);
        this.pushUndo();
        this.updateWidget(d.widgetId, final, { undo: false });
    }
    syncSlotStyle(id, r) {
        const slot = this.host.slotEl(id);
        if (!slot)
            return;
        slot.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`;
        slot.style.width = `${r.w}px`;
        slot.style.height = `${r.h}px`;
    }
    updateBadgeText(r) {
        const badge = this.host.badgeEl();
        if (badge) {
            badge.textContent = `x ${Math.round(r.x)}  y ${Math.round(r.y)}  ·  ${r.w}×${r.h}`;
        }
    }
    // ── long-press to enter edit (view mode) ───────────────────────────
    onViewPointerDown(ev) {
        if (this.session?.active || ev.button > 0)
            return;
        // only from empty canvas area — not over a tile or the pencil
        const path = ev.composedPath();
        for (const t of path) {
            if (t instanceof HTMLElement) {
                if (t.classList?.contains("widget-slot"))
                    return;
                if (t.classList?.contains("pencil"))
                    return;
            }
        }
        this.lpStart = { x: ev.clientX, y: ev.clientY };
        this.lpTimer = window.setTimeout(() => {
            this.lpTimer = undefined;
            this.enter();
        }, LONG_PRESS_MS);
    }
    onViewPointerMove(ev) {
        if (this.lpTimer === undefined || !this.lpStart)
            return;
        if (Math.hypot(ev.clientX - this.lpStart.x, ev.clientY - this.lpStart.y) >
            LONG_PRESS_DRIFT_PX) {
            this.cancelLongPress();
        }
    }
    cancelLongPress() {
        if (this.lpTimer !== undefined)
            clearTimeout(this.lpTimer);
        this.lpTimer = undefined;
        this.lpStart = null;
    }
}
function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
}
function round2(v) {
    return Math.round(v * 100) / 100;
}
function isTypingTarget(ev) {
    const path = ev.composedPath();
    for (const t of path) {
        if (!(t instanceof HTMLElement))
            continue;
        const tag = t.localName;
        if (tag === "input" || tag === "textarea" || tag === "select")
            return true;
        if (t.isContentEditable)
            return true;
        const role = t.getAttribute?.("role");
        if (role === "textbox" || role === "combobox" || role === "searchbox")
            return true;
    }
    return false;
}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Vendored from widget-canvas-ha src/render/scaling.ts (verbatim, section
 * constants inlined).
 */
/**
 * Width-driven by default: scale = hostWidth / design.width, height
 * follows aspect; with an externally fixed height, contain-fit both axes
 * and center (letterbox).
 */
function computeTransform(design, hostWidth, fixedHeight) {
    const w = Math.max(1, hostWidth);
    {
        const scale = w / design.width;
        return { scale, offsetX: 0, offsetY: 0, viewportHeight: design.height * scale };
    }
}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Human text for whatever a failed call throws.
 *
 * hass.callWS rejects with a plain `{code, message}` object, which
 * `String(err)` turns into "[object Object]"; Errors carry a message;
 * anything else is stringified as a last resort. The card's not-found
 * case (a dashboard card pointing at a remote that was removed) gets a
 * hint about where to fix it.
 */
function errorText(err) {
    if (err && typeof err === "object") {
        const e = err;
        const message = typeof e.message === "string" && e.message ? e.message : undefined;
        if (e.code === "not_found") {
            return `${message ?? "Remote not found"} — it was removed or never existed. Open the card editor and pick another remote.`;
        }
        if (message)
            return message;
        if (err instanceof Error)
            return err.message || err.name;
        try {
            return JSON.stringify(err);
        }
        catch {
            return String(err);
        }
    }
    return String(err);
}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Infer a human name for a slot from its sequence — no model, just a
 * lookup: verb from the service, target from HA's registries (friendly
 * names the user already sees everywhere), `alias:` wins when present
 * (HA's own way of naming action steps). Unknown shapes fall back to the
 * raw action so nothing is ever blank.
 */
const VERBS = {
    turn_on: "Turn on",
    turn_off: "Turn off",
    toggle: "Toggle",
    open_cover: "Open",
    close_cover: "Close",
    stop_cover: "Stop",
    open_cover_tilt: "Tilt open",
    close_cover_tilt: "Tilt close",
    lock: "Lock",
    unlock: "Unlock",
    press: "Press",
    start: "Start",
    pause: "Pause",
    stop: "Stop",
    return_to_base: "Dock",
    media_play: "Play",
    media_pause: "Pause",
    media_play_pause: "Play / pause",
    media_stop: "Stop",
    media_next_track: "Next track",
    media_previous_track: "Previous track",
    volume_up: "Volume up",
    volume_down: "Volume down",
    volume_mute: "Mute",
    increment: "Increment",
    decrement: "Decrement",
    set_value: "Set",
    set_temperature: "Set temperature",
    set_hvac_mode: "Set mode",
    set_preset_mode: "Set preset",
    trigger: "Trigger",
    reload: "Reload",
    notify: "Notify",
    send_message: "Send message",
};
const CONTROL_FLOW = [
    ["if", "Conditional"],
    ["choose", "Choose"],
    ["repeat", "Repeat"],
    ["parallel", "Parallel"],
    ["sequence", "Sequence"],
    ["wait_template", "Wait"],
    ["wait_for_trigger", "Wait"],
    ["delay", "Delay"],
    ["event", "Fire event"],
    ["variables", "Variables"],
    ["stop", "Stop"],
];
const humanize = (s) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const list = (v) => Array.isArray(v) ? v.filter((x) => typeof x === "string") : typeof v === "string" ? [v] : [];
function friendly(entityId, hass) {
    const name = hass?.states?.[entityId]?.attributes?.friendly_name;
    return typeof name === "string" && name ? name : entityId;
}
function targetLabel(step, hass) {
    const target = (step.target ?? {});
    const names = [
        ...list(target.entity_id ?? step.entity_id ?? step.data?.entity_id).map((e) => friendly(e, hass)),
        ...list(target.area_id).map((a) => hass?.areas?.[a]?.name || a),
        ...list(target.floor_id).map((f) => hass?.floors?.[f]?.name || f),
        ...list(target.device_id).map((d) => hass?.devices?.[d]?.name_by_user || hass?.devices?.[d]?.name || d),
    ];
    if (!names.length)
        return "";
    return names.length === 1 ? names[0] : `${names[0]} +${names.length - 1}`;
}
/** Name for one action step. */
function stepName(raw, hass) {
    if (!raw || typeof raw !== "object")
        return "";
    const step = raw;
    if (typeof step.alias === "string" && step.alias.trim())
        return step.alias.trim();
    if (typeof step.scene === "string")
        return friendly(step.scene, hass);
    for (const [key, label] of CONTROL_FLOW) {
        if (key in step)
            return label;
    }
    const action = step.action ?? step.service;
    if (typeof action !== "string")
        return humanize(Object.keys(step)[0] ?? "");
    const [domain, service = ""] = action.split(".");
    const target = targetLabel(step, hass);
    if (domain === "scene" && service === "turn_on")
        return target || "Scene";
    if (domain === "script") {
        if (service === "turn_on")
            return target || "Script";
        return friendly(action, hass); // script.my_script called directly
    }
    if (service === "select_option") {
        const option = step.data?.option ?? step.option;
        if (typeof option === "string" && option)
            return target ? `${option} · ${target}` : option;
        return target ? `Select · ${target}` : "Select option";
    }
    const verb = VERBS[service] ?? humanize(service);
    return target ? `${verb} ${target}` : verb;
}
/** Name for a whole sequence: first step, "+N" for the rest. */
function inferName(sequence, hass) {
    if (!sequence.length)
        return "";
    const first = stepName(sequence[0], hass);
    return sequence.length > 1 ? `${first} +${sequence.length - 1}` : first;
}

const CARD_TAG = "remote-mapper-card";
/** HA's own "start a config flow" route — opens Add integration → Remote Mapper. */
const ADD_REMOTE_PATH = "/_my_redirect/config_flow_start?domain=remote_mapper";
const UPDATED_EVENT = "remote_mapper_updated";
const ACTION_EVENT = "remote_mapper_action";
const LAYOUT_SCHEMA_VERSION = 1;
const TILE_W = 100;
const TILE_H = 60;
const TILE_GAP = 20;
const DESIGN_WIDTH = 380;
const CREATE_MODES = new Set([
    "new_scene",
    "new_automation",
    "new_remote_automation",
]);
/** Auto-grid fallback layout from the probed action list (design §10). */
function defaultLayout(actions) {
    const n = Math.max(1, actions.length);
    const cols = Math.max(2, Math.ceil(Math.sqrt(n)));
    const rows = Math.ceil(n / cols);
    const width = Math.max(DESIGN_WIDTH, cols * (TILE_W + TILE_GAP) + TILE_GAP);
    const height = rows * (TILE_H + TILE_GAP) + TILE_GAP;
    return {
        schema_version: LAYOUT_SCHEMA_VERSION,
        design_size: { width, height },
        grid: { cell: 10, snap_position: false },
        widgets: actions.map((id, i) => ({
            id,
            kind: "slot",
            x: TILE_GAP + (i % cols) * (TILE_W + TILE_GAP),
            y: TILE_GAP + Math.floor(i / cols) * (TILE_H + TILE_GAP),
            w: TILE_W,
            h: TILE_H,
            z: i + 1,
        })),
    };
}
/** Recognize the quick-chip shapes inside an existing sequence. */
function inferQuick(sequence) {
    if (sequence.length === 1 && typeof sequence[0] === "object" && sequence[0]) {
        const step = sequence[0];
        const action = step.action ?? step.service;
        const entity = step.target?.entity_id ?? step.entity_id;
        if (typeof entity === "string") {
            if (action === "scene.turn_on")
                return { mode: "scene", entity, option: "" };
            if (action === "homeassistant.toggle")
                return { mode: "toggle", entity, option: "" };
            if (action === "script.turn_on")
                return { mode: "script", entity, option: "" };
            if (action === "select.select_option") {
                const option = step.data?.option ?? step.option;
                return { mode: "wled_preset", entity, option: option ?? "" };
            }
        }
    }
    return { mode: "custom", entity: "", option: "" };
}
function quickSequence(mode, entity, option) {
    const call = (action) => [
        { action, target: { entity_id: entity } },
    ];
    if (mode === "scene")
        return call("scene.turn_on");
    if (mode === "toggle")
        return call("homeassistant.toggle");
    if (mode === "wled_preset")
        return [
            {
                action: "select.select_option",
                target: { entity_id: entity },
                data: { option },
            },
        ];
    return call("script.turn_on");
}
let RemoteMapperCard = class RemoteMapperCard extends i {
    constructor() {
        super(...arguments);
        this._hostWidth = 0;
        // grid layout (plan 04): draft-then-commit, like the canvas session
        this._gridEditing = false;
        this._pickerOpen = false;
        this._tipShown = false;
        // Modals opened from pointerup get a synthetic click ~immediately after
        // (touch); the backdrop must not treat that ghost click as "close".
        this._modalOpenedAt = 0;
        /** Capture-phase: swallow the ghost click anywhere inside a just-opened modal. */
        this._ghostGuard = {
            handleEvent: (e) => {
                if (Date.now() - this._modalOpenedAt < 350) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            },
            capture: true,
        };
        this._editorTab = "quick";
        this._quickMode = "scene";
        this._quickEntity = "";
        this._quickOption = "";
        // "new scene" mode: entities to capture + save them as the remote default
        this._snapEntities = [];
        this._snapRemember = false;
        this._draft = "";
        this._draftName = "";
        this._yamlValid = true;
        this._draftMaterialized = false;
        this._haFormOk = false;
        this._yamlEditorOk = false;
        this._clearRemember = false;
        // hand back to HA (release)
        this._releaseOpen = false;
        this._releaseConvert = true;
        this._releaseBusy = false;
        this._importSelected = new Set();
        this._importOverwrite = false;
        this._importBusy = false;
        this._fetchStarted = false;
        this._edit = new EditController(this);
        this._enterGridEdit = () => {
            if (!this._remote)
                return;
            this._gridDraft = normalizeGrid(this._remote.grid_layout, this._remote.buttons ?? []);
            this._gridEditing = true;
            // Z2M discovers actions lazily — pick up anything pressed since setup
            void this._refreshActions(true);
        };
        this._cancelGridEdit = () => {
            this._gridEditing = false;
            this._gridDraft = undefined;
            this._pickerOpen = false;
            this._buttonSheet = undefined;
        };
        this._onGridPicked = (e) => {
            const draft = this._gridDraft;
            if (!draft || !this._remote)
                return;
            this._gridDraft = resizeGrid(draft, e.detail.rows, e.detail.cols, this._remote.buttons ?? []);
            this._pickerOpen = false;
        };
        // ── import wizard ──────────────────────────────────────────────────
        this._openImport = async () => {
            this._importError = undefined;
            this._importOverwrite = false;
            this._importBusy = false;
            try {
                const scan = await this._hass.callWS({
                    type: "remote_mapper/scan_import",
                    entry_id: this._entryId,
                });
                this._importSelected = new Set(scan.proposals.flatMap((p, i) => (p.conflict ? [] : [i])));
                this._importScan = scan;
            }
            catch (err) {
                this._error = errorText(err);
            }
        };
        this._enterEdit = () => {
            this._edit.enter();
            const actions = this._remote?.layout?.actions ?? [];
            const layout = this._currentLayout();
            if (layout) {
                const byId = new Map(layout.widgets.map((w) => [w.id, w]));
                this._edit.ensureTiles((id) => byId.get(id) ?? defaultLayout([id]).widgets[0], actions);
            }
        };
    }
    _backdropClick(close) {
        return (e) => {
            if (e.target !== e.currentTarget)
                return;
            if (Date.now() - this._modalOpenedAt < 350)
                return;
            close();
        };
    }
    // ── HA plumbing ────────────────────────────────────────────────────
    set hass(hass) {
        this._hass = hass;
        // the button sheet shows live automation state — keep it current
        if (this._buttonSheet !== undefined)
            this.requestUpdate();
        if (!this._fetchStarted && this._config) {
            this._fetchStarted = true;
            void this._initialize();
        }
    }
    setConfig(config) {
        this._config = config;
        this._entryId = config.entry_id;
        this._fetchStarted = false;
        this._cancelGridEdit();
        if (this._hass) {
            this._fetchStarted = true;
            void this._initialize();
        }
    }
    getCardSize() {
        if (this._isGrid()) {
            const grid = this._gridLayout();
            const perRow = displayOf(this._config) === "all" ? 2 : 1;
            return grid ? 1 + grid.rows * perRow : 3;
        }
        const layout = this._currentLayout();
        return layout ? 1 + Math.ceil(layout.design_size.height / 100) : 3;
    }
    getGridOptions() {
        return { columns: 12, min_columns: 6 };
    }
    static getConfigElement() {
        return document.createElement("remote-mapper-card-editor");
    }
    static getStubConfig() {
        return { layout: "grid", display: "assisted" };
    }
    connectedCallback() {
        super.connectedCallback();
        this._resizeObserver = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width ?? 0;
            if (width && Math.abs(width - this._hostWidth) > 0.5) {
                this._hostWidth = width;
            }
        });
        this._resizeObserver.observe(this);
        if (this._edit.tryResume())
            this.requestUpdate();
        if (this._fetchStarted && !this._unsubEvents)
            void this._subscribe();
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this._resizeObserver?.disconnect();
        this._unsubEvents?.();
        this._unsubEvents = undefined;
        this._unsubActions?.();
        this._unsubActions = undefined;
        this._edit.detach();
        clearTimeout(this._tipTimer);
        clearTimeout(this._tipHideTimer);
        this._tip = undefined;
    }
    async _initialize() {
        try {
            if (!this._entryId) {
                const res = await this._hass.callWS({
                    type: "remote_mapper/list_remotes",
                });
                if (res.remotes.length === 1) {
                    this._entryId = res.remotes[0].entry_id;
                }
                else {
                    this._remoteChoices = res.remotes;
                    return;
                }
            }
            await this._fetchRemote();
            await this._subscribe();
        }
        catch (err) {
            this._error = errorText(err);
        }
    }
    async _subscribe() {
        if (this._unsubEvents)
            return;
        this._unsubEvents = await this._hass.connection.subscribeEvents((event) => {
            if (event.data.entry_id === this._entryId)
                void this._fetchRemote();
        }, UPDATED_EVENT);
        // physical presses light up the same way dashboard taps do
        this._unsubActions = await this._hass.connection.subscribeEvents((event) => {
            if (event.data.entry_id === this._entryId)
                this._flashAction(event.data.action_id);
        }, ACTION_EVENT);
    }
    _flashAction(actionId) {
        this._flash = actionId;
        if (this._flashTimer !== undefined)
            clearTimeout(this._flashTimer);
        this._flashTimer = setTimeout(() => {
            this._flashTimer = undefined;
            this._flash = undefined;
        }, 400);
    }
    async _fetchRemote() {
        try {
            this._remote = await this._hass.callWS({
                type: "remote_mapper/get_remote",
                entry_id: this._entryId,
            });
            this._error = undefined;
        }
        catch (err) {
            this._error = errorText(err);
        }
    }
    // ── EditHost ───────────────────────────────────────────────────────
    config() {
        return this._currentLayout();
    }
    scale() {
        return this._transform()?.scale ?? 1;
    }
    slotEl(id) {
        return this.shadowRoot?.querySelector(`[data-slot-id="${CSS.escape(id)}"]`) ?? null;
    }
    badgeEl() {
        return this.shadowRoot?.querySelector(".badge") ?? null;
    }
    async saveWorking(widgets) {
        const layout = this._currentLayout();
        if (!layout)
            return false;
        try {
            await this._hass.callWS({
                type: "remote_mapper/save_layout",
                entry_id: this._entryId,
                card_layout: { ...deepClone(layout), widgets },
            });
            return true;
        }
        catch (err) {
            this.notify(`Layout save failed: ${String(err)}`);
            return false;
        }
    }
    openSettings(id) {
        void this._openEditor(id);
    }
    /** In-app navigation (what HA's own navigate() does — no page reload). */
    _navigate(path) {
        window.history.pushState(null, "", path);
        window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
    }
    _automationEditPath(slot) {
        return slot?.materialized && slot.automation_id
            ? `/config/automation/edit/${slot.automation_id}`
            : undefined;
    }
    /**
     * Editor for the sequence's target when it's a scene or script — HA
     * keeps both editable at /config/{scene,script}/edit/{id}. Scenes are
     * addressed by their config id (state attribute), scripts by object id.
     */
    _targetEditor(slot) {
        // a materialized/shared slot's sequence is empty — read what runs
        const steps = slot?.sequence?.length ? slot.sequence : (slot?.live_actions ?? []);
        const first = steps[0];
        if (!first)
            return undefined;
        const action = first.action ?? first.service;
        let entity = first.target?.entity_id ?? first.entity_id ?? first.scene;
        if (Array.isArray(entity))
            entity = entity[0];
        if (typeof entity !== "string")
            return undefined;
        const name = this._hass?.states?.[entity]?.attributes?.friendly_name ?? entity;
        if (entity.startsWith("scene.") && (action === "scene.turn_on" || first.scene)) {
            const id = this._hass?.states?.[entity]?.attributes?.id;
            if (typeof id !== "string")
                return undefined; // yaml scene without id
            return { icon: "mdi:palette", title: `Edit scene: ${name}`, path: `/config/scene/edit/${id}` };
        }
        if (entity.startsWith("script.") && (action === "script.turn_on" || action === entity)) {
            return {
                icon: "mdi:script-text",
                title: `Edit script: ${name}`,
                path: `/config/script/edit/${entity.slice("script.".length)}`,
            };
        }
        if (typeof action === "string" && action.startsWith("script.") && action !== "script.turn_on") {
            const objectId = action.slice("script.".length);
            const scriptName = this._hass?.states?.[action]?.attributes?.friendly_name ?? objectId;
            return {
                icon: "mdi:script-text",
                title: `Edit script: ${scriptName}`,
                path: `/config/script/edit/${objectId}`,
            };
        }
        return undefined;
    }
    /** Originals an imported slot came from (still in HA, disabled). */
    _importedSources(slot) {
        const from = slot?.imported_from;
        if (!from)
            return [];
        const list = from.sources?.length ? from.sources : [from];
        return list.filter((s) => !!s.config_id);
    }
    notify(message) {
        // native HA toast (DDC layout-persistence pattern)
        window.dispatchEvent(new CustomEvent("hass-notification", { detail: { message } }));
    }
    // ── layout helpers ─────────────────────────────────────────────────
    _currentLayout() {
        if (!this._remote)
            return undefined;
        const actions = this._remote.layout?.actions ?? [];
        const stored = this._remote.card_layout;
        const base = stored && Array.isArray(stored.widgets) && stored.design_size
            ? stored
            : defaultLayout(actions);
        // tiles for actions probed after the layout was saved
        const have = new Set(base.widgets.map((w) => w.id));
        const missing = actions.filter((a) => !have.has(a));
        if (!missing.length)
            return { ...base, canvas_id: this._entryId };
        const extra = defaultLayout(missing).widgets.map((w, i) => ({
            ...w,
            y: base.design_size.height + TILE_GAP + Math.floor(i / 3) * (TILE_H + TILE_GAP),
        }));
        return {
            ...base,
            canvas_id: this._entryId,
            design_size: {
                width: base.design_size.width,
                height: base.design_size.height +
                    (Math.floor((extra.length - 1) / 3) + 1) * (TILE_H + TILE_GAP) +
                    TILE_GAP,
            },
            widgets: [...base.widgets, ...extra],
        };
    }
    _transform() {
        const layout = this._currentLayout();
        if (!layout)
            return undefined;
        const width = this._hostWidth || this.getBoundingClientRect().width || 300;
        return computeTransform(layout.design_size, width);
    }
    _renderTitle() {
        if (this._config?.show_title === false)
            return b `<span class="title"></span>`;
        return b `<span class="title">${this._config?.title || this._remote?.title}</span>`;
    }
    // ── grid layout (plan 04) ──────────────────────────────────────────
    _isGrid() {
        return layoutOf(this._config) === "grid";
    }
    /** Draft while editing, else the stored layout normalized to the buttons. */
    _gridLayout() {
        if (!this._remote)
            return undefined;
        if (this._gridEditing && this._gridDraft)
            return this._gridDraft;
        return normalizeGrid(this._remote.grid_layout, this._remote.buttons ?? []);
    }
    _slotViews() {
        const out = {};
        if (!this._remote)
            return out;
        const stale = new Set(this._remote.stale_actions ?? []);
        for (const button of this._remote.buttons ?? []) {
            for (const a of button.actions) {
                const slot = this._remote.slots[a.action_id];
                out[a.action_id] = {
                    assigned: !!slot,
                    archived: !!slot?.archived || this._automationState(slot) === "off",
                    summary: this._slotSummary(slot),
                    error: slot?.branch_missing
                        ? "The automation has no branch for this event any more — edit the slot to re-add it"
                        : (slot?.last_error ?? null),
                    stale: stale.has(a.action_id),
                };
            }
        }
        return out;
    }
    /** Re-probe the source; quiet=true only toasts when something changed. */
    async _refreshActions(quiet = false) {
        try {
            const res = await this._hass.callWS({ type: "remote_mapper/refresh_actions", entry_id: this._entryId });
            if (res.added.length) {
                this.notify(`Found new actions: ${res.added.join(", ")}`);
                if (this._gridEditing && this._remote) {
                    // fold them into the draft so they show up in this edit session
                    await this._fetchRemote();
                    this._gridDraft = normalizeGrid(this._gridDraft, this._remote.buttons ?? []);
                }
            }
            else if (!quiet) {
                this.notify(res.probed
                    ? "No new actions — press each button once (all press types), then refresh again"
                    : "This source can't enumerate actions");
            }
        }
        catch (err) {
            this.notify(`Refresh failed: ${String(err)}`);
        }
    }
    async _saveGridEdit() {
        const draft = this._gridDraft;
        if (!draft) {
            this._cancelGridEdit();
            return;
        }
        try {
            await this._hass.callWS({
                type: "remote_mapper/save_layout",
                entry_id: this._entryId,
                grid_layout: trimLabels(draft),
            });
            this._cancelGridEdit();
        }
        catch (err) {
            this.notify(`Layout save failed: ${String(err)}`);
        }
    }
    // ── slot interactions ──────────────────────────────────────────────
    async _runSlot(actionId) {
        const slot = this._remote?.slots[actionId];
        if (!slot || slot.archived)
            return;
        this._flashAction(actionId);
        try {
            await this._hass.callWS({
                type: "remote_mapper/run_slot",
                entry_id: this._entryId,
                action_id: actionId,
            });
        }
        catch (err) {
            this._error = errorText(err);
        }
    }
    _isLinked(slot) {
        return !!slot?.materialized && !!slot.automation_id && slot.owned === false;
    }
    /** Live state of a materialized/linked slot's automation ("on"/"off"). */
    _automationState(slot) {
        const entity = slot?.automation_entity_id;
        return entity ? this._hass?.states?.[entity]?.state : undefined;
    }
    /** User name if set, else the automation's name, else inferred (naming.ts). */
    _slotSummary(slot) {
        if (!slot)
            return "unassigned";
        if (slot.name)
            return slot.name;
        if (slot.materialized && slot.branch_missing)
            return "no branch";
        if (slot.materialized && slot.shared_automation) {
            // one branch of the shared automation: its alias says nothing
            return inferName(slot.live_actions ?? [], this._hass) || "empty branch";
        }
        if (slot.materialized) {
            const entity = slot.automation_entity_id;
            const friendly = entity
                ? this._hass?.states?.[entity]?.attributes?.friendly_name
                : undefined;
            return typeof friendly === "string" && friendly ? friendly : "automation";
        }
        return inferName(slot.sequence ?? [], this._hass) || "empty";
    }
    // ── slot editor modal ──────────────────────────────────────────────
    async _openEditor(actionId) {
        const slot = this._remote?.slots[actionId];
        const sequence = (slot?.sequence ?? []);
        const quick = inferQuick(sequence);
        this._editingAction = actionId;
        this._modalOpenedAt = Date.now();
        this._quickMode = quick.mode === "custom" ? "scene" : quick.mode;
        this._quickEntity = quick.entity;
        if (this._isLinked(slot)) {
            this._quickMode = "link";
            this._quickEntity = slot?.automation_entity_id ?? "";
        }
        this._quickOption = quick.option;
        this._snapEntities = [...(this._remote?.snapshot_entities ?? [])];
        this._snapRemember = false;
        this._editorTab = quick.mode === "custom" && sequence.length ? "yaml" : "quick";
        this._draft = JSON.stringify(sequence, null, 2);
        this._draftName = slot?.name ?? "";
        this._yamlValue = sequence;
        this._yamlValid = true;
        this._draftError = undefined;
        this._draftMaterialized = slot?.materialized ?? false;
        this._editingLive = undefined;
        void ensureHaForm().then((ok) => {
            this._haFormOk = ok;
        });
        void ensureYamlEditor().then((ok) => {
            this._yamlEditorOk = ok;
        });
        if (slot?.materialized) {
            // Automation is canonical — fetch its current actions so a
            // dematerialize save folds the live version back in.
            void this._hass.callWS({
                type: "remote_mapper/get_slot",
                entry_id: this._entryId,
                action_id: actionId,
            }).then((res) => {
                if (this._editingAction === actionId && res.live) {
                    this._editingLive = res.live;
                    this._yamlValue = res.live.actions ?? [];
                    this._draft = JSON.stringify(res.live.actions ?? [], null, 2);
                    this._editorTab = "yaml";
                }
            });
        }
    }
    _closeEditor() {
        this._editingAction = undefined;
        this._draftError = undefined;
        this._editingLive = undefined;
        this._clearArtifacts = undefined;
    }
    /** "Create new" modes: make the thing, bind it, and (automations) go edit it. */
    async _createNew() {
        const name = this._draftName.trim() || null;
        try {
            if (this._quickMode === "new_scene") {
                if (!this._snapEntities.length) {
                    this._draftError = "Pick at least one entity to capture";
                    return;
                }
                await this._hass.callWS({
                    type: "remote_mapper/create_snapshot",
                    entry_id: this._entryId,
                    action_id: this._editingAction,
                    entities: this._snapEntities,
                    remember_entities: this._snapRemember,
                    ...(name ? { name } : {}),
                });
                this._closeEditor();
                return;
            }
            const res = await this._hass.callWS({
                type: "remote_mapper/create_automation",
                entry_id: this._entryId,
                action_id: this._editingAction,
                scope: this._quickMode === "new_automation" ? "button" : "remote",
                name,
            });
            this._closeEditor();
            // the body is theirs to write — hand them HA's editor right away
            this._navigate(res.edit_url);
        }
        catch (err) {
            this._draftError = err.message ?? String(err);
        }
    }
    async _saveDraft() {
        if (this._editorTab === "quick" && CREATE_MODES.has(this._quickMode)) {
            await this._createNew();
            return;
        }
        const msg = {
            type: "remote_mapper/save_slot",
            entry_id: this._entryId,
            action_id: this._editingAction,
            materialized: this._draftMaterialized,
            name: this._draftName.trim() || null,
        };
        if (this._editorTab === "quick" && this._quickMode === "link") {
            if (!this._quickEntity) {
                this._draftError = "Pick an automation first";
                return;
            }
            // Link: no sequence, no materialize toggle — the automation is canonical
            delete msg.materialized;
            msg.link_entity_id = this._quickEntity;
        }
        else if (this._editorTab === "quick") {
            if (!this._quickEntity) {
                this._draftError = "Pick an entity first";
                return;
            }
            if (this._quickMode === "wled_preset" && !this._quickOption) {
                this._draftError = "Pick a preset first";
                return;
            }
            msg.sequence = quickSequence(this._quickMode, this._quickEntity, this._quickOption);
        }
        else if (this._yamlEditorOk) {
            if (!this._yamlValid) {
                this._draftError = "YAML is not valid";
                return;
            }
            msg.sequence = this._yamlValue ?? [];
        }
        else {
            msg.sequence_yaml = this._draft;
        }
        try {
            await this._hass.callWS(msg);
            this._closeEditor();
        }
        catch (err) {
            this._draftError = err.message ?? String(err);
        }
    }
    async _clearSlot(decision) {
        const res = await this._hass.callWS({
            type: "remote_mapper/clear_slot",
            entry_id: this._entryId,
            action_id: this._editingAction,
            ...(decision ? { decision, remember: this._clearRemember } : {}),
        });
        if (res.needs_decision) {
            this._clearRemember = false;
            this._clearArtifacts = res.artifacts;
            return;
        }
        this._clearArtifacts = undefined;
        this._closeEditor();
    }
    async _snapshot(reSnapshot) {
        try {
            await this._hass.callWS({
                type: "remote_mapper/create_snapshot",
                entry_id: this._entryId,
                action_id: this._editingAction,
                re_snapshot: reSnapshot,
            });
            this._closeEditor();
        }
        catch (err) {
            this._draftError = err.message ?? String(err);
        }
    }
    async _toggleArchived() {
        const slot = this._remote?.slots[this._editingAction];
        if (!slot)
            return;
        await this._hass.callWS({
            type: "remote_mapper/archive_slot",
            entry_id: this._entryId,
            action_id: this._editingAction,
            archived: !slot.archived,
        });
        this._closeEditor();
    }
    // ── hand back to HA ────────────────────────────────────────────────
    /** What the release will do, counted from the current slots. */
    _releasePlan() {
        let imported = 0;
        let linked = 0;
        let materialized = 0;
        let built = 0;
        for (const slot of Object.values(this._remote?.slots ?? {})) {
            if (slot.imported_from)
                imported++;
            else if (this._isLinked(slot))
                linked++;
            else if (slot.materialized)
                materialized++;
            else if (slot.sequence?.length && !slot.archived)
                built++;
        }
        return { imported, linked, materialized, built };
    }
    async _release() {
        this._releaseBusy = true;
        try {
            const res = await this._hass.callWS({
                type: "remote_mapper/release_remote",
                entry_id: this._entryId,
                convert_remaining: this._releaseConvert,
            });
            this._releaseOpen = false;
            this._cancelGridEdit();
            this._edit.cancel();
            this.notify(`Handed back: ${res.reenabled.length} original(s) re-enabled, ` +
                `${res.converted.length} converted, ${res.kept.length} kept, ` +
                `${res.dropped.length} dropped.`);
            this._unsubEvents?.();
            this._unsubEvents = undefined;
            this._unsubActions?.();
            this._unsubActions = undefined;
            this._remote = undefined;
            this._error =
                "This remote was handed back to Home Assistant and removed from Remote " +
                    "Mapper. Delete this card, or pick another remote in the card editor.";
        }
        catch (err) {
            this.notify(`Hand back failed: ${err.message ?? String(err)}`);
        }
        finally {
            this._releaseBusy = false;
        }
    }
    _renderRelease() {
        const plan = this._releasePlan();
        const close = () => {
            this._releaseOpen = false;
        };
        return b `
      <div class="modal-backdrop" @click=${this._backdropClick(close)}>
        <div class="modal" @click=${(e) => e.stopPropagation()}>
          <h3>Hand "${this._remote?.title}" back to Home Assistant</h3>
          <p class="hint">
            Removes this remote from Remote Mapper and leaves Home Assistant the
            way it would have been without it — nothing is deleted.
          </p>
          <ul class="release-list">
            <li>
              <b>${plan.imported}</b> imported event(s): the original
              automation(s) are <b>re-enabled</b>, the mapping goes away.
            </li>
            <li>
              <b>${plan.linked}</b> linked event(s): the native automation is
              <b>left untouched</b>.
            </li>
            <li>
              <b>${plan.materialized}</b> automation-backed event(s): the
              automation is <b>kept</b>, renamed to a plain alias.
            </li>
            <li>
              <label>
                <input
                  type="checkbox"
                  .checked=${this._releaseConvert}
                  @change=${(e) => {
            this._releaseConvert = e.target.checked;
        }}
                />
                <b>${plan.built}</b> event(s) built in the card: <b>convert</b> to
                plain automations so the buttons keep working (unticked: dropped).
              </label>
            </li>
            <li>Snapshot scenes are kept as ordinary scenes.</li>
            <li>The grid layout and this card's mapping are removed.</li>
          </ul>
          <div class="buttons">
            <button class="danger" ?disabled=${this._releaseBusy} @click=${this._release}>
              Hand back
            </button>
            <button @click=${close}>Cancel</button>
          </div>
        </div>
      </div>
    `;
    }
    _closeImport() {
        this._importScan = undefined;
    }
    async _applyImport() {
        const scan = this._importScan;
        const proposals = scan.proposals.filter((_, i) => this._importSelected.has(i));
        if (!proposals.length) {
            this._closeImport();
            return;
        }
        this._importBusy = true;
        try {
            await this._hass.callWS({
                type: "remote_mapper/apply_import",
                entry_id: this._entryId,
                proposals,
                overwrite: this._importOverwrite,
            });
            this._closeImport();
        }
        catch (err) {
            this._importError = err.message ?? String(err);
        }
        finally {
            this._importBusy = false;
        }
    }
    // ── render ─────────────────────────────────────────────────────────
    render() {
        if (this._error) {
            return b `<ha-card header="Remote Mapper">
        <div class="content error">${this._error}</div>
      </ha-card>`;
        }
        if (this._remoteChoices) {
            return b `<ha-card header="Remote Mapper">
        <div class="content">
          ${this._remoteChoices.length === 0
                ? b `<p class="hint">
                  No remote is set up yet. Add one — pick the device (Zigbee2MQTT,
                  ZHA, Matter, MQTT…), press its buttons once — and this card
                  fills in by itself.
                </p>
                <div class="buttons">
                  <button @click=${() => this._navigate(ADD_REMOTE_PATH)}>
                    Add a remote
                  </button>
                </div>`
                : b `<p class="hint">
                  Several remotes exist — pick one in the card editor (the
                  <b>Remote</b> dropdown), or set <code>entry_id</code> in YAML:
                </p>
                <ul>
                  ${this._remoteChoices.map((r) => b `<li>${r.title}: <code>${r.entry_id}</code></li>`)}
                </ul>`}
        </div>
      </ha-card>`;
        }
        if (!this._remote) {
            return b `<ha-card header="Remote Mapper">
        <div class="content">Loading…</div>
      </ha-card>`;
        }
        if (this._isGrid())
            return this._renderGridCard();
        const editing = this._edit.active;
        return b `
      <ha-card>
        <div class="header">
          ${this._renderTitle()}
          <span class="header-buttons">
            ${editing
            ? b `
                  ${this._iconButton("mdi:refresh", "Look for new actions (press the buttons first)", () => void this._refreshActions())}
                  ${this._iconButton("mdi:import", "Import existing automations", this._openImport)}
                  ${this._iconButton("mdi:export", "Hand this remote back to HA…", () => {
                this._releaseOpen = true;
            })}
                  ${this._iconButton("mdi:undo", "Undo", () => this._edit.undo(), {
                disabled: !this._edit.canUndo,
            })}
                  ${this._iconButton("mdi:close", "Cancel (Esc)", () => this._edit.cancel())}
                  ${this._iconButton("mdi:check", "Done — save layout", () => void this._edit.done(), {
                active: true,
            })}
                `
            : this._iconButton("mdi:pencil", "Edit layout & slots", this._enterEdit)}
          </span>
        </div>
        ${this._renderTip()}
        ${this._renderCanvas(editing)}
        ${this._editingAction !== undefined ? this._renderEditor() : A}
        ${this._importScan ? this._renderImport() : A}
        ${this._releaseOpen ? this._renderRelease() : A}
      </ha-card>
    `;
    }
    _renderGridCard() {
        const remote = this._remote;
        const editing = this._gridEditing;
        const layout = this._gridLayout();
        const buttons = remote.buttons ?? [];
        return b `
      <ha-card>
        <div class="header">
          ${this._renderTitle()}
          <span class="header-buttons">
            ${editing
            ? b `
                  ${this._iconButton("mdi:view-grid-plus-outline", "Grid shape (rows × columns)", () => {
                this._pickerOpen = !this._pickerOpen;
            }, { active: this._pickerOpen })}
                  ${this._iconButton("mdi:refresh", "Look for new actions (press the buttons first)", () => void this._refreshActions())}
                  ${this._iconButton("mdi:import", "Import existing automations", this._openImport)}
                  ${this._iconButton("mdi:export", "Hand this remote back to HA…", () => {
                this._releaseOpen = true;
            })}
                  ${this._iconButton("mdi:close", "Cancel", this._cancelGridEdit)}
                  ${this._iconButton("mdi:check", "Done — save layout", () => void this._saveGridEdit(), {
                active: true,
            })}
                `
            : this._iconButton("mdi:pencil", "Edit layout & slots", this._enterGridEdit)}
          </span>
        </div>
        ${this._renderTip()}
        ${editing && this._pickerOpen
            ? b `<div class="picker-dock">
              <remote-mapper-grid-picker
                .rows=${layout.rows}
                .cols=${layout.cols}
                .minCells=${buttons.length}
                @grid-picked=${this._onGridPicked}
              ></remote-mapper-grid-picker>
            </div>`
            : A}
        ${editing
            ? b `<p class="hint grid-hint">· Tap a button to rename it or edit its events</p>
            <p class="hint grid-hint">· Drag a button onto another cell to swap</p>`
            : A}
        ${buttons.length === 0
            ? A // an empty grid is just blank space; the hint below says what to do
            : b `
          <remote-mapper-grid
            style=${styleVarsOf(this._config)}
            .buttons=${buttons}
            .layout=${layout}
            .slots=${this._slotViews()}
            .display=${displayOf(this._config)}
            .assistedTrigger=${assistedTriggerOf(this._config)}
            .chipsLayout=${chipsLayoutOf(this._config)}
            .editing=${editing}
            .flash=${this._flash}
            @run-action=${(e) => void this._runSlot(e.detail.actionId)}
            @edit-action=${(e) => void this._openEditor(e.detail.actionId)}
            @open-button=${(e) => {
                this._buttonSheet = e.detail.buttonId;
                this._modalOpenedAt = Date.now();
            }}
            @layout-changed=${(e) => {
                this._gridDraft = e.detail.layout;
            }}
          ></remote-mapper-grid>
            `}
        ${buttons.length === 0
            ? b `<div class="grid-hint">
              <p class="hint">
                No buttons known yet. Press each button on the remote once (every
                gesture you want: single, double, hold), then look again — the
                card also checks on every Home Assistant start and whenever you
                open edit mode.
              </p>
              <div class="buttons">
                <button @click=${() => void this._refreshActions()}>Look for buttons now</button>
              </div>
            </div>`
            : A}
        ${this._buttonSheet !== undefined ? this._renderButtonSheet() : A}
        ${this._editingAction !== undefined ? this._renderEditor() : A}
        ${this._importScan ? this._renderImport() : A}
        ${this._releaseOpen ? this._renderRelease() : A}
      </ha-card>
    `;
    }
    /**
     * HA-native 48px icon button (mdi icon name) — same control HA's own
     * cards use. Hover shows the native title; a long press (touch) shows
     * the same text in a bubble and swallows the tap.
     */
    _iconButton(icon, title, onClick, opts = {}) {
        const clearTimer = () => {
            if (this._tipTimer !== undefined) {
                clearTimeout(this._tipTimer);
                this._tipTimer = undefined;
            }
        };
        // finger lifted (or the browser took the gesture): linger, then go
        const release = () => {
            clearTimer();
            if (this._tip)
                this._hideTipIn(1500);
        };
        return b `<ha-icon-button
      class=${opts.active ? "active" : ""}
      .label=${title}
      title=${title}
      ?disabled=${opts.disabled}
      @pointerdown=${(e) => {
            if (e.pointerType === "mouse")
                return;
            clearTimer();
            this._hideTipIn(0);
            this._tipShown = false;
            const anchor = e.currentTarget;
            this._tipTimer = setTimeout(() => {
                this._tipTimer = undefined;
                this._tipShown = true;
                this._tip = tipAnchor(title, anchor.getBoundingClientRect(), window.innerWidth);
                // backstop in case no pointerup/cancel ever reaches us
                this._hideTipIn(4000);
            }, 450);
        }}
      @pointerup=${release}
      @pointercancel=${release}
      @pointerleave=${release}
      @contextmenu=${(e) => {
            if (this._tipShown)
                e.preventDefault();
        }}
      @click=${(e) => {
            if (this._tipShown) {
                // the long press was a "what is this?" — not a command
                e.stopPropagation();
                this._tipShown = false;
                return;
            }
            // handlers may be plain methods — keep `this` bound to the card
            onClick.call(this, e);
        }}
    >
      <ha-icon icon=${icon}></ha-icon>
    </ha-icon-button>`;
    }
    /** (Re)schedule the long-press bubble to disappear; 0 hides it now. */
    _hideTipIn(ms) {
        clearTimeout(this._tipHideTimer);
        this._tipHideTimer = undefined;
        if (ms <= 0) {
            this._tip = undefined;
            return;
        }
        this._tipHideTimer = setTimeout(() => {
            this._tipHideTimer = undefined;
            this._tip = undefined;
        }, ms);
    }
    _renderTip() {
        const tip = this._tip;
        if (!tip)
            return A;
        const side = tip.right !== undefined ? `right:${tip.right}px` : `left:${tip.left}px`;
        return b `<div class="tip" role="tooltip" style="top:${tip.top}px;${side}">${tip.text}</div>`;
    }
    /** One button's events: rename (edit mode), run, or open the slot editor. */
    _renderButtonSheet() {
        const remote = this._remote;
        const layout = this._gridLayout();
        const button = (remote.buttons ?? []).find((b) => b.id === this._buttonSheet);
        if (!button)
            return b ``;
        const views = this._slotViews();
        const close = () => {
            this._buttonSheet = undefined;
        };
        return b `
      <div class="modal-backdrop" @click=${this._backdropClick(close)}>
        <div class="modal" @click=${this._ghostGuard}>
          <h3>
            ${buttonLabel(button, layout)}
            <span class="hint">(${button.id})</span>
          </h3>
          ${this._gridEditing
            ? b `<label class="hint row">
                Label
                <input
                  class="label-input"
                  type="text"
                  .value=${layout.buttons[button.id]?.label ?? ""}
                  placeholder=${button.id}
                  @input=${(e) => {
                if (this._gridDraft) {
                    this._gridDraft = setButtonLabel(this._gridDraft, button.id, e.target.value);
                }
            }}
                />
              </label>`
            : A}
          <ul class="event-list">
            ${button.actions.map((a) => {
            const view = views[a.action_id];
            return b `
                <li class=${view?.assigned ? "on" : ""}>
                  <span class="ev-main">
                    <span class="ev-icon" title=${KIND_TITLE[a.kind]}
                      >${KIND_ICON[a.kind]}</span
                    >
                    <span class="ev-name">${a.event}</span>
                    <span class="ev-summary">${view?.summary ?? "unassigned"}</span>
                  </span>
                  <span class="ev-actions">
                  ${this._iconButton("mdi:play", "Run now", () => void this._runSlot(a.action_id), {
                disabled: !view?.assigned || !!view.archived,
            })}
                  ${(() => {
                const target = this._targetEditor(remote.slots[a.action_id]);
                return target
                    ? this._iconButton(target.icon, target.title, () => this._navigate(target.path))
                    : A;
            })()}
                  ${(() => {
                // chips, fixed order: the slot's own automation (own,
                // shared or linked), then every imported original —
                // all at once, so a multi-source event keeps its trail
                const slot = remote.slots[a.action_id];
                const path = this._automationEditPath(slot);
                const chips = [];
                if (path) {
                    const off = this._automationState(slot) === "off";
                    const linked = this._isLinked(slot);
                    const kind = slot?.shared_automation
                        ? "Remote automation (this event's branch)"
                        : linked
                            ? "Linked automation"
                            : "Automation";
                    chips.push(this._iconButton(off ? "mdi:robot-off" : "mdi:robot", `${kind}${off ? " (DISABLED)" : ""} — open in HA's editor`, () => this._navigate(path), { active: !off && (linked || !!slot?.shared_automation) }));
                }
                chips.push(...this._importedSources(slot).map((src) => {
                    // live state: an original that got re-enabled fires in
                    // parallel with this slot on every press — say so
                    const enabled = !!src.entity_id && this._hass?.states?.[src.entity_id]?.state === "on";
                    const label = src.entity_id ?? src.config_id;
                    return this._iconButton(enabled ? "mdi:robot" : "mdi:robot-off", enabled
                        ? `Imported original is ENABLED — it also runs on this press: ${label}`
                        : `Open the imported original (disabled): ${label}`, () => this._navigate(`/config/automation/edit/${src.config_id}`), { active: enabled });
                }));
                return chips;
            })()}
                  ${this._iconButton("mdi:pencil", "Edit", () => void this._openEditor(a.action_id))}
                  </span>
                </li>
              `;
        })}
          </ul>
          <div class="buttons">
            <button @click=${close}>Close</button>
          </div>
        </div>
      </div>
    `;
    }
    _renderCanvas(editing) {
        const layout = this._currentLayout();
        const t = this._transform();
        const widgets = editing ? this._edit.working : layout.widgets;
        const selected = this._edit.selectedId;
        return b `
      <div
        class="viewport ${editing ? "editing" : ""}"
        style="height:${t.viewportHeight}px"
        @pointerdown=${(e) => {
            if (!editing)
                this._edit.onViewPointerDown(e);
            else
                this._edit.select(null);
        }}
        @pointermove=${(e) => this._edit.onViewPointerMove(e)}
        @pointerup=${() => this._edit.cancelLongPress()}
      >
        <div
          class="canvas"
          style="width:${layout.design_size.width}px;height:${layout.design_size
            .height}px;transform:translate(${t.offsetX}px, ${t.offsetY}px) scale(${t.scale})"
        >
          ${widgets.map((w) => this._renderTile(w, editing, w.id === selected))}
        </div>
        ${editing ? this._renderEditChrome() : A}
      </div>
    `;
    }
    _renderTile(w, editing, selected) {
        const slot = this._remote.slots[w.id];
        const classes = [
            "widget-slot",
            "tile",
            slot ? "assigned" : "empty",
            slot?.archived ? "archived" : "",
            this._flash === w.id ? "flash" : "",
            selected ? "selected" : "",
        ].join(" ");
        return b `
      <div
        class=${classes}
        data-slot-id=${w.id}
        style="transform:translate3d(${w.x}px, ${w.y}px, 0);width:${w.w}px;height:${w.h}px;z-index:${w.z ?? 1}"
        @pointerdown=${(e) => {
            if (editing)
                this._edit.onSlotPointerDown(e, w.id);
        }}
        @click=${() => {
            if (!editing)
                void this._runSlot(w.id);
        }}
        @dblclick=${() => {
            if (editing)
                this.openSettings(w.id);
        }}
      >
        <span class="action">${w.id}</span>
        <span class="summary">${this._slotSummary(slot)}</span>
        ${slot?.last_error
            ? b `<span class="tile-badge error-badge" title=${slot.last_error}
              >!</span
            >`
            : A}
        ${slot?.archived
            ? b `<span class="tile-badge">archived</span>`
            : A}
        ${this._remote.stale_actions?.includes(w.id)
            ? b `<span
              class="tile-badge warn"
              title="The source no longer reports this action (renamed upstream?)"
              >stale</span
            >`
            : A}
        ${editing && selected
            ? b `${["nw", "ne", "sw", "se"].map((corner) => b `
                <span
                  class="handle ${corner}"
                  @pointerdown=${(e) => this._edit.onHandlePointerDown(e, w.id, corner)}
                ></span>
              `)}`
            : A}
      </div>
    `;
    }
    _renderEditChrome() {
        const sel = this._edit.selected;
        const t = this._transform();
        const steps = this._edit.dpadSteps;
        const stepLabel = this._edit.dpadMode === "fine"
            ? "1"
            : steps.x === steps.y
                ? `${steps.x}`
                : `${steps.x}·${steps.y}`;
        const press = (dx, dy) => (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
            this._edit.dpadPress(dx, dy);
        };
        const release = () => this._edit.dpadRelease();
        return b `
      ${sel ? this._renderChipbar(sel, t) : A}
      <div class="dpad-dock" @pointerdown=${(e) => e.stopPropagation()}>
        ${sel ? b `<div class="badge"></div>` : A}
        <div class="dpad">
          <span></span>
          <button ?disabled=${!sel} @pointerdown=${press(0, -1)}
            @pointerup=${release} @pointercancel=${release}
            @lostpointercapture=${release}>▲</button>
          <span></span>
          <button ?disabled=${!sel} @pointerdown=${press(-1, 0)}
            @pointerup=${release} @pointercancel=${release}
            @lostpointercapture=${release}>◀</button>
          <button class="step" title="Toggle nudge step (1 unit ↔ grid cell)"
            @click=${() => this._edit.toggleDpadStep()}>${stepLabel}</button>
          <button ?disabled=${!sel} @pointerdown=${press(1, 0)}
            @pointerup=${release} @pointercancel=${release}
            @lostpointercapture=${release}>▶</button>
          <span></span>
          <button ?disabled=${!sel} @pointerdown=${press(0, 1)}
            @pointerup=${release} @pointercancel=${release}
            @lostpointercapture=${release}>▼</button>
          <span></span>
        </div>
      </div>
    `;
    }
    _renderChipbar(sel, t) {
        const vw = this._hostWidth || 300;
        const cx = t.offsetX + (sel.x + sel.w / 2) * t.scale;
        const topPx = t.offsetY + sel.y * t.scale;
        const flip = topPx < 46;
        const top = flip ? t.offsetY + (sel.y + sel.h) * t.scale + 6 : topPx - 6;
        const left = Math.min(Math.max(cx, 110), Math.max(110, vw - 110));
        return b `
      <div
        class="chipbar"
        style="left:${left}px;top:${top}px;transform:translate(-50%, ${flip
            ? "0"
            : "-100%"})"
        @pointerdown=${(e) => e.stopPropagation()}
      >
        <button title="Slot settings" @click=${() => this.openSettings(sel.id)}>
          ⚙
        </button>
        <button title="Send backward" @click=${() => this._edit.zOp("backward")}>
          ↓
        </button>
        <button title="Bring forward" @click=${() => this._edit.zOp("forward")}>
          ↑
        </button>
      </div>
    `;
    }
    _renderEditor() {
        const slot = this._remote.slots[this._editingAction];
        return b `
      <div class="modal-backdrop" @click=${this._backdropClick(this._closeEditor)}>
        <div class="modal" @click=${this._ghostGuard}>
          <h3>${this._editingAction}</h3>
          ${this._editingLive
            ? b `<p class="hint">
                ${this._editingLive.owned === false ? "Linked to" : "Backed by"}
                <b>${this._editingLive.alias}</b>
                ${this._editingLive.state === "off" ? b `<span class="warn">(disabled)</span>` : A}
                —
                <button
                  class="link"
                  @click=${() => this._navigate(this._editingLive.edit_url)}
                >
                  open in HA's automation editor
                </button>.
                ${this._editingLive.branch_missing
                ? b `<span class="warn">It has no branch for this event any more.</span>
                      Pick "Add this button to the remote automation" below to re-add one.`
                : this._editingLive.branch
                    ? 'This event is one branch of it. Unticking "automation" below moves the branch\'s actions into this card and removes the branch; the other buttons keep theirs.'
                    : this._editingLive.owned === false
                        ? "It stays native and enabled; edit it there. Unticking the box below copies its actions into this card and disables it (hand-back re-enables it)."
                        : 'Unticking "automation" below deletes it on Save and moves its actions into this card. Cancel keeps things as they are.'}
              </p>`
            : A}
          <div class="tabs">
            <button
              class=${this._editorTab === "quick" ? "on" : ""}
              @click=${() => {
            this._editorTab = "quick";
        }}
            >
              Quick
            </button>
            <button
              class=${this._editorTab === "yaml" ? "on" : ""}
              @click=${() => {
            this._editorTab = "yaml";
        }}
            >
              YAML
            </button>
          </div>
          ${this._editorTab === "quick"
            ? this._renderQuickTab()
            : this._renderYamlTab()}
          <label class="hint row">
            Name
            <input
              class="label-input"
              type="text"
              .value=${this._draftName}
              placeholder=${this._autoNamePlaceholder()}
              @input=${(e) => {
            this._draftName = e.target.value;
        }}
            />
          </label>
          ${this._editorTab === "quick" && CREATE_MODES.has(this._quickMode)
            ? A
            : b `<label class="hint row">
                <input
                  type="checkbox"
                  .checked=${this._draftMaterialized}
                  @change=${(e) => {
                this._draftMaterialized = e.target.checked;
            }}
                />
                ${this._editingLive?.branch
                ? "Keep as a branch of the remote automation (untick to move it into the card)"
                : this._editingLive?.owned === false
                    ? "Keep linked to the automation (untick to absorb into the card)"
                    : "Create as automation (editable/traceable in HA)"}
              </label>`}
          ${this._draftError
            ? b `<p class="error">${this._draftError}</p>`
            : A}
          <div class="buttons">
            <button @click=${this._saveDraft}>
              ${this._editorTab === "quick" && this._quickMode === "new_scene"
            ? "📸 Capture"
            : this._editorTab === "quick" && CREATE_MODES.has(this._quickMode)
                ? "Create & open in HA"
                : "Save"}
            </button>
            <button @click=${this._closeEditor}>Cancel</button>
            ${slot?.scene_id
            ? b `<button
                  title="Same scene, same entities, new states"
                  @click=${() => this._snapshot(true)}
                >
                  Re-snapshot
                </button>`
            : A}
            ${slot
            ? b `
                  <button class="danger" @click=${() => this._clearSlot()}>
                    Clear
                  </button>
                  <button @click=${this._toggleArchived}>
                    ${slot.archived ? "Unarchive" : "Archive"}
                  </button>
                `
            : A}
          </div>
          ${this._clearArtifacts ? this._renderClearDialog() : A}
        </div>
      </div>
    `;
    }
    /** What the name will be if left empty — inferred from the current draft. */
    _autoNamePlaceholder() {
        let sequence = [];
        if (this._editorTab === "quick" && CREATE_MODES.has(this._quickMode)) {
            return this._quickMode === "new_scene"
                ? `Auto: ${this._remote?.title ?? "Remote"} ${this._editingAction ?? ""}`
                : "Auto (from the automation)";
        }
        if (this._editorTab === "quick" && this._quickMode === "link") {
            const friendly = this._quickEntity
                ? this._hass?.states?.[this._quickEntity]?.attributes?.friendly_name
                : undefined;
            return typeof friendly === "string" && friendly
                ? `Auto: ${friendly}`
                : "Auto (the automation's name)";
        }
        if (this._editorTab === "quick" && this._quickEntity) {
            sequence = quickSequence(this._quickMode, this._quickEntity, this._quickOption);
        }
        else if (this._yamlEditorOk) {
            sequence = this._yamlValue ?? [];
        }
        else {
            try {
                sequence = JSON.parse(this._draft || "[]");
            }
            catch {
                sequence = [];
            }
        }
        const auto = inferName(sequence, this._hass);
        return auto ? `Auto: ${auto}` : "Auto (from the action)";
    }
    _renderQuickTab() {
        if (!this._haFormOk) {
            return b `<p class="hint">
        Loading HA editor components… If this persists, use the YAML tab.
      </p>`;
        }
        const slot = this._remote?.slots[this._editingAction ?? ""];
        const hasShared = !!this._remote?.remote_automation;
        // "Create new" first: an empty button is usually a new thing, not a bind.
        // The whole-remote option turns into "add this button" once it exists,
        // and disappears for a slot that already is a (present) branch of it.
        const createOptions = [
            { value: "new_scene", label: "＋ Scene from current state" },
            { value: "new_automation", label: "＋ Automation for this button (fill in HA)" },
        ];
        if (!hasShared) {
            createOptions.push({
                value: "new_remote_automation",
                label: "＋ Automation for the whole remote (one branch per event)",
            });
        }
        else if (!slot?.shared_automation || slot.branch_missing) {
            createOptions.push({
                value: "new_remote_automation",
                label: "＋ Add this button to the remote automation",
            });
        }
        const schema = [
            {
                name: "mode",
                selector: {
                    select: {
                        mode: "dropdown",
                        options: [
                            ...createOptions,
                            { value: "scene", label: "Activate scene" },
                            { value: "toggle", label: "Toggle entity" },
                            { value: "script", label: "Run script" },
                            { value: "wled_preset", label: "Set WLED preset" },
                            { value: "link", label: "Link existing automation (stays native)" },
                        ],
                    },
                },
            },
        ];
        let createHint;
        if (this._quickMode === "new_scene") {
            schema.push({ name: "entities", selector: { entity: { multiple: true } } });
            schema.push({ name: "remember", selector: { boolean: {} } });
            createHint =
                "Set the room the way you like it first. Capture stores the current state of these entities as a scene bound to this event; Re-snapshot later updates it in place.";
        }
        else if (this._quickMode === "new_automation") {
            createHint =
                "Creates an automation with this event as its trigger and no actions, then opens HA's editor so you can fill it in. The card shows what you put there.";
        }
        else if (this._quickMode === "new_remote_automation") {
            createHint = hasShared
                ? "Appends a trigger and an empty branch for this event to the remote's automation, then opens it in HA's editor."
                : "Creates one automation for this remote: a trigger per event and a choose block with one branch per event (the blueprint look). Buttons you already built in the card move into their branch; buttons with their own automation stay as they are.";
        }
        if (this._quickMode === "link") {
            schema.push({
                name: "entity",
                selector: { entity: { domain: "automation" } },
            });
        }
        else if (this._quickMode === "wled_preset") {
            // WLED exposes presets as a select.*_preset entity; picking one is a
            // select.select_option call. Populate the preset list from the chosen
            // entity's `options` attribute, falling back to free text.
            schema.push({
                name: "entity",
                selector: { entity: { domain: "select", integration: "wled" } },
            });
            const stateObj = this._quickEntity
                ? this._hass?.states?.[this._quickEntity]
                : undefined;
            const options = stateObj?.attributes?.options ?? [];
            schema.push({
                name: "option",
                selector: options.length
                    ? { select: { mode: "dropdown", custom_value: true, options } }
                    : { text: {} },
            });
        }
        else if (!CREATE_MODES.has(this._quickMode)) {
            const domain = this._quickMode === "scene"
                ? "scene"
                : this._quickMode === "script"
                    ? "script"
                    : undefined;
            schema.push({
                name: "entity",
                selector: { entity: domain ? { domain } : {} },
            });
        }
        const labels = {
            mode: "Action",
            option: "Preset",
            entities: "Entities to capture",
            remember: "Remember these as this remote's default",
            entity: this._quickMode === "link" ? "Automation" : "Entity",
        };
        return b `
      <ha-form
        .hass=${this._hass}
        .data=${{
            mode: this._quickMode,
            entity: this._quickEntity,
            option: this._quickOption,
            entities: this._snapEntities,
            remember: this._snapRemember,
        }}
        .schema=${schema}
        .computeLabel=${(s) => labels[s.name] ?? s.name}
        @value-changed=${(e) => {
            const value = e.detail.value;
            if (value.mode !== this._quickMode) {
                this._quickMode = value.mode;
                this._quickEntity = "";
                this._quickOption = "";
            }
            else if (CREATE_MODES.has(this._quickMode)) {
                this._snapEntities = value.entities ?? [];
                this._snapRemember = !!value.remember;
            }
            else if (value.entity !== this._quickEntity) {
                // Entity changed → its preset list differs, drop the old option.
                this._quickEntity = value.entity ?? "";
                this._quickOption = "";
            }
            else {
                this._quickEntity = value.entity ?? "";
                this._quickOption = value.option ?? "";
            }
        }}
      ></ha-form>
      ${createHint ? b `<p class="hint">${createHint}</p>` : A}
    `;
    }
    _renderYamlTab() {
        if (this._yamlEditorOk) {
            return b `
        <ha-yaml-editor
          .hass=${this._hass}
          .defaultValue=${this._yamlValue ?? []}
          @value-changed=${(e) => {
                const detail = e.detail;
                this._yamlValid = detail.isValid !== false;
                if (this._yamlValid) {
                    this._yamlValue = (detail.value ?? []);
                }
            }}
        ></ha-yaml-editor>
        ${this._yamlValid ? A : b `<p class="error">Invalid YAML</p>`}
      `;
        }
        return b `
      <p class="hint">Sequence (YAML or JSON) — same as automation actions.</p>
      <textarea
        .value=${this._draft}
        spellcheck="false"
        @input=${(e) => {
            this._draft = e.target.value;
        }}
      ></textarea>
    `;
    }
    _renderClearDialog() {
        const artifacts = this._clearArtifacts;
        const parts = [];
        if (artifacts.scene) {
            parts.push(`scene ${artifacts.scene.entity_id ?? ""}`);
        }
        if (artifacts.automation)
            parts.push("its automation");
        return b `
      <div class="decision">
        <p><b>Also delete ${parts.join(" and ")}?</b></p>
        <label class="hint">
          <input
            type="checkbox"
            .checked=${this._clearRemember}
            @change=${(e) => {
            this._clearRemember = e.target.checked;
        }}
          />
          Remember my choice
        </label>
        <div class="buttons">
          <button class="danger" @click=${() => this._clearSlot("delete")}>
            Delete
          </button>
          <button @click=${() => this._clearSlot("keep")}>Keep</button>
          <button
            @click=${() => {
            this._clearArtifacts = undefined;
        }}
          >
            Cancel
          </button>
        </div>
      </div>
    `;
    }
    _renderImport() {
        const scan = this._importScan;
        return b `
      <div class="modal-backdrop" @click=${this._closeImport}>
        <div class="modal" @click=${(e) => e.stopPropagation()}>
          <h3>Import automations</h3>
          ${scan.proposals.length === 0
            ? b `<p class="hint">No importable automations found.</p>`
            : b `
                <p class="hint">
                  <b>Link</b> keeps the automation native and enabled — the card
                  shows it and opens it in HA's editor. <b>Absorb</b> copies its
                  actions into the card and disables it (never deletes).
                </p>
                <ul class="import-list">
                  ${scan.proposals.map((p, i) => b `
                      <li>
                        <label>
                          <input
                            type="checkbox"
                            .checked=${this._importSelected.has(i)}
                            @change=${(e) => {
                const next = new Set(this._importSelected);
                if (e.target.checked) {
                    next.add(i);
                }
                else {
                    next.delete(i);
                }
                this._importSelected = next;
            }}
                          />
                          <b>${p.action_id}</b> ← ${p.alias}
                          ${p.linkable
                ? b `<select
                                class="mode"
                                .value=${p.mode ?? "link"}
                                @click=${(e) => e.stopPropagation()}
                                @change=${(e) => {
                    const mode = e.target.value;
                    const proposals = scan.proposals.map((q, j) => j === i ? { ...q, mode } : q);
                    this._importScan = { ...scan, proposals };
                }}
                              >
                                <option value="link">link (keep native)</option>
                                <option value="absorb">absorb (copy in, disable)</option>
                              </select>`
                : b `<span class="hint-inline">absorb</span>`}
                          ${p.conflict
                ? b `<span class="warn">(overwrites slot)</span>`
                : A}
                          ${p.mixed
                ? b `<span class="warn"
                                >(mixed remotes — source stays enabled)</span
                              >`
                : A}
                          ${p.merged
                ? b `<span class="warn"
                                title="Home Assistant ran all of them on this press; the slot runs them one after another"
                                >(merges ${p.sources?.length ?? 2} automations)</span
                              >`
                : A}
                        </label>
                      </li>
                    `)}
                </ul>
              `}
          ${scan.skipped.length
            ? b `
                <p class="hint">Needs manual import:</p>
                <ul class="import-list">
                  ${scan.skipped.map((s) => b `<li>${s.alias} — <code>${s.reason}</code></li>`)}
                </ul>
              `
            : A}
          ${scan.proposals.some((p) => p.conflict)
            ? b `<label class="hint check-row">
                <input
                  type="checkbox"
                  .checked=${this._importOverwrite}
                  @change=${(e) => {
                this._importOverwrite = e.target.checked;
            }}
                />
                Overwrite already-assigned slots
              </label>`
            : A}
          ${this._importError
            ? b `<p class="error">${this._importError}</p>`
            : A}
          <div class="buttons">
            <button ?disabled=${this._importBusy} @click=${this._applyImport}>
              Apply
            </button>
            <button @click=${this._closeImport}>Cancel</button>
          </div>
        </div>
      </div>
    `;
    }
};
RemoteMapperCard.styles = i$3 `
    /* Header mirrors ha-card's .card-header: 24px title, 48px icon buttons */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ha-space-2, 8px);
      padding: var(--ha-space-1, 4px) var(--ha-space-1, 4px) 0 var(--ha-space-4, 16px);
      min-height: var(--ha-space-12, 48px);
    }
    .title {
      color: var(--ha-card-header-color, var(--primary-text-color));
      font-family: var(--ha-card-header-font-family, inherit);
      font-size: var(--ha-card-header-font-size, var(--ha-font-size-2xl, 24px));
      font-weight: var(--ha-card-header-font-weight, var(--ha-font-weight-normal, 400));
      letter-spacing: -0.012em;
      line-height: var(--ha-line-height-condensed, 1.2);
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .header-buttons {
      display: flex;
      align-items: center;
      flex: none;
    }
    ha-icon-button {
      color: var(--secondary-text-color);
    }
    ha-icon-button.active {
      color: var(--primary-color);
    }
    ha-icon-button {
      -webkit-touch-callout: none;
      user-select: none;
      touch-action: manipulation;
    }
    /* Same tokens HA's ha-tooltip uses, with fallbacks for older cores. */
    .tip {
      position: fixed;
      z-index: 1000;
      max-width: min(320px, calc(100vw - 2 * var(--ha-space-2, 8px)));
      padding: var(--ha-tooltip-padding, var(--ha-space-2, 8px));
      border-radius: var(--ha-tooltip-border-radius, var(--ha-border-radius-md, 8px));
      background: var(
        --ha-tooltip-background-color,
        var(--ha-color-surface-default, var(--secondary-background-color, #333))
      );
      color: var(--ha-tooltip-text-color, var(--primary-text-color));
      font-family: var(--ha-tooltip-font-family, var(--ha-font-family-body, inherit));
      font-size: var(--ha-tooltip-font-size, var(--ha-font-size-m, 14px));
      font-weight: var(--ha-tooltip-font-weight, var(--ha-font-weight-medium, 500));
      line-height: var(--ha-tooltip-line-height, var(--ha-line-height-condensed, 1.2));
      box-shadow: var(--ha-tooltip-box-shadow, var(--ha-box-shadow-m, 0 2px 8px rgba(0, 0, 0, 0.35)));
      pointer-events: none;
      animation: rm-tip 120ms ease-out;
    }
    @keyframes rm-tip {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
    }
    .content {
      padding: 0 16px 16px;
    }
    .viewport {
      position: relative;
      overflow: hidden;
      margin: 8px 0 12px;
      touch-action: none;
    }
    .viewport.editing {
      outline: 2px dashed var(--primary-color);
      outline-offset: -2px;
    }
    .canvas {
      position: absolute;
      top: 0;
      left: 0;
      transform-origin: top left;
    }
    .tile {
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      box-sizing: border-box;
      padding: 4px;
      border-radius: 8px;
      border: 1px solid var(--divider-color, #444);
      background: var(--card-background-color, inherit);
      color: var(--primary-text-color);
      cursor: pointer;
      user-select: none;
    }
    .tile.empty {
      opacity: 0.45;
    }
    .tile.archived {
      opacity: 0.35;
      border-style: dashed;
    }
    .tile.assigned {
      border-color: var(--primary-color);
    }
    .tile.flash {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    .tile.selected {
      outline: 2px solid var(--primary-color);
      outline-offset: 1px;
    }
    .viewport.editing .tile {
      cursor: move;
    }
    .action {
      font-weight: 500;
      font-size: 0.9em;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .summary {
      font-size: 0.7em;
      color: var(--secondary-text-color);
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tile-badge {
      position: absolute;
      top: 2px;
      right: 4px;
      font-size: 0.6em;
      color: var(--secondary-text-color);
    }
    .error-badge {
      color: var(--error-color, #db4437);
      font-weight: 700;
    }
    .handle {
      position: absolute;
      width: 12px;
      height: 12px;
      background: var(--primary-color);
      border-radius: 50%;
      z-index: 5;
    }
    .handle.nw {
      top: -6px;
      left: -6px;
      cursor: nwse-resize;
    }
    .handle.ne {
      top: -6px;
      right: -6px;
      cursor: nesw-resize;
    }
    .handle.sw {
      bottom: -6px;
      left: -6px;
      cursor: nesw-resize;
    }
    .handle.se {
      bottom: -6px;
      right: -6px;
      cursor: nwse-resize;
    }
    .chipbar {
      position: absolute;
      display: flex;
      gap: 2px;
      padding: 4px;
      border-radius: 10px;
      background: var(--card-background-color, #222);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
      z-index: 20;
    }
    .chipbar button {
      border: none;
      background: none;
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 1em;
      padding: 4px 8px;
    }
    .dpad-dock {
      position: absolute;
      right: 8px;
      bottom: 8px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      z-index: 20;
    }
    .badge {
      font-family: var(--code-font-family, monospace);
      font-size: 0.75em;
      background: var(--card-background-color, #222);
      border: 1px solid var(--divider-color, #444);
      border-radius: 6px;
      padding: 2px 8px;
      min-height: 1.2em;
    }
    .dpad {
      display: grid;
      grid-template-columns: repeat(3, 34px);
      grid-auto-rows: 34px;
      gap: 2px;
      background: var(--card-background-color, #222);
      border: 1px solid var(--divider-color, #444);
      border-radius: 10px;
      padding: 4px;
    }
    .dpad button {
      border: none;
      border-radius: 6px;
      background: rgba(127, 127, 127, 0.12);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.9em;
    }
    .dpad button:disabled {
      opacity: 0.3;
    }
    .dpad .step {
      font-weight: 700;
    }
    .picker-dock {
      padding: 0 var(--ha-space-4, 16px) var(--ha-space-2, 8px);
    }
    .grid-hint {
      padding: 0 var(--ha-space-4, 16px);
      margin: 0 0 4px;
    }
    .grid-hint:last-child {
      margin-bottom: 0;
    }
    .event-list {
      list-style: none;
      margin: var(--ha-space-2, 8px) 0;
      padding: 0;
    }
    .event-list li {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0 var(--ha-space-2, 8px);
      padding: var(--ha-space-1, 4px) 0;
      border-bottom: 1px solid var(--divider-color, #444);
      opacity: 0.6;
    }
    /* name gets the line; icons drop to a second line when they don't fit */
    .ev-main {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      flex: 1 1 200px;
      min-width: 0;
      min-height: var(--ha-space-10, 40px);
    }
    .ev-actions {
      display: flex;
      align-items: center;
      margin-left: auto;
      --mdc-icon-button-size: 40px;
      --mdc-icon-size: 22px;
    }
    .event-list li.on {
      opacity: 1;
    }
    .ev-icon {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--ha-space-7, 28px);
      height: var(--ha-space-7, 28px);
      border-radius: 50%;
      border: 1px solid var(--primary-color);
      font-size: var(--ha-font-size-s, 12px);
      font-weight: var(--ha-font-weight-medium, 500);
    }
    .ev-name {
      flex: none;
      font-family: var(--ha-font-family-code, monospace);
      font-size: var(--ha-font-size-m, 14px);
    }
    .ev-summary {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--ha-font-size-m, 14px);
      color: var(--secondary-text-color);
    }
    .label-input {
      display: block;
      width: 100%;
      box-sizing: border-box;
      margin-top: var(--ha-space-1, 4px);
      padding: var(--ha-space-2, 8px) var(--ha-space-3, 12px);
      border: 1px solid var(--divider-color, #444);
      border-radius: var(--ha-border-radius-md, 8px);
      background: inherit;
      color: inherit;
      font: inherit;
      font-size: var(--ha-font-size-l, 16px);
    }
    .tabs {
      display: flex;
      gap: 4px;
      margin: 4px 0 8px;
    }
    .tabs button {
      border: 1px solid var(--divider-color, #444);
      border-radius: var(--ha-border-radius-md, 8px) var(--ha-border-radius-md, 8px) 0 0;
      background: none;
      color: var(--secondary-text-color);
      padding: var(--ha-space-1, 4px) var(--ha-space-3, 12px);
      cursor: pointer;
      font: inherit;
      font-size: var(--ha-font-size-m, 14px);
    }
    .tabs button.on {
      color: var(--primary-color);
      border-color: var(--primary-color);
      font-weight: 600;
    }
    .row {
      display: block;
      margin-top: 8px;
    }
    .release-list {
      margin: 0 0 var(--ha-space-2, 8px);
      padding-left: 18px;
      font-size: var(--ha-font-size-m, 14px);
    }
    .release-list li {
      margin: var(--ha-space-1, 4px) 0;
    }
    .buttons .danger:first-child {
      background: none;
      color: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
    }
    /* Lists inside modals: HA tokens only (em/px ignore the user's
       --ha-font-size-scale and read tiny next to HA's own dialogs). */
    .import-list {
      list-style: none;
      margin: var(--ha-space-1, 4px) 0 var(--ha-space-2, 8px);
      padding: 0;
      font-size: var(--ha-font-size-m, 14px);
      line-height: var(--ha-line-height-normal, 1.6);
    }
    .import-list li {
      margin: var(--ha-space-1, 4px) 0;
    }
    .import-list label,
    .check-row {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ha-space-1, 4px) var(--ha-space-2, 8px);
    }
    .import-list code {
      font-family: var(--ha-font-family-code, monospace);
      font-size: var(--ha-font-size-s, 12px);
    }
    .modal input[type="checkbox"] {
      width: var(--ha-space-5, 20px);
      height: var(--ha-space-5, 20px);
      margin: 0;
      accent-color: var(--primary-color);
    }
    .import-list select.mode {
      font: inherit;
      font-size: var(--ha-font-size-m, 14px);
      min-height: var(--ha-space-8, 32px);
      padding: 0 var(--ha-space-2, 8px);
      background: var(--card-background-color, inherit);
      color: inherit;
      border: 1px solid var(--divider-color, #444);
      border-radius: var(--ha-border-radius-md, 8px);
    }
    .hint-inline {
      font-size: var(--ha-font-size-s, 12px);
      color: var(--secondary-text-color);
    }
    .warn {
      color: var(--warning-color, #ffa600);
      font-size: var(--ha-font-size-s, 12px);
    }
    .decision {
      margin-top: 12px;
      padding: 12px;
      border: 1px solid var(--warning-color, #ffa600);
      border-radius: 8px;
    }
    .decision p {
      margin: 0 0 8px;
    }
    .error {
      color: var(--error-color, #db4437);
    }
    .hint {
      margin: 0 0 var(--ha-space-2, 8px);
      font-size: var(--ha-font-size-m, 14px);
      color: var(--secondary-text-color);
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 30;
    }
    .modal {
      background: var(--card-background-color, #fff);
      border-radius: 12px;
      padding: 16px;
      width: min(560px, 94vw);
      max-height: 86vh;
      overflow: auto;
      box-shadow: var(--ha-card-box-shadow, 0 8px 24px rgba(0, 0, 0, 0.4));
    }
    button.link {
      background: none;
      border: none;
      padding: 0;
      font: inherit;
      color: var(--primary-color);
      text-decoration: underline;
      cursor: pointer;
    }
    .modal h3 {
      margin: 0 0 var(--ha-space-2, 8px);
      font-size: var(--ha-font-size-xl, 20px);
      font-weight: var(--ha-font-weight-medium, 500);
    }
    textarea {
      width: 100%;
      min-height: 160px;
      font-family: var(--ha-font-family-code, var(--code-font-family, monospace));
      font-size: var(--ha-font-size-s, 12px);
      box-sizing: border-box;
      background: inherit;
      color: inherit;
      border: 1px solid var(--divider-color, #444);
      border-radius: 6px;
      padding: 8px;
    }
    .buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .buttons button {
      min-height: var(--ha-space-9, 36px);
      padding: var(--ha-space-1, 4px) var(--ha-space-4, 16px);
      border-radius: var(--ha-border-radius-md, 8px);
      border: 1px solid var(--divider-color, #444);
      background: none;
      color: var(--primary-text-color);
      cursor: pointer;
      font: inherit;
      font-size: var(--ha-font-size-m, 14px);
      font-weight: var(--ha-font-weight-medium, 500);
    }
    .buttons button:first-child {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      border-color: var(--primary-color);
    }
    .buttons .danger {
      color: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
    }
  `;
__decorate([
    r()
], RemoteMapperCard.prototype, "_remote", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_remoteChoices", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_error", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_flash", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_hostWidth", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_gridEditing", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_gridDraft", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_pickerOpen", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_buttonSheet", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_tip", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_editingAction", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_editorTab", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_quickMode", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_quickEntity", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_quickOption", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_snapEntities", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_snapRemember", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_draft", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_draftName", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_yamlValue", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_yamlValid", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_draftError", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_draftMaterialized", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_editingLive", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_haFormOk", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_yamlEditorOk", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_clearArtifacts", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_clearRemember", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_releaseOpen", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_releaseConvert", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_releaseBusy", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_importScan", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_importSelected", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_importOverwrite", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_importBusy", void 0);
__decorate([
    r()
], RemoteMapperCard.prototype, "_importError", void 0);
RemoteMapperCard = __decorate([
    t(CARD_TAG)
], RemoteMapperCard);
window.customCards = window.customCards || [];
window.customCards.push({
    type: CARD_TAG,
    name: "Remote Mapper Card",
    description: "Map physical remote buttons to actions on a canvas layout.",
    preview: false,
});
console.info(`%c REMOTE-MAPPER-CARD %c grid `, "color: white; background: #3f51b5; font-weight: 700;", "color: #3f51b5; background: white; font-weight: 700;");

export { RemoteMapperCard };
//# sourceMappingURL=remote-mapper-card.js.map
