import{i as E,b as L,a as k,C as S,O as b,R as g,d as W,x as l,q as D,f as C,s as F,t as j,u as R,A as d,v as q,h as _,j as u,o as T,w as U,S as y,y as z,M as I,T as P}from"./wallet-BEJTgdB0.js";import{n as M,r as c,o as v}from"./if-defined-5Al-vCnG.js";import"./index-DvjwgGmF.js";import"./index-BRMLZ9fn.js";import"./index-BtYYAriB.js";import"./index-lOk1Qhk-.js";import"./index-luf8llPF.js";import"./index-WtviJKYv.js";import"./index-hwpX6cec.js";import"./index-H1nc9QEI.js";import"./vendor-B9R9w7LK.js";import"./query-dpKa22bh.js";import"./ref-C-0KljE4.js";import"./ConstantsUtil-Dmg8YACJ.js";import"./index-BtcC4rCv.js";import"./index-85GSrhpv.js";const N=E`
  :host {
    margin-top: var(--wui-spacing-3xs);
  }
  wui-separator {
    margin: var(--wui-spacing-m) calc(var(--wui-spacing-m) * -1) var(--wui-spacing-xs)
      calc(var(--wui-spacing-m) * -1);
    width: calc(100% + var(--wui-spacing-s) * 2);
  }
`;var f=function(s,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(s,e,i,o);else for(var a=s.length-1;a>=0;a--)(r=s[a])&&(t=(n<3?r(t):n>3?r(e,i,t):r(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let h=class extends k{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=S.state.connectors,this.authConnector=this.connectors.find(e=>e.type==="AUTH"),this.remoteFeatures=b.state.remoteFeatures,this.isPwaLoading=!1,this.unsubscribe.push(S.subscribeKey("connectors",e=>{this.connectors=e,this.authConnector=this.connectors.find(i=>i.type==="AUTH")}),b.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}connectedCallback(){super.connectedCallback(),this.handlePwaFrameLoad()}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var t;let e=((t=this.remoteFeatures)==null?void 0:t.socials)||[];const i=!!this.authConnector,o=e==null?void 0:e.length,n=g.state.view==="ConnectSocials";return(!i||!o)&&!n?null:(n&&!o&&(e=W.DEFAULT_SOCIALS),l` <wui-flex flexDirection="column" gap="xs">
      ${e.map(r=>l`<wui-list-social
            @click=${()=>{this.onSocialClick(r)}}
            data-testid=${`social-selector-${r}`}
            name=${r}
            logo=${r}
            ?disabled=${this.isPwaLoading}
          ></wui-list-social>`)}
    </wui-flex>`)}async onSocialClick(e){e&&await D(e)}async handlePwaFrameLoad(){var e;if(C.isPWA()){this.isPwaLoading=!0;try{((e=this.authConnector)==null?void 0:e.provider)instanceof F&&await this.authConnector.provider.init()}catch(i){j.open({shortMessage:"Error loading embedded wallet in PWA",longMessage:i.message},"error")}finally{this.isPwaLoading=!1}}}};h.styles=N;f([M()],h.prototype,"tabIdx",void 0);f([c()],h.prototype,"connectors",void 0);f([c()],h.prototype,"authConnector",void 0);f([c()],h.prototype,"remoteFeatures",void 0);f([c()],h.prototype,"isPwaLoading",void 0);h=f([L("w3m-social-login-list")],h);const V=E`
  wui-flex {
    max-height: clamp(360px, 540px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
  }
  wui-flex::-webkit-scrollbar {
    display: none;
  }
  wui-flex.disabled {
    opacity: 0.3;
    pointer-events: none;
    user-select: none;
  }
`;var A=function(s,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(s,e,i,o);else for(var a=s.length-1;a>=0;a--)(r=s[a])&&(t=(n<3?r(t):n>3?r(e,i,t):r(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let $=class extends k{constructor(){super(),this.unsubscribe=[],this.checked=R.state.isLegalCheckboxChecked,this.unsubscribe.push(R.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var O;const{termsConditionsUrl:e,privacyPolicyUrl:i}=b.state,o=(O=b.state.features)==null?void 0:O.legalCheckbox,t=!!(e||i)&&!!o,r=t&&!this.checked,a=r?-1:void 0;return l`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${t?["0","s","s","s"]:"s"}
        gap="xs"
        class=${v(r?"disabled":void 0)}
      >
        <w3m-social-login-list tabIdx=${v(a)}></w3m-social-login-list>
      </wui-flex>
      <w3m-legal-footer></w3m-legal-footer>
    `}};$.styles=V;A([c()],$.prototype,"checked",void 0);$=A([L("w3m-connect-socials-view")],$);const G=E`
  wui-logo {
    width: 80px;
    height: 80px;
    border-radius: var(--wui-border-radius-m);
  }
  @keyframes shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(3px);
    }
    50% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
    100% {
      transform: translateX(0);
    }
  }
  wui-flex:first-child:not(:only-child) {
    position: relative;
  }
  wui-loading-thumbnail {
    position: absolute;
  }
  wui-icon-box {
    position: absolute;
    right: calc(var(--wui-spacing-3xs) * -1);
    bottom: calc(var(--wui-spacing-3xs) * -1);
    opacity: 0;
    transform: scale(0.5);
    transition: all var(--wui-ease-out-power-2) var(--wui-duration-lg);
  }
  wui-text[align='center'] {
    width: 100%;
    padding: 0px var(--wui-spacing-l);
  }
  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }
  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }
  .capitalize {
    text-transform: capitalize;
  }
`;var m=function(s,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(s,e,i,o);else for(var a=s.length-1;a>=0;a--)(r=s[a])&&(t=(n<3?r(t):n>3?r(e,i,t):r(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let p=class extends k{constructor(){super(),this.unsubscribe=[],this.socialProvider=d.state.socialProvider,this.socialWindow=d.state.socialWindow,this.error=!1,this.connecting=!1,this.message="Connect in the provider window",this.authConnector=S.getAuthConnector(),this.handleSocialConnection=async i=>{var o;if((o=i.data)!=null&&o.resultUri)if(i.origin===q.SECURE_SITE_ORIGIN){window.removeEventListener("message",this.handleSocialConnection,!1);try{if(this.authConnector&&!this.connecting){this.socialWindow&&(this.socialWindow.close(),d.setSocialWindow(void 0,_.state.activeChain)),this.connecting=!0,this.updateMessage();const n=i.data.resultUri;this.socialProvider&&u.sendEvent({type:"track",event:"SOCIAL_LOGIN_REQUEST_USER_DATA",properties:{provider:this.socialProvider}}),await T.connectExternal({id:this.authConnector.id,type:this.authConnector.type,socialUri:n},this.authConnector.chain),this.socialProvider&&(U.setConnectedSocialProvider(this.socialProvider),u.sendEvent({type:"track",event:"SOCIAL_LOGIN_SUCCESS",properties:{provider:this.socialProvider}}))}}catch{this.error=!0,this.updateMessage(),this.socialProvider&&u.sendEvent({type:"track",event:"SOCIAL_LOGIN_ERROR",properties:{provider:this.socialProvider}})}}else g.goBack(),y.showError("Untrusted Origin"),this.socialProvider&&u.sendEvent({type:"track",event:"SOCIAL_LOGIN_ERROR",properties:{provider:this.socialProvider}})},z.EmbeddedWalletAbortController.signal.addEventListener("abort",()=>{this.socialWindow&&(this.socialWindow.close(),d.setSocialWindow(void 0,_.state.activeChain))}),this.unsubscribe.push(d.subscribe(i=>{i.socialProvider&&(this.socialProvider=i.socialProvider),i.socialWindow&&(this.socialWindow=i.socialWindow),i.address&&(I.state.open||b.state.enableEmbedded)&&I.close()})),this.authConnector&&this.connectSocial()}disconnectedCallback(){var e;this.unsubscribe.forEach(i=>i()),window.removeEventListener("message",this.handleSocialConnection,!1),(e=this.socialWindow)==null||e.close(),d.setSocialWindow(void 0,_.state.activeChain)}render(){return l`
      <wui-flex
        data-error=${v(this.error)}
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-logo logo=${v(this.socialProvider)}></wui-logo>
          ${this.error?null:this.loaderTemplate()}
          <wui-icon-box
            backgroundColor="error-100"
            background="opaque"
            iconColor="error-100"
            icon="close"
            size="sm"
            border
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>
        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <wui-text align="center" variant="paragraph-500" color="fg-100"
            >Log in with
            <span class="capitalize">${this.socialProvider??"Social"}</span></wui-text
          >
          <wui-text align="center" variant="small-400" color=${this.error?"error-100":"fg-200"}
            >${this.message}</wui-text
          ></wui-flex
        >
      </wui-flex>
    `}loaderTemplate(){const e=P.state.themeVariables["--w3m-border-radius-master"],i=e?parseInt(e.replace("px",""),10):4;return l`<wui-loading-thumbnail radius=${i*9}></wui-loading-thumbnail>`}connectSocial(){const e=setInterval(()=>{var i;(i=this.socialWindow)!=null&&i.closed&&(!this.connecting&&g.state.view==="ConnectingSocial"&&(this.socialProvider&&u.sendEvent({type:"track",event:"SOCIAL_LOGIN_CANCELED",properties:{provider:this.socialProvider}}),g.goBack()),clearInterval(e))},1e3);window.addEventListener("message",this.handleSocialConnection,!1)}updateMessage(){this.error?this.message="Something went wrong":this.connecting?this.message="Retrieving user data":this.message="Connect in the provider window"}};p.styles=G;m([c()],p.prototype,"socialProvider",void 0);m([c()],p.prototype,"socialWindow",void 0);m([c()],p.prototype,"error",void 0);m([c()],p.prototype,"connecting",void 0);m([c()],p.prototype,"message",void 0);p=m([L("w3m-connecting-social-view")],p);const B=E`
  @keyframes fadein {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  wui-shimmer {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: clamp(0px, var(--wui-border-radius-l), 40px) !important;
  }

  wui-qr-code {
    opacity: 0;
    animation-duration: 200ms;
    animation-timing-function: ease;
    animation-name: fadein;
    animation-fill-mode: forwards;
  }

  wui-logo {
    width: 80px;
    height: 80px;
    border-radius: var(--wui-border-radius-m);
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }
  wui-loading-thumbnail {
    position: absolute;
  }
  wui-icon-box {
    position: absolute;
    right: calc(var(--wui-spacing-3xs) * -1);
    bottom: calc(var(--wui-spacing-3xs) * -1);
    opacity: 0;
    transform: scale(0.5);
    transition: all var(--wui-ease-out-power-2) var(--wui-duration-lg);
  }
`;var x=function(s,e,i,o){var n=arguments.length,t=n<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,i):o,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(s,e,i,o);else for(var a=s.length-1;a>=0;a--)(r=s[a])&&(t=(n<3?r(t):n>3?r(e,i,t):r(e,i))||t);return n>3&&t&&Object.defineProperty(e,i,t),t};let w=class extends k{constructor(){super(),this.unsubscribe=[],this.timeout=void 0,this.socialProvider=d.state.socialProvider,this.uri=d.state.farcasterUrl,this.ready=!1,this.loading=!1,this.authConnector=S.getAuthConnector(),this.forceUpdate=()=>{this.requestUpdate()},this.unsubscribe.push(d.subscribeKey("farcasterUrl",e=>{e&&(this.uri=e,this.connectFarcaster())}),d.subscribeKey("socialProvider",e=>{e&&(this.socialProvider=e)})),window.addEventListener("resize",this.forceUpdate)}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.timeout),window.removeEventListener("resize",this.forceUpdate)}render(){return this.onRenderProxy(),l`${this.platformTemplate()}`}platformTemplate(){return C.isMobile()?l`${this.mobileTemplate()}`:l`${this.desktopTemplate()}`}desktopTemplate(){return this.loading?l`${this.loadingTemplate()}`:l`${this.qrTemplate()}`}qrTemplate(){return l` <wui-flex
      flexDirection="column"
      alignItems="center"
      .padding=${["0","xl","xl","xl"]}
      gap="xl"
    >
      <wui-shimmer borderRadius="l" width="100%"> ${this.qrCodeTemplate()} </wui-shimmer>

      <wui-text variant="paragraph-500" color="fg-100">
        Scan this QR Code with your phone
      </wui-text>
      ${this.copyTemplate()}
    </wui-flex>`}loadingTemplate(){return l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-logo logo="farcaster"></wui-logo>
          ${this.loaderTemplate()}
          <wui-icon-box
            backgroundColor="error-100"
            background="opaque"
            iconColor="error-100"
            icon="close"
            size="sm"
            border
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>
        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <wui-text align="center" variant="paragraph-500" color="fg-100">
            Loading user data
          </wui-text>
          <wui-text align="center" variant="small-400" color="fg-200">
            Please wait a moment while we load your data.
          </wui-text>
        </wui-flex>
      </wui-flex>
    `}mobileTemplate(){return l` <wui-flex
      flexDirection="column"
      alignItems="center"
      .padding=${["3xl","xl","xl","xl"]}
      gap="xl"
    >
      <wui-flex justifyContent="center" alignItems="center">
        <wui-logo logo="farcaster"></wui-logo>
        ${this.loaderTemplate()}
        <wui-icon-box
          backgroundColor="error-100"
          background="opaque"
          iconColor="error-100"
          icon="close"
          size="sm"
          border
          borderColor="wui-color-bg-125"
        ></wui-icon-box>
      </wui-flex>
      <wui-flex flexDirection="column" alignItems="center" gap="xs">
        <wui-text align="center" variant="paragraph-500" color="fg-100"
          >Continue in Farcaster</span></wui-text
        >
        <wui-text align="center" variant="small-400" color="fg-200"
          >Accept connection request in the app</wui-text
        ></wui-flex
      >
      ${this.mobileLinkTemplate()}
    </wui-flex>`}loaderTemplate(){const e=P.state.themeVariables["--w3m-border-radius-master"],i=e?parseInt(e.replace("px",""),10):4;return l`<wui-loading-thumbnail radius=${i*9}></wui-loading-thumbnail>`}async connectFarcaster(){var e;if(this.authConnector)try{await((e=this.authConnector)==null?void 0:e.provider.connectFarcaster()),this.socialProvider&&(U.setConnectedSocialProvider(this.socialProvider),u.sendEvent({type:"track",event:"SOCIAL_LOGIN_REQUEST_USER_DATA",properties:{provider:this.socialProvider}})),this.loading=!0,await T.connectExternal(this.authConnector,this.authConnector.chain),this.socialProvider&&u.sendEvent({type:"track",event:"SOCIAL_LOGIN_SUCCESS",properties:{provider:this.socialProvider}}),this.loading=!1,I.close()}catch(i){this.socialProvider&&u.sendEvent({type:"track",event:"SOCIAL_LOGIN_ERROR",properties:{provider:this.socialProvider}}),g.goBack(),y.showError(i)}}mobileLinkTemplate(){return l`<wui-button
      size="md"
      ?loading=${this.loading}
      ?disabled=${!this.uri||this.loading}
      @click=${()=>{this.uri&&C.openHref(this.uri,"_blank")}}
    >
      Open farcaster</wui-button
    >`}onRenderProxy(){!this.ready&&this.uri&&(this.timeout=setTimeout(()=>{this.ready=!0},200))}qrCodeTemplate(){if(!this.uri||!this.ready)return null;const e=this.getBoundingClientRect().width-40;return l` <wui-qr-code
      size=${e}
      theme=${P.state.themeMode}
      uri=${this.uri}
      ?farcaster=${!0}
      data-testid="wui-qr-code"
      color=${v(P.state.themeVariables["--w3m-qr-color"])}
    ></wui-qr-code>`}copyTemplate(){const e=!this.uri||!this.ready;return l`<wui-link
      .disabled=${e}
      @click=${this.onCopyUri}
      color="fg-200"
      data-testid="copy-wc2-uri"
    >
      <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
      Copy link
    </wui-link>`}onCopyUri(){try{this.uri&&(C.copyToClopboard(this.uri),y.showSuccess("Link copied"))}catch{y.showError("Failed to copy")}}};w.styles=B;x([c()],w.prototype,"socialProvider",void 0);x([c()],w.prototype,"uri",void 0);x([c()],w.prototype,"ready",void 0);x([c()],w.prototype,"loading",void 0);w=x([L("w3m-connecting-farcaster-view")],w);export{$ as W3mConnectSocialsView,w as W3mConnectingFarcasterView,p as W3mConnectingSocialView};
