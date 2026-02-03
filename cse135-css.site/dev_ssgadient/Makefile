# --- PATHS ---
# '.' refers to /var/www/cse135-css.site/dev_ssgadient/
SRC_DIR  = hw2/src
BIN_DIR  = hw2/bin

# Use the absolute path for the shared public area
PUB_CGI  = /var/www/cse135-css.site/public_html/hw2/cgi-bin

# --- COMPILER SETTINGS ---
CXX      = g++
CXXFLAGS = -Wall -O2
TARGET   = hello-html-cpp.cgi

# --- RULES ---

all: setup compile deploy

setup:
	@mkdir -p $(BIN_DIR)

compile: $(SRC_DIR)/hello-html-cpp.cpp
	$(CXX) $(CXXFLAGS) $(SRC_DIR)/hello-html-cpp.cpp -o $(BIN_DIR)/$(TARGET)

deploy:
	# 1. Set permissions on the binary in your private bin
	chmod 755 $(BIN_DIR)/$(TARGET)
	# 2. Force create the symlink in the shared cgi-bin
	ln -sf $(realpath $(BIN_DIR)/$(TARGET)) $(PUB_CGI)/$(TARGET)

clean:
	rm -rf $(BIN_DIR)/$(TARGET)
	rm -f $(PUB_CGI)/$(TARGET)

.PHONY: all setup compile deploy clean