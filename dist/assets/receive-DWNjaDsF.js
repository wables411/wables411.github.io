import{i as k,r as A,l as R,b as C,a as N,x as u,A as m,h as p,S as h,G as g,U as T,T as x,k as I,R as S,f as O}from"./wallet-BEJTgdB0.js";import{n as $,o as _,r as f}from"./if-defined-5Al-vCnG.js";import"./index-DYPYxsoY.js";import"./index-85GSrhpv.js";import"./index-hwpX6cec.js";import"./vendor-B9R9w7LK.js";import"./query-dpKa22bh.js";const E=k`
  button {
    display: flex;
    gap: var(--wui-spacing-xl);
    width: 100%;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xxs);
    padding: var(--wui-spacing-m) var(--wui-spacing-s);
  }

  wui-text {
    width: 100%;
  }

  wui-flex {
    width: auto;
  }

  .network-icon {
    width: var(--wui-spacing-2l);
    height: var(--wui-spacing-2l);
    border-radius: calc(var(--wui-spacing-2l) / 2);
    overflow: hidden;
    box-shadow:
      0 0 0 3px var(--wui-color-gray-glass-002),
      0 0 0 3px var(--wui-color-modal-bg);
  }
`;var b=function(n,e,i,t){var o=arguments.length,r=o<3?e:t===null?t=Object.getOwnPropertyDescriptor(e,i):t,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(n,e,i,t);else for(var a=n.length-1;a>=0;a--)(s=n[a])&&(r=(o<3?s(r):o>3?s(e,i,r):s(e,i))||r);return o>3&&r&&Object.defineProperty(e,i,r),r};let d=class extends N{constructor(){super(...arguments),this.networkImages=[""],this.text=""}render(){return u`
      <button>
        <wui-text variant="small-400" color="fg-200">${this.text}</wui-text>
        <wui-flex gap="3xs" alignItems="center">
          ${this.networksTemplate()}
          <wui-icon name="chevronRight" size="sm" color="fg-200"></wui-icon>
        </wui-flex>
      </button>
    `}networksTemplate(){const e=this.networkImages.slice(0,5);return u` <wui-flex class="networks">
      ${e==null?void 0:e.map(i=>u` <wui-flex class="network-icon"> <wui-image src=${i}></wui-image> </wui-flex>`)}
    </wui-flex>`}};d.styles=[A,R,E];b([$({type:Array})],d.prototype,"networkImages",void 0);b([$()],d.prototype,"text",void 0);d=b([C("wui-compatible-network")],d);const W=k`
  wui-compatible-network {
    margin-top: var(--wui-spacing-l);
  }
`;var w=function(n,e,i,t){var o=arguments.length,r=o<3?e:t===null?t=Object.getOwnPropertyDescriptor(e,i):t,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(n,e,i,t);else for(var a=n.length-1;a>=0;a--)(s=n[a])&&(r=(o<3?s(r):o>3?s(e,i,r):s(e,i))||r);return o>3&&r&&Object.defineProperty(e,i,r),r};let l=class extends N{constructor(){super(),this.unsubscribe=[],this.address=m.state.address,this.profileName=m.state.profileName,this.network=p.state.activeCaipNetwork,this.preferredAccountTypes=m.state.preferredAccountTypes,this.unsubscribe.push(m.subscribe(e=>{e.address?(this.address=e.address,this.profileName=e.profileName,this.preferredAccountTypes=e.preferredAccountTypes):h.showError("Account not found")}),p.subscribeKey("activeCaipNetwork",e=>{e!=null&&e.id&&(this.network=e)}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(!this.address)throw new Error("w3m-wallet-receive-view: No account provided");const e=g.getNetworkImage(this.network);return u` <wui-flex
      flexDirection="column"
      .padding=${["0","l","l","l"]}
      alignItems="center"
    >
      <wui-chip-button
        data-testid="receive-address-copy-button"
        @click=${this.onCopyClick.bind(this)}
        text=${T.getTruncateString({string:this.profileName||this.address||"",charsStart:this.profileName?18:4,charsEnd:this.profileName?0:4,truncate:this.profileName?"end":"middle"})}
        icon="copy"
        size="sm"
        imageSrc=${e||""}
        variant="gray"
      ></wui-chip-button>
      <wui-flex
        flexDirection="column"
        .padding=${["l","0","0","0"]}
        alignItems="center"
        gap="s"
      >
        <wui-qr-code
          size=${232}
          theme=${x.state.themeMode}
          uri=${this.address}
          ?arenaClear=${!0}
          color=${_(x.state.themeVariables["--w3m-qr-color"])}
          data-testid="wui-qr-code"
        ></wui-qr-code>
        <wui-text variant="paragraph-500" color="fg-100" align="center">
          Copy your address or scan this QR code
        </wui-text>
      </wui-flex>
      ${this.networkTemplate()}
    </wui-flex>`}networkTemplate(){var a,y;const e=p.getAllRequestedCaipNetworks(),i=p.checkIfSmartAccountEnabled(),t=p.state.activeCaipNetwork,o=e.filter(c=>(c==null?void 0:c.chainNamespace)===(t==null?void 0:t.chainNamespace));if(((a=this.preferredAccountTypes)==null?void 0:a[t==null?void 0:t.chainNamespace])===I.ACCOUNT_TYPES.SMART_ACCOUNT&&i)return t?u`<wui-compatible-network
        @click=${this.onReceiveClick.bind(this)}
        text="Only receive assets on this network"
        .networkImages=${[g.getNetworkImage(t)??""]}
      ></wui-compatible-network>`:null;const s=((y=o==null?void 0:o.filter(c=>{var v;return(v=c==null?void 0:c.assets)==null?void 0:v.imageId}))==null?void 0:y.slice(0,5)).map(g.getNetworkImage).filter(Boolean);return u`<wui-compatible-network
      @click=${this.onReceiveClick.bind(this)}
      text="Only receive assets on these networks"
      .networkImages=${s}
    ></wui-compatible-network>`}onReceiveClick(){S.push("WalletCompatibleNetworks")}onCopyClick(){try{this.address&&(O.copyToClopboard(this.address),h.showSuccess("Address copied"))}catch{h.showError("Failed to copy")}}};l.styles=W;w([f()],l.prototype,"address",void 0);w([f()],l.prototype,"profileName",void 0);w([f()],l.prototype,"network",void 0);w([f()],l.prototype,"preferredAccountTypes",void 0);l=w([C("w3m-wallet-receive-view")],l);export{l as W3mWalletReceiveView};
