import{i as d,r as x,b as f,a as b,x as s,u as w,O as a,l as C}from"./wallet-BEJTgdB0.js";import{n as $,o as R,r as m}from"./if-defined-5Al-vCnG.js";import{e as _,n as O}from"./ref-C-0KljE4.js";import{R as j}from"./ConstantsUtil-Dmg8YACJ.js";const P=d`
  label {
    display: flex;
    align-items: center;
    cursor: pointer;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    column-gap: var(--wui-spacing-1xs);
  }

  label > input[type='checkbox'] {
    height: 0;
    width: 0;
    opacity: 0;
    pointer-events: none;
    position: absolute;
  }

  label > span {
    width: var(--wui-spacing-xl);
    height: var(--wui-spacing-xl);
    min-width: var(--wui-spacing-xl);
    min-height: var(--wui-spacing-xl);
    border-radius: var(--wui-border-radius-3xs);
    border-width: 1px;
    border-style: solid;
    border-color: var(--wui-color-gray-glass-010);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color var(--wui-ease-out-power-1) var(--wui-duration-lg);
    will-change: background-color;
  }

  label > span:hover,
  label > input[type='checkbox']:focus-visible + span {
    background-color: var(--wui-color-gray-glass-010);
  }

  label input[type='checkbox']:checked + span {
    background-color: var(--wui-color-blue-base-90);
  }

  label > span > wui-icon {
    opacity: 0;
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-lg);
    will-change: opacity;
  }

  label > input[type='checkbox']:checked + span wui-icon {
    opacity: 1;
  }
`;var y=function(i,e,n,r){var o=arguments.length,t=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,n):r,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(i,e,n,r);else for(var c=i.length-1;c>=0;c--)(l=i[c])&&(t=(o<3?l(t):o>3?l(e,n,t):l(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let u=class extends b{constructor(){super(...arguments),this.inputElementRef=_(),this.checked=void 0}render(){return s`
      <label>
        <input
          ${O(this.inputElementRef)}
          ?checked=${R(this.checked)}
          type="checkbox"
          @change=${this.dispatchChangeEvent}
        />
        <span>
          <wui-icon name="checkmarkBold" color="inverse-100" size="xxs"></wui-icon>
        </span>
        <slot></slot>
      </label>
    `}dispatchChangeEvent(){var e;this.dispatchEvent(new CustomEvent("checkboxChange",{detail:(e=this.inputElementRef.value)==null?void 0:e.checked,bubbles:!0,composed:!0}))}};u.styles=[x,P];y([$({type:Boolean})],u.prototype,"checked",void 0);u=y([f("wui-checkbox")],u);const T=d`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  wui-checkbox {
    padding: var(--wui-spacing-s);
  }
  a {
    text-decoration: none;
    color: var(--wui-color-fg-150);
    font-weight: 500;
  }
`;var v=function(i,e,n,r){var o=arguments.length,t=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,n):r,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(i,e,n,r);else for(var c=i.length-1;c>=0;c--)(l=i[c])&&(t=(o<3?l(t):o>3?l(e,n,t):l(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let h=class extends b{constructor(){super(),this.unsubscribe=[],this.checked=w.state.isLegalCheckboxChecked,this.unsubscribe.push(w.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var o;const{termsConditionsUrl:e,privacyPolicyUrl:n}=a.state,r=(o=a.state.features)==null?void 0:o.legalCheckbox;return!e&&!n||!r?null:s`
      <wui-checkbox
        ?checked=${this.checked}
        @checkboxChange=${this.onCheckboxChange.bind(this)}
        data-testid="wui-checkbox"
      >
        <wui-text color="fg-250" variant="small-400" align="left">
          I agree to our ${this.termsTemplate()} ${this.andTemplate()} ${this.privacyTemplate()}
        </wui-text>
      </wui-checkbox>
    `}andTemplate(){const{termsConditionsUrl:e,privacyPolicyUrl:n}=a.state;return e&&n?"and":""}termsTemplate(){const{termsConditionsUrl:e}=a.state;return e?s`<a rel="noreferrer" target="_blank" href=${e}>terms of service</a>`:null}privacyTemplate(){const{privacyPolicyUrl:e}=a.state;return e?s`<a rel="noreferrer" target="_blank" href=${e}>privacy policy</a>`:null}onCheckboxChange(){w.setIsLegalCheckboxChecked(!this.checked)}};h.styles=[T];v([m()],h.prototype,"checked",void 0);h=v([f("w3m-legal-checkbox")],h);const U=d`
  .reown-logo {
    height: var(--wui-spacing-xxl);
  }

  a {
    text-decoration: none;
    cursor: pointer;
  }

  a:hover {
    opacity: 0.9;
  }
`;var B=function(i,e,n,r){var o=arguments.length,t=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,n):r,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(i,e,n,r);else for(var c=i.length-1;c>=0;c--)(l=i[c])&&(t=(o<3?l(t):o>3?l(e,n,t):l(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let g=class extends b{render(){return s`
      <a
        data-testid="ux-branding-reown"
        href=${j}
        rel="noreferrer"
        target="_blank"
        style="text-decoration: none;"
      >
        <wui-flex
          justifyContent="center"
          alignItems="center"
          gap="xs"
          .padding=${["0","0","l","0"]}
        >
          <wui-text variant="small-500" color="fg-100"> UX by </wui-text>
          <wui-icon name="reown" size="xxxl" class="reown-logo"></wui-icon>
        </wui-flex>
      </a>
    `}};g.styles=[x,C,U];g=B([f("wui-ux-by-reown")],g);const E=d`
  :host > wui-flex {
    background-color: var(--wui-color-gray-glass-005);
  }

  :host wui-ux-by-reown {
    padding-top: 0;
  }

  :host wui-ux-by-reown.branding-only {
    padding-top: var(--wui-spacing-m);
  }

  a {
    text-decoration: none;
    color: var(--wui-color-fg-175);
    font-weight: 500;
  }
`;var k=function(i,e,n,r){var o=arguments.length,t=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,n):r,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(i,e,n,r);else for(var c=i.length-1;c>=0;c--)(l=i[c])&&(t=(o<3?l(t):o>3?l(e,n,t):l(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let p=class extends b{constructor(){super(),this.unsubscribe=[],this.remoteFeatures=a.state.remoteFeatures,this.unsubscribe.push(a.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var t;const{termsConditionsUrl:e,privacyPolicyUrl:n}=a.state,r=(t=a.state.features)==null?void 0:t.legalCheckbox;return!e&&!n||r?s`
        <wui-flex flexDirection="column"> ${this.reownBrandingTemplate(!0)} </wui-flex>
      `:s`
      <wui-flex flexDirection="column">
        <wui-flex .padding=${["m","s","s","s"]} justifyContent="center">
          <wui-text color="fg-250" variant="small-400" align="center">
            By connecting your wallet, you agree to our <br />
            ${this.termsTemplate()} ${this.andTemplate()} ${this.privacyTemplate()}
          </wui-text>
        </wui-flex>
        ${this.reownBrandingTemplate()}
      </wui-flex>
    `}andTemplate(){const{termsConditionsUrl:e,privacyPolicyUrl:n}=a.state;return e&&n?"and":""}termsTemplate(){const{termsConditionsUrl:e}=a.state;return e?s`<a href=${e}>Terms of Service</a>`:null}privacyTemplate(){const{privacyPolicyUrl:e}=a.state;return e?s`<a href=${e}>Privacy Policy</a>`:null}reownBrandingTemplate(e=!1){var n;return(n=this.remoteFeatures)!=null&&n.reownBranding?e?s`<wui-ux-by-reown class="branding-only"></wui-ux-by-reown>`:s`<wui-ux-by-reown></wui-ux-by-reown>`:null}};p.styles=[E];k([m()],p.prototype,"remoteFeatures",void 0);p=k([f("w3m-legal-footer")],p);
