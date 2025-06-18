const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/add-WVDJHm-Z.js","assets/wallet-BEJTgdB0.js","assets/vendor-B9R9w7LK.js","assets/query-dpKa22bh.js","assets/all-wallets-doXao26a.js","assets/arrow-bottom-circle-CwIFHIvV.js","assets/app-store-KEVBVj_a.js","assets/apple-CuNfij2G.js","assets/arrow-bottom-DaPsfCjb.js","assets/arrow-left-DcORT77v.js","assets/arrow-right-BUMupu0j.js","assets/arrow-top-7s2_BV9s.js","assets/bank-tH8M7VKF.js","assets/browser-ByeR3BRw.js","assets/bin-B9owZRca.js","assets/bitcoin-B9fw5Lfd.js","assets/card-C2uc_XSG.js","assets/checkmark-B_b0nStA.js","assets/checkmark-bold-BQSijyIV.js","assets/chevron-bottom-Sdrkz3Hj.js","assets/chevron-left-lyKeN9tp.js","assets/chevron-right-rsBPwS-j.js","assets/chevron-top-h5tF_gyB.js","assets/chrome-store-DvLcRjvV.js","assets/clock-B9jxWZM1.js","assets/close-DltFzKcD.js","assets/compass-Ai5n4Iur.js","assets/coinPlaceholder-CgCxnJIy.js","assets/copy-ByN2OTb-.js","assets/cursor-BQFCChyx.js","assets/cursor-transparent-JXwauDP7.js","assets/circle-DzCO00AE.js","assets/desktop-DvZURtk9.js","assets/disconnect-B7HkxyL8.js","assets/discord-CGQI-YbL.js","assets/ethereum-Dg-TWhnK.js","assets/etherscan-C4RCEnTB.js","assets/extension-DIfyRtaM.js","assets/external-link-CBdADhKr.js","assets/facebook-B7BIH0sv.js","assets/farcaster-BZELB2xu.js","assets/filters-CBtVVO9O.js","assets/github-CckWGjSx.js","assets/google-BrBMsYb7.js","assets/help-circle-CTlISDh1.js","assets/image-BnbkkA9m.js","assets/id-BSAjsr11.js","assets/info-circle-BVi_PhO6.js","assets/lightbulb-CyQ4Bj-O.js","assets/mail-Dk9fWXVq.js","assets/mobile-B2DxRqby.js","assets/more--Qf2J244.js","assets/network-placeholder-BjBhJVel.js","assets/nftPlaceholder-CpQKAPIQ.js","assets/off-Cuma0Mwn.js","assets/play-store-yH04x6Dh.js","assets/plus-7YGbFFeP.js","assets/qr-code-CKHqEsG2.js","assets/recycle-horizontal-C1R8MiSb.js","assets/refresh-D4WWk-p-.js","assets/search-BHh4WX0A.js","assets/send-DmsWBrQw.js","assets/swapHorizontal-8UXhlG3j.js","assets/swapHorizontalMedium-DXUunWbq.js","assets/swapHorizontalBold-Bd_D-FL4.js","assets/swapHorizontalRoundedBold-DNOo1bIg.js","assets/swapVertical-CLtEf3J9.js","assets/solana-ZVavSeEm.js","assets/telegram-B5pSvHA5.js","assets/three-dots-DLZ4oBtB.js","assets/twitch-pLTVOfAq.js","assets/x-DV-CVX5B.js","assets/twitterIcon-D1PNqoZg.js","assets/verify-Z5ys5Lam.js","assets/verify-filled-DZeLC65X.js","assets/wallet-T1LKWEAX.js","assets/walletconnect-DaMgllMa.js","assets/wallet-placeholder-BnEjSv3m.js","assets/warning-circle-C6DduBls.js","assets/info-d3RxncVO.js","assets/exclamation-triangle-CLJJEiga.js","assets/reown-logo-CXuFs_Ps.js","assets/x-mark-DHzlDD20.js"])))=>i.map(i=>d[i]);
import{_ as a}from"./vendor-B9R9w7LK.js";import{ad as k,ae as B,af as T,i as P,r as R,a4 as j,b as $,a as O,x as m,U as v,aa as H}from"./wallet-BEJTgdB0.js";/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const M={attribute:!0,type:String,converter:B,reflect:!1,hasChanged:k},G=(t=M,i,e)=>{const{kind:n,metadata:o}=e;let r=globalThis.litPropertyMetadata.get(o);if(r===void 0&&globalThis.litPropertyMetadata.set(o,r=new Map),n==="setter"&&((t=Object.create(t)).wrapped=!0),r.set(e.name,t),n==="accessor"){const{name:s}=e;return{set(c){const w=i.get.call(this);i.set.call(this,c),this.requestUpdate(s,w,t)},init(c){return c!==void 0&&this.C(s,void 0,t,c),c}}}if(n==="setter"){const{name:s}=e;return function(c){const w=this[s];i.call(this,c),this.requestUpdate(s,w,t)}}throw Error("Unsupported decorator location: "+n)};function l(t){return(i,e)=>typeof e=="object"?G(t,i,e):((n,o,r)=>{const s=o.hasOwnProperty(r);return o.constructor.createProperty(r,n),s?Object.getOwnPropertyDescriptor(o,r):void 0})(t,i,e)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function st(t){return l({...t,state:!0,attribute:!1})}/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const U=t=>t===null||typeof t!="object"&&typeof t!="function",W=t=>t.strings===void 0;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const V={ATTRIBUTE:1,CHILD:2},b=t=>(...i)=>({_$litDirective$:t,values:i});let x=class{constructor(i){}get _$AU(){return this._$AM._$AU}_$AT(i,e,n){this._$Ct=i,this._$AM=e,this._$Ci=n}_$AS(i,e){return this.update(i,e)}update(i,e){return this.render(...e)}};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const h=(t,i)=>{var n;const e=t._$AN;if(e===void 0)return!1;for(const o of e)(n=o._$AO)==null||n.call(o,i,!1),h(o,i);return!0},S=t=>{let i,e;do{if((i=t._$AM)===void 0)break;e=i._$AN,e.delete(t),t=i}while((e==null?void 0:e.size)===0)},C=t=>{for(let i;i=t._$AM;t=i){let e=i._$AN;if(e===void 0)i._$AN=e=new Set;else if(e.has(t))break;e.add(t),q(i)}};function N(t){this._$AN!==void 0?(S(this),this._$AM=t,C(this)):this._$AM=t}function F(t,i=!1,e=0){const n=this._$AH,o=this._$AN;if(o!==void 0&&o.size!==0)if(i)if(Array.isArray(n))for(let r=e;r<n.length;r++)h(n[r],!1),S(n[r]);else n!=null&&(h(n,!1),S(n));else h(this,t)}const q=t=>{t.type==V.CHILD&&(t._$AP??(t._$AP=F),t._$AQ??(t._$AQ=N))};class K extends x{constructor(){super(...arguments),this._$AN=void 0}_$AT(i,e,n){super._$AT(i,e,n),C(this),this.isConnected=i._$AU}_$AO(i,e=!0){var n,o;i!==this.isConnected&&(this.isConnected=i,i?(n=this.reconnected)==null||n.call(this):(o=this.disconnected)==null||o.call(this)),e&&(h(this,i),S(this))}setValue(i){if(W(this._$Ct))this._$Ct._$AI(i,this);else{const e=[...this._$Ct._$AH];e[this._$Ci]=i,this._$Ct._$AI(e,this,0)}}disconnected(){}reconnected(){}}/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class X{constructor(i){this.G=i}disconnect(){this.G=void 0}reconnect(i){this.G=i}deref(){return this.G}}class Y{constructor(){this.Y=void 0,this.Z=void 0}get(){return this.Y}pause(){this.Y??(this.Y=new Promise(i=>this.Z=i))}resume(){var i;(i=this.Z)==null||i.call(this),this.Y=this.Z=void 0}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const I=t=>!U(t)&&typeof t.then=="function",L=1073741823;class Z extends K{constructor(){super(...arguments),this._$Cwt=L,this._$Cbt=[],this._$CK=new X(this),this._$CX=new Y}render(...i){return i.find(e=>!I(e))??T}update(i,e){const n=this._$Cbt;let o=n.length;this._$Cbt=e;const r=this._$CK,s=this._$CX;this.isConnected||this.disconnected();for(let c=0;c<e.length&&!(c>this._$Cwt);c++){const w=e[c];if(!I(w))return this._$Cwt=c,w;c<o&&w===n[c]||(this._$Cwt=L,o=0,Promise.resolve(w).then(async z=>{for(;s.get();)await s.get();const d=r.deref();if(d!==void 0){const E=d._$Cbt.indexOf(w);E>-1&&E<d._$Cwt&&(d._$Cwt=E,d.setValue(z))}}))}return T}disconnected(){this._$CK.disconnect(),this._$CX.pause()}reconnected(){this._$CK.reconnect(this),this._$CX.resume()}}const Q=b(Z);class J{constructor(){this.cache=new Map}set(i,e){this.cache.set(i,e)}get(i){return this.cache.get(i)}has(i){return this.cache.has(i)}delete(i){this.cache.delete(i)}clear(){this.cache.clear()}}const A=new J,tt=P`
  :host {
    display: flex;
    aspect-ratio: var(--local-aspect-ratio);
    color: var(--local-color);
    width: var(--local-width);
  }

  svg {
    width: inherit;
    height: inherit;
    object-fit: contain;
    object-position: center;
  }

  .fallback {
    width: var(--local-width);
    height: var(--local-height);
  }
`;var y=function(t,i,e,n){var o=arguments.length,r=o<3?i:n===null?n=Object.getOwnPropertyDescriptor(i,e):n,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,i,e,n);else for(var c=t.length-1;c>=0;c--)(s=t[c])&&(r=(o<3?s(r):o>3?s(i,e,r):s(i,e))||r);return o>3&&r&&Object.defineProperty(i,e,r),r};const D={add:async()=>(await a(async()=>{const{addSvg:t}=await import("./add-WVDJHm-Z.js");return{addSvg:t}},__vite__mapDeps([0,1,2,3]))).addSvg,allWallets:async()=>(await a(async()=>{const{allWalletsSvg:t}=await import("./all-wallets-doXao26a.js");return{allWalletsSvg:t}},__vite__mapDeps([4,1,2,3]))).allWalletsSvg,arrowBottomCircle:async()=>(await a(async()=>{const{arrowBottomCircleSvg:t}=await import("./arrow-bottom-circle-CwIFHIvV.js");return{arrowBottomCircleSvg:t}},__vite__mapDeps([5,1,2,3]))).arrowBottomCircleSvg,appStore:async()=>(await a(async()=>{const{appStoreSvg:t}=await import("./app-store-KEVBVj_a.js");return{appStoreSvg:t}},__vite__mapDeps([6,1,2,3]))).appStoreSvg,apple:async()=>(await a(async()=>{const{appleSvg:t}=await import("./apple-CuNfij2G.js");return{appleSvg:t}},__vite__mapDeps([7,1,2,3]))).appleSvg,arrowBottom:async()=>(await a(async()=>{const{arrowBottomSvg:t}=await import("./arrow-bottom-DaPsfCjb.js");return{arrowBottomSvg:t}},__vite__mapDeps([8,1,2,3]))).arrowBottomSvg,arrowLeft:async()=>(await a(async()=>{const{arrowLeftSvg:t}=await import("./arrow-left-DcORT77v.js");return{arrowLeftSvg:t}},__vite__mapDeps([9,1,2,3]))).arrowLeftSvg,arrowRight:async()=>(await a(async()=>{const{arrowRightSvg:t}=await import("./arrow-right-BUMupu0j.js");return{arrowRightSvg:t}},__vite__mapDeps([10,1,2,3]))).arrowRightSvg,arrowTop:async()=>(await a(async()=>{const{arrowTopSvg:t}=await import("./arrow-top-7s2_BV9s.js");return{arrowTopSvg:t}},__vite__mapDeps([11,1,2,3]))).arrowTopSvg,bank:async()=>(await a(async()=>{const{bankSvg:t}=await import("./bank-tH8M7VKF.js");return{bankSvg:t}},__vite__mapDeps([12,1,2,3]))).bankSvg,browser:async()=>(await a(async()=>{const{browserSvg:t}=await import("./browser-ByeR3BRw.js");return{browserSvg:t}},__vite__mapDeps([13,1,2,3]))).browserSvg,bin:async()=>(await a(async()=>{const{binSvg:t}=await import("./bin-B9owZRca.js");return{binSvg:t}},__vite__mapDeps([14,1,2,3]))).binSvg,bitcoin:async()=>(await a(async()=>{const{bitcoinSvg:t}=await import("./bitcoin-B9fw5Lfd.js");return{bitcoinSvg:t}},__vite__mapDeps([15,1,2,3]))).bitcoinSvg,card:async()=>(await a(async()=>{const{cardSvg:t}=await import("./card-C2uc_XSG.js");return{cardSvg:t}},__vite__mapDeps([16,1,2,3]))).cardSvg,checkmark:async()=>(await a(async()=>{const{checkmarkSvg:t}=await import("./checkmark-B_b0nStA.js");return{checkmarkSvg:t}},__vite__mapDeps([17,1,2,3]))).checkmarkSvg,checkmarkBold:async()=>(await a(async()=>{const{checkmarkBoldSvg:t}=await import("./checkmark-bold-BQSijyIV.js");return{checkmarkBoldSvg:t}},__vite__mapDeps([18,1,2,3]))).checkmarkBoldSvg,chevronBottom:async()=>(await a(async()=>{const{chevronBottomSvg:t}=await import("./chevron-bottom-Sdrkz3Hj.js");return{chevronBottomSvg:t}},__vite__mapDeps([19,1,2,3]))).chevronBottomSvg,chevronLeft:async()=>(await a(async()=>{const{chevronLeftSvg:t}=await import("./chevron-left-lyKeN9tp.js");return{chevronLeftSvg:t}},__vite__mapDeps([20,1,2,3]))).chevronLeftSvg,chevronRight:async()=>(await a(async()=>{const{chevronRightSvg:t}=await import("./chevron-right-rsBPwS-j.js");return{chevronRightSvg:t}},__vite__mapDeps([21,1,2,3]))).chevronRightSvg,chevronTop:async()=>(await a(async()=>{const{chevronTopSvg:t}=await import("./chevron-top-h5tF_gyB.js");return{chevronTopSvg:t}},__vite__mapDeps([22,1,2,3]))).chevronTopSvg,chromeStore:async()=>(await a(async()=>{const{chromeStoreSvg:t}=await import("./chrome-store-DvLcRjvV.js");return{chromeStoreSvg:t}},__vite__mapDeps([23,1,2,3]))).chromeStoreSvg,clock:async()=>(await a(async()=>{const{clockSvg:t}=await import("./clock-B9jxWZM1.js");return{clockSvg:t}},__vite__mapDeps([24,1,2,3]))).clockSvg,close:async()=>(await a(async()=>{const{closeSvg:t}=await import("./close-DltFzKcD.js");return{closeSvg:t}},__vite__mapDeps([25,1,2,3]))).closeSvg,compass:async()=>(await a(async()=>{const{compassSvg:t}=await import("./compass-Ai5n4Iur.js");return{compassSvg:t}},__vite__mapDeps([26,1,2,3]))).compassSvg,coinPlaceholder:async()=>(await a(async()=>{const{coinPlaceholderSvg:t}=await import("./coinPlaceholder-CgCxnJIy.js");return{coinPlaceholderSvg:t}},__vite__mapDeps([27,1,2,3]))).coinPlaceholderSvg,copy:async()=>(await a(async()=>{const{copySvg:t}=await import("./copy-ByN2OTb-.js");return{copySvg:t}},__vite__mapDeps([28,1,2,3]))).copySvg,cursor:async()=>(await a(async()=>{const{cursorSvg:t}=await import("./cursor-BQFCChyx.js");return{cursorSvg:t}},__vite__mapDeps([29,1,2,3]))).cursorSvg,cursorTransparent:async()=>(await a(async()=>{const{cursorTransparentSvg:t}=await import("./cursor-transparent-JXwauDP7.js");return{cursorTransparentSvg:t}},__vite__mapDeps([30,1,2,3]))).cursorTransparentSvg,circle:async()=>(await a(async()=>{const{circleSvg:t}=await import("./circle-DzCO00AE.js");return{circleSvg:t}},__vite__mapDeps([31,1,2,3]))).circleSvg,desktop:async()=>(await a(async()=>{const{desktopSvg:t}=await import("./desktop-DvZURtk9.js");return{desktopSvg:t}},__vite__mapDeps([32,1,2,3]))).desktopSvg,disconnect:async()=>(await a(async()=>{const{disconnectSvg:t}=await import("./disconnect-B7HkxyL8.js");return{disconnectSvg:t}},__vite__mapDeps([33,1,2,3]))).disconnectSvg,discord:async()=>(await a(async()=>{const{discordSvg:t}=await import("./discord-CGQI-YbL.js");return{discordSvg:t}},__vite__mapDeps([34,1,2,3]))).discordSvg,ethereum:async()=>(await a(async()=>{const{ethereumSvg:t}=await import("./ethereum-Dg-TWhnK.js");return{ethereumSvg:t}},__vite__mapDeps([35,1,2,3]))).ethereumSvg,etherscan:async()=>(await a(async()=>{const{etherscanSvg:t}=await import("./etherscan-C4RCEnTB.js");return{etherscanSvg:t}},__vite__mapDeps([36,1,2,3]))).etherscanSvg,extension:async()=>(await a(async()=>{const{extensionSvg:t}=await import("./extension-DIfyRtaM.js");return{extensionSvg:t}},__vite__mapDeps([37,1,2,3]))).extensionSvg,externalLink:async()=>(await a(async()=>{const{externalLinkSvg:t}=await import("./external-link-CBdADhKr.js");return{externalLinkSvg:t}},__vite__mapDeps([38,1,2,3]))).externalLinkSvg,facebook:async()=>(await a(async()=>{const{facebookSvg:t}=await import("./facebook-B7BIH0sv.js");return{facebookSvg:t}},__vite__mapDeps([39,1,2,3]))).facebookSvg,farcaster:async()=>(await a(async()=>{const{farcasterSvg:t}=await import("./farcaster-BZELB2xu.js");return{farcasterSvg:t}},__vite__mapDeps([40,1,2,3]))).farcasterSvg,filters:async()=>(await a(async()=>{const{filtersSvg:t}=await import("./filters-CBtVVO9O.js");return{filtersSvg:t}},__vite__mapDeps([41,1,2,3]))).filtersSvg,github:async()=>(await a(async()=>{const{githubSvg:t}=await import("./github-CckWGjSx.js");return{githubSvg:t}},__vite__mapDeps([42,1,2,3]))).githubSvg,google:async()=>(await a(async()=>{const{googleSvg:t}=await import("./google-BrBMsYb7.js");return{googleSvg:t}},__vite__mapDeps([43,1,2,3]))).googleSvg,helpCircle:async()=>(await a(async()=>{const{helpCircleSvg:t}=await import("./help-circle-CTlISDh1.js");return{helpCircleSvg:t}},__vite__mapDeps([44,1,2,3]))).helpCircleSvg,image:async()=>(await a(async()=>{const{imageSvg:t}=await import("./image-BnbkkA9m.js");return{imageSvg:t}},__vite__mapDeps([45,1,2,3]))).imageSvg,id:async()=>(await a(async()=>{const{idSvg:t}=await import("./id-BSAjsr11.js");return{idSvg:t}},__vite__mapDeps([46,1,2,3]))).idSvg,infoCircle:async()=>(await a(async()=>{const{infoCircleSvg:t}=await import("./info-circle-BVi_PhO6.js");return{infoCircleSvg:t}},__vite__mapDeps([47,1,2,3]))).infoCircleSvg,lightbulb:async()=>(await a(async()=>{const{lightbulbSvg:t}=await import("./lightbulb-CyQ4Bj-O.js");return{lightbulbSvg:t}},__vite__mapDeps([48,1,2,3]))).lightbulbSvg,mail:async()=>(await a(async()=>{const{mailSvg:t}=await import("./mail-Dk9fWXVq.js");return{mailSvg:t}},__vite__mapDeps([49,1,2,3]))).mailSvg,mobile:async()=>(await a(async()=>{const{mobileSvg:t}=await import("./mobile-B2DxRqby.js");return{mobileSvg:t}},__vite__mapDeps([50,1,2,3]))).mobileSvg,more:async()=>(await a(async()=>{const{moreSvg:t}=await import("./more--Qf2J244.js");return{moreSvg:t}},__vite__mapDeps([51,1,2,3]))).moreSvg,networkPlaceholder:async()=>(await a(async()=>{const{networkPlaceholderSvg:t}=await import("./network-placeholder-BjBhJVel.js");return{networkPlaceholderSvg:t}},__vite__mapDeps([52,1,2,3]))).networkPlaceholderSvg,nftPlaceholder:async()=>(await a(async()=>{const{nftPlaceholderSvg:t}=await import("./nftPlaceholder-CpQKAPIQ.js");return{nftPlaceholderSvg:t}},__vite__mapDeps([53,1,2,3]))).nftPlaceholderSvg,off:async()=>(await a(async()=>{const{offSvg:t}=await import("./off-Cuma0Mwn.js");return{offSvg:t}},__vite__mapDeps([54,1,2,3]))).offSvg,playStore:async()=>(await a(async()=>{const{playStoreSvg:t}=await import("./play-store-yH04x6Dh.js");return{playStoreSvg:t}},__vite__mapDeps([55,1,2,3]))).playStoreSvg,plus:async()=>(await a(async()=>{const{plusSvg:t}=await import("./plus-7YGbFFeP.js");return{plusSvg:t}},__vite__mapDeps([56,1,2,3]))).plusSvg,qrCode:async()=>(await a(async()=>{const{qrCodeIcon:t}=await import("./qr-code-CKHqEsG2.js");return{qrCodeIcon:t}},__vite__mapDeps([57,1,2,3]))).qrCodeIcon,recycleHorizontal:async()=>(await a(async()=>{const{recycleHorizontalSvg:t}=await import("./recycle-horizontal-C1R8MiSb.js");return{recycleHorizontalSvg:t}},__vite__mapDeps([58,1,2,3]))).recycleHorizontalSvg,refresh:async()=>(await a(async()=>{const{refreshSvg:t}=await import("./refresh-D4WWk-p-.js");return{refreshSvg:t}},__vite__mapDeps([59,1,2,3]))).refreshSvg,search:async()=>(await a(async()=>{const{searchSvg:t}=await import("./search-BHh4WX0A.js");return{searchSvg:t}},__vite__mapDeps([60,1,2,3]))).searchSvg,send:async()=>(await a(async()=>{const{sendSvg:t}=await import("./send-DmsWBrQw.js");return{sendSvg:t}},__vite__mapDeps([61,1,2,3]))).sendSvg,swapHorizontal:async()=>(await a(async()=>{const{swapHorizontalSvg:t}=await import("./swapHorizontal-8UXhlG3j.js");return{swapHorizontalSvg:t}},__vite__mapDeps([62,1,2,3]))).swapHorizontalSvg,swapHorizontalMedium:async()=>(await a(async()=>{const{swapHorizontalMediumSvg:t}=await import("./swapHorizontalMedium-DXUunWbq.js");return{swapHorizontalMediumSvg:t}},__vite__mapDeps([63,1,2,3]))).swapHorizontalMediumSvg,swapHorizontalBold:async()=>(await a(async()=>{const{swapHorizontalBoldSvg:t}=await import("./swapHorizontalBold-Bd_D-FL4.js");return{swapHorizontalBoldSvg:t}},__vite__mapDeps([64,1,2,3]))).swapHorizontalBoldSvg,swapHorizontalRoundedBold:async()=>(await a(async()=>{const{swapHorizontalRoundedBoldSvg:t}=await import("./swapHorizontalRoundedBold-DNOo1bIg.js");return{swapHorizontalRoundedBoldSvg:t}},__vite__mapDeps([65,1,2,3]))).swapHorizontalRoundedBoldSvg,swapVertical:async()=>(await a(async()=>{const{swapVerticalSvg:t}=await import("./swapVertical-CLtEf3J9.js");return{swapVerticalSvg:t}},__vite__mapDeps([66,1,2,3]))).swapVerticalSvg,solana:async()=>(await a(async()=>{const{solanaSvg:t}=await import("./solana-ZVavSeEm.js");return{solanaSvg:t}},__vite__mapDeps([67,1,2,3]))).solanaSvg,telegram:async()=>(await a(async()=>{const{telegramSvg:t}=await import("./telegram-B5pSvHA5.js");return{telegramSvg:t}},__vite__mapDeps([68,1,2,3]))).telegramSvg,threeDots:async()=>(await a(async()=>{const{threeDotsSvg:t}=await import("./three-dots-DLZ4oBtB.js");return{threeDotsSvg:t}},__vite__mapDeps([69,1,2,3]))).threeDotsSvg,twitch:async()=>(await a(async()=>{const{twitchSvg:t}=await import("./twitch-pLTVOfAq.js");return{twitchSvg:t}},__vite__mapDeps([70,1,2,3]))).twitchSvg,twitter:async()=>(await a(async()=>{const{xSvg:t}=await import("./x-DV-CVX5B.js");return{xSvg:t}},__vite__mapDeps([71,1,2,3]))).xSvg,twitterIcon:async()=>(await a(async()=>{const{twitterIconSvg:t}=await import("./twitterIcon-D1PNqoZg.js");return{twitterIconSvg:t}},__vite__mapDeps([72,1,2,3]))).twitterIconSvg,verify:async()=>(await a(async()=>{const{verifySvg:t}=await import("./verify-Z5ys5Lam.js");return{verifySvg:t}},__vite__mapDeps([73,1,2,3]))).verifySvg,verifyFilled:async()=>(await a(async()=>{const{verifyFilledSvg:t}=await import("./verify-filled-DZeLC65X.js");return{verifyFilledSvg:t}},__vite__mapDeps([74,1,2,3]))).verifyFilledSvg,wallet:async()=>(await a(async()=>{const{walletSvg:t}=await import("./wallet-T1LKWEAX.js");return{walletSvg:t}},__vite__mapDeps([75,1,2,3]))).walletSvg,walletConnect:async()=>(await a(async()=>{const{walletConnectSvg:t}=await import("./walletconnect-DaMgllMa.js");return{walletConnectSvg:t}},__vite__mapDeps([76,1,2,3]))).walletConnectSvg,walletConnectLightBrown:async()=>(await a(async()=>{const{walletConnectLightBrownSvg:t}=await import("./walletconnect-DaMgllMa.js");return{walletConnectLightBrownSvg:t}},__vite__mapDeps([76,1,2,3]))).walletConnectLightBrownSvg,walletConnectBrown:async()=>(await a(async()=>{const{walletConnectBrownSvg:t}=await import("./walletconnect-DaMgllMa.js");return{walletConnectBrownSvg:t}},__vite__mapDeps([76,1,2,3]))).walletConnectBrownSvg,walletPlaceholder:async()=>(await a(async()=>{const{walletPlaceholderSvg:t}=await import("./wallet-placeholder-BnEjSv3m.js");return{walletPlaceholderSvg:t}},__vite__mapDeps([77,1,2,3]))).walletPlaceholderSvg,warningCircle:async()=>(await a(async()=>{const{warningCircleSvg:t}=await import("./warning-circle-C6DduBls.js");return{warningCircleSvg:t}},__vite__mapDeps([78,1,2,3]))).warningCircleSvg,x:async()=>(await a(async()=>{const{xSvg:t}=await import("./x-DV-CVX5B.js");return{xSvg:t}},__vite__mapDeps([71,1,2,3]))).xSvg,info:async()=>(await a(async()=>{const{infoSvg:t}=await import("./info-d3RxncVO.js");return{infoSvg:t}},__vite__mapDeps([79,1,2,3]))).infoSvg,exclamationTriangle:async()=>(await a(async()=>{const{exclamationTriangleSvg:t}=await import("./exclamation-triangle-CLJJEiga.js");return{exclamationTriangleSvg:t}},__vite__mapDeps([80,1,2,3]))).exclamationTriangleSvg,reown:async()=>(await a(async()=>{const{reownSvg:t}=await import("./reown-logo-CXuFs_Ps.js");return{reownSvg:t}},__vite__mapDeps([81,1,2,3]))).reownSvg,"x-mark":async()=>(await a(async()=>{const{xMarkSvg:t}=await import("./x-mark-DHzlDD20.js");return{xMarkSvg:t}},__vite__mapDeps([82,1,2,3]))).xMarkSvg};async function it(t){if(A.has(t))return A.get(t);const e=(D[t]??D.copy)();return A.set(t,e),e}let g=class extends O{constructor(){super(...arguments),this.size="md",this.name="copy",this.color="fg-300",this.aspectRatio="1 / 1"}render(){return this.style.cssText=`
      --local-color: ${`var(--wui-color-${this.color});`}
      --local-width: ${`var(--wui-icon-size-${this.size});`}
      --local-aspect-ratio: ${this.aspectRatio}
    `,m`${Q(it(this.name),m`<div class="fallback"></div>`)}`}};g.styles=[R,j,tt];y([l()],g.prototype,"size",void 0);y([l()],g.prototype,"name",void 0);y([l()],g.prototype,"color",void 0);y([l()],g.prototype,"aspectRatio",void 0);g=y([$("wui-icon")],g);/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const at=b(class extends x{constructor(t){var i;if(super(t),t.type!==V.ATTRIBUTE||t.name!=="class"||((i=t.strings)==null?void 0:i.length)>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return" "+Object.keys(t).filter(i=>t[i]).join(" ")+" "}update(t,[i]){var n,o;if(this.st===void 0){this.st=new Set,t.strings!==void 0&&(this.nt=new Set(t.strings.join(" ").split(/\s/).filter(r=>r!=="")));for(const r in i)i[r]&&!((n=this.nt)!=null&&n.has(r))&&this.st.add(r);return this.render(i)}const e=t.element.classList;for(const r of this.st)r in i||(e.remove(r),this.st.delete(r));for(const r in i){const s=!!i[r];s===this.st.has(r)||(o=this.nt)!=null&&o.has(r)||(s?(e.add(r),this.st.add(r)):(e.remove(r),this.st.delete(r)))}return T}}),et=P`
  :host {
    display: inline-flex !important;
  }

  slot {
    width: 100%;
    display: inline-block;
    font-style: normal;
    font-family: var(--wui-font-family);
    font-feature-settings:
      'tnum' on,
      'lnum' on,
      'case' on;
    line-height: 130%;
    font-weight: var(--wui-font-weight-regular);
    overflow: inherit;
    text-overflow: inherit;
    text-align: var(--local-align);
    color: var(--local-color);
  }

  .wui-line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }

  .wui-line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .wui-font-medium-400 {
    font-size: var(--wui-font-size-medium);
    font-weight: var(--wui-font-weight-light);
    letter-spacing: var(--wui-letter-spacing-medium);
  }

  .wui-font-medium-600 {
    font-size: var(--wui-font-size-medium);
    letter-spacing: var(--wui-letter-spacing-medium);
  }

  .wui-font-title-600 {
    font-size: var(--wui-font-size-title);
    letter-spacing: var(--wui-letter-spacing-title);
  }

  .wui-font-title-6-600 {
    font-size: var(--wui-font-size-title-6);
    letter-spacing: var(--wui-letter-spacing-title-6);
  }

  .wui-font-mini-700 {
    font-size: var(--wui-font-size-mini);
    letter-spacing: var(--wui-letter-spacing-mini);
    text-transform: uppercase;
  }

  .wui-font-large-500,
  .wui-font-large-600,
  .wui-font-large-700 {
    font-size: var(--wui-font-size-large);
    letter-spacing: var(--wui-letter-spacing-large);
  }

  .wui-font-2xl-500,
  .wui-font-2xl-600,
  .wui-font-2xl-700 {
    font-size: var(--wui-font-size-2xl);
    letter-spacing: var(--wui-letter-spacing-2xl);
  }

  .wui-font-paragraph-400,
  .wui-font-paragraph-500,
  .wui-font-paragraph-600,
  .wui-font-paragraph-700 {
    font-size: var(--wui-font-size-paragraph);
    letter-spacing: var(--wui-letter-spacing-paragraph);
  }

  .wui-font-small-400,
  .wui-font-small-500,
  .wui-font-small-600 {
    font-size: var(--wui-font-size-small);
    letter-spacing: var(--wui-letter-spacing-small);
  }

  .wui-font-tiny-400,
  .wui-font-tiny-500,
  .wui-font-tiny-600 {
    font-size: var(--wui-font-size-tiny);
    letter-spacing: var(--wui-letter-spacing-tiny);
  }

  .wui-font-micro-700,
  .wui-font-micro-600,
  .wui-font-micro-500 {
    font-size: var(--wui-font-size-micro);
    letter-spacing: var(--wui-letter-spacing-micro);
    text-transform: uppercase;
  }

  .wui-font-tiny-400,
  .wui-font-small-400,
  .wui-font-medium-400,
  .wui-font-paragraph-400 {
    font-weight: var(--wui-font-weight-light);
  }

  .wui-font-large-700,
  .wui-font-paragraph-700,
  .wui-font-micro-700,
  .wui-font-mini-700 {
    font-weight: var(--wui-font-weight-bold);
  }

  .wui-font-medium-600,
  .wui-font-medium-title-600,
  .wui-font-title-6-600,
  .wui-font-large-600,
  .wui-font-paragraph-600,
  .wui-font-small-600,
  .wui-font-tiny-600,
  .wui-font-micro-600 {
    font-weight: var(--wui-font-weight-medium);
  }

  :host([disabled]) {
    opacity: 0.4;
  }
`;var f=function(t,i,e,n){var o=arguments.length,r=o<3?i:n===null?n=Object.getOwnPropertyDescriptor(i,e):n,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,i,e,n);else for(var c=t.length-1;c>=0;c--)(s=t[c])&&(r=(o<3?s(r):o>3?s(i,e,r):s(i,e))||r);return o>3&&r&&Object.defineProperty(i,e,r),r};let p=class extends O{constructor(){super(...arguments),this.variant="paragraph-500",this.color="fg-300",this.align="left",this.lineClamp=void 0}render(){const i={[`wui-font-${this.variant}`]:!0,[`wui-color-${this.color}`]:!0,[`wui-line-clamp-${this.lineClamp}`]:!!this.lineClamp};return this.style.cssText=`
      --local-align: ${this.align};
      --local-color: var(--wui-color-${this.color});
    `,m`<slot class=${at(i)}></slot>`}};p.styles=[R,et];f([l()],p.prototype,"variant",void 0);f([l()],p.prototype,"color",void 0);f([l()],p.prototype,"align",void 0);f([l()],p.prototype,"lineClamp",void 0);p=f([$("wui-text")],p);const rt=P`
  :host {
    display: flex;
    width: inherit;
    height: inherit;
  }
`;var u=function(t,i,e,n){var o=arguments.length,r=o<3?i:n===null?n=Object.getOwnPropertyDescriptor(i,e):n,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,i,e,n);else for(var c=t.length-1;c>=0;c--)(s=t[c])&&(r=(o<3?s(r):o>3?s(i,e,r):s(i,e))||r);return o>3&&r&&Object.defineProperty(i,e,r),r};let _=class extends O{render(){return this.style.cssText=`
      flex-direction: ${this.flexDirection};
      flex-wrap: ${this.flexWrap};
      flex-basis: ${this.flexBasis};
      flex-grow: ${this.flexGrow};
      flex-shrink: ${this.flexShrink};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      column-gap: ${this.columnGap&&`var(--wui-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap&&`var(--wui-spacing-${this.rowGap})`};
      gap: ${this.gap&&`var(--wui-spacing-${this.gap})`};
      padding-top: ${this.padding&&v.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&v.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&v.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&v.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&v.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&v.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&v.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&v.getSpacingStyles(this.margin,3)};
    `,m`<slot></slot>`}};_.styles=[R,rt];u([l()],_.prototype,"flexDirection",void 0);u([l()],_.prototype,"flexWrap",void 0);u([l()],_.prototype,"flexBasis",void 0);u([l()],_.prototype,"flexGrow",void 0);u([l()],_.prototype,"flexShrink",void 0);u([l()],_.prototype,"alignItems",void 0);u([l()],_.prototype,"justifyContent",void 0);u([l()],_.prototype,"columnGap",void 0);u([l()],_.prototype,"rowGap",void 0);u([l()],_.prototype,"gap",void 0);u([l()],_.prototype,"padding",void 0);u([l()],_.prototype,"margin",void 0);_=u([$("wui-flex")],_);/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const wt=t=>t??H;export{b as a,at as e,K as f,l as n,wt as o,st as r};
