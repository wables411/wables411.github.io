import{i as p,r as f,b as h,a as w,x as g,l as v}from"./wallet-BEJTgdB0.js";import{n as u,o as x}from"./if-defined-5Al-vCnG.js";const y=p`
  :host {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    border-radius: var(--wui-border-radius-3xl);
    border: 1px solid var(--wui-color-gray-glass-005);
    overflow: hidden;
  }

  wui-icon {
    width: 100%;
    height: 100%;
  }
`;var b=function(i,t,o,l){var r=arguments.length,e=r<3?t:l===null?l=Object.getOwnPropertyDescriptor(t,o):l,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")e=Reflect.decorate(i,t,o,l);else for(var s=i.length-1;s>=0;s--)(n=i[s])&&(e=(r<3?n(e):r>3?n(t,o,e):n(t,o))||e);return r>3&&e&&Object.defineProperty(t,o,e),e};let d=class extends w{constructor(){super(...arguments),this.logo="google"}render(){return g`<wui-icon color="inherit" size="inherit" name=${this.logo}></wui-icon> `}};d.styles=[f,y];b([u()],d.prototype,"logo",void 0);d=b([h("wui-logo")],d);const m=p`
  button {
    column-gap: var(--wui-spacing-s);
    padding: 7px var(--wui-spacing-l) 7px var(--wui-spacing-xs);
    width: 100%;
    justify-content: flex-start;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
    color: var(--wui-color-fg-100);
  }

  wui-text {
    text-transform: capitalize;
  }

  wui-text[data-align='left'] {
    display: flex;
    flex: 1;
  }

  wui-text[data-align='center'] {
    display: flex;
    flex: 1;
    justify-content: center;
  }

  .invisible {
    opacity: 0;
    pointer-events: none;
  }

  button:disabled {
    background-color: var(--wui-color-gray-glass-015);
    color: var(--wui-color-gray-glass-015);
  }
`;var c=function(i,t,o,l){var r=arguments.length,e=r<3?t:l===null?l=Object.getOwnPropertyDescriptor(t,o):l,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")e=Reflect.decorate(i,t,o,l);else for(var s=i.length-1;s>=0;s--)(n=i[s])&&(e=(r<3?n(e):r>3?n(t,o,e):n(t,o))||e);return r>3&&e&&Object.defineProperty(t,o,e),e};let a=class extends w{constructor(){super(...arguments),this.logo="google",this.name="Continue with google",this.align="left",this.disabled=!1}render(){return g`
      <button ?disabled=${this.disabled} tabindex=${x(this.tabIdx)}>
        <wui-logo logo=${this.logo}></wui-logo>
        <wui-text
          data-align=${this.align}
          variant="paragraph-500"
          color="inherit"
          align=${this.align}
          >${this.name}</wui-text
        >
        ${this.templatePlacement()}
      </button>
    `}templatePlacement(){return this.align==="center"?g` <wui-logo class="invisible" logo=${this.logo}></wui-logo>`:null}};a.styles=[f,v,m];c([u()],a.prototype,"logo",void 0);c([u()],a.prototype,"name",void 0);c([u()],a.prototype,"align",void 0);c([u()],a.prototype,"tabIdx",void 0);c([u({type:Boolean})],a.prototype,"disabled",void 0);a=c([h("wui-list-social")],a);
