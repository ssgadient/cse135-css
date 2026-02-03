#include <iostream>
#include <ctime>
#include <cstdlib>
#include <nlohmann/json.hpp> // The new JSON library

using namespace std;
using json = nlohmann::json;

int main() {
    // 1. Send the JSON Headers
    cout << "Cache-Control: no-cache\n";
    cout << "Content-type: application/json\n\n";

    // 2. Gather data
    time_t now = time(0);
    char* dt = ctime(&now);
    // Remove the newline character ctime adds automatically
    string date_str(dt);
    if (!date_str.empty()) date_str.pop_back();

    const char* remote_addr = getenv("REMOTE_ADDR");
    string ip = remote_addr ? remote_addr : "unknown";

    // 3. Create JSON object (similar to the Perl hash)
    json message = {
        {"title", "Hello, JSON! - Christian, Sophie and Stefan!"},
        {"heading", "Hello, C++!"},
        {"message", "This page was generated with the C++ programming language and by the Team CSS"},
        {"time", date_str},
        {"IP", ip}
    };

    // 4. Print the serialized JSON
    cout << message.dump() << endl;

    return 0;
}