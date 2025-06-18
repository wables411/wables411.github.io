import{i as d,r as g,l as w,b,a as h,x as c}from"./wallet-BEJTgdB0.js";import{n as p}from"./if-defined-5Al-vCnG.js";import"./index-85GSrhpv.js";import"./index-BtYYAriB.js";const x=d`
  :host {
    display: block;
  }

  :host > button {
    gap: var(--wui-spacing-xxs);
    padding: var(--wui-spacing-xs);
    padding-right: var(--wui-spacing-1xs);
    height: 40px;
    border-radius: var(--wui-border-radius-l);
    background: var(--wui-color-gray-glass-002);
    border-width: 0px;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
  }

  :host > button wui-image {
    width: 24px;
    height: 24px;
    border-radius: var(--wui-border-radius-s);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }
`;var l=function(i,e,r,n){var a=arguments.length,t=a<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,r):n,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(i,e,r,n);else for(var u=i.length-1;u>=0;u--)(s=i[u])&&(t=(a<3?s(t):a>3?s(e,r,t):s(e,r))||t);return a>3&&t&&Object.defineProperty(e,r,t),t};let o=class extends h{constructor(){super(...arguments),this.text=""}render(){return c`
      <button>
        ${this.tokenTemplate()}
        <wui-text variant="paragraph-600" color="fg-100">${this.text}</wui-text>
      </button>
    `}tokenTemplate(){return this.imageSrc?c`<wui-image src=${this.imageSrc}></wui-image>`:c`
      <wui-icon-box
        size="sm"
        iconColor="fg-200"
        backgroundColor="fg-300"
        icon="networkPlaceholder"
      ></wui-icon-box>
    `}};o.styles=[g,w,x];l([p()],o.prototype,"imageSrc",void 0);l([p()],o.prototype,"text",void 0);o=l([b("wui-token-button")],o);
