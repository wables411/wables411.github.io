// /Users/wables/wables411.github.io/src/Home.jsx
import React, { useEffect } from 'react';
import './style.css';

function Home() {
  useEffect(() => {
    window.ownerId = 'BeKFkmLuHigZMDaKysu2ugBymkmKfcrHkMz6rWBQzzSo';
    window.collectionId = 'iVhHZ1Oy0LrIoVTG9C2v';

    let databaseInitAttempts = 0;
    const initializeSupabase = async () => {
      try {
        if (!window.supabase) {
          if (databaseInitAttempts < 5) {
            databaseInitAttempts++;
            setTimeout(initializeSupabase, 1000);
            return;
          }
          throw new Error('Supabase library not loaded');
        }
        window.gameDatabase = window.supabase.createClient(
          'https://roxwocgknkiqnsgiojgz.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveHdvY2drbmtpcW5zZ2lvamd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NjMxMTIsImV4cCI6MjA0NjMzOTExMn0.NbLMZom-gk7XYGdV4MtXYcgR8R1s8xthrIQ0hpQfx9Y'
        );
        const { data, error } = await window.gameDatabase.from('leaderboard').select('count').single();
        if (error) throw error;
        await loadGameScripts();
      } catch (error) {
        console.error('Supabase initialization failed:', error);
        if (databaseInitAttempts < 5) {
          databaseInitAttempts++;
          setTimeout(initializeSupabase, 1000);
        }
      }
    };

    async function loadGameScripts() {
  try {
    const scripts = [
      '/assets/loadImages-fTm9cFM8.js',
      '/assets/loadImages2-CbGWNmap.js',
      '/assets/loadImages3-0Gofh18A.js',
      '/assets/memeGenerator-CU4yIeF2.js'
    ];
    for (const src of scripts) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true; // Ensure async loading
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
      });
    }
    console.log('All scripts loaded, calling loadCollections');
    loadCollections(); // Call directly after loading
  } catch (error) {
    console.error('Error in loadGameScripts:', error);
  }
}

    function setupEventListeners() {
      const videoContainer = document.querySelector('#station .video-container');
      const video = document.getElementById('stationVideo');
      const overlay = document.querySelector('#station .play-overlay');
      if (videoContainer && video && overlay) {
        videoContainer.addEventListener('click', () => {
          if (video.paused) {
            video.play();
            overlay.style.display = 'none';
          } else {
            video.pause();
            overlay.style.display = 'flex';
          }
        });
        video.addEventListener('ended', () => {
          overlay.style.display = 'flex';
        });
      }
    }

    initializeSupabase();

    const twitterScript = document.createElement('script');
    twitterScript.src = 'https://platform.twitter.com/widgets.js';
    twitterScript.async = true;
    document.body.appendChild(twitterScript);

    const tenorScript = document.createElement('script');
    tenorScript.src = 'https://tenor.com/embed.js';
    tenorScript.async = true;
    document.body.appendChild(tenorScript);

    const nexusToggleButton = document.getElementById('nexusToggleButton');
    const nexusVideo = document.getElementById('nexusVideo');
    if (nexusToggleButton && nexusVideo) {
      nexusToggleButton.addEventListener('click', () => {
        if (nexusVideo.paused) nexusVideo.play();
        else nexusVideo.pause();
      });
    }

    return () => {
      document.body.removeChild(twitterScript);
      document.body.removeChild(tenorScript);
    };
  }, []);

  return (
    <>
      <nav>
        <ul>
          <li><a href="#welcome">Welcome</a></li>
          <li><a href="https://lawb.xyz/mint" target="_blank" rel="noopener noreferrer">Mint Pixelawbs</a></li>
          <li><a href="#lawb-token">$LAWB</a></li>
          <li><a href="#nexus">LawbNexus</a></li>
          <li><a href="https://webring.ai/explore/agent/60eb37b2-1ab1-4c57-b541-7b95be809349" target="_blank" rel="noopener noreferrer">LawbNexus Responder</a></li>
          <li><a href="#station">LawbStation</a></li>
          <li><a href="/lawbchess.html" target="_blank" rel="noopener noreferrer">Play Chess</a></li>
          <li><a href="#starz">LawbStarz</a></li>
          <li><a href="#lawbsters">Lawbsters</a></li>
          <li><a href="#lore">Lore</a></li>
          <li><a href="#halloween">Halloween</a></li>
          <li><a href="https://x.com/LawbStation" target="_blank" rel="noopener noreferrer">Lawbstation Twitter</a></li>
          <li><a href="https://x.com/LawbNexus" target="_blank" rel="noopener noreferrer">LawbNexus Twitter</a></li>
          <li><a href="https://t.me/tickerlawb" target="_blank" rel="noopener noreferrer">Telegram</a></li>
          <li><a href="https://boards.miladychan.org/milady/33793" target="_blank" rel="noopener noreferrer">Chat</a></li>
        </ul>
      </nav>
      <div className="container">
        <marquee>there is no meme we lawb you</marquee>

        <section id="welcome" className="section">
          <h1>Lawb Headquarters</h1>
          <p>Lawbsters seem nice but a human controlled by a lobster will never amount to anything without a roadmap.</p>
          <h2>Lawb Meme Generator</h2>
          <div id="meme-generator">
            <label htmlFor="collection-selector">Select Collection:</label>
            <select id="collection-selector"></select>
            <label htmlFor="top-text">Top Text:</label>
            <input type="text" id="top-text" />
            <label htmlFor="bottom-text">Bottom Text:</label>
            <input type="text" id="bottom-text" />
            <img id="fetch-image" src="/images/fetch.gif" alt="Fetch Lawb" className="gif-button" />
            <img id="generate-meme" src="/images/addtext.gif" alt="Add Text" className="gif-button" />
            <img id="deep-fry" src="/images/deepfry.gif" alt="Deep Fry" className="gif-button" />
          </div>
          <img id="generated-meme" style={{ display: 'none' }} alt="" />
          <canvas id="meme-canvas" style={{ display: 'none' }}></canvas>

          <div id="lawb-token">
            <img src="/images/lawbticker.gif" alt="ticker $lawb" className="section-image" />
            <h1><a href="https://dexscreener.com/solana/dtxvuypheobwo66afefp9mfgt2e14c6ufexnvxwnvep" target="_blank" rel="noopener noreferrer">🦞 $LAWB</a></h1>
            <p>$lawb seems nice but a lawbster token on the Solana blockchain will never achieve anything without a roadmap.
              Token created 03.15.24 on <a href="https://www.pump.fun/65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6" target="_blank" rel="noopener noreferrer">pump.fun</a>.</p>
            <p>$lawb airdropped to LawbStation holders 03.19.24</p>
            <p>THERE IS NO MEME WE $LAWB YOU</p>
            <p>(sol) ca: 65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6</p>
            <p>(arb) ca: 0x741f8FbF42485E772D97f1955c31a5B8098aC962</p>
            <p>(dmt) ca: 0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F</p>
            <p>if you wish to bridge your $lawb token from solana to arbitrum to sanko, a wormhole is available via <a href="https://portalbridge.com/" target="_blank" rel="noopener noreferrer">https://portalbridge.com/</a></p>
            <p>step 1. connect solana wallet and select $lawb token (65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6)</p>
            <p>step 2. connect arbitrum wallet and select $lawb token (0x741f8FbF42485E772D97f1955c31a5B8098aC962)</p>
            <p>step 3. select token quantity, confirm transactions.</p>
            <p>step 4. now that you have $lawb on arbitrum, visit <a href="https://sanko.xyz/bridge" target="_blank" rel="noopener noreferrer">https://sanko.xyz/bridge</a> and connect your arb wallet.</p>
            <p>step 5. from arb wallet, select $lawb token.</p>
            <p>step 6. connect to sanko chain. if not already selected, select $lawb token on sanko (0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F)</p>
            <p>step 7. select quantity and confirm transactions.</p>
            <div id="dexscreener-embed">
              <iframe src="https://dexscreener.com/solana/DTxVuYphEobWo66afEfP9MfGt2E14C6UfeXnvXWnvep?embed=1&theme=dark&info=0" title="DexScreener"></iframe>
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
              <p>swap $lawb token on Unicorn Meme Market</p>
              <a href="https://uwu.pro/memoji/ulawb" target="_blank" rel="noopener noreferrer">
                <img src="/images/lawbuwu.png" alt="UWU Chart" className="section-image-half" style={{ maxWidth: '25%' }} />
              </a>
            </div>
            <a href="https://www.purity.finance/lawb" target="_blank" rel="noopener noreferrer">
              <img src="/images/purityfinance.png" alt="Purify with Purity Finance" className="section-image-half" />
            </a>
            <p className="purity-text">Click to Purify. Purity Finance consolidates dust tokens, unused accounts and unwanted NFTs into $LAWB in just one click, helping you reclaim hidden value from your wallet.</p>
          </div>
          <div className="video-section">
            <video autoPlay loop controls>
              <source src="/images/bluelawbnifty.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <p>Join the <a href="https://www.niftyisland.com/communities/9e8a5749-8381-406c-93d3-bdb123a1f25c" target="_blank" rel="noopener noreferrer">Lawbster community</a> on Nifty Island</p>
          </div>
          <h2>A community art project.</h2>
          <h2>Lawbster NFT collections and $LAWB token available on Solana and EVM chains.</h2>
          <a href="/images/Lawbsters.vrm" download="Lawbsters.vrm"><button>Streamers: click to download 3D VRM Lawbster</button></a>
          <a href="https://boards.miladychan.org/milady/33793" target="_blank" rel="noopener noreferrer" className="miladychan-link">
            <img src="/images/miladychan.png" alt="Miladychan Link" />
          </a>
        </section>

        <section id="nexus" className="section">
          <h1>LawbNexus</h1>
          <div className="video-container">
            <video id="nexusVideo" autoPlay muted loop>
              <source src="/images/nexusminting.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <button id="nexusToggleButton">Toggle Play/Pause</button>
          </div>
          <div className="mint-section">
            <h2>LawbNexus 1000x Xtra Ultra High Definition Lawbsters, packaged and distributed on Solana.</h2>
            <p>Collect on <a href="https://magiceden.us/marketplace/AfXkPjcfTWHz9WDjvXxZBkHSWQ1H7xsg7jT2fFLkAAi" target="_blank" rel="noopener noreferrer">secondary.</a></p>
            <p>Each collection has 24 hours to mint via <a href="https://www.launchmynft.io/collections/BeKFkmLuHigZMDaKysu2ugBymkmKfcrHkMz6rWBQzzSo/iVhHZ1Oy0LrIoVTG9C2v" target="_blank" rel="noopener noreferrer">LaunchMyNFT</a>.</p>
            <p><strong>*UPDATE: Due to reasons outside of Lawb control, LawbNexus sold out during the BadMen tier*</strong></p>
            <div className="image-button-row">
              <a href="https://dexscreener.com/solana/7jx9p6iobf3uy3kukt3s4jqswqat1bvumncd6awlaaeb" target="_blank" rel="noopener noreferrer"><img src="/images/lawbstation.GIF" alt="LAWBSTATION" className="section-image" /></a>
              <a href="https://dexscreener.com/solana/dtxvuypheobwo66afefp9mfgt2e14c6ufexnvxwnvep" target="_blank" rel="noopener noreferrer"><img src="/images/lawbticker.gif" alt="$LAWB" className="section-image" /></a>
              <a href="https://www.tensor.trade/trade/bad_men" target="_blank" rel="noopener noreferrer"><img src="/images/badmen.GIF" alt="BADMEN" className="section-image" /></a>
              <a href="https://dexscreener.com/solana/cgju7wmnlhpefngqemq1rpiztvicrg8xx2gzdgnbhjd8" target="_blank" rel="noopener noreferrer"><img src="/images/yippie.png" alt="$YIPPIE" className="section-image" /></a>
              <a href="https://dexscreener.com/solana/7jx9p6iobf3uy3kukt3s4jqswqat1bvumncd6awlaaeb" target="_blank" rel="noopener noreferrer"><img src="/images/bipci.png" alt="$BIPCI" className="section-image" /></a>
              <a href="https://dexscreener.com/solana/4pdwjssg28c4azs6esaxp7msyaqn8cfgdsy4gnrdtvmr" target="_blank" rel="noopener noreferrer"><img src="/images/swag.png" alt="$SWAG" className="section-image" /></a>
              <a href="https://dexscreener.com/solana/bcdfb7vnroy57exbxaybnyl9thsvimu1umow1acxccfv" target="_blank" rel="noopener noreferrer"><img src="/images/nbuttt.png" alt="$NIGGABUTT" className="section-image" /></a>
              <a href="https://www.tensor.trade/trade/relaxio" target="_blank" rel="noopener noreferrer"><img src="/images/relaxio.png" alt="RELAXIO" className="section-image" /></a>
            </div>
            <p>Follow <a href="https://twitter.com/LawbNexus" target="_blank" rel="noopener noreferrer">@LawbNexus</a> on Twitter to stay updated.</p>
            <a href="https://zora.co/collect/base:0xeffa1125545cb24b8526fa7d0752c385128fbcc7/1" target="_blank" rel="noopener noreferrer" className="bottom-button">
              <img src="/images/final lawb gif.gif" alt="LawbNexus" className="section-image" />
            </a>
          </div>
          <div className="meme-section">
            <video controls className="section-image" style={{ width: '100%' }}>
              <source src="/images/bapelawb.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <a href="https://zora.co/collect/base:0xeffa1125545cb24b8526fa7d0752c385128fbcc7/1" target="_blank" rel="noopener noreferrer" className="bottom-button">
              <img src="/images/0059_1.gif" alt="LawbNexus Meme" className="section-image" />
            </a>
          </div>
          <p>Choose your fighter. Search isolated LawbNexus by number. Right-click save. Create a meme. Start a fight. This is memetic warfare.</p>
          <div className="search-container">
            <input type="number" id="nexusImageSearch" placeholder="Enter image number" min="0" max="999" />
            <button id="nexusEnterButton" className="search-button">Enter</button>
            <button id="nexusClearButton" className="search-button">Clear</button>
          </div>
          <div id="nexusImageDisplay"></div>
        </section>

        <section id="station" className="section">
          <h1>LawbStation</h1>
          <div className="video-container">
            <video id="stationVideo" muted>
              <source src="/images/lawbstation_promo3.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="play-overlay"></div>
          </div>
          <div className="top-gif-container">
            <div className="tenor-gif-embed" data-postid="14418647991790600316" data-share-method="host" data-aspect-ratio="1">
              <a href="https://tenor.com/view/lawb-i-lawb-u-i-lawb-you-lawbstation-portionclub-gif-14418647991790600316">Lawb I Lawb U GIF</a>
            </div>
          </div>
          <p>LawbStations seem nice but a Lawbster built on <a href="https://www.miladystation2.net/" target="_blank" rel="noopener noreferrer">$MS2</a> technology living on the Solana blockchain will never achieve anything without a roadmap.</p>
          <p>1st Lawbster collection on Solana. Quantity: 420. Collect on <a href="https://magiceden.us/marketplace/lawbstation" target="_blank" rel="noopener noreferrer">secondary.</a></p>
          <p>Choose your fighter. Search isolated LawbStation by number. Right-click save. Create a meme. Start a fight. This is memetic warfare.</p>
          <div className="search-container">
            <input type="number" id="stationImageSearch" placeholder="Enter image number" min="0" max="419" />
            <button id="stationEnterButton" className="search-button">Enter</button>
            <button id="stationClearButton" className="search-button">Clear</button>
          </div>
          <div id="stationImageDisplay"></div>
          <div id="stationImageGallery" className="image-container"></div>
        </section>

        <section id="starz" className="section">
          <h1>LawbStarz</h1>
          <img src="/images/lawbstarz_bg2.png" alt="Lawbstarz Image" className="section-image" />
          <p>
            ☆ LAWBSTARZ 666x LOBSTERS DRIPPED IN BUTTER ☆ 666x PREMIUM PFP COLLECTION ☆ LAWBSTARZ IS A MUSIC NFT ☆ THE 1ST 
            <a href="https://allstarz.world/" target="_blank" rel="noopener noreferrer">ALLSTARZ DERIVATIVE</a> ☆ LAWBSTARZ IS INSPIRED BY 
            <a href="https://ilongfornetworkspirituality.net/" target="_blank" rel="noopener noreferrer">REMILIA CORP</a> ☆ LED BY NETWORK SPIRITUALITY ☆ 666 
            <a href="https://www.cigawrettepacks.shop/" target="_blank" rel="noopener noreferrer">CIGAWRETTEPACKS</a> WERE CONSUMED BY 
            <a href="https://nouns.build/dao/ethereum/0x0c12aba58fc88f1267fa772012495b47aaf31cab/" target="_blank" rel="noopener noreferrer">PORTIONCLUB69</a> 
            AND FRIENDS DURING THE CREATION OF LAWBSTARZ v1 ☆
          </p>
          <blockquote className="twitter-tweet">
            <p lang="en" dir="ltr">The following 🧵 has been transcripted from a live news broadcast:<br /><br />"Good evening, viewers. Tonight, we embark on an extraordinary journey that defies rational explanation. It all began with February's Cigawrette Packs cargo ship hijacking, little did we know that the.." <a href="https://t.co/BWgLOk59N4">pic.twitter.com/BWgLOk59N4</a></p>
            — wables 🚬✰🍨🦞🍞 (@wables411) <a href="https://twitter.com/wables411/status/1669009492007354369?ref_src=twsrc%5Etfw">June 14, 2023</a>
          </blockquote>
          <div className="scatter-section">
            <a href="https://www.scatter.art/lawbstarz?tab=mint">
              <img src="/images/lawbstarzhotelroom.PNG" alt="Lawbstarz Image" className="section-image" />
            </a>
            <p className="scatter-text">minted out on <a href="https://www.scatter.art/lawbstarz?tab=mint" className="button">Scatter</a></p>
          </div>
          <p><a href="https://magiceden.us/collections/ethereum/0xd7922cd333da5ab3758c95f774b092a7b13a5449">Click here to collect Lawbstarz on secondary</a></p>
          <div className="audio-player">
            <iframe src="https://audius.co/embed/track/PbYM2zm?flavor=tiny" width="50%" height="24" allowTransparency="true" allow="encrypted-media" style={{ border: 'none' }} title="Audius"></iframe>
          </div>
        </section>

        <section id="lawbsters" className="section">
          <h1>Lawbsters</h1>
          <p>Lawbsters seem nice but a human controlled by a lobster will never amount to anything without a roadmap.</p>
          <p>A Cigawrette Packs derivative. The first Lawbster collection on Eth. Quantity: 420</p>
          <p>Collect on <a href="https://magiceden.us/collections/ethereum/0x0ef7ba09c38624b8e9cc4985790a2f5dbfc1dc42" target="_blank" rel="noopener noreferrer">secondary</a></p>
          <blockquote className="twitter-tweet">
            <p lang="en" dir="ltr">The following 🧵 has been transcripted from a live news broadcast:<br /><br />"Just in, breaking news coming out of the high seas. A cargo ship has been hijacked by a group of degenerate lobsters, taking hostages & demanding a ransom. The situation is ongoing and authorities are scrambling <a href="https://t.co/lykBDDKYEb">pic.twitter.com/lykBDDKYEb</a></p>
            — wables 🚬✰🍨🦞🍞 (@wables411) <a href="https://twitter.com/wables411/status/1620879129850834944?ref_src=twsrc%5Etfw">February 1, 2023</a>
          </blockquote>
          <p>CHOOSE YOUR FIGHTER. Search Lawbster by number. Right-click save. Create a meme. Start a fight. THIS IS MEMETIC WARFARE.</p>
          <div className="search-container">
            <input type="number" id="imageSearch" placeholder="Enter image number" min="0" max="419" />
            <button id="enterButton" className="search-button">Enter</button>
            <button id="clearButton" className="search-button">Clear</button>
          </div>
          <div id="imageDisplay"></div>
          <div id="imageGallery" className="image-container"></div>
        </section>

        <section id="halloween" className="section">
          <h1>Halloween</h1>
          <p>
            🦞🎃 a Lawbster Halloween party seems nice but a group of what seems to be
            humans controlled by lobsters just hijacked the Spirit Halloween Superstore. 🎃🦞
          </p>
          <blockquote className="twitter-tweet">
            <p lang="en" dir="ltr">🚨EXPERT ANALYSIS: WHO HIJACKED THE SPIRIT HALLOWEEN SUPERSTORE?<br /><br />Marine Corps Veteran expert analysis of the recent hijacking incident at the superstore reveals critical findings:<br />🧵 <a href="https://t.co/m4Iy5wdjre">pic.twitter.com/m4Iy5wdjre</a></p>
            — portionclub (@PortionClub69) <a href="https://twitter.com/PortionClub69/status/1716485680040407145?ref_src=twsrc%5Etfw">October 23, 2023</a>
          </blockquote>
          <p>a portion club collection</p>
          <img src="/images/lawbsterhalloween.gif" alt="A Lawbster Halloween" className="section-image" />
          <p>Collect on <a href="https://magiceden.us/collections/base/0x8ab6733f8f8702c233f3582ec2a2750d3fc63a97" target="_blank" rel="noopener noreferrer">secondary</a></p>
        </section>

        <section id="lore" className="section">
          <h1>Lore</h1>
          <p>Explore the Lore on Zora: <a href="https://zora.co/collect/base:0xd49c9461471934e87467af00fff8d63312db913a">Link</a></p>
          <img src="/images/lawblore.gif" alt="Lawb Lore" className="section-image" />
        </section>

        <div id="vrm-container"></div>
      </div>
    </>
  );
}

export default Home;
