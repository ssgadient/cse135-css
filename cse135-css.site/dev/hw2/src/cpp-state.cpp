#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <ctime>
#include <unistd.h>

using namespace std;

// Helper to get environment variables
string get_env(const string& key) {
    char* val = getenv(key.c_str());
    return val ? string(val) : "";
}

// Simple parser for URL-encoded data (e.g., username=John)
string get_param(const string& query, const string& key) {
    size_t pos = query.find(key + "=");
    if (pos == string::npos) return "";
    size_t start = pos + key.length() + 1;
    size_t end = query.find("&", start);
    return query.substr(start, end - start);
}

int main() {
    string method = get_env("REQUEST_METHOD");
    string query = (method == "POST") ? "" : get_env("QUERY_STRING");
    
    // Read POST body if applicable
    if (method == "POST") {
        string len_str = get_env("CONTENT_LENGTH");
        if (!len_str.empty()) {
            int len = stoi(len_str);
            for (int i = 0; i < len; ++i) { char c; cin.get(c); query += c; }
        }
    }

    // 1. Session ID Management via Cookies
    string cookie_str = get_env("HTTP_COOKIE");
    string sid = "";
    size_t sid_pos = cookie_str.find("CPP_SESSID=");
    if (sid_pos != string::npos) {
        sid = cookie_str.substr(sid_pos + 11, 10); // Simple 10-char ID
    } else {
        sid = to_string(time(0)); // Use timestamp as a simple SID
    }

    string session_file = "/tmp/sess_" + sid;

    // 2. Handle Actions
    string action = get_param(query, "action");
    
    if (action == "save") {
        string name = get_param(query, "username");
        ofstream ofs(session_file);
        ofs << name;
        ofs.close();
    } else if (action == "clear") {
        unlink(session_file.c_str()); // Delete server-side file
    }

    // 3. Output Headers & Cookie
    cout << "Set-Cookie: CPP_SESSID=" << sid << "; Path=/; HttpOnly\r\n";
    cout << "Content-type: text/html\r\n\r\n";

    // 4. Retrieve Current State
    string stored_name = "Guest";
    ifstream ifs(session_file);
    if (ifs.is_open()) {
        getline(ifs, stored_name);
        ifs.close();
    }

    // 5. HTML Output
    cout << "<html><head><title>C++ State Demo</title></head><body>\n";
    cout << "<h1>Server-Side State (C++)</h1><hr>\n";
    cout << "<p>Welcome, <b>" << (stored_name.empty() ? "Anonymous" : stored_name) << "</b>!</p>\n";
    cout << "<p>Session ID: <code>" << sid << "</code></p>\n";
    
    cout << "<nav>\n"
         << "  <a href='../cpp-state-form.html'>Change Name</a> | \n"
         << "  <a href='cpp-state.cgi'>Refresh This Page</a> | \n"
         << "  <a href='cpp-state.cgi?action=clear'>Clear Data (Destroy Session)</a>\n"
         << "</nav>\n";
    
    cout << "</body></html>" << endl;

    return 0;
}