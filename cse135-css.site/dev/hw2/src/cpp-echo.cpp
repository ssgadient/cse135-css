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

    // Read the Body for POST and PUT
    string body = "";
    if (method == "POST" || method == "PUT") {
        string content_length = get_env("CONTENT_LENGTH");
        if (content_length != "N/A") {
            int len = stoi(content_length);
            for (int i = 0; i < len; ++i) {
                char c;
                if (cin.get(c)) body += c;
            }
        }
    } else {
        // For GET and DELETE, data is usually in the QUERY_STRING
        body = get_env("QUERY_STRING");
    }

    // Output Response
    cout << "<html><body>";
    cout << "<h1>C++ Echo Endpoint</h1><hr>";
    cout << "<ul>";
    cout << "<li><b>Method:</b> " << method << "</li>";
    cout << "<li><b>Hostname:</b> " << hostname << "</li>";
    cout << "<li><b>IP:</b> " << remote_ip << "</li>";
    cout << "<li><b>Time:</b> " << dt << "</li>";
    cout << "<li><b>Agent:</b> " << user_agent << "</li>";
    cout << "<li><b>Encoding:</b> " << encoding << "</li>";
    cout << "</ul>";
    cout << "<h3>Payload:</h3><pre>" << (body.empty() ? "[No Data]" : body) << "</pre>";
    cout << "</body></html>";

    return 0;
}