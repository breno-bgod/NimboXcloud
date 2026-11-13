// SPDX-License-Identifier: GPL-3.0-or-later
// Nimbo adaptation API, not an upstream PSBox or cloud-service API.
#pragma once
#include <string>
namespace xc::platform {
// Call only before init, under the host lifecycle lock. No process-wide setenv.
bool configureAndroidDataDir(const std::string& path);
}
