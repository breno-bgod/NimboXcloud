// Teste nativo de filesystem; não captura contas ou sessões.
#include "platform/platform.h"
#include <cerrno>
#include <cstdio>
#include <cstdlib>
#include <filesystem>
#include <string>

static void check(bool value, const char* message) {
    if (!value) { std::fprintf(stderr, "FAIL: %s\n", message); std::exit(1); }
}
int main() {
    using namespace xc::platform;
    ::unsetenv("XCLOUD_DATA_DIR");
    check(!init() && !dataDirWritable() && dataDirErrno() == EINVAL, "missing host directory must fail");
    ::setenv("XCLOUD_DATA_DIR", "relative/path", 1);
    check(!init() && dataDirErrno() == EINVAL, "relative directory must fail");
    char temp[] = "/tmp/nx-platform-test-XXXXXX";
    check(::mkdtemp(temp), "temporary directory");
    const std::string root(temp), valid = root + "/private/psbox";
    ::setenv("XCLOUD_DATA_DIR", valid.c_str(), 1);
    check(init() && dataDirWritable() && dataDirErrno() == 0, "create nested writable directory");
    check(dataDir() == valid, "use host directory, never upstream package path");
    check(std::filesystem::is_empty(valid), "probe leaves no file");
    check(writeFileAtomic(valid + "/fixture.txt", "synthetic fixture"), "atomic file write");
    std::string read;
    check(readFile(valid + "/fixture.txt", read) && read == "synthetic fixture", "read back fixture");
    const std::string invalid = valid + "/fixture.txt/nested";
    ::setenv("XCLOUD_DATA_DIR", invalid.c_str(), 1);
    check(!init() && !dataDirWritable() && dataDirErrno() == ENOTDIR, "regular file is not a directory");
    check(!dataDirNote().empty(), "safe diagnostic on failure");
    ::setenv("XCLOUD_DATA_DIR", "/proc/nx-platform-denied", 1);
    check(!init() && !dataDirWritable() && dataDirErrno() != 0, "unwritable filesystem fails");
    ::setenv("XCLOUD_DATA_DIR", "/proc", 1);
    check(!init() && !dataDirWritable() && dataDirErrno() != 0, "existing directory still needs write probe");
    ::setenv("XCLOUD_DATA_DIR", valid.c_str(), 1);
    check(init() && dataDirWritable() && dataDirErrno() == 0 && dataDirNote().empty(), "reinitialization clears failure");
    shutdown();
    check(!dataDirWritable(), "shutdown clears readiness");
    std::filesystem::remove_all(root);
    std::puts("PASS: native storage lifecycle, real filesystem; no Android runtime");
}
