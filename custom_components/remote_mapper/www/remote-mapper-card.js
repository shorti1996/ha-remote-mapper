function t(t,e,i,o){var s,r=arguments.length,n=r<3?e:null===o?o=Object.getOwnPropertyDescriptor(e,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(n=(r<3?s(n):r>3?s(e,i,n):s(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),s=new WeakMap;let r=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=s.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&s.set(e,t))}return t}toString(){return this.cssText}};const n=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,o)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[o+1],t[0]);return new r(i,t,o)},a=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,o))(e)})(t):t,{is:c,defineProperty:d,getOwnPropertyDescriptor:h,getOwnPropertyNames:l,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,_=globalThis,m=_.trustedTypes,v=m?m.emptyScript:"",g=_.reactiveElementPolyfillSupport,f=(t,e)=>t,y={toAttribute(t,e){switch(e){case Boolean:t=t?v:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},b=(t,e)=>!c(t,e),w={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:b};Symbol.metadata??=Symbol("metadata"),_.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=w){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),o=this.getPropertyDescriptor(t,i,e);void 0!==o&&d(this.prototype,t,o)}}static getPropertyDescriptor(t,e,i){const{get:o,set:s}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:o,set(e){const r=o?.call(this);s?.call(this,e),this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??w}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const t=this.properties,e=[...l(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,o)=>{if(i)t.adoptedStyleSheets=o.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of o){const o=document.createElement("style"),s=e.litNonce;void 0!==s&&o.setAttribute("nonce",s),o.textContent=i.cssText,t.appendChild(o)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,i);if(void 0!==o&&!0===i.reflect){const s=(void 0!==i.converter?.toAttribute?i.converter:y).toAttribute(e,i.type);this._$Em=t,null==s?this.removeAttribute(o):this.setAttribute(o,s),this._$Em=null}}_$AK(t,e){const i=this.constructor,o=i._$Eh.get(t);if(void 0!==o&&this._$Em!==o){const t=i.getPropertyOptions(o),s="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:y;this._$Em=o;const r=s.fromAttribute(e,t.type);this[o]=r??this._$Ej?.get(o)??r,this._$Em=null}}requestUpdate(t,e,i,o=!1,s){if(void 0!==t){const r=this.constructor;if(!1===o&&(s=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??b)(s,e)||i.useDefault&&i.reflect&&s===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:o,wrapped:s},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==s||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===o&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,o=this[e];!0!==t||this._$AL.has(e)||void 0===o||this.C(e,void 0,i,o)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[f("elementProperties")]=new Map,$[f("finalized")]=new Map,g?.({ReactiveElement:$}),(_.reactiveElementVersions??=[]).push("2.1.2");const x=globalThis,k=t=>t,S=x.trustedTypes,A=S?S.createPolicy("lit-html",{createHTML:t=>t}):void 0,E="$lit$",T=`lit$${Math.random().toFixed(9).slice(2)}$`,M="?"+T,z=`<${M}>`,I=document,C=()=>I.createComment(""),D=t=>null===t||"object"!=typeof t&&"function"!=typeof t,O=Array.isArray,P="[ \t\n\f\r]",H=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,L=/>/g,q=RegExp(`>|${P}(?:([^\\s"'>=/]+)(${P}*=${P}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),N=/'/g,B=/"/g,U=/^(?:script|style|textarea|title)$/i,W=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),j=Symbol.for("lit-noChange"),Y=Symbol.for("lit-nothing"),V=new WeakMap,G=I.createTreeWalker(I,129);function X(t,e){if(!O(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==A?A.createHTML(e):e}const F=(t,e)=>{const i=t.length-1,o=[];let s,r=2===e?"<svg>":3===e?"<math>":"",n=H;for(let e=0;e<i;e++){const i=t[e];let a,c,d=-1,h=0;for(;h<i.length&&(n.lastIndex=h,c=n.exec(i),null!==c);)h=n.lastIndex,n===H?"!--"===c[1]?n=R:void 0!==c[1]?n=L:void 0!==c[2]?(U.test(c[2])&&(s=RegExp("</"+c[2],"g")),n=q):void 0!==c[3]&&(n=q):n===q?">"===c[0]?(n=s??H,d=-1):void 0===c[1]?d=-2:(d=n.lastIndex-c[2].length,a=c[1],n=void 0===c[3]?q:'"'===c[3]?B:N):n===B||n===N?n=q:n===R||n===L?n=H:(n=q,s=void 0);const l=n===q&&t[e+1].startsWith("/>")?" ":"";r+=n===H?i+z:d>=0?(o.push(a),i.slice(0,d)+E+i.slice(d)+T+l):i+T+(-2===d?e:l)}return[X(t,r+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),o]};class J{constructor({strings:t,_$litType$:e},i){let o;this.parts=[];let s=0,r=0;const n=t.length-1,a=this.parts,[c,d]=F(t,e);if(this.el=J.createElement(c,i),G.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(o=G.nextNode())&&a.length<n;){if(1===o.nodeType){if(o.hasAttributes())for(const t of o.getAttributeNames())if(t.endsWith(E)){const e=d[r++],i=o.getAttribute(t).split(T),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:s,name:n[2],strings:i,ctor:"."===n[1]?et:"?"===n[1]?it:"@"===n[1]?ot:tt}),o.removeAttribute(t)}else t.startsWith(T)&&(a.push({type:6,index:s}),o.removeAttribute(t));if(U.test(o.tagName)){const t=o.textContent.split(T),e=t.length-1;if(e>0){o.textContent=S?S.emptyScript:"";for(let i=0;i<e;i++)o.append(t[i],C()),G.nextNode(),a.push({type:2,index:++s});o.append(t[e],C())}}}else if(8===o.nodeType)if(o.data===M)a.push({type:2,index:s});else{let t=-1;for(;-1!==(t=o.data.indexOf(T,t+1));)a.push({type:7,index:s}),t+=T.length-1}s++}}static createElement(t,e){const i=I.createElement("template");return i.innerHTML=t,i}}function K(t,e,i=t,o){if(e===j)return e;let s=void 0!==o?i._$Co?.[o]:i._$Cl;const r=D(e)?void 0:e._$litDirective$;return s?.constructor!==r&&(s?._$AO?.(!1),void 0===r?s=void 0:(s=new r(t),s._$AT(t,i,o)),void 0!==o?(i._$Co??=[])[o]=s:i._$Cl=s),void 0!==s&&(e=K(t,s._$AS(t,e.values),s,o)),e}class Q{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,o=(t?.creationScope??I).importNode(e,!0);G.currentNode=o;let s=G.nextNode(),r=0,n=0,a=i[0];for(;void 0!==a;){if(r===a.index){let e;2===a.type?e=new Z(s,s.nextSibling,this,t):1===a.type?e=new a.ctor(s,a.name,a.strings,this,t):6===a.type&&(e=new st(s,this,t)),this._$AV.push(e),a=i[++n]}r!==a?.index&&(s=G.nextNode(),r++)}return G.currentNode=I,o}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class Z{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,o){this.type=2,this._$AH=Y,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=K(this,t,e),D(t)?t===Y||null==t||""===t?(this._$AH!==Y&&this._$AR(),this._$AH=Y):t!==this._$AH&&t!==j&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>O(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==Y&&D(this._$AH)?this._$AA.nextSibling.data=t:this.T(I.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,o="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=J.createElement(X(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(e);else{const t=new Q(o,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=V.get(t.strings);return void 0===e&&V.set(t.strings,e=new J(t)),e}k(t){O(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,o=0;for(const s of t)o===e.length?e.push(i=new Z(this.O(C()),this.O(C()),this,this.options)):i=e[o],i._$AI(s),o++;o<e.length&&(this._$AR(i&&i._$AB.nextSibling,o),e.length=o)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,o,s){this.type=1,this._$AH=Y,this._$AN=void 0,this.element=t,this.name=e,this._$AM=o,this.options=s,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=Y}_$AI(t,e=this,i,o){const s=this.strings;let r=!1;if(void 0===s)t=K(this,t,e,0),r=!D(t)||t!==this._$AH&&t!==j,r&&(this._$AH=t);else{const o=t;let n,a;for(t=s[0],n=0;n<s.length-1;n++)a=K(this,o[i+n],e,n),a===j&&(a=this._$AH[n]),r||=!D(a)||a!==this._$AH[n],a===Y?t=Y:t!==Y&&(t+=(a??"")+s[n+1]),this._$AH[n]=a}r&&!o&&this.j(t)}j(t){t===Y?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===Y?void 0:t}}class it extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==Y)}}class ot extends tt{constructor(t,e,i,o,s){super(t,e,i,o,s),this.type=5}_$AI(t,e=this){if((t=K(this,t,e,0)??Y)===j)return;const i=this._$AH,o=t===Y&&i!==Y||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,s=t!==Y&&(i===Y||o);o&&this.element.removeEventListener(this.name,this,i),s&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class st{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){K(this,t)}}const rt=x.litHtmlPolyfillSupport;rt?.(J,Z),(x.litHtmlVersions??=[]).push("3.3.3");const nt=globalThis;class at extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const o=i?.renderBefore??e;let s=o._$litPart$;if(void 0===s){const t=i?.renderBefore??null;o._$litPart$=s=new Z(e.insertBefore(C(),t),t,void 0,i??{})}return s._$AI(t),s})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return j}}at._$litElement$=!0,at.finalized=!0,nt.litElementHydrateSupport?.({LitElement:at});const ct=nt.litElementPolyfillSupport;ct?.({LitElement:at}),(nt.litElementVersions??=[]).push("4.2.2");const dt=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},ht={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:b},lt=(t=ht,e,i)=>{const{kind:o,metadata:s}=i;let r=globalThis.litPropertyMetadata.get(s);if(void 0===r&&globalThis.litPropertyMetadata.set(s,r=new Map),"setter"===o&&((t=Object.create(t)).wrapped=!0),r.set(i.name,t),"accessor"===o){const{name:o}=i;return{set(i){const s=e.get.call(this);e.set.call(this,i),this.requestUpdate(o,s,t,!0,i)},init(e){return void 0!==e&&this.C(o,void 0,t,e),e}}}if("setter"===o){const{name:o}=i;return function(i){const s=this[o];e.call(this,i),this.requestUpdate(o,s,t,!0,i)}}throw Error("Unsupported decorator location: "+o)};function pt(t){return(e,i)=>"object"==typeof i?lt(t,e,i):((t,e,i)=>{const o=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),o?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function ut(t){return pt({...t,state:!0,attribute:!1})}let _t=null;function mt(){return _t||(_t=window.loadCardHelpers?window.loadCardHelpers():Promise.resolve(null)),_t}let vt=null;function gt(){return customElements.get("ha-form")?Promise.resolve(!0):(vt||(vt=(async()=>{try{const t=await mt(),e=t?.createCardElement?.({type:"entities",entities:[]});await(e?.constructor?.getConfigElement?.())}catch{}const t=await Promise.race([customElements.whenDefined("ha-form").then(()=>!0),new Promise(t=>setTimeout(()=>t(!1),2e3))]),e=t&&!!customElements.get("ha-form");return e||(vt=null),e})()),vt)}let ft=null;const yt=["single","double","triple","hold","release","other"],bt={single:"1",double:"2",triple:"3",hold:"⧗",release:"↥",other:"•"},wt={single:"single press",double:"double press",triple:"triple press",hold:"hold",release:"release",other:"other"},$t=(t,e)=>`${t},${e}`;function xt(t,e){const i=t&&t.rows>0&&t.cols>0?{rows:t.rows,cols:t.cols}:function(t){if(t<=1)return{rows:1,cols:1};const e=t<=6?2:Math.min(12,Math.ceil(Math.sqrt(t)));return{rows:Math.ceil(t/e),cols:e}}(e.length),o=Math.min(12,i.cols);let s=Math.min(12,i.rows);const r={},n=new Set,a=[];for(const i of e){const e=t?.buttons?.[i.id],c=e?.label?.trim()?{label:e.label.trim()}:{};e&&Number.isInteger(e.row)&&Number.isInteger(e.col)&&e.row>=0&&e.col>=0&&e.row<s&&e.col<o&&!n.has($t(e.row,e.col))?(r[i.id]={row:e.row,col:e.col,...c},n.add($t(e.row,e.col))):a.push({id:i.id,...c})}let c=0;for(const t of a)for(;;){const e=Math.floor(c/o),i=c%o;if(c++,e>=s&&(s=e+1),!n.has($t(e,i))){r[t.id]={row:e,col:i,...t.label?{label:t.label}:{}},n.add($t(e,i));break}}return{schema_version:1,rows:s,cols:o,buttons:r}}function kt(t){const e=new Map;for(const[i,o]of Object.entries(t.buttons))e.set($t(o.row,o.col),i);return e}function St(t){const e={};for(const[i,o]of Object.entries(t.buttons)){const{label:t,...s}=o,r=t?.trim();e[i]=r?{...s,label:r}:s}return{...t,buttons:e}}function At(t,e){return e.buttons[t.id]?.label||t.label}function Et(t,e){return t.actions.find(t=>t.kind===e)}const Tt=["Tap the pencil at the top right of this card to rename buttons and assign actions to their events.","In edit mode, Import picks which of this remote's existing automations the card should manage; Hand back returns them to HA.","Layout, colours and display mode live in the card's settings: open HA's dashboard edit mode and edit this card.","Press a button on the physical remote and its event lights up here. In edit mode, Refresh picks up newly discovered events."];async function Mt(t){const e=await t.callWS({type:"remote_mapper/get_prefs"});return{tipsSeen:Ct(e.tips_seen),dragHintSeen:!!e.drag_hint_seen,editHelpCollapsed:!!e.edit_help_collapsed}}const zt="remote_mapper_prefs";function It(t){try{globalThis.dispatchEvent?.(new CustomEvent(zt,{detail:t}))}catch{}}function Ct(t){const e="number"==typeof t?t:parseInt(String(t??"0"),10);return Math.min(Math.max(Number.isFinite(e)?e:0,0),Tt.length)}function Dt(t){const e={...bt},i=t?.event_icons;if(i&&"object"==typeof i)for(const t of yt){const o=i[t];"string"==typeof o&&o.trim()&&(e[t]=o.trim())}return e}const Ot=[{value:"assisted",label:"Assisted — press a button, pick the event"},{value:"replica",label:"Replica — tap / double-tap / hold like the physical remote"},{value:"all",label:"All visible — every event of every button"}],Pt=[{value:"grid",label:"Grid — buttons arranged like the remote"},{value:"canvas",label:"Canvas — free placement, one tile per event"}],Ht=[{value:"auto",label:"Auto — slide with a finger, tap with a mouse"},{value:"tap",label:"Tap opens, tap again closes; tap an option"},{value:"press",label:"Long-press opens; slide to an option and lift"}],Rt=[{value:"vertical",label:"Vertical list"},{value:"horizontal",label:"Wrapped row — chips flow like tags"},{value:"compact",label:"Compact icons — one row, name on hover / long-press"},{value:"spines",label:"Spines — one row, names rotated 90°"},{value:"grid",label:"Two-column grid"}];function Lt(t){const e=t?.display,i="normal"===e?"replica":e;return Ot.some(t=>t.value===i)?i:"assisted"}function qt(t){return"canvas"===t?.layout?"canvas":"grid"}function Nt(t){const e=t?.assisted_trigger;return"press"===e||"tap"===e?e:"auto"}function Bt(t){const e=t?.chips_layout;return Rt.some(t=>t.value===e)?e:"vertical"}function Ut(t){if("string"!=typeof t)return;const e=/^#([0-9a-f]{6})$/i.exec(t.trim());if(!e)return;const i=parseInt(e[1],16);return[i>>16&255,i>>8&255,255&i]}function Wt(t){if(!Array.isArray(t)||3!==t.length)return;const e=t.map(t=>Math.max(0,Math.min(255,0|Number(t))).toString(16).padStart(2,"0"));return`#${e.join("")}`}const jt="__auto__",Yt=["button_color","accent_color","text_color"],Vt="#3f51b5";const Gt={entry_id:"Remote",title:"Title",show_title:"Show title",layout:"Layout",display:"Display mode",assisted_trigger:"Popover opens on",chips_layout:"Event chips",hide_unset:"Hide events that are not set",button_color:"Button color",accent_color:"Accent color",text_color:"Text color",button_opacity:"Button opacity"},Xt={title:"Empty = the remote's name.",hide_unset:"Edit mode (pencil) still shows them, so you can assign one.",button_color:"Pad background. Turn the switch off to use the theme.",accent_color:"Borders, assigned marks, flashes. Off = theme primary color.",text_color:"Off = theme text color.",button_opacity:"Pad background only; text stays readable."};const Ft={ask:"asks each time",always_delete:"always deletes",never_delete:"never deletes"},Jt=t=>({select:{mode:"dropdown",options:t}});let Kt=class extends at{constructor(){super(...arguments),this._formOk=!1,this._fetching=!1,this._dragHintSeen=!1,this._editHelpCollapsed=!1,this._changed=t=>{t.stopPropagation(),this._emit(function(t,e){const i={...t,type:t.type},o=(t,e,o)=>{void 0===e||""===e||o?delete i[t]:i[t]=e};o("entry_id",e.entry_id,e.entry_id===jt),o("title",e.title,"string"==typeof e.title&&!e.title.trim()),o("show_title",e.show_title,!1!==e.show_title),o("layout",e.layout,"canvas"!==e.layout),o("display",e.display,"assisted"===e.display),o("assisted_trigger",e.assisted_trigger,"auto"===e.assisted_trigger),o("chips_layout",e.chips_layout,"vertical"===e.chips_layout),o("hide_unset",e.hide_unset,!0!==e.hide_unset);for(const t of Yt){if(!e[`${t}_set`]){delete i[t];continue}const o=Wt(e[t]),s="string"==typeof i[t]?i[t]:void 0;(!s||Ut(s)||o&&o!==Vt)&&(i[t]=o??s??Vt)}const s=e.button_opacity;o("button_opacity",s,"number"!=typeof s||s>=1);const r=e.event_icons,n={};if(r&&"object"==typeof r)for(const t of yt){const e=r[t];"string"==typeof e&&e.trim()&&(n[t]=e.trim())}return o("event_icons",n,0===Object.keys(n).length),i}(this._config,t.detail.value))},this._trimOnBlur=()=>{const t=function(t){let e=!1;const i={...t};for(const t of["title",...Yt]){const o=i[t];if("string"!=typeof o)continue;const s=o.trim();s!==o&&(e=!0,s?i[t]=s:delete i[t])}return e?i:t}(this._config);t!==this._config&&this._emit(t)}}setConfig(t){this._config=t}_entryId(){return this._config?.entry_id?this._config.entry_id:1===this._remotes?.length?this._remotes[0].entry_id:void 0}_fetchOptions(){const t=this._entryId();this.hass&&t&&t!==this._optionsFor&&(this._optionsFor=t,this._options=void 0,this.hass.callWS({type:"remote_mapper/get_options",entry_id:t}).then(e=>{this._optionsFor===t&&(this._options=e)}).catch(()=>{}))}async _reset(t){const e=this._entryId();if(this.hass&&e)try{await this.hass.callWS("grouping"===t?{type:"remote_mapper/reset_grouping",entry_id:e}:{type:"remote_mapper/reset_options",entry_id:e,[t]:!0}),this._optionsFor=void 0,this._fetchOptions()}catch(t){this.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:`Reset failed: ${t.message??String(t)}`},bubbles:!0,composed:!0}))}}connectedCallback(){super.connectedCallback(),gt().then(t=>{this._formOk=t})}willUpdate(){!this.hass||this._remotes||this._fetching||(this._fetching=!0,this.hass.callWS({type:"remote_mapper/list_remotes"}).then(t=>{this._remotes=t.remotes}).catch(()=>{this._remotes=[]})),this._fetchOptions(),void 0===this._tipsSeen&&this.hass&&Mt(this.hass).then(t=>{this._tipsSeen=t.tipsSeen,this._dragHintSeen=t.dragHintSeen,this._editHelpCollapsed=t.editHelpCollapsed}).catch(()=>{})}_renderReset(){const t=this._options,e=(this._tipsSeen??0)>0||this._dragHintSeen||this._editHelpCollapsed;return t||e?W`
      <div class="reset">
        <p class="hint reset-title">Start over</p>
        ${t?W`
              <div class="reset-row">
                <span class="hint">
                  Deleting a scene or automation the card created:
                  <b>${Ft[t.cleanup_policy]}</b>
                </span>
                <button
                  ?disabled=${"ask"===t.cleanup_policy}
                  @click=${()=>{this._reset("cleanup_policy")}}
                >
                  Ask again
                </button>
              </div>
              <div class="reset-row">
                <span class="hint">
                  Defaults for <i>Scene from current state</i>:
                  <b>${function(t){const e=[],i=t.snapshot_devices?.length??0,o=t.snapshot_entities.length;return i&&e.push(`${i} device${1===i?"":"s"}`),o&&e.push(`${o} entit${1===o?"y":"ies"}`),e.length?e.join(", "):"none"}(t)}</b>
                </span>
                <button
                  ?disabled=${!t.snapshot_entities.length&&!t.snapshot_devices.length}
                  @click=${()=>{this._reset("snapshot_entities")}}
                >
                  Forget
                </button>
              </div>
              <div class="reset-row">
                <span class="hint">
                  Events moved to another button or given another press kind:
                  <b>${t.grouping_count||"none"}</b>
                </span>
                <button
                  ?disabled=${!t.grouping_count}
                  @click=${()=>{this._reset("grouping")}}
                >
                  Regroup
                </button>
              </div>
            `:Y}
        <div class="reset-row">
          <span class="hint">
            Tips at the top of the card, the hint on the first drag of an event mark and the
            edit-mode help: <b>${e?"seen":"showing"}</b>
          </span>
          <button
            ?disabled=${!e}
            @click=${()=>{this.hass&&async function(t){await t.callWS({type:"remote_mapper/set_prefs",tips_seen:0,drag_hint_seen:!1,edit_help_collapsed:!1}),It({tipsSeen:0,dragHintSeen:!1,editHelpCollapsed:!1})}(this.hass).then(()=>{this._tipsSeen=0,this._dragHintSeen=!1,this._editHelpCollapsed=!1})}}
          >
            Show again
          </button>
        </div>
      </div>
    `:Y}render(){const t=this._config;if(!t)return Y;if(!this._formOk)return W`<p class="hint">Loading editor components…</p>`;const e=Lt(t),i=[{name:"entry_id",selector:Jt([{value:jt,label:"Auto (the only remote)"},...(this._remotes??[]).map(t=>({value:t.entry_id,label:t.title}))])},{name:"title",selector:{text:{}}},{name:"show_title",selector:{boolean:{}}},{name:"layout",selector:Jt(Pt)},{name:"display",selector:Jt(Ot)}];"assisted"===e&&i.push({name:"assisted_trigger",selector:Jt(Ht)}),"all"===e&&(i.push({name:"chips_layout",selector:Jt(Rt)}),i.push({name:"hide_unset",selector:{boolean:{}}}));for(const e of Yt)i.push({name:`${e}_set`,selector:{boolean:{}}}),t[e]&&i.push({name:e,selector:{color_rgb:{}}});i.push({name:"button_opacity",selector:{number:{min:.1,max:1,step:.05,mode:"slider"}}}),i.push({name:"event_icons",type:"expandable",title:"Event marks",schema:yt.map(t=>({name:t,selector:{icon:{}}}))});const o=function(t){return{entry_id:t.entry_id||jt,title:t.title??"",show_title:!1!==t.show_title,layout:qt(t),display:Lt(t),assisted_trigger:Nt(t),chips_layout:Bt(t),hide_unset:!0===t.hide_unset,button_color_set:!!t.button_color,accent_color_set:!!t.accent_color,text_color_set:!!t.text_color,button_color:Ut(t.button_color)??[63,81,181],accent_color:Ut(t.accent_color)??[63,81,181],text_color:Ut(t.text_color)??[255,255,255],button_opacity:t.button_opacity??1,event_icons:Object.fromEntries(yt.map(e=>[e,t.event_icons?.[e]??""]))}}(t);return W`
      <ha-form
        .hass=${this.hass}
        .data=${o}
        .schema=${i}
        .computeLabel=${t=>t.name.endsWith("_set")?`Custom ${Gt[t.name.slice(0,-4)].toLowerCase()}`:t.name in wt?`${wt[t.name]} (default: ${bt[t.name]})`:Gt[t.name]??t.name}
        .computeHelper=${e=>"display"===e.name&&"canvas"===qt(t)?"Ignored for the canvas layout (every tile is already visible).":Xt[e.name]??""}
        @value-changed=${this._changed}
        @focusout=${this._trimOnBlur}
      ></ha-form>
      ${this._renderReset()}
    `}_emit(t){this._config=t,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:t},bubbles:!0,composed:!0}))}};Kt.styles=n`
    .hint {
      font-size: var(--ha-font-size-m, 14px);
      color: var(--secondary-text-color);
    }
    .reset {
      margin-top: var(--ha-space-4, 16px);
      padding-top: var(--ha-space-3, 12px);
      border-top: 1px solid var(--divider-color, #444);
    }
    .reset-title {
      margin: 0 0 var(--ha-space-2, 8px);
      color: var(--primary-text-color);
      font-weight: var(--ha-font-weight-medium, 500);
    }
    .reset-row {
      display: flex;
      align-items: center;
      gap: var(--ha-space-3, 12px);
      min-height: var(--ha-space-10, 40px);
    }
    .reset-row .hint {
      flex: 1;
      line-height: var(--ha-line-height-normal, 1.6);
    }
    .reset-row button {
      flex: none;
      min-height: var(--ha-space-9, 36px);
      padding: var(--ha-space-1, 4px) var(--ha-space-3, 12px);
      border: 1px solid var(--primary-color);
      border-radius: var(--ha-border-radius-md, 8px);
      background: transparent;
      color: var(--primary-color);
      font: inherit;
      font-size: var(--ha-font-size-m, 14px);
      cursor: pointer;
    }
    .reset-row button:disabled {
      border-color: var(--divider-color, #444);
      color: var(--secondary-text-color);
      opacity: 0.6;
      cursor: default;
    }
  `,t([pt({attribute:!1})],Kt.prototype,"hass",void 0),t([ut()],Kt.prototype,"_config",void 0),t([ut()],Kt.prototype,"_remotes",void 0),t([ut()],Kt.prototype,"_formOk",void 0),t([ut()],Kt.prototype,"_options",void 0),t([ut()],Kt.prototype,"_tipsSeen",void 0),t([ut()],Kt.prototype,"_dragHintSeen",void 0),t([ut()],Kt.prototype,"_editHelpCollapsed",void 0),Kt=t([dt("remote-mapper-card-editor")],Kt);let Qt=class extends at{constructor(){super(...arguments),this.rows=1,this.cols=1,this.minCells=1}render(){const t=this._hover??{r:this.rows-1,c:this.cols-1},e=Math.min(12,Math.max(5,t.r+2,this.rows+1)),i=Math.min(12,Math.max(5,t.c+2,this.cols+1)),o=[];for(let s=0;s<e;s++)for(let e=0;e<i;e++)o.push(W`
          <div
            class="cell ${s<=t.r&&e<=t.c?"on":""}"
            @pointerenter=${()=>{this._hover={r:s,c:e}}}
            @pointerdown=${()=>{this._hover={r:s,c:e}}}
            @click=${()=>this._pick(s+1,e+1)}
          ></div>
        `);const s=(t.r+1)*(t.c+1);return W`
      <div
        class="matrix"
        style="grid-template-columns: repeat(${i}, var(--ha-space-7, 28px))"
        @pointerleave=${()=>{this._hover=void 0}}
      >
        ${o}
      </div>
      <div class="caption">
        ${t.r+1} rows × ${t.c+1} cols
        ${s<this.minCells?W`<span class="warn">· grows to fit ${this.minCells} buttons</span>`:""}
      </div>
    `}_pick(t,e){this._hover=void 0,this.dispatchEvent(new CustomEvent("grid-picked",{detail:{rows:t,cols:e},bubbles:!0,composed:!0}))}};Qt.styles=n`
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
  `,t([pt({type:Number})],Qt.prototype,"rows",void 0),t([pt({type:Number})],Qt.prototype,"cols",void 0),t([pt({type:Number})],Qt.prototype,"minCells",void 0),t([ut()],Qt.prototype,"_hover",void 0),Qt=t([dt("remote-mapper-grid-picker")],Qt);const Zt={holdMs:500,multiMs:280,moveTolerance:10};class te{constructor(t,e={}){this._emit=t,this._taps=0,this._caps={double:!1,triple:!1,hold:!1},this._held=!1,this._down=!1,this._startX=0,this._startY=0,this._opts={...Zt,...e}}get pending(){return void 0!==this._multiTimer}down(t,e){this._down||(this._down=!0,this._held=!1,this._caps=e,this._startX=t.clientX,this._startY=t.clientY,void 0!==this._multiTimer&&(clearTimeout(this._multiTimer),this._multiTimer=void 0),e.hold&&(this._holdTimer=setTimeout(()=>{this._holdTimer=void 0,this._held=!0,this._taps=0,this._emit("hold")},this._opts.holdMs)))}move(t){if(!this._down)return;const e=t.clientX-this._startX,i=t.clientY-this._startY;e*e+i*i>this._opts.moveTolerance**2&&this.cancel()}up(){if(!this._down)return;if(this._down=!1,this._clearHold(),this._held)return this._held=!1,void this._emit("release");this._taps++;const{double:t,triple:e}=this._caps;this._taps>=3||2===this._taps&&!e||1===this._taps&&!t&&!e?this._flush():this._multiTimer=setTimeout(()=>{this._multiTimer=void 0,this._flush()},this._opts.multiMs)}cancel(){this._down=!1,this._held=!1,this._taps=0,this._clearHold(),void 0!==this._multiTimer&&(clearTimeout(this._multiTimer),this._multiTimer=void 0)}_flush(){const t=this._taps;this._taps=0,t>=3?this._emit("triple"):2===t?this._emit("double"):1===t&&this._emit("single")}_clearHold(){void 0!==this._holdTimer&&(clearTimeout(this._holdTimer),this._holdTimer=void 0)}}function ee(t){return function(t){return t.startsWith("mdi:")}(t)?W`<ha-icon class="mark-icon" icon=${t}></ha-icon>`:t}function ie(t,e,i,o,s="",r){const n=[...t].sort((t,i)=>{const o=e.buttons[t.id]??{row:1/0,col:1/0},s=e.buttons[i.id]??{row:1/0,col:1/0};return o.row-s.row||o.col-s.col}),a=[];for(const t of n){const n=[];for(const e of t.actions){if(e.action_id===o)continue;const t=i[e.action_id];n.push({actionId:e.action_id,event:e.event,swapWith:t?.assigned?t.summary:void 0})}if(n.length){const i=At(t,e);a.push({buttonId:t.id,label:r?`${r} · ${i}`:i,targets:n,entryId:s})}}return a}function oe(t,e,i){let o=t.actionId;if(!o&&t.buttonId){const s=i.find(e=>e.id===t.buttonId);o=s?Et(s,e.kind)?.action_id:void 0}if(o&&o!==e.actionId)return o}var se;let re=se=class extends at{constructor(){super(...arguments),this.buttons=[],this.slots={},this.display="assisted",this.editing=!1,this.entryId="",this.remoteTitle="",this.assistedTrigger="auto",this.chipsLayout="vertical",this.hideUnset=!1,this.kindIcons=bt,this._chipTipShown=!1,this._pressMode="tap",this._pressActive=!1,this._touchMoveBlocker=t=>{this._pressActive&&t.cancelable&&t.preventDefault()},this._recognizers=new Map,this._chipPressEnd=()=>{void 0!==this._chipTipTimer&&(clearTimeout(this._chipTipTimer),this._chipTipTimer=void 0)}}connectedCallback(){super.connectedCallback(),this.addEventListener("touchmove",this._touchMoveBlocker,{passive:!1})}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("touchmove",this._touchMoveBlocker),this._clearPressTimer();for(const t of this._recognizers.values())t.cancel()}_clearPressTimer(){void 0!==this._pressTimer&&(clearTimeout(this._pressTimer),this._pressTimer=void 0)}willUpdate(t){if(t.has("editing")||t.has("display")){this._popover=void 0,this._drag=void 0,this._dropTarget=void 0,this._actionDrag=void 0,this._actionDrop=void 0,this._leaveForeign();for(const t of this._recognizers.values())t.cancel()}}_emit(t,e){this.dispatchEvent(new CustomEvent(t,{detail:e,bubbles:!0,composed:!0}))}_run(t){const e=this.slots[t];e?.assigned&&!e.archived&&this._emit("run-action",{actionId:t})}_chipPressStart(t,e){"compact"===this.chipsLayout&&"mouse"!==t.pointerType&&(this._chipPressEnd(),this._chipTipShown=!1,this._chipTipTimer=setTimeout(()=>{this._chipTipTimer=void 0,this._chipTipShown=!0;const t=this.slots[e],i=this.buttons.flatMap(t=>t.actions).find(t=>t.action_id===e),o=`${i?wt[i.kind]:e}: ${t?.summary??"not set"}`;this._chipTip={action:e,text:o},setTimeout(()=>{this._chipTip?.action===e&&(this._chipTip=void 0)},1800)},450))}_recognizer(t){let e=this._recognizers.get(t.id);return e||(e=new te(e=>this._onGesture(t.id,e)),this._recognizers.set(t.id,e)),e}_live(t,e){const i=Et(t,e),o=i?this.slots[i.action_id]:void 0;return o?.assigned&&!o.archived?i.action_id:void 0}_caps(t){return{double:!!this._live(t,"double"),triple:!!this._live(t,"triple"),hold:!!this._live(t,"hold")}}_onGesture(t,e){const i=this.buttons.find(e=>e.id===t);if(!i)return;const o=this._live(i,e);o&&this._emit("run-action",{actionId:o})}_elementAt(t,e){return this.shadowRoot?.elementFromPoint(t,e)??null}_cellKeyAt(t,e){const i=this._elementAt(t,e)?.closest(".cell");return void 0!==i?.dataset.row?`${i.dataset.row},${i.dataset.col}`:void 0}_onCellDown(t,e,i,o){if("mouse"===t.pointerType&&0!==t.button)return;const s=t.currentTarget;if(this.editing)return s.setPointerCapture(t.pointerId),void(this._drag={id:e.id,row:i,col:o,startX:t.clientX,startY:t.clientY,x:t.clientX,y:t.clientY,moved:!1});"replica"===this.display?(s.setPointerCapture(t.pointerId),this._recognizer(e).down(t,this._caps(e))):"assisted"===this.display&&(s.setPointerCapture(t.pointerId),this._pressMode="auto"===this.assistedTrigger?"touch"===t.pointerType?"press":"tap":this.assistedTrigger,this._pressActive=!1,this._clearPressTimer(),"press"===this._pressMode&&(this._pressTimer=setTimeout(()=>{this._pressTimer=void 0,this._pressActive=!0,this._popover=e.id},400)))}_optAt(t,e){const i=this._elementAt(t,e)?.closest(".opt");return i?.dataset.action}_onCellMove(t,e){const i=this._drag;if(i){if(!i.moved){const e=t.clientX-i.startX,o=t.clientY-i.startY;if(e*e+o*o<64)return}return this._drag={...i,moved:!0,x:t.clientX,y:t.clientY},void(this._dropTarget=this._cellKeyAt(t.clientX,t.clientY))}if(!this.editing)if("replica"===this.display)this._recognizers.get(e.id)?.move(t);else if("assisted"===this.display&&this._popover===e.id){const e=this._optAt(t.clientX,t.clientY);e!==this._hoverOpt&&(this._hoverOpt=e)}}_onCellUp(t,e){const i=this._drag;if(i){const t=this._dropTarget;if(this._drag=void 0,this._dropTarget=void 0,i.moved){if(t&&this.layout){const[e,o]=t.split(",").map(Number),s=function(t,e,i){if(e.row===i.row&&e.col===i.col)return t;const o=kt(t),s=o.get($t(e.row,e.col));if(!s)return t;const r=o.get($t(i.row,i.col)),n={...t.buttons};return n[s]={...n[s],row:i.row,col:i.col},r&&(n[r]={...n[r],row:e.row,col:e.col}),{...t,buttons:n}}(this.layout,i,{row:e,col:o});s!==this.layout&&this._emit("layout-changed",{layout:s})}}else this._emit("open-button",{buttonId:i.id});return}if("replica"!==this.display){if("assisted"===this.display){const i=this._popover===e.id?this._optAt(t.clientX,t.clientY):void 0;this._hoverOpt=void 0;const o=this._pressActive;this._pressActive=!1,this._clearPressTimer(),i?(this._popover=void 0,this._run(i)):this._popover=o||this._popover===e.id?void 0:e.id}}else this._recognizers.get(e.id)?.up()}_onCellCancel(t){this._drag=void 0,this._dropTarget=void 0,this._hoverOpt=void 0,this._pressActive=!1,this._clearPressTimer(),this._recognizers.get(t.id)?.cancel()}_markHandlers(t){return this.editing?{pointerdown:e=>this._onMarkDown(e,t),pointermove:t=>this._onMarkMove(t),pointerup:t=>this._onMarkUp(t),pointercancel:()=>this._onMarkCancel()}:{}}_onMarkDown(t,e){"mouse"===t.pointerType&&0!==t.button||(t.stopPropagation(),t.currentTarget.setPointerCapture(t.pointerId),this._actionDrag={action:e,summary:this.slots[e.action_id]?.summary??"not set",startX:t.clientX,startY:t.clientY,x:t.clientX,y:t.clientY,moved:!1},this._actionDrop=void 0)}dropHitAt(t,e){const i=this._elementAt(t,e),o=i?.closest("[data-action]"),s=i?.closest(".cell.btn");return{actionId:o?.dataset.action,buttonId:s?.dataset.button}}_onMarkMove(t){const e=this._actionDrag;if(!e)return;if(t.stopPropagation(),!e.moved){const i=t.clientX-e.startX,o=t.clientY-e.startY;if(i*i+o*o<64)return;this._emit("mark-drag-start",{actionId:e.action.action_id})}this._actionDrag={...e,moved:!0,x:t.clientX,y:t.clientY};const i={actionId:e.action.action_id,kind:e.action.kind},o=this.dropHitAt(t.clientX,t.clientY);if(this._actionDrop=oe(o,i,this.buttons),o.actionId||o.buttonId)return void this._leaveForeign();const s=function(t,e){let i=t;for(;i;){const t=i.getRootNode();if(!(t instanceof ShadowRoot))return;if(e(t.host))return t.host;i=t.host}}(function(t,e,i){let o=t.elementFromPoint(e,i);for(;o?.shadowRoot;){const t=o.shadowRoot.elementFromPoint(e,i);if(!t||t===o)break;o=t}return o}(document,t.clientX,t.clientY),t=>t instanceof se);if(!s||s===this||!s.editing||!s.entryId)return void this._leaveForeign();this._foreign&&this._foreign.grid!==s&&this._leaveForeign();const r=s.entryId===this.entryId?i:{kind:i.kind},n=oe(s.dropHitAt(t.clientX,t.clientY),r,s.buttons);this._foreign={grid:s,target:n},s.externalDrop=n}_onMarkUp(t){const e=this._actionDrag;if(!e)return;t.stopPropagation();const i=this._actionDrop,o=this._foreign;if(this._actionDrag=void 0,this._actionDrop=void 0,this._leaveForeign(),!e.moved){const t=this.buttons.find(t=>t.actions.some(t=>t.action_id===e.action.action_id));return void(t&&this._emit("open-button",{buttonId:t.id}))}i?this._emit("move-action",{actionId:e.action.action_id,targetId:i}):o?.target&&this._emit("move-action",{actionId:e.action.action_id,targetId:o.target,target:o.grid.describe(o.target)})}describe(t){const e=this.layout;let i=t;for(const o of this.buttons){const s=o.actions.find(e=>e.action_id===t);if(s){i=`${e?At(o,e):o.label} ${s.event}`;break}}const o=this.slots[t];return{entryId:this.entryId,title:this.remoteTitle,label:i,swapWith:o?.assigned?o.summary:void 0}}_leaveForeign(){this._foreign&&(this._foreign.grid.externalDrop=void 0),this._foreign=void 0}_onMarkCancel(){this._actionDrag=void 0,this._actionDrop=void 0,this._leaveForeign()}_dropOn(t){return this._actionDrop===t||this.externalDrop===t}_padDropFor(t){return t.actions.some(t=>this._dropOn(t.action_id))}render(){const t=this.layout;if(!t)return Y;const e=kt(t),i=new Map(this.buttons.map(t=>[t.id,t])),o=[];for(let s=0;s<t.rows;s++)for(let r=0;r<t.cols;r++){const n=e.get(`${s},${r}`),a=n?i.get(n):void 0;o.push(a?this._renderButton(a,t,s,r):this._renderEmpty(s,r))}const s=this._drag,r=s?.moved?i.get(s.id):void 0;return W`
      ${this._popover?W`<div
            class="backdrop"
            @pointerdown=${()=>{this._popover=void 0}}
          ></div>`:Y}
      <div
        class="grid ${this.display} ${this.editing?"editing":""}"
        style="grid-template-columns: repeat(${t.cols}, minmax(0, 1fr))"
      >
        ${o}
      </div>
      ${r&&s?W`<div class="ghost" style="left:${s.x}px;top:${s.y}px">
            ${At(r,t)}
          </div>`:Y}
      ${this._actionDrag?.moved?W`<div
            class="ghost action-ghost"
            style="left:${this._actionDrag.x}px;top:${this._actionDrag.y}px"
          >
            <span class="icon">${ee(this.kindIcons[this._actionDrag.action.kind])}</span>
            ${this._actionDrag.summary}
          </div>`:Y}
    `}_renderEmpty(t,e){const i=`${t},${e}`;return W`<div
      class="cell empty ${this._dropTarget===i?"drop":""}"
      data-row=${t}
      data-col=${e}
    ></div>`}_renderButton(t,e,i,o){const s=`${i},${o}`,r=this.flash&&t.actions.some(t=>t.action_id===this.flash),n=t.actions.map(t=>this.slots[t.action_id]?.error).find(t=>!!t),a=["cell","btn",this._drag?.id===t.id&&this._drag.moved?"dragging":"",this._dropTarget===s||this._padDropFor(t)?"drop":"",this._popover===t.id?"active":"",r&&"all"!==this.display?"flash":""].join(" ");return W`
      <div
        class=${a}
        data-row=${i}
        data-col=${o}
        data-button=${t.id}
        @pointerdown=${e=>this._onCellDown(e,t,i,o)}
        @pointermove=${e=>this._onCellMove(e,t)}
        @pointerup=${e=>this._onCellUp(e,t)}
        @pointercancel=${()=>this._onCellCancel(t)}
        @contextmenu=${t=>{("assisted"===this.display||this.editing)&&t.preventDefault()}}
      >
        <span class="label">${At(t,e)}</span>
        ${"all"===this.display?this._renderChips(t):this._renderCompact(t)}
        ${this._chipTip&&t.actions.some(t=>t.action_id===this._chipTip.action)?W`<div class="chip-tip">${this._chipTip.text}</div>`:Y}
        ${n?W`<span class="badge err" title=${n}>!</span>`:Y}
        ${this._popover===t.id?this._renderPopover(t):Y}
      </div>
    `}_renderCompact(t){const e=t.actions.filter(t=>this.slots[t.action_id]?.assigned),i=e[0];return W`
      <span class="summary"
        >${i?this.slots[i.action_id].summary:"not set"}</span
      >
      <span class="kinds">
        ${t.actions.map(t=>{const e=this.slots[t.action_id],i=e?.assigned&&!e.archived,o=this._markHandlers(t),s=this.editing&&!!e?.linked,r=["kind",i?"on":"",s?"linked":"",this.flash===t.action_id?"flash":"",this._dropOn(t.action_id)?"drop":"",this._actionDrag?.moved&&this._actionDrag.action.action_id===t.action_id?"dragging":""].join(" ");return W`<span
            class=${r}
            data-action=${t.action_id}
            title="${t.event} (${wt[t.kind]}): ${e?.summary??"not set"}${s?" — linked":""}"
            @pointerdown=${o.pointerdown}
            @pointermove=${o.pointermove}
            @pointerup=${o.pointerup}
            @pointercancel=${o.pointercancel}
            >${ee(this.kindIcons[t.kind])}${s?W`<ha-icon class="link-badge" icon="mdi:link-variant"></ha-icon>`:Y}</span
          >`})}
      </span>
    `}_renderChips(t){const e=this.hideUnset&&!this.editing?t.actions.filter(t=>this.slots[t.action_id]?.assigned):t.actions;return W`
      <div class="chips ${this.chipsLayout}">
        ${e.map(t=>{const e=this.slots[t.action_id],i=this._markHandlers(t),o=this.editing&&!!e?.linked,s=["chip",e?.assigned?"on":"",e?.archived?"archived":"",o?"linked":"",this.flash===t.action_id?"flash":"",this._dropOn(t.action_id)?"drop":"",this._actionDrag?.moved&&this._actionDrag.action.action_id===t.action_id?"dragging":""].join(" ");return W`
            <button
              class=${s}
              data-action=${t.action_id}
              title="${t.event} (${wt[t.kind]}): ${e?.summary??"not set"}${o?" — linked":""}"
              @pointerdown=${i.pointerdown??(e=>this._chipPressStart(e,t.action_id))}
              @pointermove=${i.pointermove}
              @pointerup=${i.pointerup??this._chipPressEnd}
              @pointercancel=${i.pointercancel??this._chipPressEnd}
              @contextmenu=${t=>{this._chipTip&&t.preventDefault()}}
              @click=${e=>{if(this._chipTipShown)return e.stopPropagation(),void(this._chipTipShown=!1);this.editing||(e.stopPropagation(),this._run(t.action_id))}}
            >
              <span class="icon">${ee(this.kindIcons[t.kind])}</span>
              <span class="text">${e?.summary??"not set"}</span>
              ${e?.error?W`<span class="err" title=${e.error}>!</span>`:Y}
              ${e?.stale?W`<span class="stale" title="Source no longer reports this action">stale</span>`:Y}
              ${o?W`<ha-icon class="link-badge" icon="mdi:link-variant" title="linked"></ha-icon>`:Y}
            </button>
          `})}
      </div>
    `}_renderPopover(t){const e=function(t){if(t<=1)return[0];if(t<=4){const e=2===t?70:3===t?120:165;return Array.from({length:t},(i,o)=>-e/2+o*e/(t-1))}return Array.from({length:t},(e,i)=>360*i/t)}(t.actions.length),i=this._hoverOpt?t.actions.find(t=>t.action_id===this._hoverOpt):void 0,o=i?`${wt[i.kind]}: ${this.slots[i.action_id]?.summary??"not set"}`:this._pressActive?"slide to an event, lift to run":"tap an event";return W`
      <div class="popover">
        <div class="opt-status">${o}</div>
        ${t.actions.map((t,i)=>{const o=this.slots[t.action_id],s=o?.assigned&&!o.archived,r=this._hoverOpt===t.action_id?"hover":"",n=e[i]*Math.PI/180,a=50+34*Math.sin(n),c=50-34*Math.cos(n);return W`
            <div
              class="opt ${s?"on":""} ${r}"
              style="--i:${i};left:${a.toFixed(1)}%;top:${c.toFixed(1)}%"
              data-action=${t.action_id}
            >
              <span class="circle" title="${t.event} (${wt[t.kind]})"
                >${ee(this.kindIcons[t.kind])}</span
              >
            </div>
          `})}
      </div>
    `}};re.styles=n`
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
    /* mdi marks: sized like the text they replace, in every place a mark shows */
    .mark-icon {
      --mdc-icon-size: var(--ha-space-4, 16px);
      display: inline-flex;
    }
    .circle .mark-icon {
      --mdc-icon-size: var(--ha-space-5, 20px);
    }
    /* Edit mode: marks and chips are drag handles — touch-sized, and the
       browser must not scroll while a finger drags one */
    .grid.editing .kind,
    .grid.editing .chip {
      touch-action: none;
      cursor: grab;
    }
    /* The circle keeps its size so the grid does not jump; the grab area
       grows invisibly to a touch target (24px + 2*8px = 40px) */
    .kind {
      position: relative;
    }
    .grid.editing .kind::before {
      content: "";
      position: absolute;
      inset: calc(-1 * var(--ha-space-2, 8px));
    }
    .link-badge {
      --mdc-icon-size: var(--ha-space-3, 12px);
      color: var(--secondary-text-color);
      flex: none;
    }
    .kind .link-badge {
      position: absolute;
      right: calc(-1 * var(--ha-space-1, 4px));
      bottom: calc(-1 * var(--ha-space-1, 4px));
      border-radius: var(--ha-border-radius-circle, 50%);
      background: var(--rm-bg);
    }
    .kind.dragging,
    .chip.dragging {
      opacity: 0.25;
    }
    .kind.drop,
    .chip.drop {
      outline: 2px dashed var(--rm-ac);
      outline-offset: 2px;
      opacity: 1;
    }
    .action-ghost {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      max-width: 60vw;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .action-ghost .icon {
      font-weight: var(--ha-font-weight-bold, 700);
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
  `,t([pt({attribute:!1})],re.prototype,"buttons",void 0),t([pt({attribute:!1})],re.prototype,"layout",void 0),t([pt({attribute:!1})],re.prototype,"slots",void 0),t([pt()],re.prototype,"display",void 0),t([pt({type:Boolean})],re.prototype,"editing",void 0),t([pt()],re.prototype,"entryId",void 0),t([pt()],re.prototype,"remoteTitle",void 0),t([pt({attribute:!1})],re.prototype,"externalDrop",void 0),t([pt()],re.prototype,"flash",void 0),t([pt()],re.prototype,"assistedTrigger",void 0),t([pt()],re.prototype,"chipsLayout",void 0),t([pt({type:Boolean})],re.prototype,"hideUnset",void 0),t([pt({attribute:!1})],re.prototype,"kindIcons",void 0),t([ut()],re.prototype,"_popover",void 0),t([ut()],re.prototype,"_hoverOpt",void 0),t([ut()],re.prototype,"_chipTip",void 0),t([ut()],re.prototype,"_drag",void 0),t([ut()],re.prototype,"_dropTarget",void 0),t([ut()],re.prototype,"_actionDrag",void 0),t([ut()],re.prototype,"_actionDrop",void 0),re=se=t([dt("remote-mapper-grid")],re);const ne=new Map;const ae='This event is linked to a native automation. Edit its actions in HA, or untick "Keep linked" to absorb your changes into the card.';const ce="0.1.12";function de(t,e){return!e||t.startsWith("__")||e===t?"current":function(t,e){const i=t.split(".").map(t=>parseInt(t,10)||0),o=e.split(".").map(t=>parseInt(t,10)||0);for(let t=0;t<Math.max(i.length,o.length);t++){const e=(i[t]??0)-(o[t]??0);if(e)return e}return 0}(t,e)>0?"ahead":"stale"}function he(t,e){return Math.max(e,Math.round(t/e)*e)}function le(t,e){return Math.round(t/e)*e}function pe(t){const e=t.cell;if("number"==typeof e&&Number.isFinite(e))return{x:e,y:e};const i=e??{};return{x:"number"==typeof i.x&&Number.isFinite(i.x)?i.x:10,y:"number"==typeof i.y&&Number.isFinite(i.y)?i.y:10}}function ue(t){return t.map((t,e)=>({w:t,i:e})).sort((t,e)=>(t.w.z??0)-(e.w.z??0)||t.i-e.i).map(t=>t.w)}function _e(t,e){const i=new Map;return t.forEach((t,e)=>i.set(t.id,e+1)),e.map(t=>({...t,z:i.get(t.id)??t.z??1}))}function me(t){return _e(ue(t),t)}const ve=new Map;function ge(t,e){const i={canvasId:t,active:!0,working:e,original:e.map(t=>({...t})),selectedId:null,undoStack:[],dpadMode:"fine"};return ve.set(t,i),i}function fe(t){return JSON.stringify(ye(t))}function ye(t){if(Array.isArray(t))return t.map(ye);if(t&&"object"==typeof t){const e={};for(const i of Object.keys(t).sort()){const o=t[i];void 0!==o&&(e[i]=ye(o))}return e}return t}function be(t){return null==t?t:JSON.parse(JSON.stringify(t))}class we{constructor(t){this.session=null,this.drag=null,this.lpStart=null,this.keydownBound=t=>this.onKeyDown(t),this.host=t}get active(){return this.session?.active??!1}get working(){return this.session?.working??[]}get selectedId(){return this.session?.selectedId??null}get selected(){const t=this.selectedId;return t?this.working.find(e=>e.id===t):void 0}get dpadMode(){return this.session?.dpadMode??"fine"}get dpadSteps(){if("fine"===this.dpadMode)return{x:1,y:1};const t=this.host.config();return t?pe(t.grid):{x:1,y:1}}get dirty(){return!!this.session&&!function(t,e){return fe(t)===fe(e)}(this.session.working,this.session.original)}get canUndo(){return(this.session?.undoStack.length??0)>0}get dragging(){return null!==this.drag}tryResume(){const t=this.host.config(),e=(i=t?.canvas_id,i?ve.get(i):void 0);var i;return!!e?.active&&(this.session=e,window.addEventListener("keydown",this.keydownBound),!0)}enter(){if(this.session?.active)return;const t=this.host.config();t?.canvas_id&&(this.session=ge(t.canvas_id,be(t.widgets)),window.addEventListener("keydown",this.keydownBound),this.host.requestUpdate())}async done(){const t=this.session;if(!t)return;const e=me(t.working);this.teardown();if(!await this.host.saveWorking(e)){const i=this.host.config();this.session=ge(t.canvasId,e),this.session.original=be(i?.widgets??[]),window.addEventListener("keydown",this.keydownBound)}this.host.requestUpdate()}cancel(t=!1){this.session&&(t||!this.dirty||window.confirm("Discard layout changes? Event edits made in this session are already saved."))&&(this.teardown(),this.host.requestUpdate())}detach(){window.removeEventListener("keydown",this.keydownBound),this.clearDpadRepeat(),this.cancelLongPress(),this.session=null}teardown(){var t;window.removeEventListener("keydown",this.keydownBound),this.clearDpadRepeat(),this.cancelLongPress(),t=this.session?.canvasId,t&&ve.delete(t),this.session=null,this.drag=null}pushUndo(){const t=this.session;t&&(t.undoStack.push(be(t.working)),t.undoStack.length>25&&t.undoStack.shift())}undo(){const t=this.session;if(!t)return;const e=t.undoStack.pop();e&&(t.working=e,t.selectedId&&!e.some(e=>e.id===t.selectedId)&&(t.selectedId=null),this.host.requestUpdate())}select(t){const e=this.session;e&&(e.selectedId=t,this.host.requestUpdate())}updateWidget(t,e,i){const o=this.session;o&&(!1!==i?.undo&&this.pushUndo(),o.working=o.working.map(i=>i.id===t?{...i,...e}:i),this.host.requestUpdate())}zOp(t){const e=this.session;e?.selectedId&&(this.pushUndo(),e.working=function(t,e,i){const o=ue(t),s=o.findIndex(t=>t.id===e);if(-1===s)return me(t);const r=o.splice(s,1)[0];switch(i){case"forward":o.splice(Math.min(s+1,o.length),0,r);break;case"backward":o.splice(Math.max(s-1,0),0,r);break;case"front":o.push(r);break;case"back":o.unshift(r)}return _e(o,t)}(e.working,e.selectedId,t),this.host.requestUpdate())}ensureTiles(t,e){const i=this.session;if(!i)return;const o=new Set(i.working.map(t=>t.id)),s=e.filter(t=>!o.has(t));if(!s.length)return;this.pushUndo();const r=s.map((e,o)=>{return{...t(e,o),z:(s=i.working,s.reduce((t,e)=>Math.max(t,e.z??0),0)+1+o)};var s});i.working=[...i.working,...r],this.host.requestUpdate()}toggleDpadStep(){const t=this.session;t&&(t.dpadMode="fine"===t.dpadMode?"cell":"fine",this.host.requestUpdate())}nudge(t,e){const i=this.session,o=this.host.config(),s=this.selected;if(!i||!o||!s)return;const r=$e(s.x+t,0,Math.max(0,o.design_size.width-s.w)),n=$e(s.y+e,0,Math.max(0,o.design_size.height-s.h));r===s.x&&n===s.y||this.updateWidget(s.id,{x:xe(r),y:xe(n)},{undo:!1})}dpadPress(t,e){if(!this.session)return;this.pushUndo();const i=()=>{const i=this.dpadSteps;this.nudge(t*i.x,e*i.y)};i(),this.clearDpadRepeat(),this.dpadTimer=window.setTimeout(()=>{this.dpadInterval=window.setInterval(i,70)},350)}dpadRelease(){this.clearDpadRepeat()}clearDpadRepeat(){void 0!==this.dpadTimer&&clearTimeout(this.dpadTimer),void 0!==this.dpadInterval&&clearInterval(this.dpadInterval),this.dpadTimer=this.dpadInterval=void 0}onKeyDown(t){if(!this.session?.active)return;if(function(t){const e=t.composedPath();for(const t of e){if(!(t instanceof HTMLElement))continue;const e=t.localName;if("input"===e||"textarea"===e||"select"===e)return!0;if(t.isContentEditable)return!0;const i=t.getAttribute?.("role");if("textbox"===i||"combobox"===i||"searchbox"===i)return!0}return!1}(t))return;switch(t.key){case"Escape":return t.preventDefault(),void this.cancel();case"z":return void((t.ctrlKey||t.metaKey)&&(t.preventDefault(),this.undo()))}const e={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[t.key];if(e&&this.selectedId){t.preventDefault();const i=this.dpadSteps,o=t.shiftKey?5:1;t.repeat||this.pushUndo(),this.nudge(e[0]*i.x*o,e[1]*i.y*o)}}onSlotPointerDown(t,e){const i=this.session;if(!i||this.drag||t.button>0)return;t.preventDefault(),t.stopPropagation(),i.selectedId!==e&&this.select(e);const o=this.working.find(t=>t.id===e);o&&this.startDrag(t,{kind:"move",pointerId:t.pointerId,widgetId:e,startClientX:t.clientX,startClientY:t.clientY,orig:{...o},moved:!1,next:{x:o.x,y:o.y,w:o.w,h:o.h}})}onHandlePointerDown(t,e,i){if(!this.session||this.drag||t.button>0)return;t.preventDefault(),t.stopPropagation();const o=this.working.find(t=>t.id===e);o&&this.startDrag(t,{kind:"resize",pointerId:t.pointerId,widgetId:e,startClientX:t.clientX,startClientY:t.clientY,orig:{...o},corner:i,moved:!1,next:{x:o.x,y:o.y,w:o.w,h:o.h}})}startDrag(t,e){this.drag=e;const i=t.currentTarget;try{i.setPointerCapture(t.pointerId)}catch{}const o=t=>this.onDragMove(t),s=t=>{t.pointerId===e.pointerId&&(i.removeEventListener("pointermove",o),i.removeEventListener("pointerup",s),i.removeEventListener("pointercancel",r),this.finishDrag(!1))},r=t=>{t.pointerId===e.pointerId&&(i.removeEventListener("pointermove",o),i.removeEventListener("pointerup",s),i.removeEventListener("pointercancel",r),this.finishDrag(!0))};i.addEventListener("pointermove",o),i.addEventListener("pointerup",s),i.addEventListener("pointercancel",r)}onDragMove(t){const e=this.drag,i=this.host.config();if(!e||!i||t.pointerId!==e.pointerId)return;const o=this.host.scale()||1,s=(t.clientX-e.startClientX)/o,r=(t.clientY-e.startClientY)/o;if(!e.moved&&Math.hypot(s*o,r*o)<3)return;e.moved=!0;const n=i.design_size,a=pe(i.grid);if("move"===e.kind)e.next.x=$e(e.orig.x+s,0,Math.max(0,n.width-e.orig.w)),e.next.y=$e(e.orig.y+r,0,Math.max(0,n.height-e.orig.h));else{const t=e.corner,i=t=>Math.max(a.x,Math.floor(t/a.x)*a.x),o=t=>Math.max(a.y,Math.floor(t/a.y)*a.y);let{x:c,y:d,w:h,h:l}=e.orig;if("se"!==t&&"ne"!==t||(h=e.orig.w+s),"sw"!==t&&"nw"!==t||(h=e.orig.w-s),"se"!==t&&"sw"!==t||(l=e.orig.h+r),"ne"!==t&&"nw"!==t||(l=e.orig.h-r),h=$e(he(h,a.x),a.x,n.width),l=$e(he(l,a.y),a.y,n.height),"sw"===t||"nw"===t){const t=e.orig.x+e.orig.w;h>t&&(h=i(t)),c=xe(t-h)}else c+h>n.width&&(h=i(n.width-c));if("ne"===t||"nw"===t){const t=e.orig.y+e.orig.h;l>t&&(l=o(t)),d=xe(t-l)}else d+l>n.height&&(l=o(n.height-d));e.next={x:c,y:d,w:h,h:l}}const c=this.host.slotEl(e.widgetId);c&&(c.style.transform=`translate3d(${e.next.x}px, ${e.next.y}px, 0)`,"resize"===e.kind&&(c.style.width=`${e.next.w}px`,c.style.height=`${e.next.h}px`)),this.updateBadgeText(e.next)}finishDrag(t){const e=this.drag,i=this.host.config();if(this.drag=null,!e||!i)return;if(t||!e.moved)return this.syncSlotStyle(e.widgetId,e.orig),void this.host.requestUpdate();let{x:o,y:s}=e.next;if("move"===e.kind&&i.grid.snap_position){const t=pe(i.grid);o=$e(le(o,t.x),0,Math.max(0,i.design_size.width-e.next.w)),s=$e(le(s,t.y),0,Math.max(0,i.design_size.height-e.next.h))}const r={x:xe(o),y:xe(s),w:e.next.w,h:e.next.h};this.syncSlotStyle(e.widgetId,r),this.updateBadgeText(r),this.pushUndo(),this.updateWidget(e.widgetId,r,{undo:!1})}syncSlotStyle(t,e){const i=this.host.slotEl(t);i&&(i.style.transform=`translate3d(${e.x}px, ${e.y}px, 0)`,i.style.width=`${e.w}px`,i.style.height=`${e.h}px`)}updateBadgeText(t){const e=this.host.badgeEl();e&&(e.textContent=`x ${Math.round(t.x)}  y ${Math.round(t.y)}  ·  ${t.w}×${t.h}`)}onViewPointerDown(t){if(this.session?.active||t.button>0)return;const e=t.composedPath();for(const t of e)if(t instanceof HTMLElement){if(t.classList?.contains("widget-slot"))return;if(t.classList?.contains("pencil"))return}this.lpStart={x:t.clientX,y:t.clientY},this.lpTimer=window.setTimeout(()=>{this.lpTimer=void 0,this.enter()},800)}onViewPointerMove(t){void 0!==this.lpTimer&&this.lpStart&&Math.hypot(t.clientX-this.lpStart.x,t.clientY-this.lpStart.y)>18&&this.cancelLongPress()}cancelLongPress(){void 0!==this.lpTimer&&clearTimeout(this.lpTimer),this.lpTimer=void 0,this.lpStart=null}}function $e(t,e,i){return Math.min(i,Math.max(e,t))}function xe(t){return Math.round(100*t)/100}function ke(t){if(t&&"object"==typeof t){const e=t,i="string"==typeof e.message&&e.message?e.message:void 0;if("not_found"===e.code)return`${i??"Remote not found"} — it was removed or never existed. Open the card editor and pick another remote.`;if(i)return i;if(t instanceof Error)return t.message||t.name;try{return JSON.stringify(t)}catch{return String(t)}}return String(t)}const Se={turn_on:"Turn on",turn_off:"Turn off",toggle:"Toggle",open_cover:"Open",close_cover:"Close",stop_cover:"Stop",open_cover_tilt:"Tilt open",close_cover_tilt:"Tilt close",lock:"Lock",unlock:"Unlock",press:"Press",start:"Start",pause:"Pause",stop:"Stop",return_to_base:"Dock",media_play:"Play",media_pause:"Pause",media_play_pause:"Play / pause",media_stop:"Stop",media_next_track:"Next track",media_previous_track:"Previous track",volume_up:"Volume up",volume_down:"Volume down",volume_mute:"Mute",increment:"Increment",decrement:"Decrement",set_value:"Set",set_temperature:"Set temperature",set_hvac_mode:"Set mode",set_preset_mode:"Set preset",trigger:"Trigger",reload:"Reload",notify:"Notify",send_message:"Send message"},Ae=[["if","Conditional"],["choose","Choose"],["repeat","Repeat"],["parallel","Parallel"],["sequence","Sequence"],["wait_template","Wait"],["wait_for_trigger","Wait"],["delay","Delay"],["event","Fire event"],["variables","Variables"],["stop","Stop"]],Ee=t=>t.replace(/_/g," ").replace(/^\w/,t=>t.toUpperCase()),Te=t=>Array.isArray(t)?t.filter(t=>"string"==typeof t):"string"==typeof t?[t]:[];function Me(t,e){const i=e?.states?.[t]?.attributes?.friendly_name;return"string"==typeof i&&i?i:t}function ze(t,e){if(!t||"object"!=typeof t)return"";const i=t;if("string"==typeof i.alias&&i.alias.trim())return i.alias.trim();if("string"==typeof i.scene)return Me(i.scene,e);for(const[t,e]of Ae)if(t in i)return e;const o=i.action??i.service;if("string"!=typeof o)return Ee(Object.keys(i)[0]??"");const[s,r=""]=o.split("."),n=function(t,e){const i=t.target??{},o=[...Te(i.entity_id??t.entity_id??t.data?.entity_id).map(t=>Me(t,e)),...Te(i.area_id).map(t=>e?.areas?.[t]?.name||t),...Te(i.floor_id).map(t=>e?.floors?.[t]?.name||t),...Te(i.device_id).map(t=>e?.devices?.[t]?.name_by_user||e?.devices?.[t]?.name||t)];return o.length?1===o.length?o[0]:`${o[0]} +${o.length-1}`:""}(i,e);if("scene"===s&&"turn_on"===r)return n||"Scene";if("script"===s)return"turn_on"===r?n||"Script":Me(o,e);if("select_option"===r){const t=i.data?.option??i.option;return"string"==typeof t&&t?n?`${t} · ${n}`:t:n?`Select · ${n}`:"Select option"}const a=Se[r]??Ee(r);if(n)return`${a} ${n}`;if(r in Se)return a;const c=t=>t.replace(/_/g," ");return"notify"===s?`Notify ${c(r)}`:`${a} ${c(s)}`}function Ie(t,e){if(!t.length)return"";const i=ze(t[0],e);return t.length>1?`${i} +${t.length-1}`:i}const Ce="remote_mapper_remote:",De="only";function Oe(){try{return globalThis.localStorage}catch{return}}function Pe(t,e=Oe()){try{e?.removeItem(Ce+t)}catch{}}let He=!1;async function Re(){try{const t=await(window.caches?.keys());await Promise.all((t??[]).map(t=>window.caches.delete(t)))}catch{}window.location.reload()}const Le="remote-mapper-card",qe=20,Ne=new Set(["new_scene","new_automation","new_remote_automation"]);function Be(t){const e=Math.max(1,t.length),i=Math.max(2,Math.ceil(Math.sqrt(e))),o=Math.ceil(e/i);return{schema_version:1,design_size:{width:Math.max(380,120*i+qe),height:80*o+qe},grid:{cell:10,snap_position:!1},widgets:t.map((t,e)=>({id:t,kind:"slot",x:qe+e%i*120,y:qe+80*Math.floor(e/i),w:100,h:60,z:e+1}))}}function Ue(t,e,i){const o=t=>[{action:t,target:{entity_id:e}}];return"scene"===t?o("scene.turn_on"):"toggle"===t?o("homeassistant.toggle"):"wled_preset"===t?[{action:"select.select_option",target:{entity_id:e},data:{option:i}}]:o("script.turn_on")}let We=class extends at{constructor(){super(...arguments),this._stale=!1,this._hostWidth=0,this.preview=!1,this._dragHintSeen=!0,this._editHelpCollapsed=!1,this._onPrefs=t=>{const e=t.detail??{};void 0!==e.tipsSeen&&(this._tipsSeen=e.tipsSeen),void 0!==e.dragHintSeen&&(this._dragHintSeen=e.dragHintSeen),void 0!==e.editHelpCollapsed&&(this._editHelpCollapsed=e.editHelpCollapsed)},this._gridEditing=!1,this._pickerOpen=!1,this._tipShown=!1,this._modalOpenedAt=0,this._ghostGuard={handleEvent:t=>{Date.now()-this._modalOpenedAt<350&&(t.stopPropagation(),t.preventDefault())},capture:!0},this._editorTab="quick",this._quickMode="scene",this._quickEntity="",this._quickOption="",this._snapEntities=[],this._snapDevices=[],this._snapRemember=!1,this._draft="",this._draftName="",this._yamlValid=!0,this._draftMaterialized=!1,this._haFormOk=!1,this._yamlEditorOk=!1,this._clearRemember=!1,this._moveOpen=!1,this._remoteCount=1,this._releaseOpen=!1,this._releaseConvert=!0,this._releaseBusy=!1,this._importSelected=new Set,this._importOverwrite=!1,this._importBusy=!1,this._fetchStarted=!1,this._edit=new we(this),this._dismissToast=()=>{void 0!==this._toastTimer&&clearTimeout(this._toastTimer),this._toastTimer=void 0,this._toast=void 0},this._enterGridEdit=()=>{this._remote&&(this._setGridDraft(xt(this._remote.grid_layout,this._remote.buttons??[])),this._gridEditing=!0,this._refreshActions(!0),this._countRemotes())},this._cancelGridEdit=()=>{var t;this._gridEditing=!1,this._gridDraft=void 0,(t=this._entryId)&&ne.delete(t),this._pickerOpen=!1,this._buttonSheet=void 0},this._onGridPicked=t=>{const e=this._gridDraft;var i,o,s,r;e&&this._remote&&(this._setGridDraft((i=e,o=t.detail.rows,s=t.detail.cols,r=this._remote.buttons??[],xt({...i,rows:o,cols:s},r))),this._pickerOpen=!1)},this._openImport=async()=>{this._importError=void 0,this._importOverwrite=!1,this._importBusy=!1;try{const t=await this._hass.callWS({type:"remote_mapper/scan_import",entry_id:this._entryId});this._importSelected=new Set(t.proposals.flatMap((t,e)=>t.conflict?[]:[e])),this._importScan=t}catch(t){this._error=ke(t)}},this._enterEdit=()=>{this._edit.enter();const t=this._remote?.layout?.actions??[],e=this._currentLayout();if(e){const i=new Map(e.widgets.map(t=>[t.id,t]));this._edit.ensureTiles(t=>i.get(t)??Be([t]).widgets[0],t)}}}async _loadTips(){if(this._hass)try{const t=await Mt(this._hass);this._tipsSeen=t.tipsSeen,this._dragHintSeen=t.dragHintSeen,this._editHelpCollapsed=t.editHelpCollapsed}catch{}}_toggleEditHelp(){this._editHelpCollapsed=!this._editHelpCollapsed,async function(t,e){await t.callWS({type:"remote_mapper/set_prefs",edit_help_collapsed:e}),It({editHelpCollapsed:e})}(this._hass,this._editHelpCollapsed).catch(()=>{})}_onDragStart(){this._dragHintSeen||(this._dragHintSeen=!0,this.notify("Drop it on another event or button to move the action there. With another remote's card in edit mode too, drop it on that card to move it to that remote."),async function(t,e=!0){await t.callWS({type:"remote_mapper/set_prefs",drag_hint_seen:e}),It({dragHintSeen:e})}(this._hass).catch(()=>{}))}async _setTipsSeen(t){this._tipsSeen=t;try{await async function(t,e){const i=Ct(e);return await t.callWS({type:"remote_mapper/set_prefs",tips_seen:i}),It({tipsSeen:i}),i}(this._hass,t)}catch{}}_backdropClick(t){return e=>{e.target===e.currentTarget&&(Date.now()-this._modalOpenedAt<350||t())}}set hass(t){const e=!1===this._hass?.connected&&!0===t.connected;this._hass=t,e&&this._fetchStarted&&this._remote&&this._fetchRemote(),void 0!==this._buttonSheet&&this.requestUpdate(),!this._fetchStarted&&this._config&&(this._fetchStarted=!0,this._initialize()),void 0!==this._tipsSeen||this.preview||this._loadTips()}setConfig(t){this._config&&t.entry_id!==this._config.entry_id&&this._cancelGridEdit(),this._config=t,this._entryId=t.entry_id,this._fetchStarted=!1,this._hass&&(this._fetchStarted=!0,this._initialize())}getCardSize(){if(this._isGrid()){const t=this._gridLayout(),e="all"===Lt(this._config)?2:1;return t?1+t.rows*e:3}const t=this._currentLayout();return t?1+Math.ceil(t.design_size.height/100):3}getGridOptions(){return{columns:12,min_columns:6}}static getConfigElement(){return document.createElement("remote-mapper-card-editor")}static getStubConfig(){return{layout:"grid",display:"assisted"}}connectedCallback(){super.connectedCallback(),this._resizeObserver=new ResizeObserver(t=>{const e=t[0]?.contentRect.width??0;e&&Math.abs(e-this._hostWidth)>.5&&(this._hostWidth=e)}),this._resizeObserver.observe(this),window.addEventListener(zt,this._onPrefs),this._edit.tryResume()&&this.requestUpdate(),this._fetchStarted&&!this._unsubEvents&&this._subscribe()}disconnectedCallback(){super.disconnectedCallback(),this._resizeObserver?.disconnect(),window.removeEventListener(zt,this._onPrefs),this._unsubEvents?.(),this._unsubEvents=void 0,this._unsubActions?.(),this._unsubActions=void 0,this._edit.detach(),clearTimeout(this._tipTimer),clearTimeout(this._tipHideTimer),this._tip=void 0,this._dismissToast()}async _initialize(){if(!this._remote&&!this.preview){const t=function(t,e=Oe()){try{const i=e?.getItem(Ce+t);if(!i)return;const o=JSON.parse(i);if(!o||"object"!=typeof o||!("entry_id"in o))return;return o}catch{return}}(this._entryId??De);t&&(this._remote=t,this._stale=!0)}try{if(!this._entryId){const t=await this._hass.callWS({type:"remote_mapper/list_remotes"});if(1!==t.remotes.length)return this._dropStale(),Pe(De),void(this._remoteChoices=t.remotes);this._entryId=t.remotes[0].entry_id}await this._fetchRemote(),this._resumeGridEdit(),await this._subscribe()}catch(t){this._dropStale(),this._error=ke(t)}}_dropStale(){this._stale&&(this._remote=void 0,this._stale=!1)}async _subscribe(){this._unsubEvents||(this._unsubEvents=await this._hass.connection.subscribeEvents(t=>{t.data.entry_id===this._entryId&&this._fetchRemote()},"remote_mapper_updated"),this._unsubActions=await this._hass.connection.subscribeEvents(t=>{t.data.entry_id===this._entryId&&this._flashAction(t.data.action_id)},"remote_mapper_action"))}_flashAction(t){this._flash=t,void 0!==this._flashTimer&&clearTimeout(this._flashTimer),this._flashTimer=setTimeout(()=>{this._flashTimer=void 0,this._flash=void 0},400)}async _fetchRemote(){try{this._remote=await this._hass.callWS({type:"remote_mapper/get_remote",entry_id:this._entryId}),this._stale=!1,this._error=void 0,function(t,e,i=Oe()){try{const o=JSON.stringify(t);i?.setItem(Ce+t.entry_id,o),e&&i?.setItem(Ce+De,o)}catch{}}(this._remote,!this._config?.entry_id)}catch(t){this._dropStale(),this._entryId&&Pe(this._entryId),this._error=ke(t)}}config(){return this._currentLayout()}scale(){return this._transform()?.scale??1}slotEl(t){return this.shadowRoot?.querySelector(`[data-slot-id="${CSS.escape(t)}"]`)??null}badgeEl(){return this.shadowRoot?.querySelector(".badge")??null}async saveWorking(t){const e=this._currentLayout();if(!e)return!1;try{return await this._hass.callWS({type:"remote_mapper/save_layout",entry_id:this._entryId,card_layout:{...be(e),widgets:t}}),!0}catch(t){return this.notify(`Layout save failed: ${String(t)}`),!1}}openSettings(t){this._openEditor(t)}_navigate(t){window.history.pushState(null,"",t),window.dispatchEvent(new CustomEvent("location-changed",{detail:{replace:!1}}))}_automationEditPath(t){return t?.materialized&&t.automation_id?`/config/automation/edit/${t.automation_id}`:void 0}_targetEditor(t){const e=(t?.sequence?.length?t.sequence:t?.live_actions??[])[0];if(!e)return;const i=e.action??e.service;let o=e.target?.entity_id??e.entity_id??e.scene;if(Array.isArray(o)&&(o=o[0]),"string"!=typeof o)return;const s=this._hass?.states?.[o]?.attributes?.friendly_name??o;if(o.startsWith("scene.")&&("scene.turn_on"===i||e.scene)){const t=this._hass?.states?.[o]?.attributes?.id;if("string"!=typeof t)return;return{icon:"mdi:palette",title:`Edit scene: ${s}`,path:`/config/scene/edit/${t}`}}if(o.startsWith("script.")&&("script.turn_on"===i||i===o))return{icon:"mdi:script-text",title:`Edit script: ${s}`,path:`/config/script/edit/${o.slice(7)}`};if("string"==typeof i&&i.startsWith("script.")&&"script.turn_on"!==i){const t=i.slice(7);return{icon:"mdi:script-text",title:`Edit script: ${this._hass?.states?.[i]?.attributes?.friendly_name??t}`,path:`/config/script/edit/${t}`}}}_importedSources(t){const e=t?.imported_from;if(!e)return[];return(e.sources?.length?e.sources:[e]).filter(t=>!!t.config_id)}async _confirm(t){try{const e=await mt();if(e?.showConfirmationDialog)return!!await e.showConfirmationDialog(this,{title:t.title,text:t.text,confirmText:t.confirmText,dismissText:"Cancel",destructive:t.destructive})}catch{}return window.confirm(`${t.title}\n\n${t.text}`)}notify(t){this._toast=t,void 0!==this._toastTimer&&clearTimeout(this._toastTimer),this._toastTimer=setTimeout(()=>this._dismissToast(),6e3)}_renderToast(){return this._toast?W`<div class="toast" role="status" @click=${this._dismissToast}>
      ${this._toast}
    </div>`:Y}_currentLayout(){if(!this._remote)return;const t=this._remote.layout?.actions??[],e=this._remote.card_layout,i=e&&Array.isArray(e.widgets)&&e.design_size?e:Be(t),o=new Set(i.widgets.map(t=>t.id)),s=t.filter(t=>!o.has(t));if(!s.length)return{...i,canvas_id:this._entryId};const r=Be(s).widgets.map((t,e)=>({...t,y:i.design_size.height+qe+80*Math.floor(e/3)}));return{...i,canvas_id:this._entryId,design_size:{width:i.design_size.width,height:i.design_size.height+80*(Math.floor((r.length-1)/3)+1)+qe},widgets:[...i.widgets,...r]}}_transform(){const t=this._currentLayout();if(!t)return;const e=this._hostWidth||this.getBoundingClientRect().width||300;return function(t,e){{const i=Math.max(1,e)/t.width;return{scale:i,offsetX:0,offsetY:0,viewportHeight:t.height*i}}}(t.design_size,e)}_renderTitle(){return!1===this._config?.show_title?W`<span class="title"></span>`:W`<span class="title">${this._config?.title||this._remote?.title}</span>`}_isGrid(){return"grid"===qt(this._config)}_gridLayout(){if(this._remote)return this._gridEditing&&this._gridDraft?this._gridDraft:xt(this._remote.grid_layout,this._remote.buttons??[])}_slotViews(t=this._remote){const e={};if(!t)return e;const i=new Set(t.stale_actions??[]);for(const o of t.buttons??[])for(const s of o.actions){const o=t.slots[s.action_id];e[s.action_id]={assigned:!!o,archived:!!o?.archived||"off"===this._automationState(o),summary:this._slotSummary(o),error:o?.branch_missing?"The automation has no branch for this event any more — edit the slot to re-add it":o?.last_error??null,stale:i.has(s.action_id),linked:this._isLinked(o)}}return e}async _countRemotes(){try{const t=await this._hass.callWS({type:"remote_mapper/list_remotes"});this._remoteCount=t.remotes.length}catch{}}async _loadOtherRemotes(){if(!this._otherRemotes)try{const t=(await this._hass.callWS({type:"remote_mapper/list_remotes"})).remotes.filter(t=>t.entry_id!==this._entryId);this._otherRemotes=await Promise.all(t.map(t=>this._hass.callWS({type:"remote_mapper/get_remote",entry_id:t.entry_id})))}catch(t){this.notify(`Could not load the other remotes: ${ke(t)}`),this._otherRemotes=[]}}async _refreshActions(t=!1){try{const e=await this._hass.callWS({type:"remote_mapper/refresh_actions",entry_id:this._entryId});e.added.length?(this.notify(`Found new actions: ${e.added.join(", ")}`),this._gridEditing&&this._remote&&(await this._fetchRemote(),this._setGridDraft(xt(this._gridDraft,this._remote.buttons??[])))):t||this.notify(e.probed?"No new actions — press each button once (all press types), then refresh again":"This source can't enumerate actions")}catch(t){this.notify(`Refresh failed: ${String(t)}`)}}_setGridDraft(t){this._gridDraft=t,function(t,e){t&&ne.set(t,e)}(this._entryId,t)}_resumeGridEdit(){const t=(e=this._entryId)?ne.get(e):void 0;var e;t&&this._remote&&!this._gridEditing&&(this._gridDraft=xt(t,this._remote.buttons??[]),this._gridEditing=!0)}async _discardGridEdit(){const t=this._remote?xt(this._remote.grid_layout,this._remote.buttons??[]):void 0;!!this._gridDraft&&JSON.stringify(this._gridDraft)!==JSON.stringify(t)&&!await this._confirmDiscardLayout()||this._cancelGridEdit()}async _discardCanvasEdit(){this._edit.dirty&&!await this._confirmDiscardLayout()||this._edit.cancel(!0)}_confirmDiscardLayout(){return this._confirm({title:"Discard layout changes?",text:"Button names, positions and grid size go back to the last saved layout. Event edits made in this session are already saved and stay.",confirmText:"Discard",destructive:!0})}async _saveGridEdit(){const t=this._gridDraft;if(t)try{await this._hass.callWS({type:"remote_mapper/save_layout",entry_id:this._entryId,grid_layout:St(t)}),this._cancelGridEdit()}catch(t){this.notify(`Layout save failed: ${String(t)}`)}else this._cancelGridEdit()}async _groupAction(t,e,i){try{await this._hass.callWS({type:"remote_mapper/group_action",entry_id:this._entryId,action_id:t,...void 0!==e?{button:e}:{},...i?{kind:i}:{}})}catch(t){return this.notify(ke(t)),!1}this._moveRow=void 0,this._newButton=void 0,await this._fetchRemote();const o=this._remote?.buttons??[];return this._gridEditing&&this._setGridDraft(xt(this._gridDraft,o)),this._buttonSheet&&!o.some(t=>t.id===this._buttonSheet)&&(this._buttonSheet=o.find(e=>e.actions.some(e=>e.action_id===t))?.id),!0}async _runSlot(t){const e=this._remote?.slots[t];if(e&&!e.archived){this._flashAction(t);try{await this._hass.callWS({type:"remote_mapper/run_slot",entry_id:this._entryId,action_id:t})}catch(t){this._error=ke(t)}}}_isLinked(t){return!!t?.materialized&&!!t.automation_id&&!1===t.owned}_automationState(t){const e=t?.automation_entity_id;return e?this._hass?.states?.[e]?.state:void 0}_slotSummary(t){if(!t)return"not set";if(t.name)return t.name;if(t.materialized&&t.branch_missing)return"no branch";if(t.materialized&&t.shared_automation)return Ie(t.live_actions??[],this._hass)||"empty branch";if(t.materialized){const e=t.automation_entity_id,i=e?this._hass?.states?.[e]?.attributes?.friendly_name:void 0,o="string"==typeof i&&i?i:"";return t.branch&&t.branch_alias?t.branch_alias:this._isLinked(t)&&o&&!t.branch?o:Ie(t.live_actions??[],this._hass)||o||"automation"}return Ie(t.sequence??[],this._hass)||"empty"}async _openEditor(t){const e=this._remote?.slots[t],i=e?.sequence??[],o=function(t){if(1===t.length&&"object"==typeof t[0]&&t[0]){const e=t[0],i=e.action??e.service,o=e.target?.entity_id??e.entity_id;if("string"==typeof o){if("scene.turn_on"===i)return{mode:"scene",entity:o,option:""};if("homeassistant.toggle"===i)return{mode:"toggle",entity:o,option:""};if("script.turn_on"===i)return{mode:"script",entity:o,option:""};if("select.select_option"===i)return{mode:"wled_preset",entity:o,option:e.data?.option??e.option??""}}}return{mode:"custom",entity:"",option:""}}(i);this._editingAction=t,this._modalOpenedAt=Date.now(),this._quickMode="custom"===o.mode?"scene":o.mode,this._quickEntity=o.entity,this._isLinked(e)&&(this._quickMode="link",this._quickEntity=e?.automation_entity_id??""),this._quickOption=o.option,this._snapEntities=[...this._remote?.snapshot_entities??[]],this._snapDevices=[...this._remote?.snapshot_devices??[]],this._snapRemember=this._snapEntities.length>0||this._snapDevices.length>0,this._editorTab="custom"===o.mode&&i.length?"yaml":"quick",this._draft=JSON.stringify(i,null,2),this._draftName=e?.name??"",this._yamlValue=i,this._yamlValid=!0,this._draftError=void 0,this._draftMaterialized=e?.materialized??!1,this._editingLive=void 0,this._moveOpen=!1,this._moveTarget=void 0,this._otherRemotes=void 0,gt().then(t=>{this._haFormOk=t}),(customElements.get("ha-yaml-editor")?Promise.resolve(!0):(ft||(ft=(async()=>{try{const t=await mt(),e=t?.createCardElement?.({type:"conditional",conditions:[],card:{type:"entities",entities:[]}});await(e?.constructor?.getConfigElement?.())}catch{}if(customElements.get("ha-yaml-editor"))return!0;await new Promise(t=>setTimeout(t,300));const t=!!customElements.get("ha-yaml-editor");return t||(ft=null),t})()),ft)).then(t=>{this._yamlEditorOk=t}),e?.materialized&&this._hass.callWS({type:"remote_mapper/get_slot",entry_id:this._entryId,action_id:t}).then(i=>{this._editingAction===t&&i.live&&(this._editingLive=i.live,this._yamlValue=i.live.actions??[],this._draft=JSON.stringify(i.live.actions??[],null,2),this._isLinked(e)||(this._editorTab="yaml"))})}_parseDraftOrNull(){try{const t=JSON.parse(this._draft);return Array.isArray(t)?t:null}catch{return null}}_closeEditor(){this._editingAction=void 0,this._draftError=void 0,this._editingLive=void 0,this._clearArtifacts=void 0,this._pendingSave=void 0,this._moveOpen=!1}async _moveSlot(){const t=this._editingAction,e=this._moveTarget;if(t&&e)try{await this._performMove(t,e.actionId,this._otherRemoteNamed(e.entryId)),this._closeEditor()}catch(t){this._draftError=t.message??String(t)}else this._draftError="Pick an event to move to"}async _onMoveAction(t,e,i){const o=this._slotSummary(this._remote?.slots[t]);if(i&&i.entryId!==this._entryId){if(!await this._confirm({title:i.swapWith?"Swap with the other remote?":"Move to the other remote?",text:i.swapWith?`"${o}" goes to ${i.title}, ${i.label}, and "${i.swapWith}" comes here to ${this._eventName(t)}. This is saved right away.`:`"${o}" goes to ${i.title}, ${i.label}. This is saved right away.`,confirmText:i.swapWith?"Swap":"Move"}))return}else{const i=this._remote?.slots[e];if(i){if(!await this._confirm({title:"Swap these two events?",text:`"${o}" goes to ${this._eventName(e)} and "${this._slotSummary(i)}" to ${this._eventName(t)}. This is saved right away.`,confirmText:"Swap"}))return}}try{await this._performMove(t,e,i)}catch(t){this.notify(`Move failed: ${t.message??String(t)}`)}}_otherRemoteNamed(t){const e=this._otherRemotes?.find(e=>e.entry_id===t);return e?{entryId:t,title:e.title,label:""}:void 0}async _performMove(t,e,i){const o=!!i&&i.entryId!==this._entryId,s=await this._hass.callWS({type:"remote_mapper/move_slot",entry_id:this._entryId,action_id:t,target_action_id:e,...o?{target_entry_id:i.entryId}:{}}),r=o?`${i.title}, ${i.label||this._otherEventName(i.entryId,e)}`:this._eventName(e);this.notify(s.swapped?`Swapped ${this._eventName(t)} and ${r}`:`Moved ${this._eventName(t)} to ${r}`)}_otherEventName(t,e){const i=this._otherRemotes?.find(e=>e.entry_id===t);if(!i)return e;const o=xt(i.grid_layout,i.buttons??[]);for(const t of i.buttons??[]){const i=t.actions.find(t=>t.action_id===e);if(i)return`${At(t,o)} ${i.event}`}return e}async _confirmRemoteAutomation(){const t=this._remote?.slots??{},e=Object.keys(t).filter(e=>{const i=t[e];return e!==this._editingAction&&!i.materialized&&!i.archived&&(i.sequence?.length??0)>0});if(!e.length)return!0;const i=e.map(e=>`${this._eventName(e)} (${this._slotSummary(t[e])})`);return this._confirm({title:"Move these events into one automation?",text:`${i.join(", ")} will run as branches of the remote's automation instead of from the card. To take one back later, open the event and untick "Keep as a branch of the remote automation".`,confirmText:"Create automation"})}async _createNew(){const t=this._draftName.trim()||null;try{if("new_scene"===this._quickMode)return this._snapEntities.length||this._snapDevices.length?(await this._hass.callWS({type:"remote_mapper/create_snapshot",entry_id:this._entryId,action_id:this._editingAction,entities:this._snapEntities,devices:this._snapDevices,remember_entities:this._snapRemember,...t?{name:t}:{}}),void this._closeEditor()):void(this._draftError="Pick at least one device or entity to capture");if("new_remote_automation"===this._quickMode&&!this._remote?.remote_automation&&!await this._confirmRemoteAutomation())return;const e=await this._hass.callWS({type:"remote_mapper/create_automation",entry_id:this._entryId,action_id:this._editingAction,scope:"new_automation"===this._quickMode?"button":"remote",name:t});this._closeEditor(),this._navigate(e.edit_url)}catch(t){this._draftError=t.message??String(t)}}async _saveDraft(){if("quick"===this._editorTab&&Ne.has(this._quickMode))return void await this._createNew();const t={type:"remote_mapper/save_slot",entry_id:this._entryId,action_id:this._editingAction,materialized:this._draftMaterialized,name:this._draftName.trim()||null},e=this._isLinked(this._remote?.slots[this._editingAction??""]);if("quick"===this._editorTab&&"link"===this._quickMode&&((i={linked:e,keepLinked:this._draftMaterialized}).linked&&!i.keepLinked));else if("quick"===this._editorTab&&"link"===this._quickMode){if(!this._quickEntity)return void(this._draftError="Pick an automation first");delete t.materialized,t.link_entity_id=this._quickEntity}else if(this._isLinked(this._remote?.slots[this._editingAction??""])&&this._draftMaterialized){const t=function(t){return"quick"===t.tab?"link"===t.quickMode?null:ae:JSON.stringify(t.draft??null)===JSON.stringify(t.live)?null:ae}({tab:this._editorTab,quickMode:this._quickMode,draft:this._yamlEditorOk?this._yamlValue??[]:this._parseDraftOrNull(),live:this._editingLive?.actions??[]});if(t)return void(this._draftError=t)}else if("quick"===this._editorTab){if(!this._quickEntity)return void(this._draftError="Pick an entity first");if("wled_preset"===this._quickMode&&!this._quickOption)return void(this._draftError="Pick a preset first");t.sequence=Ue(this._quickMode,this._quickEntity,this._quickOption)}else if(this._yamlEditorOk){if(!this._yamlValid)return void(this._draftError="YAML is not valid");t.sequence=this._yamlValue??[]}else t.sequence_yaml=this._draft;var i;t.materialized&&Array.isArray(t.sequence)&&(t.auto_name=Ie(t.sequence,this._hass)||null);const o=this._editingLive;if(e&&!this._draftMaterialized&&o?.whole){const t=(s=o.alias??o.entity_id??"This automation",r=o.whole.events.map(t=>this._eventName(t)),r.length<2?null:{title:"Move the whole automation into the card?",text:`"${s}" runs ${r.length} events on this remote: ${r.join(", ")}. Each one gets its own copy of its branch, and the automation is turned off in HA (not deleted). Hand back turns it on again.`,confirmText:`Move all ${r.length}`});if(t&&!await this._confirm(t))return}var s,r;await this._sendSave(t)}async _sendSave(t,e){const i=this._editingLive;try{const o=await this._hass.callWS(e?{...t,decision:e,remember:this._clearRemember}:t);if(o?.needs_decision)return this._clearRemember=!1,this._pendingSave=t,void(this._clearArtifacts=o.artifacts);(o?.absorbed?.length??0)>1&&this.notify(`Moved ${o.absorbed.length} events into the card; "${i?.alias}" is turned off.`),this._closeEditor()}catch(t){this._clearArtifacts=void 0,this._pendingSave=void 0,this._draftError=t.message??String(t)}}async _confirmClear(){const t=this._remote?.slots[this._editingAction??""],e=this._draftName.trim()||this._editingAction||"this event",i=this._isLinked(t),o=this._importedSources(t).length>0,s=i?`The link from "${e}" to its automation is removed. The automation itself stays in HA, enabled, and keeps firing on its own trigger.`:o?`"${e}" is emptied in this card. The original automation it was imported from stays in HA, still disabled. Importing it again as a link switches it back on, and so does Hand back.`:`"${e}" is emptied in this card. Automations and scenes that existed before this integration are not touched; if the card created any, you are asked next.`;await this._confirm({title:"Clear this event?",text:s,confirmText:"Clear",destructive:!0})&&await this._clearSlot()}async _confirmArchive(){const t=this._remote?.slots[this._editingAction];if(!t)return;if(t.archived)return void await this._toggleArchived();const e=this._draftName.trim()||this._editingAction||"this event",i=this._editingLive,o=this._isLinked(t)?i?.whole?.linked??[]:[],s=await this._confirm(function(t,e){const i=e.linked??[],o=i.length>1?` The automation "${e.alias}" is turned off in HA, so all ${i.length} events linked to it stop: ${i.join(", ")}.`:e.automation?" Its automation is turned off in HA meanwhile.":"";return{title:i.length>1?`Disable ${i.length} events?`:"Disable this event?",text:`"${t}" keeps its setup but stops running until you enable it again.${o} Nothing is deleted.`,confirmText:i.length>1?`Disable all ${i.length}`:"Disable"}}(e,{automation:t.materialized,alias:i?.alias??void 0,linked:o.map(t=>this._eventName(t))}));s&&await this._toggleArchived()}_eventName(t){const e=this._gridLayout();for(const i of this._remote?.buttons??[]){const o=i.actions.find(e=>e.action_id===t);if(o&&e)return`${At(i,e)} ${o.event}`}return t}async _clearSlot(t){const e=await this._hass.callWS({type:"remote_mapper/clear_slot",entry_id:this._entryId,action_id:this._editingAction,...t?{decision:t,remember:this._clearRemember}:{}});if(e.needs_decision)return this._clearRemember=!1,void(this._clearArtifacts=e.artifacts);this._clearArtifacts=void 0,this._closeEditor()}async _snapshot(t){try{await this._hass.callWS({type:"remote_mapper/create_snapshot",entry_id:this._entryId,action_id:this._editingAction,re_snapshot:t,remember_entities:this._snapRemember}),this._closeEditor()}catch(t){this._draftError=t.message??String(t)}}async _toggleArchived(){const t=this._remote?.slots[this._editingAction];if(t)try{await this._hass.callWS({type:"remote_mapper/archive_slot",entry_id:this._entryId,action_id:this._editingAction,archived:!t.archived}),this._closeEditor()}catch(t){this._draftError=t.message??String(t)}}_releasePlan(){let t=0,e=0,i=0,o=0;for(const s of Object.values(this._remote?.slots??{}))s.imported_from?t++:this._isLinked(s)?e++:s.materialized?i++:s.sequence?.length&&!s.archived&&o++;return{imported:t,linked:e,materialized:i,built:o}}async _release(){this._releaseBusy=!0;try{const t=await this._hass.callWS({type:"remote_mapper/release_remote",entry_id:this._entryId,convert_remaining:this._releaseConvert});this._releaseOpen=!1,this._cancelGridEdit(),this._edit.cancel(),this.notify(`Handed back: ${t.reenabled.length} original(s) re-enabled, ${t.converted.length} converted, ${t.kept.length} kept, ${t.dropped.length} dropped.`),this._unsubEvents?.(),this._unsubEvents=void 0,this._unsubActions?.(),this._unsubActions=void 0,this._remote=void 0,this._error="This remote was handed back to Home Assistant and removed from Remote Mapper. Delete this card, or pick another remote in the card editor."}catch(t){this.notify(`Hand back failed: ${t.message??String(t)}`)}finally{this._releaseBusy=!1}}_renderRelease(){const t=this._releasePlan(),e=()=>{this._releaseOpen=!1};return W`
      <div class="modal-backdrop" @click=${this._backdropClick(e)}>
        <div class="modal" @click=${t=>t.stopPropagation()}>
          <h3>Hand "${this._remote?.title}" back to Home Assistant</h3>
          <p class="hint">
            Removes this remote from Remote Mapper and leaves Home Assistant the
            way it would have been without it — nothing is deleted.
          </p>
          <ul class="release-list">
            <li>
              <b>${t.imported}</b> imported event(s): the original
              automation(s) are <b>re-enabled</b>, the mapping goes away.
            </li>
            <li>
              <b>${t.linked}</b> linked event(s): the native automation is
              <b>left untouched</b>.
            </li>
            <li>
              <b>${t.materialized}</b> automation-backed event(s): the
              automation is <b>kept</b>, renamed to a plain alias.
            </li>
            <li>
              <label>
                <input
                  type="checkbox"
                  .checked=${this._releaseConvert}
                  @change=${t=>{this._releaseConvert=t.target.checked}}
                />
                <b>${t.built}</b> event(s) built in the card: <b>convert</b> to
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
            <button @click=${e}>Cancel</button>
          </div>
        </div>
      </div>
    `}_closeImport(){this._importScan=void 0}async _applyImport(){const t=this._importScan.proposals.filter((t,e)=>this._importSelected.has(e));if(t.length){this._importBusy=!0;try{await this._hass.callWS({type:"remote_mapper/apply_import",entry_id:this._entryId,proposals:t,overwrite:this._importOverwrite}),this._closeImport()}catch(t){this._importError=t.message??String(t)}finally{this._importBusy=!1}}else this._closeImport()}render(){if(this._error)return W`<ha-card header="Remote Mapper">
        <div class="content error">${this._error}</div>
      </ha-card>`;if(this._remoteChoices)return W`<ha-card header="Remote Mapper">
        <div class="content">
          ${0===this._remoteChoices.length?W`<p class="hint">
                  No remote is set up yet. Add one — pick the device (Zigbee2MQTT,
                  ZHA, Matter, MQTT…), press its buttons once — and this card
                  fills in by itself.
                </p>
                <div class="buttons">
                  <button @click=${()=>this._navigate("/_my_redirect/config_flow_start?domain=remote_mapper")}>
                    Add a remote
                  </button>
                </div>`:W`<p class="hint">
                  Several remotes exist — pick one in the card editor (the
                  <b>Remote</b> dropdown), or set <code>entry_id</code> in YAML:
                </p>
                <ul>
                  ${this._remoteChoices.map(t=>W`<li>${t.title}: <code>${t.entry_id}</code></li>`)}
                </ul>`}
        </div>
      </ha-card>`;if(!this._remote)return W`<ha-card header="Remote Mapper">
        <div class="content">Loading…</div>
      </ha-card>`;if(this._isGrid())return this._renderGridCard();const t=!this.preview&&this._edit.active;return W`
      <ha-card class=${this._stale?"cached":""}>
        ${this._renderStaleBundle()}
        ${this._renderOnboarding()}
        <div class="header">
          ${this._renderTitle()}
          <span class="header-buttons">
            ${t?W`
                  ${this._iconButton("mdi:refresh","Look for new actions (press the buttons first)",()=>{this._refreshActions()})}
                  ${this._iconButton("mdi:import","Import existing automations",this._openImport)}
                  ${this._iconButton("mdi:export","Hand this remote back to HA…",()=>{this._releaseOpen=!0})}
                  ${this._iconButton("mdi:undo","Undo",()=>this._edit.undo(),{disabled:!this._edit.canUndo})}
                  ${this._iconButton("mdi:close","Discard layout changes (Esc)",()=>{this._discardCanvasEdit()})}
                  ${this._iconButton("mdi:check","Save layout",()=>{this._edit.done()},{active:!0})}
                `:this.preview?Y:this._iconButton("mdi:pencil","Edit layout & slots",this._enterEdit)}
          </span>
        </div>
        ${this._renderTip()}
        ${this._renderCanvas(t)}
        ${void 0!==this._editingAction?this._renderEditor():Y}
        ${this._importScan?this._renderImport():Y}
        ${this._releaseOpen?this._renderRelease():Y}
        ${this._renderToast()}
      </ha-card>
    `}_renderGridCard(){const t=this._remote,e=!this.preview&&this._gridEditing,i=this._gridLayout(),o=t.buttons??[];return W`
      <ha-card class=${this._stale?"cached":""}>
        ${this._renderStaleBundle()}
        ${this._renderOnboarding()}
        <div class="header">
          ${this._renderTitle()}
          <span class="header-buttons">
            ${e?W`
                  ${this._iconButton("mdi:view-grid-plus-outline","Grid shape (rows × columns)",()=>{this._pickerOpen=!this._pickerOpen},{active:this._pickerOpen})}
                  ${this._iconButton("mdi:refresh","Look for new actions (press the buttons first)",()=>{this._refreshActions()})}
                  ${this._iconButton("mdi:import","Import existing automations",this._openImport)}
                  ${this._iconButton("mdi:export","Hand this remote back to HA…",()=>{this._releaseOpen=!0})}
                  ${this._iconButton("mdi:close","Discard layout changes",()=>{this._discardGridEdit()})}
                  ${this._iconButton("mdi:check","Save layout",()=>{this._saveGridEdit()},{active:!0})}
                `:this.preview?Y:this._iconButton("mdi:pencil","Edit layout & slots",this._enterGridEdit)}
          </span>
        </div>
        ${this._renderTip()}
        ${this.preview?W`<p class="hint grid-hint">Edit buttons and events from the dashboard; this preview only shows the card</p>`:Y}
        ${e&&this._pickerOpen?W`<div class="picker-dock">
              <remote-mapper-grid-picker
                .rows=${i.rows}
                .cols=${i.cols}
                .minCells=${o.length}
                @grid-picked=${this._onGridPicked}
              ></remote-mapper-grid-picker>
            </div>`:Y}
        ${e?W`<button
              class="help-toggle"
              type="button"
              aria-expanded=${this._editHelpCollapsed?"false":"true"}
              @click=${()=>this._toggleEditHelp()}
            >
              <ha-icon
                icon=${this._editHelpCollapsed?"mdi:chevron-right":"mdi:chevron-down"}
              ></ha-icon>
              <span>How to edit</span>
            </button>`:Y}
        ${e&&!this._editHelpCollapsed?W`<p class="hint grid-hint">Tap a button to rename it or edit its events</p>
            <p class="hint grid-hint">
              In a button's sheet, change an event's press kind or move it to another
              button (for remotes the card grouped wrong)
            </p>
            <p class="hint grid-hint">Drag a button onto another cell to swap</p>
            <p class="hint grid-hint">Drag an event mark onto another event or button to move its action</p>
            ${this._remoteCount>1?W`<p class="hint grid-hint">
                  Drag an event mark onto another remote's card (in edit mode too) to move
                  it there
                </p>`:Y}
            ${Object.values(this._slotViews()).some(t=>t.linked)?W`<p class="hint grid-hint">
                  <ha-icon class="hint-icon" icon="mdi:link-variant"></ha-icon> marks an action kept in
                  your own automation; edits and moves change that automation
                </p>`:Y}
            <p class="hint grid-hint">Event edits save right away; ✓ saves the layout, ✕ discards it</p>`:Y}
        ${0===o.length?Y:W`
          <remote-mapper-grid
            style=${function(t){const e=[],i=(t,i)=>{"string"==typeof i&&i.trim()&&e.push(`${t}:${i.trim()}`)};i("--rm-button-bg",t?.button_color),i("--rm-accent",t?.accent_color),i("--rm-text",t?.text_color);const o=t?.button_opacity;return"number"==typeof o&&o>0&&o<1&&e.push(`--rm-opacity:${o}`),e.join(";")}(this._config)}
            .buttons=${o}
            .layout=${i}
            .slots=${this._slotViews()}
            .display=${Lt(this._config)}
            .assistedTrigger=${Nt(this._config)}
            .chipsLayout=${Bt(this._config)}
            .hideUnset=${s=this._config,"all"===Lt(s)&&!0===s?.hide_unset}
            .kindIcons=${Dt(this._config)}
            .editing=${e}
            .entryId=${this._entryId}
            .remoteTitle=${this._remote?.title??""}
            .flash=${this._flash}
            @run-action=${t=>{this._runSlot(t.detail.actionId)}}
            @mark-drag-start=${()=>this._onDragStart()}
            @open-button=${t=>{this._buttonSheet=t.detail.buttonId,this._modalOpenedAt=Date.now()}}
            @layout-changed=${t=>{this._setGridDraft(t.detail.layout)}}
            @move-action=${t=>{this._onMoveAction(t.detail.actionId,t.detail.targetId,t.detail.target)}}
          ></remote-mapper-grid>
            `}
        ${0===o.length?W`<div class="grid-hint">
              <p class="hint">
                No buttons known yet. Press each button on the remote once (every
                gesture you want: single, double, hold), then look again — the
                card also checks on every Home Assistant start and whenever you
                open edit mode.
              </p>
              <div class="buttons">
                <button @click=${()=>{this._refreshActions()}}>Look for buttons now</button>
              </div>
            </div>`:Y}
        ${void 0!==this._buttonSheet?this._renderButtonSheet():Y}
        ${void 0!==this._editingAction?this._renderEditor():Y}
        ${this._importScan?this._renderImport():Y}
        ${this._releaseOpen?this._renderRelease():Y}
        ${this._renderToast()}
      </ha-card>
    `;var s}_iconButton(t,e,i,o={}){const s=()=>{void 0!==this._tipTimer&&(clearTimeout(this._tipTimer),this._tipTimer=void 0)},r=()=>{s(),this._tip&&this._hideTipIn(1500)};return W`<ha-icon-button
      class=${o.active?"active":""}
      .label=${e}
      title=${e}
      ?disabled=${o.disabled}
      @pointerdown=${t=>{if("mouse"===t.pointerType)return;s(),this._hideTipIn(0),this._tipShown=!1;const i=t.currentTarget;this._tipTimer=setTimeout(()=>{this._tipTimer=void 0,this._tipShown=!0,this._tip=function(t,e,i){const o=e.bottom+6;return(e.left+e.right)/2>i/2?{text:t,top:o,right:Math.max(8,i-e.right)}:{text:t,top:o,left:Math.max(8,e.left)}}(e,i.getBoundingClientRect(),window.innerWidth),this._hideTipIn(4e3)},450)}}
      @pointerup=${r}
      @pointercancel=${r}
      @pointerleave=${r}
      @contextmenu=${t=>{this._tipShown&&t.preventDefault()}}
      @click=${t=>{if(this._tipShown)return t.stopPropagation(),void(this._tipShown=!1);i.call(this,t)}}
    >
      <ha-icon icon=${t}></ha-icon>
    </ha-icon-button>`}_hideTipIn(t){clearTimeout(this._tipHideTimer),this._tipHideTimer=void 0,t<=0?this._tip=void 0:this._tipHideTimer=setTimeout(()=>{this._tipHideTimer=void 0,this._tip=void 0},t)}_renderTip(){const t=this._tip;if(!t)return Y;const e=void 0!==t.right?`right:${t.right}px`:`left:${t.left}px`;return W`<div class="tip" role="tooltip" style="top:${t.top}px;${e}">${t.text}</div>`}_renderButtonSheet(){const t=this._remote,e=this._gridLayout(),i=(t.buttons??[]).find(t=>t.id===this._buttonSheet);if(!i)return W``;const o=this._slotViews(),s=()=>{this._buttonSheet=void 0,this._moveRow=void 0,this._newButton=void 0},r=this._gridEditing,n=function(t=bt){return yt.map(e=>{const i=t[e];return{kind:e,label:i&&!i.startsWith("mdi:")?`${i} ${wt[e]}`:wt[e]}})}(Dt(this._config)),a=r?function(t,e,i){return[...t].filter(t=>t.id!==i).sort((t,i)=>{const o=e.buttons[t.id]??{row:1/0,col:1/0},s=e.buttons[i.id]??{row:1/0,col:1/0};return o.row-s.row||o.col-s.col}).map(t=>({id:t.id,label:At(t,e)}))}(t.buttons??[],e,i.id):[];return W`
      <div class="modal-backdrop" @click=${this._backdropClick(s)}>
        <div class="modal" @click=${this._ghostGuard}>
          <h3>
            ${At(i,e)}
            <span class="hint">(${i.id})</span>
          </h3>
          ${this._gridEditing?W`<label class="hint row">
                Label
                <input
                  class="label-input"
                  type="text"
                  .value=${e.buttons[i.id]?.label??""}
                  placeholder=${i.id}
                  @input=${t=>{this._gridDraft&&this._setGridDraft(function(t,e,i){const o=t.buttons[e];if(!o)return t;const{label:s,...r}=o;return{...t,buttons:{...t.buttons,[e]:i.trim()?{...r,label:i}:r}}}(this._gridDraft,i.id,t.target.value))}}
                />
              </label>`:Y}
          <ul class="event-list">
            ${i.actions.map(e=>{const s=o[e.action_id];return W`
                <li class=${s?.assigned?"on":""}>
                  <span class="ev-main">
                    <span class="ev-icon" title=${wt[e.kind]}
                      >${ee(Dt(this._config)[e.kind])}</span
                    >
                    <span class="ev-name">${e.event}</span>
                    <span class="ev-summary">${s?.summary??"not set"}</span>
                  </span>
                  <span class="ev-actions">
                  ${r?W`
                        <select
                          class="kind-select"
                          title="Press kind"
                          @change=${async t=>{const o=t.target,s=o.value;await this._groupAction(e.action_id,i.id,s)||(o.value=e.kind)}}
                        >
                          ${n.map(t=>W`<option value=${t.kind} ?selected=${t.kind===e.kind}>
                                ${t.label}
                              </option>`)}
                        </select>
                        ${this._iconButton("mdi:folder-move-outline","Move to another button…",()=>{this._moveRow=this._moveRow===e.action_id?void 0:e.action_id,this._newButton=void 0},{active:this._moveRow===e.action_id})}
                        ${c=t.grouping,d=e.action_id,c&&d in c?this._iconButton("mdi:undo-variant","Back to the button and press kind the card derived",()=>{this._groupAction(e.action_id)}):Y}
                      `:Y}
                  ${this._iconButton("mdi:play","Run now",()=>{this._runSlot(e.action_id)},{disabled:!s?.assigned||!!s.archived})}
                  ${(()=>{const i=this._targetEditor(t.slots[e.action_id]);return i?this._iconButton(i.icon,i.title,()=>this._navigate(i.path)):Y})()}
                  ${(()=>{const i=t.slots[e.action_id],o=this._automationEditPath(i),s=[];if(o){const t="off"===this._automationState(i),e=this._isLinked(i),r=i?.shared_automation?"Remote automation (this event's branch)":e?"Linked automation":"Automation";s.push(this._iconButton(t?"mdi:robot-off":"mdi:robot",`${r}${t?" (DISABLED)":""} — open in HA's editor`,()=>this._navigate(o),{active:!t&&(e||!!i?.shared_automation)}))}return s.push(...this._importedSources(i).map(t=>{const e=!!t.entity_id&&"on"===this._hass?.states?.[t.entity_id]?.state,i=t.entity_id??t.config_id;return this._iconButton(e?"mdi:robot":"mdi:robot-off",e?`Imported original is ENABLED — it also runs on this press: ${i}`:`Open the disabled original: ${i}. The card runs its own copy — edit it with the pencil here. Edits to the original in HA take effect after Hand back, or after Clear and importing it as linked.`,()=>this._navigate(`/config/automation/edit/${t.config_id}`),{active:e})})),s})()}
                  ${this._iconButton("mdi:pencil","Edit",()=>{this._openEditor(e.action_id)})}
                  </span>
                </li>
                ${r&&this._moveRow===e.action_id?W`<li class="move-row">
                      <span class="hint">Move <code>${e.event}</code> to:</span>
                      ${a.map(t=>W`<button @click=${()=>{this._groupAction(e.action_id,t.id,e.kind)}}>
                            ${t.label}
                          </button>`)}
                      ${void 0===this._newButton?W`<button
                            @click=${()=>{this._newButton=""}}
                          >
                            New button…
                          </button>`:W`<input
                              class="label-input new-button"
                              type="text"
                              placeholder="Button name"
                              autofocus
                              .value=${this._newButton}
                              @input=${t=>{this._newButton=t.target.value}}
                              @keydown=${t=>{"Enter"===t.key&&this._newButton?.trim()&&this._groupAction(e.action_id,this._newButton.trim(),e.kind)}}
                            />
                            <button
                              ?disabled=${!this._newButton.trim()}
                              @click=${()=>{this._groupAction(e.action_id,this._newButton.trim(),e.kind)}}
                            >
                              Move
                            </button>`}
                    </li>`:Y}
              `;var c,d})}
          </ul>
          <div class="buttons">
            <button @click=${s}>Close</button>
          </div>
        </div>
      </div>
    `}_renderCanvas(t){const e=this._currentLayout(),i=this._transform(),o=t?this._edit.working:e.widgets,s=this._edit.selectedId;return W`
      <div
        class="viewport ${t?"editing":""}"
        style="height:${i.viewportHeight}px"
        @pointerdown=${e=>{t?this._edit.select(null):this._edit.onViewPointerDown(e)}}
        @pointermove=${t=>this._edit.onViewPointerMove(t)}
        @pointerup=${()=>this._edit.cancelLongPress()}
      >
        <div
          class="canvas"
          style="width:${e.design_size.width}px;height:${e.design_size.height}px;transform:translate(${i.offsetX}px, ${i.offsetY}px) scale(${i.scale})"
        >
          ${o.map(e=>this._renderTile(e,t,e.id===s))}
        </div>
        ${t&&this._edit.selected?this._renderChipbar(this._edit.selected,i):Y}
      </div>
      ${t?this._renderDpad():Y}
    `}_renderTile(t,e,i){const o=this._remote.slots[t.id],s=["widget-slot","tile",o?"assigned":"empty",o?.archived?"archived":"",this._flash===t.id?"flash":"",i?"selected":""].join(" ");return W`
      <div
        class=${s}
        data-slot-id=${t.id}
        style="transform:translate3d(${t.x}px, ${t.y}px, 0);width:${t.w}px;height:${t.h}px;z-index:${t.z??1}"
        @pointerdown=${i=>{e&&this._edit.onSlotPointerDown(i,t.id)}}
        @click=${()=>{e||this._runSlot(t.id)}}
        @dblclick=${()=>{e&&this.openSettings(t.id)}}
      >
        <span class="action">${t.id}</span>
        <span class="summary">${this._slotSummary(o)}</span>
        ${o?.last_error?W`<span class="tile-badge error-badge" title=${o.last_error}
              >!</span
            >`:Y}
        ${o?.archived?W`<span class="tile-badge">disabled</span>`:Y}
        ${this._remote.stale_actions?.includes(t.id)?W`<span
              class="tile-badge warn"
              title="The source no longer reports this action (renamed upstream?)"
              >stale</span
            >`:Y}
        ${e&&i?W`${["nw","ne","sw","se"].map(e=>W`
                <span
                  class="handle ${e}"
                  @pointerdown=${i=>this._edit.onHandlePointerDown(i,t.id,e)}
                ></span>
              `)}`:Y}
      </div>
    `}_renderDpad(){const t=this._edit.selected,e=this._edit.dpadSteps,i="fine"===this._edit.dpadMode?"1":e.x===e.y?`${e.x}`:`${e.x}·${e.y}`,o=(t,e)=>i=>{i.preventDefault(),i.stopPropagation(),i.currentTarget.setPointerCapture(i.pointerId),this._edit.dpadPress(t,e)},s=()=>this._edit.dpadRelease();return W`
      <div class="dpad-dock" @pointerdown=${t=>t.stopPropagation()}>
        ${t?W`<div class="badge"></div>`:Y}
        <div class="dpad">
          <span></span>
          <button ?disabled=${!t} @pointerdown=${o(0,-1)}
            @pointerup=${s} @pointercancel=${s}
            @lostpointercapture=${s}>▲</button>
          <span></span>
          <button ?disabled=${!t} @pointerdown=${o(-1,0)}
            @pointerup=${s} @pointercancel=${s}
            @lostpointercapture=${s}>◀</button>
          <button class="step" title="Toggle nudge step (1 unit ↔ grid cell)"
            @click=${()=>this._edit.toggleDpadStep()}>${i}</button>
          <button ?disabled=${!t} @pointerdown=${o(1,0)}
            @pointerup=${s} @pointercancel=${s}
            @lostpointercapture=${s}>▶</button>
          <span></span>
          <button ?disabled=${!t} @pointerdown=${o(0,1)}
            @pointerup=${s} @pointercancel=${s}
            @lostpointercapture=${s}>▼</button>
          <span></span>
        </div>
      </div>
    `}_renderChipbar(t,e){const i=this._hostWidth||300,o=e.offsetX+(t.x+t.w/2)*e.scale,s=e.offsetY+t.y*e.scale,r=s<62,n=r?e.offsetY+(t.y+t.h)*e.scale+6:s-6,a=Math.min(Math.max(o,84),Math.max(84,i-84));return W`
      <div
        class="chipbar"
        style="left:${a}px;top:${n}px;transform:translate(-50%, ${r?"0":"-100%"})"
        @pointerdown=${t=>t.stopPropagation()}
      >
        ${this._iconButton("mdi:cog","Slot settings",()=>this.openSettings(t.id))}
        ${this._iconButton("mdi:arrange-send-backward","Send backward",()=>this._edit.zOp("backward"))}
        ${this._iconButton("mdi:arrange-bring-forward","Bring forward",()=>this._edit.zOp("forward"))}
      </div>
    `}_renderEditor(){const t=this._remote.slots[this._editingAction],e=this._editingLive?.whole,i=e&&e.events.length>1?e.events:void 0;return W`
      <div class="modal-backdrop" @click=${this._backdropClick(this._closeEditor)}>
        <div class="modal" @click=${this._ghostGuard}>
          <h3>${this._editingAction}</h3>
          ${this._editingLive?W`<p class="hint">
                ${!1===this._editingLive.owned?"Linked to":"Backed by"}
                <b>${this._editingLive.alias}</b>
                ${"off"===this._editingLive.state?W`<span class="warn">(disabled)</span>`:Y}
                —
                <button
                  class="link"
                  @click=${()=>this._navigate(this._editingLive.edit_url)}
                >
                  open in HA's automation editor
                </button>.
                ${this._editingLive.branch_missing?W`<span class="warn">It has no branch for this event any more.</span>
                      Pick "Add this button to the remote automation" below to re-add one.`:!1===this._editingLive.owned&&i?`It runs ${i.length} events on this remote (${i.map(t=>this._eventName(t)).join(", ")}) and stays native; edit it there.`+(e?.blocked?"":" Unticking the box below moves all of them into this card and turns it off (hand-back turns it on again)."):!1===this._editingLive.owned?"It stays native and enabled; edit it there. Unticking the box below copies its actions into this card and disables it (hand-back re-enables it).":this._editingLive.branch?'This event is one branch of it. Unticking "automation" below moves the branch\'s actions into this card and removes the branch; the other buttons keep theirs.':'Unticking "automation" below deletes it on Save and moves its actions into this card. Cancel keeps things as they are.'}
              </p>`:Y}
          <div class="tabs">
            <button
              class=${"quick"===this._editorTab?"on":""}
              @click=${()=>{this._editorTab="quick"}}
            >
              Quick
            </button>
            <button
              class=${"yaml"===this._editorTab?"on":""}
              @click=${()=>{this._editorTab="yaml"}}
            >
              YAML
            </button>
          </div>
          ${"quick"===this._editorTab?this._renderQuickTab():this._renderYamlTab()}
          <label class="hint row">
            Name
            <input
              class="label-input"
              type="text"
              .value=${this._draftName}
              placeholder=${this._autoNamePlaceholder()}
              @input=${t=>{this._draftName=t.target.value}}
            />
          </label>
          ${"quick"===this._editorTab&&Ne.has(this._quickMode)?Y:W`<label class="hint row">
                <input
                  type="checkbox"
                  .checked=${this._draftMaterialized}
                  ?disabled=${!!e?.blocked&&this._draftMaterialized}
                  @change=${t=>{this._draftMaterialized=t.target.checked}}
                />
                ${!1===this._editingLive?.owned?e?.blocked?"Keep linked to the automation":(e?.events.length??0)>1?"Keep linked to the automation (untick to move the whole automation into the card)":"Keep linked to the automation (untick to absorb into the card)":this._editingLive?.branch?"Keep as a branch of the remote automation (untick to move it into the card)":"Create as automation (editable/traceable in HA)"}
              </label>`}
          ${e?.blocked?W`<p class="hint">
                ${e.foreign?`It can't move into the card or be disabled here: ${e.blocked}, which would stop too.`:`It can't move into the card: ${e.blocked}.`}
                Edit it in HA.
              </p>`:Y}
          ${this._draftError?W`<p class="error">${this._draftError}</p>`:Y}
          <div class="buttons">
            <button @click=${this._saveDraft}>
              ${"quick"===this._editorTab&&"new_scene"===this._quickMode?"📸 Capture":"quick"===this._editorTab&&Ne.has(this._quickMode)?"Create & open in HA":"Save"}
            </button>
            <button @click=${this._closeEditor}>Cancel</button>
            ${t?.scene_id?W`<button
                  title="Same scene, same entities, new states"
                  @click=${()=>this._snapshot(!0)}
                >
                  Re-snapshot
                </button>`:Y}
            ${t?W`
                  <button
                    title=${this._isLinked(t)?"Move this action to another event or button (the linked automation's trigger follows)":"Move this action to another event or button"}
                    @click=${()=>{this._moveOpen=!this._moveOpen,this._draftError=void 0,this._moveOpen&&this._loadOtherRemotes()}}
                  >
                    Move…
                  </button>
                  <button class="danger" @click=${()=>{this._confirmClear()}}>
                    Clear
                  </button>
                  <button
                    ?disabled=${!!e?.foreign&&!t.archived}
                    @click=${()=>{this._confirmArchive()}}
                  >
                    ${t.archived?"Enable":"Disable"}
                  </button>
                `:Y}
          </div>
          ${this._moveOpen&&t?this._renderMovePanel(t):Y}
          ${this._clearArtifacts?this._renderClearDialog():Y}
        </div>
      </div>
    `}_renderMovePanel(t){const e=this._remote,i=this._gridLayout(),o=this._isLinked(t),s=o&&!1!==this._editingLive?.branch,r=ie(e.buttons??[],i,this._slotViews(),this._editingAction),n=this._otherRemotes??[];var a,c;s||r.push(...(a=n,c=t=>this._slotViews(t),a.flatMap(t=>{const e=t.buttons??[];return ie(e,xt(t.grid_layout,e),c(t),"",t.entry_id,t.title)})));const d=r.flatMap(t=>t.targets.map(e=>({...e,entryId:t.entryId}))),h=d.findIndex(t=>t.entryId===this._moveTarget?.entryId&&t.actionId===this._moveTarget?.actionId),l=h>=0?d[h]:void 0,p=t.materialized&&!t.shared_automation&&!o,u=l?.entryId?n.find(t=>t.entry_id===l.entryId):void 0;let _="";return u&&(_=` The action moves to ${u.title}.`,t.shared_automation?_+=u.remote_automation?" Its branch joins that remote's automation.":" Its branch becomes a plain action there, run from the card.":o?_+=" The linked automation gets that remote's trigger.":p&&(_+=" The automation the card created is made again there.")),W`
      <div class="decision move">
        <p><b>Move to another event</b></p>
        <p class="hint">
          The action, its name and its scene go with it. A set event swaps its
          action with this one.${p?" The automation the card created is made again for the new event (its traces start over).":t.shared_automation?" Its branch of the remote automation is re-keyed to the new event.":""}${_}${s&&n.length?" A per-remote automation stays with its remote: to move this event elsewhere, link it from the other remote or change its trigger in HA.":""}
        </p>
        ${n.length&&!s?W`<p class="hint">
              Tip: with both cards in edit mode, you can also drag this event's mark
              onto the other remote's card.
            </p>`:Y}
        <select
          class="move-target"
          .value=${String(h)}
          @change=${t=>{const e=d[Number(t.target.value)];this._moveTarget=e?{entryId:e.entryId,actionId:e.actionId}:void 0}}
        >
          <option value="-1" ?selected=${!l}>Pick an event…</option>
          ${r.map(t=>W`<optgroup label=${t.label}>
              ${t.targets.map(e=>{return W`<option
                  value=${String(d.findIndex(i=>i.entryId===t.entryId&&i.actionId===e.actionId))}
                  ?selected=${t.entryId===l?.entryId&&e.actionId===l?.actionId}
                >
                  ${i=e,i.swapWith?`${i.event} — swap with "${i.swapWith}"`:i.event}
                </option>`;var i})}
            </optgroup>`)}
        </select>
        <div class="buttons">
          <button ?disabled=${!l} @click=${()=>{this._moveSlot()}}>
            ${l?.swapWith?"Swap":"Move"}
          </button>
          <button
            @click=${()=>{this._moveOpen=!1}}
          >
            Cancel
          </button>
        </div>
      </div>
    `}_renderStaleBundle(){const t=this._remote?.version,e=de(ce,t);return"current"!==e&&t?"ahead"===e?W`
        <div class="stale">
          This tab runs the v${ce} card but Home Assistant still runs
          Remote Mapper v${t}. Restart Home Assistant to finish the update.
        </div>
      `:(this._offerReloadDialog(t),W`
      <div class="stale">
        Remote Mapper was updated to v${t}; this tab still runs the
        v${ce} card.
        <button @click=${()=>{Re()}}>Reload</button>
      </div>
    `):Y}_renderOnboarding(){if(this.preview||void 0===this._tipsSeen)return Y;const t=this._tipsSeen,e=function(t){const e=Ct(t);return e<Tt.length?{index:e,text:Tt[e]}:void 0}(t);return e?W`
      <div class="tipbar">
        <span class="tipbar-text"
          ><b>Tip ${e.index+1}/${Tt.length}</b> ${e.text}</span
        >
        <span class="tipbar-buttons">
          <button @click=${()=>{this._setTipsSeen(t+1)}}>
            ${e.index+1<Tt.length?"Next":"Got it"}
          </button>
          ${e.index+1<Tt.length?W`<button class="quiet" @click=${()=>{this._setTipsSeen(Tt.length)}}>
                Skip
              </button>`:Y}
        </span>
      </div>
    `:Y}async _offerReloadDialog(t){if(!He){He=!0;try{const e=await mt();await(e?.showConfirmationDialog?.(this,{title:"Reload",text:`Remote Mapper was updated to v${t}, but this page still runs the v${ce} card. Reload the page to use the new version?`,confirmText:"Reload",dismissText:"Later"}))&&await Re()}catch{}}}_autoNamePlaceholder(){let t=[];if("quick"===this._editorTab&&Ne.has(this._quickMode))return"new_scene"===this._quickMode?`Auto: ${this._remote?.title??"Remote"} ${this._editingAction??""}`:"Auto (from the automation)";if("quick"===this._editorTab&&"link"===this._quickMode){const t=this._quickEntity?this._hass?.states?.[this._quickEntity]?.attributes?.friendly_name:void 0;return"string"==typeof t&&t?`Auto: ${t}`:"Auto (the automation's name)"}if("quick"===this._editorTab&&this._quickEntity)t=Ue(this._quickMode,this._quickEntity,this._quickOption);else if(this._yamlEditorOk)t=this._yamlValue??[];else try{t=JSON.parse(this._draft||"[]")}catch{t=[]}const e=Ie(t,this._hass);return e?`Auto: ${e}`:"Auto (from the action)"}_renderQuickTab(){if(!this._haFormOk)return W`<p class="hint">
        Loading HA editor components… If this persists, use the YAML tab.
      </p>`;const t=this._remote?.slots[this._editingAction??""],e=!!this._remote?.remote_automation,i=[{value:"new_scene",label:"＋ Scene from current state"},{value:"new_automation",label:"＋ Automation for this button (fill in HA)"}];e?t?.shared_automation&&!t.branch_missing||this._isLinked(t)||t?.archived||!t?.shared_automation&&"off"===this._automationState(t)||i.push({value:"new_remote_automation",label:"＋ Add this button to the remote automation"}):i.push({value:"new_remote_automation",label:"＋ Automation for the whole remote (one branch per event)"});const o=[{name:"mode",selector:{select:{mode:"dropdown",options:[...i,{value:"scene",label:"Activate scene"},{value:"toggle",label:"Toggle entity"},{value:"script",label:"Run script"},{value:"wled_preset",label:"Set WLED preset"},{value:"link",label:"Link existing automation (stays native)"}]}}}];let s;if("new_scene"===this._quickMode?(o.push({name:"devices",selector:{device:{multiple:!0}}}),o.push({name:"entities",selector:{entity:{multiple:!0}}}),o.push({name:"remember",selector:{boolean:{}}}),s="Set the room the way you like it first. A device is captured whole, the way HA's scene editor adds one; an entity is captured on its own. Capture stores their current state as a scene bound to this event; Re-snapshot later updates it in place. With the switch on, these lists are what new snapshots start from."):"new_automation"===this._quickMode?s="Creates an automation with this event as its trigger and no actions, then opens HA's editor so you can fill it in. The card shows what you put there.":"new_remote_automation"===this._quickMode&&(s=e?"Appends a trigger and an empty branch for this event to the remote's automation, then opens it in HA's editor.":"Creates one automation for this remote: a trigger per event and a choose block with one branch per event (the blueprint look). Buttons you already built in the card move into their branch; buttons with their own automation stay as they are."),"link"===this._quickMode)o.push({name:"entity",selector:{entity:{domain:"automation"}}});else if("wled_preset"===this._quickMode){o.push({name:"entity",selector:{entity:{domain:"select",integration:"wled"}}});const t=this._quickEntity?this._hass?.states?.[this._quickEntity]:void 0,e=t?.attributes?.options??[];o.push({name:"option",selector:e.length?{select:{mode:"dropdown",custom_value:!0,options:e}}:{text:{}}})}else if(!Ne.has(this._quickMode)){const t="scene"===this._quickMode?"scene":"script"===this._quickMode?"script":void 0;o.push({name:"entity",selector:{entity:t?{domain:t}:{}}})}const r={mode:"Action",option:"Preset",devices:"Devices to capture (whole)",entities:"Entities to capture (on their own)",remember:"Use as this remote's default entity list",entity:"link"===this._quickMode?"Automation":"Entity"};return W`
      <ha-form
        .hass=${this._hass}
        .data=${{mode:this._quickMode,entity:this._quickEntity,option:this._quickOption,entities:this._snapEntities,devices:this._snapDevices,remember:this._snapRemember}}
        .schema=${o}
        .computeLabel=${t=>r[t.name]??t.name}
        @value-changed=${t=>{const e=t.detail.value;e.mode!==this._quickMode?(this._quickMode=e.mode,this._quickEntity="",this._quickOption=""):Ne.has(this._quickMode)?(this._snapEntities=e.entities??[],this._snapDevices=e.devices??[],this._snapRemember=!!e.remember):e.entity!==this._quickEntity?(this._quickEntity=e.entity??"",this._quickOption=""):(this._quickEntity=e.entity??"",this._quickOption=e.option??"")}}
      ></ha-form>
      ${s?W`<p class="hint">${s}</p>`:Y}
    `}_renderYamlTab(){return this._yamlEditorOk?W`
        <ha-yaml-editor
          .hass=${this._hass}
          .defaultValue=${this._yamlValue??[]}
          @value-changed=${t=>{const e=t.detail;this._yamlValid=!1!==e.isValid,this._yamlValid&&(this._yamlValue=e.value??[])}}
        ></ha-yaml-editor>
        ${this._yamlValid?Y:W`<p class="error">Invalid YAML</p>`}
      `:W`
      <p class="hint">Sequence (YAML or JSON) — same as automation actions.</p>
      <textarea
        .value=${this._draft}
        spellcheck="false"
        @input=${t=>{this._draft=t.target.value}}
      ></textarea>
    `}_renderClearDialog(){const t=this._clearArtifacts,e=[];t.scene&&e.push(`scene ${t.scene.entity_id??""}`),t.automation&&e.push("its automation");const i=!!this._pendingSave,o=t=>i?this._sendSave(this._pendingSave,t):this._clearSlot(t),s=t.scene?.entity_id??"its scene";return W`
      <div class="decision">
        ${i?W`<p><b>Saving replaces ${s}, this button's snapshot scene.</b></p>
              <p class="hint">
                Delete removes the scene from HA. Keep leaves it under Settings →
                Scenes as a scene of your own; Re-snapshot stops updating it.
              </p>`:W`<p><b>Also delete ${e.join(" and ")}?</b></p>`}
        <label class="hint check-row">
          <input
            type="checkbox"
            .checked=${this._clearRemember}
            @change=${t=>{this._clearRemember=t.target.checked}}
          />
          Remember my choice
        </label>
        <div class="buttons">
          <button class="danger" @click=${()=>o("delete")}>
            ${i?"Save, delete scene":"Delete"}
          </button>
          <button @click=${()=>o("keep")}>
            ${i?"Save, keep scene":"Keep"}
          </button>
          <button
            @click=${()=>{this._clearArtifacts=void 0,this._pendingSave=void 0}}
          >
            Cancel
          </button>
        </div>
      </div>
    `}_renderImport(){const t=this._importScan;return W`
      <div class="modal-backdrop" @click=${this._closeImport}>
        <div class="modal" @click=${t=>t.stopPropagation()}>
          <h3>Import automations</h3>
          ${0===t.proposals.length?W`<p class="hint">No importable automations found.</p>`:W`
                <p class="hint">
                  <b>Link</b> keeps the automation native and enabled — the card
                  shows it and opens it in HA's editor. <b>Absorb</b> copies its
                  actions into the card and disables it (never deletes).
                </p>
                <ul class="import-list">
                  ${t.proposals.map((e,i)=>W`
                      <li>
                        <label>
                          <input
                            type="checkbox"
                            .checked=${this._importSelected.has(i)}
                            @change=${t=>{const e=new Set(this._importSelected);t.target.checked?e.add(i):e.delete(i),this._importSelected=e}}
                          />
                          <b>${e.action_id}</b> ← ${e.alias}
                          ${e.linkable?W`<select
                                class="mode"
                                .value=${e.mode??"link"}
                                @click=${t=>t.stopPropagation()}
                                @change=${e=>{const o=e.target.value,s=t.proposals.map((t,e)=>e===i?{...t,mode:o}:t);this._importScan={...t,proposals:s}}}
                              >
                                <option value="link">link (keep native)</option>
                                <option value="absorb">absorb (copy in, disable)</option>
                              </select>`:W`<span class="hint-inline">absorb</span>`}
                          ${e.conflict?W`<span class="warn">(overwrites slot)</span>`:Y}
                          ${e.mixed?W`<span class="warn"
                                >(mixed remotes — source stays enabled)</span
                              >`:Y}
                          ${e.merged?W`<span class="warn"
                                title="Home Assistant ran all of them on this press; the slot runs them one after another"
                                >(merges ${e.sources?.length??2} automations)</span
                              >`:Y}
                        </label>
                      </li>
                    `)}
                </ul>
              `}
          ${t.skipped.length?W`
                <p class="hint">Needs manual import:</p>
                <ul class="import-list">
                  ${t.skipped.map(t=>W`<li>${t.alias} — <code>${t.reason}</code></li>`)}
                </ul>
              `:Y}
          ${t.proposals.some(t=>t.conflict)?W`<label class="hint check-row">
                <input
                  type="checkbox"
                  .checked=${this._importOverwrite}
                  @change=${t=>{this._importOverwrite=t.target.checked}}
                />
                Overwrite already-assigned slots
              </label>`:Y}
          ${this._importError?W`<p class="error">${this._importError}</p>`:Y}
          <div class="buttons">
            <button ?disabled=${this._importBusy} @click=${this._applyImport}>
              Apply
            </button>
            <button @click=${this._closeImport}>Cancel</button>
          </div>
        </div>
      </div>
    `}};We.styles=n`
    /* Header mirrors ha-card's .card-header: 24px title, 48px icon buttons.
       Edit mode shows six buttons; in a narrow card they wrap onto their
       own row instead of squeezing the title down to one letter. */
    .header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      column-gap: var(--ha-space-2, 8px);
      padding: var(--ha-space-1, 4px) var(--ha-space-1, 4px) 0 var(--ha-space-4, 16px);
      min-height: var(--ha-space-12, 48px);
    }
    .title {
      /* grows into the free space; below 160px the buttons wrap instead */
      flex: 1 1 0;
      min-width: min(100%, calc(2 * var(--ha-space-20, 80px)));
      color: var(--ha-card-header-color, var(--primary-text-color));
      font-family: var(--ha-card-header-font-family, inherit);
      font-size: var(--ha-card-header-font-size, var(--ha-font-size-2xl, 24px));
      font-weight: var(--ha-card-header-font-weight, var(--ha-font-weight-normal, 400));
      letter-spacing: -0.012em;
      line-height: var(--ha-line-height-condensed, 1.2);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .title:empty {
      min-width: 0;
    }
    .header-buttons {
      display: flex;
      align-items: center;
      flex: none;
      margin-left: auto;
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
    /* notify(): inverse colours like HA's own toast, pinned to this card */
    ha-card {
      position: relative;
    }
    .toast {
      position: absolute;
      left: var(--ha-space-2, 8px);
      right: var(--ha-space-2, 8px);
      bottom: var(--ha-space-2, 8px);
      z-index: 31; /* above the canvas and .modal-backdrop (30) */
      padding: var(--ha-space-3, 12px) var(--ha-space-4, 16px);
      border-radius: var(--ha-border-radius-md, 8px);
      background: var(--primary-text-color);
      color: var(--card-background-color, #fff);
      font-size: var(--ha-font-size-m, 14px);
      line-height: var(--ha-line-height-normal, 1.4);
      box-shadow: var(--ha-box-shadow-m, 0 2px 8px rgba(0, 0, 0, 0.35));
      cursor: pointer;
      animation: rm-toast 150ms ease-out;
    }
    @keyframes rm-toast {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
    }
    .content {
      padding: 0 16px 16px;
    }
    /* last visit's copy, drawn for size until the live data fades in */
    .content,
    remote-mapper-grid,
    .header-buttons {
      transition: opacity 300ms ease-out;
    }
    ha-card.cached .content,
    ha-card.cached remote-mapper-grid,
    ha-card.cached .header-buttons {
      opacity: 0.5;
      pointer-events: none;
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
    /* over the viewport but not inside the scaled canvas: tokens */
    .chipbar {
      position: absolute;
      display: flex;
      gap: var(--ha-space-1, 4px);
      padding: var(--ha-space-1, 4px);
      border-radius: var(--ha-border-radius-lg, 12px);
      background: var(--card-background-color, #222);
      box-shadow: var(--ha-box-shadow-m, 0 2px 12px rgba(0, 0, 0, 0.4));
      z-index: 20;
    }
    .chipbar ha-icon-button {
      color: var(--primary-text-color);
    }
    /* card UI below the canvas, not inside its scaled viewport: tokens */
    .dpad-dock {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      margin: calc(-1 * var(--ha-space-1, 4px)) 0 var(--ha-space-3, 12px);
    }
    .badge {
      font-family: var(--ha-font-family-code, monospace);
      font-size: var(--ha-font-size-s, 12px);
      background: var(--card-background-color, #222);
      border: 1px solid var(--divider-color, #444);
      border-radius: var(--ha-border-radius-sm, 4px);
      padding: var(--ha-space-1, 4px) var(--ha-space-2, 8px);
    }
    /* filled in while dragging; an empty bordered box reads as a bug */
    .badge:empty {
      display: none;
    }
    .dpad {
      display: grid;
      grid-template-columns: repeat(3, var(--ha-space-10, 40px));
      grid-auto-rows: var(--ha-space-10, 40px);
      gap: var(--ha-space-1, 4px);
      background: var(--card-background-color, #222);
      border: 1px solid var(--divider-color, #444);
      border-radius: var(--ha-border-radius-lg, 12px);
      padding: var(--ha-space-1, 4px);
    }
    .dpad button {
      border: none;
      border-radius: var(--ha-border-radius-md, 8px);
      background: rgba(127, 127, 127, 0.12);
      color: var(--primary-text-color);
      cursor: pointer;
      font: inherit;
      font-size: var(--ha-font-size-m, 14px);
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
    /* edit mode: folds the help lines below it away; remembered per user.
       The chevron and the lines' dots share one 20px column, so they line up. */
    .help-toggle {
      display: flex;
      align-items: center;
      gap: var(--ha-space-1, 4px);
      min-height: var(--ha-space-9, 36px);
      margin: 0 var(--ha-space-2, 8px) 0 var(--ha-space-3, 12px);
      padding: 0;
      border: none;
      background: none;
      color: var(--secondary-text-color);
      cursor: pointer;
      font: inherit;
      font-size: var(--ha-font-size-m, 14px);
      line-height: var(--ha-line-height-normal, 1.6);
    }
    .help-toggle ha-icon {
      display: flex;
      flex: none;
      width: var(--ha-space-5, 20px);
      justify-content: center;
      --mdc-icon-size: var(--ha-space-5, 20px);
    }
    .grid-hint {
      position: relative;
      /* 12px margin + 20px marker column + 4px gap, as the toggle lays out */
      padding: 0 var(--ha-space-4, 16px) 0 var(--ha-space-9, 36px);
      margin: 0 0 var(--ha-space-1, 4px);
      line-height: var(--ha-line-height-normal, 1.6);
    }
    .grid-hint::before {
      content: "·";
      position: absolute;
      left: var(--ha-space-3, 12px);
      width: var(--ha-space-5, 20px);
      text-align: center;
    }
    .grid-hint:last-child {
      margin-bottom: 0;
    }
    .grid-hint .hint-icon {
      --mdc-icon-size: var(--ha-font-size-m, 14px);
      vertical-align: text-bottom;
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
    /* native select: same size as HA's form controls (skill: m, 32px) */
    .kind-select {
      /* sized by its widest option ("3 triple press"); a cap clipped the text at phone width */
      min-height: var(--ha-space-8, 32px);
      padding: var(--ha-space-1, 4px);
      border: 1px solid var(--divider-color, #444);
      border-radius: var(--ha-border-radius-md, 8px);
      background: var(--card-background-color, inherit);
      color: inherit;
      font: inherit;
      font-size: var(--ha-font-size-m, 14px);
    }
    .event-list li.move-row {
      opacity: 1;
      gap: var(--ha-space-2, 8px);
      padding: var(--ha-space-2, 8px) 0 var(--ha-space-2, 8px) var(--ha-space-9, 36px);
    }
    .move-row code {
      font-family: var(--ha-font-family-code, monospace);
      font-size: var(--ha-font-size-s, 12px);
    }
    .move-row button {
      min-height: var(--ha-space-9, 36px);
      padding: var(--ha-space-1, 4px) var(--ha-space-3, 12px);
      border-radius: var(--ha-border-radius-pill, 9999px);
      border: 1px solid var(--primary-color);
      background: none;
      color: var(--primary-color);
      cursor: pointer;
      font: inherit;
      font-size: var(--ha-font-size-m, 14px);
    }
    .move-row button:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .move-row .new-button {
      flex: 1 1 calc(var(--ha-space-20, 80px) * 2);
      width: auto;
      margin-top: 0;
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
    .ev-icon .mark-icon {
      --mdc-icon-size: var(--ha-space-4, 16px);
      display: inline-flex;
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
      margin-top: var(--ha-space-3, 12px);
      padding: var(--ha-space-3, 12px);
      border: 1px solid var(--warning-color, #ffa600);
      border-radius: var(--ha-border-radius-md, 8px);
    }
    .decision p {
      margin: 0 0 var(--ha-space-2, 8px);
      font-size: var(--ha-font-size-m, 14px);
      line-height: var(--ha-line-height-normal, 1.6);
    }
    .decision.move {
      border-color: var(--primary-color);
    }
    .move-target {
      display: block;
      width: 100%;
      box-sizing: border-box;
      font: inherit;
      font-size: var(--ha-font-size-m, 14px);
      min-height: var(--ha-space-9, 36px);
      padding: 0 var(--ha-space-2, 8px);
      background: var(--card-background-color, inherit);
      color: inherit;
      border: 1px solid var(--divider-color, #444);
      border-radius: var(--ha-border-radius-md, 8px);
    }
    .error {
      color: var(--error-color, #db4437);
    }
    .stale {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      padding: var(--ha-space-2, 8px) var(--ha-space-4, 16px);
      font-size: var(--ha-font-size-m, 14px);
      line-height: var(--ha-line-height-normal, 1.6);
      background: var(--warning-color, #ffa600);
      color: var(--text-primary-color, #fff);
    }
    .tipbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--ha-space-2, 8px);
      padding: var(--ha-space-2, 8px) var(--ha-space-4, 16px);
      font-size: var(--ha-font-size-m, 14px);
      line-height: var(--ha-line-height-normal, 1.6);
      background: var(--secondary-background-color, rgba(127, 127, 127, 0.15));
      color: var(--primary-text-color);
      border-bottom: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
    }
    .tipbar-text {
      flex: 1 1 240px;
    }
    .tipbar-buttons {
      display: flex;
      gap: var(--ha-space-2, 8px);
    }
    .tipbar button {
      min-height: var(--ha-space-9, 36px);
      padding: var(--ha-space-1, 4px) var(--ha-space-3, 12px);
      border: 1px solid var(--primary-color);
      border-radius: var(--ha-border-radius-md, 8px);
      background: transparent;
      color: var(--primary-color);
      font: inherit;
      cursor: pointer;
    }
    .tipbar button.quiet {
      border-color: var(--divider-color, rgba(127, 127, 127, 0.3));
      color: var(--secondary-text-color);
    }
    .stale button {
      min-height: var(--ha-space-9, 36px);
      padding: var(--ha-space-1, 4px) var(--ha-space-3, 12px);
      border: 1px solid currentColor;
      border-radius: var(--ha-border-radius-md, 8px);
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
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
      gap: var(--ha-space-2, 8px);
      margin-top: var(--ha-space-3, 12px);
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
    .buttons button:disabled {
      opacity: 0.4;
      cursor: default;
    }
  `,t([ut()],We.prototype,"_remote",void 0),t([ut()],We.prototype,"_remoteChoices",void 0),t([ut()],We.prototype,"_stale",void 0),t([ut()],We.prototype,"_error",void 0),t([ut()],We.prototype,"_flash",void 0),t([ut()],We.prototype,"_toast",void 0),t([ut()],We.prototype,"_hostWidth",void 0),t([pt({type:Boolean})],We.prototype,"preview",void 0),t([ut()],We.prototype,"_tipsSeen",void 0),t([ut()],We.prototype,"_editHelpCollapsed",void 0),t([ut()],We.prototype,"_gridEditing",void 0),t([ut()],We.prototype,"_gridDraft",void 0),t([ut()],We.prototype,"_moveRow",void 0),t([ut()],We.prototype,"_newButton",void 0),t([ut()],We.prototype,"_pickerOpen",void 0),t([ut()],We.prototype,"_buttonSheet",void 0),t([ut()],We.prototype,"_tip",void 0),t([ut()],We.prototype,"_editingAction",void 0),t([ut()],We.prototype,"_editorTab",void 0),t([ut()],We.prototype,"_quickMode",void 0),t([ut()],We.prototype,"_quickEntity",void 0),t([ut()],We.prototype,"_quickOption",void 0),t([ut()],We.prototype,"_snapEntities",void 0),t([ut()],We.prototype,"_snapDevices",void 0),t([ut()],We.prototype,"_snapRemember",void 0),t([ut()],We.prototype,"_draft",void 0),t([ut()],We.prototype,"_draftName",void 0),t([ut()],We.prototype,"_yamlValue",void 0),t([ut()],We.prototype,"_yamlValid",void 0),t([ut()],We.prototype,"_draftError",void 0),t([ut()],We.prototype,"_draftMaterialized",void 0),t([ut()],We.prototype,"_editingLive",void 0),t([ut()],We.prototype,"_haFormOk",void 0),t([ut()],We.prototype,"_yamlEditorOk",void 0),t([ut()],We.prototype,"_clearArtifacts",void 0),t([ut()],We.prototype,"_clearRemember",void 0),t([ut()],We.prototype,"_pendingSave",void 0),t([ut()],We.prototype,"_moveOpen",void 0),t([ut()],We.prototype,"_moveTarget",void 0),t([ut()],We.prototype,"_otherRemotes",void 0),t([ut()],We.prototype,"_remoteCount",void 0),t([ut()],We.prototype,"_releaseOpen",void 0),t([ut()],We.prototype,"_releaseConvert",void 0),t([ut()],We.prototype,"_releaseBusy",void 0),t([ut()],We.prototype,"_importScan",void 0),t([ut()],We.prototype,"_importSelected",void 0),t([ut()],We.prototype,"_importOverwrite",void 0),t([ut()],We.prototype,"_importBusy",void 0),t([ut()],We.prototype,"_importError",void 0),We=t([dt(Le)],We),window.customCards=window.customCards||[],window.customCards.push({type:Le,name:"Remote Mapper Card",description:"Map physical remote buttons to actions on a canvas layout.",preview:!1}),console.info(`%c REMOTE-MAPPER-CARD %c ${ce} `,"color: white; background: #3f51b5; font-weight: 700;","color: #3f51b5; background: white; font-weight: 700;");export{We as RemoteMapperCard};
