import{M as w,_ as Z,R as c,i as v,r as j,a as y,x as l,n as P,h as se,X as re,e as p,t as L,J as ce,o as U,f as G,O as $,C as H,A as q,S as A,G as R,T as le,a3 as de,d as ue,c as pe}from"./main-Co8PVOft.js";import{c as f,n as u,r as d,o as z,U as he}from"./if-defined-BCv8M4dT.js";import"./index-BEcAuRLg.js";import"./index-DI7Wdswo.js";import"./index-m5nZAhyP.js";import"./index-BREAf_ZQ.js";import"./index-CzWIyJaw.js";import"./index-ACyZEJ-m.js";import"./index-DVgqn2m2.js";import"./style-B_l4csH6.js";const ee={isUnsupportedChainView(){return c.state.view==="UnsupportedChain"||c.state.view==="SwitchNetwork"&&c.state.history.includes("UnsupportedChain")},async safeClose(){if(this.isUnsupportedChainView()){w.shake();return}if(await Z.isSIWXCloseDisabled()){w.shake();return}w.close()}},we=v`
  :host {
    display: block;
    border-radius: clamp(0px, var(--wui-border-radius-l), 44px);
    box-shadow: 0 0 0 1px var(--wui-color-gray-glass-005);
    background-color: var(--wui-color-modal-bg);
    overflow: hidden;
  }

  :host([data-embedded='true']) {
    box-shadow:
      0 0 0 1px var(--wui-color-gray-glass-005),
      0px 4px 12px 4px var(--w3m-card-embedded-shadow-color);
  }
`;var me=function(s,e,t,i){var a=arguments.length,o=a<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(s,e,t,i);else for(var r=s.length-1;r>=0;r--)(n=s[r])&&(o=(a<3?n(o):a>3?n(e,t,o):n(e,t))||o);return a>3&&o&&Object.defineProperty(e,t,o),o};let M=class extends y{render(){return l`<slot></slot>`}};M.styles=[j,we];M=me([f("wui-card")],M);const fe=v`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--wui-spacing-s);
    border-radius: var(--wui-border-radius-s);
    border: 1px solid var(--wui-color-dark-glass-100);
    box-sizing: border-box;
    background-color: var(--wui-color-bg-325);
    box-shadow: 0px 0px 16px 0px rgba(0, 0, 0, 0.25);
  }

  wui-flex {
    width: 100%;
  }

  wui-text {
    word-break: break-word;
    flex: 1;
  }

  .close {
    cursor: pointer;
  }

  .icon-box {
    height: 40px;
    width: 40px;
    border-radius: var(--wui-border-radius-3xs);
    background-color: var(--local-icon-bg-value);
  }
`;var N=function(s,e,t,i){var a=arguments.length,o=a<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(s,e,t,i);else for(var r=s.length-1;r>=0;r--)(n=s[r])&&(o=(a<3?n(o):a>3?n(e,t,o):n(e,t))||o);return a>3&&o&&Object.defineProperty(e,t,o),o};let k=class extends y{constructor(){super(...arguments),this.message="",this.backgroundColor="accent-100",this.iconColor="accent-100",this.icon="info"}render(){return this.style.cssText=`
      --local-icon-bg-value: var(--wui-color-${this.backgroundColor});
   `,l`
      <wui-flex flexDirection="row" justifyContent="space-between" alignItems="center">
        <wui-flex columnGap="xs" flexDirection="row" alignItems="center">
          <wui-flex
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            class="icon-box"
          >
            <wui-icon color=${this.iconColor} size="md" name=${this.icon}></wui-icon>
          </wui-flex>
          <wui-text variant="small-500" color="bg-350" data-testid="wui-alertbar-text"
            >${this.message}</wui-text
          >
        </wui-flex>
        <wui-icon
          class="close"
          color="bg-350"
          size="sm"
          name="close"
          @click=${this.onClose}
        ></wui-icon>
      </wui-flex>
    `}onClose(){P.close()}};k.styles=[j,fe];N([u()],k.prototype,"message",void 0);N([u()],k.prototype,"backgroundColor",void 0);N([u()],k.prototype,"iconColor",void 0);N([u()],k.prototype,"icon",void 0);k=N([f("wui-alertbar")],k);const ge=v`
  :host {
    display: block;
    position: absolute;
    top: var(--wui-spacing-s);
    left: var(--wui-spacing-l);
    right: var(--wui-spacing-l);
    opacity: 0;
    pointer-events: none;
  }
`;var te=function(s,e,t,i){var a=arguments.length,o=a<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(s,e,t,i);else for(var r=s.length-1;r>=0;r--)(n=s[r])&&(o=(a<3?n(o):a>3?n(e,t,o):n(e,t))||o);return a>3&&o&&Object.defineProperty(e,t,o),o};const be={info:{backgroundColor:"fg-350",iconColor:"fg-325",icon:"info"},success:{backgroundColor:"success-glass-reown-020",iconColor:"success-125",icon:"checkmark"},warning:{backgroundColor:"warning-glass-reown-020",iconColor:"warning-100",icon:"warningCircle"},error:{backgroundColor:"error-glass-reown-020",iconColor:"error-125",icon:"exclamationTriangle"}};let _=class extends y{constructor(){super(),this.unsubscribe=[],this.open=P.state.open,this.onOpen(!0),this.unsubscribe.push(P.subscribeKey("open",e=>{this.open=e,this.onOpen(!1)}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const{message:e,variant:t}=P.state,i=be[t];return l`
      <wui-alertbar
        message=${e}
        backgroundColor=${i==null?void 0:i.backgroundColor}
        iconColor=${i==null?void 0:i.iconColor}
        icon=${i==null?void 0:i.icon}
      ></wui-alertbar>
    `}onOpen(e){this.open?(this.animate([{opacity:0,transform:"scale(0.85)"},{opacity:1,transform:"scale(1)"}],{duration:150,fill:"forwards",easing:"ease"}),this.style.cssText="pointer-events: auto"):e||(this.animate([{opacity:1,transform:"scale(1)"},{opacity:0,transform:"scale(0.85)"}],{duration:150,fill:"forwards",easing:"ease"}),this.style.cssText="pointer-events: none")}};_.styles=ge;te([d()],_.prototype,"open",void 0);_=te([f("w3m-alertbar")],_);const ve=v`
  button {
    display: block;
    display: flex;
    align-items: center;
    padding: var(--wui-spacing-xxs);
    gap: var(--wui-spacing-xxs);
    transition: all var(--wui-ease-out-power-1) var(--wui-duration-md);
    border-radius: var(--wui-border-radius-xxs);
  }

  wui-image {
    border-radius: 100%;
    width: var(--wui-spacing-xl);
    height: var(--wui-spacing-xl);
  }

  wui-icon-box {
    width: var(--wui-spacing-xl);
    height: var(--wui-spacing-xl);
  }

  button:hover {
    background-color: var(--wui-color-gray-glass-002);
  }

  button:active {
    background-color: var(--wui-color-gray-glass-005);
  }
`;var oe=function(s,e,t,i){var a=arguments.length,o=a<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(s,e,t,i);else for(var r=s.length-1;r>=0;r--)(n=s[r])&&(o=(a<3?n(o):a>3?n(e,t,o):n(e,t))||o);return a>3&&o&&Object.defineProperty(e,t,o),o};let B=class extends y{constructor(){super(...arguments),this.imageSrc=""}render(){return l`<button>
      ${this.imageTemplate()}
      <wui-icon size="xs" color="fg-200" name="chevronBottom"></wui-icon>
    </button>`}imageTemplate(){return this.imageSrc?l`<wui-image src=${this.imageSrc} alt="select visual"></wui-image>`:l`<wui-icon-box
      size="xxs"
      iconColor="fg-200"
      backgroundColor="fg-100"
      background="opaque"
      icon="networkPlaceholder"
    ></wui-icon-box>`}};B.styles=[j,se,re,ve];oe([u()],B.prototype,"imageSrc",void 0);B=oe([f("wui-select")],B);const ye=v`
  :host {
    height: 64px;
  }

  wui-text {
    text-transform: capitalize;
  }

  wui-flex.w3m-header-title {
    transform: translateY(0);
    opacity: 1;
  }

  wui-flex.w3m-header-title[view-direction='prev'] {
    animation:
      slide-down-out 120ms forwards var(--wui-ease-out-power-2),
      slide-down-in 120ms forwards var(--wui-ease-out-power-2);
    animation-delay: 0ms, 200ms;
  }

  wui-flex.w3m-header-title[view-direction='next'] {
    animation:
      slide-up-out 120ms forwards var(--wui-ease-out-power-2),
      slide-up-in 120ms forwards var(--wui-ease-out-power-2);
    animation-delay: 0ms, 200ms;
  }

  wui-icon-link[data-hidden='true'] {
    opacity: 0 !important;
    pointer-events: none;
  }

  @keyframes slide-up-out {
    from {
      transform: translateY(0px);
      opacity: 1;
    }
    to {
      transform: translateY(3px);
      opacity: 0;
    }
  }

  @keyframes slide-up-in {
    from {
      transform: translateY(-3px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slide-down-out {
    from {
      transform: translateY(0px);
      opacity: 1;
    }
    to {
      transform: translateY(-3px);
      opacity: 0;
    }
  }

  @keyframes slide-down-in {
    from {
      transform: translateY(3px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;var g=function(s,e,t,i){var a=arguments.length,o=a<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(s,e,t,i);else for(var r=s.length-1;r>=0;r--)(n=s[r])&&(o=(a<3?n(o):a>3?n(e,t,o):n(e,t))||o);return a>3&&o&&Object.defineProperty(e,t,o),o};const Ce=["SmartSessionList"];function K(){var n,r,W,x,T,E,O;const s=(r=(n=c.state.data)==null?void 0:n.connector)==null?void 0:r.name,e=(x=(W=c.state.data)==null?void 0:W.wallet)==null?void 0:x.name,t=(E=(T=c.state.data)==null?void 0:T.network)==null?void 0:E.name,i=e??s,a=H.getConnectors();return{Connect:`Connect ${a.length===1&&((O=a[0])==null?void 0:O.id)==="w3m-email"?"Email":""} Wallet`,Create:"Create Wallet",ChooseAccountName:void 0,Account:void 0,AccountSettings:void 0,AllWallets:"All Wallets",ApproveTransaction:"Approve Transaction",BuyInProgress:"Buy",ConnectingExternal:i??"Connect Wallet",ConnectingWalletConnect:i??"WalletConnect",ConnectingWalletConnectBasic:"WalletConnect",ConnectingSiwe:"Sign In",Convert:"Convert",ConvertSelectToken:"Select token",ConvertPreview:"Preview convert",Downloads:i?`Get ${i}`:"Downloads",EmailLogin:"Email Login",EmailVerifyOtp:"Confirm Email",EmailVerifyDevice:"Register Device",GetWallet:"Get a wallet",Networks:"Choose Network",OnRampProviders:"Choose Provider",OnRampActivity:"Activity",OnRampTokenSelect:"Select Token",OnRampFiatSelect:"Select Currency",Pay:"How you pay",Profile:void 0,ProfileWallets:"Wallets",SwitchNetwork:t??"Switch Network",SwitchAddress:"Switch Address",Transactions:"Activity",UnsupportedChain:"Switch Network",UpgradeEmailWallet:"Upgrade your Wallet",UpdateEmailWallet:"Edit Email",UpdateEmailPrimaryOtp:"Confirm Current Email",UpdateEmailSecondaryOtp:"Confirm New Email",WhatIsABuy:"What is Buy?",RegisterAccountName:"Choose name",RegisterAccountNameSuccess:"",WalletReceive:"Receive",WalletCompatibleNetworks:"Compatible Networks",Swap:"Swap",SwapSelectToken:"Select token",SwapPreview:"Preview swap",WalletSend:"Send",WalletSendPreview:"Review send",WalletSendSelectToken:"Select Token",WhatIsANetwork:"What is a network?",WhatIsAWallet:"What is a wallet?",ConnectWallets:"Connect wallet",ConnectSocials:"All socials",ConnectingSocial:q.state.socialProvider?q.state.socialProvider:"Connect Social",ConnectingMultiChain:"Select chain",ConnectingFarcaster:"Farcaster",SwitchActiveChain:"Switch chain",SmartSessionCreated:void 0,SmartSessionList:"Smart Sessions",SIWXSignMessage:"Sign In",PayLoading:"Payment in progress"}}let h=class extends y{constructor(){super(),this.unsubscribe=[],this.heading=K()[c.state.view],this.network=p.state.activeCaipNetwork,this.networkImage=L.getNetworkImage(this.network),this.showBack=!1,this.prevHistoryLength=1,this.view=c.state.view,this.viewDirection="",this.headerText=K()[c.state.view],this.unsubscribe.push(ce.subscribeNetworkImages(()=>{this.networkImage=L.getNetworkImage(this.network)}),c.subscribeKey("view",e=>{setTimeout(()=>{this.view=e,this.headerText=K()[e]},U.ANIMATION_DURATIONS.HeaderText),this.onViewChange(),this.onHistoryChange()}),p.subscribeKey("activeCaipNetwork",e=>{this.network=e,this.networkImage=L.getNetworkImage(this.network)}))}disconnectCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`
      <wui-flex .padding=${this.getPadding()} justifyContent="space-between" alignItems="center">
        ${this.leftHeaderTemplate()} ${this.titleTemplate()} ${this.rightHeaderTemplate()}
      </wui-flex>
    `}onWalletHelp(){G.sendEvent({type:"track",event:"CLICK_WALLET_HELP"}),c.push("WhatIsAWallet")}async onClose(){await ee.safeClose()}rightHeaderTemplate(){var t,i,a;const e=(a=(i=(t=$)==null?void 0:t.state)==null?void 0:i.features)==null?void 0:a.smartSessions;return c.state.view!=="Account"||!e?this.closeButtonTemplate():l`<wui-flex>
      <wui-icon-link
        icon="clock"
        @click=${()=>c.push("SmartSessionList")}
        data-testid="w3m-header-smart-sessions"
      ></wui-icon-link>
      ${this.closeButtonTemplate()}
    </wui-flex> `}closeButtonTemplate(){return l`
      <wui-icon-link
        icon="close"
        @click=${this.onClose.bind(this)}
        data-testid="w3m-header-close"
      ></wui-icon-link>
    `}titleTemplate(){const e=Ce.includes(this.view);return l`
      <wui-flex
        view-direction="${this.viewDirection}"
        class="w3m-header-title"
        alignItems="center"
        gap="xs"
      >
        <wui-text variant="paragraph-700" color="fg-100" data-testid="w3m-header-text"
          >${this.headerText}</wui-text
        >
        ${e?l`<wui-tag variant="main">Beta</wui-tag>`:null}
      </wui-flex>
    `}leftHeaderTemplate(){var x;const{view:e}=c.state,t=e==="Connect",i=$.state.enableEmbedded,a=e==="ApproveTransaction",o=e==="ConnectingSiwe",n=e==="Account",r=$.state.enableNetworkSwitch,W=a||o||t&&i;return n&&r?l`<wui-select
        id="dynamic"
        data-testid="w3m-account-select-network"
        active-network=${z((x=this.network)==null?void 0:x.name)}
        @click=${this.onNetworks.bind(this)}
        imageSrc=${z(this.networkImage)}
      ></wui-select>`:this.showBack&&!W?l`<wui-icon-link
        data-testid="header-back"
        id="dynamic"
        icon="chevronLeft"
        @click=${this.onGoBack.bind(this)}
      ></wui-icon-link>`:l`<wui-icon-link
      data-hidden=${!t}
      id="dynamic"
      icon="helpCircle"
      @click=${this.onWalletHelp.bind(this)}
    ></wui-icon-link>`}onNetworks(){this.isAllowedNetworkSwitch()&&(G.sendEvent({type:"track",event:"CLICK_NETWORKS"}),c.push("Networks"))}isAllowedNetworkSwitch(){const e=p.getAllRequestedCaipNetworks(),t=e?e.length>1:!1,i=e==null?void 0:e.find(({id:a})=>{var o;return a===((o=this.network)==null?void 0:o.id)});return t||!i}getPadding(){return this.heading?["l","2l","l","2l"]:["0","2l","0","2l"]}onViewChange(){const{history:e}=c.state;let t=U.VIEW_DIRECTION.Next;e.length<this.prevHistoryLength&&(t=U.VIEW_DIRECTION.Prev),this.prevHistoryLength=e.length,this.viewDirection=t}async onHistoryChange(){var i;const{history:e}=c.state,t=(i=this.shadowRoot)==null?void 0:i.querySelector("#dynamic");e.length>1&&!this.showBack&&t?(await t.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.showBack=!0,t.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"})):e.length<=1&&this.showBack&&t&&(await t.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.showBack=!1,t.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}onGoBack(){c.goBack()}};h.styles=ye;g([d()],h.prototype,"heading",void 0);g([d()],h.prototype,"network",void 0);g([d()],h.prototype,"networkImage",void 0);g([d()],h.prototype,"showBack",void 0);g([d()],h.prototype,"prevHistoryLength",void 0);g([d()],h.prototype,"view",void 0);g([d()],h.prototype,"viewDirection",void 0);g([d()],h.prototype,"headerText",void 0);h=g([f("w3m-header")],h);const xe=v`
  :host {
    display: flex;
    column-gap: var(--wui-spacing-s);
    align-items: center;
    padding: var(--wui-spacing-xs) var(--wui-spacing-m) var(--wui-spacing-xs) var(--wui-spacing-xs);
    border-radius: var(--wui-border-radius-s);
    border: 1px solid var(--wui-color-gray-glass-005);
    box-sizing: border-box;
    background-color: var(--wui-color-bg-175);
    box-shadow:
      0px 14px 64px -4px rgba(0, 0, 0, 0.15),
      0px 8px 22px -6px rgba(0, 0, 0, 0.15);

    max-width: 300px;
  }

  :host wui-loading-spinner {
    margin-left: var(--wui-spacing-3xs);
  }
`;var S=function(s,e,t,i){var a=arguments.length,o=a<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(s,e,t,i);else for(var r=s.length-1;r>=0;r--)(n=s[r])&&(o=(a<3?n(o):a>3?n(e,t,o):n(e,t))||o);return a>3&&o&&Object.defineProperty(e,t,o),o};let m=class extends y{constructor(){super(...arguments),this.backgroundColor="accent-100",this.iconColor="accent-100",this.icon="checkmark",this.message="",this.loading=!1,this.iconType="default"}render(){return l`
      ${this.templateIcon()}
      <wui-text variant="paragraph-500" color="fg-100" data-testid="wui-snackbar-message"
        >${this.message}</wui-text
      >
    `}templateIcon(){return this.loading?l`<wui-loading-spinner size="md" color="accent-100"></wui-loading-spinner>`:this.iconType==="default"?l`<wui-icon size="xl" color=${this.iconColor} name=${this.icon}></wui-icon>`:l`<wui-icon-box
      size="sm"
      iconSize="xs"
      iconColor=${this.iconColor}
      backgroundColor=${this.backgroundColor}
      icon=${this.icon}
      background="opaque"
    ></wui-icon-box>`}};m.styles=[j,xe];S([u()],m.prototype,"backgroundColor",void 0);S([u()],m.prototype,"iconColor",void 0);S([u()],m.prototype,"icon",void 0);S([u()],m.prototype,"message",void 0);S([u()],m.prototype,"loading",void 0);S([u()],m.prototype,"iconType",void 0);m=S([f("wui-snackbar")],m);const ke=v`
  :host {
    display: block;
    position: absolute;
    opacity: 0;
    pointer-events: none;
    top: 11px;
    left: 50%;
    width: max-content;
  }
`;var ie=function(s,e,t,i){var a=arguments.length,o=a<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(s,e,t,i);else for(var r=s.length-1;r>=0;r--)(n=s[r])&&(o=(a<3?n(o):a>3?n(e,t,o):n(e,t))||o);return a>3&&o&&Object.defineProperty(e,t,o),o};const Se={loading:void 0,success:{backgroundColor:"success-100",iconColor:"success-100",icon:"checkmark"},error:{backgroundColor:"error-100",iconColor:"error-100",icon:"close"}};let D=class extends y{constructor(){super(),this.unsubscribe=[],this.timeout=void 0,this.open=A.state.open,this.unsubscribe.push(A.subscribeKey("open",e=>{this.open=e,this.onOpen()}))}disconnectedCallback(){clearTimeout(this.timeout),this.unsubscribe.forEach(e=>e())}render(){const{message:e,variant:t,svg:i}=A.state,a=Se[t],{icon:o,iconColor:n}=i??a??{};return l`
      <wui-snackbar
        message=${e}
        backgroundColor=${a==null?void 0:a.backgroundColor}
        iconColor=${n}
        icon=${o}
        .loading=${t==="loading"}
      ></wui-snackbar>
    `}onOpen(){clearTimeout(this.timeout),this.open?(this.animate([{opacity:0,transform:"translateX(-50%) scale(0.85)"},{opacity:1,transform:"translateX(-50%) scale(1)"}],{duration:150,fill:"forwards",easing:"ease"}),this.timeout&&clearTimeout(this.timeout),A.state.autoClose&&(this.timeout=setTimeout(()=>A.hide(),2500))):this.animate([{opacity:1,transform:"translateX(-50%) scale(1)"},{opacity:0,transform:"translateX(-50%) scale(0.85)"}],{duration:150,fill:"forwards",easing:"ease"})}};D.styles=ke;ie([d()],D.prototype,"open",void 0);D=ie([f("w3m-snackbar")],D);const Ae=v`
  :host {
    z-index: var(--w3m-z-index);
    display: block;
    backface-visibility: hidden;
    will-change: opacity;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    opacity: 0;
    background-color: var(--wui-cover);
    transition: opacity 0.2s var(--wui-ease-out-power-2);
    will-change: opacity;
  }

  :host(.open) {
    opacity: 1;
  }

  :host(.appkit-modal) {
    position: relative;
    pointer-events: unset;
    background: none;
    width: 100%;
    opacity: 1;
  }

  wui-card {
    max-width: var(--w3m-modal-width);
    width: 100%;
    position: relative;
    animation: zoom-in 0.2s var(--wui-ease-out-power-2);
    animation-fill-mode: backwards;
    outline: none;
    transition:
      border-radius var(--wui-duration-lg) var(--wui-ease-out-power-1),
      background-color var(--wui-duration-lg) var(--wui-ease-out-power-1);
    will-change: border-radius, background-color;
  }

  :host(.appkit-modal) wui-card {
    max-width: 400px;
  }

  wui-card[shake='true'] {
    animation:
      zoom-in 0.2s var(--wui-ease-out-power-2),
      w3m-shake 0.5s var(--wui-ease-out-power-2);
  }

  wui-flex {
    overflow-x: hidden;
    overflow-y: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  @media (max-height: 700px) and (min-width: 431px) {
    wui-flex {
      align-items: flex-start;
    }

    wui-card {
      margin: var(--wui-spacing-xxl) 0px;
    }
  }

  @media (max-width: 430px) {
    wui-flex {
      align-items: flex-end;
    }

    wui-card {
      max-width: 100%;
      border-bottom-left-radius: var(--local-border-bottom-mobile-radius);
      border-bottom-right-radius: var(--local-border-bottom-mobile-radius);
      border-bottom: none;
      animation: slide-in 0.2s var(--wui-ease-out-power-2);
    }

    wui-card[shake='true'] {
      animation:
        slide-in 0.2s var(--wui-ease-out-power-2),
        w3m-shake 0.5s var(--wui-ease-out-power-2);
    }
  }

  @keyframes zoom-in {
    0% {
      transform: scale(0.95) translateY(0);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }

  @keyframes slide-in {
    0% {
      transform: scale(1) translateY(50px);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }

  @keyframes w3m-shake {
    0% {
      transform: scale(1) rotate(0deg);
    }
    20% {
      transform: scale(1) rotate(-1deg);
    }
    40% {
      transform: scale(1) rotate(1.5deg);
    }
    60% {
      transform: scale(1) rotate(-1.5deg);
    }
    80% {
      transform: scale(1) rotate(1deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
    }
  }

  @keyframes w3m-view-height {
    from {
      height: var(--prev-height);
    }
    to {
      height: var(--new-height);
    }
  }
`;var C=function(s,e,t,i){var a=arguments.length,o=a<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(s,e,t,i);else for(var r=s.length-1;r>=0;r--)(n=s[r])&&(o=(a<3?n(o):a>3?n(e,t,o):n(e,t))||o);return a>3&&o&&Object.defineProperty(e,t,o),o};const F="scroll-lock";class b extends y{constructor(){super(),this.unsubscribe=[],this.abortController=void 0,this.hasPrefetched=!1,this.enableEmbedded=$.state.enableEmbedded,this.open=w.state.open,this.caipAddress=p.state.activeCaipAddress,this.caipNetwork=p.state.activeCaipNetwork,this.shake=w.state.shake,this.filterByNamespace=H.state.filterByNamespace,this.initializeTheming(),R.prefetchAnalyticsConfig(),this.unsubscribe.push(w.subscribeKey("open",e=>e?this.onOpen():this.onClose()),w.subscribeKey("shake",e=>this.shake=e),p.subscribeKey("activeCaipNetwork",e=>this.onNewNetwork(e)),p.subscribeKey("activeCaipAddress",e=>this.onNewAddress(e)),$.subscribeKey("enableEmbedded",e=>this.enableEmbedded=e),H.subscribeKey("filterByNamespace",e=>{var t;this.filterByNamespace!==e&&!((t=p.getAccountData(e))!=null&&t.caipAddress)&&(R.fetchRecommendedWallets(),this.filterByNamespace=e)}))}firstUpdated(){if(this.caipAddress){if(this.enableEmbedded){w.close(),this.prefetch();return}this.onNewAddress(this.caipAddress)}this.open&&this.onOpen(),this.enableEmbedded&&this.prefetch()}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),this.onRemoveKeyboardListener()}render(){return this.style.cssText=`
      --local-border-bottom-mobile-radius: ${this.enableEmbedded?"clamp(0px, var(--wui-border-radius-l), 44px)":"0px"};
    `,this.enableEmbedded?l`${this.contentTemplate()}
        <w3m-tooltip></w3m-tooltip> `:this.open?l`
          <wui-flex @click=${this.onOverlayClick.bind(this)} data-testid="w3m-modal-overlay">
            ${this.contentTemplate()}
          </wui-flex>
          <w3m-tooltip></w3m-tooltip>
        `:null}contentTemplate(){return l` <wui-card
      shake="${this.shake}"
      data-embedded="${z(this.enableEmbedded)}"
      role="alertdialog"
      aria-modal="true"
      tabindex="0"
      data-testid="w3m-modal-card"
    >
      <w3m-header></w3m-header>
      <w3m-router></w3m-router>
      <w3m-snackbar></w3m-snackbar>
      <w3m-alertbar></w3m-alertbar>
    </wui-card>`}async onOverlayClick(e){e.target===e.currentTarget&&await this.handleClose()}async handleClose(){await ee.safeClose()}initializeTheming(){const{themeVariables:e,themeMode:t}=le.state,i=he.getColorTheme(t);de(e,i)}onClose(){this.open=!1,this.classList.remove("open"),this.onScrollUnlock(),A.hide(),this.onRemoveKeyboardListener()}onOpen(){this.open=!0,this.classList.add("open"),this.onScrollLock(),this.onAddKeyboardListener()}onScrollLock(){const e=document.createElement("style");e.dataset.w3m=F,e.textContent=`
      body {
        touch-action: none;
        overflow: hidden;
        overscroll-behavior: contain;
      }
      w3m-modal {
        pointer-events: auto;
      }
    `,document.head.appendChild(e)}onScrollUnlock(){const e=document.head.querySelector(`style[data-w3m="${F}"]`);e&&e.remove()}onAddKeyboardListener(){var t;this.abortController=new AbortController;const e=(t=this.shadowRoot)==null?void 0:t.querySelector("wui-card");e==null||e.focus(),window.addEventListener("keydown",i=>{if(i.key==="Escape")this.handleClose();else if(i.key==="Tab"){const{tagName:a}=i.target;a&&!a.includes("W3M-")&&!a.includes("WUI-")&&(e==null||e.focus())}},this.abortController)}onRemoveKeyboardListener(){var e;(e=this.abortController)==null||e.abort(),this.abortController=void 0}async onNewAddress(e){const t=p.state.isSwitchingNamespace,i=ue.getPlainAddress(e);!i&&!t?w.close():t&&i&&c.goBack(),await Z.initializeIfEnabled(),this.caipAddress=e,p.setIsSwitchingNamespace(!1)}onNewNetwork(e){var Y,V,X;const t=this.caipNetwork,i=(Y=t==null?void 0:t.caipNetworkId)==null?void 0:Y.toString(),a=t==null?void 0:t.chainNamespace,o=(V=e==null?void 0:e.caipNetworkId)==null?void 0:V.toString(),n=e==null?void 0:e.chainNamespace,r=i!==o,x=r&&!(a!==n),T=(t==null?void 0:t.name)===pe.UNSUPPORTED_NETWORK_NAME,E=c.state.view==="ConnectingExternal",O=!((X=p.getAccountData(e==null?void 0:e.chainNamespace))!=null&&X.caipAddress),ae=c.state.view==="UnsupportedChain",ne=w.state.open;let I=!1;ne&&!E&&(O?r&&(I=!0):(ae||x&&!T)&&(I=!0)),I&&c.state.view!=="SIWXSignMessage"&&c.goBack(),this.caipNetwork=e}prefetch(){this.hasPrefetched||(R.prefetch(),R.fetchWalletsByPage({page:1}),this.hasPrefetched=!0)}}b.styles=Ae;C([u({type:Boolean})],b.prototype,"enableEmbedded",void 0);C([d()],b.prototype,"open",void 0);C([d()],b.prototype,"caipAddress",void 0);C([d()],b.prototype,"caipNetwork",void 0);C([d()],b.prototype,"shake",void 0);C([d()],b.prototype,"filterByNamespace",void 0);let J=class extends b{};J=C([f("w3m-modal")],J);let Q=class extends b{};Q=C([f("appkit-modal")],Q);export{Q as AppKitModal,J as W3mModal,b as W3mModalBase};
