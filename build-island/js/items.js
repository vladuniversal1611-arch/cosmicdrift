/* Items: every resource / material in the game, its icon and sell price.
   raw = gathered on islands, mat = crafted at stations, cur = currency. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});

  const ITEMS = {
    coins: { name: 'Coins', kind: 'cur' },
    crystal: { name: 'Crystal', kind: 'raw', sell: 6, color: '#8ff6ff' },
    wood: { name: 'Wood', kind: 'raw', sell: 1, color: '#ffd28a' },
    stone: { name: 'Stone', kind: 'raw', sell: 1, color: '#eef2fa' },
    sand: { name: 'Sand', kind: 'raw', sell: 1, color: '#ffe3a0' },
    iron: { name: 'Iron Ore', kind: 'raw', sell: 2, color: '#ffb27a' },
    coal: { name: 'Coal', kind: 'raw', sell: 2, color: '#c9c9d6' },
    plank: { name: 'Planks', kind: 'mat', sell: 3, color: '#ffc27a' },
    brick: { name: 'Bricks', kind: 'mat', sell: 4, color: '#ff9a7a' },
    glass: { name: 'Glass', kind: 'mat', sell: 6, color: '#bff0ff' },
    ingot: { name: 'Iron Bars', kind: 'mat', sell: 10, color: '#e3e9f5' },
    tools: { name: 'Tools', kind: 'mat', sell: 25, color: '#ffe08a' },
    core: { name: 'Energy Core', kind: 'mat', sell: 60, color: '#7ff6ff' },
  };
  const ORDER = ['wood', 'stone', 'sand', 'iron', 'coal', 'crystal', 'plank', 'brick', 'glass', 'ingot', 'tools', 'core'];

  const ICONS = {
    coins: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12.6" r="10" fill="#d98a00"/><circle cx="12" cy="11.4" r="10" fill="#ffcb2f"/><circle cx="12" cy="11.4" r="7.2" fill="#ffe27a"/><path d="M12 6.6l1.5 3.1 3.4.4-2.5 2.3.7 3.4-3.1-1.7-3.1 1.7.7-3.4-2.5-2.3 3.4-.4z" fill="#e59a00"/></svg>',
    crystal: '<svg viewBox="0 0 24 24"><path d="M12 1.5l7.5 7L12 22.5 4.5 8.5z" fill="#1aa7e0"/><path d="M12 1.5l7.5 7H12z" fill="#7fe9ff"/><path d="M12 1.5L4.5 8.5H12z" fill="#c4f6ff"/><path d="M4.5 8.5h7.5v14z" fill="#3fd0ff"/><path d="M19.5 8.5H12v14z" fill="#0b7fc0"/></svg>',
    wood: '<svg viewBox="0 0 24 24"><rect x="1.5" y="7" width="18" height="10.5" rx="4" fill="#a8622b"/><rect x="1.5" y="7" width="18" height="4" rx="2" fill="#c47a3c"/><ellipse cx="19" cy="12.25" rx="3.6" ry="5.25" fill="#f0c38e"/><ellipse cx="19" cy="12.25" rx="2" ry="3" fill="#d39a5c"/><ellipse cx="19" cy="12.25" rx=".8" ry="1.2" fill="#a8622b"/></svg>',
    stone: '<svg viewBox="0 0 24 24"><path d="M2.5 16.5l2.8-8 6.4-3.6 7.3 2.8 2.5 8.2-5 4.6H7.6z" fill="#7c859a"/><path d="M5.3 8.5l6.4-3.6 7.3 2.8-5.6 3.4z" fill="#d3d9e4"/><path d="M13.4 11.1l5.6-3.4 2.5 8.2-5 4.6z" fill="#5f6779"/><path d="M5.3 8.5l8.1 2.6-2.1 9.9H7.6l-5.1-4.5z" fill="#a3abbd"/></svg>',
    sand: '<svg viewBox="0 0 24 24"><path d="M1.5 19.5C4 12.5 7.5 9 12 9s8 3.5 10.5 10.5z" fill="#d9a85a"/><path d="M4 19.5C6 14 8.8 11 12 11s6 3 8 8.5z" fill="#f2cd85"/><path d="M8 14.5c1.3-1.6 2.6-2.4 4-2.4" stroke="#fff3d0" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="10" cy="17.5" r=".9" fill="#c9954a"/><circle cx="15" cy="16.5" r=".9" fill="#c9954a"/></svg>',
    iron: '<svg viewBox="0 0 24 24"><path d="M2.5 16.5l2.8-8 6.4-3.6 7.3 2.8 2.5 8.2-5 4.6H7.6z" fill="#6e625d"/><path d="M5.3 8.5l6.4-3.6 7.3 2.8-5.6 3.4z" fill="#a8988f"/><path d="M13.4 11.1l5.6-3.4 2.5 8.2-5 4.6z" fill="#544944"/><circle cx="8.5" cy="14" r="1.8" fill="#e8783a"/><circle cx="15.5" cy="15.5" r="1.4" fill="#e8783a"/><circle cx="12" cy="8.2" r="1.2" fill="#ffa868"/></svg>',
    coal: '<svg viewBox="0 0 24 24"><path d="M2.5 16.5l2.8-8 6.4-3.6 7.3 2.8 2.5 8.2-5 4.6H7.6z" fill="#23232b"/><path d="M5.3 8.5l6.4-3.6 7.3 2.8-5.6 3.4z" fill="#4d4d5a"/><path d="M13.4 11.1l5.6-3.4 2.5 8.2-5 4.6z" fill="#15151b"/><path d="M8 13l2.2 1-1.4 2.2z" fill="#7a7a8c"/><path d="M14.5 15l2-1.2v2.4z" fill="#7a7a8c"/></svg>',
    plank: '<svg viewBox="0 0 24 24"><rect x="2" y="4.5" width="20" height="5" rx="1.2" fill="#e2a862"/><rect x="2" y="10.5" width="20" height="5" rx="1.2" fill="#cc8a44"/><rect x="2" y="16.5" width="20" height="4.5" rx="1.2" fill="#b47334"/><path d="M5 7h6M13 13h6M6 18.7h5" stroke="#8a5527" stroke-width="1.1" stroke-linecap="round"/></svg>',
    brick: '<svg viewBox="0 0 24 24"><path d="M2.5 10l9.5-4.5 9.5 4.5v7.5L12 22l-9.5-4.5z" fill="#c4553a"/><path d="M2.5 10L12 5.5l9.5 4.5-9.5 4.5z" fill="#ec8060"/><path d="M12 14.5V22l9.5-4.5V10z" fill="#9a3a22"/><path d="M5 14l4.5 2M14.5 17.5l4.5-2" stroke="#f3b49c" stroke-width="1" stroke-linecap="round"/></svg>',
    glass: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="2" fill="#9fe3ff" opacity=".8"/><rect x="3.5" y="3.5" width="17" height="17" rx="2" fill="none" stroke="#e9fbff" stroke-width="1.8"/><path d="M7 14.5l6-7.5M10 17.5l5.5-6.5" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>',
    ingot: '<svg viewBox="0 0 24 24"><path d="M1.5 18l4.2-9h12.6l4.2 9z" fill="#848da1"/><path d="M5.7 9h12.6l-2 4.3H7.7z" fill="#e1e7f1"/><path d="M1.5 18l4.2-9 2 4.3L5.5 18z" fill="#a9b2c4"/><path d="M22.5 18l-4.2-9-2 4.3 2.2 4.7z" fill="#646c7f"/></svg>',
    tools: '<svg viewBox="0 0 24 24"><rect x="10.6" y="8" width="3" height="14.5" rx="1.3" fill="#a8622b" transform="rotate(-35 12 15)"/><path d="M3.5 6.5l6-4 5.5 3.6-2.6 3.9-3.6-1.4-3.4 2.3z" fill="#9aa3b5"/><path d="M3.5 6.5l6-4 1.5 1-6 4z" fill="#dfe5ee"/><circle cx="18" cy="17" r="3.6" fill="none" stroke="#cfd6e2" stroke-width="2.2"/></svg>',
    core: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1d4fc0"/><circle cx="12" cy="12" r="7" fill="#35e0ff"/><circle cx="10" cy="9.8" r="2.6" fill="#e3fdff"/><path d="M12 1.5v3.5M12 19v3.5M1.5 12h3.5M19 12h3.5" stroke="#9ff4ff" stroke-width="1.7" stroke-linecap="round"/></svg>',
    xp: '<svg viewBox="0 0 24 24"><path d="M12 1.8l3.1 6.4 7 .9-5.1 4.9 1.3 7-6.3-3.4-6.3 3.4 1.3-7L1.9 9.1l7-.9z" fill="#ffcb2f" stroke="#e08a00" stroke-width="1.3" stroke-linejoin="round"/></svg>',
    house: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8z" fill="#ef5a4a"/><rect x="5" y="11" width="14" height="10" rx="1.5" fill="#e8b479"/><rect x="10" y="14" width="4" height="7" fill="#7a4520"/></svg>',
    build: '<svg viewBox="0 0 24 24"><rect x="10" y="9" width="3.4" height="13" rx="1.4" transform="rotate(-40 12 15)" fill="#a8622b"/><path d="M5 5.5l7-3.5 6 3-1.8 3.6-4.2-1.6-4.8 2.4z" fill="#a3abbd"/></svg>',
    expand: '<svg viewBox="0 0 24 24"><path d="M12 2l10 5.5v9L12 22 2 16.5v-9z" fill="#4cd964"/><path d="M12 2l10 5.5L12 13 2 7.5z" fill="#8af07a"/><path d="M12 6v12M6 12h12" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><path d="M12 2l1.8 2.6 3.1-.6.6 3.1L20 9l-1.2 3 1.2 3-2.5 1.9-.6 3.1-3.1-.6L12 22l-1.8-2.6-3.1.6-.6-3.1L4 15l1.2-3L4 9l2.5-1.9.6-3.1 3.1.6z" fill="#ffcb2f"/><circle cx="12" cy="12" r="3.6" fill="#a86a00"/></svg>',
    island: '<svg viewBox="0 0 24 24"><path d="M2 12l10-5 10 5-10 5z" fill="#8af07a"/><path d="M2 12l10 5v5L5 16z" fill="#b9783f"/><path d="M22 12l-10 5v5l7-6z" fill="#8f5a2c"/><circle cx="12" cy="9.5" r="2.4" fill="#2f9e3a"/></svg>',
    sell: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffcb2f"/><path d="M12 6v12M8.5 9.5c0-1.5 1.5-2.3 3.5-2.3s3.5.8 3.5 2.2c0 3-7 1.6-7 4.8 0 1.4 1.5 2.4 3.5 2.4s3.5-.9 3.5-2.4" stroke="#8a5a00" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
  };

  const imgCache = {};
  /** <img>-ready Image of an icon, for drawing on the canvas. */
  function iconImg(key) {
    let im = imgCache[key];
    if (!im) {
      im = new Image();
      const svg = (ICONS[key] || ICONS.stone).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" ');
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      imgCache[key] = im;
    }
    return im;
  }
  ORDER.concat(['coins']).forEach(iconImg);

  function name(key) { return (ITEMS[key] && ITEMS[key].name) || key; }

  BI.Items = { ITEMS, ORDER, ICONS, iconImg, name };
})();
