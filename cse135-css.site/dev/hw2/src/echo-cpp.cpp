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
    if (method == "DELETE") {
        body = "";
    }
    else if (method == "GET") {
        body = get_env("QUERY_STRING");
    }
    // POST and PUT typically send data via Standard Input (stdin)
    else if (method == "POST" || method == "PUT") {
        string content_length = get_env("CONTENT_LENGTH");
        if (content_length != "N/A" && !content_length.empty()) {
            int len = stoi(content_length);
            for (int i = 0; i < len; ++i) {
                char c;
                if (cin.get(c)) body += c;
            }
        }
    }

    // Output Response
    cout << "C++ Echo Endpoint\n";
    cout << "{\n";
    cout << "      Method:"   << method     << "\n";
    cout << "      Hostname:" << hostname   << "\n";
    cout << "      IP:"       << remote_ip   << "\n";
    cout << "      Time:"     << dt          << "\n";
    cout << "      Agent:"    << user_agent  << "\n";
    cout << "      Encoding:" << encoding    << "\n";
    cout << "      Payload:" << (body.empty() ? "[No Data]" : body) << "\n";
    cout << "}\n";

    return 0;
}