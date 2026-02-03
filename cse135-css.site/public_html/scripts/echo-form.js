document.getElementById("echoForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const lang     = document.getElementById("language").value; // Added
  const method   = document.getElementById("method").value;
  const encoding = document.getElementById("encoding").value;
  const message  = document.getElementById("message").value;
  const output   = document.getElementById("output");

  // Mapping to build the URL based on selection
  const extensions = {
    "cpp": "cgi",
    "python": "py",
    "jsp": "jsp"
  };
  
  // Dynamic URL based on language selection
  const url = `../hw2/cgi-bin/echo-${lang.toLowerCase()}.${extensions[lang]}`;

  if (encoding === "json") {
    fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    })
    .then(r => r.text())
    .then(t => output.textContent = t);

  } else {
    const params = new URLSearchParams({ message });

    fetch(
      (method === "GET" || method === "DELETE") ? `${url}?${params}` : url,
      {
        method: method,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: (method === "GET" || method === "DELETE") ? null : params
      }
    )
    .then(r => r.text())
    .then(t => output.textContent = t);
  }
});