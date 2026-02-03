#include <iostream>
#include <string>
#include <vector>
#include <ctime>
#include <unistd.h>

using namespace std;

string get_env(const string& key) {
    char* val = getenv(key.c_str());
    return val ? string(val) : "N/A";
}

int main() {
    // Standard CGI Header
    cout << "Content-type: text/html\r\n\r\n";

    // Metadata
    string method     = get_env("REQUEST_METHOD");
    string user_agent = get_env("HTTP_USER_AGENT");
    string remote_ip  = get_env("REMOTE_ADDR");
    string encoding   = get_env("CONTENT_TYPE");
    
    char hostname[256];
    gethostname(hostname, 256);

    time_t now = time(0);
    string dt = ctime(&now);
    if (!dt.empty() && dt.back() == '\n') {
        dt.pop_back(); // Removes the trailing newline from ctime
    }

    string body = "";
    // POST and PUT typically send data via Standard Input (stdin)
    if (method == "POST" || method == "PUT") {
        string content_length = get_env("CONTENT_LENGTH");
        if (content_length != "N/A" && !content_length.empty()) {
            int len = stoi(content_length);
            for (int i = 0; i < len; ++i) {
                char c;
                if (cin.get(c)) body += c;
            }
        }
    } 
    
    // If body is still empty (common for GET and DELETE), check QUERY_STRING
    if (body.empty()) {
        string query = get_env("QUERY_STRING");
        if (query != "N/A") {
            body = query;
        }
    }

    // Output Response
    cout << "<html>\n";
    cout << "  <body>\n";
    cout << "    <h1>C++ Echo Endpoint</h1>\n";
    cout << "    <hr>\n";
    cout << "    <ul>\n";
    cout << "      <li><b>Method:</b> "   << method     << "</li>\n";
    cout << "      <li><b>Hostname:</b> " << hostname   << "</li>\n";
    cout << "      <li><b>IP:</b> "       << remote_ip   << "</li>\n";
    cout << "      <li><b>Time:</b> "     << dt          << "</li>\n";
    cout << "      <li><b>Agent:</b> "    << user_agent  << "</li>\n";
    cout << "      <li><b>Encoding:</b> " << encoding    << "</li>\n";
    cout << "    </ul>\n";
    cout << "    <h3>Payload:</h3>\n";
    cout << "    <pre>" << (body.empty() ? "[No Data]" : body) << "</pre>\n";
    cout << "  </body>\n";
    cout << "</html>" << endl;

    return 0;
}