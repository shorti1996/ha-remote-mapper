function t(t,e,i,s){var r,o=arguments.length,n=o<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(n=(o<3?r(n):o>3?r(e,i,n):r(e,i))||n);return o>3&&n&&Object.defineProperty(e,i,n),n}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),r=new WeakMap;let o=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=r.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&r.set(e,t))}return t}toString(){return this.cssText}};const n=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new o("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:a,defineProperty:c,getOwnPropertyDescriptor:h,getOwnPropertyNames:l,getOwnPropertySymbols:d,getPrototypeOf:p}=Object,_=globalThis,u=_.trustedTypes,m=u?u.emptyScript:"",f=_.reactiveElementPolyfillSupport,$=(t,e)=>t,y={toAttribute(t,e){switch(e){case Boolean:t=t?m:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},g=(t,e)=>!a(t,e),v={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:g};Symbol.metadata??=Symbol("metadata"),_.litPropertyMetadata??=new WeakMap;let b=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=v){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&c(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:r}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const o=s?.call(this);r?.call(this,e),this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??v}static _$Ei(){if(this.hasOwnProperty($("elementProperties")))return;const t=p(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty($("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty($("properties"))){const t=this.properties,e=[...l(t),...d(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(n(t))}else void 0!==t&&e.push(n(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),r=e.litNonce;void 0!==r&&s.setAttribute("nonce",r),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:y).toAttribute(e,i.type);this._$Em=t,null==r?this.removeAttribute(s):this.setAttribute(s,r),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:y;this._$Em=s;const o=r.fromAttribute(e,t.type);this[s]=o??this._$Ej?.get(s)??o,this._$Em=null}}requestUpdate(t,e,i,s=!1,r){if(void 0!==t){const o=this.constructor;if(!1===s&&(r=this[t]),i??=o.getPropertyOptions(t),!((i.hasChanged??g)(r,e)||i.useDefault&&i.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:r},o){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),!0!==r||void 0!==o)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[$("elementProperties")]=new Map,b[$("finalized")]=new Map,f?.({ReactiveElement:b}),(_.reactiveElementVersions??=[]).push("2.1.2");const A=globalThis,S=t=>t,E=A.trustedTypes,x=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,w="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,k="?"+C,M=`<${k}>`,P=document,O=()=>P.createComment(""),R=t=>null===t||"object"!=typeof t&&"function"!=typeof t,U=Array.isArray,T="[ \t\n\f\r]",z=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,I=/-->/g,N=/>/g,H=RegExp(`>|${T}(?:([^\\s"'>=/]+)(${T}*=${T}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),j=/'/g,D=/"/g,L=/^(?:script|style|textarea|title)$/i,B=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),W=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),V=new WeakMap,J=P.createTreeWalker(P,129);function K(t,e){if(!U(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==x?x.createHTML(e):e}const Z=(t,e)=>{const i=t.length-1,s=[];let r,o=2===e?"<svg>":3===e?"<math>":"",n=z;for(let e=0;e<i;e++){const i=t[e];let a,c,h=-1,l=0;for(;l<i.length&&(n.lastIndex=l,c=n.exec(i),null!==c);)l=n.lastIndex,n===z?"!--"===c[1]?n=I:void 0!==c[1]?n=N:void 0!==c[2]?(L.test(c[2])&&(r=RegExp("</"+c[2],"g")),n=H):void 0!==c[3]&&(n=H):n===H?">"===c[0]?(n=r??z,h=-1):void 0===c[1]?h=-2:(h=n.lastIndex-c[2].length,a=c[1],n=void 0===c[3]?H:'"'===c[3]?D:j):n===D||n===j?n=H:n===I||n===N?n=z:(n=H,r=void 0);const d=n===H&&t[e+1].startsWith("/>")?" ":"";o+=n===z?i+M:h>=0?(s.push(a),i.slice(0,h)+w+i.slice(h)+C+d):i+C+(-2===h?e:d)}return[K(t,o+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class F{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let r=0,o=0;const n=t.length-1,a=this.parts,[c,h]=Z(t,e);if(this.el=F.createElement(c,i),J.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=J.nextNode())&&a.length<n;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(w)){const e=h[o++],i=s.getAttribute(t).split(C),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:r,name:n[2],strings:i,ctor:"."===n[1]?tt:"?"===n[1]?et:"@"===n[1]?it:X}),s.removeAttribute(t)}else t.startsWith(C)&&(a.push({type:6,index:r}),s.removeAttribute(t));if(L.test(s.tagName)){const t=s.textContent.split(C),e=t.length-1;if(e>0){s.textContent=E?E.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],O()),J.nextNode(),a.push({type:2,index:++r});s.append(t[e],O())}}}else if(8===s.nodeType)if(s.data===k)a.push({type:2,index:r});else{let t=-1;for(;-1!==(t=s.data.indexOf(C,t+1));)a.push({type:7,index:r}),t+=C.length-1}r++}}static createElement(t,e){const i=P.createElement("template");return i.innerHTML=t,i}}function G(t,e,i=t,s){if(e===W)return e;let r=void 0!==s?i._$Co?.[s]:i._$Cl;const o=R(e)?void 0:e._$litDirective$;return r?.constructor!==o&&(r?._$AO?.(!1),void 0===o?r=void 0:(r=new o(t),r._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=r:i._$Cl=r),void 0!==r&&(e=G(t,r._$AS(t,e.values),r,s)),e}class Y{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??P).importNode(e,!0);J.currentNode=s;let r=J.nextNode(),o=0,n=0,a=i[0];for(;void 0!==a;){if(o===a.index){let e;2===a.type?e=new Q(r,r.nextSibling,this,t):1===a.type?e=new a.ctor(r,a.name,a.strings,this,t):6===a.type&&(e=new st(r,this,t)),this._$AV.push(e),a=i[++n]}o!==a?.index&&(r=J.nextNode(),o++)}return J.currentNode=P,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=G(this,t,e),R(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==W&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>U(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&R(this._$AH)?this._$AA.nextSibling.data=t:this.T(P.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=F.createElement(K(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new Y(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=V.get(t.strings);return void 0===e&&V.set(t.strings,e=new F(t)),e}k(t){U(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const r of t)s===e.length?e.push(i=new Q(this.O(O()),this.O(O()),this,this.options)):i=e[s],i._$AI(r),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=S(t).nextSibling;S(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class X{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,r){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=q}_$AI(t,e=this,i,s){const r=this.strings;let o=!1;if(void 0===r)t=G(this,t,e,0),o=!R(t)||t!==this._$AH&&t!==W,o&&(this._$AH=t);else{const s=t;let n,a;for(t=r[0],n=0;n<r.length-1;n++)a=G(this,s[i+n],e,n),a===W&&(a=this._$AH[n]),o||=!R(a)||a!==this._$AH[n],a===q?t=q:t!==q&&(t+=(a??"")+r[n+1]),this._$AH[n]=a}o&&!s&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class tt extends X{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class et extends X{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class it extends X{constructor(t,e,i,s,r){super(t,e,i,s,r),this.type=5}_$AI(t,e=this){if((t=G(this,t,e,0)??q)===W)return;const i=this._$AH,s=t===q&&i!==q||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,r=t!==q&&(i===q||s);s&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class st{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){G(this,t)}}const rt=A.litHtmlPolyfillSupport;rt?.(F,Q),(A.litHtmlVersions??=[]).push("3.3.3");const ot=globalThis;class nt extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let r=s._$litPart$;if(void 0===r){const t=i?.renderBefore??null;s._$litPart$=r=new Q(e.insertBefore(O(),t),t,void 0,i??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}}nt._$litElement$=!0,nt.finalized=!0,ot.litElementHydrateSupport?.({LitElement:nt});const at=ot.litElementPolyfillSupport;at?.({LitElement:nt}),(ot.litElementVersions??=[]).push("4.2.2");const ct={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:g},ht=(t=ct,e,i)=>{const{kind:s,metadata:r}=i;let o=globalThis.litPropertyMetadata.get(r);if(void 0===o&&globalThis.litPropertyMetadata.set(r,o=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),o.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const r=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,r,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const r=this[s];e.call(this,i),this.requestUpdate(s,r,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function lt(t){return function(t){return(e,i)=>"object"==typeof i?ht(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}({...t,state:!0,attribute:!1})}const dt="remote-mapper-card";let pt=class extends nt{constructor(){super(...arguments),this._editMode=!1,this._draft="",this._draftMaterialized=!1,this._clearRemember=!1,this._importSelected=new Set,this._importOverwrite=!1,this._importBusy=!1,this._fetchStarted=!1}set hass(t){this._hass=t,!this._fetchStarted&&this._config&&(this._fetchStarted=!0,this._initialize())}setConfig(t){this._config=t,this._entryId=t.entry_id,this._fetchStarted=!1,this._hass&&(this._fetchStarted=!0,this._initialize())}getCardSize(){const t=this._remote?.layout?.actions?.length??4;return 1+Math.ceil(t/this._columns())}getGridOptions(){return{columns:12,min_columns:6}}static getStubConfig(){return{}}disconnectedCallback(){super.disconnectedCallback(),this._unsubEvents?.(),this._unsubEvents=void 0}connectedCallback(){super.connectedCallback(),this._fetchStarted&&!this._unsubEvents&&this._subscribe()}async _initialize(){try{if(!this._entryId){const t=await this._hass.callWS({type:"remote_mapper/list_remotes"});if(1!==t.remotes.length)return void(this._remoteChoices=t.remotes);this._entryId=t.remotes[0].entry_id}await this._fetchRemote(),await this._subscribe()}catch(t){this._error=String(t)}}async _subscribe(){this._unsubEvents||(this._unsubEvents=await this._hass.connection.subscribeEvents(t=>{t.data.entry_id===this._entryId&&this._fetchRemote()},"remote_mapper_updated"))}async _fetchRemote(){try{this._remote=await this._hass.callWS({type:"remote_mapper/get_remote",entry_id:this._entryId}),this._error=void 0}catch(t){this._error=String(t)}}_columns(){const t=this._remote?.layout?.actions?.length??4;return Math.max(2,Math.ceil(Math.sqrt(t)))}_slotSummary(t){if(!t)return"unassigned";if(t.materialized)return`automation: ${t.automation_id??"?"}`;const e=t.sequence?.[0];if(!e)return"empty sequence";return e.action??e.service??Object.keys(e)[0]??"sequence"}async _onTileTap(t){if(this._editMode)return void this._openEditor(t);const e=this._remote?.slots[t];if(e&&!e.archived){this._flash=t,setTimeout(()=>{this._flash=void 0},400);try{await this._hass.callWS({type:"remote_mapper/run_slot",entry_id:this._entryId,action_id:t})}catch(t){this._error=String(t)}}}_openEditor(t){const e=this._remote?.slots[t];this._editingAction=t,this._draft=JSON.stringify(e?.sequence??[],null,2),this._draftError=void 0,this._draftMaterialized=e?.materialized??!1,this._editingLive=void 0,e?.materialized&&this._hass.callWS({type:"remote_mapper/get_slot",entry_id:this._entryId,action_id:t}).then(e=>{this._editingAction===t&&e.live&&(this._editingLive=e.live,this._draft=JSON.stringify(e.live.actions??[],null,2))})}_closeEditor(){this._editingAction=void 0,this._draftError=void 0,this._editingLive=void 0}async _saveDraft(){try{await this._hass.callWS({type:"remote_mapper/save_slot",entry_id:this._entryId,action_id:this._editingAction,sequence_yaml:this._draft,materialized:this._draftMaterialized}),this._closeEditor()}catch(t){this._draftError=t.message??String(t)}}async _clearSlot(t){const e=await this._hass.callWS({type:"remote_mapper/clear_slot",entry_id:this._entryId,action_id:this._editingAction,...t?{decision:t,remember:this._clearRemember}:{}});if(e.needs_decision)return this._clearRemember=!1,void(this._clearArtifacts=e.artifacts);this._clearArtifacts=void 0,this._closeEditor()}async _snapshot(t){try{await this._hass.callWS({type:"remote_mapper/create_snapshot",entry_id:this._entryId,action_id:this._editingAction,re_snapshot:t}),this._closeEditor()}catch(t){this._draftError=t.message??String(t)}}async _openImport(){this._importError=void 0,this._importOverwrite=!1,this._importBusy=!1;try{const t=await this._hass.callWS({type:"remote_mapper/scan_import",entry_id:this._entryId});this._importSelected=new Set(t.proposals.flatMap((t,e)=>t.conflict?[]:[e])),this._importScan=t}catch(t){this._error=String(t)}}_closeImport(){this._importScan=void 0}async _applyImport(){const t=this._importScan.proposals.filter((t,e)=>this._importSelected.has(e));if(t.length){this._importBusy=!0;try{await this._hass.callWS({type:"remote_mapper/apply_import",entry_id:this._entryId,proposals:t,overwrite:this._importOverwrite}),this._closeImport()}catch(t){this._importError=t.message??String(t)}finally{this._importBusy=!1}}else this._closeImport()}async _toggleArchived(){const t=this._remote?.slots[this._editingAction];t&&(await this._hass.callWS({type:"remote_mapper/archive_slot",entry_id:this._entryId,action_id:this._editingAction,archived:!t.archived}),this._closeEditor())}render(){if(this._error)return B`<ha-card header="Remote Mapper">
        <div class="content error">${this._error}</div>
      </ha-card>`;if(this._remoteChoices)return B`<ha-card header="Remote Mapper">
        <div class="content">
          ${0===this._remoteChoices.length?B`<p>No remotes configured yet — add one in Settings →
                Devices &amp; services.</p>`:B`<p>Several remotes exist — set <code>entry_id</code> in the
                  card config:</p>
                <ul>
                  ${this._remoteChoices.map(t=>B`<li>${t.title}: <code>${t.entry_id}</code></li>`)}
                </ul>`}
        </div>
      </ha-card>`;if(!this._remote)return B`<ha-card header="Remote Mapper">
        <div class="content">Loading…</div>
      </ha-card>`;const t=this._remote.layout?.actions??[];return B`
      <ha-card>
        <div class="header">
          <span class="title">${this._remote.title}</span>
          <span class="header-buttons">
            ${this._editMode?B`<button
                  class="pencil"
                  title="Import existing automations"
                  @click=${this._openImport}
                >
                  ⇪
                </button>`:q}
            <button
              class="pencil ${this._editMode?"active":""}"
              title=${this._editMode?"Done":"Edit slots"}
              @click=${()=>{this._editMode=!this._editMode}}
            >
              ${this._editMode?"✓":"✎"}
            </button>
          </span>
        </div>
        <div
          class="grid"
          style="grid-template-columns: repeat(${this._columns()}, 1fr)"
        >
          ${t.map(t=>this._renderTile(t))}
        </div>
        ${void 0!==this._editingAction?this._renderEditor():q}
        ${this._importScan?this._renderImport():q}
      </ha-card>
    `}_renderImport(){const t=this._importScan;return B`
      <div class="modal-backdrop" @click=${this._closeImport}>
        <div class="modal" @click=${t=>t.stopPropagation()}>
          <h3>Import automations</h3>
          ${0===t.proposals.length?B`<p class="hint">No importable automations found.</p>`:B`
                <p class="hint">
                  Selected slots take over; source automations are
                  <b>disabled</b>, not deleted.
                </p>
                <ul class="import-list">
                  ${t.proposals.map((t,e)=>B`
                      <li>
                        <label>
                          <input
                            type="checkbox"
                            .checked=${this._importSelected.has(e)}
                            @change=${t=>{const i=new Set(this._importSelected);t.target.checked?i.add(e):i.delete(e),this._importSelected=i}}
                          />
                          <b>${t.action_id}</b> ← ${t.alias}
                          ${t.conflict?B`<span class="warn">(overwrites slot)</span>`:q}
                          ${t.mixed?B`<span class="warn"
                                >(mixed remotes — source stays enabled)</span
                              >`:q}
                        </label>
                      </li>
                    `)}
                </ul>
              `}
          ${t.skipped.length?B`
                <p class="hint">Needs manual import:</p>
                <ul class="import-list">
                  ${t.skipped.map(t=>B`<li>${t.alias} — <code>${t.reason}</code></li>`)}
                </ul>
              `:q}
          ${t.proposals.some(t=>t.conflict)?B`<label class="hint">
                <input
                  type="checkbox"
                  .checked=${this._importOverwrite}
                  @change=${t=>{this._importOverwrite=t.target.checked}}
                />
                Overwrite already-assigned slots
              </label>`:q}
          ${this._importError?B`<p class="error">${this._importError}</p>`:q}
          <div class="buttons">
            <button ?disabled=${this._importBusy} @click=${this._applyImport}>
              Apply
            </button>
            <button @click=${this._closeImport}>Cancel</button>
          </div>
        </div>
      </div>
    `}_renderTile(t){const e=this._remote.slots[t],i=["tile",e?"assigned":"empty",e?.archived?"archived":"",this._flash===t?"flash":"",this._editMode?"editable":""].join(" ");return B`
      <button class=${i} @click=${()=>this._onTileTap(t)}>
        <span class="action">${t}</span>
        <span class="summary">${this._slotSummary(e)}</span>
        ${e?.last_error?B`<span class="badge error-badge" title=${e.last_error}
              >!</span
            >`:q}
        ${e?.archived?B`<span class="badge">archived</span>`:q}
      </button>
    `}_renderEditor(){const t=this._remote.slots[this._editingAction];return B`
      <div class="modal-backdrop" @click=${this._closeEditor}>
        <div class="modal" @click=${t=>t.stopPropagation()}>
          <h3>${this._editingAction}</h3>
          ${this._editingLive?B`<p class="hint">
                Linked to <b>${this._editingLive.alias}</b> —
                <a href=${this._editingLive.edit_url}>Edit in HA</a>. Unticking
                "automation" below deletes it on Save and moves its actions
                into this card. Cancel keeps things as they are.
              </p>`:B`<p class="hint">
                Sequence (YAML or JSON) — same format as automation actions.
              </p>`}
          <label class="hint">
            <input
              type="checkbox"
              .checked=${this._draftMaterialized}
              @change=${t=>{this._draftMaterialized=t.target.checked}}
            />
            Create as automation (editable/traceable in HA)
          </label>
          <textarea
            .value=${this._draft}
            spellcheck="false"
            @input=${t=>{this._draft=t.target.value}}
          ></textarea>
          ${this._draftError?B`<p class="error">${this._draftError}</p>`:q}
          <div class="buttons">
            <button @click=${this._saveDraft}>Save</button>
            <button @click=${this._closeEditor}>Cancel</button>
            <button
              title="Capture the current room state as a scene on this button"
              @click=${()=>this._snapshot(!1)}
            >
              📸 Snapshot
            </button>
            ${t?.scene_id?B`<button
                  title="Same scene, same entities, new states"
                  @click=${()=>this._snapshot(!0)}
                >
                  Re-snapshot
                </button>`:q}
            ${t?B`
                  <button class="danger" @click=${()=>this._clearSlot()}>
                    Clear
                  </button>
                  <button @click=${this._toggleArchived}>
                    ${t.archived?"Unarchive":"Archive"}
                  </button>
                `:q}
          </div>
          ${this._clearArtifacts?this._renderClearDialog():q}
        </div>
      </div>
    `}_renderClearDialog(){const t=this._clearArtifacts,e=[];return t.scene&&e.push(`scene ${t.scene.entity_id??""}`),t.automation&&e.push("its automation"),B`
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
    `}};pt.styles=((t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new o(i,t,s)})`
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px 0;
    }
    .title {
      font-size: 1.2em;
      font-weight: 500;
    }
    .pencil {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1em;
      color: var(--secondary-text-color);
      padding: 4px 8px;
    }
    .pencil.active {
      color: var(--primary-color);
    }
    .header-buttons {
      display: flex;
      align-items: center;
    }
    .import-list {
      margin: 4px 0 8px;
      padding-left: 18px;
      font-size: 0.85em;
    }
    .import-list li {
      margin: 2px 0;
    }
    .warn {
      color: var(--warning-color, #ffa600);
      font-size: 0.85em;
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
    .content {
      padding: 0 16px 16px;
    }
    .grid {
      display: grid;
      gap: 8px;
      padding: 12px 16px 16px;
    }
    .tile {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      min-height: 64px;
      padding: 8px 4px;
      border-radius: 8px;
      border: 1px solid var(--divider-color, #444);
      background: var(--card-background-color, inherit);
      color: var(--primary-text-color);
      cursor: pointer;
      font: inherit;
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
    .tile.editable {
      border-style: dotted;
    }
    .action {
      font-weight: 500;
      font-size: 0.95em;
    }
    .summary {
      font-size: 0.75em;
      color: var(--secondary-text-color);
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .badge {
      position: absolute;
      top: 4px;
      right: 4px;
      font-size: 0.65em;
      color: var(--secondary-text-color);
    }
    .error-badge {
      color: var(--error-color, #db4437);
      font-weight: 700;
    }
    .error {
      color: var(--error-color, #db4437);
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    .modal {
      background: var(--card-background-color, #fff);
      border-radius: 12px;
      padding: 16px;
      width: min(520px, 92vw);
      max-height: 84vh;
      overflow: auto;
      box-shadow: var(--ha-card-box-shadow, 0 8px 24px rgba(0, 0, 0, 0.4));
    }
    .modal h3 {
      margin: 0 0 4px;
    }
    .hint {
      margin: 0 0 8px;
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }
    textarea {
      width: 100%;
      min-height: 180px;
      font-family: var(--code-font-family, monospace);
      font-size: 0.85em;
      box-sizing: border-box;
      background: inherit;
      color: inherit;
      border: 1px solid var(--divider-color, #444);
      border-radius: 6px;
      padding: 8px;
    }
    .buttons {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    .buttons button {
      padding: 6px 14px;
      border-radius: 6px;
      border: 1px solid var(--divider-color, #444);
      background: none;
      color: var(--primary-text-color);
      cursor: pointer;
      font: inherit;
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
  `,t([lt()],pt.prototype,"_remote",void 0),t([lt()],pt.prototype,"_remoteChoices",void 0),t([lt()],pt.prototype,"_error",void 0),t([lt()],pt.prototype,"_editMode",void 0),t([lt()],pt.prototype,"_editingAction",void 0),t([lt()],pt.prototype,"_draft",void 0),t([lt()],pt.prototype,"_draftError",void 0),t([lt()],pt.prototype,"_draftMaterialized",void 0),t([lt()],pt.prototype,"_editingLive",void 0),t([lt()],pt.prototype,"_clearArtifacts",void 0),t([lt()],pt.prototype,"_clearRemember",void 0),t([lt()],pt.prototype,"_flash",void 0),t([lt()],pt.prototype,"_importScan",void 0),t([lt()],pt.prototype,"_importSelected",void 0),t([lt()],pt.prototype,"_importOverwrite",void 0),t([lt()],pt.prototype,"_importBusy",void 0),t([lt()],pt.prototype,"_importError",void 0),pt=t([(t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)})(dt)],pt),window.customCards=window.customCards||[],window.customCards.push({type:dt,name:"Remote Mapper Card",description:"Map physical remote buttons to actions.",preview:!1}),console.info("%c REMOTE-MAPPER-CARD %c v0 ","color: white; background: #3f51b5; font-weight: 700;","color: #3f51b5; background: white; font-weight: 700;");export{pt as RemoteMapperCard};
