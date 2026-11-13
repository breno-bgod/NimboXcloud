// SPDX-License-Identifier: GPL-3.0-or-later
// No network transport or authentication is invoked in this executable.
#include "net/http.h"
#include "util/json.h"
#include <cstdio>
#include <cstdlib>
static void check(bool ok, const char* label) {
    if (!ok) { std::fprintf(stderr, "FAIL: %s\n", label); std::exit(1); }
}
int main() {
    xc::net::Url url;
    check(xc::net::Url::parse("https://example.invalid:8443/path?q=fixture", url), "parse URL offline");
    check(url.host == "example.invalid" && url.port == 8443 && url.path == "/path?q=fixture", "URL fields");
    check(!xc::net::Url::parse("not-a-url", url), "reject malformed URL");
    std::string decoded;
    check(xc::net::dechunk("4\r\ntest\r\n0\r\n\r\n", decoded) && decoded == "test", "decode chunked fixture");
    check(!xc::net::dechunk("4\r\nab", decoded), "reject truncated chunk");
    const auto json = xc::json::parse("{\"fixture\":true}");
    check(json.has_value() && (*json)["fixture"].isBool(), "JSON fixture");
    check(!xc::json::parse("{"), "reject malformed JSON");
    check(xc::net::initTls("/nonexistent/nimbo-offline-ca-fixture.pem"), "initialize trust from bundled public CA");
    check(xc::net::usingBuiltinCa(), "explicit builtin trust fallback");
    std::puts("PASS: original HTTP/JSON parsers and public CA initialization; no network, handshake or account");
}
