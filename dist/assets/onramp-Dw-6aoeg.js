import{i as T,a as w,x as c,G as J,H as l,I as B,J as x,A as S,O as j,M as I,e as O,t as Z,f as G,W as H,R as D,d as V,b as M,B as Q,k as ee,S as L,T as te}from"./main-Co8PVOft.js";import{n as d,c as g,o as h,r as u}from"./if-defined-BCv8M4dT.js";import{D as ie,T as re}from"./index-ByyWY2Js.js";import"./index-m5nZAhyP.js";import"./index-DI7Wdswo.js";import"./index-CzWIyJaw.js";import"./index-CoR0IeBb.js";import{O as z}from"./index-DLcMOsDc.js";import"./index-BeWOnnDB.js";import"./index-CPjTeXbi.js";import"./index-DYNcMxEm.js";import"./index-GcBWbvvB.js";import"./index-BxEVLaon.js";import"./style-B_l4csH6.js";import"./index-DPcMalk5.js";import"./ref-ChPSOZXm.js";import"./ConstantsUtil-Dmg8YACJ.js";const oe=T`
  :host {
    width: 100%;
  }

  :host > wui-flex {
    width: 100%;
    padding: var(--wui-spacing-s);
    border-radius: var(--wui-border-radius-xs);
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--wui-spacing-s);
  }

  :host > wui-flex:hover {
    background-color: var(--wui-color-gray-glass-002);
  }

  .purchase-image-container {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    width: var(--wui-icon-box-size-lg);
    height: var(--wui-icon-box-size-lg);
  }

  .purchase-image-container wui-image {
    width: 100%;
    height: 100%;
    position: relative;
    border-radius: calc(var(--wui-icon-box-size-lg) / 2);
  }

  .purchase-image-container wui-image::after {
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    border-radius: calc(var(--wui-icon-box-size-lg) / 2);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  .purchase-image-container wui-icon-box {
    position: absolute;
    right: 0;
    bottom: 0;
    transform: translate(20%, 20%);
  }
`;var f=function(a,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,r);else for(var n=a.length-1;n>=0;n--)(s=a[n])&&(i=(o<3?s(i):o>3?s(e,t,i):s(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let p=class extends w{constructor(){super(...arguments),this.disabled=!1,this.color="inherit",this.label="Bought",this.purchaseValue="",this.purchaseCurrency="",this.date="",this.completed=!1,this.inProgress=!1,this.failed=!1,this.onClick=null,this.symbol=""}firstUpdated(){this.icon||this.fetchTokenImage()}render(){return c`
      <wui-flex>
        ${this.imageTemplate()}
        <wui-flex flexDirection="column" gap="4xs" flexGrow="1">
          <wui-flex gap="xxs" alignItems="center" justifyContent="flex-start">
            ${this.statusIconTemplate()}
            <wui-text variant="paragraph-500" color="fg-100"> ${this.label}</wui-text>
          </wui-flex>
          <wui-text variant="small-400" color="fg-200">
            + ${this.purchaseValue} ${this.purchaseCurrency}
          </wui-text>
        </wui-flex>
        ${this.inProgress?c`<wui-loading-spinner color="fg-200" size="md"></wui-loading-spinner>`:c`<wui-text variant="micro-700" color="fg-300"><span>${this.date}</span></wui-text>`}
      </wui-flex>
    `}async fetchTokenImage(){await J._fetchTokenImage(this.purchaseCurrency)}statusIconTemplate(){return this.inProgress?null:this.completed?this.boughtIconTemplate():this.errorIconTemplate()}errorIconTemplate(){return c`<wui-icon-box
      size="xxs"
      iconColor="error-100"
      backgroundColor="error-100"
      background="opaque"
      icon="close"
      borderColor="wui-color-bg-125"
    ></wui-icon-box>`}imageTemplate(){const e=this.icon||`https://avatar.vercel.sh/andrew.svg?size=50&text=${this.symbol}`;return c`<wui-flex class="purchase-image-container">
      <wui-image src=${e}></wui-image>
    </wui-flex>`}boughtIconTemplate(){return c`<wui-icon-box
      size="xxs"
      iconColor="success-100"
      backgroundColor="success-100"
      background="opaque"
      icon="arrowBottom"
      borderColor="wui-color-bg-125"
    ></wui-icon-box>`}};p.styles=[oe];f([d({type:Boolean})],p.prototype,"disabled",void 0);f([d()],p.prototype,"color",void 0);f([d()],p.prototype,"label",void 0);f([d()],p.prototype,"purchaseValue",void 0);f([d()],p.prototype,"purchaseCurrency",void 0);f([d()],p.prototype,"date",void 0);f([d({type:Boolean})],p.prototype,"completed",void 0);f([d({type:Boolean})],p.prototype,"inProgress",void 0);f([d({type:Boolean})],p.prototype,"failed",void 0);f([d()],p.prototype,"onClick",void 0);f([d()],p.prototype,"symbol",void 0);f([d()],p.prototype,"icon",void 0);p=f([g("w3m-onramp-activity-item")],p);const se=T`
  :host > wui-flex {
    height: 500px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
    padding: var(--wui-spacing-m);
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  :host > wui-flex::-webkit-scrollbar {
    display: none;
  }

  :host > wui-flex > wui-flex {
    width: 100%;
  }

  wui-transaction-list-item-loader {
    width: 100%;
  }
`;var U=function(a,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,r);else for(var n=a.length-1;n>=0;n--)(s=a[n])&&(i=(o<3?s(i):o>3?s(e,t,i):s(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};const ne=7;let A=class extends w{constructor(){super(),this.unsubscribe=[],this.selectedOnRampProvider=l.state.selectedProvider,this.loading=!1,this.coinbaseTransactions=B.state.coinbaseTransactions,this.tokenImages=x.state.tokenImages,this.unsubscribe.push(l.subscribeKey("selectedProvider",e=>{this.selectedOnRampProvider=e}),x.subscribeKey("tokenImages",e=>this.tokenImages=e),()=>{clearTimeout(this.refetchTimeout)},B.subscribe(e=>{this.coinbaseTransactions={...e.coinbaseTransactions}})),B.clearCursor(),this.fetchTransactions()}render(){return c`
      <wui-flex flexDirection="column" .padding=${["0","s","s","s"]} gap="xs">
        ${this.loading?this.templateLoading():this.templateTransactionsByYear()}
      </wui-flex>
    `}templateTransactions(e){return e==null?void 0:e.map(t=>{var n,N,F;const r=ie.formatDate((n=t==null?void 0:t.metadata)==null?void 0:n.minedAt),o=t.transfers[0],i=o==null?void 0:o.fungible_info;if(!i)return null;const s=((N=i==null?void 0:i.icon)==null?void 0:N.url)||((F=this.tokenImages)==null?void 0:F[i.symbol||""]);return c`
        <w3m-onramp-activity-item
          label="Bought"
          .completed=${t.metadata.status==="ONRAMP_TRANSACTION_STATUS_SUCCESS"}
          .inProgress=${t.metadata.status==="ONRAMP_TRANSACTION_STATUS_IN_PROGRESS"}
          .failed=${t.metadata.status==="ONRAMP_TRANSACTION_STATUS_FAILED"}
          purchaseCurrency=${h(i.symbol)}
          purchaseValue=${o.quantity.numeric}
          date=${r}
          icon=${h(s)}
          symbol=${h(i.symbol)}
        ></w3m-onramp-activity-item>
      `})}templateTransactionsByYear(){return Object.keys(this.coinbaseTransactions).sort().reverse().map(t=>{const r=parseInt(t,10);return new Array(12).fill(null).map((i,s)=>s).reverse().map(i=>{var N;const s=re.getTransactionGroupTitle(r,i),n=(N=this.coinbaseTransactions[r])==null?void 0:N[i];return n?c`
          <wui-flex flexDirection="column">
            <wui-flex
              alignItems="center"
              flexDirection="row"
              .padding=${["xs","s","s","s"]}
            >
              <wui-text variant="paragraph-500" color="fg-200">${s}</wui-text>
            </wui-flex>
            <wui-flex flexDirection="column" gap="xs">
              ${this.templateTransactions(n)}
            </wui-flex>
          </wui-flex>
        `:null})})}async fetchTransactions(){await this.fetchCoinbaseTransactions()}async fetchCoinbaseTransactions(){const e=S.state.address,t=j.state.projectId;if(!e)throw new Error("No address found");if(!t)throw new Error("No projectId found");this.loading=!0,await B.fetchTransactions(e,"coinbase"),this.loading=!1,this.refetchLoadingTransactions()}refetchLoadingTransactions(){var o;const e=new Date;if((((o=this.coinbaseTransactions[e.getFullYear()])==null?void 0:o[e.getMonth()])||[]).filter(i=>i.metadata.status==="ONRAMP_TRANSACTION_STATUS_IN_PROGRESS").length===0){clearTimeout(this.refetchTimeout);return}this.refetchTimeout=setTimeout(async()=>{const i=S.state.address;await B.fetchTransactions(i,"coinbase"),this.refetchLoadingTransactions()},3e3)}templateLoading(){return Array(ne).fill(c` <wui-transaction-list-item-loader></wui-transaction-list-item-loader> `).map(e=>e)}};A.styles=se;U([u()],A.prototype,"selectedOnRampProvider",void 0);U([u()],A.prototype,"loading",void 0);U([u()],A.prototype,"coinbaseTransactions",void 0);U([u()],A.prototype,"tokenImages",void 0);A=U([g("w3m-onramp-activity-view")],A);const ae=T`
  :host > wui-grid {
    max-height: 360px;
    overflow: auto;
  }

  wui-flex {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-flex.disabled {
    opacity: 0.3;
    pointer-events: none;
    user-select: none;
  }
`;var W=function(a,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,r);else for(var n=a.length-1;n>=0;n--)(s=a[n])&&(i=(o<3?s(i):o>3?s(e,t,i):s(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let P=class extends w{constructor(){super(),this.unsubscribe=[],this.selectedCurrency=l.state.paymentCurrency,this.currencies=l.state.paymentCurrencies,this.currencyImages=x.state.currencyImages,this.checked=z.state.isLegalCheckboxChecked,this.unsubscribe.push(l.subscribe(e=>{this.selectedCurrency=e.paymentCurrency,this.currencies=e.paymentCurrencies}),x.subscribeKey("currencyImages",e=>this.currencyImages=e),z.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var n;const{termsConditionsUrl:e,privacyPolicyUrl:t}=j.state,r=(n=j.state.features)==null?void 0:n.legalCheckbox,s=!!(e||t)&&!!r&&!this.checked;return c`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${["0","s","s","s"]}
        gap="xs"
        class=${h(s?"disabled":void 0)}
      >
        ${this.currenciesTemplate(s)}
      </wui-flex>
      <w3m-legal-footer></w3m-legal-footer>
    `}currenciesTemplate(e=!1){return this.currencies.map(t=>{var r;return c`
        <wui-list-item
          imageSrc=${h((r=this.currencyImages)==null?void 0:r[t.id])}
          @click=${()=>this.selectCurrency(t)}
          variant="image"
          tabIdx=${h(e?-1:void 0)}
        >
          <wui-text variant="paragraph-500" color="fg-100">${t.id}</wui-text>
        </wui-list-item>
      `})}selectCurrency(e){e&&(l.setPaymentCurrency(e),I.close())}};P.styles=ae;W([u()],P.prototype,"selectedCurrency",void 0);W([u()],P.prototype,"currencies",void 0);W([u()],P.prototype,"currencyImages",void 0);W([u()],P.prototype,"checked",void 0);P=W([g("w3m-onramp-fiat-select-view")],P);const ce=T`
  button {
    padding: var(--wui-spacing-s);
    border-radius: var(--wui-border-radius-xs);
    border: none;
    outline: none;
    background-color: var(--wui-color-gray-glass-002);
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--wui-spacing-s);
    transition: background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color;
  }

  button:hover {
    background-color: var(--wui-color-gray-glass-005);
  }

  .provider-image {
    width: var(--wui-spacing-3xl);
    min-width: var(--wui-spacing-3xl);
    height: var(--wui-spacing-3xl);
    border-radius: calc(var(--wui-border-radius-xs) - calc(var(--wui-spacing-s) / 2));
    position: relative;
    overflow: hidden;
  }

  .provider-image::after {
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    border-radius: calc(var(--wui-border-radius-xs) - calc(var(--wui-spacing-s) / 2));
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  .network-icon {
    width: var(--wui-spacing-m);
    height: var(--wui-spacing-m);
    border-radius: calc(var(--wui-spacing-m) / 2);
    overflow: hidden;
    box-shadow:
      0 0 0 3px var(--wui-color-gray-glass-002),
      0 0 0 3px var(--wui-color-modal-bg);
    transition: box-shadow var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: box-shadow;
  }

  button:hover .network-icon {
    box-shadow:
      0 0 0 3px var(--wui-color-gray-glass-005),
      0 0 0 3px var(--wui-color-modal-bg);
  }
`;var R=function(a,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,r);else for(var n=a.length-1;n>=0;n--)(s=a[n])&&(i=(o<3?s(i):o>3?s(e,t,i):s(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let b=class extends w{constructor(){super(...arguments),this.disabled=!1,this.color="inherit",this.label="",this.feeRange="",this.loading=!1,this.onClick=null}render(){return c`
      <button ?disabled=${this.disabled} @click=${this.onClick} ontouchstart>
        <wui-visual name=${h(this.name)} class="provider-image"></wui-visual>
        <wui-flex flexDirection="column" gap="4xs">
          <wui-text variant="paragraph-500" color="fg-100">${this.label}</wui-text>
          <wui-flex alignItems="center" justifyContent="flex-start" gap="l">
            <wui-text variant="tiny-500" color="fg-100">
              <wui-text variant="tiny-400" color="fg-200">Fees</wui-text>
              ${this.feeRange}
            </wui-text>
            <wui-flex gap="xxs">
              <wui-icon name="bank" size="xs" color="fg-150"></wui-icon>
              <wui-icon name="card" size="xs" color="fg-150"></wui-icon>
            </wui-flex>
            ${this.networksTemplate()}
          </wui-flex>
        </wui-flex>
        ${this.loading?c`<wui-loading-spinner color="fg-200" size="md"></wui-loading-spinner>`:c`<wui-icon name="chevronRight" color="fg-200" size="sm"></wui-icon>`}
      </button>
    `}networksTemplate(){var r;const e=O.getAllRequestedCaipNetworks(),t=(r=e==null?void 0:e.filter(o=>{var i;return(i=o==null?void 0:o.assets)==null?void 0:i.imageId}))==null?void 0:r.slice(0,5);return c`
      <wui-flex class="networks">
        ${t==null?void 0:t.map(o=>c`
            <wui-flex class="network-icon">
              <wui-image src=${h(Z.getNetworkImage(o))}></wui-image>
            </wui-flex>
          `)}
      </wui-flex>
    `}};b.styles=[ce];R([d({type:Boolean})],b.prototype,"disabled",void 0);R([d()],b.prototype,"color",void 0);R([d()],b.prototype,"name",void 0);R([d()],b.prototype,"label",void 0);R([d()],b.prototype,"feeRange",void 0);R([d({type:Boolean})],b.prototype,"loading",void 0);R([d()],b.prototype,"onClick",void 0);b=R([g("w3m-onramp-provider-item")],b);const le=T`
  wui-flex {
    border-top: 1px solid var(--wui-color-gray-glass-005);
  }

  a {
    text-decoration: none;
    color: var(--wui-color-fg-175);
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--wui-spacing-3xs);
  }
`;var ue=function(a,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,r);else for(var n=a.length-1;n>=0;n--)(s=a[n])&&(i=(o<3?s(i):o>3?s(e,t,i):s(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let K=class extends w{render(){const{termsConditionsUrl:e,privacyPolicyUrl:t}=j.state;return!e&&!t?null:c`
      <wui-flex
        .padding=${["m","s","s","s"]}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap="s"
      >
        <wui-text color="fg-250" variant="small-400" align="center">
          We work with the best providers to give you the lowest fees and best support. More options
          coming soon!
        </wui-text>

        ${this.howDoesItWorkTemplate()}
      </wui-flex>
    `}howDoesItWorkTemplate(){return c` <wui-link @click=${this.onWhatIsBuy.bind(this)}>
      <wui-icon size="xs" color="accent-100" slot="iconLeft" name="helpCircle"></wui-icon>
      How does it work?
    </wui-link>`}onWhatIsBuy(){var t;const e=O.state.activeChain;G.sendEvent({type:"track",event:"SELECT_WHAT_IS_A_BUY",properties:{isSmartAccount:((t=S.state.preferredAccountTypes)==null?void 0:t[e])===H.ACCOUNT_TYPES.SMART_ACCOUNT}}),D.push("WhatIsABuy")}};K.styles=[le];K=ue([g("w3m-onramp-providers-footer")],K);var X=function(a,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,r);else for(var n=a.length-1;n>=0;n--)(s=a[n])&&(i=(o<3?s(i):o>3?s(e,t,i):s(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let Y=class extends w{constructor(){super(),this.unsubscribe=[],this.providers=l.state.providers,this.unsubscribe.push(l.subscribeKey("providers",e=>{this.providers=e}))}firstUpdated(){const e=this.providers.map(async t=>t.name==="coinbase"?await this.getCoinbaseOnRampURL():Promise.resolve(t==null?void 0:t.url));Promise.all(e).then(t=>{this.providers=this.providers.map((r,o)=>({...r,url:t[o]||""}))})}render(){return c`
      <wui-flex flexDirection="column" .padding=${["0","s","s","s"]} gap="xs">
        ${this.onRampProvidersTemplate()}
      </wui-flex>
      <w3m-onramp-providers-footer></w3m-onramp-providers-footer>
    `}onRampProvidersTemplate(){return this.providers.filter(e=>e.supportedChains.includes(O.state.activeChain??"eip155")).map(e=>c`
          <w3m-onramp-provider-item
            label=${e.label}
            name=${e.name}
            feeRange=${e.feeRange}
            @click=${()=>{this.onClickProvider(e)}}
            ?disabled=${!e.url}
            data-testid=${`onramp-provider-${e.name}`}
          ></w3m-onramp-provider-item>
        `)}onClickProvider(e){var r;const t=O.state.activeChain;l.setSelectedProvider(e),D.push("BuyInProgress"),V.openHref(e.url,"popupWindow","width=600,height=800,scrollbars=yes"),G.sendEvent({type:"track",event:"SELECT_BUY_PROVIDER",properties:{provider:e.name,isSmartAccount:((r=S.state.preferredAccountTypes)==null?void 0:r[t])===H.ACCOUNT_TYPES.SMART_ACCOUNT}})}async getCoinbaseOnRampURL(){const e=S.state.address,t=O.state.activeCaipNetwork;if(!e)throw new Error("No address found");if(!(t!=null&&t.name))throw new Error("No network found");const r=M.WC_COINBASE_PAY_SDK_CHAIN_NAME_MAP[t.name]??M.WC_COINBASE_PAY_SDK_FALLBACK_CHAIN,o=l.state.purchaseCurrency,i=o?[o.symbol]:l.state.purchaseCurrencies.map(s=>s.symbol);return await Q.generateOnRampURL({defaultNetwork:r,destinationWallets:[{address:e,blockchains:M.WC_COINBASE_PAY_SDK_CHAINS,assets:i}],partnerUserId:e,purchaseAmount:l.state.purchaseAmount})}};X([u()],Y.prototype,"providers",void 0);Y=X([g("w3m-onramp-providers-view")],Y);const de=T`
  :host > wui-grid {
    max-height: 360px;
    overflow: auto;
  }

  wui-flex {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-flex.disabled {
    opacity: 0.3;
    pointer-events: none;
    user-select: none;
  }
`;var E=function(a,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,r);else for(var n=a.length-1;n>=0;n--)(s=a[n])&&(i=(o<3?s(i):o>3?s(e,t,i):s(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let _=class extends w{constructor(){super(),this.unsubscribe=[],this.selectedCurrency=l.state.purchaseCurrencies,this.tokens=l.state.purchaseCurrencies,this.tokenImages=x.state.tokenImages,this.checked=z.state.isLegalCheckboxChecked,this.unsubscribe.push(l.subscribe(e=>{this.selectedCurrency=e.purchaseCurrencies,this.tokens=e.purchaseCurrencies}),x.subscribeKey("tokenImages",e=>this.tokenImages=e),z.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var n;const{termsConditionsUrl:e,privacyPolicyUrl:t}=j.state,r=(n=j.state.features)==null?void 0:n.legalCheckbox,s=!!(e||t)&&!!r&&!this.checked;return c`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${["0","s","s","s"]}
        gap="xs"
        class=${h(s?"disabled":void 0)}
      >
        ${this.currenciesTemplate(s)}
      </wui-flex>
      <w3m-legal-footer></w3m-legal-footer>
    `}currenciesTemplate(e=!1){return this.tokens.map(t=>{var r;return c`
        <wui-list-item
          imageSrc=${h((r=this.tokenImages)==null?void 0:r[t.symbol])}
          @click=${()=>this.selectToken(t)}
          variant="image"
          tabIdx=${h(e?-1:void 0)}
        >
          <wui-flex gap="3xs" alignItems="center">
            <wui-text variant="paragraph-500" color="fg-100">${t.name}</wui-text>
            <wui-text variant="small-400" color="fg-200">${t.symbol}</wui-text>
          </wui-flex>
        </wui-list-item>
      `})}selectToken(e){e&&(l.setPurchaseCurrency(e),I.close())}};_.styles=de;E([u()],_.prototype,"selectedCurrency",void 0);E([u()],_.prototype,"tokens",void 0);E([u()],_.prototype,"tokenImages",void 0);E([u()],_.prototype,"checked",void 0);_=E([g("w3m-onramp-token-select-view")],_);const pe=T`
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

  wui-visual {
    width: var(--wui-wallet-image-size-lg);
    height: var(--wui-wallet-image-size-lg);
    border-radius: calc(var(--wui-border-radius-5xs) * 9 - var(--wui-border-radius-xxs));
    position: relative;
    overflow: hidden;
  }

  wui-visual::after {
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    border-radius: calc(var(--wui-border-radius-5xs) * 9 - var(--wui-border-radius-xxs));
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  wui-icon-box {
    position: absolute;
    right: calc(var(--wui-spacing-3xs) * -1);
    bottom: calc(var(--wui-spacing-3xs) * -1);
    opacity: 0;
    transform: scale(0.5);
    transition:
      opacity var(--wui-ease-out-power-2) var(--wui-duration-lg),
      transform var(--wui-ease-out-power-2) var(--wui-duration-lg);
    will-change: opacity, transform;
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

  [data-retry='false'] wui-link {
    display: none;
  }

  [data-retry='true'] wui-link {
    display: block;
    opacity: 1;
  }

  wui-link {
    padding: var(--wui-spacing-4xs) var(--wui-spacing-xxs);
  }
`;var y=function(a,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,r);else for(var n=a.length-1;n>=0;n--)(s=a[n])&&(i=(o<3?s(i):o>3?s(e,t,i):s(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let m=class extends w{constructor(){super(),this.unsubscribe=[],this.selectedOnRampProvider=l.state.selectedProvider,this.uri=ee.state.wcUri,this.ready=!1,this.showRetry=!1,this.buffering=!1,this.error=!1,this.startTime=null,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(l.subscribeKey("selectedProvider",e=>{this.selectedOnRampProvider=e})),this.watchTransactions()}disconnectedCallback(){this.intervalId&&clearInterval(this.intervalId)}render(){var r,o;let e="Continue in external window";this.error?e="Buy failed":this.selectedOnRampProvider&&(e=`Buy in ${(r=this.selectedOnRampProvider)==null?void 0:r.label}`);const t=this.error?"Buy can be declined from your side or due to and error on the provider app":"We’ll notify you once your Buy is processed";return c`
      <wui-flex
        data-error=${h(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-visual
            name=${h((o=this.selectedOnRampProvider)==null?void 0:o.name)}
            size="lg"
            class="provider-image"
          >
          </wui-visual>

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
          <wui-text variant="paragraph-500" color=${this.error?"error-100":"fg-100"}>
            ${e}
          </wui-text>
          <wui-text align="center" variant="small-500" color="fg-200">${t}</wui-text>
        </wui-flex>

        ${this.error?this.tryAgainTemplate():null}
      </wui-flex>

      <wui-flex .padding=${["0","xl","xl","xl"]} justifyContent="center">
        <wui-link @click=${this.onCopyUri} color="fg-200">
          <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
          Copy link
        </wui-link>
      </wui-flex>
    `}watchTransactions(){if(this.selectedOnRampProvider)switch(this.selectedOnRampProvider.name){case"coinbase":this.startTime=Date.now(),this.initializeCoinbaseTransactions();break}}async initializeCoinbaseTransactions(){await this.watchCoinbaseTransactions(),this.intervalId=setInterval(()=>this.watchCoinbaseTransactions(),4e3)}async watchCoinbaseTransactions(){try{const e=S.state.address;if(!e)throw new Error("No address found");(await Q.fetchTransactions({account:e,onramp:"coinbase"})).data.filter(o=>new Date(o.metadata.minedAt)>new Date(this.startTime)||o.metadata.status==="ONRAMP_TRANSACTION_STATUS_IN_PROGRESS").length?(clearInterval(this.intervalId),D.replace("OnRampActivity")):this.startTime&&Date.now()-this.startTime>=18e4&&(clearInterval(this.intervalId),this.error=!0)}catch(e){L.showError(e)}}onTryAgain(){this.selectedOnRampProvider&&(this.error=!1,V.openHref(this.selectedOnRampProvider.url,"popupWindow","width=600,height=800,scrollbars=yes"))}tryAgainTemplate(){var e;return(e=this.selectedOnRampProvider)!=null&&e.url?c`<wui-button size="md" variant="accent" @click=${this.onTryAgain.bind(this)}>
      <wui-icon color="inherit" slot="iconLeft" name="refresh"></wui-icon>
      Try again
    </wui-button>`:null}loaderTemplate(){const e=te.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4;return c`<wui-loading-thumbnail radius=${t*9}></wui-loading-thumbnail>`}onCopyUri(){var e;if(!((e=this.selectedOnRampProvider)!=null&&e.url)){L.showError("No link found"),D.goBack();return}try{V.copyToClopboard(this.selectedOnRampProvider.url),L.showSuccess("Link copied")}catch{L.showError("Failed to copy")}}};m.styles=pe;y([u()],m.prototype,"intervalId",void 0);y([u()],m.prototype,"selectedOnRampProvider",void 0);y([u()],m.prototype,"uri",void 0);y([u()],m.prototype,"ready",void 0);y([u()],m.prototype,"showRetry",void 0);y([u()],m.prototype,"buffering",void 0);y([u()],m.prototype,"error",void 0);y([u()],m.prototype,"startTime",void 0);y([d({type:Boolean})],m.prototype,"isMobile",void 0);y([d()],m.prototype,"onRetry",void 0);m=y([g("w3m-buy-in-progress-view")],m);var he=function(a,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,r);else for(var n=a.length-1;n>=0;n--)(s=a[n])&&(i=(o<3?s(i):o>3?s(e,t,i):s(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let q=class extends w{render(){return c`
      <wui-flex
        flexDirection="column"
        .padding=${["xxl","3xl","xl","3xl"]}
        alignItems="center"
        gap="xl"
      >
        <wui-visual name="onrampCard"></wui-visual>
        <wui-flex flexDirection="column" gap="xs" alignItems="center">
          <wui-text align="center" variant="paragraph-500" color="fg-100">
            Quickly and easily buy digital assets!
          </wui-text>
          <wui-text align="center" variant="small-400" color="fg-200">
            Simply select your preferred onramp provider and add digital assets to your account
            using your credit card or bank transfer
          </wui-text>
        </wui-flex>
        <wui-button @click=${D.goBack}>
          <wui-icon size="sm" color="inherit" name="add" slot="iconLeft"></wui-icon>
          Buy
        </wui-button>
      </wui-flex>
    `}};q=he([g("w3m-what-is-a-buy-view")],q);const me=T`
  :host {
    width: 100%;
  }

  wui-loading-spinner {
    position: absolute;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
  }

  .currency-container {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: var(--wui-spacing-1xs);
    height: 40px;
    padding: var(--wui-spacing-xs) var(--wui-spacing-1xs) var(--wui-spacing-xs)
      var(--wui-spacing-xs);
    min-width: 95px;
    border-radius: var(--FULL, 1000px);
    border: 1px solid var(--wui-color-gray-glass-002);
    background: var(--wui-color-gray-glass-002);
    cursor: pointer;
  }

  .currency-container > wui-image {
    height: 24px;
    width: 24px;
    border-radius: 50%;
  }
`;var k=function(a,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,r);else for(var n=a.length-1;n>=0;n--)(s=a[n])&&(i=(o<3?s(i):o>3?s(e,t,i):s(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let C=class extends w{constructor(){var e;super(),this.unsubscribe=[],this.type="Token",this.value=0,this.currencies=[],this.selectedCurrency=(e=this.currencies)==null?void 0:e[0],this.currencyImages=x.state.currencyImages,this.tokenImages=x.state.tokenImages,this.unsubscribe.push(l.subscribeKey("purchaseCurrency",t=>{!t||this.type==="Fiat"||(this.selectedCurrency=this.formatPurchaseCurrency(t))}),l.subscribeKey("paymentCurrency",t=>{!t||this.type==="Token"||(this.selectedCurrency=this.formatPaymentCurrency(t))}),l.subscribe(t=>{this.type==="Fiat"?this.currencies=t.purchaseCurrencies.map(this.formatPurchaseCurrency):this.currencies=t.paymentCurrencies.map(this.formatPaymentCurrency)}),x.subscribe(t=>{this.currencyImages={...t.currencyImages},this.tokenImages={...t.tokenImages}}))}firstUpdated(){l.getAvailableCurrencies()}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var r;const e=((r=this.selectedCurrency)==null?void 0:r.symbol)||"",t=this.currencyImages[e]||this.tokenImages[e];return c`<wui-input-text type="number" size="lg" value=${this.value}>
      ${this.selectedCurrency?c` <wui-flex
            class="currency-container"
            justifyContent="space-between"
            alignItems="center"
            gap="xxs"
            @click=${()=>I.open({view:`OnRamp${this.type}Select`})}
          >
            <wui-image src=${h(t)}></wui-image>
            <wui-text color="fg-100">${this.selectedCurrency.symbol}</wui-text>
          </wui-flex>`:c`<wui-loading-spinner></wui-loading-spinner>`}
    </wui-input-text>`}formatPaymentCurrency(e){return{name:e.id,symbol:e.id}}formatPurchaseCurrency(e){return{name:e.name,symbol:e.symbol}}};C.styles=me;k([d({type:String})],C.prototype,"type",void 0);k([d({type:Number})],C.prototype,"value",void 0);k([u()],C.prototype,"currencies",void 0);k([u()],C.prototype,"selectedCurrency",void 0);k([u()],C.prototype,"currencyImages",void 0);k([u()],C.prototype,"tokenImages",void 0);C=k([g("w3m-onramp-input")],C);const fe=T`
  :host > wui-flex {
    width: 100%;
    max-width: 360px;
  }

  :host > wui-flex > wui-flex {
    border-radius: var(--wui-border-radius-l);
    width: 100%;
  }

  .amounts-container {
    width: 100%;
  }
`;var $=function(a,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,r);else for(var n=a.length-1;n>=0;n--)(s=a[n])&&(i=(o<3?s(i):o>3?s(e,t,i):s(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};const we={USD:"$",EUR:"€",GBP:"£"},ge=[100,250,500,1e3];let v=class extends w{constructor(){super(),this.unsubscribe=[],this.disabled=!1,this.caipAddress=O.state.activeCaipAddress,this.loading=I.state.loading,this.paymentCurrency=l.state.paymentCurrency,this.paymentAmount=l.state.paymentAmount,this.purchaseAmount=l.state.purchaseAmount,this.quoteLoading=l.state.quotesLoading,this.unsubscribe.push(O.subscribeKey("activeCaipAddress",e=>this.caipAddress=e),I.subscribeKey("loading",e=>{this.loading=e}),l.subscribe(e=>{this.paymentCurrency=e.paymentCurrency,this.paymentAmount=e.paymentAmount,this.purchaseAmount=e.purchaseAmount,this.quoteLoading=e.quotesLoading}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return c`
      <wui-flex flexDirection="column" justifyContent="center" alignItems="center">
        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <w3m-onramp-input
            type="Fiat"
            @inputChange=${this.onPaymentAmountChange.bind(this)}
            .value=${this.paymentAmount||0}
          ></w3m-onramp-input>
          <w3m-onramp-input
            type="Token"
            .value=${this.purchaseAmount||0}
            .loading=${this.quoteLoading}
          ></w3m-onramp-input>
          <wui-flex justifyContent="space-evenly" class="amounts-container" gap="xs">
            ${ge.map(e=>{var t;return c`<wui-button
                  variant=${this.paymentAmount===e?"accent":"neutral"}
                  size="md"
                  textVariant="paragraph-600"
                  fullWidth
                  @click=${()=>this.selectPresetAmount(e)}
                  >${`${we[((t=this.paymentCurrency)==null?void 0:t.id)||"USD"]} ${e}`}</wui-button
                >`})}
          </wui-flex>
          ${this.templateButton()}
        </wui-flex>
      </wui-flex>
    `}templateButton(){return this.caipAddress?c`<wui-button
          @click=${this.getQuotes.bind(this)}
          variant="main"
          fullWidth
          size="lg"
          borderRadius="xs"
        >
          Get quotes
        </wui-button>`:c`<wui-button
          @click=${this.openModal.bind(this)}
          variant="accent"
          fullWidth
          size="lg"
          borderRadius="xs"
        >
          Connect wallet
        </wui-button>`}getQuotes(){this.loading||I.open({view:"OnRampProviders"})}openModal(){I.open({view:"Connect"})}async onPaymentAmountChange(e){l.setPaymentAmount(Number(e.detail)),await l.getQuote()}async selectPresetAmount(e){l.setPaymentAmount(e),await l.getQuote()}};v.styles=fe;$([d({type:Boolean})],v.prototype,"disabled",void 0);$([u()],v.prototype,"caipAddress",void 0);$([u()],v.prototype,"loading",void 0);$([u()],v.prototype,"paymentCurrency",void 0);$([u()],v.prototype,"paymentAmount",void 0);$([u()],v.prototype,"purchaseAmount",void 0);$([u()],v.prototype,"quoteLoading",void 0);v=$([g("w3m-onramp-widget")],v);export{m as W3mBuyInProgressView,A as W3mOnRampActivityView,Y as W3mOnRampProvidersView,P as W3mOnrampFiatSelectView,_ as W3mOnrampTokensView,v as W3mOnrampWidget,q as W3mWhatIsABuyView};
