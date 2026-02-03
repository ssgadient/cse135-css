#include <iostream>
#include <vector>
#include <algorithm>
#include <string>

using namespace std;

// In C++, environment variables are accessed via the global 'environ' variable
extern char **environ;

int main() {
    // 1. Mandatory CGI Header
    // Must be followed by two newlines to separate headers from body
    cout << "Cache-Control: no-cache\r\n";
    cout << "Content-type: text/html\r\n\r\n";

    // 2. Start HTML (mimicking start_html)
    cout << "<!DOCTYPE html>\n<html>\n<head>\n"
              << "<title>Environment Variables</title>\n"
              << "</head>\n<body>\n";

    cout << "<h1 align='center'>Environment Variables</h1><hr />\n";

    // 3. Collect environment variables into a vector for sorting
    vector<string> env_list;
    for (char **env = environ; *env != nullptr; ++env) {
        env_list.push_back(*env);
    }

    // 4. Sort the variables (mimicking Perl's sort)
    sort(env_list.begin(), env_list.end());

    // 5. Print each variable
    for (const auto& var : env_list) {
        cout << var << "<br />\n";
    }

    // 6. End HTML (mimicking end_html)
    cout << "</body>\n</html>" << endl;
    
    return 0;
}