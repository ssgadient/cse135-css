// SESSION MANAGEMENT
function getSessionID() {
    let sid = sessionStorage.getItem('_collector_sid');
    if (!sid) {
        sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessionStorage.setItem('_collector_sid', sid);
    }
    return sid;
}

const SESSION_ID = getSessionID();
const ENDPOINT = "https://collector.cse135-css.site/collect/";

// SEND FUNCTION
function sendData(type, data) {
  const payload = {
    session_id: SESSION_ID,
    type,
    url: window.location.href,
    title: document.title,
    referrer: document.referrer,
    timestamp: Date.now(),
    data
  };

  const json = JSON.stringify(payload);
  const blob = new Blob([json], { type: "application/json" });

  if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, blob)) {
    return;
  }

  fetch(ENDPOINT, {
    method: "POST",
    body: json,
    headers: { "Content-Type": "application/json" },
    keepalive: true
  }).catch(() => {
    fetch(ENDPOINT, {
      method: "POST",
      body: json,
      headers: { "Content-Type": "application/json" }
    }).catch(() => {});
  });
}


// STATIC DATA
function collectStatic() {

  const img = new Image();

  img.onload = () => sendStatic(true);
  img.onerror = () => sendStatic(false);

  img.src =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

  function sendStatic(imagesEnabled) {

    // CSS detection
    const testDiv = document.createElement("div");
    testDiv.className = "css-test";
    document.body.appendChild(testDiv);

    const style = document.createElement("style");
    style.innerHTML = ".css-test { width: 123px; }";
    document.head.appendChild(style);

    const cssEnabled =
      window.getComputedStyle(testDiv).width === "123px";

    document.body.removeChild(testDiv);
    document.head.removeChild(style);

    // Network info
    let connection = {};
    if ("connection" in navigator) {
      const c = navigator.connection;
      connection = {
        effectiveType: c.effectiveType,
        downlink: c.downlink,
        rtt: c.rtt,
        saveData: c.saveData
      };
    }

    sendData("static", {
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,

      jsEnabled: true,
      imagesEnabled,
      cssEnabled,

      screenWidth: screen.width,
      screenHeight: screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,

      connection
    });
  }
}


// PERFORMANCE DATA
function round(n) {
  return Math.round(n * 100) / 100;
}

function collectPerformance() {
  const entries = performance.getEntriesByType("navigation");
  if (!entries.length) return;

  const n = entries[0];

  const startLoad = n.fetchStart;
  const endLoad = n.loadEventEnd;
  const totalLoadTime = endLoad - startLoad;

  sendData("performance", {
    timingObject: n.toJSON(),

    startLoad,
    endLoad,
    totalLoadTime,

    dnsLookup: round(n.domainLookupEnd - n.domainLookupStart),
    tcpConnect: round(n.connectEnd - n.connectStart),
    tlsHandshake:
      n.secureConnectionStart > 0
        ? round(n.connectEnd - n.secureConnectionStart)
        : 0,
    ttfb: round(n.responseStart - n.requestStart),
    download: round(n.responseEnd - n.responseStart),
    domInteractive: round(n.domInteractive - n.fetchStart),
    domComplete: round(n.domComplete - n.fetchStart),
    loadEvent: round(n.loadEventEnd - n.fetchStart)
  });
}

// ACTIVITY DATA
/* document.addEventListener(
    "mousemove",
    e => {
        sendData("mousemove", {
            x: e.clientX,
            y: e.clientY
        });
    }
);
*/

// Throttled mousemove (every 200ms)
let lastMouseSent = 0;
document.addEventListener(
    "mousemove",
    (e) => {
        const now = Date.now();
        if (now - lastMouseSent > 200) {
            lastMouseSent = now;
            sendData("mousemove", {
                x: e.clientX,
                y: e.clientY
            });
        }
});

document.addEventListener(
    "click",
    e => {
        sendData("click", {
            x: e.clientX,
            y: e.clientY,
            button: e.button
        });
    }
);

document.addEventListener(
    "scroll",
    e => {
        sendData("scroll", {
            x: window.scrollX,
            y: window.scrollY
        });
    }
);

document.addEventListener(
    "keydown",
    e => {
        sendData("keydown", {
            key: e.key
        });
    }
);

document.addEventListener(
    "keyup",
    e => {
        sendData("keyup", {
            key: e.key
        });
    }
);

// ERROR TRACKING
window.addEventListener("error", (event) => {
  if (event instanceof ErrorEvent) {
    sendData("js-error", {
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error ? event.error.stack : ""
    });
  }
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  sendData("promise-rejection", {
    message:
      reason instanceof Error ? reason.message : String(reason),
    stack:
      reason instanceof Error ? reason.stack : ""
  });
});

window.addEventListener(
  "error",
  (event) => {
    if (!(event instanceof ErrorEvent)) {
      const target = event.target;
      if (
        target &&
        (target.tagName === "IMG" ||
          target.tagName === "SCRIPT" ||
          target.tagName === "LINK")
      ) {
        sendData("resource-error", {
          tagName: target.tagName,
          src: target.src || target.href || ""
        });
      }
    }
  },
  true
);

// IDLE TRACKING
let idleStart = null;
let idleTimer;
function resetIdle() {
    if (idleStart) {
        const idleTime = Date.now() - idleStart;

        sendData("idle_end", {
            duration: idleTime
        });
        idleStart = null;
    }

    clearTimeout(idleTimer);

    idleTimer = setTimeout(() => {
        idleStart = Date.now();
        sendData("idle_start", {});
    }, 2000);

}

["mousemove", "keydown", "scroll", "click"].forEach(evt =>
  document.addEventListener(evt, resetIdle)
);

// PAGE ENTER
sendData("enter", {});

// PAGE EXIT
window.addEventListener(
    "beforeunload",
    () => {
        sendData("exit", {});
    }
);

// RUN COLLECTION
window.addEventListener(
    "load",
    () => {
        collectStatic();
        collectPerformance();
    }
);
