# --- PATHS ---
SRC_DIR  = hw2/src
BIN_DIR  = hw2/bin
PUB_CGI  = /var/www/cse135-css.site/public_html/hw2/cgi-bin

# --- COMPILER SETTINGS ---
CXX      = g++
CXXFLAGS = -Wall -O2
# If the JSON library is in a non-standard path, you might need -I/path/to/json

# --- TARGETS ---
# List all your CGI binaries here
TARGETS  = hello-html-cpp.cgi hello-json-cpp.cgi

all: setup $(TARGETS) deploy

setup:
	@mkdir -p $(BIN_DIR)

# Pattern rule: compiles any .cpp in src to a .cgi in bin
%.cgi: $(SRC_DIR)/%.cpp
	$(CXX) $(CXXFLAGS) $< -o $(BIN_DIR)/$@

deploy:
	@echo "Deploying to $(PUB_CGI)..."
	@for target in $(TARGETS); do \
		chmod 755 $(BIN_DIR)/$$target; \
		ln -sf $(realpath $(BIN_DIR)/$$target) $(PUB_CGI)/$$target; \
		echo "Linked $$target"; \
	done

clean:
	@for target in $(TARGETS); do \
		rm -f $(BIN_DIR)/$$target; \
		rm -f $(PUB_CGI)/$$target; \
	done

.PHONY: all setup deploy clean