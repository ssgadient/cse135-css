document.addEventListener("DOMContentLoaded", function() {
  const form = document.getElementById("echoForm");
  const responseContainer = document.getElementById("responseContainer");

  form.addEventListener("submit", function(e) {
    e.preventDefault();

    // 1. Get user selections
    const lang = document.getElementById("language").value;
    const method = document.getElementById("method").value;
    const encoding = document.getElementById("encoding").value;
    const message = document.getElementById("message").value;

    // 2. Determine Endpoint based on Language
    // Adjust extensions (.cgi, .py, .jsp) to match your server setup
    let extension = "cgi"; 
    if (lang === "python") extension = "py";
    if (lang === "jsp") extension = "jsp";
    
    const url = `../hw2/cgi-bin/echo-${lang}.${extension}`;

    // 3. Prepare Payload and Headers
    let options = {
      method: method,
      headers: { "Content-Type": encoding }
    };

    const payload = { 
        message: message,
        timestamp: new Date().toISOString() 
    };

    if (encoding === "application/json") {
      const jsonBody = JSON.stringify(payload);
      if (method === "GET" || method === "DELETE") {
        // Encode JSON into a query parameter for GET/DELETE
        const query = encodeURIComponent(jsonBody);
        options.url = `${url}?data=${query}`;
      } else {
        options.body = jsonBody;
        options.url = url;
      }
    } else {
      // URL Encoded
      const params = new URLSearchParams({ message: message });
      if (method === "GET" || method === "DELETE") {
        options.url = `${url}?${params.toString()}`;
      } else {
        options.body = params.toString();
        options.url = url;
      }
    }

    // 4. Dispatch Fetch Request
    fetch(options.url, options)
      .then(response => {
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        return response.text();
      })
      .then(html => {
        // Replace current body content with server response 
        // to match the "Echo" behavior
        document.open();
        document.write(html);
        document.close();
      })
      .catch(err => {
        responseContainer.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
      });
  });
});