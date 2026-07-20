function t(t,e,i,s){var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),o=new WeakMap;let r=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=o.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&o.set(e,t))}return t}toString(){return this.cssText}};const n=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:a,defineProperty:d,getOwnPropertyDescriptor:c,getOwnPropertyNames:h,getOwnPropertySymbols:l,getPrototypeOf:p}=Object,u=globalThis,_=u.trustedTypes,m=_?_.emptyScript:"",g=u.reactiveElementPolyfillSupport,f=(t,e)=>t,y={toAttribute(t,e){switch(e){case Boolean:t=t?m:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},v=(t,e)=>!a(t,e),b={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:v};Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=b){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&d(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:o}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const r=s?.call(this);o?.call(this,e),this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??b}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const t=p(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const t=this.properties,e=[...h(t),...l(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(n(t))}else void 0!==t&&e.push(n(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),o=e.litNonce;void 0!==o&&s.setAttribute("nonce",o),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const o=(void 0!==i.converter?.toAttribute?i.converter:y).toAttribute(e,i.type);this._$Em=t,null==o?this.removeAttribute(s):this.setAttribute(s,o),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),o="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:y;this._$Em=s;const r=o.fromAttribute(e,t.type);this[s]=r??this._$Ej?.get(s)??r,this._$Em=null}}requestUpdate(t,e,i,s=!1,o){if(void 0!==t){const r=this.constructor;if(!1===s&&(o=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??v)(o,e)||i.useDefault&&i.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:o},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==o||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[f("elementProperties")]=new Map,$[f("finalized")]=new Map,g?.({ReactiveElement:$}),(u.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,x=t=>t,k=w.trustedTypes,E=k?k.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",A=`lit$${Math.random().toFixed(9).slice(2)}$`,M="?"+A,C=`<${M}>`,P=document,z=()=>P.createComment(""),I=t=>null===t||"object"!=typeof t&&"function"!=typeof t,T=Array.isArray,O="[ \t\n\f\r]",U=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,L=/>/g,D=RegExp(`>|${O}(?:([^\\s"'>=/]+)(${O}*=${O}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),q=/'/g,H=/"/g,N=/^(?:script|style|textarea|title)$/i,W=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),j=Symbol.for("lit-noChange"),B=Symbol.for("lit-nothing"),V=new WeakMap,Y=P.createTreeWalker(P,129);function X(t,e){if(!T(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==E?E.createHTML(e):e}const F=(t,e)=>{const i=t.length-1,s=[];let o,r=2===e?"<svg>":3===e?"<math>":"",n=U;for(let e=0;e<i;e++){const i=t[e];let a,d,c=-1,h=0;for(;h<i.length&&(n.lastIndex=h,d=n.exec(i),null!==d);)h=n.lastIndex,n===U?"!--"===d[1]?n=R:void 0!==d[1]?n=L:void 0!==d[2]?(N.test(d[2])&&(o=RegExp("</"+d[2],"g")),n=D):void 0!==d[3]&&(n=D):n===D?">"===d[0]?(n=o??U,c=-1):void 0===d[1]?c=-2:(c=n.lastIndex-d[2].length,a=d[1],n=void 0===d[3]?D:'"'===d[3]?H:q):n===H||n===q?n=D:n===R||n===L?n=U:(n=D,o=void 0);const l=n===D&&t[e+1].startsWith("/>")?" ":"";r+=n===U?i+C:c>=0?(s.push(a),i.slice(0,c)+S+i.slice(c)+A+l):i+A+(-2===c?e:l)}return[X(t,r+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class J{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let o=0,r=0;const n=t.length-1,a=this.parts,[d,c]=F(t,e);if(this.el=J.createElement(d,i),Y.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=Y.nextNode())&&a.length<n;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(S)){const e=c[r++],i=s.getAttribute(t).split(A),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:o,name:n[2],strings:i,ctor:"."===n[1]?tt:"?"===n[1]?et:"@"===n[1]?it:G}),s.removeAttribute(t)}else t.startsWith(A)&&(a.push({type:6,index:o}),s.removeAttribute(t));if(N.test(s.tagName)){const t=s.textContent.split(A),e=t.length-1;if(e>0){s.textContent=k?k.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],z()),Y.nextNode(),a.push({type:2,index:++o});s.append(t[e],z())}}}else if(8===s.nodeType)if(s.data===M)a.push({type:2,index:o});else{let t=-1;for(;-1!==(t=s.data.indexOf(A,t+1));)a.push({type:7,index:o}),t+=A.length-1}o++}}static createElement(t,e){const i=P.createElement("template");return i.innerHTML=t,i}}function K(t,e,i=t,s){if(e===j)return e;let o=void 0!==s?i._$Co?.[s]:i._$Cl;const r=I(e)?void 0:e._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(t),o._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=o:i._$Cl=o),void 0!==o&&(e=K(t,o._$AS(t,e.values),o,s)),e}class Q{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??P).importNode(e,!0);Y.currentNode=s;let o=Y.nextNode(),r=0,n=0,a=i[0];for(;void 0!==a;){if(r===a.index){let e;2===a.type?e=new Z(o,o.nextSibling,this,t):1===a.type?e=new a.ctor(o,a.name,a.strings,this,t):6===a.type&&(e=new st(o,this,t)),this._$AV.push(e),a=i[++n]}r!==a?.index&&(o=Y.nextNode(),r++)}return Y.currentNode=P,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class Z{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=B,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=K(this,t,e),I(t)?t===B||null==t||""===t?(this._$AH!==B&&this._$AR(),this._$AH=B):t!==this._$AH&&t!==j&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>T(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==B&&I(this._$AH)?this._$AA.nextSibling.data=t:this.T(P.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=J.createElement(X(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new Q(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=V.get(t.strings);return void 0===e&&V.set(t.strings,e=new J(t)),e}k(t){T(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const o of t)s===e.length?e.push(i=new Z(this.O(z()),this.O(z()),this,this.options)):i=e[s],i._$AI(o),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=x(t).nextSibling;x(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class G{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,o){this.type=1,this._$AH=B,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=B}_$AI(t,e=this,i,s){const o=this.strings;let r=!1;if(void 0===o)t=K(this,t,e,0),r=!I(t)||t!==this._$AH&&t!==j,r&&(this._$AH=t);else{const s=t;let n,a;for(t=o[0],n=0;n<o.length-1;n++)a=K(this,s[i+n],e,n),a===j&&(a=this._$AH[n]),r||=!I(a)||a!==this._$AH[n],a===B?t=B:t!==B&&(t+=(a??"")+o[n+1]),this._$AH[n]=a}r&&!s&&this.j(t)}j(t){t===B?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class tt extends G{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===B?void 0:t}}class et extends G{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==B)}}class it extends G{constructor(t,e,i,s,o){super(t,e,i,s,o),this.type=5}_$AI(t,e=this){if((t=K(this,t,e,0)??B)===j)return;const i=this._$AH,s=t===B&&i!==B||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,o=t!==B&&(i===B||s);s&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class st{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){K(this,t)}}const ot=w.litHtmlPolyfillSupport;ot?.(J,Z),(w.litHtmlVersions??=[]).push("3.3.3");const rt=globalThis;class nt extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let o=s._$litPart$;if(void 0===o){const t=i?.renderBefore??null;s._$litPart$=o=new Z(e.insertBefore(z(),t),t,void 0,i??{})}return o._$AI(t),o})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return j}}nt._$litElement$=!0,nt.finalized=!0,rt.litElementHydrateSupport?.({LitElement:nt});const at=rt.litElementPolyfillSupport;at?.({LitElement:nt}),(rt.litElementVersions??=[]).push("4.2.2");const dt={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:v},ct=(t=dt,e,i)=>{const{kind:s,metadata:o}=i;let r=globalThis.litPropertyMetadata.get(o);if(void 0===r&&globalThis.litPropertyMetadata.set(o,r=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),r.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const o=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,o,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const o=this[s];e.call(this,i),this.requestUpdate(s,o,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function ht(t){return function(t){return(e,i)=>"object"==typeof i?ct(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}({...t,state:!0,attribute:!1})}function lt(t,e){return Math.max(e,Math.round(t/e)*e)}function pt(t,e){return Math.round(t/e)*e}function ut(t){const e=t.cell;if("number"==typeof e&&Number.isFinite(e))return{x:e,y:e};const i=e??{};return{x:"number"==typeof i.x&&Number.isFinite(i.x)?i.x:10,y:"number"==typeof i.y&&Number.isFinite(i.y)?i.y:10}}function _t(t){return t.map((t,e)=>({w:t,i:e})).sort((t,e)=>(t.w.z??0)-(e.w.z??0)||t.i-e.i).map(t=>t.w)}function mt(t,e){const i=new Map;return t.forEach((t,e)=>i.set(t.id,e+1)),e.map(t=>({...t,z:i.get(t.id)??t.z??1}))}function gt(t){return mt(_t(t),t)}const ft=new Map;function yt(t,e){const i={canvasId:t,active:!0,working:e,original:e.map(t=>({...t})),selectedId:null,undoStack:[],dpadMode:"fine"};return ft.set(t,i),i}function vt(t){return JSON.stringify(bt(t))}function bt(t){if(Array.isArray(t))return t.map(bt);if(t&&"object"==typeof t){const e={};for(const i of Object.keys(t).sort()){const s=t[i];void 0!==s&&(e[i]=bt(s))}return e}return t}function $t(t){return null==t?t:JSON.parse(JSON.stringify(t))}class wt{constructor(t){this.session=null,this.drag=null,this.lpStart=null,this.keydownBound=t=>this.onKeyDown(t),this.host=t}get active(){return this.session?.active??!1}get working(){return this.session?.working??[]}get selectedId(){return this.session?.selectedId??null}get selected(){const t=this.selectedId;return t?this.working.find(e=>e.id===t):void 0}get dpadMode(){return this.session?.dpadMode??"fine"}get dpadSteps(){if("fine"===this.dpadMode)return{x:1,y:1};const t=this.host.config();return t?ut(t.grid):{x:1,y:1}}get dirty(){return!!this.session&&!function(t,e){return vt(t)===vt(e)}(this.session.working,this.session.original)}get canUndo(){return(this.session?.undoStack.length??0)>0}get dragging(){return null!==this.drag}tryResume(){const t=this.host.config(),e=(i=t?.canvas_id,i?ft.get(i):void 0);var i;return!!e?.active&&(this.session=e,window.addEventListener("keydown",this.keydownBound),!0)}enter(){if(this.session?.active)return;const t=this.host.config();t?.canvas_id&&(this.session=yt(t.canvas_id,$t(t.widgets)),window.addEventListener("keydown",this.keydownBound),this.host.requestUpdate())}async done(){const t=this.session;if(!t)return;const e=gt(t.working);this.teardown();if(!await this.host.saveWorking(e)){const i=this.host.config();this.session=yt(t.canvasId,e),this.session.original=$t(i?.widgets??[]),window.addEventListener("keydown",this.keydownBound)}this.host.requestUpdate()}cancel(){this.session&&(this.dirty&&!window.confirm("Discard layout changes?")||(this.teardown(),this.host.requestUpdate()))}detach(){window.removeEventListener("keydown",this.keydownBound),this.clearDpadRepeat(),this.cancelLongPress(),this.session=null}teardown(){var t;window.removeEventListener("keydown",this.keydownBound),this.clearDpadRepeat(),this.cancelLongPress(),t=this.session?.canvasId,t&&ft.delete(t),this.session=null,this.drag=null}pushUndo(){const t=this.session;t&&(t.undoStack.push($t(t.working)),t.undoStack.length>25&&t.undoStack.shift())}undo(){const t=this.session;if(!t)return;const e=t.undoStack.pop();e&&(t.working=e,t.selectedId&&!e.some(e=>e.id===t.selectedId)&&(t.selectedId=null),this.host.requestUpdate())}select(t){const e=this.session;e&&(e.selectedId=t,this.host.requestUpdate())}updateWidget(t,e,i){const s=this.session;s&&(!1!==i?.undo&&this.pushUndo(),s.working=s.working.map(i=>i.id===t?{...i,...e}:i),this.host.requestUpdate())}zOp(t){const e=this.session;e?.selectedId&&(this.pushUndo(),e.working=function(t,e,i){const s=_t(t),o=s.findIndex(t=>t.id===e);if(-1===o)return gt(t);const r=s.splice(o,1)[0];switch(i){case"forward":s.splice(Math.min(o+1,s.length),0,r);break;case"backward":s.splice(Math.max(o-1,0),0,r);break;case"front":s.push(r);break;case"back":s.unshift(r)}return mt(s,t)}(e.working,e.selectedId,t),this.host.requestUpdate())}ensureTiles(t,e){const i=this.session;if(!i)return;const s=new Set(i.working.map(t=>t.id)),o=e.filter(t=>!s.has(t));if(!o.length)return;this.pushUndo();const r=o.map((e,s)=>{return{...t(e,s),z:(o=i.working,o.reduce((t,e)=>Math.max(t,e.z??0),0)+1+s)};var o});i.working=[...i.working,...r],this.host.requestUpdate()}toggleDpadStep(){const t=this.session;t&&(t.dpadMode="fine"===t.dpadMode?"cell":"fine",this.host.requestUpdate())}nudge(t,e){const i=this.session,s=this.host.config(),o=this.selected;if(!i||!s||!o)return;const r=xt(o.x+t,0,Math.max(0,s.design_size.width-o.w)),n=xt(o.y+e,0,Math.max(0,s.design_size.height-o.h));r===o.x&&n===o.y||this.updateWidget(o.id,{x:kt(r),y:kt(n)},{undo:!1})}dpadPress(t,e){if(!this.session)return;this.pushUndo();const i=()=>{const i=this.dpadSteps;this.nudge(t*i.x,e*i.y)};i(),this.clearDpadRepeat(),this.dpadTimer=window.setTimeout(()=>{this.dpadInterval=window.setInterval(i,70)},350)}dpadRelease(){this.clearDpadRepeat()}clearDpadRepeat(){void 0!==this.dpadTimer&&clearTimeout(this.dpadTimer),void 0!==this.dpadInterval&&clearInterval(this.dpadInterval),this.dpadTimer=this.dpadInterval=void 0}onKeyDown(t){if(!this.session?.active)return;if(function(t){const e=t.composedPath();for(const t of e){if(!(t instanceof HTMLElement))continue;const e=t.localName;if("input"===e||"textarea"===e||"select"===e)return!0;if(t.isContentEditable)return!0;const i=t.getAttribute?.("role");if("textbox"===i||"combobox"===i||"searchbox"===i)return!0}return!1}(t))return;switch(t.key){case"Escape":return t.preventDefault(),void this.cancel();case"z":return void((t.ctrlKey||t.metaKey)&&(t.preventDefault(),this.undo()))}const e={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[t.key];if(e&&this.selectedId){t.preventDefault();const i=this.dpadSteps,s=t.shiftKey?5:1;t.repeat||this.pushUndo(),this.nudge(e[0]*i.x*s,e[1]*i.y*s)}}onSlotPointerDown(t,e){const i=this.session;if(!i||this.drag||t.button>0)return;t.preventDefault(),t.stopPropagation(),i.selectedId!==e&&this.select(e);const s=this.working.find(t=>t.id===e);s&&this.startDrag(t,{kind:"move",pointerId:t.pointerId,widgetId:e,startClientX:t.clientX,startClientY:t.clientY,orig:{...s},moved:!1,next:{x:s.x,y:s.y,w:s.w,h:s.h}})}onHandlePointerDown(t,e,i){if(!this.session||this.drag||t.button>0)return;t.preventDefault(),t.stopPropagation();const s=this.working.find(t=>t.id===e);s&&this.startDrag(t,{kind:"resize",pointerId:t.pointerId,widgetId:e,startClientX:t.clientX,startClientY:t.clientY,orig:{...s},corner:i,moved:!1,next:{x:s.x,y:s.y,w:s.w,h:s.h}})}startDrag(t,e){this.drag=e;const i=t.currentTarget;try{i.setPointerCapture(t.pointerId)}catch{}const s=t=>this.onDragMove(t),o=t=>{t.pointerId===e.pointerId&&(i.removeEventListener("pointermove",s),i.removeEventListener("pointerup",o),i.removeEventListener("pointercancel",r),this.finishDrag(!1))},r=t=>{t.pointerId===e.pointerId&&(i.removeEventListener("pointermove",s),i.removeEventListener("pointerup",o),i.removeEventListener("pointercancel",r),this.finishDrag(!0))};i.addEventListener("pointermove",s),i.addEventListener("pointerup",o),i.addEventListener("pointercancel",r)}onDragMove(t){const e=this.drag,i=this.host.config();if(!e||!i||t.pointerId!==e.pointerId)return;const s=this.host.scale()||1,o=(t.clientX-e.startClientX)/s,r=(t.clientY-e.startClientY)/s;if(!e.moved&&Math.hypot(o*s,r*s)<3)return;e.moved=!0;const n=i.design_size,a=ut(i.grid);if("move"===e.kind)e.next.x=xt(e.orig.x+o,0,Math.max(0,n.width-e.orig.w)),e.next.y=xt(e.orig.y+r,0,Math.max(0,n.height-e.orig.h));else{const t=e.corner,i=t=>Math.max(a.x,Math.floor(t/a.x)*a.x),s=t=>Math.max(a.y,Math.floor(t/a.y)*a.y);let{x:d,y:c,w:h,h:l}=e.orig;if("se"!==t&&"ne"!==t||(h=e.orig.w+o),"sw"!==t&&"nw"!==t||(h=e.orig.w-o),"se"!==t&&"sw"!==t||(l=e.orig.h+r),"ne"!==t&&"nw"!==t||(l=e.orig.h-r),h=xt(lt(h,a.x),a.x,n.width),l=xt(lt(l,a.y),a.y,n.height),"sw"===t||"nw"===t){const t=e.orig.x+e.orig.w;h>t&&(h=i(t)),d=kt(t-h)}else d+h>n.width&&(h=i(n.width-d));if("ne"===t||"nw"===t){const t=e.orig.y+e.orig.h;l>t&&(l=s(t)),c=kt(t-l)}else c+l>n.height&&(l=s(n.height-c));e.next={x:d,y:c,w:h,h:l}}const d=this.host.slotEl(e.widgetId);d&&(d.style.transform=`translate3d(${e.next.x}px, ${e.next.y}px, 0)`,"resize"===e.kind&&(d.style.width=`${e.next.w}px`,d.style.height=`${e.next.h}px`)),this.updateBadgeText(e.next)}finishDrag(t){const e=this.drag,i=this.host.config();if(this.drag=null,!e||!i)return;if(t||!e.moved)return this.syncSlotStyle(e.widgetId,e.orig),void this.host.requestUpdate();let{x:s,y:o}=e.next;if("move"===e.kind&&i.grid.snap_position){const t=ut(i.grid);s=xt(pt(s,t.x),0,Math.max(0,i.design_size.width-e.next.w)),o=xt(pt(o,t.y),0,Math.max(0,i.design_size.height-e.next.h))}const r={x:kt(s),y:kt(o),w:e.next.w,h:e.next.h};this.syncSlotStyle(e.widgetId,r),this.updateBadgeText(r),this.pushUndo(),this.updateWidget(e.widgetId,r,{undo:!1})}syncSlotStyle(t,e){const i=this.host.slotEl(t);i&&(i.style.transform=`translate3d(${e.x}px, ${e.y}px, 0)`,i.style.width=`${e.w}px`,i.style.height=`${e.h}px`)}updateBadgeText(t){const e=this.host.badgeEl();e&&(e.textContent=`x ${Math.round(t.x)}  y ${Math.round(t.y)}  ·  ${t.w}×${t.h}`)}onViewPointerDown(t){if(this.session?.active||t.button>0)return;const e=t.composedPath();for(const t of e)if(t instanceof HTMLElement){if(t.classList?.contains("widget-slot"))return;if(t.classList?.contains("pencil"))return}this.lpStart={x:t.clientX,y:t.clientY},this.lpTimer=window.setTimeout(()=>{this.lpTimer=void 0,this.enter()},800)}onViewPointerMove(t){void 0!==this.lpTimer&&this.lpStart&&Math.hypot(t.clientX-this.lpStart.x,t.clientY-this.lpStart.y)>18&&this.cancelLongPress()}cancelLongPress(){void 0!==this.lpTimer&&clearTimeout(this.lpTimer),this.lpTimer=void 0,this.lpStart=null}}function xt(t,e,i){return Math.min(i,Math.max(e,t))}function kt(t){return Math.round(100*t)/100}let Et=null;function St(){return Et||(Et=window.loadCardHelpers?window.loadCardHelpers():Promise.resolve(null)),Et}let At=null;let Mt=null;const Ct="remote-mapper-card",Pt=20;function zt(t){const e=Math.max(1,t.length),i=Math.max(2,Math.ceil(Math.sqrt(e))),s=Math.ceil(e/i);return{schema_version:1,design_size:{width:Math.max(380,120*i+Pt),height:80*s+Pt},grid:{cell:10,snap_position:!1},widgets:t.map((t,e)=>({id:t,kind:"slot",x:Pt+e%i*120,y:Pt+80*Math.floor(e/i),w:100,h:60,z:e+1}))}}function It(t){if(1===t.length&&"object"==typeof t[0]&&t[0]){const e=t[0],i=e.action??e.service,s=e.target?.entity_id??e.entity_id;if("string"==typeof s){if("scene.turn_on"===i)return{mode:"scene",entity:s};if("homeassistant.toggle"===i)return{mode:"toggle",entity:s};if("script.turn_on"===i)return{mode:"script",entity:s}}}return{mode:"custom",entity:""}}let Tt=class extends nt{constructor(){super(...arguments),this._hostWidth=0,this._editorTab="quick",this._quickMode="scene",this._quickEntity="",this._draft="",this._yamlValid=!0,this._draftMaterialized=!1,this._haFormOk=!1,this._yamlEditorOk=!1,this._clearRemember=!1,this._importSelected=new Set,this._importOverwrite=!1,this._importBusy=!1,this._fetchStarted=!1,this._edit=new wt(this),this._enterEdit=()=>{this._edit.enter();const t=this._remote?.layout?.actions??[],e=this._currentLayout();if(e){const i=new Map(e.widgets.map(t=>[t.id,t]));this._edit.ensureTiles(t=>i.get(t)??zt([t]).widgets[0],t)}}}set hass(t){this._hass=t,!this._fetchStarted&&this._config&&(this._fetchStarted=!0,this._initialize())}setConfig(t){this._config=t,this._entryId=t.entry_id,this._fetchStarted=!1,this._hass&&(this._fetchStarted=!0,this._initialize())}getCardSize(){const t=this._currentLayout();return t?1+Math.ceil(t.design_size.height/100):3}getGridOptions(){return{columns:12,min_columns:6}}static getStubConfig(){return{}}connectedCallback(){super.connectedCallback(),this._resizeObserver=new ResizeObserver(t=>{const e=t[0]?.contentRect.width??0;e&&Math.abs(e-this._hostWidth)>.5&&(this._hostWidth=e)}),this._resizeObserver.observe(this),this._edit.tryResume()&&this.requestUpdate(),this._fetchStarted&&!this._unsubEvents&&this._subscribe()}disconnectedCallback(){super.disconnectedCallback(),this._resizeObserver?.disconnect(),this._unsubEvents?.(),this._unsubEvents=void 0,this._edit.detach()}async _initialize(){try{if(!this._entryId){const t=await this._hass.callWS({type:"remote_mapper/list_remotes"});if(1!==t.remotes.length)return void(this._remoteChoices=t.remotes);this._entryId=t.remotes[0].entry_id}await this._fetchRemote(),await this._subscribe()}catch(t){this._error=String(t)}}async _subscribe(){this._unsubEvents||(this._unsubEvents=await this._hass.connection.subscribeEvents(t=>{t.data.entry_id===this._entryId&&this._fetchRemote()},"remote_mapper_updated"))}async _fetchRemote(){try{this._remote=await this._hass.callWS({type:"remote_mapper/get_remote",entry_id:this._entryId}),this._error=void 0}catch(t){this._error=String(t)}}config(){return this._currentLayout()}scale(){return this._transform()?.scale??1}slotEl(t){return this.shadowRoot?.querySelector(`[data-slot-id="${CSS.escape(t)}"]`)??null}badgeEl(){return this.shadowRoot?.querySelector(".badge")??null}async saveWorking(t){const e=this._currentLayout();if(!e)return!1;try{return await this._hass.callWS({type:"remote_mapper/save_layout",entry_id:this._entryId,card_layout:{...$t(e),widgets:t}}),!0}catch(t){return this.notify(`Layout save failed: ${String(t)}`),!1}}openSettings(t){this._openEditor(t)}notify(t){window.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:t}}))}_currentLayout(){if(!this._remote)return;const t=this._remote.layout?.actions??[],e=this._remote.card_layout,i=e&&Array.isArray(e.widgets)&&e.design_size?e:zt(t),s=new Set(i.widgets.map(t=>t.id)),o=t.filter(t=>!s.has(t));if(!o.length)return{...i,canvas_id:this._entryId};const r=zt(o).widgets.map((t,e)=>({...t,y:i.design_size.height+Pt+80*Math.floor(e/3)}));return{...i,canvas_id:this._entryId,design_size:{width:i.design_size.width,height:i.design_size.height+80*(Math.floor((r.length-1)/3)+1)+Pt},widgets:[...i.widgets,...r]}}_transform(){const t=this._currentLayout();if(!t)return;const e=this._hostWidth||this.getBoundingClientRect().width||300;return function(t,e){{const i=Math.max(1,e)/t.width;return{scale:i,offsetX:0,offsetY:0,viewportHeight:t.height*i}}}(t.design_size,e)}async _runSlot(t){const e=this._remote?.slots[t];if(e&&!e.archived){this._flash=t,setTimeout(()=>{this._flash=void 0},400);try{await this._hass.callWS({type:"remote_mapper/run_slot",entry_id:this._entryId,action_id:t})}catch(t){this._error=String(t)}}}_slotSummary(t){if(!t)return"unassigned";if(t.materialized)return"automation";const e=It(t.sequence??[]);if("custom"!==e.mode)return e.entity;const i=t.sequence?.[0];return i?i.action??i.service??Object.keys(i)[0]:"empty"}async _openEditor(t){const e=this._remote?.slots[t],i=e?.sequence??[],s=It(i);this._editingAction=t,this._quickMode="custom"===s.mode?"scene":s.mode,this._quickEntity=s.entity,this._editorTab="custom"===s.mode&&i.length?"yaml":"quick",this._draft=JSON.stringify(i,null,2),this._yamlValue=i,this._yamlValid=!0,this._draftError=void 0,this._draftMaterialized=e?.materialized??!1,this._editingLive=void 0,(customElements.get("ha-form")?Promise.resolve(!0):(At||(At=(async()=>{try{const t=await St(),e=t?.createCardElement?.({type:"entities",entities:[]});await(e?.constructor?.getConfigElement?.())}catch{}const t=await Promise.race([customElements.whenDefined("ha-form").then(()=>!0),new Promise(t=>setTimeout(()=>t(!1),2e3))]),e=t&&!!customElements.get("ha-form");return e||(At=null),e})()),At)).then(t=>{this._haFormOk=t}),(customElements.get("ha-yaml-editor")?Promise.resolve(!0):(Mt||(Mt=(async()=>{try{const t=await St(),e=t?.createCardElement?.({type:"conditional",conditions:[],card:{type:"entities",entities:[]}});await(e?.constructor?.getConfigElement?.())}catch{}if(customElements.get("ha-yaml-editor"))return!0;await new Promise(t=>setTimeout(t,300));const t=!!customElements.get("ha-yaml-editor");return t||(Mt=null),t})()),Mt)).then(t=>{this._yamlEditorOk=t}),e?.materialized&&this._hass.callWS({type:"remote_mapper/get_slot",entry_id:this._entryId,action_id:t}).then(e=>{this._editingAction===t&&e.live&&(this._editingLive=e.live,this._yamlValue=e.live.actions??[],this._draft=JSON.stringify(e.live.actions??[],null,2),this._editorTab="yaml")})}_closeEditor(){this._editingAction=void 0,this._draftError=void 0,this._editingLive=void 0,this._clearArtifacts=void 0}async _saveDraft(){const t={type:"remote_mapper/save_slot",entry_id:this._entryId,action_id:this._editingAction,materialized:this._draftMaterialized};if("quick"===this._editorTab){if(!this._quickEntity)return void(this._draftError="Pick an entity first");t.sequence=(e=this._quickMode,i=this._quickEntity,[{action:"scene"===e?"scene.turn_on":"toggle"===e?"homeassistant.toggle":"script.turn_on",target:{entity_id:i}}])}else if(this._yamlEditorOk){if(!this._yamlValid)return void(this._draftError="YAML is not valid");t.sequence=this._yamlValue??[]}else t.sequence_yaml=this._draft;var e,i;try{await this._hass.callWS(t),this._closeEditor()}catch(t){this._draftError=t.message??String(t)}}async _clearSlot(t){const e=await this._hass.callWS({type:"remote_mapper/clear_slot",entry_id:this._entryId,action_id:this._editingAction,...t?{decision:t,remember:this._clearRemember}:{}});if(e.needs_decision)return this._clearRemember=!1,void(this._clearArtifacts=e.artifacts);this._clearArtifacts=void 0,this._closeEditor()}async _snapshot(t){try{await this._hass.callWS({type:"remote_mapper/create_snapshot",entry_id:this._entryId,action_id:this._editingAction,re_snapshot:t}),this._closeEditor()}catch(t){this._draftError=t.message??String(t)}}async _toggleArchived(){const t=this._remote?.slots[this._editingAction];t&&(await this._hass.callWS({type:"remote_mapper/archive_slot",entry_id:this._entryId,action_id:this._editingAction,archived:!t.archived}),this._closeEditor())}async _openImport(){this._importError=void 0,this._importOverwrite=!1,this._importBusy=!1;try{const t=await this._hass.callWS({type:"remote_mapper/scan_import",entry_id:this._entryId});this._importSelected=new Set(t.proposals.flatMap((t,e)=>t.conflict?[]:[e])),this._importScan=t}catch(t){this._error=String(t)}}_closeImport(){this._importScan=void 0}async _applyImport(){const t=this._importScan.proposals.filter((t,e)=>this._importSelected.has(e));if(t.length){this._importBusy=!0;try{await this._hass.callWS({type:"remote_mapper/apply_import",entry_id:this._entryId,proposals:t,overwrite:this._importOverwrite}),this._closeImport()}catch(t){this._importError=t.message??String(t)}finally{this._importBusy=!1}}else this._closeImport()}render(){if(this._error)return W`<ha-card header="Remote Mapper">
        <div class="content error">${this._error}</div>
      </ha-card>`;if(this._remoteChoices)return W`<ha-card header="Remote Mapper">
        <div class="content">
          ${0===this._remoteChoices.length?W`<p>
                No remotes configured yet — add one in Settings → Devices &amp;
                services.
              </p>`:W`<p>
                  Several remotes exist — set <code>entry_id</code> in the card
                  config:
                </p>
                <ul>
                  ${this._remoteChoices.map(t=>W`<li>${t.title}: <code>${t.entry_id}</code></li>`)}
                </ul>`}
        </div>
      </ha-card>`;if(!this._remote)return W`<ha-card header="Remote Mapper">
        <div class="content">Loading…</div>
      </ha-card>`;const t=this._edit.active;return W`
      <ha-card>
        <div class="header">
          <span class="title">${this._remote.title}</span>
          <span class="header-buttons">
            ${t?W`
                  <button class="pencil" title="Import existing automations"
                    @click=${this._openImport}>⇪</button>
                  <button class="pencil" title="Undo"
                    ?disabled=${!this._edit.canUndo}
                    @click=${()=>this._edit.undo()}>↶</button>
                  <button class="pencil" title="Cancel (Esc)"
                    @click=${()=>this._edit.cancel()}>✕</button>
                  <button class="pencil active" title="Done — save layout"
                    @click=${()=>{this._edit.done()}}>✓</button>
                `:W`<button class="pencil" title="Edit layout & slots"
                  @click=${this._enterEdit}>✎</button>`}
          </span>
        </div>
        ${this._renderCanvas(t)}
        ${void 0!==this._editingAction?this._renderEditor():B}
        ${this._importScan?this._renderImport():B}
      </ha-card>
    `}_renderCanvas(t){const e=this._currentLayout(),i=this._transform(),s=t?this._edit.working:e.widgets,o=this._edit.selectedId;return W`
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
        ${t?this._renderEditChrome():B}
      </div>
    `}_renderTile(t,e,i){const s=this._remote.slots[t.id],o=["widget-slot","tile",s?"assigned":"empty",s?.archived?"archived":"",this._flash===t.id?"flash":"",i?"selected":""].join(" ");return W`
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
        ${s?.last_error?W`<span class="tile-badge error-badge" title=${s.last_error}
              >!</span
            >`:B}
        ${s?.archived?W`<span class="tile-badge">archived</span>`:B}
        ${e&&i?W`${["nw","ne","sw","se"].map(e=>W`
                <span
                  class="handle ${e}"
                  @pointerdown=${i=>this._edit.onHandlePointerDown(i,t.id,e)}
                ></span>
              `)}`:B}
      </div>
    `}_renderEditChrome(){const t=this._edit.selected,e=this._transform(),i=this._edit.dpadSteps,s="fine"===this._edit.dpadMode?"1":i.x===i.y?`${i.x}`:`${i.x}·${i.y}`,o=(t,e)=>i=>{i.preventDefault(),i.stopPropagation(),i.currentTarget.setPointerCapture(i.pointerId),this._edit.dpadPress(t,e)},r=()=>this._edit.dpadRelease();return W`
      ${t?this._renderChipbar(t,e):B}
      <div class="dpad-dock" @pointerdown=${t=>t.stopPropagation()}>
        ${t?W`<div class="badge"></div>`:B}
        <div class="dpad">
          <span></span>
          <button ?disabled=${!t} @pointerdown=${o(0,-1)}
            @pointerup=${r} @pointercancel=${r}
            @lostpointercapture=${r}>▲</button>
          <span></span>
          <button ?disabled=${!t} @pointerdown=${o(-1,0)}
            @pointerup=${r} @pointercancel=${r}
            @lostpointercapture=${r}>◀</button>
          <button class="step" title="Toggle nudge step (1 unit ↔ grid cell)"
            @click=${()=>this._edit.toggleDpadStep()}>${s}</button>
          <button ?disabled=${!t} @pointerdown=${o(1,0)}
            @pointerup=${r} @pointercancel=${r}
            @lostpointercapture=${r}>▶</button>
          <span></span>
          <button ?disabled=${!t} @pointerdown=${o(0,1)}
            @pointerup=${r} @pointercancel=${r}
            @lostpointercapture=${r}>▼</button>
          <span></span>
        </div>
      </div>
    `}_renderChipbar(t,e){const i=this._hostWidth||300,s=e.offsetX+(t.x+t.w/2)*e.scale,o=e.offsetY+t.y*e.scale,r=o<46,n=r?e.offsetY+(t.y+t.h)*e.scale+6:o-6,a=Math.min(Math.max(s,110),Math.max(110,i-110));return W`
      <div
        class="chipbar"
        style="left:${a}px;top:${n}px;transform:translate(-50%, ${r?"0":"-100%"})"
        @pointerdown=${t=>t.stopPropagation()}
      >
        <button title="Slot settings" @click=${()=>this.openSettings(t.id)}>
          ⚙
        </button>
        <button title="Send backward" @click=${()=>this._edit.zOp("backward")}>
          ↓
        </button>
        <button title="Bring forward" @click=${()=>this._edit.zOp("forward")}>
          ↑
        </button>
      </div>
    `}_renderEditor(){const t=this._remote.slots[this._editingAction];return W`
      <div class="modal-backdrop" @click=${this._closeEditor}>
        <div class="modal" @click=${t=>t.stopPropagation()}>
          <h3>${this._editingAction}</h3>
          ${this._editingLive?W`<p class="hint">
                Linked to <b>${this._editingLive.alias}</b> —
                <a href=${this._editingLive.edit_url}>Edit in HA</a>. Unticking
                "automation" below deletes it on Save and moves its actions into
                this card. Cancel keeps things as they are.
              </p>`:B}
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
            <input
              type="checkbox"
              .checked=${this._draftMaterialized}
              @change=${t=>{this._draftMaterialized=t.target.checked}}
            />
            Create as automation (editable/traceable in HA)
          </label>
          ${this._draftError?W`<p class="error">${this._draftError}</p>`:B}
          <div class="buttons">
            <button @click=${this._saveDraft}>Save</button>
            <button @click=${this._closeEditor}>Cancel</button>
            <button
              title="Capture the current room state as a scene on this button"
              @click=${()=>this._snapshot(!1)}
            >
              📸 Snapshot
            </button>
            ${t?.scene_id?W`<button
                  title="Same scene, same entities, new states"
                  @click=${()=>this._snapshot(!0)}
                >
                  Re-snapshot
                </button>`:B}
            ${t?W`
                  <button class="danger" @click=${()=>this._clearSlot()}>
                    Clear
                  </button>
                  <button @click=${this._toggleArchived}>
                    ${t.archived?"Unarchive":"Archive"}
                  </button>
                `:B}
          </div>
          ${this._clearArtifacts?this._renderClearDialog():B}
        </div>
      </div>
    `}_renderQuickTab(){if(!this._haFormOk)return W`<p class="hint">
        Loading HA editor components… If this persists, use the YAML tab.
      </p>`;const t="scene"===this._quickMode?"scene":"script"===this._quickMode?"script":void 0,e=[{name:"mode",selector:{select:{mode:"dropdown",options:[{value:"scene",label:"Activate scene"},{value:"toggle",label:"Toggle entity"},{value:"script",label:"Run script"}]}}},{name:"entity",selector:{entity:t?{domain:t}:{}}}];return W`
      <ha-form
        .hass=${this._hass}
        .data=${{mode:this._quickMode,entity:this._quickEntity}}
        .schema=${e}
        .computeLabel=${t=>"mode"===t.name?"Action":"Entity"}
        @value-changed=${t=>{const e=t.detail.value;e.mode!==this._quickMode?(this._quickMode=e.mode,this._quickEntity=""):this._quickEntity=e.entity??""}}
      ></ha-form>
    `}_renderYamlTab(){return this._yamlEditorOk?W`
        <ha-yaml-editor
          .hass=${this._hass}
          .defaultValue=${this._yamlValue??[]}
          @value-changed=${t=>{const e=t.detail;this._yamlValid=!1!==e.isValid,this._yamlValid&&(this._yamlValue=e.value??[])}}
        ></ha-yaml-editor>
        ${this._yamlValid?B:W`<p class="error">Invalid YAML</p>`}
      `:W`
      <p class="hint">Sequence (YAML or JSON) — same as automation actions.</p>
      <textarea
        .value=${this._draft}
        spellcheck="false"
        @input=${t=>{this._draft=t.target.value}}
      ></textarea>
    `}_renderClearDialog(){const t=this._clearArtifacts,e=[];return t.scene&&e.push(`scene ${t.scene.entity_id??""}`),t.automation&&e.push("its automation"),W`
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
    `}_renderImport(){const t=this._importScan;return W`
      <div class="modal-backdrop" @click=${this._closeImport}>
        <div class="modal" @click=${t=>t.stopPropagation()}>
          <h3>Import automations</h3>
          ${0===t.proposals.length?W`<p class="hint">No importable automations found.</p>`:W`
                <p class="hint">
                  Selected slots take over; source automations are
                  <b>disabled</b>, not deleted.
                </p>
                <ul class="import-list">
                  ${t.proposals.map((t,e)=>W`
                      <li>
                        <label>
                          <input
                            type="checkbox"
                            .checked=${this._importSelected.has(e)}
                            @change=${t=>{const i=new Set(this._importSelected);t.target.checked?i.add(e):i.delete(e),this._importSelected=i}}
                          />
                          <b>${t.action_id}</b> ← ${t.alias}
                          ${t.conflict?W`<span class="warn">(overwrites slot)</span>`:B}
                          ${t.mixed?W`<span class="warn"
                                >(mixed remotes — source stays enabled)</span
                              >`:B}
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
              `:B}
          ${t.proposals.some(t=>t.conflict)?W`<label class="hint">
                <input
                  type="checkbox"
                  .checked=${this._importOverwrite}
                  @change=${t=>{this._importOverwrite=t.target.checked}}
                />
                Overwrite already-assigned slots
              </label>`:B}
          ${this._importError?W`<p class="error">${this._importError}</p>`:B}
          <div class="buttons">
            <button ?disabled=${this._importBusy} @click=${this._applyImport}>
              Apply
            </button>
            <button @click=${this._closeImport}>Cancel</button>
          </div>
        </div>
      </div>
    `}};Tt.styles=((t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new r(i,t,s)})`
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
    .header-buttons {
      display: flex;
      align-items: center;
      gap: 2px;
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
    .pencil:disabled {
      opacity: 0.35;
      cursor: default;
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
    .tabs {
      display: flex;
      gap: 4px;
      margin: 4px 0 8px;
    }
    .tabs button {
      border: 1px solid var(--divider-color, #444);
      border-radius: 6px 6px 0 0;
      background: none;
      color: var(--secondary-text-color);
      padding: 4px 12px;
      cursor: pointer;
      font: inherit;
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
    .error {
      color: var(--error-color, #db4437);
    }
    .hint {
      margin: 0 0 8px;
      font-size: 0.8em;
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
    .modal h3 {
      margin: 0 0 8px;
    }
    textarea {
      width: 100%;
      min-height: 160px;
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
      flex-wrap: wrap;
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
  `,t([ht()],Tt.prototype,"_remote",void 0),t([ht()],Tt.prototype,"_remoteChoices",void 0),t([ht()],Tt.prototype,"_error",void 0),t([ht()],Tt.prototype,"_flash",void 0),t([ht()],Tt.prototype,"_hostWidth",void 0),t([ht()],Tt.prototype,"_editingAction",void 0),t([ht()],Tt.prototype,"_editorTab",void 0),t([ht()],Tt.prototype,"_quickMode",void 0),t([ht()],Tt.prototype,"_quickEntity",void 0),t([ht()],Tt.prototype,"_draft",void 0),t([ht()],Tt.prototype,"_yamlValue",void 0),t([ht()],Tt.prototype,"_yamlValid",void 0),t([ht()],Tt.prototype,"_draftError",void 0),t([ht()],Tt.prototype,"_draftMaterialized",void 0),t([ht()],Tt.prototype,"_editingLive",void 0),t([ht()],Tt.prototype,"_haFormOk",void 0),t([ht()],Tt.prototype,"_yamlEditorOk",void 0),t([ht()],Tt.prototype,"_clearArtifacts",void 0),t([ht()],Tt.prototype,"_clearRemember",void 0),t([ht()],Tt.prototype,"_importScan",void 0),t([ht()],Tt.prototype,"_importSelected",void 0),t([ht()],Tt.prototype,"_importOverwrite",void 0),t([ht()],Tt.prototype,"_importBusy",void 0),t([ht()],Tt.prototype,"_importError",void 0),Tt=t([(t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)})(Ct)],Tt),window.customCards=window.customCards||[],window.customCards.push({type:Ct,name:"Remote Mapper Card",description:"Map physical remote buttons to actions on a canvas layout.",preview:!1}),console.info("%c REMOTE-MAPPER-CARD %c canvas ","color: white; background: #3f51b5; font-weight: 700;","color: #3f51b5; background: white; font-weight: 700;");export{Tt as RemoteMapperCard};
