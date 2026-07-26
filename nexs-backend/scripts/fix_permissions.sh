#!/bin/sh

# Configure the narrow passwordless sudo surface used by the NexCRM provisioner.
# Works on systemd distributions and Alpine/OpenRC by resolving installed paths.

set -eu

CURRENT_USER=$(id -un)
SUDOERS_FILE="/etc/sudoers.d/napnix-provisioner"
ALLOWED_COMMANDS=""

add_command() {
    command_path=$(command -v "$1" 2>/dev/null || true)
    if [ -n "$command_path" ]; then
        if [ -n "$ALLOWED_COMMANDS" ]; then
            ALLOWED_COMMANDS="$ALLOWED_COMMANDS, "
        fi
        ALLOWED_COMMANDS="${ALLOWED_COMMANDS}${command_path}"
    fi
}

for command_name in test cat cp mv rm tee pm2 cloudflared rc-service systemctl; do
    add_command "$command_name"
done

if [ -z "$ALLOWED_COMMANDS" ]; then
    echo "No provisioner commands were found in PATH." >&2
    exit 1
fi

echo "Detected user: $CURRENT_USER"
echo "$CURRENT_USER ALL=(root) NOPASSWD: $ALLOWED_COMMANDS" \
    | sudo tee "$SUDOERS_FILE" >/dev/null
sudo chmod 0440 "$SUDOERS_FILE"
sudo visudo -cf "$SUDOERS_FILE"

echo "Provisioner sudo policy installed at $SUDOERS_FILE"
