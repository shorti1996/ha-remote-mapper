function t(t,e,i,s){var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),o=new WeakMap;let r=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=o.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&o.set(e,t))}return t}toString(){return this.cssText}};const n=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new r(i,t,s)},a=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:c,defineProperty:d,getOwnPropertyDescriptor:h,getOwnPropertyNames:l,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,m=globalThis,_=m.trustedTypes,v=_?_.emptyScript:"",g=m.reactiveElementPolyfillSupport,f=(t,e)=>t,y={toAttribute(t,e){switch(e){case Boolean:t=t?v:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},b=(t,e)=>!c(t,e),w={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:b};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=w){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&d(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:o}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const r=s?.call(this);o?.call(this,e),this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??w}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const t=this.properties,e=[...l(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),o=e.litNonce;void 0!==o&&s.setAttribute("nonce",o),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const o=(void 0!==i.converter?.toAttribute?i.converter:y).toAttribute(e,i.type);this._$Em=t,null==o?this.removeAttribute(s):this.setAttribute(s,o),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),o="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:y;this._$Em=s;const r=o.fromAttribute(e,t.type);this[s]=r??this._$Ej?.get(s)??r,this._$Em=null}}requestUpdate(t,e,i,s=!1,o){if(void 0!==t){const r=this.constructor;if(!1===s&&(o=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??b)(o,e)||i.useDefault&&i.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:o},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==o||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[f("elementProperties")]=new Map,$[f("finalized")]=new Map,g?.({ReactiveElement:$}),(m.reactiveElementVersions??=[]).push("2.1.2");const x=globalThis,k=t=>t,A=x.trustedTypes,E=A?A.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",T=`lit$${Math.random().toFixed(9).slice(2)}$`,M="?"+T,z=`<${M}>`,C=document,I=()=>C.createComment(""),O=t=>null===t||"object"!=typeof t&&"function"!=typeof t,D=Array.isArray,P="[ \t\n\f\r]",L=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,q=/>/g,H=RegExp(`>|${P}(?:([^\\s"'>=/]+)(${P}*=${P}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),N=/'/g,U=/"/g,B=/^(?:script|style|textarea|title)$/i,j=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),W=Symbol.for("lit-noChange"),Y=Symbol.for("lit-nothing"),G=new WeakMap,V=C.createTreeWalker(C,129);function X(t,e){if(!D(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==E?E.createHTML(e):e}const F=(t,e)=>{const i=t.length-1,s=[];let o,r=2===e?"<svg>":3===e?"<math>":"",n=L;for(let e=0;e<i;e++){const i=t[e];let a,c,d=-1,h=0;for(;h<i.length&&(n.lastIndex=h,c=n.exec(i),null!==c);)h=n.lastIndex,n===L?"!--"===c[1]?n=R:void 0!==c[1]?n=q:void 0!==c[2]?(B.test(c[2])&&(o=RegExp("</"+c[2],"g")),n=H):void 0!==c[3]&&(n=H):n===H?">"===c[0]?(n=o??L,d=-1):void 0===c[1]?d=-2:(d=n.lastIndex-c[2].length,a=c[1],n=void 0===c[3]?H:'"'===c[3]?U:N):n===U||n===N?n=H:n===R||n===q?n=L:(n=H,o=void 0);const l=n===H&&t[e+1].startsWith("/>")?" ":"";r+=n===L?i+z:d>=0?(s.push(a),i.slice(0,d)+S+i.slice(d)+T+l):i+T+(-2===d?e:l)}return[X(t,r+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class J{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let o=0,r=0;const n=t.length-1,a=this.parts,[c,d]=F(t,e);if(this.el=J.createElement(c,i),V.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=V.nextNode())&&a.length<n;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(S)){const e=d[r++],i=s.getAttribute(t).split(T),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:o,name:n[2],strings:i,ctor:"."===n[1]?et:"?"===n[1]?it:"@"===n[1]?st:tt}),s.removeAttribute(t)}else t.startsWith(T)&&(a.push({type:6,index:o}),s.removeAttribute(t));if(B.test(s.tagName)){const t=s.textContent.split(T),e=t.length-1;if(e>0){s.textContent=A?A.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],I()),V.nextNode(),a.push({type:2,index:++o});s.append(t[e],I())}}}else if(8===s.nodeType)if(s.data===M)a.push({type:2,index:o});else{let t=-1;for(;-1!==(t=s.data.indexOf(T,t+1));)a.push({type:7,index:o}),t+=T.length-1}o++}}static createElement(t,e){const i=C.createElement("template");return i.innerHTML=t,i}}function K(t,e,i=t,s){if(e===W)return e;let o=void 0!==s?i._$Co?.[s]:i._$Cl;const r=O(e)?void 0:e._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(t),o._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=o:i._$Cl=o),void 0!==o&&(e=K(t,o._$AS(t,e.values),o,s)),e}class Q{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??C).importNode(e,!0);V.currentNode=s;let o=V.nextNode(),r=0,n=0,a=i[0];for(;void 0!==a;){if(r===a.index){let e;2===a.type?e=new Z(o,o.nextSibling,this,t):1===a.type?e=new a.ctor(o,a.name,a.strings,this,t):6===a.type&&(e=new ot(o,this,t)),this._$AV.push(e),a=i[++n]}r!==a?.index&&(o=V.nextNode(),r++)}return V.currentNode=C,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class Z{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=Y,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=K(this,t,e),O(t)?t===Y||null==t||""===t?(this._$AH!==Y&&this._$AR(),this._$AH=Y):t!==this._$AH&&t!==W&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>D(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==Y&&O(this._$AH)?this._$AA.nextSibling.data=t:this.T(C.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=J.createElement(X(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new Q(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=G.get(t.strings);return void 0===e&&G.set(t.strings,e=new J(t)),e}k(t){D(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const o of t)s===e.length?e.push(i=new Z(this.O(I()),this.O(I()),this,this.options)):i=e[s],i._$AI(o),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,o){this.type=1,this._$AH=Y,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=Y}_$AI(t,e=this,i,s){const o=this.strings;let r=!1;if(void 0===o)t=K(this,t,e,0),r=!O(t)||t!==this._$AH&&t!==W,r&&(this._$AH=t);else{const s=t;let n,a;for(t=o[0],n=0;n<o.length-1;n++)a=K(this,s[i+n],e,n),a===W&&(a=this._$AH[n]),r||=!O(a)||a!==this._$AH[n],a===Y?t=Y:t!==Y&&(t+=(a??"")+o[n+1]),this._$AH[n]=a}r&&!s&&this.j(t)}j(t){t===Y?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===Y?void 0:t}}class it extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==Y)}}class st extends tt{constructor(t,e,i,s,o){super(t,e,i,s,o),this.type=5}_$AI(t,e=this){if((t=K(this,t,e,0)??Y)===W)return;const i=this._$AH,s=t===Y&&i!==Y||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,o=t!==Y&&(i===Y||s);s&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class ot{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){K(this,t)}}const rt=x.litHtmlPolyfillSupport;rt?.(J,Z),(x.litHtmlVersions??=[]).push("3.3.3");const nt=globalThis;class at extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let o=s._$litPart$;if(void 0===o){const t=i?.renderBefore??null;s._$litPart$=o=new Z(e.insertBefore(I(),t),t,void 0,i??{})}return o._$AI(t),o})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}}at._$litElement$=!0,at.finalized=!0,nt.litElementHydrateSupport?.({LitElement:at});const ct=nt.litElementPolyfillSupport;ct?.({LitElement:at}),(nt.litElementVersions??=[]).push("4.2.2");const dt=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},ht={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:b},lt=(t=ht,e,i)=>{const{kind:s,metadata:o}=i;let r=globalThis.litPropertyMetadata.get(o);if(void 0===r&&globalThis.litPropertyMetadata.set(o,r=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),r.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const o=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,o,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const o=this[s];e.call(this,i),this.requestUpdate(s,o,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function pt(t){return(e,i)=>"object"==typeof i?lt(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function ut(t){return pt({...t,state:!0,attribute:!1})}let mt=null;function _t(){return mt||(mt=window.loadCardHelpers?window.loadCardHelpers():Promise.resolve(null)),mt}let vt=null;function gt(){return customElements.get("ha-form")?Promise.resolve(!0):(vt||(vt=(async()=>{try{const t=await _t(),e=t?.createCardElement?.({type:"entities",entities:[]});await(e?.constructor?.getConfigElement?.())}catch{}const t=await Promise.race([customElements.whenDefined("ha-form").then(()=>!0),new Promise(t=>setTimeout(()=>t(!1),2e3))]),e=t&&!!customElements.get("ha-form");return e||(vt=null),e})()),vt)}let ft=null;const yt=["single","double","triple","hold","release","other"],bt={single:"1",double:"2",triple:"3",hold:"⧗",release:"↥",other:"•"},wt={single:"single press",double:"double press",triple:"triple press",hold:"hold",release:"release",other:"other"},$t=(t,e)=>`${t},${e}`;function xt(t,e){const i=t&&t.rows>0&&t.cols>0?{rows:t.rows,cols:t.cols}:function(t){if(t<=1)return{rows:1,cols:1};const e=t<=6?2:Math.min(12,Math.ceil(Math.sqrt(t)));return{rows:Math.ceil(t/e),cols:e}}(e.length),s=Math.min(12,i.cols);let o=Math.min(12,i.rows);const r={},n=new Set,a=[];for(const i of e){const e=t?.buttons?.[i.id],c=e?.label?.trim()?{label:e.label.trim()}:{};e&&Number.isInteger(e.row)&&Number.isInteger(e.col)&&e.row>=0&&e.col>=0&&e.row<o&&e.col<s&&!n.has($t(e.row,e.col))?(r[i.id]={row:e.row,col:e.col,...c},n.add($t(e.row,e.col))):a.push({id:i.id,...c})}let c=0;for(const t of a)for(;;){const e=Math.floor(c/s),i=c%s;if(c++,e>=o&&(o=e+1),!n.has($t(e,i))){r[t.id]={row:e,col:i,...t.label?{label:t.label}:{}},n.add($t(e,i));break}}return{schema_version:1,rows:o,cols:s,buttons:r}}function kt(t){const e=new Map;for(const[i,s]of Object.entries(t.buttons))e.set($t(s.row,s.col),i);return e}function At(t){const e={};for(const[i,s]of Object.entries(t.buttons)){const{label:t,...o}=s,r=t?.trim();e[i]=r?{...o,label:r}:o}return{...t,buttons:e}}function Et(t,e){return e.buttons[t.id]?.label||t.label}function St(t,e){return t.actions.find(t=>t.kind===e)}const Tt=["Tap the pencil at the top right of this card to rename buttons and assign actions to their events.","In edit mode, Import picks which of this remote's existing automations the card should manage; Hand back returns them to HA.","Layout, colours and display mode live in the card's settings: open HA's dashboard edit mode and edit this card.","Press a button on the physical remote and its event lights up here. In edit mode, Refresh picks up newly discovered events."],Mt="remote_mapper_tips_seen";function zt(){try{return globalThis.localStorage}catch{return}}function Ct(t=zt()){try{const e=parseInt(t?.getItem(Mt)??"0",10);return Math.min(Math.max(Number.isFinite(e)?e:0,0),Tt.length)}catch{return 0}}function It(t,e){try{e?.setItem(Mt,String(t))}catch{}}const Ot="remote_mapper_tips_reset";function Dt(t){const e={...bt},i=t?.event_icons;if(i&&"object"==typeof i)for(const t of yt){const s=i[t];"string"==typeof s&&s.trim()&&(e[t]=s.trim())}return e}const Pt=[{value:"assisted",label:"Assisted — press a button, pick the event"},{value:"replica",label:"Replica — tap / double-tap / hold like the physical remote"},{value:"all",label:"All visible — every event of every button"}],Lt=[{value:"grid",label:"Grid — buttons arranged like the remote"},{value:"canvas",label:"Canvas — free placement, one tile per event"}],Rt=[{value:"auto",label:"Auto — slide with a finger, tap with a mouse"},{value:"tap",label:"Tap opens, tap again closes; tap an option"},{value:"press",label:"Long-press opens; slide to an option and lift"}],qt=[{value:"vertical",label:"Vertical list"},{value:"horizontal",label:"Wrapped row — chips flow like tags"},{value:"compact",label:"Compact icons — one row, name on hover / long-press"},{value:"spines",label:"Spines — one row, names rotated 90°"},{value:"grid",label:"Two-column grid"}];function Ht(t){const e=t?.display,i="normal"===e?"replica":e;return Pt.some(t=>t.value===i)?i:"assisted"}function Nt(t){return"canvas"===t?.layout?"canvas":"grid"}function Ut(t){const e=t?.assisted_trigger;return"press"===e||"tap"===e?e:"auto"}function Bt(t){const e=t?.chips_layout;return qt.some(t=>t.value===e)?e:"vertical"}function jt(t){if("string"!=typeof t)return;const e=/^#([0-9a-f]{6})$/i.exec(t.trim());if(!e)return;const i=parseInt(e[1],16);return[i>>16&255,i>>8&255,255&i]}function Wt(t){if(!Array.isArray(t)||3!==t.length)return;const e=t.map(t=>Math.max(0,Math.min(255,0|Number(t))).toString(16).padStart(2,"0"));return`#${e.join("")}`}const Yt="__auto__",Gt=["button_color","accent_color","text_color"],Vt="#3f51b5";const Xt={entry_id:"Remote",title:"Title",show_title:"Show title",layout:"Layout",display:"Display mode",assisted_trigger:"Popover opens on",chips_layout:"Event chips",hide_unset:"Hide events that are not set",button_color:"Button color",accent_color:"Accent color",text_color:"Text color",button_opacity:"Button opacity"},Ft={title:"Empty = the remote's name.",hide_unset:"Edit mode (pencil) still shows them, so you can assign one.",button_color:"Pad background. Turn the switch off to use the theme.",accent_color:"Borders, assigned marks, flashes. Off = theme primary color.",text_color:"Off = theme text color.",button_opacity:"Pad background only; text stays readable."},Jt={ask:"asks each time",always_delete:"always deletes",never_delete:"never deletes"},Kt=t=>({select:{mode:"dropdown",options:t}});let Qt=class extends at{constructor(){super(...arguments),this._formOk=!1,this._fetching=!1,this._tipsRev=0,this._changed=t=>{t.stopPropagation(),this._emit(function(t,e){const i={...t,type:t.type},s=(t,e,s)=>{void 0===e||""===e||s?delete i[t]:i[t]=e};s("entry_id",e.entry_id,e.entry_id===Yt),s("title",e.title,"string"==typeof e.title&&!e.title.trim()),s("show_title",e.show_title,!1!==e.show_title),s("layout",e.layout,"canvas"!==e.layout),s("display",e.display,"assisted"===e.display),s("assisted_trigger",e.assisted_trigger,"auto"===e.assisted_trigger),s("chips_layout",e.chips_layout,"vertical"===e.chips_layout),s("hide_unset",e.hide_unset,!0!==e.hide_unset);for(const t of Gt){if(!e[`${t}_set`]){delete i[t];continue}const s=Wt(e[t]),o="string"==typeof i[t]?i[t]:void 0;(!o||jt(o)||s&&s!==Vt)&&(i[t]=s??o??Vt)}const o=e.button_opacity;s("button_opacity",o,"number"!=typeof o||o>=1);const r=e.event_icons,n={};if(r&&"object"==typeof r)for(const t of yt){const e=r[t];"string"==typeof e&&e.trim()&&(n[t]=e.trim())}return s("event_icons",n,0===Object.keys(n).length),i}(this._config,t.detail.value))},this._trimOnBlur=()=>{const t=function(t){let e=!1;const i={...t};for(const t of["title",...Gt]){const s=i[t];if("string"!=typeof s)continue;const o=s.trim();o!==s&&(e=!0,o?i[t]=o:delete i[t])}return e?i:t}(this._config);t!==this._config&&this._emit(t)}}setConfig(t){this._config=t}_entryId(){return this._config?.entry_id?this._config.entry_id:1===this._remotes?.length?this._remotes[0].entry_id:void 0}_fetchOptions(){const t=this._entryId();this.hass&&t&&t!==this._optionsFor&&(this._optionsFor=t,this._options=void 0,this.hass.callWS({type:"remote_mapper/get_options",entry_id:t}).then(e=>{this._optionsFor===t&&(this._options=e)}).catch(()=>{}))}async _reset(t){const e=this._entryId();if(this.hass&&e)try{await this.hass.callWS({type:"remote_mapper/reset_options",entry_id:e,[t]:!0}),this._optionsFor=void 0,this._fetchOptions()}catch(t){window.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:`Reset failed: ${t.message??String(t)}`}}))}}connectedCallback(){super.connectedCallback(),gt().then(t=>{this._formOk=t})}willUpdate(){!this.hass||this._remotes||this._fetching||(this._fetching=!0,this.hass.callWS({type:"remote_mapper/list_remotes"}).then(t=>{this._remotes=t.remotes}).catch(()=>{this._remotes=[]})),this._fetchOptions()}_renderReset(){const t=this._options,e=Ct();return this._tipsRev,t||e?j`
      <div class="reset">
        <p class="hint reset-title">Start over</p>
        ${t?j`
              <div class="reset-row">
                <span class="hint">
                  Deleting a scene or automation the card created:
                  <b>${Jt[t.cleanup_policy]}</b>
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
                  Default entities for <i>Scene from current state</i>:
                  <b>${t.snapshot_entities.length?t.snapshot_entities.length:"none"}</b>
                </span>
                <button
                  ?disabled=${!t.snapshot_entities.length}
                  @click=${()=>{this._reset("snapshot_entities")}}
                >
                  Forget
                </button>
              </div>
            `:Y}
        <div class="reset-row">
          <span class="hint">
            Tips at the top of the card, in this browser:
            <b>${e?"seen":"showing"}</b>
          </span>
          <button
            ?disabled=${!e}
            @click=${()=>{!function(t=zt()){It(0,t);try{globalThis.dispatchEvent?.(new Event(Ot))}catch{}}(),this._tipsRev++}}
          >
            Show again
          </button>
        </div>
      </div>
    `:Y}render(){const t=this._config;if(!t)return Y;if(!this._formOk)return j`<p class="hint">Loading editor components…</p>`;const e=Ht(t),i=[{name:"entry_id",selector:Kt([{value:Yt,label:"Auto (the only remote)"},...(this._remotes??[]).map(t=>({value:t.entry_id,label:t.title}))])},{name:"title",selector:{text:{}}},{name:"show_title",selector:{boolean:{}}},{name:"layout",selector:Kt(Lt)},{name:"display",selector:Kt(Pt)}];"assisted"===e&&i.push({name:"assisted_trigger",selector:Kt(Rt)}),"all"===e&&(i.push({name:"chips_layout",selector:Kt(qt)}),i.push({name:"hide_unset",selector:{boolean:{}}}));for(const e of Gt)i.push({name:`${e}_set`,selector:{boolean:{}}}),t[e]&&i.push({name:e,selector:{color_rgb:{}}});i.push({name:"button_opacity",selector:{number:{min:.1,max:1,step:.05,mode:"slider"}}}),i.push({name:"event_icons",type:"expandable",title:"Event marks",schema:yt.map(t=>({name:t,selector:{icon:{}}}))});const s=function(t){return{entry_id:t.entry_id||Yt,title:t.title??"",show_title:!1!==t.show_title,layout:Nt(t),display:Ht(t),assisted_trigger:Ut(t),chips_layout:Bt(t),hide_unset:!0===t.hide_unset,button_color_set:!!t.button_color,accent_color_set:!!t.accent_color,text_color_set:!!t.text_color,button_color:jt(t.button_color)??[63,81,181],accent_color:jt(t.accent_color)??[63,81,181],text_color:jt(t.text_color)??[255,255,255],button_opacity:t.button_opacity??1,event_icons:Object.fromEntries(yt.map(e=>[e,t.event_icons?.[e]??""]))}}(t);return j`
      <ha-form
        .hass=${this.hass}
        .data=${s}
        .schema=${i}
        .computeLabel=${t=>t.name.endsWith("_set")?`Custom ${Xt[t.name.slice(0,-4)].toLowerCase()}`:t.name in wt?`${wt[t.name]} (default: ${bt[t.name]})`:Xt[t.name]??t.name}
        .computeHelper=${e=>"display"===e.name&&"canvas"===Nt(t)?"Ignored for the canvas layout (every tile is already visible).":Ft[e.name]??""}
        @value-changed=${this._changed}
        @focusout=${this._trimOnBlur}
      ></ha-form>
      ${this._renderReset()}
    `}_emit(t){this._config=t,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:t},bubbles:!0,composed:!0}))}};Qt.styles=n`
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
  `,t([pt({attribute:!1})],Qt.prototype,"hass",void 0),t([ut()],Qt.prototype,"_config",void 0),t([ut()],Qt.prototype,"_remotes",void 0),t([ut()],Qt.prototype,"_formOk",void 0),t([ut()],Qt.prototype,"_options",void 0),t([ut()],Qt.prototype,"_tipsRev",void 0),Qt=t([dt("remote-mapper-card-editor")],Qt);let Zt=class extends at{constructor(){super(...arguments),this.rows=1,this.cols=1,this.minCells=1}render(){const t=this._hover??{r:this.rows-1,c:this.cols-1},e=Math.min(12,Math.max(5,t.r+2,this.rows+1)),i=Math.min(12,Math.max(5,t.c+2,this.cols+1)),s=[];for(let o=0;o<e;o++)for(let e=0;e<i;e++)s.push(j`
          <div
            class="cell ${o<=t.r&&e<=t.c?"on":""}"
            @pointerenter=${()=>{this._hover={r:o,c:e}}}
            @pointerdown=${()=>{this._hover={r:o,c:e}}}
            @click=${()=>this._pick(o+1,e+1)}
          ></div>
        `);const o=(t.r+1)*(t.c+1);return j`
      <div
        class="matrix"
        style="grid-template-columns: repeat(${i}, var(--ha-space-7, 28px))"
        @pointerleave=${()=>{this._hover=void 0}}
      >
        ${s}
      </div>
      <div class="caption">
        ${t.r+1} rows × ${t.c+1} cols
        ${o<this.minCells?j`<span class="warn">· grows to fit ${this.minCells} buttons</span>`:""}
      </div>
    `}_pick(t,e){this._hover=void 0,this.dispatchEvent(new CustomEvent("grid-picked",{detail:{rows:t,cols:e},bubbles:!0,composed:!0}))}};Zt.styles=n`
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
  `,t([pt({type:Number})],Zt.prototype,"rows",void 0),t([pt({type:Number})],Zt.prototype,"cols",void 0),t([pt({type:Number})],Zt.prototype,"minCells",void 0),t([ut()],Zt.prototype,"_hover",void 0),Zt=t([dt("remote-mapper-grid-picker")],Zt);const te={holdMs:500,multiMs:280,moveTolerance:10};class ee{constructor(t,e={}){this._emit=t,this._taps=0,this._caps={double:!1,triple:!1,hold:!1},this._held=!1,this._down=!1,this._startX=0,this._startY=0,this._opts={...te,...e}}get pending(){return void 0!==this._multiTimer}down(t,e){this._down||(this._down=!0,this._held=!1,this._caps=e,this._startX=t.clientX,this._startY=t.clientY,void 0!==this._multiTimer&&(clearTimeout(this._multiTimer),this._multiTimer=void 0),e.hold&&(this._holdTimer=setTimeout(()=>{this._holdTimer=void 0,this._held=!0,this._taps=0,this._emit("hold")},this._opts.holdMs)))}move(t){if(!this._down)return;const e=t.clientX-this._startX,i=t.clientY-this._startY;e*e+i*i>this._opts.moveTolerance**2&&this.cancel()}up(){if(!this._down)return;if(this._down=!1,this._clearHold(),this._held)return this._held=!1,void this._emit("release");this._taps++;const{double:t,triple:e}=this._caps;this._taps>=3||2===this._taps&&!e||1===this._taps&&!t&&!e?this._flush():this._multiTimer=setTimeout(()=>{this._multiTimer=void 0,this._flush()},this._opts.multiMs)}cancel(){this._down=!1,this._held=!1,this._taps=0,this._clearHold(),void 0!==this._multiTimer&&(clearTimeout(this._multiTimer),this._multiTimer=void 0)}_flush(){const t=this._taps;this._taps=0,t>=3?this._emit("triple"):2===t?this._emit("double"):1===t&&this._emit("single")}_clearHold(){void 0!==this._holdTimer&&(clearTimeout(this._holdTimer),this._holdTimer=void 0)}}function ie(t){return function(t){return t.startsWith("mdi:")}(t)?j`<ha-icon class="mark-icon" icon=${t}></ha-icon>`:t}let se=class extends at{constructor(){super(...arguments),this.buttons=[],this.slots={},this.display="assisted",this.editing=!1,this.assistedTrigger="auto",this.chipsLayout="vertical",this.hideUnset=!1,this.kindIcons=bt,this._chipTipShown=!1,this._pressMode="tap",this._pressActive=!1,this._touchMoveBlocker=t=>{this._pressActive&&t.cancelable&&t.preventDefault()},this._recognizers=new Map,this._chipPressEnd=()=>{void 0!==this._chipTipTimer&&(clearTimeout(this._chipTipTimer),this._chipTipTimer=void 0)}}connectedCallback(){super.connectedCallback(),this.addEventListener("touchmove",this._touchMoveBlocker,{passive:!1})}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("touchmove",this._touchMoveBlocker),this._clearPressTimer();for(const t of this._recognizers.values())t.cancel()}_clearPressTimer(){void 0!==this._pressTimer&&(clearTimeout(this._pressTimer),this._pressTimer=void 0)}willUpdate(t){if(t.has("editing")||t.has("display")){this._popover=void 0,this._drag=void 0,this._dropTarget=void 0,this._actionDrag=void 0,this._actionDrop=void 0;for(const t of this._recognizers.values())t.cancel()}}_emit(t,e){this.dispatchEvent(new CustomEvent(t,{detail:e,bubbles:!0,composed:!0}))}_run(t){const e=this.slots[t];e?.assigned&&!e.archived&&this._emit("run-action",{actionId:t})}_chipPressStart(t,e){"compact"===this.chipsLayout&&"mouse"!==t.pointerType&&(this._chipPressEnd(),this._chipTipShown=!1,this._chipTipTimer=setTimeout(()=>{this._chipTipTimer=void 0,this._chipTipShown=!0;const t=this.slots[e],i=this.buttons.flatMap(t=>t.actions).find(t=>t.action_id===e),s=`${i?wt[i.kind]:e}: ${t?.summary??"not set"}`;this._chipTip={action:e,text:s},setTimeout(()=>{this._chipTip?.action===e&&(this._chipTip=void 0)},1800)},450))}_recognizer(t){let e=this._recognizers.get(t.id);return e||(e=new ee(e=>this._onGesture(t.id,e)),this._recognizers.set(t.id,e)),e}_live(t,e){const i=St(t,e),s=i?this.slots[i.action_id]:void 0;return s?.assigned&&!s.archived?i.action_id:void 0}_caps(t){return{double:!!this._live(t,"double"),triple:!!this._live(t,"triple"),hold:!!this._live(t,"hold")}}_onGesture(t,e){const i=this.buttons.find(e=>e.id===t);if(!i)return;const s=this._live(i,e);s&&this._emit("run-action",{actionId:s})}_elementAt(t,e){return this.shadowRoot?.elementFromPoint(t,e)??null}_cellKeyAt(t,e){const i=this._elementAt(t,e)?.closest(".cell");return void 0!==i?.dataset.row?`${i.dataset.row},${i.dataset.col}`:void 0}_onCellDown(t,e,i,s){if("mouse"===t.pointerType&&0!==t.button)return;const o=t.currentTarget;if(this.editing)return o.setPointerCapture(t.pointerId),void(this._drag={id:e.id,row:i,col:s,startX:t.clientX,startY:t.clientY,x:t.clientX,y:t.clientY,moved:!1});"replica"===this.display?(o.setPointerCapture(t.pointerId),this._recognizer(e).down(t,this._caps(e))):"assisted"===this.display&&(o.setPointerCapture(t.pointerId),this._pressMode="auto"===this.assistedTrigger?"touch"===t.pointerType?"press":"tap":this.assistedTrigger,this._pressActive=!1,this._clearPressTimer(),"press"===this._pressMode&&(this._pressTimer=setTimeout(()=>{this._pressTimer=void 0,this._pressActive=!0,this._popover=e.id},400)))}_optAt(t,e){const i=this._elementAt(t,e)?.closest(".opt");return i?.dataset.action}_onCellMove(t,e){const i=this._drag;if(i){if(!i.moved){const e=t.clientX-i.startX,s=t.clientY-i.startY;if(e*e+s*s<64)return}return this._drag={...i,moved:!0,x:t.clientX,y:t.clientY},void(this._dropTarget=this._cellKeyAt(t.clientX,t.clientY))}if(!this.editing)if("replica"===this.display)this._recognizers.get(e.id)?.move(t);else if("assisted"===this.display&&this._popover===e.id){const e=this._optAt(t.clientX,t.clientY);e!==this._hoverOpt&&(this._hoverOpt=e)}}_onCellUp(t,e){const i=this._drag;if(i){const t=this._dropTarget;if(this._drag=void 0,this._dropTarget=void 0,i.moved){if(t&&this.layout){const[e,s]=t.split(",").map(Number),o=function(t,e,i){if(e.row===i.row&&e.col===i.col)return t;const s=kt(t),o=s.get($t(e.row,e.col));if(!o)return t;const r=s.get($t(i.row,i.col)),n={...t.buttons};return n[o]={...n[o],row:i.row,col:i.col},r&&(n[r]={...n[r],row:e.row,col:e.col}),{...t,buttons:n}}(this.layout,i,{row:e,col:s});o!==this.layout&&this._emit("layout-changed",{layout:o})}}else this._emit("open-button",{buttonId:i.id});return}if("replica"!==this.display){if("assisted"===this.display){const i=this._popover===e.id?this._optAt(t.clientX,t.clientY):void 0;this._hoverOpt=void 0;const s=this._pressActive;this._pressActive=!1,this._clearPressTimer(),i?(this._popover=void 0,this._run(i)):this._popover=s||this._popover===e.id?void 0:e.id}}else this._recognizers.get(e.id)?.up()}_onCellCancel(t){this._drag=void 0,this._dropTarget=void 0,this._hoverOpt=void 0,this._pressActive=!1,this._clearPressTimer(),this._recognizers.get(t.id)?.cancel()}_markHandlers(t){return this.editing?{pointerdown:e=>this._onMarkDown(e,t),pointermove:t=>this._onMarkMove(t),pointerup:t=>this._onMarkUp(t),pointercancel:()=>this._onMarkCancel()}:{}}_onMarkDown(t,e){"mouse"===t.pointerType&&0!==t.button||(t.stopPropagation(),t.currentTarget.setPointerCapture(t.pointerId),this._actionDrag={action:e,summary:this.slots[e.action_id]?.summary??"not set",startX:t.clientX,startY:t.clientY,x:t.clientX,y:t.clientY,moved:!1},this._actionDrop=void 0)}_onMarkMove(t){const e=this._actionDrag;if(!e)return;if(t.stopPropagation(),!e.moved){const i=t.clientX-e.startX,s=t.clientY-e.startY;if(i*i+s*s<64)return}this._actionDrag={...e,moved:!0,x:t.clientX,y:t.clientY};const i=this._elementAt(t.clientX,t.clientY),s=i?.closest("[data-action]"),o=i?.closest(".cell.btn"),r=new Set(Object.keys(this.slots).filter(t=>this.slots[t]?.linked));this._actionDrop=function(t,e,i,s){let o=t.actionId;if(!o&&t.buttonId){const s=i.find(e=>e.id===t.buttonId);o=s?St(s,e.kind)?.action_id:void 0}if(o&&o!==e.actionId&&!s.has(o))return o}({actionId:s?.dataset.action,buttonId:o?.dataset.button},{actionId:e.action.action_id,kind:e.action.kind},this.buttons,r)}_onMarkUp(t){const e=this._actionDrag;if(!e)return;t.stopPropagation();const i=this._actionDrop;if(this._actionDrag=void 0,this._actionDrop=void 0,!e.moved){const t=this.buttons.find(t=>t.actions.some(t=>t.action_id===e.action.action_id));return void(t&&this._emit("open-button",{buttonId:t.id}))}i&&this._emit("move-action",{actionId:e.action.action_id,targetId:i})}_onMarkCancel(){this._actionDrag=void 0,this._actionDrop=void 0}_padDropFor(t){const e=this._actionDrop;return!!e&&t.actions.some(t=>t.action_id===e)}render(){const t=this.layout;if(!t)return Y;const e=kt(t),i=new Map(this.buttons.map(t=>[t.id,t])),s=[];for(let o=0;o<t.rows;o++)for(let r=0;r<t.cols;r++){const n=e.get(`${o},${r}`),a=n?i.get(n):void 0;s.push(a?this._renderButton(a,t,o,r):this._renderEmpty(o,r))}const o=this._drag,r=o?.moved?i.get(o.id):void 0;return j`
      ${this._popover?j`<div
            class="backdrop"
            @pointerdown=${()=>{this._popover=void 0}}
          ></div>`:Y}
      <div
        class="grid ${this.display} ${this.editing?"editing":""}"
        style="grid-template-columns: repeat(${t.cols}, minmax(0, 1fr))"
      >
        ${s}
      </div>
      ${r&&o?j`<div class="ghost" style="left:${o.x}px;top:${o.y}px">
            ${Et(r,t)}
          </div>`:Y}
      ${this._actionDrag?.moved?j`<div
            class="ghost action-ghost"
            style="left:${this._actionDrag.x}px;top:${this._actionDrag.y}px"
          >
            <span class="icon">${ie(this.kindIcons[this._actionDrag.action.kind])}</span>
            ${this._actionDrag.summary}
          </div>`:Y}
    `}_renderEmpty(t,e){const i=`${t},${e}`;return j`<div
      class="cell empty ${this._dropTarget===i?"drop":""}"
      data-row=${t}
      data-col=${e}
    ></div>`}_renderButton(t,e,i,s){const o=`${i},${s}`,r=this.flash&&t.actions.some(t=>t.action_id===this.flash),n=t.actions.map(t=>this.slots[t.action_id]?.error).find(t=>!!t),a=["cell","btn",this._drag?.id===t.id&&this._drag.moved?"dragging":"",this._dropTarget===o||this._padDropFor(t)?"drop":"",this._popover===t.id?"active":"",r&&"all"!==this.display?"flash":""].join(" ");return j`
      <div
        class=${a}
        data-row=${i}
        data-col=${s}
        data-button=${t.id}
        @pointerdown=${e=>this._onCellDown(e,t,i,s)}
        @pointermove=${e=>this._onCellMove(e,t)}
        @pointerup=${e=>this._onCellUp(e,t)}
        @pointercancel=${()=>this._onCellCancel(t)}
        @contextmenu=${t=>{("assisted"===this.display||this.editing)&&t.preventDefault()}}
      >
        <span class="label">${Et(t,e)}</span>
        ${"all"===this.display?this._renderChips(t):this._renderCompact(t)}
        ${this._chipTip&&t.actions.some(t=>t.action_id===this._chipTip.action)?j`<div class="chip-tip">${this._chipTip.text}</div>`:Y}
        ${n?j`<span class="badge err" title=${n}>!</span>`:Y}
        ${this._popover===t.id?this._renderPopover(t):Y}
      </div>
    `}_renderCompact(t){const e=t.actions.filter(t=>this.slots[t.action_id]?.assigned),i=e[0];return j`
      <span class="summary"
        >${i?this.slots[i.action_id].summary:"not set"}</span
      >
      <span class="kinds">
        ${t.actions.map(t=>{const e=this.slots[t.action_id],i=e?.assigned&&!e.archived,s=this._markHandlers(t),o=["kind",i?"on":"",this.flash===t.action_id?"flash":"",this._actionDrop===t.action_id?"drop":"",this._actionDrag?.moved&&this._actionDrag.action.action_id===t.action_id?"dragging":""].join(" ");return j`<span
            class=${o}
            data-action=${t.action_id}
            title="${t.event} (${wt[t.kind]}): ${e?.summary??"not set"}"
            @pointerdown=${s.pointerdown}
            @pointermove=${s.pointermove}
            @pointerup=${s.pointerup}
            @pointercancel=${s.pointercancel}
            >${ie(this.kindIcons[t.kind])}</span
          >`})}
      </span>
    `}_renderChips(t){const e=this.hideUnset&&!this.editing?t.actions.filter(t=>this.slots[t.action_id]?.assigned):t.actions;return j`
      <div class="chips ${this.chipsLayout}">
        ${e.map(t=>{const e=this.slots[t.action_id],i=this._markHandlers(t),s=["chip",e?.assigned?"on":"",e?.archived?"archived":"",this.flash===t.action_id?"flash":"",this._actionDrop===t.action_id?"drop":"",this._actionDrag?.moved&&this._actionDrag.action.action_id===t.action_id?"dragging":""].join(" ");return j`
            <button
              class=${s}
              data-action=${t.action_id}
              title="${t.event} (${wt[t.kind]}): ${e?.summary??"not set"}"
              @pointerdown=${i.pointerdown??(e=>this._chipPressStart(e,t.action_id))}
              @pointermove=${i.pointermove}
              @pointerup=${i.pointerup??this._chipPressEnd}
              @pointercancel=${i.pointercancel??this._chipPressEnd}
              @contextmenu=${t=>{this._chipTip&&t.preventDefault()}}
              @click=${e=>{if(this._chipTipShown)return e.stopPropagation(),void(this._chipTipShown=!1);this.editing||(e.stopPropagation(),this._run(t.action_id))}}
            >
              <span class="icon">${ie(this.kindIcons[t.kind])}</span>
              <span class="text">${e?.summary??"not set"}</span>
              ${e?.error?j`<span class="err" title=${e.error}>!</span>`:Y}
              ${e?.stale?j`<span class="stale" title="Source no longer reports this action">stale</span>`:Y}
            </button>
          `})}
      </div>
    `}_renderPopover(t){const e=function(t){if(t<=1)return[0];if(t<=4){const e=2===t?70:3===t?120:165;return Array.from({length:t},(i,s)=>-e/2+s*e/(t-1))}return Array.from({length:t},(e,i)=>360*i/t)}(t.actions.length),i=this._hoverOpt?t.actions.find(t=>t.action_id===this._hoverOpt):void 0,s=i?`${wt[i.kind]}: ${this.slots[i.action_id]?.summary??"not set"}`:this._pressActive?"slide to an event, lift to run":"tap an event";return j`
      <div class="popover">
        <div class="opt-status">${s}</div>
        ${t.actions.map((t,i)=>{const s=this.slots[t.action_id],o=s?.assigned&&!s.archived,r=this._hoverOpt===t.action_id?"hover":"",n=e[i]*Math.PI/180,a=50+34*Math.sin(n),c=50-34*Math.cos(n);return j`
            <div
              class="opt ${o?"on":""} ${r}"
              style="--i:${i};left:${a.toFixed(1)}%;top:${c.toFixed(1)}%"
              data-action=${t.action_id}
            >
              <span class="circle" title="${t.event} (${wt[t.kind]})"
                >${ie(this.kindIcons[t.kind])}</span
              >
            </div>
          `})}
      </div>
    `}};se.styles=n`
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
    .grid.editing .kind .mark-icon,
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
    .grid.editing .kind {
      width: var(--ha-space-9, 36px);
      height: var(--ha-space-9, 36px);
      font-size: var(--ha-font-size-m, 14px);
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
  `,t([pt({attribute:!1})],se.prototype,"buttons",void 0),t([pt({attribute:!1})],se.prototype,"layout",void 0),t([pt({attribute:!1})],se.prototype,"slots",void 0),t([pt()],se.prototype,"display",void 0),t([pt({type:Boolean})],se.prototype,"editing",void 0),t([pt()],se.prototype,"flash",void 0),t([pt()],se.prototype,"assistedTrigger",void 0),t([pt()],se.prototype,"chipsLayout",void 0),t([pt({type:Boolean})],se.prototype,"hideUnset",void 0),t([pt({attribute:!1})],se.prototype,"kindIcons",void 0),t([ut()],se.prototype,"_popover",void 0),t([ut()],se.prototype,"_hoverOpt",void 0),t([ut()],se.prototype,"_chipTip",void 0),t([ut()],se.prototype,"_drag",void 0),t([ut()],se.prototype,"_dropTarget",void 0),t([ut()],se.prototype,"_actionDrag",void 0),t([ut()],se.prototype,"_actionDrop",void 0),se=t([dt("remote-mapper-grid")],se);const oe=new Map;const re='This event is linked to a native automation. Edit its actions in HA, or untick "Keep linked" to absorb your changes into the card.';const ne="0.1.8";function ae(t,e){return!e||t.startsWith("__")||e===t?"current":function(t,e){const i=t.split(".").map(t=>parseInt(t,10)||0),s=e.split(".").map(t=>parseInt(t,10)||0);for(let t=0;t<Math.max(i.length,s.length);t++){const e=(i[t]??0)-(s[t]??0);if(e)return e}return 0}(t,e)>0?"ahead":"stale"}function ce(t,e){return Math.max(e,Math.round(t/e)*e)}function de(t,e){return Math.round(t/e)*e}function he(t){const e=t.cell;if("number"==typeof e&&Number.isFinite(e))return{x:e,y:e};const i=e??{};return{x:"number"==typeof i.x&&Number.isFinite(i.x)?i.x:10,y:"number"==typeof i.y&&Number.isFinite(i.y)?i.y:10}}function le(t){return t.map((t,e)=>({w:t,i:e})).sort((t,e)=>(t.w.z??0)-(e.w.z??0)||t.i-e.i).map(t=>t.w)}function pe(t,e){const i=new Map;return t.forEach((t,e)=>i.set(t.id,e+1)),e.map(t=>({...t,z:i.get(t.id)??t.z??1}))}function ue(t){return pe(le(t),t)}const me=new Map;function _e(t,e){const i={canvasId:t,active:!0,working:e,original:e.map(t=>({...t})),selectedId:null,undoStack:[],dpadMode:"fine"};return me.set(t,i),i}function ve(t){return JSON.stringify(ge(t))}function ge(t){if(Array.isArray(t))return t.map(ge);if(t&&"object"==typeof t){const e={};for(const i of Object.keys(t).sort()){const s=t[i];void 0!==s&&(e[i]=ge(s))}return e}return t}function fe(t){return null==t?t:JSON.parse(JSON.stringify(t))}class ye{constructor(t){this.session=null,this.drag=null,this.lpStart=null,this.keydownBound=t=>this.onKeyDown(t),this.host=t}get active(){return this.session?.active??!1}get working(){return this.session?.working??[]}get selectedId(){return this.session?.selectedId??null}get selected(){const t=this.selectedId;return t?this.working.find(e=>e.id===t):void 0}get dpadMode(){return this.session?.dpadMode??"fine"}get dpadSteps(){if("fine"===this.dpadMode)return{x:1,y:1};const t=this.host.config();return t?he(t.grid):{x:1,y:1}}get dirty(){return!!this.session&&!function(t,e){return ve(t)===ve(e)}(this.session.working,this.session.original)}get canUndo(){return(this.session?.undoStack.length??0)>0}get dragging(){return null!==this.drag}tryResume(){const t=this.host.config(),e=(i=t?.canvas_id,i?me.get(i):void 0);var i;return!!e?.active&&(this.session=e,window.addEventListener("keydown",this.keydownBound),!0)}enter(){if(this.session?.active)return;const t=this.host.config();t?.canvas_id&&(this.session=_e(t.canvas_id,fe(t.widgets)),window.addEventListener("keydown",this.keydownBound),this.host.requestUpdate())}async done(){const t=this.session;if(!t)return;const e=ue(t.working);this.teardown();if(!await this.host.saveWorking(e)){const i=this.host.config();this.session=_e(t.canvasId,e),this.session.original=fe(i?.widgets??[]),window.addEventListener("keydown",this.keydownBound)}this.host.requestUpdate()}cancel(t=!1){this.session&&(t||!this.dirty||window.confirm("Discard layout changes? Event edits made in this session are already saved."))&&(this.teardown(),this.host.requestUpdate())}detach(){window.removeEventListener("keydown",this.keydownBound),this.clearDpadRepeat(),this.cancelLongPress(),this.session=null}teardown(){var t;window.removeEventListener("keydown",this.keydownBound),this.clearDpadRepeat(),this.cancelLongPress(),t=this.session?.canvasId,t&&me.delete(t),this.session=null,this.drag=null}pushUndo(){const t=this.session;t&&(t.undoStack.push(fe(t.working)),t.undoStack.length>25&&t.undoStack.shift())}undo(){const t=this.session;if(!t)return;const e=t.undoStack.pop();e&&(t.working=e,t.selectedId&&!e.some(e=>e.id===t.selectedId)&&(t.selectedId=null),this.host.requestUpdate())}select(t){const e=this.session;e&&(e.selectedId=t,this.host.requestUpdate())}updateWidget(t,e,i){const s=this.session;s&&(!1!==i?.undo&&this.pushUndo(),s.working=s.working.map(i=>i.id===t?{...i,...e}:i),this.host.requestUpdate())}zOp(t){const e=this.session;e?.selectedId&&(this.pushUndo(),e.working=function(t,e,i){const s=le(t),o=s.findIndex(t=>t.id===e);if(-1===o)return ue(t);const r=s.splice(o,1)[0];switch(i){case"forward":s.splice(Math.min(o+1,s.length),0,r);break;case"backward":s.splice(Math.max(o-1,0),0,r);break;case"front":s.push(r);break;case"back":s.unshift(r)}return pe(s,t)}(e.working,e.selectedId,t),this.host.requestUpdate())}ensureTiles(t,e){const i=this.session;if(!i)return;const s=new Set(i.working.map(t=>t.id)),o=e.filter(t=>!s.has(t));if(!o.length)return;this.pushUndo();const r=o.map((e,s)=>{return{...t(e,s),z:(o=i.working,o.reduce((t,e)=>Math.max(t,e.z??0),0)+1+s)};var o});i.working=[...i.working,...r],this.host.requestUpdate()}toggleDpadStep(){const t=this.session;t&&(t.dpadMode="fine"===t.dpadMode?"cell":"fine",this.host.requestUpdate())}nudge(t,e){const i=this.session,s=this.host.config(),o=this.selected;if(!i||!s||!o)return;const r=be(o.x+t,0,Math.max(0,s.design_size.width-o.w)),n=be(o.y+e,0,Math.max(0,s.design_size.height-o.h));r===o.x&&n===o.y||this.updateWidget(o.id,{x:we(r),y:we(n)},{undo:!1})}dpadPress(t,e){if(!this.session)return;this.pushUndo();const i=()=>{const i=this.dpadSteps;this.nudge(t*i.x,e*i.y)};i(),this.clearDpadRepeat(),this.dpadTimer=window.setTimeout(()=>{this.dpadInterval=window.setInterval(i,70)},350)}dpadRelease(){this.clearDpadRepeat()}clearDpadRepeat(){void 0!==this.dpadTimer&&clearTimeout(this.dpadTimer),void 0!==this.dpadInterval&&clearInterval(this.dpadInterval),this.dpadTimer=this.dpadInterval=void 0}onKeyDown(t){if(!this.session?.active)return;if(function(t){const e=t.composedPath();for(const t of e){if(!(t instanceof HTMLElement))continue;const e=t.localName;if("input"===e||"textarea"===e||"select"===e)return!0;if(t.isContentEditable)return!0;const i=t.getAttribute?.("role");if("textbox"===i||"combobox"===i||"searchbox"===i)return!0}return!1}(t))return;switch(t.key){case"Escape":return t.preventDefault(),void this.cancel();case"z":return void((t.ctrlKey||t.metaKey)&&(t.preventDefault(),this.undo()))}const e={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[t.key];if(e&&this.selectedId){t.preventDefault();const i=this.dpadSteps,s=t.shiftKey?5:1;t.repeat||this.pushUndo(),this.nudge(e[0]*i.x*s,e[1]*i.y*s)}}onSlotPointerDown(t,e){const i=this.session;if(!i||this.drag||t.button>0)return;t.preventDefault(),t.stopPropagation(),i.selectedId!==e&&this.select(e);const s=this.working.find(t=>t.id===e);s&&this.startDrag(t,{kind:"move",pointerId:t.pointerId,widgetId:e,startClientX:t.clientX,startClientY:t.clientY,orig:{...s},moved:!1,next:{x:s.x,y:s.y,w:s.w,h:s.h}})}onHandlePointerDown(t,e,i){if(!this.session||this.drag||t.button>0)return;t.preventDefault(),t.stopPropagation();const s=this.working.find(t=>t.id===e);s&&this.startDrag(t,{kind:"resize",pointerId:t.pointerId,widgetId:e,startClientX:t.clientX,startClientY:t.clientY,orig:{...s},corner:i,moved:!1,next:{x:s.x,y:s.y,w:s.w,h:s.h}})}startDrag(t,e){this.drag=e;const i=t.currentTarget;try{i.setPointerCapture(t.pointerId)}catch{}const s=t=>this.onDragMove(t),o=t=>{t.pointerId===e.pointerId&&(i.removeEventListener("pointermove",s),i.removeEventListener("pointerup",o),i.removeEventListener("pointercancel",r),this.finishDrag(!1))},r=t=>{t.pointerId===e.pointerId&&(i.removeEventListener("pointermove",s),i.removeEventListener("pointerup",o),i.removeEventListener("pointercancel",r),this.finishDrag(!0))};i.addEventListener("pointermove",s),i.addEventListener("pointerup",o),i.addEventListener("pointercancel",r)}onDragMove(t){const e=this.drag,i=this.host.config();if(!e||!i||t.pointerId!==e.pointerId)return;const s=this.host.scale()||1,o=(t.clientX-e.startClientX)/s,r=(t.clientY-e.startClientY)/s;if(!e.moved&&Math.hypot(o*s,r*s)<3)return;e.moved=!0;const n=i.design_size,a=he(i.grid);if("move"===e.kind)e.next.x=be(e.orig.x+o,0,Math.max(0,n.width-e.orig.w)),e.next.y=be(e.orig.y+r,0,Math.max(0,n.height-e.orig.h));else{const t=e.corner,i=t=>Math.max(a.x,Math.floor(t/a.x)*a.x),s=t=>Math.max(a.y,Math.floor(t/a.y)*a.y);let{x:c,y:d,w:h,h:l}=e.orig;if("se"!==t&&"ne"!==t||(h=e.orig.w+o),"sw"!==t&&"nw"!==t||(h=e.orig.w-o),"se"!==t&&"sw"!==t||(l=e.orig.h+r),"ne"!==t&&"nw"!==t||(l=e.orig.h-r),h=be(ce(h,a.x),a.x,n.width),l=be(ce(l,a.y),a.y,n.height),"sw"===t||"nw"===t){const t=e.orig.x+e.orig.w;h>t&&(h=i(t)),c=we(t-h)}else c+h>n.width&&(h=i(n.width-c));if("ne"===t||"nw"===t){const t=e.orig.y+e.orig.h;l>t&&(l=s(t)),d=we(t-l)}else d+l>n.height&&(l=s(n.height-d));e.next={x:c,y:d,w:h,h:l}}const c=this.host.slotEl(e.widgetId);c&&(c.style.transform=`translate3d(${e.next.x}px, ${e.next.y}px, 0)`,"resize"===e.kind&&(c.style.width=`${e.next.w}px`,c.style.height=`${e.next.h}px`)),this.updateBadgeText(e.next)}finishDrag(t){const e=this.drag,i=this.host.config();if(this.drag=null,!e||!i)return;if(t||!e.moved)return this.syncSlotStyle(e.widgetId,e.orig),void this.host.requestUpdate();let{x:s,y:o}=e.next;if("move"===e.kind&&i.grid.snap_position){const t=he(i.grid);s=be(de(s,t.x),0,Math.max(0,i.design_size.width-e.next.w)),o=be(de(o,t.y),0,Math.max(0,i.design_size.height-e.next.h))}const r={x:we(s),y:we(o),w:e.next.w,h:e.next.h};this.syncSlotStyle(e.widgetId,r),this.updateBadgeText(r),this.pushUndo(),this.updateWidget(e.widgetId,r,{undo:!1})}syncSlotStyle(t,e){const i=this.host.slotEl(t);i&&(i.style.transform=`translate3d(${e.x}px, ${e.y}px, 0)`,i.style.width=`${e.w}px`,i.style.height=`${e.h}px`)}updateBadgeText(t){const e=this.host.badgeEl();e&&(e.textContent=`x ${Math.round(t.x)}  y ${Math.round(t.y)}  ·  ${t.w}×${t.h}`)}onViewPointerDown(t){if(this.session?.active||t.button>0)return;const e=t.composedPath();for(const t of e)if(t instanceof HTMLElement){if(t.classList?.contains("widget-slot"))return;if(t.classList?.contains("pencil"))return}this.lpStart={x:t.clientX,y:t.clientY},this.lpTimer=window.setTimeout(()=>{this.lpTimer=void 0,this.enter()},800)}onViewPointerMove(t){void 0!==this.lpTimer&&this.lpStart&&Math.hypot(t.clientX-this.lpStart.x,t.clientY-this.lpStart.y)>18&&this.cancelLongPress()}cancelLongPress(){void 0!==this.lpTimer&&clearTimeout(this.lpTimer),this.lpTimer=void 0,this.lpStart=null}}function be(t,e,i){return Math.min(i,Math.max(e,t))}function we(t){return Math.round(100*t)/100}function $e(t){if(t&&"object"==typeof t){const e=t,i="string"==typeof e.message&&e.message?e.message:void 0;if("not_found"===e.code)return`${i??"Remote not found"} — it was removed or never existed. Open the card editor and pick another remote.`;if(i)return i;if(t instanceof Error)return t.message||t.name;try{return JSON.stringify(t)}catch{return String(t)}}return String(t)}const xe={turn_on:"Turn on",turn_off:"Turn off",toggle:"Toggle",open_cover:"Open",close_cover:"Close",stop_cover:"Stop",open_cover_tilt:"Tilt open",close_cover_tilt:"Tilt close",lock:"Lock",unlock:"Unlock",press:"Press",start:"Start",pause:"Pause",stop:"Stop",return_to_base:"Dock",media_play:"Play",media_pause:"Pause",media_play_pause:"Play / pause",media_stop:"Stop",media_next_track:"Next track",media_previous_track:"Previous track",volume_up:"Volume up",volume_down:"Volume down",volume_mute:"Mute",increment:"Increment",decrement:"Decrement",set_value:"Set",set_temperature:"Set temperature",set_hvac_mode:"Set mode",set_preset_mode:"Set preset",trigger:"Trigger",reload:"Reload",notify:"Notify",send_message:"Send message"},ke=[["if","Conditional"],["choose","Choose"],["repeat","Repeat"],["parallel","Parallel"],["sequence","Sequence"],["wait_template","Wait"],["wait_for_trigger","Wait"],["delay","Delay"],["event","Fire event"],["variables","Variables"],["stop","Stop"]],Ae=t=>t.replace(/_/g," ").replace(/^\w/,t=>t.toUpperCase()),Ee=t=>Array.isArray(t)?t.filter(t=>"string"==typeof t):"string"==typeof t?[t]:[];function Se(t,e){const i=e?.states?.[t]?.attributes?.friendly_name;return"string"==typeof i&&i?i:t}function Te(t,e){if(!t||"object"!=typeof t)return"";const i=t;if("string"==typeof i.alias&&i.alias.trim())return i.alias.trim();if("string"==typeof i.scene)return Se(i.scene,e);for(const[t,e]of ke)if(t in i)return e;const s=i.action??i.service;if("string"!=typeof s)return Ae(Object.keys(i)[0]??"");const[o,r=""]=s.split("."),n=function(t,e){const i=t.target??{},s=[...Ee(i.entity_id??t.entity_id??t.data?.entity_id).map(t=>Se(t,e)),...Ee(i.area_id).map(t=>e?.areas?.[t]?.name||t),...Ee(i.floor_id).map(t=>e?.floors?.[t]?.name||t),...Ee(i.device_id).map(t=>e?.devices?.[t]?.name_by_user||e?.devices?.[t]?.name||t)];return s.length?1===s.length?s[0]:`${s[0]} +${s.length-1}`:""}(i,e);if("scene"===o&&"turn_on"===r)return n||"Scene";if("script"===o)return"turn_on"===r?n||"Script":Se(s,e);if("select_option"===r){const t=i.data?.option??i.option;return"string"==typeof t&&t?n?`${t} · ${n}`:t:n?`Select · ${n}`:"Select option"}const a=xe[r]??Ae(r);if(n)return`${a} ${n}`;if(r in xe)return a;const c=t=>t.replace(/_/g," ");return"notify"===o?`Notify ${c(r)}`:`${a} ${c(o)}`}function Me(t,e){if(!t.length)return"";const i=Te(t[0],e);return t.length>1?`${i} +${t.length-1}`:i}let ze=!1;async function Ce(){try{const t=await(window.caches?.keys());await Promise.all((t??[]).map(t=>window.caches.delete(t)))}catch{}window.location.reload()}const Ie="remote-mapper-card",Oe=20,De=new Set(["new_scene","new_automation","new_remote_automation"]);function Pe(t){const e=Math.max(1,t.length),i=Math.max(2,Math.ceil(Math.sqrt(e))),s=Math.ceil(e/i);return{schema_version:1,design_size:{width:Math.max(380,120*i+Oe),height:80*s+Oe},grid:{cell:10,snap_position:!1},widgets:t.map((t,e)=>({id:t,kind:"slot",x:Oe+e%i*120,y:Oe+80*Math.floor(e/i),w:100,h:60,z:e+1}))}}function Le(t,e,i){const s=t=>[{action:t,target:{entity_id:e}}];return"scene"===t?s("scene.turn_on"):"toggle"===t?s("homeassistant.toggle"):"wled_preset"===t?[{action:"select.select_option",target:{entity_id:e},data:{option:i}}]:s("script.turn_on")}let Re=class extends at{constructor(){super(...arguments),this._hostWidth=0,this.preview=!1,this._tipsRev=0,this._onTipsReset=()=>{this._tipsRev++},this._gridEditing=!1,this._pickerOpen=!1,this._tipShown=!1,this._modalOpenedAt=0,this._ghostGuard={handleEvent:t=>{Date.now()-this._modalOpenedAt<350&&(t.stopPropagation(),t.preventDefault())},capture:!0},this._editorTab="quick",this._quickMode="scene",this._quickEntity="",this._quickOption="",this._snapEntities=[],this._snapRemember=!1,this._draft="",this._draftName="",this._yamlValid=!0,this._draftMaterialized=!1,this._haFormOk=!1,this._yamlEditorOk=!1,this._clearRemember=!1,this._moveOpen=!1,this._moveTarget="",this._releaseOpen=!1,this._releaseConvert=!0,this._releaseBusy=!1,this._importSelected=new Set,this._importOverwrite=!1,this._importBusy=!1,this._fetchStarted=!1,this._edit=new ye(this),this._enterGridEdit=()=>{this._remote&&(this._setGridDraft(xt(this._remote.grid_layout,this._remote.buttons??[])),this._gridEditing=!0,this._refreshActions(!0))},this._cancelGridEdit=()=>{var t;this._gridEditing=!1,this._gridDraft=void 0,(t=this._entryId)&&oe.delete(t),this._pickerOpen=!1,this._buttonSheet=void 0},this._onGridPicked=t=>{const e=this._gridDraft;var i,s,o,r;e&&this._remote&&(this._setGridDraft((i=e,s=t.detail.rows,o=t.detail.cols,r=this._remote.buttons??[],xt({...i,rows:s,cols:o},r))),this._pickerOpen=!1)},this._openImport=async()=>{this._importError=void 0,this._importOverwrite=!1,this._importBusy=!1;try{const t=await this._hass.callWS({type:"remote_mapper/scan_import",entry_id:this._entryId});this._importSelected=new Set(t.proposals.flatMap((t,e)=>t.conflict?[]:[e])),this._importScan=t}catch(t){this._error=$e(t)}},this._enterEdit=()=>{this._edit.enter();const t=this._remote?.layout?.actions??[],e=this._currentLayout();if(e){const i=new Map(e.widgets.map(t=>[t.id,t]));this._edit.ensureTiles(t=>i.get(t)??Pe([t]).widgets[0],t)}}}_backdropClick(t){return e=>{e.target===e.currentTarget&&(Date.now()-this._modalOpenedAt<350||t())}}set hass(t){const e=!1===this._hass?.connected&&!0===t.connected;this._hass=t,e&&this._fetchStarted&&this._remote&&this._fetchRemote(),void 0!==this._buttonSheet&&this.requestUpdate(),!this._fetchStarted&&this._config&&(this._fetchStarted=!0,this._initialize())}setConfig(t){this._config&&t.entry_id!==this._config.entry_id&&this._cancelGridEdit(),this._config=t,this._entryId=t.entry_id,this._fetchStarted=!1,this._hass&&(this._fetchStarted=!0,this._initialize())}getCardSize(){if(this._isGrid()){const t=this._gridLayout(),e="all"===Ht(this._config)?2:1;return t?1+t.rows*e:3}const t=this._currentLayout();return t?1+Math.ceil(t.design_size.height/100):3}getGridOptions(){return{columns:12,min_columns:6}}static getConfigElement(){return document.createElement("remote-mapper-card-editor")}static getStubConfig(){return{layout:"grid",display:"assisted"}}connectedCallback(){super.connectedCallback(),this._resizeObserver=new ResizeObserver(t=>{const e=t[0]?.contentRect.width??0;e&&Math.abs(e-this._hostWidth)>.5&&(this._hostWidth=e)}),this._resizeObserver.observe(this),window.addEventListener(Ot,this._onTipsReset),this._edit.tryResume()&&this.requestUpdate(),this._fetchStarted&&!this._unsubEvents&&this._subscribe()}disconnectedCallback(){super.disconnectedCallback(),this._resizeObserver?.disconnect(),window.removeEventListener(Ot,this._onTipsReset),this._unsubEvents?.(),this._unsubEvents=void 0,this._unsubActions?.(),this._unsubActions=void 0,this._edit.detach(),clearTimeout(this._tipTimer),clearTimeout(this._tipHideTimer),this._tip=void 0}async _initialize(){try{if(!this._entryId){const t=await this._hass.callWS({type:"remote_mapper/list_remotes"});if(1!==t.remotes.length)return void(this._remoteChoices=t.remotes);this._entryId=t.remotes[0].entry_id}await this._fetchRemote(),this._resumeGridEdit(),await this._subscribe()}catch(t){this._error=$e(t)}}async _subscribe(){this._unsubEvents||(this._unsubEvents=await this._hass.connection.subscribeEvents(t=>{t.data.entry_id===this._entryId&&this._fetchRemote()},"remote_mapper_updated"),this._unsubActions=await this._hass.connection.subscribeEvents(t=>{t.data.entry_id===this._entryId&&this._flashAction(t.data.action_id)},"remote_mapper_action"))}_flashAction(t){this._flash=t,void 0!==this._flashTimer&&clearTimeout(this._flashTimer),this._flashTimer=setTimeout(()=>{this._flashTimer=void 0,this._flash=void 0},400)}async _fetchRemote(){try{this._remote=await this._hass.callWS({type:"remote_mapper/get_remote",entry_id:this._entryId}),this._error=void 0}catch(t){this._error=$e(t)}}config(){return this._currentLayout()}scale(){return this._transform()?.scale??1}slotEl(t){return this.shadowRoot?.querySelector(`[data-slot-id="${CSS.escape(t)}"]`)??null}badgeEl(){return this.shadowRoot?.querySelector(".badge")??null}async saveWorking(t){const e=this._currentLayout();if(!e)return!1;try{return await this._hass.callWS({type:"remote_mapper/save_layout",entry_id:this._entryId,card_layout:{...fe(e),widgets:t}}),!0}catch(t){return this.notify(`Layout save failed: ${String(t)}`),!1}}openSettings(t){this._openEditor(t)}_navigate(t){window.history.pushState(null,"",t),window.dispatchEvent(new CustomEvent("location-changed",{detail:{replace:!1}}))}_automationEditPath(t){return t?.materialized&&t.automation_id?`/config/automation/edit/${t.automation_id}`:void 0}_targetEditor(t){const e=(t?.sequence?.length?t.sequence:t?.live_actions??[])[0];if(!e)return;const i=e.action??e.service;let s=e.target?.entity_id??e.entity_id??e.scene;if(Array.isArray(s)&&(s=s[0]),"string"!=typeof s)return;const o=this._hass?.states?.[s]?.attributes?.friendly_name??s;if(s.startsWith("scene.")&&("scene.turn_on"===i||e.scene)){const t=this._hass?.states?.[s]?.attributes?.id;if("string"!=typeof t)return;return{icon:"mdi:palette",title:`Edit scene: ${o}`,path:`/config/scene/edit/${t}`}}if(s.startsWith("script.")&&("script.turn_on"===i||i===s))return{icon:"mdi:script-text",title:`Edit script: ${o}`,path:`/config/script/edit/${s.slice(7)}`};if("string"==typeof i&&i.startsWith("script.")&&"script.turn_on"!==i){const t=i.slice(7);return{icon:"mdi:script-text",title:`Edit script: ${this._hass?.states?.[i]?.attributes?.friendly_name??t}`,path:`/config/script/edit/${t}`}}}_importedSources(t){const e=t?.imported_from;if(!e)return[];return(e.sources?.length?e.sources:[e]).filter(t=>!!t.config_id)}async _confirm(t){try{const e=await _t();if(e?.showConfirmationDialog)return!!await e.showConfirmationDialog(this,{title:t.title,text:t.text,confirmText:t.confirmText,dismissText:"Cancel",destructive:t.destructive})}catch{}return window.confirm(`${t.title}\n\n${t.text}`)}notify(t){window.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:t}}))}_currentLayout(){if(!this._remote)return;const t=this._remote.layout?.actions??[],e=this._remote.card_layout,i=e&&Array.isArray(e.widgets)&&e.design_size?e:Pe(t),s=new Set(i.widgets.map(t=>t.id)),o=t.filter(t=>!s.has(t));if(!o.length)return{...i,canvas_id:this._entryId};const r=Pe(o).widgets.map((t,e)=>({...t,y:i.design_size.height+Oe+80*Math.floor(e/3)}));return{...i,canvas_id:this._entryId,design_size:{width:i.design_size.width,height:i.design_size.height+80*(Math.floor((r.length-1)/3)+1)+Oe},widgets:[...i.widgets,...r]}}_transform(){const t=this._currentLayout();if(!t)return;const e=this._hostWidth||this.getBoundingClientRect().width||300;return function(t,e){{const i=Math.max(1,e)/t.width;return{scale:i,offsetX:0,offsetY:0,viewportHeight:t.height*i}}}(t.design_size,e)}_renderTitle(){return!1===this._config?.show_title?j`<span class="title"></span>`:j`<span class="title">${this._config?.title||this._remote?.title}</span>`}_isGrid(){return"grid"===Nt(this._config)}_gridLayout(){if(this._remote)return this._gridEditing&&this._gridDraft?this._gridDraft:xt(this._remote.grid_layout,this._remote.buttons??[])}_slotViews(){const t={};if(!this._remote)return t;const e=new Set(this._remote.stale_actions??[]);for(const i of this._remote.buttons??[])for(const s of i.actions){const i=this._remote.slots[s.action_id];t[s.action_id]={assigned:!!i,archived:!!i?.archived||"off"===this._automationState(i),summary:this._slotSummary(i),error:i?.branch_missing?"The automation has no branch for this event any more — edit the slot to re-add it":i?.last_error??null,stale:e.has(s.action_id),linked:this._isLinked(i)}}return t}async _refreshActions(t=!1){try{const e=await this._hass.callWS({type:"remote_mapper/refresh_actions",entry_id:this._entryId});e.added.length?(this.notify(`Found new actions: ${e.added.join(", ")}`),this._gridEditing&&this._remote&&(await this._fetchRemote(),this._setGridDraft(xt(this._gridDraft,this._remote.buttons??[])))):t||this.notify(e.probed?"No new actions — press each button once (all press types), then refresh again":"This source can't enumerate actions")}catch(t){this.notify(`Refresh failed: ${String(t)}`)}}_setGridDraft(t){this._gridDraft=t,function(t,e){t&&oe.set(t,e)}(this._entryId,t)}_resumeGridEdit(){const t=(e=this._entryId)?oe.get(e):void 0;var e;t&&this._remote&&!this._gridEditing&&(this._gridDraft=xt(t,this._remote.buttons??[]),this._gridEditing=!0)}async _discardGridEdit(){const t=this._remote?xt(this._remote.grid_layout,this._remote.buttons??[]):void 0;!!this._gridDraft&&JSON.stringify(this._gridDraft)!==JSON.stringify(t)&&!await this._confirmDiscardLayout()||this._cancelGridEdit()}async _discardCanvasEdit(){this._edit.dirty&&!await this._confirmDiscardLayout()||this._edit.cancel(!0)}_confirmDiscardLayout(){return this._confirm({title:"Discard layout changes?",text:"Button names, positions and grid size go back to the last saved layout. Event edits made in this session are already saved and stay.",confirmText:"Discard",destructive:!0})}async _saveGridEdit(){const t=this._gridDraft;if(t)try{await this._hass.callWS({type:"remote_mapper/save_layout",entry_id:this._entryId,grid_layout:At(t)}),this._cancelGridEdit()}catch(t){this.notify(`Layout save failed: ${String(t)}`)}else this._cancelGridEdit()}async _runSlot(t){const e=this._remote?.slots[t];if(e&&!e.archived){this._flashAction(t);try{await this._hass.callWS({type:"remote_mapper/run_slot",entry_id:this._entryId,action_id:t})}catch(t){this._error=$e(t)}}}_isLinked(t){return!!t?.materialized&&!!t.automation_id&&!1===t.owned}_automationState(t){const e=t?.automation_entity_id;return e?this._hass?.states?.[e]?.state:void 0}_slotSummary(t){if(!t)return"not set";if(t.name)return t.name;if(t.materialized&&t.branch_missing)return"no branch";if(t.materialized&&t.shared_automation)return Me(t.live_actions??[],this._hass)||"empty branch";if(t.materialized){const e=t.automation_entity_id,i=e?this._hass?.states?.[e]?.attributes?.friendly_name:void 0,s="string"==typeof i&&i?i:"";return t.branch&&t.branch_alias?t.branch_alias:this._isLinked(t)&&s&&!t.branch?s:Me(t.live_actions??[],this._hass)||s||"automation"}return Me(t.sequence??[],this._hass)||"empty"}async _openEditor(t){const e=this._remote?.slots[t],i=e?.sequence??[],s=function(t){if(1===t.length&&"object"==typeof t[0]&&t[0]){const e=t[0],i=e.action??e.service,s=e.target?.entity_id??e.entity_id;if("string"==typeof s){if("scene.turn_on"===i)return{mode:"scene",entity:s,option:""};if("homeassistant.toggle"===i)return{mode:"toggle",entity:s,option:""};if("script.turn_on"===i)return{mode:"script",entity:s,option:""};if("select.select_option"===i)return{mode:"wled_preset",entity:s,option:e.data?.option??e.option??""}}}return{mode:"custom",entity:"",option:""}}(i);this._editingAction=t,this._modalOpenedAt=Date.now(),this._quickMode="custom"===s.mode?"scene":s.mode,this._quickEntity=s.entity,this._isLinked(e)&&(this._quickMode="link",this._quickEntity=e?.automation_entity_id??""),this._quickOption=s.option,this._snapEntities=[...this._remote?.snapshot_entities??[]],this._snapRemember=!1,this._editorTab="custom"===s.mode&&i.length?"yaml":"quick",this._draft=JSON.stringify(i,null,2),this._draftName=e?.name??"",this._yamlValue=i,this._yamlValid=!0,this._draftError=void 0,this._draftMaterialized=e?.materialized??!1,this._editingLive=void 0,this._moveOpen=!1,this._moveTarget="",gt().then(t=>{this._haFormOk=t}),(customElements.get("ha-yaml-editor")?Promise.resolve(!0):(ft||(ft=(async()=>{try{const t=await _t(),e=t?.createCardElement?.({type:"conditional",conditions:[],card:{type:"entities",entities:[]}});await(e?.constructor?.getConfigElement?.())}catch{}if(customElements.get("ha-yaml-editor"))return!0;await new Promise(t=>setTimeout(t,300));const t=!!customElements.get("ha-yaml-editor");return t||(ft=null),t})()),ft)).then(t=>{this._yamlEditorOk=t}),e?.materialized&&this._hass.callWS({type:"remote_mapper/get_slot",entry_id:this._entryId,action_id:t}).then(i=>{this._editingAction===t&&i.live&&(this._editingLive=i.live,this._yamlValue=i.live.actions??[],this._draft=JSON.stringify(i.live.actions??[],null,2),this._isLinked(e)||(this._editorTab="yaml"))})}_parseDraftOrNull(){try{const t=JSON.parse(this._draft);return Array.isArray(t)?t:null}catch{return null}}_closeEditor(){this._editingAction=void 0,this._draftError=void 0,this._editingLive=void 0,this._clearArtifacts=void 0,this._moveOpen=!1}async _moveSlot(){const t=this._editingAction,e=this._moveTarget;if(t&&e)try{await this._performMove(t,e),this._closeEditor()}catch(t){this._draftError=t.message??String(t)}else this._draftError="Pick an event to move to"}async _onMoveAction(t,e){const i=this._remote?.slots[e];if(i){if(!await this._confirm({title:"Swap these two events?",text:`"${this._slotSummary(this._remote?.slots[t])}" goes to ${this._eventName(e)} and "${this._slotSummary(i)}" to ${this._eventName(t)}. This is saved right away.`,confirmText:"Swap"}))return}try{await this._performMove(t,e)}catch(t){this.notify(`Move failed: ${t.message??String(t)}`)}}async _performMove(t,e){const i=await this._hass.callWS({type:"remote_mapper/move_slot",entry_id:this._entryId,action_id:t,target_action_id:e});this.notify(i.swapped?`Swapped ${this._eventName(t)} and ${this._eventName(e)}`:`Moved ${this._eventName(t)} to ${this._eventName(e)}`)}async _createNew(){const t=this._draftName.trim()||null;try{if("new_scene"===this._quickMode)return this._snapEntities.length?(await this._hass.callWS({type:"remote_mapper/create_snapshot",entry_id:this._entryId,action_id:this._editingAction,entities:this._snapEntities,remember_entities:this._snapRemember,...t?{name:t}:{}}),void this._closeEditor()):void(this._draftError="Pick at least one entity to capture");const e=await this._hass.callWS({type:"remote_mapper/create_automation",entry_id:this._entryId,action_id:this._editingAction,scope:"new_automation"===this._quickMode?"button":"remote",name:t});this._closeEditor(),this._navigate(e.edit_url)}catch(t){this._draftError=t.message??String(t)}}async _saveDraft(){if("quick"===this._editorTab&&De.has(this._quickMode))return void await this._createNew();const t={type:"remote_mapper/save_slot",entry_id:this._entryId,action_id:this._editingAction,materialized:this._draftMaterialized,name:this._draftName.trim()||null},e=this._isLinked(this._remote?.slots[this._editingAction??""]);if("quick"===this._editorTab&&"link"===this._quickMode&&((i={linked:e,keepLinked:this._draftMaterialized}).linked&&!i.keepLinked));else if("quick"===this._editorTab&&"link"===this._quickMode){if(!this._quickEntity)return void(this._draftError="Pick an automation first");delete t.materialized,t.link_entity_id=this._quickEntity}else if(this._isLinked(this._remote?.slots[this._editingAction??""])&&this._draftMaterialized){const t=function(t){return"quick"===t.tab?"link"===t.quickMode?null:re:JSON.stringify(t.draft??null)===JSON.stringify(t.live)?null:re}({tab:this._editorTab,quickMode:this._quickMode,draft:this._yamlEditorOk?this._yamlValue??[]:this._parseDraftOrNull(),live:this._editingLive?.actions??[]});if(t)return void(this._draftError=t)}else if("quick"===this._editorTab){if(!this._quickEntity)return void(this._draftError="Pick an entity first");if("wled_preset"===this._quickMode&&!this._quickOption)return void(this._draftError="Pick a preset first");t.sequence=Le(this._quickMode,this._quickEntity,this._quickOption)}else if(this._yamlEditorOk){if(!this._yamlValid)return void(this._draftError="YAML is not valid");t.sequence=this._yamlValue??[]}else t.sequence_yaml=this._draft;var i;t.materialized&&Array.isArray(t.sequence)&&(t.auto_name=Me(t.sequence,this._hass)||null);const s=this._editingLive;if(e&&!this._draftMaterialized&&s?.whole){const t=(o=s.alias??s.entity_id??"This automation",r=s.whole.events.map(t=>this._eventName(t)),r.length<2?null:{title:"Move the whole automation into the card?",text:`"${o}" runs ${r.length} events on this remote: ${r.join(", ")}. Each one gets its own copy of its branch, and the automation is turned off in HA (not deleted). Hand back turns it on again.`,confirmText:`Move all ${r.length}`});if(t&&!await this._confirm(t))return}var o,r;try{const e=await this._hass.callWS(t);(e?.absorbed?.length??0)>1&&this.notify(`Moved ${e.absorbed.length} events into the card; "${s?.alias}" is turned off.`),this._closeEditor()}catch(t){this._draftError=t.message??String(t)}}async _confirmClear(){const t=this._remote?.slots[this._editingAction??""],e=this._draftName.trim()||this._editingAction||"this event",i=this._isLinked(t),s=this._importedSources(t).length>0,o=i?`The link from "${e}" to its automation is removed. The automation itself stays in HA, enabled, and keeps firing on its own trigger.`:s?`"${e}" is emptied in this card. The original automation it was imported from stays in HA, still disabled. Importing it again as a link switches it back on, and so does Hand back.`:`"${e}" is emptied in this card. Automations and scenes that existed before this integration are not touched; if the card created any, you are asked next.`;await this._confirm({title:"Clear this event?",text:o,confirmText:"Clear",destructive:!0})&&await this._clearSlot()}async _confirmArchive(){const t=this._remote?.slots[this._editingAction];if(!t)return;if(t.archived)return void await this._toggleArchived();const e=this._draftName.trim()||this._editingAction||"this event",i=this._editingLive,s=this._isLinked(t)?i?.whole?.linked??[]:[],o=await this._confirm(function(t,e){const i=e.linked??[],s=i.length>1?` The automation "${e.alias}" is turned off in HA, so all ${i.length} events linked to it stop: ${i.join(", ")}.`:e.automation?" Its automation is turned off in HA meanwhile.":"";return{title:i.length>1?`Disable ${i.length} events?`:"Disable this event?",text:`"${t}" keeps its setup but stops running until you enable it again.${s} Nothing is deleted.`,confirmText:i.length>1?`Disable all ${i.length}`:"Disable"}}(e,{automation:t.materialized,alias:i?.alias??void 0,linked:s.map(t=>this._eventName(t))}));o&&await this._toggleArchived()}_eventName(t){const e=this._gridLayout();for(const i of this._remote?.buttons??[]){const s=i.actions.find(e=>e.action_id===t);if(s&&e)return`${Et(i,e)} ${s.event}`}return t}async _clearSlot(t){const e=await this._hass.callWS({type:"remote_mapper/clear_slot",entry_id:this._entryId,action_id:this._editingAction,...t?{decision:t,remember:this._clearRemember}:{}});if(e.needs_decision)return this._clearRemember=!1,void(this._clearArtifacts=e.artifacts);this._clearArtifacts=void 0,this._closeEditor()}async _snapshot(t){try{await this._hass.callWS({type:"remote_mapper/create_snapshot",entry_id:this._entryId,action_id:this._editingAction,re_snapshot:t}),this._closeEditor()}catch(t){this._draftError=t.message??String(t)}}async _toggleArchived(){const t=this._remote?.slots[this._editingAction];if(t)try{await this._hass.callWS({type:"remote_mapper/archive_slot",entry_id:this._entryId,action_id:this._editingAction,archived:!t.archived}),this._closeEditor()}catch(t){this._draftError=t.message??String(t)}}_releasePlan(){let t=0,e=0,i=0,s=0;for(const o of Object.values(this._remote?.slots??{}))o.imported_from?t++:this._isLinked(o)?e++:o.materialized?i++:o.sequence?.length&&!o.archived&&s++;return{imported:t,linked:e,materialized:i,built:s}}async _release(){this._releaseBusy=!0;try{const t=await this._hass.callWS({type:"remote_mapper/release_remote",entry_id:this._entryId,convert_remaining:this._releaseConvert});this._releaseOpen=!1,this._cancelGridEdit(),this._edit.cancel(),this.notify(`Handed back: ${t.reenabled.length} original(s) re-enabled, ${t.converted.length} converted, ${t.kept.length} kept, ${t.dropped.length} dropped.`),this._unsubEvents?.(),this._unsubEvents=void 0,this._unsubActions?.(),this._unsubActions=void 0,this._remote=void 0,this._error="This remote was handed back to Home Assistant and removed from Remote Mapper. Delete this card, or pick another remote in the card editor."}catch(t){this.notify(`Hand back failed: ${t.message??String(t)}`)}finally{this._releaseBusy=!1}}_renderRelease(){const t=this._releasePlan(),e=()=>{this._releaseOpen=!1};return j`
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
    `}_closeImport(){this._importScan=void 0}async _applyImport(){const t=this._importScan.proposals.filter((t,e)=>this._importSelected.has(e));if(t.length){this._importBusy=!0;try{await this._hass.callWS({type:"remote_mapper/apply_import",entry_id:this._entryId,proposals:t,overwrite:this._importOverwrite}),this._closeImport()}catch(t){this._importError=t.message??String(t)}finally{this._importBusy=!1}}else this._closeImport()}render(){if(this._error)return j`<ha-card header="Remote Mapper">
        <div class="content error">${this._error}</div>
      </ha-card>`;if(this._remoteChoices)return j`<ha-card header="Remote Mapper">
        <div class="content">
          ${0===this._remoteChoices.length?j`<p class="hint">
                  No remote is set up yet. Add one — pick the device (Zigbee2MQTT,
                  ZHA, Matter, MQTT…), press its buttons once — and this card
                  fills in by itself.
                </p>
                <div class="buttons">
                  <button @click=${()=>this._navigate("/_my_redirect/config_flow_start?domain=remote_mapper")}>
                    Add a remote
                  </button>
                </div>`:j`<p class="hint">
                  Several remotes exist — pick one in the card editor (the
                  <b>Remote</b> dropdown), or set <code>entry_id</code> in YAML:
                </p>
                <ul>
                  ${this._remoteChoices.map(t=>j`<li>${t.title}: <code>${t.entry_id}</code></li>`)}
                </ul>`}
        </div>
      </ha-card>`;if(!this._remote)return j`<ha-card header="Remote Mapper">
        <div class="content">Loading…</div>
      </ha-card>`;if(this._isGrid())return this._renderGridCard();const t=!this.preview&&this._edit.active;return j`
      <ha-card>
        ${this._renderStaleBundle()}
        ${this._renderOnboarding()}
        <div class="header">
          ${this._renderTitle()}
          <span class="header-buttons">
            ${t?j`
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
      </ha-card>
    `}_renderGridCard(){const t=this._remote,e=!this.preview&&this._gridEditing,i=this._gridLayout(),s=t.buttons??[];return j`
      <ha-card>
        ${this._renderStaleBundle()}
        ${this._renderOnboarding()}
        <div class="header">
          ${this._renderTitle()}
          <span class="header-buttons">
            ${e?j`
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
        ${this.preview?j`<p class="hint grid-hint">· Edit buttons and events from the dashboard; this preview only shows the card</p>`:Y}
        ${e&&this._pickerOpen?j`<div class="picker-dock">
              <remote-mapper-grid-picker
                .rows=${i.rows}
                .cols=${i.cols}
                .minCells=${s.length}
                @grid-picked=${this._onGridPicked}
              ></remote-mapper-grid-picker>
            </div>`:Y}
        ${e?j`<p class="hint grid-hint">· Tap a button to rename it or edit its events</p>
            <p class="hint grid-hint">· Drag a button onto another cell to swap</p>
            <p class="hint grid-hint">· Drag an event mark onto another event or button to move its action</p>
            <p class="hint grid-hint">· Event edits save right away; ✓ saves the layout, ✕ discards it</p>`:Y}
        ${0===s.length?Y:j`
          <remote-mapper-grid
            style=${function(t){const e=[],i=(t,i)=>{"string"==typeof i&&i.trim()&&e.push(`${t}:${i.trim()}`)};i("--rm-button-bg",t?.button_color),i("--rm-accent",t?.accent_color),i("--rm-text",t?.text_color);const s=t?.button_opacity;return"number"==typeof s&&s>0&&s<1&&e.push(`--rm-opacity:${s}`),e.join(";")}(this._config)}
            .buttons=${s}
            .layout=${i}
            .slots=${this._slotViews()}
            .display=${Ht(this._config)}
            .assistedTrigger=${Ut(this._config)}
            .chipsLayout=${Bt(this._config)}
            .hideUnset=${o=this._config,"all"===Ht(o)&&!0===o?.hide_unset}
            .kindIcons=${Dt(this._config)}
            .editing=${e}
            .flash=${this._flash}
            @run-action=${t=>{this._runSlot(t.detail.actionId)}}
            @open-button=${t=>{this._buttonSheet=t.detail.buttonId,this._modalOpenedAt=Date.now()}}
            @layout-changed=${t=>{this._setGridDraft(t.detail.layout)}}
            @move-action=${t=>{this._onMoveAction(t.detail.actionId,t.detail.targetId)}}
          ></remote-mapper-grid>
            `}
        ${0===s.length?j`<div class="grid-hint">
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
      </ha-card>
    `;var o}_iconButton(t,e,i,s={}){const o=()=>{void 0!==this._tipTimer&&(clearTimeout(this._tipTimer),this._tipTimer=void 0)},r=()=>{o(),this._tip&&this._hideTipIn(1500)};return j`<ha-icon-button
      class=${s.active?"active":""}
      .label=${e}
      title=${e}
      ?disabled=${s.disabled}
      @pointerdown=${t=>{if("mouse"===t.pointerType)return;o(),this._hideTipIn(0),this._tipShown=!1;const i=t.currentTarget;this._tipTimer=setTimeout(()=>{this._tipTimer=void 0,this._tipShown=!0,this._tip=function(t,e,i){const s=e.bottom+6;return(e.left+e.right)/2>i/2?{text:t,top:s,right:Math.max(8,i-e.right)}:{text:t,top:s,left:Math.max(8,e.left)}}(e,i.getBoundingClientRect(),window.innerWidth),this._hideTipIn(4e3)},450)}}
      @pointerup=${r}
      @pointercancel=${r}
      @pointerleave=${r}
      @contextmenu=${t=>{this._tipShown&&t.preventDefault()}}
      @click=${t=>{if(this._tipShown)return t.stopPropagation(),void(this._tipShown=!1);i.call(this,t)}}
    >
      <ha-icon icon=${t}></ha-icon>
    </ha-icon-button>`}_hideTipIn(t){clearTimeout(this._tipHideTimer),this._tipHideTimer=void 0,t<=0?this._tip=void 0:this._tipHideTimer=setTimeout(()=>{this._tipHideTimer=void 0,this._tip=void 0},t)}_renderTip(){const t=this._tip;if(!t)return Y;const e=void 0!==t.right?`right:${t.right}px`:`left:${t.left}px`;return j`<div class="tip" role="tooltip" style="top:${t.top}px;${e}">${t.text}</div>`}_renderButtonSheet(){const t=this._remote,e=this._gridLayout(),i=(t.buttons??[]).find(t=>t.id===this._buttonSheet);if(!i)return j``;const s=this._slotViews(),o=()=>{this._buttonSheet=void 0};return j`
      <div class="modal-backdrop" @click=${this._backdropClick(o)}>
        <div class="modal" @click=${this._ghostGuard}>
          <h3>
            ${Et(i,e)}
            <span class="hint">(${i.id})</span>
          </h3>
          ${this._gridEditing?j`<label class="hint row">
                Label
                <input
                  class="label-input"
                  type="text"
                  .value=${e.buttons[i.id]?.label??""}
                  placeholder=${i.id}
                  @input=${t=>{this._gridDraft&&this._setGridDraft(function(t,e,i){const s=t.buttons[e];if(!s)return t;const{label:o,...r}=s;return{...t,buttons:{...t.buttons,[e]:i.trim()?{...r,label:i}:r}}}(this._gridDraft,i.id,t.target.value))}}
                />
              </label>`:Y}
          <ul class="event-list">
            ${i.actions.map(e=>{const i=s[e.action_id];return j`
                <li class=${i?.assigned?"on":""}>
                  <span class="ev-main">
                    <span class="ev-icon" title=${wt[e.kind]}
                      >${ie(Dt(this._config)[e.kind])}</span
                    >
                    <span class="ev-name">${e.event}</span>
                    <span class="ev-summary">${i?.summary??"not set"}</span>
                  </span>
                  <span class="ev-actions">
                  ${this._iconButton("mdi:play","Run now",()=>{this._runSlot(e.action_id)},{disabled:!i?.assigned||!!i.archived})}
                  ${(()=>{const i=this._targetEditor(t.slots[e.action_id]);return i?this._iconButton(i.icon,i.title,()=>this._navigate(i.path)):Y})()}
                  ${(()=>{const i=t.slots[e.action_id],s=this._automationEditPath(i),o=[];if(s){const t="off"===this._automationState(i),e=this._isLinked(i),r=i?.shared_automation?"Remote automation (this event's branch)":e?"Linked automation":"Automation";o.push(this._iconButton(t?"mdi:robot-off":"mdi:robot",`${r}${t?" (DISABLED)":""} — open in HA's editor`,()=>this._navigate(s),{active:!t&&(e||!!i?.shared_automation)}))}return o.push(...this._importedSources(i).map(t=>{const e=!!t.entity_id&&"on"===this._hass?.states?.[t.entity_id]?.state,i=t.entity_id??t.config_id;return this._iconButton(e?"mdi:robot":"mdi:robot-off",e?`Imported original is ENABLED — it also runs on this press: ${i}`:`Open the imported original (disabled): ${i}`,()=>this._navigate(`/config/automation/edit/${t.config_id}`),{active:e})})),o})()}
                  ${this._iconButton("mdi:pencil","Edit",()=>{this._openEditor(e.action_id)})}
                  </span>
                </li>
              `})}
          </ul>
          <div class="buttons">
            <button @click=${o}>Close</button>
          </div>
        </div>
      </div>
    `}_renderCanvas(t){const e=this._currentLayout(),i=this._transform(),s=t?this._edit.working:e.widgets,o=this._edit.selectedId;return j`
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
          ${s.map(e=>this._renderTile(e,t,e.id===o))}
        </div>
        ${t&&this._edit.selected?this._renderChipbar(this._edit.selected,i):Y}
      </div>
      ${t?this._renderDpad():Y}
    `}_renderTile(t,e,i){const s=this._remote.slots[t.id],o=["widget-slot","tile",s?"assigned":"empty",s?.archived?"archived":"",this._flash===t.id?"flash":"",i?"selected":""].join(" ");return j`
      <div
        class=${o}
        data-slot-id=${t.id}
        style="transform:translate3d(${t.x}px, ${t.y}px, 0);width:${t.w}px;height:${t.h}px;z-index:${t.z??1}"
        @pointerdown=${i=>{e&&this._edit.onSlotPointerDown(i,t.id)}}
        @click=${()=>{e||this._runSlot(t.id)}}
        @dblclick=${()=>{e&&this.openSettings(t.id)}}
      >
        <span class="action">${t.id}</span>
        <span class="summary">${this._slotSummary(s)}</span>
        ${s?.last_error?j`<span class="tile-badge error-badge" title=${s.last_error}
              >!</span
            >`:Y}
        ${s?.archived?j`<span class="tile-badge">disabled</span>`:Y}
        ${this._remote.stale_actions?.includes(t.id)?j`<span
              class="tile-badge warn"
              title="The source no longer reports this action (renamed upstream?)"
              >stale</span
            >`:Y}
        ${e&&i?j`${["nw","ne","sw","se"].map(e=>j`
                <span
                  class="handle ${e}"
                  @pointerdown=${i=>this._edit.onHandlePointerDown(i,t.id,e)}
                ></span>
              `)}`:Y}
      </div>
    `}_renderDpad(){const t=this._edit.selected,e=this._edit.dpadSteps,i="fine"===this._edit.dpadMode?"1":e.x===e.y?`${e.x}`:`${e.x}·${e.y}`,s=(t,e)=>i=>{i.preventDefault(),i.stopPropagation(),i.currentTarget.setPointerCapture(i.pointerId),this._edit.dpadPress(t,e)},o=()=>this._edit.dpadRelease();return j`
      <div class="dpad-dock" @pointerdown=${t=>t.stopPropagation()}>
        ${t?j`<div class="badge"></div>`:Y}
        <div class="dpad">
          <span></span>
          <button ?disabled=${!t} @pointerdown=${s(0,-1)}
            @pointerup=${o} @pointercancel=${o}
            @lostpointercapture=${o}>▲</button>
          <span></span>
          <button ?disabled=${!t} @pointerdown=${s(-1,0)}
            @pointerup=${o} @pointercancel=${o}
            @lostpointercapture=${o}>◀</button>
          <button class="step" title="Toggle nudge step (1 unit ↔ grid cell)"
            @click=${()=>this._edit.toggleDpadStep()}>${i}</button>
          <button ?disabled=${!t} @pointerdown=${s(1,0)}
            @pointerup=${o} @pointercancel=${o}
            @lostpointercapture=${o}>▶</button>
          <span></span>
          <button ?disabled=${!t} @pointerdown=${s(0,1)}
            @pointerup=${o} @pointercancel=${o}
            @lostpointercapture=${o}>▼</button>
          <span></span>
        </div>
      </div>
    `}_renderChipbar(t,e){const i=this._hostWidth||300,s=e.offsetX+(t.x+t.w/2)*e.scale,o=e.offsetY+t.y*e.scale,r=o<62,n=r?e.offsetY+(t.y+t.h)*e.scale+6:o-6,a=Math.min(Math.max(s,84),Math.max(84,i-84));return j`
      <div
        class="chipbar"
        style="left:${a}px;top:${n}px;transform:translate(-50%, ${r?"0":"-100%"})"
        @pointerdown=${t=>t.stopPropagation()}
      >
        ${this._iconButton("mdi:cog","Slot settings",()=>this.openSettings(t.id))}
        ${this._iconButton("mdi:arrange-send-backward","Send backward",()=>this._edit.zOp("backward"))}
        ${this._iconButton("mdi:arrange-bring-forward","Bring forward",()=>this._edit.zOp("forward"))}
      </div>
    `}_renderEditor(){const t=this._remote.slots[this._editingAction],e=this._editingLive?.whole,i=e&&e.events.length>1?e.events:void 0;return j`
      <div class="modal-backdrop" @click=${this._backdropClick(this._closeEditor)}>
        <div class="modal" @click=${this._ghostGuard}>
          <h3>${this._editingAction}</h3>
          ${this._editingLive?j`<p class="hint">
                ${!1===this._editingLive.owned?"Linked to":"Backed by"}
                <b>${this._editingLive.alias}</b>
                ${"off"===this._editingLive.state?j`<span class="warn">(disabled)</span>`:Y}
                —
                <button
                  class="link"
                  @click=${()=>this._navigate(this._editingLive.edit_url)}
                >
                  open in HA's automation editor
                </button>.
                ${this._editingLive.branch_missing?j`<span class="warn">It has no branch for this event any more.</span>
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
          ${"quick"===this._editorTab&&De.has(this._quickMode)?Y:j`<label class="hint row">
                <input
                  type="checkbox"
                  .checked=${this._draftMaterialized}
                  ?disabled=${!!e?.blocked&&this._draftMaterialized}
                  @change=${t=>{this._draftMaterialized=t.target.checked}}
                />
                ${!1===this._editingLive?.owned?e?.blocked?"Keep linked to the automation":(e?.events.length??0)>1?"Keep linked to the automation (untick to move the whole automation into the card)":"Keep linked to the automation (untick to absorb into the card)":this._editingLive?.branch?"Keep as a branch of the remote automation (untick to move it into the card)":"Create as automation (editable/traceable in HA)"}
              </label>`}
          ${e?.blocked?j`<p class="hint">
                ${e.foreign?`It can't move into the card or be disabled here: ${e.blocked}, which would stop too.`:`It can't move into the card: ${e.blocked}.`}
                Edit it in HA.
              </p>`:Y}
          ${this._draftError?j`<p class="error">${this._draftError}</p>`:Y}
          <div class="buttons">
            <button @click=${this._saveDraft}>
              ${"quick"===this._editorTab&&"new_scene"===this._quickMode?"📸 Capture":"quick"===this._editorTab&&De.has(this._quickMode)?"Create & open in HA":"Save"}
            </button>
            <button @click=${this._closeEditor}>Cancel</button>
            ${t?.scene_id?j`<button
                  title="Same scene, same entities, new states"
                  @click=${()=>this._snapshot(!0)}
                >
                  Re-snapshot
                </button>`:Y}
            ${t?j`
                  <button
                    title=${this._isLinked(t)?"A linked automation fires on its own trigger; change the trigger in HA":"Move this action to another event or button"}
                    ?disabled=${this._isLinked(t)}
                    @click=${()=>{this._moveOpen=!this._moveOpen,this._draftError=void 0}}
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
    `}_renderMovePanel(t){const e=this._remote,i=this._gridLayout(),s=new Set(Object.keys(e.slots).filter(t=>this._isLinked(e.slots[t]))),o=function(t,e,i,s,o){const r=[...t].sort((t,i)=>{const s=e.buttons[t.id]??{row:1/0,col:1/0},o=e.buttons[i.id]??{row:1/0,col:1/0};return s.row-o.row||s.col-o.col}),n=[];for(const t of r){const r=[];for(const e of t.actions){if(e.action_id===o)continue;const t=i[e.action_id];r.push({actionId:e.action_id,event:e.event,swapWith:t?.assigned?t.summary:void 0,linked:s.has(e.action_id)})}r.length&&n.push({buttonId:t.id,label:Et(t,e),targets:r})}return n}(e.buttons??[],i,this._slotViews(),s,this._editingAction),r=o.flatMap(t=>t.targets).find(t=>t.actionId===this._moveTarget),n=t.materialized&&!t.shared_automation&&!this._isLinked(t);return j`
      <div class="decision move">
        <p><b>Move to another event</b></p>
        <p class="hint">
          The action, its name and its scene go with it. A set event swaps its
          action with this one.${n?" The automation the card created is made again for the new event (its traces start over).":t.shared_automation?" Its branch of the remote automation is re-keyed to the new event.":""}
        </p>
        <select
          class="move-target"
          .value=${this._moveTarget}
          @change=${t=>{this._moveTarget=t.target.value}}
        >
          <option value="" ?selected=${!this._moveTarget}>Pick an event…</option>
          ${o.map(t=>j`<optgroup label=${t.label}>
              ${t.targets.map(t=>{return j`<option
                  value=${t.actionId}
                  ?disabled=${t.linked}
                  ?selected=${t.actionId===this._moveTarget}
                >
                  ${e=t,e.linked?`${e.event} — linked, can't swap`:e.swapWith?`${e.event} — swap with "${e.swapWith}"`:e.event}
                </option>`;var e})}
            </optgroup>`)}
        </select>
        <div class="buttons">
          <button ?disabled=${!r} @click=${()=>{this._moveSlot()}}>
            ${r?.swapWith?"Swap":"Move"}
          </button>
          <button
            @click=${()=>{this._moveOpen=!1}}
          >
            Cancel
          </button>
        </div>
      </div>
    `}_renderStaleBundle(){const t=this._remote?.version,e=ae(ne,t);return"current"!==e&&t?"ahead"===e?j`
        <div class="stale">
          This tab runs the v${ne} card but Home Assistant still runs
          Remote Mapper v${t}. Restart Home Assistant to finish the update.
        </div>
      `:(this._offerReloadDialog(t),j`
      <div class="stale">
        Remote Mapper was updated to v${t}; this tab still runs the
        v${ne} card.
        <button @click=${()=>{Ce()}}>Reload</button>
      </div>
    `):Y}_renderOnboarding(){if(this.preview)return Y;this._tipsRev;const t=function(t){const e=Ct(t);return e<Tt.length?{index:e,text:Tt[e]}:void 0}();return t?j`
      <div class="tipbar">
        <span class="tipbar-text"
          ><b>Tip ${t.index+1}/${Tt.length}</b> ${t.text}</span
        >
        <span class="tipbar-buttons">
          <button
            @click=${()=>{!function(t=zt()){It(Math.min(Ct(t)+1,Tt.length),t)}(),this._tipsRev++}}
          >
            ${t.index+1<Tt.length?"Next":"Got it"}
          </button>
          ${t.index+1<Tt.length?j`<button
                class="quiet"
                @click=${()=>{!function(t=zt()){It(Tt.length,t)}(),this._tipsRev++}}
              >
                Skip
              </button>`:Y}
        </span>
      </div>
    `:Y}async _offerReloadDialog(t){if(!ze){ze=!0;try{const e=await _t();await(e?.showConfirmationDialog?.(this,{title:"Reload",text:`Remote Mapper was updated to v${t}, but this page still runs the v${ne} card. Reload the page to use the new version?`,confirmText:"Reload",dismissText:"Later"}))&&await Ce()}catch{}}}_autoNamePlaceholder(){let t=[];if("quick"===this._editorTab&&De.has(this._quickMode))return"new_scene"===this._quickMode?`Auto: ${this._remote?.title??"Remote"} ${this._editingAction??""}`:"Auto (from the automation)";if("quick"===this._editorTab&&"link"===this._quickMode){const t=this._quickEntity?this._hass?.states?.[this._quickEntity]?.attributes?.friendly_name:void 0;return"string"==typeof t&&t?`Auto: ${t}`:"Auto (the automation's name)"}if("quick"===this._editorTab&&this._quickEntity)t=Le(this._quickMode,this._quickEntity,this._quickOption);else if(this._yamlEditorOk)t=this._yamlValue??[];else try{t=JSON.parse(this._draft||"[]")}catch{t=[]}const e=Me(t,this._hass);return e?`Auto: ${e}`:"Auto (from the action)"}_renderQuickTab(){if(!this._haFormOk)return j`<p class="hint">
        Loading HA editor components… If this persists, use the YAML tab.
      </p>`;const t=this._remote?.slots[this._editingAction??""],e=!!this._remote?.remote_automation,i=[{value:"new_scene",label:"＋ Scene from current state"},{value:"new_automation",label:"＋ Automation for this button (fill in HA)"}];e?t?.shared_automation&&!t.branch_missing||i.push({value:"new_remote_automation",label:"＋ Add this button to the remote automation"}):i.push({value:"new_remote_automation",label:"＋ Automation for the whole remote (one branch per event)"});const s=[{name:"mode",selector:{select:{mode:"dropdown",options:[...i,{value:"scene",label:"Activate scene"},{value:"toggle",label:"Toggle entity"},{value:"script",label:"Run script"},{value:"wled_preset",label:"Set WLED preset"},{value:"link",label:"Link existing automation (stays native)"}]}}}];let o;if("new_scene"===this._quickMode?(s.push({name:"entities",selector:{entity:{multiple:!0}}}),s.push({name:"remember",selector:{boolean:{}}}),o="Set the room the way you like it first. Capture stores the current state of these entities as a scene bound to this event; Re-snapshot later updates it in place."):"new_automation"===this._quickMode?o="Creates an automation with this event as its trigger and no actions, then opens HA's editor so you can fill it in. The card shows what you put there.":"new_remote_automation"===this._quickMode&&(o=e?"Appends a trigger and an empty branch for this event to the remote's automation, then opens it in HA's editor.":"Creates one automation for this remote: a trigger per event and a choose block with one branch per event (the blueprint look). Buttons you already built in the card move into their branch; buttons with their own automation stay as they are."),"link"===this._quickMode)s.push({name:"entity",selector:{entity:{domain:"automation"}}});else if("wled_preset"===this._quickMode){s.push({name:"entity",selector:{entity:{domain:"select",integration:"wled"}}});const t=this._quickEntity?this._hass?.states?.[this._quickEntity]:void 0,e=t?.attributes?.options??[];s.push({name:"option",selector:e.length?{select:{mode:"dropdown",custom_value:!0,options:e}}:{text:{}}})}else if(!De.has(this._quickMode)){const t="scene"===this._quickMode?"scene":"script"===this._quickMode?"script":void 0;s.push({name:"entity",selector:{entity:t?{domain:t}:{}}})}const r={mode:"Action",option:"Preset",entities:"Entities to capture",remember:"Remember these as this remote's default",entity:"link"===this._quickMode?"Automation":"Entity"};return j`
      <ha-form
        .hass=${this._hass}
        .data=${{mode:this._quickMode,entity:this._quickEntity,option:this._quickOption,entities:this._snapEntities,remember:this._snapRemember}}
        .schema=${s}
        .computeLabel=${t=>r[t.name]??t.name}
        @value-changed=${t=>{const e=t.detail.value;e.mode!==this._quickMode?(this._quickMode=e.mode,this._quickEntity="",this._quickOption=""):De.has(this._quickMode)?(this._snapEntities=e.entities??[],this._snapRemember=!!e.remember):e.entity!==this._quickEntity?(this._quickEntity=e.entity??"",this._quickOption=""):(this._quickEntity=e.entity??"",this._quickOption=e.option??"")}}
      ></ha-form>
      ${o?j`<p class="hint">${o}</p>`:Y}
    `}_renderYamlTab(){return this._yamlEditorOk?j`
        <ha-yaml-editor
          .hass=${this._hass}
          .defaultValue=${this._yamlValue??[]}
          @value-changed=${t=>{const e=t.detail;this._yamlValid=!1!==e.isValid,this._yamlValid&&(this._yamlValue=e.value??[])}}
        ></ha-yaml-editor>
        ${this._yamlValid?Y:j`<p class="error">Invalid YAML</p>`}
      `:j`
      <p class="hint">Sequence (YAML or JSON) — same as automation actions.</p>
      <textarea
        .value=${this._draft}
        spellcheck="false"
        @input=${t=>{this._draft=t.target.value}}
      ></textarea>
    `}_renderClearDialog(){const t=this._clearArtifacts,e=[];return t.scene&&e.push(`scene ${t.scene.entity_id??""}`),t.automation&&e.push("its automation"),j`
      <div class="decision">
        <p><b>Also delete ${e.join(" and ")}?</b></p>
        <label class="hint">
          <input
            type="checkbox"
            .checked=${this._clearRemember}
            @change=${t=>{this._clearRemember=t.target.checked}}
          />
          Remember my choice
        </label>
        <div class="buttons">
          <button class="danger" @click=${()=>this._clearSlot("delete")}>
            Delete
          </button>
          <button @click=${()=>this._clearSlot("keep")}>Keep</button>
          <button
            @click=${()=>{this._clearArtifacts=void 0}}
          >
            Cancel
          </button>
        </div>
      </div>
    `}_renderImport(){const t=this._importScan;return j`
      <div class="modal-backdrop" @click=${this._closeImport}>
        <div class="modal" @click=${t=>t.stopPropagation()}>
          <h3>Import automations</h3>
          ${0===t.proposals.length?j`<p class="hint">No importable automations found.</p>`:j`
                <p class="hint">
                  <b>Link</b> keeps the automation native and enabled — the card
                  shows it and opens it in HA's editor. <b>Absorb</b> copies its
                  actions into the card and disables it (never deletes).
                </p>
                <ul class="import-list">
                  ${t.proposals.map((e,i)=>j`
                      <li>
                        <label>
                          <input
                            type="checkbox"
                            .checked=${this._importSelected.has(i)}
                            @change=${t=>{const e=new Set(this._importSelected);t.target.checked?e.add(i):e.delete(i),this._importSelected=e}}
                          />
                          <b>${e.action_id}</b> ← ${e.alias}
                          ${e.linkable?j`<select
                                class="mode"
                                .value=${e.mode??"link"}
                                @click=${t=>t.stopPropagation()}
                                @change=${e=>{const s=e.target.value,o=t.proposals.map((t,e)=>e===i?{...t,mode:s}:t);this._importScan={...t,proposals:o}}}
                              >
                                <option value="link">link (keep native)</option>
                                <option value="absorb">absorb (copy in, disable)</option>
                              </select>`:j`<span class="hint-inline">absorb</span>`}
                          ${e.conflict?j`<span class="warn">(overwrites slot)</span>`:Y}
                          ${e.mixed?j`<span class="warn"
                                >(mixed remotes — source stays enabled)</span
                              >`:Y}
                          ${e.merged?j`<span class="warn"
                                title="Home Assistant ran all of them on this press; the slot runs them one after another"
                                >(merges ${e.sources?.length??2} automations)</span
                              >`:Y}
                        </label>
                      </li>
                    `)}
                </ul>
              `}
          ${t.skipped.length?j`
                <p class="hint">Needs manual import:</p>
                <ul class="import-list">
                  ${t.skipped.map(t=>j`<li>${t.alias} — <code>${t.reason}</code></li>`)}
                </ul>
              `:Y}
          ${t.proposals.some(t=>t.conflict)?j`<label class="hint check-row">
                <input
                  type="checkbox"
                  .checked=${this._importOverwrite}
                  @change=${t=>{this._importOverwrite=t.target.checked}}
                />
                Overwrite already-assigned slots
              </label>`:Y}
          ${this._importError?j`<p class="error">${this._importError}</p>`:Y}
          <div class="buttons">
            <button ?disabled=${this._importBusy} @click=${this._applyImport}>
              Apply
            </button>
            <button @click=${this._closeImport}>Cancel</button>
          </div>
        </div>
      </div>
    `}};Re.styles=n`
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
      margin-top: 12px;
      padding: 12px;
      border: 1px solid var(--warning-color, #ffa600);
      border-radius: 8px;
    }
    .decision p {
      margin: 0 0 8px;
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
    .buttons button:disabled {
      opacity: 0.4;
      cursor: default;
    }
  `,t([ut()],Re.prototype,"_remote",void 0),t([ut()],Re.prototype,"_remoteChoices",void 0),t([ut()],Re.prototype,"_error",void 0),t([ut()],Re.prototype,"_flash",void 0),t([ut()],Re.prototype,"_hostWidth",void 0),t([pt({type:Boolean})],Re.prototype,"preview",void 0),t([ut()],Re.prototype,"_tipsRev",void 0),t([ut()],Re.prototype,"_gridEditing",void 0),t([ut()],Re.prototype,"_gridDraft",void 0),t([ut()],Re.prototype,"_pickerOpen",void 0),t([ut()],Re.prototype,"_buttonSheet",void 0),t([ut()],Re.prototype,"_tip",void 0),t([ut()],Re.prototype,"_editingAction",void 0),t([ut()],Re.prototype,"_editorTab",void 0),t([ut()],Re.prototype,"_quickMode",void 0),t([ut()],Re.prototype,"_quickEntity",void 0),t([ut()],Re.prototype,"_quickOption",void 0),t([ut()],Re.prototype,"_snapEntities",void 0),t([ut()],Re.prototype,"_snapRemember",void 0),t([ut()],Re.prototype,"_draft",void 0),t([ut()],Re.prototype,"_draftName",void 0),t([ut()],Re.prototype,"_yamlValue",void 0),t([ut()],Re.prototype,"_yamlValid",void 0),t([ut()],Re.prototype,"_draftError",void 0),t([ut()],Re.prototype,"_draftMaterialized",void 0),t([ut()],Re.prototype,"_editingLive",void 0),t([ut()],Re.prototype,"_haFormOk",void 0),t([ut()],Re.prototype,"_yamlEditorOk",void 0),t([ut()],Re.prototype,"_clearArtifacts",void 0),t([ut()],Re.prototype,"_clearRemember",void 0),t([ut()],Re.prototype,"_moveOpen",void 0),t([ut()],Re.prototype,"_moveTarget",void 0),t([ut()],Re.prototype,"_releaseOpen",void 0),t([ut()],Re.prototype,"_releaseConvert",void 0),t([ut()],Re.prototype,"_releaseBusy",void 0),t([ut()],Re.prototype,"_importScan",void 0),t([ut()],Re.prototype,"_importSelected",void 0),t([ut()],Re.prototype,"_importOverwrite",void 0),t([ut()],Re.prototype,"_importBusy",void 0),t([ut()],Re.prototype,"_importError",void 0),Re=t([dt(Ie)],Re),window.customCards=window.customCards||[],window.customCards.push({type:Ie,name:"Remote Mapper Card",description:"Map physical remote buttons to actions on a canvas layout.",preview:!1}),console.info(`%c REMOTE-MAPPER-CARD %c ${ne} `,"color: white; background: #3f51b5; font-weight: 700;","color: #3f51b5; background: white; font-weight: 700;");export{Re as RemoteMapperCard};
