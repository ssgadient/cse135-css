# --- PATHS ---
BASE_PATH = /var/www/cse135-css.site
DEV_DIR   = $(BASE_PATH)/dev/hw2
SRC_DIR   = $(DEV_DIR)/src
BIN_DIR   = $(DEV_DIR)/bin
PUB_CGI   = $(BASE_PATH)/public_html/hw2/cgi-bin

# --- AUTOMATIC FILE DETECTION ---
# Find all .cpp and .pl files in the src directory
CPP_SOURCES := $(wildcard $(SRC_DIR)/*.cpp)
PL_SOURCES  := $(wildcard $(SRC_DIR)/*.pl)

# Define the resulting filenames in the bin and public folders
# cpp-hello.cpp -> cpp-hello.cgi
CPP_BINARIES := $(patsubst $(SRC_DIR)/%.cpp, $(BIN_DIR)/%.cgi, $(CPP_SOURCES))
CPP_TARGETS  := $(patsubst $(SRC_DIR)/%.cpp, $(PUB_CGI)/%.cgi, $(CPP_SOURCES))

# perl-hello.pl -> perl-hello.pl (just the name for the symlink)
PL_TARGETS   := $(patsubst $(SRC_DIR)/%.pl, $(PUB_CGI)/%.pl, $(PL_SOURCES))

# --- RULES ---

all: setup compile deploy

setup:
	@mkdir -p $(BIN_DIR)
	@mkdir -p $(PUB_CGI)

# Rule to compile any .cpp file into a .cgi binary in the bin folder
$(BIN_DIR)/%.cgi: $(SRC_DIR)/%.cpp
	g++ -Wall -O2 $< -o $@

compile: $(CPP_BINARIES)

deploy:
	@echo "--- Deploying C++ Binaries ---"
	@for bin in $(CPP_BINARIES); do \
		NAME=$$(basename $$bin); \
		DEST=$(PUB_CGI)/$$NAME; \
		chmod 755 $$bin; \
		if [ -L "$$DEST" ] && [ "$$(readlink -f $$DEST)" != "$$(readlink -f $$bin)" ]; then \
			echo "SKIP: $$NAME is owned by another project"; \
		else \
			ln -sf $$bin $$DEST; \
			echo "Linked $$NAME -> $(PUB_CGI)"; \
		fi \
	done
	@echo "--- Deploying Perl Scripts ---"
	@for src in $(PL_SOURCES); do \
		NAME=$$(basename $$src); \
		DEST=$(PUB_CGI)/$$NAME; \
		chmod +x $$src; \
		if [ -L "$$DEST" ] && [ "$$(readlink -f $$DEST)" != "$$(readlink -f $$src)" ]; then \
			echo "SKIP: $$NAME is owned by another project"; \
		else \
			ln -sf $$src $$DEST; \
			echo "Linked $$NAME -> $(PUB_CGI)"; \
		fi \
	done

clean:
	@echo "Cleaning binaries and local symlinks..."
	@rm -f $(BIN_DIR)/*.cgi
	@for t in $(CPP_TARGETS) $(PL_TARGETS); do \
		if [ -L "$$t" ] && [[ "$$(readlink -f $$t)" == $(DEV_DIR)* ]]; then \
			rm -f $$t; \
		fi \
	done

.PHONY: all setup compile deploy clean