#include <iostream>
#include <ctime>
#include <cstdlib>

using namespace std;

int main() {
    // 1. Send the HTTP Headers
    // Note the double newline at the end of the headers
    cout << "Cache-Control: no-cache\n";
    cout << "Content-Type: text/html\n\n";

    // 2. Send the HTML Body
    cout << "<!DOCTYPE html>\n";
    cout << "<html>\n";
    cout << "<head>\n";
    cout << "<title>Hello CGI World</title>\n";
    cout << "</head>\n";
    cout << "<body>\n";

    cout << "<h1 align=\"center\">Hello HTML World</h1><hr/>\n";
    cout << "<p>Hello HTML World!</p>\n";
    cout << "<p>This page was generated with the C++ programming language and by the Team CSS</p>\n";

    // 3. Get the current time
    time_t now = time(0);
    char* dt = ctime(&now);
    cout << "<p>This program was generated at: " << dt << "</p>\n";

    // 4. Get the IP Address from environment variables
    const char* remote_addr = getenv("REMOTE_ADDR");
    if (remote_addr) {
        cout << "<p>Your current IP Address is: " << remote_addr << "</p>\n";
    } else {
        cout << "<p>IP Address not found.</p>\n";
    }

    cout << "</body>\n";
    cout << "</html>\n";

    return 0;
}