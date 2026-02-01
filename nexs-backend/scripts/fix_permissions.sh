#!/bin/bash

# This script configures sudo privileges required for the NexCRM Provisioner
# It allows the 'admin' user to run specific commands (pm2, cloudflared, systemctl) without a password.

# DETECT USER
CURRENT_USER=$(whoami)
echo "Detected user: $CURRENT_USER"

# Create the config content
CONFIG="$CURRENT_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl, /usr/bin/mv, /usr/bin/rm, /usr/bin/cp, /usr/bin/echo, /usr/bin/cat, /usr/bin/tee, /usr/local/bin/pm2, /usr/bin/pm2, /usr/bin/cloudflared"

# Write to a separate file in /etc/sudoers.d/ (cleaner than editing /etc/sudoers)
echo "$CONFIG" | sudo tee /etc/sudoers.d/nexspire-admin > /dev/null

# Set correct permissions (sudoers files must be 0440)
sudo chmod 0440 /etc/sudoers.d/nexspire-admin

echo "Configuration applied to /etc/sudoers.d/nexspire-admin"
echo ""
echo "Verifying..."
if sudo -l -U $CURRENT_USER | grep -q "NOPASSWD"; then
    echo "✅ Success! $CURRENT_USER can now run these commands without a password."
else
    echo "❌ Something went wrong. Please check 'sudo visudo'."
fi
